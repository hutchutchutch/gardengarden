import React from 'react';
import { FAB as PaperFAB } from 'react-native-paper';
import { StyleSheet } from 'react-native';

interface FABProps {
  icon: string;
  onPress: () => void;
  visible?: boolean;
  label?: string;
  small?: boolean;
  color?: string;
  style?: any;
}

export function FAB({ 
  icon, 
  onPress, 
  visible = true, 
  label,
  small = false,
  color,
  style,
  ...props 
}: FABProps) {
  return (
    <PaperFAB
      icon={icon}
      onPress={onPress}
      visible={visible}
      label={label}
      small={small}
      color={color}
      style={[styles.fab, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
}); 