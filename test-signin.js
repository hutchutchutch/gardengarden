import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nxckuxelyleuexcsdczs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54Y2t1eGVseWxldWV4Y3NkY3pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MDU4MTMsImV4cCI6MjA2NjM4MTgxM30.zF3hUwgwFH5uGwj0P8f1sj7qsoEx-fbl79pzt8JqNLM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignIn() {
  console.log('Testing sign in with confirmed account...\n');

  try {
    // Test sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'hutchenbach@gmail.com',
      password: 'testpassword123',
    });

    if (error) {
      console.log('❌ Sign in failed:', error.message);
      return;
    }

    console.log('✅ Sign in successful!');
    console.log('User ID:', data.user?.id);
    console.log('Email:', data.user?.email);
    console.log('Session:', data.session ? 'Active' : 'None');
    console.log('\n✨ You can now sign in to your React Native app with these credentials!');

    // Sign out
    await supabase.auth.signOut();
    console.log('Signed out successfully.');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testSignIn(); 