import React, { useEffect } from 'react';
import { View, Pressable, Text } from 'react-native';
import { useMode } from '@/contexts/ModeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

interface ModeToggleProps {
  style?: any;
}

export default function ModeToggle({ style }: ModeToggleProps) {
  const { isTeacherMode, setIsTeacherMode } = useMode();
  const { user, switchToTeacher, switchToStudent, getAllStudents } = useAuth();
  const router = useRouter();

  // Set initial mode based on user role (only on first load, not during switches)
  useEffect(() => {
    if (user) {
      const shouldBeTeacherMode = user.role === 'teacher';
      console.log('🔄 Mode toggle useEffect triggered - User:', user.email, 'Role:', user.role, 'Current mode:', isTeacherMode, 'Should be teacher mode:', shouldBeTeacherMode);
      
      // Only auto-correct mode if it's significantly different (not during auth switches)
      if (isTeacherMode !== shouldBeTeacherMode) {
        // Add a small delay to allow authentication switches to complete
        const timer = setTimeout(() => {
          if (isTeacherMode !== shouldBeTeacherMode) {
            setIsTeacherMode(shouldBeTeacherMode);
            console.log('✅ Mode auto-corrected from', isTeacherMode, 'to', shouldBeTeacherMode);
          }
        }, 500);
        
        return () => clearTimeout(timer);
      }
    } else {
      console.log('🔄 No user, setting teacher mode to false');
      setIsTeacherMode(false);
    }
  }, [user?.id, user?.role]); // Only depend on user ID and role, not the mode itself

  const handleModeChange = async (toTeacherMode: boolean) => {
    try {
      console.log('🔄 Mode change requested:', toTeacherMode ? 'Teacher' : 'Student');
      
      if (toTeacherMode) {
        // Switch to teacher authentication
        console.log('🔄 Switching to teacher...');
        setIsTeacherMode(true); // Set mode immediately to prevent UI flicker
        await switchToTeacher();
        router.replace('/screens/teacher-index');
      } else {
        // Switch to default student authentication
        console.log('🔄 Switching to default student...');
        setIsTeacherMode(false); // Set mode immediately to prevent UI flicker
        // Get the first student and switch to them
        const students = await getAllStudents();
        if (students.length > 0) {
          await switchToStudent(students[0].id);
        }
        router.replace('/screens/student-index');
      }
    } catch (error) {
      console.error('Error switching mode:', error);
      // Revert mode on error
      setIsTeacherMode(!toTeacherMode);
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
    </View>
  );
} 