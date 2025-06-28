import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { supabase } from '@/config/supabase';
import { Session, AuthError } from '@supabase/supabase-js';
import { storage } from '@/utils/storage';

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isInitializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  showFAB: boolean;
  setShowFAB: (show: boolean) => void;
  switchToStudent: (studentId: string) => Promise<void>;
  getAllStudents: () => Promise<User[]>;
  switchToTeacher: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Master teacher and default student credentials
const MASTER_TEACHER_EMAIL = 'herchenbach.hutch@gmail.com';
const MASTER_TEACHER_PASSWORD = 'MasterSplinter';
const DEFAULT_STUDENT_EMAIL = 'hutchenbach@gmail.com';
const DEFAULT_STUDENT_PASSWORD = 'Donatello'; // In production, use proper password management

// Track if we've already cleared the session to prevent multiple clears
let hasCleared = false;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showFAB, setShowFAB] = useState(true);

  useEffect(() => {
    // Only clear session once on app load to force fresh sign-in
    const initializeAuth = async () => {
      try {
        setIsInitializing(true);
        
        if (!hasCleared) {
          console.log('🔄 App load - clearing session to force fresh sign-in');
          // Add small delay to allow navigation to settle
          await new Promise(resolve => setTimeout(resolve, 100));
          await supabase.auth.signOut();
          setUser(null);
          hasCleared = true;
        } else {
          console.log('🔄 Session already cleared, checking existing session');
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            await loadUserFromSession(session);
          }
        }
      } catch (error) {
        console.error('Error in auth initialization:', error);
      } finally {
        setIsInitializing(false);
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (session?.user) {
        console.log('🔄 Session exists, calling loadUserFromSession...');
        await loadUserFromSession(session);
      } else {
        console.log('🔄 No session, setting user to null and isLoading to false');
        setUser(null);
        setIsLoading(false); // Only set loading false when no session
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserFromSession = async (session: Session) => {
    console.log('🔄 loadUserFromSession called for:', session.user.email);
    try {
      setIsLoading(true); // Ensure loading state during profile fetch
      console.log('🔄 Set isLoading = true, querying database for user profile...');
      
      // Get user profile from database by email (since auth IDs may not match users table IDs)
      console.log('🔄 About to query users table for email:', session.user.email);
      
      // Check Supabase configuration
      console.log('🔄 Supabase URL configured:', !!process.env.EXPO_PUBLIC_SUPABASE_URL);
      console.log('🔄 Supabase Anon Key configured:', !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
      
      // Add timeout to prevent hanging
      let profile: any = null;
      let error: any = null;
      
      try {
        const queryPromise = supabase
          .from('users')
          .select('*')
          .eq('email', session.user.email)
          .single();
        
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database query timeout after 10 seconds')), 10000)
        );
        
        const result = await Promise.race([queryPromise, timeoutPromise]);
        if (result && typeof result === 'object' && 'data' in result) {
          profile = (result as any).data;
          error = (result as any).error;
        }
      } catch (timeoutError) {
        console.error('🚨 Database query timed out:', timeoutError);
        error = timeoutError;
      }

      console.log('🔄 Database query completed. Profile:', profile, 'Error:', error);

      console.log('🔄 Processing query result...');
      
      if (profile && !error) {
        console.log('🔄 Profile found, creating user data...');
        const userData: User = {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role,
          classId: profile.class_id,
          createdAt: profile.created_at,
          lastActiveAt: profile.updated_at,
          streak: profile.streak || 0
        };
        
        setUser(userData);
        console.log('✅ Loaded user from session:', userData.email, userData.role);
      } else {
        console.error('❌ Failed to load user profile:', error);
        console.log('🔄 Setting user to null and signing out...');
        setUser(null);
        // Skip sign out for timeout errors to prevent infinite loops
        if (error && !error.message?.includes('timeout')) {
          await supabase.auth.signOut();
        }
      }
    } catch (error) {
      console.error('Error loading user from session:', error);
      // If there's an error, sign them out to force fresh sign-in
      await supabase.auth.signOut();
      setUser(null);
    } finally {
      console.log('🔄 loadUserFromSession finally block - setting isLoading = false');
      setIsLoading(false); // Always clear loading state
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // REMOVED: setIsLoading(false) - let onAuthStateChange handle this
      console.log('✅ Signed in successfully:', email);
    } catch (error) {
      console.error('Sign in error:', error);
      setIsLoading(false); // Only set false on error
      throw error;
    }
    // No finally block - loading state managed by auth state changes
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      console.log('✅ Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const switchToStudent = async (studentId: string) => {
    try {
      setIsLoading(true);
      
      // Get the student's email from the database
      const { data: studentData, error } = await supabase
        .from('users')
        .select('email')
        .eq('id', studentId)
        .eq('role', 'student')
        .single();

      if (error || !studentData) {
        throw new Error('Student not found');
      }

      // Sign out current user and sign in as the student
      await supabase.auth.signOut();
      
      // Sign in as the selected student
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: studentData.email,
        password: DEFAULT_STUDENT_PASSWORD, // In production, implement proper password management
      });

      if (signInError) {
        throw signInError;
      }

      console.log('✅ Switched to student:', studentData.email);
    } catch (error) {
      console.error('Error switching to student:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const switchToTeacher = async () => {
    try {
      setIsLoading(true);
      
      // Sign out current user and sign in as teacher
      await supabase.auth.signOut();
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: MASTER_TEACHER_EMAIL,
        password: MASTER_TEACHER_PASSWORD, // In production, use proper password management
      });

      if (signInError) {
        throw signInError;
      }

      console.log('✅ Switched to teacher:', MASTER_TEACHER_EMAIL);
    } catch (error) {
      console.error('Error switching to teacher:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getAllStudents = async (): Promise<User[]> => {
    try {
      const { data: students, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'student')
        .order('name');

      if (error) throw error;

      return students.map(student => ({
        id: student.id,
        email: student.email,
        name: student.name,
        role: student.role,
        classId: student.class_id,
        createdAt: student.created_at,
        lastActiveAt: student.updated_at,
        streak: student.streak || 0
      }));
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isInitializing,
    signIn,
    signOut,
    showFAB,
    setShowFAB,
    switchToStudent,
    getAllStudents,
    switchToTeacher,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 