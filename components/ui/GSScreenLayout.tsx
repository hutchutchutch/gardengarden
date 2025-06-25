import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GSafeScreen } from './GSafeScreen';
import { GSModeToggle } from './GSModeToggle';
import { useAppTheme } from '../../config/theme';

interface GSScreenLayoutProps {
  children: React.ReactNode;
  scrollable?: boolean;
  showModeToggle?: boolean;
  style?: any;
}

export const GSScreenLayout: React.FC<GSScreenLayoutProps> = ({
  children,
  scrollable = true,
  showModeToggle = true,
  style
}) => {
  const theme = useAppTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Fixed Mode Toggle at the top */}
      {showModeToggle && (
        <View style={[
          styles.modeToggleContainer, 
          { 
            backgroundColor: theme.colors.background,
            shadowColor: theme.colors.shadow,
          }
        ]}>
          <GSModeToggle />
        </View>
      )}
      
      {/* Main content with top padding to account for fixed toggle */}
      <GSafeScreen 
        scrollable={scrollable} 
        style={[
          showModeToggle && styles.contentWithToggle,
          style
        ]}
      >
        {children}
      </GSafeScreen>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modeToggleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingTop: 48, // Safe area top
    paddingBottom: 8,
    paddingHorizontal: 16,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  contentWithToggle: {
    paddingTop: 60,
  },
});