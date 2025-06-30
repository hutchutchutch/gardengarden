import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { supabase } from '@/config/supabase';
import { Session, AuthError } from '@supabase/supabase-js';
import { storage } from '@/utils/storage';

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isInitializing: boolean;
  hasSeenOnboarding: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
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
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    // Only clear session once on app load to force fresh sign-in
    const initializeAuth = async () => {
      try {
        setIsInitializing(true);
        
        // Check if user has seen onboarding
        const onboardingStatus = await storage.getItem('hasSeenOnboarding');
        setHasSeenOnboarding(onboardingStatus === 'true');
        
        if (!hasCleared) {
          // Add small delay to allow navigation to settle
          await new Promise(resolve => setTimeout(resolve, 100));
          await supabase.auth.signOut();
          setUser(null);
          hasCleared = true;
        } else {
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
      if (session?.user) {
        await loadUserFromSession(session);
      } else {
        setUser(null);
        setIsLoading(false); // Only set loading false when no session
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserFromSession = async (session: Session) => {
    try {
      setIsLoading(true);
      
      // Get user profile from database by email (since auth IDs may not match users table IDs)
      
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
        console.error('Database query timed out:', timeoutError);
        error = timeoutError;
      }
      
      if (profile && !error) {
        const userData: User = {
          id: session.user.id, // Use auth.uid() instead of public.users.id for RLS compatibility
          email: profile.email,
          name: profile.name,
          role: profile.role,
          classId: profile.class_id,
          createdAt: profile.created_at,
          lastActiveAt: profile.updated_at,
          streak: profile.streak || 0
        };
        
        setUser(userData);
        
        // If this is a student with a class, ensure they have plant story entries
        if (userData.role === 'student' && userData.classId) {
          try {
            // Import dynamically to avoid circular dependency
            const { PlantStoriesService } = await import('@/services/plant-stories-service');
            await PlantStoriesService.ensureClassPlantStoriesExist(userData.id);
          } catch (error) {
            console.error('Error ensuring plant stories exist:', error);
            // Don't fail user login for this
          }
        }
      } else {
        console.error('Failed to load user profile:', error);
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
      // If no current user, return empty array
      if (!user) {
        console.warn('No current user found when fetching students');
        return [];
      }

      // If current user has no class_id, return empty array
      if (!user.classId) {
        console.warn('Current user has no class_id when fetching students');
        return [];
      }

      const { data: students, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'student')
        .eq('class_id', user.classId) // Only students from same class
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

  const completeOnboarding = () => {
    setHasSeenOnboarding(true);
    storage.setItem('hasSeenOnboarding', 'true');
  };

  const resetOnboarding = () => {
    setHasSeenOnboarding(false);
    storage.removeItem('hasSeenOnboarding');
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isInitializing,
    hasSeenOnboarding,
    completeOnboarding,
    resetOnboarding,
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