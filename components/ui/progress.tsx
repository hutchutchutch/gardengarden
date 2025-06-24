import * as React from 'react';
import { View } from 'react-native';
import { cn } from '@/lib/utils';

function Progress({
  className,
  value,
  indicatorClassName,
  ...props
}: {
  className?: string;
  value?: number | null;
  indicatorClassName?: string;
}) {
  const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;
  const width = Math.min(100, Math.max(0, safeValue));

  return (
    <View 
      className={cn('relative h-4 w-full overflow-hidden rounded-full bg-secondary', className)}
      {...props}
    >
      <View 
        className={cn('h-full bg-foreground', indicatorClassName)} 
        style={{ width: `${width}%` }}
      />
    </View>
  );
}

export { Progress };
