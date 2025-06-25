import * as React from 'react';
import { ProgressBar } from 'react-native-paper';

type ProgressProps = React.ComponentProps<typeof ProgressBar> & {
  value?: number;
  max?: number;
};

function Progress({ 
  value = 0, 
  max = 100,
  ...props 
}: ProgressProps) {
  const normalizedProgress = value / max;
  
  return (
    <ProgressBar
      progress={normalizedProgress}
      {...props}
    />
  );
}

export { Progress };
export type { ProgressProps };
