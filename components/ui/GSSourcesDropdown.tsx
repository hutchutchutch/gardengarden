import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Linking, Alert } from 'react-native';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react-native';
import { Source } from '@/types';
import colors, { DESIGN_TOKENS } from '@/constants/colors';

interface GSSourcesDropdownProps {
  sources: Source[];
  textColor?: string;
}

export function GSSourcesDropdown({ sources, textColor = '#FFFFFF' }: GSSourcesDropdownProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());

  if (!sources || sources.length === 0) {
    return null;
  }

  const toggleSource = (chunkId: string) => {
    const newExpanded = new Set(expandedSources);
    if (newExpanded.has(chunkId)) {
      newExpanded.delete(chunkId);
    } else {
      newExpanded.add(chunkId);
    }
    setExpandedSources(newExpanded);
  };

  const handleUrlPress = async (url: string) => {
    if (!url) return;
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this URL');
      }
    } catch (error) {
      console.error('Error opening URL:', error);
      Alert.alert('Error', 'Failed to open URL');
    }
  };

  const getPreviewText = (content: string) => {
    // Split content into lines and take first 3 non-empty lines
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    const previewLines = lines.slice(0, 3);
    return previewLines.join('\n');
  };

  return (
    <View style={styles.container}>
      {/* Main dropdown toggle */}
      <Pressable 
        style={styles.dropdownToggle}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Text style={[styles.dropdownText, { color: textColor }]}>
          📚 See sources ({sources.length})
        </Text>
        {isExpanded ? (
          <ChevronUp size={16} color={textColor} />
        ) : (
          <ChevronDown size={16} color={textColor} />
        )}
      </Pressable>

      {/* Expanded sources list */}
      {isExpanded && (
        <View style={styles.sourcesContainer}>
          {sources.map((source, index) => {
            const isSourceExpanded = expandedSources.has(source.chunk_id || source.url || index.toString());
            const sourceKey = source.chunk_id || source.url || index.toString();
            
            return (
              <View key={sourceKey} style={styles.sourceItem}>
                {/* Source preview/toggle */}
                <Pressable 
                  style={styles.sourceToggle}
                  onPress={() => toggleSource(sourceKey)}
                >
                  <View style={styles.sourceHeader}>
                    <Text style={[styles.sourceTitle, { color: textColor }]}>
                      {source.title || 'Reference'} {source.similarity && `(${Math.round(source.similarity * 100)}%)`}
                    </Text>
                    {isSourceExpanded ? (
                      <ChevronUp size={14} color={textColor} />
                    ) : (
                      <ChevronDown size={14} color={textColor} />
                    )}
                  </View>
                  
                  {!isSourceExpanded && (
                    <Text style={[styles.previewText, { color: textColor }]} numberOfLines={3}>
                      {getPreviewText(source.content || source.snippet || 'No content preview available')}
                    </Text>
                  )}
                </Pressable>

                {/* Expanded source content */}
                {isSourceExpanded && (
                  <View style={styles.expandedContent}>
                    <Text style={[styles.fullContent, { color: textColor }]}>
                      {source.content || source.snippet || 'No content available'}
                    </Text>
                    
                    {source.url && (
                      <Pressable 
                        style={styles.urlContainer}
                        onPress={() => handleUrlPress(source.url!)}
                      >
                        <ExternalLink size={14} color={textColor} />
                        <Text style={[styles.urlText, { color: textColor }]}>
                          View full lesson
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  dropdownToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sourcesContainer: {
    marginTop: 8,
    paddingLeft: 8,
  },
  sourceItem: {
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  sourceToggle: {
    padding: 12,
  },
  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sourceTitle: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  previewText: {
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.9,
  },
  expandedContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  fullContent: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  urlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  urlText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
    textDecorationLine: 'underline',
  },
}); 