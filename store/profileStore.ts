import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '@/types';

interface ProfileState {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile) => void;
  updateProfile: (data: Partial<UserProfile>) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: null,
      
      setProfile: (profile) => {
        set({ profile });
      },
      
      updateProfile: (data) => {
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...data } : data as UserProfile,
        }));
      },
    }),
    {
      name: 'garden-profile-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);