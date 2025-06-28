import React, { useState } from 'react';
import { Surface, Text, Icon } from 'react-native-paper';
import { View, StyleSheet, Pressable, Linking, ViewStyle } from 'react-native';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react-native';
import { useAppTheme } from '../../config/theme';
import { ShimmerPlaceholder } from './ShimmerPlaceholder';
import { Source } from '@/types';

type ChatBubbleType = 'ai' | 'teacher' | 'student' | 'document';
type UserRole = 'student' | 'teacher';

interface GSChatBubbleProps {
  type: ChatBubbleType;
  message: string;
  timestamp: string;
  currentUserRole?: 'student' | 'teacher';
  showSources?: boolean;
  sources?: Source[];
  isRead?: boolean;
  isLoading?: boolean;
  testID?: string;
  documentUrl?: string; // For document type bubbles
  onDocumentPress?: () => void; // For document type bubbles
}

export const GSChatBubble: React.FC<GSChatBubbleProps> = ({
  type,
  message,
  timestamp,
  currentUserRole = 'student',
  showSources = false,
  sources = [],
  isRead = false,
  isLoading = false,
  testID = 'gs-chat-bubble',
  documentUrl,
  onDocumentPress,
}) => {
  const theme = useAppTheme();
  const [showExpandedSources, setShowExpandedSources] = useState(false);

  // Helper function to determine if this is the current user's message
  const isCurrentUserMessage = (): boolean => {
    if (currentUserRole === 'teacher' && type === 'teacher') return true;
    if (currentUserRole === 'student' && type === 'student') return true;
    return false;
  };

  const getAlignment = (): 'flex-start' | 'flex-end' => {
    // Document bubbles always appear on the left (from teacher)
    if (type === 'document') return 'flex-start';
    
    // Current user's messages always on the right
    if (isCurrentUserMessage()) return 'flex-end';
    
    // AI messages: right for teachers, left for students
    if (type === 'ai') {
      return currentUserRole === 'teacher' ? 'flex-end' : 'flex-start';
    }
    
    // Other user's messages always on the left
    return 'flex-start';
  };

  const getBubbleColor = () => {
    if (type === 'document') return '#F59E0B'; // Orange for document references
    
    // Current user's messages are always gray
    if (isCurrentUserMessage()) return '#E5E7EB';
    
    // AI messages are always purple
    if (type === 'ai') return '#A78BFA';
    
    // Other user's messages are always blue
    return '#3B82F6';
  };

  const getTextColor = () => {
    if (type === 'document') return '#FFFFFF'; // White text on orange
    
    // Current user's messages have dark text on gray background
    if (isCurrentUserMessage()) return '#374151';
    
    // AI and other user messages have white text on colored backgrounds
    return '#FFFFFF';
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

  const getBubbleStyle = (): ViewStyle => {
    const alignment = getAlignment();
    const baseRadius = theme.borderRadius.lg;
    
    return {
      backgroundColor: getBubbleColor(),
      borderRadius: baseRadius,
      // Reduce the corner radius for the appropriate corner based on alignment
      borderTopLeftRadius: alignment === 'flex-start' ? baseRadius : baseRadius,
      borderTopRightRadius: alignment === 'flex-end' ? baseRadius : baseRadius,
      borderBottomLeftRadius: alignment === 'flex-start' ? theme.borderRadius.xs : baseRadius,
      borderBottomRightRadius: alignment === 'flex-end' ? theme.borderRadius.xs : baseRadius,
      padding: theme.spacing.md,
      maxWidth: '80%',
      minWidth: 100,
    };
  };

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
      {type === 'document' && onDocumentPress ? (
        <Pressable onPress={onDocumentPress}>
          <Surface
            style={getBubbleStyle()}
            elevation={2}
          >
            <Text 
              variant="bodyMedium" 
              style={[
                styles.message,
                { color: getTextColor() },
                styles.documentTitle,
              ]}
            >
              📄 {message}
            </Text>
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
            </View>
          </Surface>
        </Pressable>
      ) : (
        <Surface
          style={getBubbleStyle()}
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
              style={[styles.sourcesToggle, { borderTopColor: 'rgba(255, 255, 255, 0.2)' }]}
              onPress={() => setShowExpandedSources(!showExpandedSources)}
            >
              <Text style={[styles.sourcesToggleText, { color: getTextColor(), opacity: 0.9 }]}>
                See sources ({sources.length})
              </Text>
              {showExpandedSources ? (
                <ChevronUp size={16} color={getTextColor()} style={{ opacity: 0.9 }} />
              ) : (
                <ChevronDown size={16} color={getTextColor()} style={{ opacity: 0.9 }} />
              )}
            </Pressable>
          )}

          {showExpandedSources && sources && (
            <View style={styles.sourcesContainer}>
              {sources.map((source, index) => (
                <Pressable
                  key={index}
                  style={[
                    styles.sourceItem,
                    {
                      backgroundColor: theme.colors.surface,
                      shadowColor: theme.colors.shadow,
                    },
                  ]}
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
      )}
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
  documentTitle: {
    fontWeight: '600',
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
    gap: 8,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
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