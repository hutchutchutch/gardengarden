import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface ModeToggleProps {
  isTeacherMode: boolean;
  onToggle: (isTeacher: boolean) => void;
}

export function ModeToggle({ isTeacherMode, onToggle }: ModeToggleProps) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => onToggle(false)}
        style={[
          styles.button,
          !isTeacherMode && styles.activeButton
        ]}
      >
        <Text
          style={[
            styles.buttonText,
            !isTeacherMode ? styles.activeText : styles.inactiveText
          ]}
        >
          Student
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onToggle(true)}
        style={[
          styles.button,
          isTeacherMode && styles.activeButton
        ]}
      >
        <Text
          style={[
            styles.buttonText,
            isTeacherMode ? styles.activeText : styles.inactiveText
          ]}
        >
          Teacher
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    padding: 4,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  activeButton: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeText: {
    color: '#020817',
  },
  inactiveText: {
    color: '#64748B',
  },
}); 