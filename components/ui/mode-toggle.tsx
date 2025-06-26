import React from 'react';
import { View, Pressable, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { useMode } from '@/contexts/ModeContext';
import { useAuth } from '@/contexts/AuthContext';

interface ModeToggleProps {
  style?: any;
}

export default function ModeToggle({ style }: ModeToggleProps) {
  const { isTeacherMode, setIsTeacherMode } = useMode();
  const { switchAuthMode, studentUser, masterTeacherUser, isDemoMode, user } = useAuth();

  const handleModeChange = async (toTeacherMode: boolean) => {
    console.log('=== MODE TOGGLE DEBUG ===');
    console.log('Switching to teacher mode:', toTeacherMode);
    console.log('Current user:', user?.email);
    console.log('Student user:', studentUser?.email);
    console.log('Master teacher user:', masterTeacherUser?.email);
    console.log('Is demo mode:', isDemoMode);
    
    if (isDemoMode) {
      setIsTeacherMode(toTeacherMode);
      return;
    }

    // Check if user is logged in
    if (toTeacherMode && !studentUser && !masterTeacherUser) {
      Alert.alert(
        'Not Logged In', 
        'Please sign in to access teacher mode.',
        [{ text: 'OK' }]
      );
      return;
    } else if (!toTeacherMode && !studentUser) {
      Alert.alert(
        'Not Logged In', 
        'Please sign in with your account first.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Switch mode and auth
    console.log('Calling switchAuthMode with:', toTeacherMode ? 'teacher' : 'student');
    await switchAuthMode(toTeacherMode ? 'teacher' : 'student');
    console.log('=== MODE TOGGLE COMPLETE ===');
  };

  // Get display info for current mode
  const getCurrentModeInfo = () => {
    if (isTeacherMode) {
      return user?.name || 'Teacher';
    } else {
      return studentUser?.name?.split(' ')[0] || 'Student';
    }
  };

  return (
    <View style={[style]}>
      <View style={{
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderRadius: 8,
        padding: 4,
      }}>
        <Pressable
          onPress={() => handleModeChange(false)}
          style={{
            flex: 1,
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 6,
            backgroundColor: !isTeacherMode ? '#fff' : 'transparent',
            alignItems: 'center',
            shadowColor: !isTeacherMode ? '#000' : 'transparent',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: !isTeacherMode ? 0.1 : 0,
            shadowRadius: 2,
            elevation: !isTeacherMode ? 2 : 0,
          }}
        >
          <Text style={{
            fontWeight: !isTeacherMode ? 'bold' : 'normal',
            color: !isTeacherMode ? '#000' : '#64748b',
          }}>
            Student
          </Text>
        </Pressable>
        
        <Pressable
          onPress={() => handleModeChange(true)}
          style={{
            flex: 1,
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 6,
            backgroundColor: isTeacherMode ? '#fff' : 'transparent',
            alignItems: 'center',
            shadowColor: isTeacherMode ? '#000' : 'transparent',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: isTeacherMode ? 0.1 : 0,
            shadowRadius: 2,
            elevation: isTeacherMode ? 2 : 0,
          }}
        >
          <Text style={{
            fontWeight: isTeacherMode ? 'bold' : 'normal',
            color: isTeacherMode ? '#000' : '#64748b',
          }}>
            Teacher
          </Text>
        </Pressable>
      </View>
      
      {/* Show current user info */}
      {user && (
        <Text style={{
          fontSize: 12,
          color: '#666',
          textAlign: 'center',
          marginTop: 4,
        }}>
          {getCurrentModeInfo()}
        </Text>
      )}
    </View>
  );
} 