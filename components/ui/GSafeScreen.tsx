import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ViewStyle,
  View,
} from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { useAppTheme } from '../../config/theme';
import { ShimmerPlaceholder } from './ShimmerPlaceholder';

interface GSafeScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  backgroundColor?: string;
  padding?: number;
  style?: ViewStyle;
  isLoading?: boolean;
  testID?: string;
}

export const GSafeScreen: React.FC<GSafeScreenProps> = ({
  children,
  scrollable = false,
  backgroundColor,
  padding,
  style,
  isLoading = false,
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

  const renderLoadingState = () => (
    <View style={[contentStyle, styles.loadingContainer]}>
      {/* Header shimmer */}
      <ShimmerPlaceholder height={56} style={{ marginBottom: 16 }} />
      
      {/* Content shimmer blocks */}
      <ShimmerPlaceholder height={120} style={{ marginBottom: 12 }} delay={50} />
      <ShimmerPlaceholder height={80} style={{ marginBottom: 12 }} delay={100} />
      <ShimmerPlaceholder height={100} style={{ marginBottom: 12 }} delay={150} />
      
      {/* Bottom content */}
      <View style={{ marginTop: 'auto' }}>
        <ShimmerPlaceholder height={48} delay={200} />
      </View>
    </View>
  );

  const content = isLoading ? (
    renderLoadingState()
  ) : scrollable ? (
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
  loadingContainer: {
    flex: 1,
  },
}); 