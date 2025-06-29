import React, { useState } from 'react';
import { View, Pressable, ScrollView, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Trash } from 'lucide-react-native';
import { useAppTheme } from '../../config/theme';
import { GSBadge } from './GSBadge';
import { GSIconButton } from './GSIconButton';
import { GSButton } from './GSButton';
import { GSLoadingSpinner } from './GSLoadingSpinner';
import { GSTextInput } from './GSTextInput';
import { Text } from './text';
import colors from '@/constants/colors';

interface ChunkData {
  id: string;
  content: string;
  chunk_index: number;
  reference_count: number;
}

export interface DocumentItemProps {
  title: string;
  url: string;
  status: 'completed' | 'processing' | 'failed' | 'pending';
  sections?: number;
  processingProgress?: number;
  errorMessage?: string;
  ragReferences?: number;
  chunkCount?: number;
  onRetry?: () => void;
  onEditTitle?: (newTitle: string) => void;
  onTap?: () => void;
  onDelete?: () => void;
  onDeleteChunk?: (chunkId: string) => void;
  isLoading?: boolean;
  // New props for expansion
  expanded?: boolean;
  chunks?: ChunkData[];
  loadingChunks?: boolean;
}

export const GSDocumentItem: React.FC<DocumentItemProps> = ({
  title,
  url,
  status,
  sections,
  processingProgress = 0,
  errorMessage,
  ragReferences,
  chunkCount,
  onRetry,
  onEditTitle,
  onTap,
  onDelete,
  onDeleteChunk,
  isLoading = false,
  expanded = false,
  chunks = [],
  loadingChunks = false,
}) => {
  const theme = useAppTheme();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title || '');
  const [expandedChunks, setExpandedChunks] = useState<Set<string>>(new Set());

  const handleTitleEdit = () => {
    if (editedTitle.trim() && editedTitle !== title) {
      onEditTitle?.(editedTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const toggleChunkExpansion = (chunkId: string) => {
    setExpandedChunks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chunkId)) {
        newSet.delete(chunkId);
      } else {
        newSet.add(chunkId);
      }
      return newSet;
    });
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return theme.colors.primary;
      case 'processing':
        return theme.colors.secondary;
      case 'failed':
        return theme.colors.error;
      default:
        return theme.colors.outline;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return 'check-circle';
      case 'processing':
        return 'loading';
      case 'failed':
        return 'alert-circle';
      default:
        return 'circle-outline';
    }
  };

  const statusColor = getStatusColor();
  const statusIcon = getStatusIcon();

  return (
    <View 
      style={{
        backgroundColor: theme.colors.surfaceVariant,
        borderRadius: theme.borderRadius.sm,
        marginBottom: theme.spacing.xs,
        borderWidth: 0.5,
        borderColor: theme.colors.outlineVariant,
        overflow: 'hidden',
      }}
    >
      {/* Main Document Item */}
      <Pressable
        onPress={onTap}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: pressed ? theme.colors.surfaceVariant + '80' : 'transparent',
          padding: theme.spacing.sm,
          opacity: pressed ? 0.8 : 1.0,
        })}
      >
        {/* Status Icon */}
        <View style={{ marginRight: theme.spacing.sm }}>
          {status === 'processing' ? (
            <GSLoadingSpinner size="small" color={statusColor} />
          ) : (
            <MaterialCommunityIcons
              name={statusIcon as any}
              size={20}
              color={statusColor}
            />
          )}
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          {/* Title or Title Input */}
          {isEditingTitle ? (
            <TextInput
              value={editedTitle}
              onChangeText={setEditedTitle}
              onSubmitEditing={handleTitleEdit}
              onBlur={handleTitleEdit}
              placeholder="Enter title..."
              autoFocus
              style={{
                fontSize: 14,
                fontWeight: '500',
                color: theme.colors.onSurface,
                marginBottom: 4,
                borderWidth: 1,
                borderColor: theme.colors.outline,
                borderRadius: theme.borderRadius.xs,
                paddingHorizontal: 8,
                paddingVertical: 4,
                backgroundColor: theme.colors.surface,
              }}
              placeholderTextColor={theme.colors.onSurfaceVariant}
              returnKeyType="done"
              blurOnSubmit={true}
            />
          ) : (
            <Pressable onPress={() => !title && setIsEditingTitle(true)}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: title ? theme.colors.onSurfaceVariant : theme.colors.outline,
                  marginBottom: 4,
                }}
                numberOfLines={2}
              >
                {title || 'Enter title...'}
              </Text>
            </Pressable>
          )}

          {/* URL */}
          <Text
            style={{
              fontSize: 12,
              color: theme.colors.onSurfaceVariant,
              marginBottom: 4,
            }}
            numberOfLines={1}
          >
            {url}
          </Text>

          {/* Status and Progress */}
          {status === 'processing' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant, marginRight: 8 }}>
                Processing... {Math.round(processingProgress)}%
              </Text>
            </View>
          )}

          {status === 'failed' && errorMessage && (
            <Text
              style={{
                fontSize: 12,
                color: theme.colors.error,
                marginBottom: 4,
              }}
              numberOfLines={2}
            >
              {errorMessage}
            </Text>
          )}

          {/* Stats Row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {status === 'completed' && chunkCount !== undefined && (
              <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant }}>
                Chunks: {chunkCount}
              </Text>
            )}
            
            {status === 'completed' && ragReferences !== undefined && (
              <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant }}>
                • Referenced: {ragReferences}
              </Text>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {status === 'failed' && onRetry && (
            <GSIconButton
              icon="refresh"
              size={20}
              onPress={() => onRetry()}
              color={theme.colors.primary}
            />
          )}
          
          {/* Expansion indicator */}
          {status === 'completed' && (
            <MaterialCommunityIcons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
          )}
        </View>
      </Pressable>

      {/* Expanded Content */}
      {expanded && (
        <View style={{
          borderTopWidth: 1,
          borderTopColor: theme.colors.outlineVariant,
          padding: theme.spacing.sm,
          backgroundColor: theme.colors.surface + '80',
        }}>
          {loadingChunks ? (
            <View style={{ alignItems: 'center', padding: theme.spacing.md }}>
              <GSLoadingSpinner size="small" />
              <Text style={{ 
                marginTop: 8, 
                fontSize: 12, 
                color: theme.colors.onSurfaceVariant 
              }}>
                Loading chunks...
              </Text>
            </View>
          ) : (
            <>
              {/* Chunks List */}
              <View style={{ marginBottom: theme.spacing.md }}>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: theme.spacing.sm,
                }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: theme.colors.onSurface,
                  }}>
                    Content Chunks ({chunks.length})
                  </Text>
                  {onDelete && (
                    <Pressable onPress={onDelete}>
                      <Trash size={20} color={colors.muted} />
                    </Pressable>
                  )}
                </View>
                
                <ScrollView 
                  style={{ maxHeight: 200 }}
                  showsVerticalScrollIndicator={true}
                >
                  {chunks.map((chunk, index) => {
                    const isChunkExpanded = expandedChunks.has(chunk.id);
                    
                    return (
                      <Pressable
                        key={chunk.id}
                        onPress={() => toggleChunkExpansion(chunk.id)}
                        style={({ pressed }) => ({
                          backgroundColor: pressed 
                            ? theme.colors.surface 
                            : theme.colors.surfaceVariant,
                          borderRadius: theme.borderRadius.xs,
                          padding: theme.spacing.sm,
                          marginBottom: theme.spacing.xs,
                          borderLeftWidth: 3,
                          borderLeftColor: chunk.reference_count > 0 ? theme.colors.primary : theme.colors.outline,
                          opacity: pressed ? 0.8 : 1.0,
                        })}
                      >
                        <View style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 4,
                        }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={{
                              fontSize: 12,
                              fontWeight: '500',
                              color: theme.colors.onSurfaceVariant,
                            }}>
                              Chunk #{chunk.chunk_index + 1}
                            </Text>
                            <GSBadge 
                              label={`${chunk.reference_count} refs`}
                              variant={chunk.reference_count > 0 ? 'primary' : 'secondary'}
                              size="small"
                            />
                            <MaterialCommunityIcons
                              name={isChunkExpanded ? 'chevron-up' : 'chevron-down'}
                              size={14}
                              color={theme.colors.onSurfaceVariant}
                            />
                          </View>
                          {onDeleteChunk && (
                            <Pressable onPress={() => onDeleteChunk(chunk.id)}>
                              <Trash size={16} color={colors.muted} />
                            </Pressable>
                          )}
                        </View>
                        <Text
                          style={{
                            fontSize: 12,
                            color: theme.colors.onSurfaceVariant,
                            lineHeight: 16,
                          }}
                          numberOfLines={isChunkExpanded ? undefined : 3}
                        >
                          {chunk.content}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>


            </>
          )}
        </View>
      )}
    </View>
  );
}; 