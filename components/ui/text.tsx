import * as React from 'react';
import { Text as RNText } from 'react-native';
import { cn } from '@/lib/utils';

const TextClassContext = React.createContext<string | undefined>(undefined);

const Text = React.forwardRef<
  React.ElementRef<typeof RNText>,
  React.ComponentPropsWithoutRef<typeof RNText> & {
    className?: string;
  }
>(({ className, ...props }, ref) => (
  <RNText
    className={cn(
      'text-base text-foreground web:select-text',
      className
    )}
    ref={ref}
    {...props}
  />
));
Text.displayName = 'Text';

export { Text, TextClassContext };
