import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModeContextType {
  isTeacherMode: boolean;
  setIsTeacherMode: (isTeacher: boolean) => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [isTeacherMode, setIsTeacherMode] = useState(false);

  return (
    <ModeContext.Provider value={{ isTeacherMode, setIsTeacherMode }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const context = useContext(ModeContext);
  if (context === undefined) {
    throw new Error('useMode must be used within a ModeProvider');
  }
  return context;
} 