import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { ChevronUp, ChevronDown, Check } from 'lucide-react-native';
import colors from '@/constants/colors';
import { supabase } from '@/config/supabase';

interface LessonDocument {
  id: string;
  title: string;
  url: string;
  processing_status: string;
}

interface GSReferenceDocumentsProps {
  lessonId?: string;
  selectedDocuments: string[];
  onDocumentToggle: (documentId: string) => void;
}

export const GSReferenceDocuments: React.FC<GSReferenceDocumentsProps> = ({
  lessonId,
  selectedDocuments,
  onDocumentToggle,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [documents, setDocuments] = useState<LessonDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [animatedHeight] = useState(new Animated.Value(0));

  useEffect(() => {
    if (lessonId) {
      fetchDocuments();
    }
  }, [lessonId]);

  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: isExpanded ? documents.length * 50 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isExpanded, documents.length]);

  const fetchDocuments = async () => {
    if (!lessonId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('lesson_urls')
        .select('id, title, url, processing_status')
        .eq('lesson_id', lessonId)
        .eq('processing_status', 'completed'); // Only show completed documents

      if (error) {
        console.error('Error fetching lesson documents:', error);
        return;
      }

      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleDocumentToggle = (documentId: string) => {
    onDocumentToggle(documentId);
  };

  if (!lessonId || documents.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>Reference documents: </Text>
        <Text style={styles.noDocuments}>No documents available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.header} onPress={toggleExpanded}>
        <Text style={styles.label}>Reference documents: </Text>
        <View style={styles.headerRight}>
          <Text style={styles.selectedCount}>
            {selectedDocuments.length} selected
          </Text>
          {isExpanded ? (
            <ChevronUp size={20} color={colors.primary} />
          ) : (
            <ChevronDown size={20} color={colors.primary} />
          )}
        </View>
      </Pressable>

      <Animated.View style={[styles.dropdown, { height: animatedHeight }]}>
        {documents.map((document) => (
          <Pressable
            key={document.id}
            style={styles.documentItem}
            onPress={() => handleDocumentToggle(document.id)}
          >
            <Text style={styles.documentTitle} numberOfLines={1}>
              {document.title}
            </Text>
            {selectedDocuments.includes(document.id) && (
              <Check size={16} color={colors.primary} />
            )}
          </Pressable>
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  selectedCount: {
    fontSize: 14,
    color: colors.textLight,
  },
  noDocuments: {
    fontSize: 14,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  dropdown: {
    overflow: 'hidden',
    backgroundColor: colors.backgroundLight,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  documentTitle: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    marginRight: 8,
  },
}); 