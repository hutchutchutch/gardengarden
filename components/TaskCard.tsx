import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Task } from '@/types';
import { Feather } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { useTaskStore } from '@/store/task-store';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

interface TaskCardProps {
  task: Task;
}

export default function TaskCard({ task }: TaskCardProps) {
  const { toggleTaskCompletion } = useTaskStore();

  const handleToggleComplete = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await toggleTaskCompletion(task.id);
  };

  const getTaskIcon = () => {
    switch (task.type) {
      case 'water':
        return <Feather name="droplet" size={20} color={colors.primary} />;
      case 'fertilize':
        return <Feather name="star" size={20} color={colors.primary} />;
      case 'prune':
        return <Feather name="scissors" size={20} color={colors.primary} />;
      case 'harvest':
        return <Feather name="package" size={20} color={colors.primary} />;
      default:
        return <Feather name="alert-circle" size={20} color={colors.primary} />;
    }
  };

  const getPriorityColor = () => {
    switch (task.priority) {
      case 'high':
        return colors.error;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.success;
      default:
        return colors.gray;
    }
  };

  return (
    <Pressable
      style={[styles.container, task.completed && styles.completedContainer]}
      onPress={handleToggleComplete}
    >
      <View style={styles.iconContainer}>
        {getTaskIcon()}
      </View>
      <View style={styles.contentContainer}>
        <Text style={[styles.title, task.completed && styles.completedText]}>
          {task.title}
        </Text>
        <Text style={[styles.description, task.completed && styles.completedText]}>
          {task.description}
        </Text>
      </View>
      <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor() }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  completedContainer: {
    opacity: 0.7,
    backgroundColor: colors.grayLight,
  },
  iconContainer: {
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: colors.textLight,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: colors.gray,
  },
  priorityIndicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
});