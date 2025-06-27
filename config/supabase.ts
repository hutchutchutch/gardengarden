import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { storage } from '@/utils/storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL and Anon Key are required. Please check your environment variables.');
}

// Create Supabase client with platform-appropriate storage
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
  global: {
    headers: {
      'x-client-info': 'garden-guru-app'
    }
  },
  db: {
    schema: 'public'
  }
});

// Add auth state change listener for debugging
if (__DEV__) {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔐 Auth state changed:', event, session?.user?.email);
  });
}

// Export individual services for convenience
export const supabaseAuth = supabase.auth;
export const supabaseStorage = supabase.storage;
export const supabaseDb = supabase.from;

// Export URL and anon key for direct API calls
export { supabaseUrl, supabaseAnonKey }; 