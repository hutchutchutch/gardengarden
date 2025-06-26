import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { supabase } from '@/utils/supabase';
import { Session, AuthError } from '@supabase/supabase-js';
import { storage } from '@/utils/storage';

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
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

// Track if we've already initialized to prevent clearing session after sign-in
let hasInitialized = false;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFAB, setShowFAB] = useState(true);

  useEffect(() => {
    // Only clear session on first app load, not on subsequent component mounts
    const initializeAuth = async () => {
      try {
        if (!hasInitialized) {
          console.log('🔄 First app load - clearing existing session to force fresh sign-in');
          await supabase.auth.signOut();
          setUser(null);
          hasInitialized = true;
        } else {
          console.log('🔄 Checking existing session');
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            await loadUserFromSession(session);
          }
        }
      } catch (error) {
        console.error('Error in auth initialization:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      if (session?.user) {
        await loadUserFromSession(session);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserFromSession = async (session: Session) => {
    try {
      // Get user profile from database by email (since auth IDs may not match users table IDs)
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', session.user.email)
        .single();

      if (profile && !error) {
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
      }
    } catch (error) {
      console.error('Error loading user from session:', error);
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

      // User will be loaded via onAuthStateChange
      console.log('✅ Signed in successfully:', email);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
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