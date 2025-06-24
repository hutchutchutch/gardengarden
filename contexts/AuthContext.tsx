import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, firestore } from '@/config/firebase';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role: 'student' | 'teacher', classId: string) => Promise<void>;
  signOut: () => Promise<void>;
  showFAB: boolean;
  setShowFAB: (show: boolean) => void;
  updateUserRole: (role: 'student' | 'teacher') => Promise<void>;
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

  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: FirebaseAuthTypes.User | null) => {
      if (firebaseUser) {
        try {
          // For now, create a simple user object from Firebase user
          // Later we'll add Firestore integration
          const userData: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || 'User',
            role: 'student', // Default role for now
            classId: 'default', // Default class for now
            createdAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
            streak: 0
          };
          setUser(userData);
          await AsyncStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
          console.error('Error processing user data:', error);
        }
      } else {
        setUser(null);
        await AsyncStorage.removeItem('user');
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!auth) {
      throw new Error('Firebase auth not initialized');
    }
    
    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
      console.error('Sign in error:', error);
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
    if (!auth) {
      throw new Error('Firebase auth not initialized');
    }
    
    try {
      const credential = await auth.createUserWithEmailAndPassword(email, password);
      
      // Update the user's display name
      if (credential.user) {
        await credential.user.updateProfile({
          displayName: name
        });
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    if (!auth) {
      throw new Error('Firebase auth not initialized');
    }
    
    try {
      await auth.signOut();
      setUser(null);
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const updateUserRole = async (role: 'student' | 'teacher') => {
    if (user) {
      const updatedUser = { ...user, role };
      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    showFAB,
    setShowFAB,
    updateUserRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 