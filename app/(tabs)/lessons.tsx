import React from 'react';
import { useMode } from '@/contexts/ModeContext';
import StudentLessons from '../screens/student-lessons';
import TeacherLessons from '../screens/teacher-lessons';

export default function LessonsScreen() {
  const { isTeacherMode } = useMode();

  return isTeacherMode ? <TeacherLessons /> : <StudentLessons />;
}