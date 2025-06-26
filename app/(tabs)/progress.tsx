import React from 'react';
import { useMode } from '@/contexts/ModeContext';
import StudentProgressScreen from '../screens/student-progress';
import TeacherProgressScreen from '../screens/teacher-progress';

export default function ProgressTabScreen() {
  const { isTeacherMode } = useMode();

  return isTeacherMode ? <TeacherProgressScreen /> : <StudentProgressScreen />;
}
