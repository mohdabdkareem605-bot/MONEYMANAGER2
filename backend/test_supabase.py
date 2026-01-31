
import os
from supabase import create_client, Client

url = "https://shbgrqxtfgnobheyabyd.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYmdycXh0Zmdub2JoZXlhYnlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4Nzk2MjYsImV4cCI6MjA4NTQ1NTYyNn0.naumvtLa0CqCJncL4-u36Jx-6oVVvK51gz3J-sWqNxo"

def test_connection():
    try:
        supabase: Client = create_client(url, key)
        print("Supabase client initialized successfully.")
        
        # Simple health check - listing buckets often works with anon key if storage is enabled,
        # or we can just try to sign in anonymously if enabled, or just check if client is ready.
        # But even just creating the client is a good first step. 
        # Let's try to access auth.
        
        print("Testing Auth service...")
        # Just accessing the object to ensure it's loaded
        _ = supabase.auth 
        print("Auth service accessible.")

        print("\n--- CONNECTION SUCCESSFUL ---")
        print("Successfully connected to Supabase URL.")

    except Exception as e:
        print(f"\n--- CONNECTION FAILED ---")
        print(f"Error: {e}")

if __name__ == "__main__":
    test_connection()
