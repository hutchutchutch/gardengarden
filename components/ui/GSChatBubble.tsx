import React, { useState } from 'react';
import { Surface, Text, Icon } from 'react-native-paper';
import { View, StyleSheet, Pressable, Linking } from 'react-native';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react-native';
import { useAppTheme } from '../../config/theme';
import { ShimmerPlaceholder } from './ShimmerPlaceholder';
import { Source } from '@/types';

type ChatBubbleType = 'ai' | 'teacher' | 'student';

interface GSChatBubbleProps {
  type: ChatBubbleType;
  message: string;
  timestamp: string;
  showSources?: boolean;
  sources?: Source[];
  isRead?: boolean;
  isLoading?: boolean;
  testID?: string;
}

export const GSChatBubble: React.FC<GSChatBubbleProps> = ({
  type,
  message,
  timestamp,
  showSources = false,
  sources = [],
  isRead = false,
  isLoading = false,
  testID = 'gs-chat-bubble',
}) => {
  const theme = useAppTheme();
  const [showExpandedSources, setShowExpandedSources] = useState(false);

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

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const handleOpenURL = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  const color = getBubbleColor();

  if (isLoading) {
    return (
      <View 
        style={[
          styles.container,
          { alignItems: getAlignment() },
        ]}
        testID={testID}
      >
        <ShimmerPlaceholder 
          width={200} 
          height={60} 
          borderRadius={18}
          style={type === 'student' ? styles.studentBubble : styles.otherBubble}
        />
      </View>
    );
  }

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

        {showSources && sources.length > 0 && type === 'ai' && (
          <Pressable
            style={[styles.sourcesToggle, { borderTopColor: theme.colors.outline }]}
            onPress={() => setShowExpandedSources(!showExpandedSources)}
          >
            <Text style={[styles.sourcesToggleText, { color: theme.colors.onSurfaceVariant }]}>
              See sources ({sources.length})
            </Text>
            {showExpandedSources ? (
              <ChevronUp size={16} color={theme.colors.onSurfaceVariant} />
            ) : (
              <ChevronDown size={16} color={theme.colors.onSurfaceVariant} />
            )}
          </Pressable>
        )}

        {showExpandedSources && sources && (
          <View style={[styles.sourcesContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
            {sources.map((source, index) => (
              <Pressable
                key={index}
                style={[styles.sourceItem, { borderBottomColor: theme.colors.outline }]}
                onPress={() => handleOpenURL(source.url)}
              >
                <View style={styles.sourceContent}>
                  <Text style={[styles.sourceTitle, { color: theme.colors.onSurface }]}>
                    {source.title}
                  </Text>
                  <Text 
                    style={[styles.sourceSnippet, { color: theme.colors.onSurfaceVariant }]}
                    numberOfLines={2}
                  >
                    {source.snippet}
                  </Text>
                  {source.similarity && (
                    <Text style={[styles.sourceSimilarity, { color: theme.colors.primary }]}>
                      {Math.round(source.similarity * 100)}% relevant
                    </Text>
                  )}
                </View>
                <ExternalLink size={16} color={theme.colors.primary} />
              </Pressable>
            ))}
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
  sourcesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  sourcesToggleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sourcesContainer: {
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  sourceContent: {
    flex: 1,
    marginRight: 8,
  },
  sourceTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  sourceSnippet: {
    fontSize: 12,
    lineHeight: 16,
  },
  sourceSimilarity: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
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