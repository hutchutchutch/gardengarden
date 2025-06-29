import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Modal, Portal, Surface, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../config/theme';
import { GSButton } from './GSButton';
import { GSIconButton } from './GSIconButton';
import { GSLoadingSpinner } from './GSLoadingSpinner';
import { GSBadge } from './GSBadge';
import { Text } from './text';
import { LessonService } from '../../services/lesson-service';

interface ChunkDetails {
  id: string;
  content: string;
  chunk_index: number;
  reference_count: number;
  metadata?: any;
}

interface DocumentDetails {
  document: {
    id: string;
    title: string;
    url: string;
    status: 'completed' | 'processing' | 'failed' | 'pending';
    sections: number;
    rag_references: number;
    processing_progress: number;
    error_message?: string;
    chunk_count?: number;
  };
  chunks: ChunkDetails[];
}

interface GSDocumentDetailsModalProps {
  visible: boolean;
  documentId: string | null;
  onClose: () => void;
  onDelete?: (documentId: string) => void;
  onRetry?: (documentId: string) => void;
}

export const GSDocumentDetailsModal: React.FC<GSDocumentDetailsModalProps> = ({
  visible,
  documentId,
  onClose,
  onDelete,
  onRetry,
}) => {
  const theme = useAppTheme();
  const [details, setDetails] = useState<DocumentDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && documentId) {
      loadDocumentDetails();
    }
  }, [visible, documentId]);

  const loadDocumentDetails = async () => {
    if (!documentId) return;
    
    setLoading(true);
    try {
      const result = await LessonService.getDocumentDetails(documentId);
      if (result) {
        setDetails(result);
      }
    } catch (error) {
      console.error('Error loading document details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!details?.document.id) return;
    
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete?.(details.document.id);
            onClose();
          },
        },
      ]
    );
  };

  const handleRetry = () => {
    if (!details?.document.id) return;
    onRetry?.(details.document.id);
    onClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return theme.colors.excellent;
      case 'processing':
        return theme.colors.brandSecondary;
      case 'failed':
        return theme.colors.error;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const getStatusIcon = (status: string) => {
    const iconSize = 24;
    switch (status) {
      case 'completed':
        return <MaterialCommunityIcons name="check-circle" size={iconSize} color={theme.colors.excellent} />;
      case 'processing':
        return <GSLoadingSpinner size="small" />;
      case 'failed':
        return <MaterialCommunityIcons name="alert-circle" size={iconSize} color={theme.colors.error} />;
      default:
        return <MaterialCommunityIcons name="file-document-outline" size={iconSize} color={theme.colors.onSurfaceVariant} />;
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={[
          styles.modalContainer,
          { 
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.lg,
          }
        ]}
      >
        <Surface style={styles.headerContainer}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
              Document Details
            </Text>
            <GSIconButton
              icon="close"
              size={24}
              onPress={onClose}
            />
          </View>
        </Surface>

        {loading ? (
          <View style={styles.loadingContainer}>
            <GSLoadingSpinner size="large" />
            <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
              Loading document details...
            </Text>
          </View>
        ) : details ? (
          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            {/* Document Info */}
            <View style={styles.section}>
              <View style={styles.documentHeader}>
                {getStatusIcon(details.document.status)}
                <View style={styles.documentInfo}>
                  <Text style={[styles.documentTitle, { color: theme.colors.onSurface }]} numberOfLines={2}>
                    {details.document.title || 'No title'}
                  </Text>
                  <Text style={[styles.documentUrl, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
                    {details.document.url}
                  </Text>
                </View>
              </View>

              <View style={styles.statusRow}>
                <GSBadge 
                  label={details.document.status.toUpperCase()}
                  variant={details.document.status === 'completed' ? 'primary' : 
                          details.document.status === 'failed' ? 'error' : 'secondary'}
                />
                {details.document.status === 'processing' && (
                  <Text style={[styles.progressText, { color: getStatusColor(details.document.status) }]}>
                    {details.document.processing_progress}% complete
                  </Text>
                )}
              </View>

              {details.document.error_message && (
                <View style={[styles.errorContainer, { backgroundColor: theme.colors.errorContainer }]}>
                  <MaterialCommunityIcons 
                    name="alert-circle" 
                    size={16} 
                    color={theme.colors.onErrorContainer} 
                  />
                  <Text style={[styles.errorText, { color: theme.colors.onErrorContainer }]}>
                    {details.document.error_message}
                  </Text>
                </View>
              )}

              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Total Chunks
                  </Text>
                  <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>
                    {details.chunks.length}
                  </Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                    References
                  </Text>
                  <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>
                    {details.document.rag_references}
                  </Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Sections
                  </Text>
                  <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>
                    {details.document.sections}
                  </Text>
                </View>
              </View>
            </View>

            <Divider style={{ marginVertical: 16 }} />

            {/* Chunks List */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Content Chunks ({details.chunks.length})
              </Text>
              
              {details.chunks.map((chunk, index) => (
                <View 
                  key={chunk.id} 
                  style={[
                    styles.chunkCard, 
                    { 
                      backgroundColor: theme.colors.surfaceVariant,
                      borderColor: chunk.reference_count > 0 ? theme.colors.primary : 'transparent',
                      borderWidth: chunk.reference_count > 0 ? 1 : 0,
                    }
                  ]}
                >
                  <View style={styles.chunkHeader}>
                    <Text style={[styles.chunkIndex, { color: theme.colors.onSurfaceVariant }]}>
                      Chunk #{chunk.chunk_index + 1}
                    </Text>
                    {chunk.reference_count > 0 && (
                      <GSBadge 
                        label={`${chunk.reference_count} refs`}
                        variant="primary"
                      />
                    )}
                  </View>
                  <Text 
                    style={[styles.chunkContent, { color: theme.colors.onSurface }]}
                    numberOfLines={3}
                  >
                    {chunk.content}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        ) : (
          <View style={styles.errorStateContainer}>
            <MaterialCommunityIcons 
              name="alert-circle" 
              size={48} 
              color={theme.colors.error} 
            />
            <Text style={[styles.errorStateText, { color: theme.colors.onSurface }]}>
              Failed to load document details
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        {details && (
          <View style={[styles.actionContainer, { borderTopColor: theme.colors.outline }]}>
            <View style={styles.actionRow}>
              {details.document.status === 'failed' && onRetry && (
                <GSButton
                  variant="primary"
                  size="medium"
                  onPress={handleRetry}
                  icon="refresh"
                >
                  Retry
                </GSButton>
              )}
              {onDelete && (
                <GSButton
                  variant="secondary"
                  size="medium"
                  onPress={handleDelete}
                  icon="delete"
                  style={{ marginLeft: 8 }}
                >
                  Delete
                </GSButton>
              )}
            </View>
          </View>
        )}
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    margin: 20,
    maxHeight: '90%',
    elevation: 8,
  },
  headerContainer: {
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  documentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  documentUrl: {
    fontSize: 14,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 14,
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  chunkCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  chunkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  chunkIndex: {
    fontSize: 12,
    fontWeight: '500',
  },
  chunkContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  errorStateContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorStateText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  actionContainer: {
    borderTopWidth: 1,
    padding: 16,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
}); 