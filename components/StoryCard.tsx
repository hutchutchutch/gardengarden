import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { ClassStory } from '@/types';
import { useStoryStore } from '@/store/story-store';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

interface StoryCardProps {
  story: ClassStory;
}

export default function StoryCard({ story }: StoryCardProps) {
  const { likeStory } = useStoryStore();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleLike = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await likeStory(story.id);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.username}>{story.userName}</Text>
        <Text style={styles.date}>{formatDate(story.date)}</Text>
      </View>
      <Image
        source={{ uri: story.imageUri }}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.contentContainer}>
        <Text style={styles.plantName}>{story.plantName}</Text>
        <Text style={styles.caption}>{story.caption}</Text>
        <View style={styles.actionsContainer}>
          <Pressable style={styles.actionButton} onPress={handleLike}>
            <Feather name="heart" size={20} color={colors.error} style={styles.actionIcon} />
            <Text style={styles.actionText}>{story.likes}</Text>
          </Pressable>
          <View style={styles.actionButton}>
            <Feather name="message-circle" size={20} color={colors.textLight} style={styles.actionIcon} />
            <Text style={styles.actionText}>{story.comments.length}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  date: {
    fontSize: 14,
    color: colors.textLight,
  },
  image: {
    width: '100%',
    height: 250,
  },
  contentContainer: {
    padding: 12,
  },
  plantName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  caption: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionIcon: {
    marginRight: 4,
  },
  actionText: {
    fontSize: 14,
    color: colors.textLight,
  },
});