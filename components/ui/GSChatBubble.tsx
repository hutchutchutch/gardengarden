import React, { useState } from 'react';
import { Surface, Text, Icon } from 'react-native-paper';
import { View, StyleSheet, Pressable, Linking, ViewStyle } from 'react-native';
import { ChevronDown, ChevronUp, ExternalLink, BookOpen } from 'lucide-react-native';
import { useAppTheme } from '../../config/theme';
import { ShimmerPlaceholder } from './ShimmerPlaceholder';
import { Source } from '@/types';
import { DESIGN_TOKENS } from '@/constants/colors';

type ChatBubbleType = 'ai' | 'teacher' | 'student' | 'document' | 'source';
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

// Helper component for source lesson URL bubbles
interface SourceLessonBubbleProps {
  lessonUrl: {
    id: string;
    title: string;
    url: string;
    chunks: Array<{
      content: string;
      similarity: number;
      chunk_id: string;
    }>;
  };
  timestamp: string;
}

const SourceLessonBubble: React.FC<SourceLessonBubbleProps> = ({
  lessonUrl,
  timestamp,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const theme = useAppTheme();

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

  // Get first 2 lines of content from the most relevant chunk
  const mostRelevantChunk = lessonUrl.chunks && lessonUrl.chunks.length > 0 
    ? lessonUrl.chunks.sort((a, b) => b.similarity - a.similarity)[0]
    : null;
  
  if (!mostRelevantChunk) {
    console.warn('No relevant chunk found for lesson URL:', lessonUrl.title);
    return null;
  }
  
  const contentLines = mostRelevantChunk.content?.split('\n').filter(line => line.trim()) || [];
  const previewLines = contentLines.slice(0, 2).join('\n');
  const hasMoreContent = contentLines.length > 2;

  return (
    <View style={styles.sourceContainer}>
      <Pressable onPress={() => handleOpenURL(lessonUrl.url)} style={styles.sourcePressable}>
        <Surface
          style={styles.sourceBubble}
          elevation={1}
        >
          {/* Header with title and relevance */}
          <View style={styles.sourceHeaderNew}>
            <View style={styles.sourceTitleRow}>
              <BookOpen size={16} color={DESIGN_TOKENS.primary} style={styles.bookIcon} />
              <Text 
                variant="bodyMedium" 
                style={[styles.sourceTitleNew, { color: DESIGN_TOKENS.primaryDark }]}
                numberOfLines={2}
              >
                {lessonUrl.title}
              </Text>
              <ExternalLink size={14} color={DESIGN_TOKENS.muted} />
            </View>
            <Text 
              variant="labelSmall" 
              style={[styles.relevanceTextNew, { color: DESIGN_TOKENS.primary }]}
            >
              {Math.round(mostRelevantChunk.similarity * 100)}% relevant
            </Text>
          </View>

          {/* Content preview */}
          <Text 
            variant="bodySmall" 
            style={[styles.sourceContentNew, { color: DESIGN_TOKENS.primaryDark }]}
          >
            {previewLines}
          </Text>

          {/* Expand button */}
          {hasMoreContent && (
            <Pressable
              style={styles.expandButtonNew}
              onPress={() => setIsExpanded(!isExpanded)}
            >
              <Text style={[styles.expandTextNew, { color: DESIGN_TOKENS.primary }]}>
                See more
              </Text>
              {isExpanded ? (
                <ChevronUp size={16} color={DESIGN_TOKENS.primary} />
              ) : (
                <ChevronDown size={16} color={DESIGN_TOKENS.primary} />
              )}
            </Pressable>
          )}

          {/* Expanded content */}
          {isExpanded && (
            <Text 
              variant="bodySmall" 
              style={[styles.sourceContentNew, { color: DESIGN_TOKENS.primaryDark, marginTop: 8 }]}
            >
              {contentLines.slice(2).join('\n')}
            </Text>
          )}

          {/* Footer with timestamp */}
          <View style={styles.sourceFooterNew}>
            <Text 
              variant="labelSmall" 
              style={[styles.timestampNew, { color: DESIGN_TOKENS.muted }]}
            >
              {formatTime(timestamp)}
            </Text>
          </View>
        </Surface>
      </Pressable>
    </View>
  );
};

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
    
    // Current user's messages are always muted gray
    if (isCurrentUserMessage()) return DESIGN_TOKENS.muted + '20'; // 12% opacity
    
    // AI messages use secondary colors (purple)
    if (type === 'ai') return DESIGN_TOKENS.secondaryLight;
    
    // Other user's messages use primary colors (green) 
    return DESIGN_TOKENS.primary;
  };

  const getTextColor = () => {
    if (type === 'document') return '#FFFFFF'; // White text on orange
    
    // Current user's messages have dark text on light gray background
    if (isCurrentUserMessage()) return DESIGN_TOKENS.primaryDark;
    
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
    const baseRadius = 16; // Use hardcoded border radius
    
    return {
      backgroundColor: getBubbleColor(),
      borderRadius: baseRadius,
      // Reduce the corner radius for the appropriate corner based on alignment
      borderTopLeftRadius: alignment === 'flex-start' ? baseRadius : baseRadius,
      borderTopRightRadius: alignment === 'flex-end' ? baseRadius : baseRadius,
      borderBottomLeftRadius: alignment === 'flex-start' ? 4 : baseRadius,
      borderBottomRightRadius: alignment === 'flex-end' ? 4 : baseRadius,
      padding: theme.spacing.md,
      maxWidth: '80%',
      minWidth: 100,
    };
  };

  // Group sources by lesson_url_id
  const groupSourcesByLessonUrl = (sources: Source[]) => {
    const grouped: { [key: string]: { 
      id: string; 
      title: string; 
      url: string; 
      chunks: Array<{
        content: string;
        similarity: number;
        chunk_id: string;
      }>;
    } } = {};

    sources.forEach(source => {
      const lessonUrlId = source.lesson_url_id || 'unknown';
      if (!grouped[lessonUrlId]) {
        grouped[lessonUrlId] = {
          id: lessonUrlId,
          title: source.title,
          url: source.url,
          chunks: []
        };
      }
      
      if (source.content && source.chunk_id) {
        grouped[lessonUrlId].chunks.push({
          content: source.content,
          similarity: source.similarity || 0,
          chunk_id: source.chunk_id
        });
      }
    });

    return Object.values(grouped);
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

  const sourceLessonUrls = groupSourcesByLessonUrl(sources);

  return (
    <>
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
                  See sources ({sourceLessonUrls.length})
                </Text>
                {showExpandedSources ? (
                  <ChevronUp size={16} color={getTextColor()} style={{ opacity: 0.9 }} />
                ) : (
                  <ChevronDown size={16} color={getTextColor()} style={{ opacity: 0.9 }} />
                )}
              </Pressable>
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
                  color={isRead ? theme.colors.primary : theme.colors.muted}
                />
              )}
            </View>
          </Surface>
        )}
      </View>

      {/* Render source lesson URL bubbles below the main message */}
      {showExpandedSources && sourceLessonUrls.length > 0 && type === 'ai' && (
        <>
          {sourceLessonUrls.map((lessonUrl) => (
            <SourceLessonBubble
              key={lessonUrl.id}
              lessonUrl={lessonUrl}
              timestamp={timestamp}
            />
          ))}
        </>
      )}
    </>
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  timestamp: {
    marginRight: 4,
  },
  // Source bubble styles
  sourceContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    alignItems: 'flex-start',
  },
  sourcePressable: {
    width: '100%',
  },
  sourceBubble: {
    width: '100%',
    maxWidth: '85%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: DESIGN_TOKENS.background,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.muted + '40',
  },
  sourceHeaderNew: {
    marginBottom: 12,
  },
  sourceTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  bookIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  sourceTitleNew: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginRight: 8,
  },
  relevanceTextNew: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 24, // Align with text content below icon
  },
  sourceContentNew: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  expandButtonNew: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  expandTextNew: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  sourceFooterNew: {
    alignItems: 'flex-end',
  },
  timestampNew: {
    fontSize: 11,
  },
  // Legacy source bubble styles (keeping for compatibility)
  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  sourceTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  sourceContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  expandText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  relevanceText: {
    fontSize: 12,
    fontWeight: '500',
  },
});