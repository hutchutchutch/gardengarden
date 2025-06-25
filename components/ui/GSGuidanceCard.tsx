import React, { useState } from 'react';
import { Card, Text, IconButton, Divider } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';
import { useAppTheme } from '../../config/theme';

interface GSGuidanceCardProps {
  emoji: string;
  title: string;
  content: string;
  sources?: string[];
  onSourcePress?: (source: string) => void;
  testID?: string;
}

export const GSGuidanceCard: React.FC<GSGuidanceCardProps> = ({
  emoji,
  title,
  content,
  sources = [],
  onSourcePress,
  testID = 'gs-guidance-card',
}) => {
  const theme = useAppTheme();
  const [expanded, setExpanded] = useState(false);

  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <Card
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.primaryContainer,
        },
      ]}
      testID={testID}
    >
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <View style={styles.emojiContainer}>
            <Text style={styles.emoji}>{emoji}</Text>
          </View>
          
          <View style={styles.titleContainer}>
            <Text 
              variant="titleMedium" 
              style={[styles.title, { color: theme.colors.onSurface }]}
              numberOfLines={2}
            >
              {title}
            </Text>
          </View>
        </View>

        <Text 
          variant="bodyMedium" 
          style={[styles.contentText, { color: theme.colors.onSurfaceVariant }]}
          numberOfLines={expanded ? undefined : 3}
        >
          {content}
        </Text>

        {sources.length > 0 && (
          <>
            <View style={styles.footer}>
              <Text 
                variant="labelSmall" 
                style={[styles.sourcesLabel, { color: theme.colors.textHint }]}
              >
                Sources ({sources.length})
              </Text>
              
              <IconButton
                icon={expanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                onPress={handleToggleExpand}
                style={styles.expandButton}
                testID={`${testID}-expand`}
              />
            </View>

            {expanded && (
              <View style={styles.sourcesContainer}>
                <Divider style={{ backgroundColor: theme.colors.outlineVariant }} />
                
                {sources.map((source, index) => (
                  <Text
                    key={index}
                    variant="bodySmall"
                    style={[
                      styles.source,
                      { color: theme.colors.primary },
                    ]}
                    onPress={() => onSourcePress?.(source)}
                    testID={`${testID}-source-${index}`}
                  >
                    • {source}
                  </Text>
                ))}
              </View>
            )}
          </>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 1,
    borderWidth: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  emojiContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emoji: {
    fontSize: 24,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontWeight: '600',
    lineHeight: 24,
  },
  contentText: {
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourcesLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  expandButton: {
    margin: -8,
  },
  sourcesContainer: {
    marginTop: 8,
  },
  source: {
    marginTop: 8,
    textDecorationLine: 'underline',
  },
}); 