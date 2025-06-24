import * as React from 'react';
import { View, Text } from 'react-native';
import { cn } from '@/lib/utils';

function Badge({
  className,
  variant = 'default',
  children,
  ...props
}: {
  className?: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  children?: React.ReactNode;
}) {
  return (
    <View
      className={cn(
        'inline-flex items-center rounded-md border border-border px-2.5 py-0.5',
        {
          'bg-primary': variant === 'default',
          'bg-secondary': variant === 'secondary',
          'bg-destructive': variant === 'destructive',
          'bg-transparent': variant === 'outline',
        },
        className
      )}
      {...props}
    >
      <Text
        className={cn('text-xs font-medium', {
          'text-primary-foreground': variant === 'default',
          'text-secondary-foreground': variant === 'secondary',
          'text-destructive-foreground': variant === 'destructive',
          'text-foreground': variant === 'outline',
        })}
      >
        {children}
      </Text>
    </View>
  );
}

export { Badge };
