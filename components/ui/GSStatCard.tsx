import React from 'react';
import { View } from 'react-native';
import { Text } from './text';
import { GSIconButton } from './GSIconButton';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react-native';

interface GSStatCardProps {
  label: string;
  value: string;
  icon: string | LucideIcon;
  className?: string;
}

export const GSStatCard: React.FC<GSStatCardProps> = ({
  label,
  value,
  icon,
  className
}) => {
  return (
    <View className={cn(
      "bg-card rounded-lg p-3 min-w-[100px] items-center",
      "border border-border",
      className
    )}>
      <GSIconButton
        icon={icon}
        size="small"
        interactive={false}
        className="mb-2"
      />
      <Text className="text-xs text-muted-foreground mb-1">{label}</Text>
      <Text className="font-semibold">{value}</Text>
    </View>
  );
};