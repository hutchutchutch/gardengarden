import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://nxckuxelyleuexcsdczs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54Y2t1eGVseWxldWV4Y3NkY3pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MDU4MTMsImV4cCI6MjA2NjM4MTgxM30.zF3hUwgwFH5uGwj0P8f1sj7qsoEx-fbl79pzt8JqNLM';

// Create Supabase client with React Native async storage
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Export individual services for convenience
export const supabaseAuth = supabase.auth;
export const supabaseStorage = supabase.storage;
export const supabaseDb = supabase.from; 