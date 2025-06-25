import React from 'react';
import { View, Image, Pressable } from 'react-native';
import { Text } from './text';
import { GSHealthBadge } from './GSHealthBadge';
import { cn } from '@/lib/utils';

interface GSStoryThumbnailProps {
  thumbnailUrl: string;
  healthScore: number;
  studentName: string;
  timeAgo: string;
  viewed?: boolean;
  onPress?: () => void;
  className?: string;
}

export const GSStoryThumbnail: React.FC<GSStoryThumbnailProps> = ({
  thumbnailUrl,
  healthScore,
  studentName,
  timeAgo,
  viewed = false,
  onPress,
  className
}) => {
  return (
    <Pressable onPress={onPress} className={cn("relative", className)}>
      <View className={cn(
        "w-20 h-20 rounded-lg overflow-hidden",
        !viewed && "border-2 border-primary"
      )}>
        <Image 
          source={{ uri: thumbnailUrl }} 
          className="w-full h-full"
          resizeMode="cover"
        />
        <View className="absolute top-1 right-1">
          <GSHealthBadge size="small" score={healthScore} />
        </View>
      </View>
      <View className="mt-1">
        <Text className="text-xs font-medium text-center" numberOfLines={1}>
          {studentName}
        </Text>
        <Text className="text-xs text-muted-foreground text-center">
          {timeAgo}
        </Text>
      </View>
    </Pressable>
  );
};