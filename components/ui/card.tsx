import * as React from 'react';
import { Card as PaperCard } from 'react-native-paper';
import { View } from 'react-native';

const Card = React.forwardRef<
  React.ElementRef<typeof PaperCard>,
  React.ComponentPropsWithoutRef<typeof PaperCard>
>((props, ref) => (
  <PaperCard ref={ref} {...props} />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  React.ElementRef<typeof View>,
  React.ComponentPropsWithoutRef<typeof View>
>(({ children, ...props }, ref) => (
  <View ref={ref} style={{ padding: 16 }} {...props}>
    {children}
  </View>
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  React.ElementRef<typeof PaperCard.Title>,
  React.ComponentPropsWithoutRef<typeof PaperCard.Title>
>((props, ref) => (
  <PaperCard.Title ref={ref} {...props} />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  React.ElementRef<typeof View>,
  React.ComponentPropsWithoutRef<typeof View> & { children: React.ReactNode }
>(({ children, ...props }, ref) => (
  <View ref={ref} {...props}>
    {children}
  </View>
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  React.ElementRef<typeof PaperCard.Content>,
  React.ComponentPropsWithoutRef<typeof PaperCard.Content>
>((props, ref) => (
  <PaperCard.Content ref={ref} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  React.ElementRef<typeof View>,
  React.ComponentPropsWithoutRef<typeof View>
>(({ children, ...props }, ref) => (
  <View ref={ref} style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }} {...props}>
    {children}
  </View>
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
