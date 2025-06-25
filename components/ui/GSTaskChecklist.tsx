import React from 'react';
import { View } from 'react-native';
import { Text } from './text';
import { GSCheckbox } from './GSCheckbox';
import { GSBadge } from './GSBadge';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  name: string;
  description?: string;
  isCompleted: boolean;
  points?: number;
}

interface GSTaskChecklistProps {
  tasks: Task[];
  onTaskToggle?: (taskId: string) => void;
  className?: string;
}

export const GSTaskChecklist: React.FC<GSTaskChecklistProps> = ({
  tasks,
  onTaskToggle,
  className
}) => {
  return (
    <View className={cn("", className)}>
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={() => onTaskToggle?.(task.id)}
        />
      ))}
    </View>
  );
};

interface TaskItemProps {
  task: Task;
  onToggle?: () => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle }) => {
  return (
    <View className="flex-row items-center py-3 border-b border-border last:border-b-0">
      <GSCheckbox
        checked={task.isCompleted}
        onCheckedChange={onToggle}
        animated={true}
      />
      <View className="flex-1 ml-3">
        <Text className={cn(
          "font-medium",
          task.isCompleted && "line-through text-muted-foreground"
        )}>
          {task.name}
        </Text>
        {task.description && (
          <Text className="text-sm text-muted-foreground mt-1">
            {task.description}
          </Text>
        )}
      </View>
      {task.points && (
        <GSBadge
          label={`+${task.points} pts`}
          variant="secondary"
          size="small"
        />
      )}
    </View>
  );
};