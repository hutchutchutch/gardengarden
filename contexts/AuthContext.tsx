import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { supabase } from '@/utils/supabase';
import { Session, AuthError } from '@supabase/supabase-js';
import { storage } from '@/utils/storage';
import { useMode } from '@/contexts/ModeContext';

export interface AuthContextType {
  user: User | null;
  studentUser: User | null;
  masterTeacherUser: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInDemo: (role: 'student' | 'teacher') => Promise<void>;
  signUp: (email: string, password: string, name: string, classId?: string) => Promise<void>;
  signOut: () => Promise<void>;
  showFAB: boolean;
  setShowFAB: (show: boolean) => void;
  updateUserRole: (role: 'student' | 'teacher') => Promise<void>;
  isDemoMode: boolean;
  switchAuthMode: (role: 'student' | 'teacher') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Master teacher email - hardcoded
const MASTER_TEACHER_EMAIL = 'herchenbach.hutch@gmail.com';
const MASTER_TEACHER_ID = 'master-teacher-001'; // This will be replaced with actual ID from DB

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [studentUser, setStudentUser] = useState<User | null>(null);
  const [masterTeacherUser, setMasterTeacherUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFAB, setShowFAB] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const { isTeacherMode, setIsTeacherMode } = useMode();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      try {
        // Check for demo mode first
        const demoMode = await storage.getItem('isDemoMode');
        const storedStudentUser = await storage.getItem('studentUser');
        const storedMasterTeacher = await storage.getItem('masterTeacherUser');
        
        if (demoMode === 'true') {
          const storedUser = await storage.getItem('user');
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            setIsDemoMode(true);
          }
          // Always set loading to false for demo mode
          setIsLoading(false);
        } else {
          // Load stored users
          if (storedStudentUser) {
            const studentData = JSON.parse(storedStudentUser);
            setStudentUser(studentData);
            if (!isTeacherMode) {
              setUser(studentData);
            }
          }
          
          // Always load master teacher if available
          if (storedMasterTeacher) {
            const teacherData = JSON.parse(storedMasterTeacher);
            setMasterTeacherUser(teacherData);
            if (isTeacherMode) {
              setUser(teacherData);
            }
          } else {
            // Try to load master teacher from database
            await loadMasterTeacher();
          }
          
          // Check current Supabase session
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            await loadUserData(session);
          }
        }
      } catch (error) {
        console.error('Error checking user session:', error);
      } finally {
        console.log('Auth checkUser completed, setting isLoading to false');
        setIsLoading(false);
      }
    };

    checkUser();

    // Fallback timeout to ensure loading doesn't get stuck
    const loadingTimeout = setTimeout(() => {
      console.warn('Auth loading timeout reached, forcing isLoading to false');
      setIsLoading(false);
    }, 5000);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await loadUserData(session);
      } else if (_event === 'SIGNED_OUT') {
        // Clear student data but keep master teacher
        setStudentUser(null);
        await storage.removeItem('studentUser');
        if (!isTeacherMode) {
          setUser(null);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, [isTeacherMode]);

  // Update active user when mode changes
  useEffect(() => {
    if (!isDemoMode && !isLoading) {
      if (isTeacherMode && masterTeacherUser) {
        setUser(masterTeacherUser);
        // Ensure student is preserved
        console.log('Teacher mode active, student preserved:', studentUser?.email);
      } else if (!isTeacherMode && studentUser) {
        setUser(studentUser);
        console.log('Student mode active, using:', studentUser.email);
      } else if (!isTeacherMode && !studentUser) {
        setUser(null);
      }
    }
  }, [isTeacherMode, studentUser, masterTeacherUser, isDemoMode, isLoading]);

  const loadMasterTeacher = async () => {
    try {
      // Load master teacher from database
      const { data: teacherProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', MASTER_TEACHER_EMAIL)
        .single();

      if (teacherProfile && !error) {
        // Map database fields to User interface
        const userData: User = {
          id: teacherProfile.id,
          email: teacherProfile.email,
          name: teacherProfile.name,
          role: teacherProfile.role,
          classId: teacherProfile.class_id, // Map class_id to classId
          createdAt: teacherProfile.created_at,
          lastActiveAt: teacherProfile.updated_at,
          streak: 0 // Default value
        };
        
        setMasterTeacherUser(userData);
        await storage.setItem('masterTeacherUser', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Error loading master teacher:', error);
    }
  };

  const loadUserData = async (session: Session) => {
    try {
      const email = session.user.email;
      
      // Check if user profile exists in the database
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create a student profile
        // Get the Gardening class ID
        const { data: gardeningClass } = await supabase
          .from('classes')
          .select('id')
          .eq('name', 'Gardening')
          .single();

        const userData: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || email?.split('@')[0] || 'Student',
          role: 'student',
          classId: gardeningClass?.id || 'e1a2b3c4-d5e6-7890-abcd-ef1234567890', // Use Gardening class or fallback to default
          createdAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
          streak: 0
        };

        // Insert new user profile with correct column name (UPSERT to handle duplicates)
        const { error: insertError } = await supabase
          .from('users')
          .upsert([{
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            class_id: userData.classId, // Use correct column name
            settings: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }], {
            onConflict: 'id'
          });

        if (!insertError) {
          setStudentUser(userData);
          await storage.setItem('studentUser', JSON.stringify(userData));
          if (!isTeacherMode) {
            setUser(userData);
          }
          console.log('Created new student profile:', userData.email);
          // Ensure loading is cleared after successful user creation
          setIsLoading(false);
        }
      } else if (profile) {
        // Always treat logged in users as students (except master teacher)
        if (email !== MASTER_TEACHER_EMAIL) {
          // Map database fields to User interface
          const userData: User = {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role,
            classId: profile.class_id, // Map class_id to classId
            createdAt: profile.created_at,
            lastActiveAt: profile.updated_at,
            streak: 0 // Default value, can be calculated later
          };
          
          setStudentUser(userData);
          await storage.setItem('studentUser', JSON.stringify(userData));
          if (!isTeacherMode) {
            setUser(userData);
          }
          console.log('Loaded existing student profile:', userData.email);
          // Ensure loading is cleared after successful user load
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Always start in student mode for regular sign ins
      setIsTeacherMode(false);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    name: string,
    classId?: string
  ) => {
    try {
      // Get the Gardening class ID if no classId provided
      let targetClassId = classId;
      if (!targetClassId) {
        const { data: gardeningClass } = await supabase
          .from('classes')
          .select('id')
          .eq('name', 'Gardening')
          .single();
        
        targetClassId = gardeningClass?.id || 'e1a2b3c4-d5e6-7890-abcd-ef1234567890';
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: 'student',
            classId: targetClassId
          }
        }
      });

      if (error) throw error;

      // Create user profile in database
      if (data.user) {
        const userData: User = {
          id: data.user.id,
          email: data.user.email || '',
          name,
          role: 'student',
          classId: targetClassId || 'e1a2b3c4-d5e6-7890-abcd-ef1234567890',
          createdAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
          streak: 0
        };

        // Insert with correct column names (UPSERT to handle duplicates)
        const { error: profileError } = await supabase
          .from('users')
          .upsert([{
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            class_id: userData.classId, // Use correct column name
            settings: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }], {
            onConflict: 'id'
          });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          // Consider deleting the auth user if profile creation fails
          await supabase.auth.signOut();
          throw profileError;
        }
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signInDemo = async (role: 'student' | 'teacher') => {
    try {
      const demoUser: User = {
        id: `demo-${role}-${Date.now()}`,
        email: `demo-${role}@example.com`,
        name: role === 'student' ? 'Demo Student' : 'Demo Teacher',
        role,
        classId: 'demo-class',
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        streak: 0
      };

      setUser(demoUser);
      setIsDemoMode(true);
      await storage.setItem('user', JSON.stringify(demoUser));
      await storage.setItem('isDemoMode', 'true');
      setIsTeacherMode(role === 'teacher');
    } catch (error) {
      console.error('Demo sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      if (!isDemoMode) {
        // Sign out of Supabase
        await supabase.auth.signOut();
      }
      
      setUser(null);
      setStudentUser(null);
      // Keep master teacher in memory but clear current user
      setIsDemoMode(false);
      await storage.removeItem('user');
      await storage.removeItem('studentUser');
      await storage.removeItem('isDemoMode');
      
      // Switch to student mode on sign out
      setIsTeacherMode(false);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const updateUserRole = async (role: 'student' | 'teacher') => {
    if (user) {
      try {
        // Update in database
        const { error } = await supabase
          .from('users')
          .update({ role })
          .eq('id', user.id);

        if (error) throw error;

        // Update local state
        const updatedUser = { ...user, role };
        setUser(updatedUser);
        await storage.setItem('user', JSON.stringify(updatedUser));
      } catch (error) {
        console.error('Error updating user role:', error);
        throw error;
      }
    }
  };

  const switchAuthMode = async (role: 'student' | 'teacher') => {
    if (isDemoMode) return;
    
    console.log('=== SWITCH AUTH MODE DEBUG ===');
    console.log('Switching to mode:', role);
    console.log('Current user:', user?.email, user?.id);
    console.log('Current studentUser:', studentUser?.email, studentUser?.id);
    console.log('Current masterTeacherUser:', masterTeacherUser?.email, masterTeacherUser?.id);
    console.log('Current isTeacherMode:', isTeacherMode);
    
    if (role === 'student') {
      // Switching back to student mode
      if (studentUser) {
        console.log('✅ Setting user to studentUser:', studentUser.email);
        setUser(studentUser);
        setIsTeacherMode(false);
        console.log('✅ Restored student user:', studentUser.email);
      } else {
        console.warn('❌ No student user to restore');
        setUser(null);
        setIsTeacherMode(false);
      }
    } else if (role === 'teacher') {
      // Switching to teacher mode
      // First, ensure we preserve the current student if we're in student mode
      if (!isTeacherMode && user && user.role === 'student') {
        // Update the stored student user to ensure it's current
        setStudentUser(user);
        await storage.setItem('studentUser', JSON.stringify(user));
        console.log('✅ Preserved current student user:', user.email);
      }
      
      // Now switch to teacher
      if (masterTeacherUser) {
        console.log('✅ Setting user to masterTeacherUser:', masterTeacherUser.email);
        setUser(masterTeacherUser);
        setIsTeacherMode(true);
        console.log('✅ Switched to master teacher:', masterTeacherUser.email, masterTeacherUser.id);
      } else {
        // Try to load master teacher if not already loaded
        console.log('🔍 Master teacher not loaded, attempting to load...');
        
        try {
          // Load master teacher from database
          const { data: teacherProfile, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', MASTER_TEACHER_EMAIL)
            .single();

          console.log('Teacher profile query result:', { teacherProfile, error });
          
          if (teacherProfile && !error) {
            // Map database fields to User interface
            const userData: User = {
              id: teacherProfile.id,
              email: teacherProfile.email,
              name: teacherProfile.name,
              role: teacherProfile.role,
              classId: teacherProfile.class_id, // Map class_id to classId
              createdAt: teacherProfile.created_at,
              lastActiveAt: teacherProfile.updated_at,
              streak: 0 // Default value
            };
            
            console.log('✅ Mapped teacher userData:', userData);
            
            setMasterTeacherUser(userData);
            await storage.setItem('masterTeacherUser', JSON.stringify(userData));
            setUser(userData);
            setIsTeacherMode(true);
            console.log('✅ Loaded and switched to master teacher:', userData.email, userData.id);
          } else {
            console.error('❌ Master teacher account not found in database:', error);
          }
        } catch (error) {
          console.error('❌ Error loading master teacher:', error);
        }
      }
    }
    
    console.log('=== END SWITCH AUTH MODE DEBUG ===');
  };

  const value: AuthContextType = {
    user,
    studentUser,
    masterTeacherUser,
    isLoading,
    signIn,
    signInDemo,
    signUp,
    signOut,
    showFAB,
    setShowFAB,
    updateUserRole,
    isDemoMode,
    switchAuthMode
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 