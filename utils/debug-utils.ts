import { supabase } from '@/config/supabase';

export const testThreadCreation = async () => {
  console.log('=== TEST THREAD CREATION START ===');
  
  try {
    // 1. Check current auth state using the new RPC function
    const { data: authInfo, error: authError } = await supabase
      .rpc('get_current_auth_user');
    
    console.log('Current auth context (from database):', { data: authInfo, error: authError });

    // 2. Check session from client
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Client session check:', { 
      hasSession: !!session,
      userId: session?.user?.id,
      email: session?.user?.email,
      error: sessionError 
    });

    if (!session) {
      console.error('No active session');
      return;
    }

    // 3. Get current user details
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    console.log('Current user details:', { data: currentUser, error: userError });

    // 4. Test thread creation with detailed diagnostics
    if (currentUser?.role === 'student') {
      const testTeacherId = 'ee242274-2c32-4432-bfad-69cbeb9d1228';
      
      console.log('Testing student->teacher thread creation with RPC:', {
        studentId: currentUser.id,
        teacherId: testTeacherId
      });

      const { data: testResult, error: testError } = await supabase
        .rpc('test_thread_creation', {
          p_student_id: currentUser.id,
          p_teacher_id: testTeacherId
        });

      console.log('Thread creation test result:', { 
        data: testResult, 
        error: testError,
        details: testResult?.[0] || 'No result'
      });

      // Also try the traditional method for comparison
      console.log('Trying traditional insert method...');
      const { data: newThread, error: createError } = await supabase
        .from('message_threads')
        .insert({
          student_id: currentUser.id,
          teacher_id: testTeacherId,
          thread_type: 'teacher_chat'
        })
        .select()
        .single();

      console.log('Traditional insert result:', { 
        success: !!newThread,
        data: newThread, 
        error: createError
      });
    } else if (currentUser?.role === 'teacher') {
      const testStudentId = '9bc5a262-f6ce-4da5-bdfc-28a9383cabb2';
      
      console.log('Testing teacher->student thread creation with RPC:', {
        studentId: testStudentId,
        teacherId: currentUser.id
      });

      const { data: testResult, error: testError } = await supabase
        .rpc('test_thread_creation', {
          p_student_id: testStudentId,
          p_teacher_id: currentUser.id
        });

      console.log('Thread creation test result:', { 
        data: testResult, 
        error: testError,
        details: testResult?.[0] || 'No result'
      });
    }

  } catch (error) {
    console.error('Test error:', error);
  }

  console.log('=== TEST THREAD CREATION END ===');
};

// Function to manually refresh auth session
export const refreshAuthSession = async () => {
  console.log('=== REFRESH AUTH SESSION ===');
  
  // First check current state
  const { data: authInfo } = await supabase.rpc('get_current_auth_user');
  console.log('Before refresh - Auth context:', authInfo);
  
  const { data, error } = await supabase.auth.refreshSession();
  console.log('Refresh result:', { 
    success: !!data.session,
    user: data.session?.user?.email,
    error 
  });
  
  // Check after refresh
  const { data: authInfoAfter } = await supabase.rpc('get_current_auth_user');
  console.log('After refresh - Auth context:', authInfoAfter);
  
  return data.session;
};

// Function to check RLS context
export const checkRLSContext = async () => {
  console.log('=== RLS CONTEXT CHECK ===');
  
  // Get auth info from database
  const { data: dbAuth, error: dbError } = await supabase
    .rpc('get_current_auth_user');
  
  console.log('Database auth context:', { data: dbAuth, error: dbError });
  
  // Get auth info from client
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const { data: { session } } = await supabase.auth.getSession();
  
  console.log('Client auth comparison:', {
    authGetUser: authUser?.id,
    sessionUser: session?.user?.id,
    dbAuthUser: dbAuth?.[0]?.auth_uid,
    allMatch: authUser?.id === session?.user?.id && authUser?.id === dbAuth?.[0]?.auth_uid
  });

  // Check if we can query our own user record
  if (authUser?.id) {
    const { data: ownRecord, error: ownError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();
    
    console.log('Can query own user record:', { success: !!ownRecord, error: ownError });
  }
}; 