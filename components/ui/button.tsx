import * as React from 'react';
import { Button as PaperButton } from 'react-native-paper';
import { StyleSheet } from 'react-native';

type ButtonProps = React.ComponentProps<typeof PaperButton> & {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
};

function Button({ 
  variant = 'default', 
  size = 'default',
  children,
  ...props 
}: ButtonProps) {
  // Map our variants to Paper Button modes
  const mode = variant === 'outline' ? 'outlined' : 
                variant === 'ghost' || variant === 'link' ? 'text' : 
                'contained';
  
  // Map size to contentStyle
  const contentStyle = size === 'lg' ? styles.large : 
                      size === 'sm' ? styles.small : 
                      styles.default;

  return (
    <PaperButton
      mode={mode}
      contentStyle={contentStyle}
      {...props}
    >
      {children}
    </PaperButton>
  );
}

const styles = StyleSheet.create({
  default: {
    height: 48,
    paddingHorizontal: 20,
  },
  small: {
    height: 36,
    paddingHorizontal: 12,
  },
  large: {
    height: 56,
    paddingHorizontal: 32,
  },
});

export { Button };
export type { ButtonProps };
