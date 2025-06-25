import * as React from 'react';
import { Text as PaperText } from 'react-native-paper';
import { cn } from '@/lib/utils';

type TextProps = React.ComponentProps<typeof PaperText> & {
  className?: string;
};

function Text({ children, style, ...props }: TextProps) {
  return (
    <PaperText style={style} {...props}>
      {children}
    </PaperText>
  );
}

export { Text };
export type { TextProps };
