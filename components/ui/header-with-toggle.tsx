import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ModeToggle } from './mode-toggle';

interface HeaderWithToggleProps {
  title: string;
  isTeacherMode: boolean;
  onToggle: (isTeacher: boolean) => void;
}

export function HeaderWithToggle({ title, isTeacherMode, onToggle }: HeaderWithToggleProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {title}
      </Text>
      <ModeToggle 
        isTeacherMode={isTeacherMode}
        onToggle={onToggle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#020817',
    flex: 1,
  },
}); 