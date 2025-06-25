import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { useAppTheme } from '../../config/theme';

interface GSafeScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  backgroundColor?: string;
  padding?: number;
  style?: ViewStyle;
  testID?: string;
}

export const GSafeScreen: React.FC<GSafeScreenProps> = ({
  children,
  scrollable = false,
  backgroundColor,
  padding,
  style,
  testID = 'gs-safe-screen',
}) => {
  const theme = useAppTheme();
  const finalBackgroundColor = backgroundColor || theme.colors.background;
  const finalPadding = padding ?? theme.spacing.md;

  const containerStyle: ViewStyle = {
    ...styles.container,
    backgroundColor: finalBackgroundColor,
  };

  const contentStyle: ViewStyle = {
    ...styles.content,
    padding: finalPadding,
    ...style,
  };

  const content = scrollable ? (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={contentStyle}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      testID={`${testID}-scroll-view`}
    >
      {children}
    </ScrollView>
  ) : (
    <SafeAreaView style={[containerStyle, contentStyle]} testID={`${testID}-content`}>
      {children}
    </SafeAreaView>
  );

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={containerStyle} testID={testID}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {content}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
}); 