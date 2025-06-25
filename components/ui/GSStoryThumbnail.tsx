import React, { useEffect, useState } from 'react';
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
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    // Calculate time remaining for 24-hour countdown
    const calculateTimeRemaining = () => {
      // Parse the timeAgo string to get hours
      const match = timeAgo.match(/(\d+)h/);
      if (match) {
        const hoursAgo = parseInt(match[1]);
        const hoursRemaining = 24 - hoursAgo;
        if (hoursRemaining > 0) {
          setTimeRemaining(`${hoursRemaining}h`);
        } else {
          setTimeRemaining('');
        }
      } else {
        setTimeRemaining('');
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [timeAgo]);

  return (
    <Pressable onPress={onPress} className={cn("relative items-center", className)}>
      <View className="relative">
        {/* Gradient ring effect for unviewed stories using border and shadow */}
        {!viewed && (
          <View className="absolute inset-0 w-[84px] h-[84px] rounded-xl bg-primary/20 -m-0.5">
            <View className="absolute inset-0 rounded-xl border-2 border-primary shadow-lg shadow-primary/50" />
          </View>
        )}
        
        <View className={cn(
          "w-20 h-20 rounded-xl overflow-hidden relative",
          !viewed && "border-2 border-white"
        )}>
          {thumbnailUrl ? (
            <Image 
              source={{ uri: thumbnailUrl }} 
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full bg-gray-200 items-center justify-center">
              <Text className="text-gray-400 text-lg">No Image</Text>
            </View>
          )}
          
          {/* Health badge positioned at top-right */}
          <View className="absolute top-1 right-1">
            <GSHealthBadge size="small" score={healthScore} showLabel={false} />
          </View>
          
          {/* 24-hour countdown timer */}
          {timeRemaining && !viewed && (
            <View className="absolute bottom-1 left-1 bg-black/70 rounded-full px-2 py-0.5">
              <Text className="text-[10px] text-white font-medium">
                {timeRemaining}
              </Text>
            </View>
          )}
        </View>
      </View>
      
      <View className="mt-2 w-20">
        <Text className="text-xs font-medium text-center" numberOfLines={1}>
          {studentName}
        </Text>
        <Text className="text-[10px] text-muted-foreground text-center">
          {timeAgo}
        </Text>
      </View>
    </Pressable>
  );
};