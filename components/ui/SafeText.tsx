import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { Text as PaperText } from 'react-native-paper';
import { safeText } from '@/utils/textUtils';

/**
 * SafeText component that ensures all content is safely rendered within Text components
 * Prevents "text strings must be rendered within a <Text> component" errors
 */

interface SafeTextProps extends RNTextProps {
  children: any;
  variant?: 'default' | 'paper';
  paperProps?: any;
}

export const SafeText: React.FC<SafeTextProps> = ({ 
  children, 
  variant = 'default',
  paperProps,
  ...props 
}) => {
  const safeContent = safeText(children);
  
  if (variant === 'paper') {
    return (
      <PaperText {...paperProps} {...props}>
        {safeContent}
      </PaperText>
    );
  }
  
  return (
    <RNText {...props}>
      {safeContent}
    </RNText>
  );
};

/**
 * Hook to safely render text content
 */
export const useSafeText = (content: any): string => {
  return safeText(content);
}; 