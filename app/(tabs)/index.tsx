import React from 'react';
import { useMode } from '@/contexts/ModeContext';
import StudentIndex from '../screens/student-index';
import TeacherIndex from '../screens/teacher-index';

export default function IndexScreen() {
  const { isTeacherMode } = useMode();

  if (isTeacherMode) {
    return <TeacherIndex />;
  } else {
    return <StudentIndex />;
  }
} 