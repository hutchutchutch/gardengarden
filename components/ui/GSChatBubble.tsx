import React from 'react';
import { Surface, Text, Icon } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';
import { useAppTheme } from '../../config/theme';

type ChatBubbleType = 'ai' | 'teacher' | 'student';

interface GSChatBubbleProps {
  type: ChatBubbleType;
  message: string;
  timestamp: Date;
  showSources?: boolean;
  sources?: string[];
  isRead?: boolean;
  testID?: string;
}

export const GSChatBubble: React.FC<GSChatBubbleProps> = ({
  type,
  message,
  timestamp,
  showSources = false,
  sources = [],
  isRead = false,
  testID = 'gs-chat-bubble',
}) => {
  const theme = useAppTheme();

  const getAlignment = () => {
    return type === 'student' ? 'flex-end' : 'flex-start';
  };

  const getBubbleColor = () => {
    switch (type) {
      case 'teacher':
        return '#4CAF50'; // Green
      case 'ai':
        return '#2196F3'; // Blue
      case 'student':
        return theme.colors.surfaceVariant;
    }
  };

  const getTextColor = () => {
    return type === 'student' ? theme.colors.onSurface : '#FFFFFF';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const color = getBubbleColor();

  return (
    <View 
      style={[
        styles.container,
        { alignItems: getAlignment() },
      ]}
      testID={testID}
    >
      <Surface
        style={[
          styles.bubble,
          type === 'student' ? styles.studentBubble : styles.otherBubble,
          { backgroundColor: color },
        ]}
        elevation={type === 'student' ? 1 : 2}
      >
        <Text 
          variant="bodyMedium" 
          style={[
            styles.message,
            { color: getTextColor() },
          ]}
        >
          {message}
        </Text>

        {showSources && sources.length > 0 && (
          <View style={styles.sourcesContainer}>
            <Text 
              variant="labelSmall" 
              style={[
                styles.sourcesLabel,
                { color: getTextColor(), opacity: 0.8 },
              ]}
            >
              Sources: {sources.join(', ')}
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text 
            variant="labelSmall" 
            style={[
              styles.timestamp,
              { color: getTextColor(), opacity: 0.7 },
            ]}
          >
            {formatTime(timestamp)}
          </Text>
          
          {type === 'student' && (
            <Icon
              source={isRead ? 'check-all' : 'check'}
              size={16}
              color={isRead ? theme.colors.primary : theme.colors.textHint}
            />
          )}
        </View>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  otherBubble: {
    borderBottomLeftRadius: 4,
  },
  studentBubble: {
    borderBottomRightRadius: 4,
  },
  message: {
    lineHeight: 20,
  },
  sourcesContainer: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  sourcesLabel: {
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  timestamp: {
    marginRight: 4,
  },
}); 