import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nxckuxelyleuexcsdczs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54Y2t1eGVseWxldWV4Y3NkY3pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MDU4MTMsImV4cCI6MjA2NjM4MTgxM30.zF3hUwgwFH5uGwj0P8f1sj7qsoEx-fbl79pzt8JqNLM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  console.log('Testing Supabase Authentication...\n');

  // Test user credentials
  const testEmail = 'hutchenbach@gmail.com';
  const testPassword = 'testpassword123';
  const testName = 'Test User';

  try {
    // 1. Try to sign up a new user
    console.log('1. Attempting to sign up new user...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: testName,
          role: 'student',
          classId: 'test-class'
        }
      }
    });

    if (signUpError) {
      console.log('Sign up error:', signUpError.message);
      
      // If user already exists, try to sign in
      if (signUpError.message.includes('already registered')) {
        console.log('User already exists, attempting sign in...\n');
      }
    } else {
      console.log('✅ Sign up successful!');
      console.log('User ID:', signUpData.user?.id);
      console.log('Email:', signUpData.user?.email);
      
      // Sign out after signup to test sign in
      await supabase.auth.signOut();
      console.log('Signed out to test sign in...\n');
    }

    // 2. Test sign in
    console.log('2. Testing sign in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInError) {
      console.log('❌ Sign in failed:', signInError.message);
      if (signInError.message.includes('Email not confirmed')) {
        console.log('\n⚠️  Please check your email (hutchenbach@gmail.com) to confirm your account.');
        console.log('After confirming, you can sign in with:');
        console.log('Email:', testEmail);
        console.log('Password:', testPassword);
      }
      return;
    }

    console.log('✅ Sign in successful!');
    console.log('User ID:', signInData.user?.id);
    console.log('Email:', signInData.user?.email);
    console.log('Session:', signInData.session ? 'Active' : 'None');

    // 3. Check if user profile exists in database
    console.log('\n3. Checking user profile in database...');
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', signInData.user?.id)
      .single();

    if (profileError) {
      console.log('❌ Error fetching profile:', profileError.message);
      
      // Create profile if it doesn't exist
      if (profileError.code === 'PGRST116') {
        console.log('Creating user profile...');
        const { error: insertError } = await supabase
          .from('users')
          .insert([{
            id: signInData.user?.id,
            email: testEmail,
            name: testName,
            role: 'student',
            class_id: 'test-class',
            created_at: new Date().toISOString(),
            last_active_at: new Date().toISOString(),
            streak: 0
          }]);

        if (insertError) {
          console.log('❌ Error creating profile:', insertError.message);
        } else {
          console.log('✅ Profile created successfully!');
        }
      }
    } else {
      console.log('✅ User profile found:');
      console.log('- Name:', profile.name);
      console.log('- Role:', profile.role);
      console.log('- Class ID:', profile.class_id);
      console.log('- Streak:', profile.streak);
    }

    // 4. Test getting current session
    console.log('\n4. Testing session retrieval...');
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session valid:', session ? '✅ Yes' : '❌ No');

    // 5. Test sign out
    console.log('\n5. Testing sign out...');
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.log('❌ Sign out failed:', signOutError.message);
    } else {
      console.log('✅ Sign out successful!');
    }

    console.log('\n✨ Authentication test complete!');
    console.log('\nTest credentials for your app:');
    console.log('Email:', testEmail);
    console.log('Password:', testPassword);

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the test
testAuth(); 