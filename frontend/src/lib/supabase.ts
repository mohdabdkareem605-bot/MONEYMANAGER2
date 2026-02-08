import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClientOptions } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if we're in a browser/SSR environment without window
const isSSR = typeof window === 'undefined' && Platform.OS === 'web';

// Create a mock storage for SSR that does nothing
const mockStorage = {
  getItem: async () => null,
  setItem: async () => { },
  removeItem: async () => { },
};

const authOptions: SupabaseClientOptions<"public">['auth'] = {
  storage: isSSR ? mockStorage : AsyncStorage,
  autoRefreshToken: true,
  persistSession: !isSSR,
  detectSessionInUrl: false,
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: authOptions,
});

export default supabase;
