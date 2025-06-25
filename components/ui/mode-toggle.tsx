import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { useMode } from '@/contexts/ModeContext';

interface ModeToggleProps {
  style?: any;
}

export default function ModeToggle({ style }: ModeToggleProps) {
  const { isTeacherMode, setIsTeacherMode } = useMode();

  return (
    <View style={[{
      flexDirection: 'row',
      backgroundColor: '#f1f5f9',
      borderRadius: 8,
      padding: 4,
    }, style]}>
      <Pressable
        onPress={() => setIsTeacherMode(false)}
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
        onPress={() => setIsTeacherMode(true)}
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
  );
} 