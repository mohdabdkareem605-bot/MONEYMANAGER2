from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
from decimal import Decimal
from supabase import create_client, Client

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Supabase connection
supabase_url = os.environ.get('SUPABASE_URL')
supabase_key = os.environ.get('SUPABASE_KEY')

if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment")

supabase: Client = create_client(supabase_url, supabase_key)

# Create the main app
app = FastAPI(title="SplitWise Clone API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== PYDANTIC MODELS ==============

# Auth Models
class PhoneAuthRequest(BaseModel):
    phone_number: str

class VerifyOTPRequest(BaseModel):
    phone_number: str
    otp: str

class UserProfile(BaseModel):
    id: str
    phone_number: str
    name: Optional[str] = None
    created_at: Optional[str] = None

class UpdateProfileRequest(BaseModel):
    name: str

# Account Models
class AccountGroupCreate(BaseModel):
    name: str
    icon: Optional[str] = None

class AccountGroup(BaseModel):
    id: str
    user_id: str
    name: str
    icon: Optional[str] = None

class AccountCreate(BaseModel):
    name: str
    group_id: Optional[str] = None
    currency_code: str = "USD"
    current_balance: float = 0.0

class Account(BaseModel):
    id: str
    user_id: str
    group_id: Optional[str] = None
    name: str
    currency_code: str
    current_balance: float

# Contact Models
class ContactCreate(BaseModel):
    name: str
    phone_number: Optional[str] = None

class Contact(BaseModel):
    id: str
    owner_id: str
    name: str
    phone_number: Optional[str] = None
    linked_profile_id: Optional[str] = None

# Transaction Models
class SplitCreate(BaseModel):
    contact_id: str
    amount: float  # Positive = They owe me, Negative = I owe them
    category_id: Optional[str] = None

class TransactionCreate(BaseModel):
    account_id: Optional[str] = None  # Null if friend paid
    payer_contact_id: Optional[str] = None  # Link to friend if they paid
    total_amount: float
    currency_code: str = "USD"
    exchange_rate: float = 1.0
    description: Optional[str] = None
    splits: List[SplitCreate] = []

class Split(BaseModel):
    id: str
    transaction_id: str
    contact_id: str
    contact_name: Optional[str] = None
    amount: float
    split_type: str = "DEBT"
    category_id: Optional[str] = None

class Transaction(BaseModel):
    id: str
    created_by: str
    account_id: Optional[str] = None
    account_name: Optional[str] = None
    payer_contact_id: Optional[str] = None
    payer_name: Optional[str] = None
    total_amount: float
    currency_code: str
    exchange_rate: float
    description: Optional[str] = None
    occurred_at: str
    splits: List[Split] = []

# Settlement Models
class SettlementCreate(BaseModel):
    contact_id: str
    amount: float
    account_id: str  # Where the money goes
    currency_code: str = "USD"
    exchange_rate: float = 1.0

# Balance Summary
class ContactBalance(BaseModel):
    contact_id: str
    contact_name: str
    phone_number: Optional[str] = None
    net_balance: float  # Positive = they owe me, Negative = I owe them
    currency_code: str = "USD"

# ============== HELPER FUNCTIONS ==============

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[dict]:
    """Extract user from JWT token"""
    if not credentials:
        return None
    
    try:
        token = credentials.credentials
        # Verify with Supabase
        user_response = supabase.auth.get_user(token)
        if user_response and user_response.user:
            return {
                "id": user_response.user.id,
                "phone": user_response.user.phone
            }
    except Exception as e:
        logger.error(f"Auth error: {e}")
    return None

def require_auth(user: Optional[dict] = Depends(get_current_user)) -> dict:
    """Require authenticated user"""
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user

# ============== DATABASE SETUP ==============

@api_router.post("/setup-database")
async def setup_database():
    """Create all required tables in Supabase"""
    try:
        # We'll use Supabase's REST API to execute raw SQL
        # First, let's create tables using the Supabase client
        
        sql_statements = [
            # Enable UUID extension
            """
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
            """,
            
            # User profiles table (extends auth.users)
            """
            CREATE TABLE IF NOT EXISTS user_profiles (
                id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
                phone_number TEXT UNIQUE,
                name TEXT,
                base_currency TEXT DEFAULT 'USD',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            """,
            
            # Account groups table
            """
            CREATE TABLE IF NOT EXISTS account_groups (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
                name TEXT NOT NULL,
                icon TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            """,
            
            # Accounts table
            """
            CREATE TABLE IF NOT EXISTS accounts (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
                group_id UUID REFERENCES account_groups(id) ON DELETE SET NULL,
                name TEXT NOT NULL,
                currency_code TEXT DEFAULT 'USD',
                current_balance NUMERIC(12,2) DEFAULT 0.00,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            """,
            
            # Contacts table (Shadow Contacts)
            """
            CREATE TABLE IF NOT EXISTS contacts (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
                name TEXT NOT NULL,
                phone_number TEXT,
                linked_profile_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            """,
            
            # Transactions table
            """
            CREATE TABLE IF NOT EXISTS transactions (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
                account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
                payer_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
                total_amount NUMERIC(12,2) NOT NULL,
                currency_code TEXT NOT NULL DEFAULT 'USD',
                exchange_rate NUMERIC(12,6) DEFAULT 1.0,
                description TEXT,
                occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                archived BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            """,
            
            # Splits table
            """
            CREATE TABLE IF NOT EXISTS splits (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE NOT NULL,
                contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
                category_id UUID,
                amount NUMERIC(12,2) NOT NULL,
                split_type TEXT CHECK (split_type IN ('DEBT', 'PAYMENT')) DEFAULT 'DEBT',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            """,
            
            # Settlement allocations table
            """
            CREATE TABLE IF NOT EXISTS settlement_allocations (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                payment_split_id UUID REFERENCES splits(id) ON DELETE CASCADE NOT NULL,
                debt_split_id UUID REFERENCES splits(id) ON DELETE CASCADE NOT NULL,
                allocated_amount NUMERIC(12,2) NOT NULL CHECK (allocated_amount > 0),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(payment_split_id, debt_split_id)
            );
            """,
            
            # Categories table
            """
            CREATE TABLE IF NOT EXISTS categories (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                icon TEXT,
                color TEXT,
                is_system BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            """,
            
            # Enable RLS
            """
            ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
            ALTER TABLE account_groups ENABLE ROW LEVEL SECURITY;
            ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
            ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
            ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
            ALTER TABLE splits ENABLE ROW LEVEL SECURITY;
            ALTER TABLE settlement_allocations ENABLE ROW LEVEL SECURITY;
            ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
            """,
            
            # RLS Policies for user_profiles
            """
            DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
            CREATE POLICY "Users can view own profile" ON user_profiles
                FOR SELECT USING (auth.uid() = id);
            """,
            """
            DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
            CREATE POLICY "Users can update own profile" ON user_profiles
                FOR UPDATE USING (auth.uid() = id);
            """,
            """
            DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
            CREATE POLICY "Users can insert own profile" ON user_profiles
                FOR INSERT WITH CHECK (auth.uid() = id);
            """,
            
            # RLS Policies for accounts
            """
            DROP POLICY IF EXISTS "Users can manage own accounts" ON accounts;
            CREATE POLICY "Users can manage own accounts" ON accounts
                FOR ALL USING (auth.uid() = user_id);
            """,
            
            # RLS Policies for account_groups
            """
            DROP POLICY IF EXISTS "Users can manage own account groups" ON account_groups;
            CREATE POLICY "Users can manage own account groups" ON account_groups
                FOR ALL USING (auth.uid() = user_id);
            """,
            
            # RLS Policies for contacts
            """
            DROP POLICY IF EXISTS "Users can manage own contacts" ON contacts;
            CREATE POLICY "Users can manage own contacts" ON contacts
                FOR ALL USING (auth.uid() = owner_id);
            """,
            
            # RLS Policies for transactions
            """
            DROP POLICY IF EXISTS "Users can manage own transactions" ON transactions;
            CREATE POLICY "Users can manage own transactions" ON transactions
                FOR ALL USING (auth.uid() = created_by);
            """,
            
            # RLS Policies for splits
            """
            DROP POLICY IF EXISTS "Users can view splits of own transactions" ON splits;
            CREATE POLICY "Users can view splits of own transactions" ON splits
                FOR ALL USING (
                    EXISTS (
                        SELECT 1 FROM transactions 
                        WHERE transactions.id = splits.transaction_id 
                        AND transactions.created_by = auth.uid()
                    )
                );
            """,
            
            # RLS Policies for categories
            """
            DROP POLICY IF EXISTS "Users can manage own categories" ON categories;
            CREATE POLICY "Users can manage own categories" ON categories
                FOR ALL USING (auth.uid() = user_id OR is_system = true);
            """,
            
            # Insert default categories
            """
            INSERT INTO categories (name, icon, color, is_system) VALUES
                ('Food & Dining', 'utensils', '#FF6B6B', true),
                ('Transport', 'car', '#4ECDC4', true),
                ('Shopping', 'shopping-bag', '#45B7D1', true),
                ('Home', 'home', '#96CEB4', true),
                ('Social', 'coffee', '#FFEAA7', true),
                ('Travel', 'plane', '#DDA0DD', true),
                ('Tech', 'smartphone', '#98D8C8', true),
                ('Other', 'circle', '#95A5A6', true)
            ON CONFLICT DO NOTHING;
            """
        ]
        
        results = []
        for sql in sql_statements:
            try:
                # Execute SQL using Supabase's rpc or postgrest
                result = supabase.rpc('exec_sql', {'sql': sql.strip()}).execute()
                results.append({"sql": sql[:50] + "...", "status": "success"})
            except Exception as e:
                # Try alternative method
                results.append({"sql": sql[:50] + "...", "status": str(e)})
        
        return {
            "message": "Database setup attempted",
            "note": "Please run the SQL manually in Supabase SQL Editor if automatic setup failed",
            "results": results
        }
        
    except Exception as e:
        logger.error(f"Database setup error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/setup-sql")
async def get_setup_sql():
    """Return the SQL to run manually in Supabase SQL Editor"""
    sql = """
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number TEXT UNIQUE,
    name TEXT,
    base_currency TEXT DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Account groups table
CREATE TABLE IF NOT EXISTS account_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    group_id UUID REFERENCES account_groups(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    currency_code TEXT DEFAULT 'USD',
    current_balance NUMERIC(12,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contacts table (Shadow Contacts)
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    phone_number TEXT,
    linked_profile_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    payer_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    total_amount NUMERIC(12,2) NOT NULL,
    currency_code TEXT NOT NULL DEFAULT 'USD',
    exchange_rate NUMERIC(12,6) DEFAULT 1.0,
    description TEXT,
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Splits table
CREATE TABLE IF NOT EXISTS splits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE NOT NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
    category_id UUID,
    amount NUMERIC(12,2) NOT NULL,
    split_type TEXT CHECK (split_type IN ('DEBT', 'PAYMENT')) DEFAULT 'DEBT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settlement allocations table
CREATE TABLE IF NOT EXISTS settlement_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_split_id UUID REFERENCES splits(id) ON DELETE CASCADE NOT NULL,
    debt_split_id UUID REFERENCES splits(id) ON DELETE CASCADE NOT NULL,
    allocated_amount NUMERIC(12,2) NOT NULL CHECK (allocated_amount > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(payment_split_id, debt_split_id)
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for accounts
CREATE POLICY "Users can manage own accounts" ON accounts
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for account_groups
CREATE POLICY "Users can manage own account groups" ON account_groups
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for contacts
CREATE POLICY "Users can manage own contacts" ON contacts
    FOR ALL USING (auth.uid() = owner_id);

-- RLS Policies for transactions
CREATE POLICY "Users can manage own transactions" ON transactions
    FOR ALL USING (auth.uid() = created_by);

-- RLS Policies for splits
CREATE POLICY "Users can view splits of own transactions" ON splits
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM transactions 
            WHERE transactions.id = splits.transaction_id 
            AND transactions.created_by = auth.uid()
        )
    );

-- RLS Policies for categories
CREATE POLICY "Users can manage own categories" ON categories
    FOR ALL USING (auth.uid() = user_id OR is_system = true);

-- Insert default categories
INSERT INTO categories (name, icon, color, is_system) VALUES
    ('Food & Dining', 'utensils', '#FF6B6B', true),
    ('Transport', 'car', '#4ECDC4', true),
    ('Shopping', 'shopping-bag', '#45B7D1', true),
    ('Home', 'home', '#96CEB4', true),
    ('Social', 'coffee', '#FFEAA7', true),
    ('Travel', 'plane', '#DDA0DD', true),
    ('Tech', 'smartphone', '#98D8C8', true),
    ('Other', 'circle', '#95A5A6', true)
ON CONFLICT DO NOTHING;
"""
    return {"sql": sql, "instruction": "Copy this SQL and run it in Supabase SQL Editor"}

# ============== AUTH ENDPOINTS ==============

@api_router.post("/auth/send-otp")
async def send_otp(request: PhoneAuthRequest):
    """Send OTP to phone number for authentication"""
    try:
        # Supabase phone auth
        response = supabase.auth.sign_in_with_otp({
            "phone": request.phone_number
        })
        return {"message": "OTP sent successfully", "phone": request.phone_number}
    except Exception as e:
        logger.error(f"Send OTP error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/auth/verify-otp")
async def verify_otp(request: VerifyOTPRequest):
    """Verify OTP and return session"""
    try:
        response = supabase.auth.verify_otp({
            "phone": request.phone_number,
            "token": request.otp,
            "type": "sms"
        })
        
        if response.user:
            # Check for shadow profiles and link them
            await link_shadow_profiles(response.user.id, request.phone_number)
            
            # Create/update user profile
            try:
                supabase.table('user_profiles').upsert({
                    'id': response.user.id,
                    'phone_number': request.phone_number
                }).execute()
            except Exception as e:
                logger.warning(f"Profile upsert warning: {e}")
            
            return {
                "user": {
                    "id": response.user.id,
                    "phone": response.user.phone
                },
                "session": {
                    "access_token": response.session.access_token,
                    "refresh_token": response.session.refresh_token,
                    "expires_at": response.session.expires_at
                }
            }
        
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    except Exception as e:
        logger.error(f"Verify OTP error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

async def link_shadow_profiles(user_id: str, phone_number: str):
    """Link shadow contacts to the new real user"""
    try:
        # Find all contacts with this phone number
        result = supabase.table('contacts').update({
            'linked_profile_id': user_id
        }).eq('phone_number', phone_number).is_('linked_profile_id', 'null').execute()
        
        if result.data:
            logger.info(f"Linked {len(result.data)} shadow profiles to user {user_id}")
    except Exception as e:
        logger.error(f"Link shadow profiles error: {e}")

@api_router.get("/auth/me")
async def get_current_user_profile(user: dict = Depends(require_auth)):
    """Get current user profile"""
    try:
        result = supabase.table('user_profiles').select('*').eq('id', user['id']).single().execute()
        return result.data
    except Exception as e:
        # Return basic info if profile doesn't exist
        return {"id": user['id'], "phone_number": user.get('phone')}

@api_router.put("/auth/profile")
async def update_profile(request: UpdateProfileRequest, user: dict = Depends(require_auth)):
    """Update user profile"""
    try:
        result = supabase.table('user_profiles').update({
            'name': request.name,
            'updated_at': datetime.utcnow().isoformat()
        }).eq('id', user['id']).execute()
        return result.data[0] if result.data else {"message": "Profile updated"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============== ACCOUNTS ENDPOINTS ==============

@api_router.get("/accounts", response_model=List[Account])
async def get_accounts(user: dict = Depends(require_auth)):
    """Get all accounts for current user"""
    try:
        result = supabase.table('accounts').select('*').eq('user_id', user['id']).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/accounts", response_model=Account)
async def create_account(request: AccountCreate, user: dict = Depends(require_auth)):
    """Create a new account"""
    try:
        data = {
            'user_id': user['id'],
            'name': request.name,
            'group_id': request.group_id,
            'currency_code': request.currency_code,
            'current_balance': request.current_balance
        }
        result = supabase.table('accounts').insert(data).execute()
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.put("/accounts/{account_id}")
async def update_account(account_id: str, request: AccountCreate, user: dict = Depends(require_auth)):
    """Update an account"""
    try:
        result = supabase.table('accounts').update({
            'name': request.name,
            'group_id': request.group_id,
            'currency_code': request.currency_code,
            'current_balance': request.current_balance
        }).eq('id', account_id).eq('user_id', user['id']).execute()
        return result.data[0] if result.data else {"message": "Account updated"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.delete("/accounts/{account_id}")
async def delete_account(account_id: str, user: dict = Depends(require_auth)):
    """Delete an account"""
    try:
        supabase.table('accounts').delete().eq('id', account_id).eq('user_id', user['id']).execute()
        return {"message": "Account deleted"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============== CONTACTS ENDPOINTS ==============

@api_router.get("/contacts", response_model=List[Contact])
async def get_contacts(user: dict = Depends(require_auth)):
    """Get all contacts (friends) for current user"""
    try:
        result = supabase.table('contacts').select('*').eq('owner_id', user['id']).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/contacts", response_model=Contact)
async def create_contact(request: ContactCreate, user: dict = Depends(require_auth)):
    """Create a new contact (shadow contact)"""
    try:
        data = {
            'owner_id': user['id'],
            'name': request.name,
            'phone_number': request.phone_number
        }
        
        # Check if phone number is linked to a real user
        if request.phone_number:
            profile_result = supabase.table('user_profiles').select('id').eq('phone_number', request.phone_number).execute()
            if profile_result.data:
                data['linked_profile_id'] = profile_result.data[0]['id']
        
        result = supabase.table('contacts').insert(data).execute()
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.put("/contacts/{contact_id}")
async def update_contact(contact_id: str, request: ContactCreate, user: dict = Depends(require_auth)):
    """Update a contact"""
    try:
        result = supabase.table('contacts').update({
            'name': request.name,
            'phone_number': request.phone_number
        }).eq('id', contact_id).eq('owner_id', user['id']).execute()
        return result.data[0] if result.data else {"message": "Contact updated"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.delete("/contacts/{contact_id}")
async def delete_contact(contact_id: str, user: dict = Depends(require_auth)):
    """Delete a contact"""
    try:
        supabase.table('contacts').delete().eq('id', contact_id).eq('owner_id', user['id']).execute()
        return {"message": "Contact deleted"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/contacts/{contact_id}/balance")
async def get_contact_balance(contact_id: str, user: dict = Depends(require_auth)):
    """Get balance with a specific contact"""
    try:
        # Get all splits with this contact
        result = supabase.table('splits').select(
            '*, transactions!inner(created_by, currency_code)'
        ).eq('contact_id', contact_id).eq('transactions.created_by', user['id']).execute()
        
        total_balance = 0.0
        for split in result.data:
            total_balance += float(split['amount'])
        
        # Get contact info
        contact = supabase.table('contacts').select('*').eq('id', contact_id).single().execute()
        
        return {
            "contact_id": contact_id,
            "contact_name": contact.data['name'] if contact.data else "Unknown",
            "net_balance": total_balance,
            "currency_code": "USD"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/contacts/balances")
async def get_all_balances(user: dict = Depends(require_auth)):
    """Get balances with all contacts"""
    try:
        # Get all contacts
        contacts_result = supabase.table('contacts').select('*').eq('owner_id', user['id']).execute()
        
        balances = []
        for contact in contacts_result.data:
            # Get splits for this contact
            splits_result = supabase.table('splits').select(
                '*, transactions!inner(created_by)'
            ).eq('contact_id', contact['id']).eq('transactions.created_by', user['id']).execute()
            
            total = sum(float(s['amount']) for s in splits_result.data)
            
            balances.append({
                "contact_id": contact['id'],
                "contact_name": contact['name'],
                "phone_number": contact.get('phone_number'),
                "net_balance": total,
                "currency_code": "USD"
            })
        
        return balances
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============== TRANSACTIONS ENDPOINTS ==============

@api_router.get("/transactions")
async def get_transactions(user: dict = Depends(require_auth), limit: int = 50):
    """Get all transactions for current user"""
    try:
        result = supabase.table('transactions').select(
            '*, accounts(name), contacts(name)'
        ).eq('created_by', user['id']).eq('archived', False).order('occurred_at', desc=True).limit(limit).execute()
        
        transactions = []
        for t in result.data:
            # Get splits for this transaction
            splits_result = supabase.table('splits').select(
                '*, contacts(name)'
            ).eq('transaction_id', t['id']).execute()
            
            splits = [{
                'id': s['id'],
                'transaction_id': s['transaction_id'],
                'contact_id': s['contact_id'],
                'contact_name': s['contacts']['name'] if s.get('contacts') else None,
                'amount': float(s['amount']),
                'split_type': s['split_type'],
                'category_id': s.get('category_id')
            } for s in splits_result.data]
            
            transactions.append({
                'id': t['id'],
                'created_by': t['created_by'],
                'account_id': t.get('account_id'),
                'account_name': t['accounts']['name'] if t.get('accounts') else None,
                'payer_contact_id': t.get('payer_contact_id'),
                'payer_name': t['contacts']['name'] if t.get('contacts') else None,
                'total_amount': float(t['total_amount']),
                'currency_code': t['currency_code'],
                'exchange_rate': float(t['exchange_rate']),
                'description': t.get('description'),
                'occurred_at': t['occurred_at'],
                'splits': splits
            })
        
        return transactions
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/transactions")
async def create_transaction(request: TransactionCreate, user: dict = Depends(require_auth)):
    """Create a new transaction with splits"""
    try:
        # Create transaction
        transaction_data = {
            'created_by': user['id'],
            'account_id': request.account_id,
            'payer_contact_id': request.payer_contact_id,
            'total_amount': request.total_amount,
            'currency_code': request.currency_code,
            'exchange_rate': request.exchange_rate,
            'description': request.description
        }
        
        tx_result = supabase.table('transactions').insert(transaction_data).execute()
        transaction_id = tx_result.data[0]['id']
        
        # Create splits
        splits_created = []
        for split in request.splits:
            split_data = {
                'transaction_id': transaction_id,
                'contact_id': split.contact_id,
                'amount': split.amount,
                'category_id': split.category_id,
                'split_type': 'DEBT'
            }
            split_result = supabase.table('splits').insert(split_data).execute()
            splits_created.append(split_result.data[0])
        
        # Update account balance if account was used
        if request.account_id:
            account = supabase.table('accounts').select('current_balance').eq('id', request.account_id).single().execute()
            new_balance = float(account.data['current_balance']) - request.total_amount
            supabase.table('accounts').update({'current_balance': new_balance}).eq('id', request.account_id).execute()
        
        return {
            **tx_result.data[0],
            'splits': splits_created
        }
    except Exception as e:
        logger.error(f"Create transaction error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.delete("/transactions/{transaction_id}")
async def archive_transaction(transaction_id: str, user: dict = Depends(require_auth)):
    """Archive a transaction (soft delete)"""
    try:
        supabase.table('transactions').update({
            'archived': True
        }).eq('id', transaction_id).eq('created_by', user['id']).execute()
        return {"message": "Transaction archived"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============== SETTLEMENTS ENDPOINTS ==============

@api_router.post("/settlements")
async def create_settlement(request: SettlementCreate, user: dict = Depends(require_auth)):
    """Create a settlement (payment to settle debts)"""
    try:
        # Create a PAYMENT transaction
        transaction_data = {
            'created_by': user['id'],
            'account_id': request.account_id,
            'total_amount': request.amount,
            'currency_code': request.currency_code,
            'exchange_rate': request.exchange_rate,
            'description': f'Settlement payment'
        }
        
        tx_result = supabase.table('transactions').insert(transaction_data).execute()
        transaction_id = tx_result.data[0]['id']
        
        # Create the payment split
        payment_split_data = {
            'transaction_id': transaction_id,
            'contact_id': request.contact_id,
            'amount': -request.amount,  # Negative because we're receiving money
            'split_type': 'PAYMENT'
        }
        payment_split = supabase.table('splits').insert(payment_split_data).execute()
        payment_split_id = payment_split.data[0]['id']
        
        # FIFO Auto-allocation: Find oldest unpaid debts
        debts = supabase.table('splits').select(
            '*, transactions!inner(occurred_at, created_by)'
        ).eq('contact_id', request.contact_id).eq('split_type', 'DEBT').gt('amount', 0).eq(
            'transactions.created_by', user['id']
        ).order('transactions.occurred_at').execute()
        
        remaining_amount = request.amount
        allocations = []
        
        for debt in debts.data:
            if remaining_amount <= 0:
                break
                
            # Check existing allocations
            existing = supabase.table('settlement_allocations').select(
                'allocated_amount'
            ).eq('debt_split_id', debt['id']).execute()
            
            already_allocated = sum(float(a['allocated_amount']) for a in existing.data)
            debt_remaining = float(debt['amount']) - already_allocated
            
            if debt_remaining <= 0:
                continue
            
            allocation_amount = min(remaining_amount, debt_remaining)
            
            # Create allocation
            allocation = supabase.table('settlement_allocations').insert({
                'payment_split_id': payment_split_id,
                'debt_split_id': debt['id'],
                'allocated_amount': allocation_amount
            }).execute()
            
            allocations.append(allocation.data[0])
            remaining_amount -= allocation_amount
        
        # Update account balance
        account = supabase.table('accounts').select('current_balance').eq('id', request.account_id).single().execute()
        new_balance = float(account.data['current_balance']) + request.amount
        supabase.table('accounts').update({'current_balance': new_balance}).eq('id', request.account_id).execute()
        
        return {
            "transaction": tx_result.data[0],
            "payment_split": payment_split.data[0],
            "allocations": allocations,
            "unallocated_amount": remaining_amount
        }
    except Exception as e:
        logger.error(f"Settlement error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# ============== CATEGORIES ENDPOINTS ==============

@api_router.get("/categories")
async def get_categories(user: dict = Depends(require_auth)):
    """Get all categories (system + user's custom)"""
    try:
        result = supabase.table('categories').select('*').or_(
            f"user_id.eq.{user['id']},is_system.eq.true"
        ).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============== DASHBOARD ENDPOINTS ==============

@api_router.get("/dashboard/summary")
async def get_dashboard_summary(user: dict = Depends(require_auth)):
    """Get dashboard summary data"""
    try:
        # Get total balance across all accounts
        accounts = supabase.table('accounts').select('current_balance, currency_code').eq('user_id', user['id']).execute()
        total_balance = sum(float(a['current_balance']) for a in accounts.data)
        
        # Get total owed to user
        owed_splits = supabase.table('splits').select(
            'amount, transactions!inner(created_by)'
        ).gt('amount', 0).eq('split_type', 'DEBT').eq('transactions.created_by', user['id']).execute()
        total_owed = sum(float(s['amount']) for s in owed_splits.data)
        
        # Get total user owes
        owing_splits = supabase.table('splits').select(
            'amount, transactions!inner(created_by)'
        ).lt('amount', 0).eq('split_type', 'DEBT').eq('transactions.created_by', user['id']).execute()
        total_owing = abs(sum(float(s['amount']) for s in owing_splits.data))
        
        # Recent transactions
        recent = supabase.table('transactions').select('*').eq('created_by', user['id']).eq(
            'archived', False
        ).order('occurred_at', desc=True).limit(5).execute()
        
        return {
            "total_balance": total_balance,
            "total_owed_to_you": total_owed,
            "total_you_owe": total_owing,
            "net_balance": total_owed - total_owing,
            "recent_transactions": recent.data
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============== HEALTH CHECK ==============

@api_router.get("/")
async def root():
    return {"message": "SplitWise Clone API", "status": "running"}

@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test Supabase connection
        result = supabase.table('categories').select('id').limit(1).execute()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": str(e)}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
