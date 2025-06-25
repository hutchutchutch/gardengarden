import React from 'react';
import { ToggleButton } from 'react-native-paper';
import { useMode } from '@/contexts/ModeContext';

interface ModeToggleProps {
  style?: any;
}

export default function ModeToggle({ style }: ModeToggleProps) {
  const { isTeacherMode, setIsTeacherMode } = useMode();

  const handleValueChange = (value: string) => {
    setIsTeacherMode(value === 'teacher');
  };

  return (
    <ToggleButton.Row
      onValueChange={handleValueChange}
      value={isTeacherMode ? 'teacher' : 'student'}
      style={style}
    >
      <ToggleButton 
        icon="school" 
        value="student" 
        style={{ flex: 1 }}
      />
      <ToggleButton 
        icon="account-tie" 
        value="teacher" 
        style={{ flex: 1 }}
      />
    </ToggleButton.Row>
  );
} 