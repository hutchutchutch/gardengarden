import React, { useState } from 'react';
import { StatusBar } from "expo-status-bar";
import { 
  Platform, 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  KeyboardAvoidingView,
  Pressable,
  TextInput
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GSButton, GSTextInput, GSURLInput, GSChip, GSIconButton } from '@/components/ui';
import { supabase } from '@/config/supabase';



export default function ModalScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const modalType = params.type as string;

  const renderModalContent = () => {
    switch (modalType) {
      case 'create-lesson':
        return <CreateLessonModal />;
      case 'edit-lesson':
        return <EditLessonModal lessonId={params.lessonId as string} />;
      case 'lesson':
        return <LessonDetailModal lessonId={params.lessonId as string} />;
      default:
        return <DefaultModal />;
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {renderModalContent()}
      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
    </KeyboardAvoidingView>
  );
}

// Create Lesson Modal Component
function CreateLessonModal() {
  const router = useRouter();
  const [lessonName, setLessonName] = useState('');
  const [description, setDescription] = useState('');
  const [resources, setResources] = useState<string[]>([]);
  const [currentResourceUrl, setCurrentResourceUrl] = useState('');

  const handleAddResource = () => {
    if (currentResourceUrl.trim()) {
      setResources([...resources, currentResourceUrl.trim()]);
      setCurrentResourceUrl('');
    }
  };

  const handleRemoveResource = (index: number) => {
    setResources(resources.filter((_, i) => i !== index));
  };

  const handleCreateLesson = async () => {
    try {
      // Auto-add any remaining URL before saving
      const finalResources = [...resources];
      if (currentResourceUrl.trim()) {
        finalResources.push(currentResourceUrl.trim());
      }

      const { data, error } = await supabase
        .from('lessons')
        .insert([
          {
            lesson_name: lessonName.trim(),
            lesson_description: description.trim() || null,
            lesson_resources: finalResources.length > 0 ? finalResources : null
          }
        ])
        .select();

      if (error) {
        console.error('Error creating lesson:', error);
        // You might want to show an error toast here
        return;
      }

      console.log('Lesson created successfully:', data);
      
      // Close modal
      router.back();
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  };

  const isFormValid = lessonName.trim();

  return (
    <SafeAreaView style={styles.modalContainer}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.back()} style={styles.closeButton}>
            <MaterialCommunityIcons name="close" size={24} color="#666" />
          </Pressable>
          <Text style={styles.headerTitle}>Create New Lesson</Text>
        </View>
        <GSButton 
          variant="primary" 
          size="small"
          onPress={handleCreateLesson}
          disabled={!isFormValid}
        >
          Create
        </GSButton>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Lesson Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Lesson Name *</Text>
          <GSTextInput
            value={lessonName}
            onChangeText={setLessonName}
            placeholder="e.g., Introduction to Tomato Growing"
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.textArea}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe what students will learn..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Resources */}
        <View style={styles.section}>
          <Text style={styles.label}>Learning Resources</Text>
          <Text style={styles.helperText}>Add URLs to PDFs, videos, or web pages</Text>
          
          <View style={styles.resourceInput}>
            <GSURLInput
              value={currentResourceUrl}
              onChangeText={setCurrentResourceUrl}
              onAdd={handleAddResource}
              placeholder="https://example.com/resource.pdf"
            />
          </View>

          {resources.length > 0 && (
            <View style={styles.resourceList}>
              {resources.map((url, index) => (
                <View key={index} style={styles.resourceItem}>
                  <MaterialCommunityIcons name="link-variant" size={16} color="#666" />
                  <Text style={styles.resourceUrl} numberOfLines={1}>{url}</Text>
                  <Pressable onPress={() => handleRemoveResource(index)}>
                    <MaterialCommunityIcons name="close-circle" size={20} color="#EF4444" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="information" size={20} color="#3B82F6" />
          <Text style={styles.infoText}>
            Resources will be processed by our AI to create lesson content and answer student questions.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Placeholder components for other modal types
function EditLessonModal({ lessonId }: { lessonId: string }) {
  return (
    <View style={styles.placeholderContainer}>
      <Text style={styles.title}>Edit Lesson</Text>
      <Text>Lesson ID: {lessonId}</Text>
    </View>
  );
}

function LessonDetailModal({ lessonId }: { lessonId: string }) {
  return (
    <View style={styles.placeholderContainer}>
      <Text style={styles.title}>Lesson Details</Text>
      <Text>Lesson ID: {lessonId}</Text>
    </View>
  );
}

function DefaultModal() {
  return (
    <View style={styles.placeholderContainer}>
      <Text style={styles.title}>Modal</Text>
      <Text>This is a default modal view.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#111827',
  },
  helperText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    backgroundColor: '#F9FAFB',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipWrapper: {
    marginBottom: 4,
  },
  resourceInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resourceList: {
    marginTop: 12,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  resourceUrl: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
});