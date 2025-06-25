import * as React from 'react';
import { Chip } from 'react-native-paper';

type BadgeProps = React.ComponentProps<typeof Chip> & {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
};

function Badge({ 
  children, 
  variant = 'default',
  style,
  ...props 
}: BadgeProps) {
  return (
    <Chip
      mode='flat'
      style={[{ alignSelf: 'flex-start' }, style]}
      {...props}
    >
      {children}
    </Chip>
  );
}

export { Badge };
export type { BadgeProps };
