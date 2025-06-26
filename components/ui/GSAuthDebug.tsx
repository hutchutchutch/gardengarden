import React from 'react';
import { View, Text } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useMode } from '@/contexts/ModeContext';

export const GSAuthDebug: React.FC = () => {
  const { user, studentUser, masterTeacherUser } = useAuth();
  const { isTeacherMode } = useMode();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <View style={{
      position: 'absolute',
      bottom: 100,
      left: 10,
      right: 10,
      backgroundColor: 'rgba(0,0,0,0.8)',
      padding: 10,
      borderRadius: 8,
      zIndex: 9999,
    }}>
      <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
        Auth Debug Info
      </Text>
      <Text style={{ color: 'white', fontSize: 10, marginTop: 5 }}>
        Mode: {isTeacherMode ? 'Teacher' : 'Student'}
      </Text>
      <Text style={{ color: 'white', fontSize: 10 }}>
        Current User: {user?.email || 'None'} ({user?.role})
      </Text>
      <Text style={{ color: 'white', fontSize: 10 }}>
        Student User: {studentUser?.email || 'None'}
      </Text>
      <Text style={{ color: 'white', fontSize: 10 }}>
        Master Teacher: {masterTeacherUser?.email || 'Not loaded'}
      </Text>
    </View>
  );
}; 