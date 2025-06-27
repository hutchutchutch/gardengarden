import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { Send, ImageIcon } from 'lucide-react-native';
import { SegmentedButtons } from 'react-native-paper';
import colors from '@/constants/colors';
import { useAIStore } from '@/store/ai-store';
import { useColorScheme } from 'react-native';
import { usePlantStore } from '@/store/plant-store';
import { useTaskStore } from '@/store/task-store';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { AIPlantAnalysis } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { GSChatBubble } from './ui/GSChatBubble';
import { GSReferenceDocuments } from './ui/GSReferenceDocuments';
import { PhotoService } from '@/services/photo-service';
import { supabase } from '@/config/supabase';
import { useMode } from '@/contexts/ModeContext';

interface AIChatProps {
  analysis?: AIPlantAnalysis | null;
  photoUri?: string;
  plantId?: string;
  initialMode?: 'ai' | 'teacher';
  threadId?: string;
  studentId?: string;
}

export default function AIChat({ analysis, photoUri, plantId, initialMode = 'ai', threadId, studentId }: AIChatProps) {
  const [message, setMessage] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(photoUri || null);
  const [mode, setMode] = useState<'ai' | 'teacher'>(initialMode);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [documentsData, setDocumentsData] = useState<{[key: string]: {title: string, url: string}}>({});
  const [teacherLessonId, setTeacherLessonId] = useState<string | null>(null);
  const { messages, isLoading, sendMessage, fetchMessages, initializeThread, initializeDefaultThread, initializeExistingThread } = useAIStore();
  const { user } = useAuth();
  const { plants } = usePlantStore();
  const scrollViewRef = useRef<ScrollView>(null);
  const isTeacher = user?.role === 'teacher';
  const { isTeacherMode } = useMode();

  // Get the current lesson ID from the plant for students, or fetch it for teachers
  const currentPlant = plants.find(p => p.id === plantId);
  const lessonId = currentPlant?.lessonId || teacherLessonId || undefined;

  // Fetch the teacher's active lesson ID
  useEffect(() => {
    const fetchTeacherActiveLesson = async () => {
      if (user?.role === 'teacher' && !teacherLessonId) {
        try {
          // Get the teacher's class
          const { data: teacherClass, error: classError } = await supabase
            .from('classes')
            .select('id')
            .eq('teacher_id', user.id)
            .single();

          if (teacherClass && !classError) {
            // Get the active lesson for this class
            const { data: activeLesson, error: lessonError } = await supabase
              .from('lessons')
              .select('id')
              .eq('class_id', teacherClass.id)
              .eq('status', 'active')
              .single();

            if (activeLesson && !lessonError) {
              setTeacherLessonId(activeLesson.id);
            }
          }
        } catch (error) {
          console.error('Error fetching teacher active lesson:', error);
        }
      }
    };

    fetchTeacherActiveLesson();
  }, [user?.role, user?.id, teacherLessonId]);

  useEffect(() => {
    const initializeChat = async () => {
      if (user) {
        // If threadId is provided (from teacher interface), use existing thread
        if (threadId) {
          await initializeExistingThread(threadId);
          return;
        }

        // Otherwise, get the teacher for this student's active lesson
        if (user.role === 'student') {
          try {
            // Query to get the teacher for the student's active lesson
            const { data: studentLessonData, error } = await supabase
              .from('plants')
              .select(`
                lesson_id,
                lessons!inner(
                  id,
                  name,
                  class_id,
                  classes!inner(
                    teacher_id
                  )
                )
              `)
              .eq('student_id', user.id)
              .eq('lessons.status', 'active')
              .single();

            if (studentLessonData && !error) {
              const teacherId = (studentLessonData.lessons as any).classes.teacher_id;
              // Initialize thread with the actual teacher
              await initializeThread(user.id, teacherId);
            } else {
              // Fallback to default thread for testing
              await initializeDefaultThread();
            }
          } catch (error) {
            console.error('Error getting teacher for student lesson:', error);
            // Fallback to default thread
            await initializeDefaultThread();
          }
        } else {
          // For teachers or other roles, use default thread
          await initializeDefaultThread();
        }
      }
    };

    initializeChat();
    
    // If we have analysis results, show them
    if (analysis && mode === 'ai') {
      const analysisMessage = `🌱 Plant Analysis Complete!\n\nHealth Score: ${analysis.healthScore}/100\nGrowth Stage: ${analysis.growthStage}\n\n${
        analysis.issues.length > 0 
          ? `Issues Found:\n${analysis.issues.map(i => `• ${i}`).join('\n')}\n\n` 
          : 'No issues detected! Your plant looks healthy.\n\n'
      }Recommendations:\n${analysis.recommendations.map(r => `• ${r}`).join('\n')}`;
      
      sendMessage(analysisMessage, photoUri, 'ai', lessonId, plantId);
    }
  }, [user, mode]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
    
    // Hide AI loading state when a new AI message arrives
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant' && isAIThinking) {
      setIsAIThinking(false);
    }
  }, [messages, isAIThinking]);

  // Reset AI loading state when mode changes to prevent shimmer on switch
  useEffect(() => {
    setIsAIThinking(false);
  }, [mode]);

  // Fetch documents data when documents are selected
  useEffect(() => {
    const fetchDocumentsData = async () => {
      if (selectedDocuments.length > 0) {
        try {
          const { data, error } = await supabase
            .from('lesson_urls')
            .select('id, title, url')
            .in('id', selectedDocuments);

          if (data && !error) {
            const docsMap = data.reduce((acc, doc) => {
              acc[doc.id] = { title: doc.title, url: doc.url };
              return acc;
            }, {} as {[key: string]: {title: string, url: string}});
            setDocumentsData(docsMap);
          }
        } catch (error) {
          console.error('Error fetching documents data:', error);
        }
      }
    };

    fetchDocumentsData();
  }, [selectedDocuments]);

  const handleDocumentToggle = (documentId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId) 
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  const handleDocumentPress = async (url: string) => {
    // Open the document URL
    if (url) {
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          console.error('Cannot open URL:', url);
        }
      } catch (error) {
        console.error('Error opening URL:', error);
      }
    }
  };

  const handleSend = async () => {
    if (message.trim() === '' && !imageUri) return;
    
    // If current user is a teacher, send the message and any selected documents
    if (user?.role === 'teacher') {
      await sendMessage(message, imageUri || undefined, 'teacher', lessonId, plantId);
      
      // Send document reference messages for each selected document
      for (const docId of selectedDocuments) {
        const docData = documentsData[docId];
        if (docData) {
          // Create a document message with URL embedded in content
          const documentContent = `DOCUMENT_REF:${docData.url}:${docData.title}`;
          await sendMessage(documentContent, undefined, 'teacher', lessonId, plantId);
        }
      }
      
      setMessage('');
      setImageUri(null);
      setSelectedDocuments([]); // Clear selected documents after sending
      return;
    }
    
    let finalImageUrl = imageUri;
    let aiAnalysisMessage = '';
    
    // Handle image upload and analysis for AI mode (students only)
    if (imageUri && mode === 'ai' && user?.id) {
      try {
        setIsAIThinking(true);
        
        // Get current thread ID and recent message history for context
        const { currentThreadId } = useAIStore.getState();
        const conversationHistory = messages.slice(-10).map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp
        }));
        
        // Upload and analyze image with chat context
        const result = await PhotoService.uploadAndAnalyzeForChat(
          imageUri,
          user.id,
          currentThreadId || 'default',
          conversationHistory,
          plantId,
          lessonId
        );
        
        if (result.success && result.photoUrl) {
          finalImageUrl = result.photoUrl;
          aiAnalysisMessage = result.analysisMessage || '';
        } else {
          console.error('Chat image analysis failed:', result.error);
        }
      } catch (error) {
        console.error('Error in chat image analysis:', error);
      }
    }
    
    // Send the user message with image (students only)
    await sendMessage(message, finalImageUrl || undefined, mode, lessonId, plantId);
    
    // If we have AI analysis from the image, send it as a follow-up AI message
    if (aiAnalysisMessage && mode === 'ai') {
      // Small delay to ensure the user message is sent first
      setTimeout(() => {
        sendMessage(aiAnalysisMessage, undefined, 'ai', lessonId, plantId);
        setIsAIThinking(false);
      }, 500);
    } else {
      // Only show loading shimmer for AI mode without image analysis
      if (mode === 'ai') {
        setIsAIThinking(true);
        
        // Start a timer to hide loading after response
        setTimeout(() => {
          setIsAIThinking(false);
        }, 3000); // Hide after 3 seconds max
      }
      
      // For teacher mode, hide loading immediately since no response expected
      if (mode === 'teacher') {
        setIsAIThinking(false);
      }
    }
    
    // Clear form
    setMessage('');
    setImageUri(null);
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };



  // For now, show all messages in the current thread
  // In the future, we might want to filter by message type or have separate threads for AI vs teacher
  const filteredMessages = messages;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {filteredMessages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {mode === 'ai' 
                ? "Ask your garden mentor any questions about plant care, identification, or troubleshooting."
                : "Send a message to your teacher for personalized help and guidance."
              }
            </Text>
          </View>
        ) : (
          filteredMessages.map((msg) => {
            // Determine bubble type based on actual message role/sender
            let bubbleType: 'student' | 'ai' | 'teacher' = 'student';
            if (msg.role === 'user') {
              bubbleType = 'student';
            } else if (msg.role === 'assistant') {
              bubbleType = 'ai';
            } else if (msg.role === 'teacher') {
              bubbleType = 'teacher';
            }
            
            // Check if this is a document reference message and format it properly
            let messageContent = msg.content || '';
            let documentUrl: string | undefined;
            
            if (messageContent.startsWith('DOCUMENT_REF:')) {
              // Parse document reference: DOCUMENT_REF:url:title
              const parts = messageContent.split(':');
              documentUrl = parts[1];
              const documentTitle = parts.slice(2).join(':');
              messageContent = `📄 Reference Document: ${documentTitle}`;
              // Document references should always be treated as teacher messages
              bubbleType = 'teacher';
            }
            
            return (
              <GSChatBubble
                key={msg.id}
                type={bubbleType}
                message={messageContent}
                timestamp={msg.timestamp}
                currentUserRole={user?.role || 'student'}
                showSources={bubbleType === 'ai' && msg.sources && msg.sources.length > 0}
                sources={msg.sources}
                isRead={true}
                isLoading={false}
                documentUrl={documentUrl}
                onDocumentPress={documentUrl ? () => handleDocumentPress(documentUrl) : undefined}
              />
            );
          })
        )}
        {isAIThinking && mode === 'ai' && (
          <GSChatBubble
            type="ai"
            message="Thinking..."
            timestamp={new Date().toISOString()}
            currentUserRole={user?.role || 'student'}
            isLoading={true}
          />
        )}
      </ScrollView>

      {imageUri && (
        <View style={styles.imagePreviewContainer}>
          <Pressable style={styles.removeImageButton} onPress={() => setImageUri(null)}>
            <Text style={styles.removeImageText}>×</Text>
          </Pressable>
          {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
        ) : (
          <View style={[styles.imagePreview, styles.placeholderImage]}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
        </View>
      )}

      {/* Mode Toggle for students, Reference Documents for teachers */}
      {!isTeacher ? (
        <View style={styles.modeToggleContainer}>
          <Text style={styles.chatWithLabel}>Chat with: </Text>
          <SegmentedButtons
            value={mode}
            onValueChange={(value) => setMode(value as 'ai' | 'teacher')}
            buttons={[
              {
                value: 'ai',
                label: 'Chatbot',
                style: mode === 'ai' ? styles.segmentedButtonActiveAI : styles.segmentedButtonInactive,
                labelStyle: mode === 'ai' ? styles.segmentedButtonActiveLabelAI : styles.segmentedButtonInactiveLabel,
              },
              {
                value: 'teacher',
                label: 'Teacher',
                style: mode === 'teacher' ? styles.segmentedButtonActiveTeacher : styles.segmentedButtonInactive,
                labelStyle: mode === 'teacher' ? styles.segmentedButtonActiveLabelTeacher : styles.segmentedButtonInactiveLabel,
              },
            ]}
            style={styles.segmentedButtons}
          />
        </View>
      ) : (
        <GSReferenceDocuments
          lessonId={lessonId}
          selectedDocuments={selectedDocuments}
          onDocumentToggle={handleDocumentToggle}
        />
      )}

      <View style={styles.inputContainer}>
        <Pressable style={styles.imageButton} onPress={handlePickImage}>
          <ImageIcon size={24} color={colors.primary} />
        </Pressable>
        <TextInput
          style={styles.input}
          placeholder={mode === 'ai' ? "Ask about your plants..." : "Message your teacher..."}
          value={message}
          onChangeText={setMessage}
          multiline
        />
        <Pressable
          style={[styles.sendButton, (!message.trim() && !imageUri) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!message.trim() && !imageUri}
        >
          <Send size={20} color={colors.white} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  modeToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  chatWithLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
    marginRight: 12,
  },
  segmentedButtons: {
    maxWidth: 200,
  },
  segmentedButtonActiveAI: {
    backgroundColor: '#4CAF50', // Green to match AI chat bubble
  },
  segmentedButtonActiveTeacher: {
    backgroundColor: '#2196F3', // Blue to match teacher chat bubble
  },
  segmentedButtonInactive: {
    backgroundColor: colors.backgroundLight,
  },
  segmentedButtonActiveLabelAI: {
    color: 'white',
    fontWeight: '600',
  },
  segmentedButtonActiveLabelTeacher: {
    color: 'white',
    fontWeight: '600',
  },
  segmentedButtonInactiveLabel: {
    color: colors.textLight,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.grayLight,
    alignItems: 'center',
  },
  imageButton: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textLight,
    fontSize: 16,
  },
  imagePreviewContainer: {
    padding: 8,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.grayLight,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  placeholderImage: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  removeImageButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
    backgroundColor: colors.error,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});