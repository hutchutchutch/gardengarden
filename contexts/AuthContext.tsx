import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { supabase } from '@/utils/supabase';
import { Session, AuthError } from '@supabase/supabase-js';
import { storage } from '@/utils/storage';

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInDemo: (role: 'student' | 'teacher') => Promise<void>;
  signUp: (email: string, password: string, name: string, role: 'student' | 'teacher', classId: string) => Promise<void>;
  signOut: () => Promise<void>;
  showFAB: boolean;
  setShowFAB: (show: boolean) => void;
  updateUserRole: (role: 'student' | 'teacher') => Promise<void>;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFAB, setShowFAB] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      try {
        // Check for demo mode first
        const demoMode = await storage.getItem('isDemoMode');
        const storedUser = await storage.getItem('user');
        
        if (demoMode === 'true' && storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsDemoMode(true);
        } else {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            await loadUserData(session);
          }
        }
      } catch (error) {
        console.error('Error checking user session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await loadUserData(session);
      } else {
        setUser(null);
        await storage.removeItem('user');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (session: Session) => {
    try {
      // Check if user profile exists in the database
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create a default one
        const userData: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          role: 'student',
          classId: 'default',
          createdAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
          streak: 0
        };

        // Insert new user profile
        const { error: insertError } = await supabase
          .from('users')
          .insert([userData]);

        if (!insertError) {
          setUser(userData);
          await storage.setItem('user', JSON.stringify(userData));
        }
      } else if (profile) {
        setUser(profile);
        await storage.setItem('user', JSON.stringify(profile));
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
    } catch (error) {
      console.error('Sign in error:', error);
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
    } catch (error) {
      console.error('Demo sign in error:', error);
      throw error;
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    name: string, 
    role: 'student' | 'teacher',
    classId: string
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
            classId
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
          role,
          classId,
          createdAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
          streak: 0
        };

        const { error: profileError } = await supabase
          .from('users')
          .insert([userData]);

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

  const signOut = async () => {
    try {
      if (!isDemoMode) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }
      
      setUser(null);
      setIsDemoMode(false);
      await storage.removeItem('user');
      await storage.removeItem('isDemoMode');
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

  const value: AuthContextType = {
    user,
    isLoading,
    signIn,
    signInDemo,
    signUp,
    signOut,
    showFAB,
    setShowFAB,
    updateUserRole,
    isDemoMode
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 