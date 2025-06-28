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
import { safeMessageContent } from '@/utils/textUtils';
import { useAppTheme } from '@/config/theme';

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
  const { messages, isLoading, error, sendMessage, fetchMessages, initializeThread, initializeDefaultThread, initializeExistingThread, clearError } = useAIStore();
  const { user } = useAuth();
  const { plants } = usePlantStore();
  const scrollViewRef = useRef<ScrollView>(null);
  const isTeacher = user?.role === 'teacher';
  const { isTeacherMode } = useMode();
  const theme = useAppTheme();

  // Get the current lesson ID from the plant for students, or fetch it for teachers
  const currentPlant = plants.find(p => p.id === plantId);
  const lessonId = currentPlant?.lessonId || teacherLessonId || undefined;

  // Clear any persisted errors on mount
  useEffect(() => {
    clearError();
  }, [clearError]);

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
      console.log('=== AIChat initializeChat START ===');
      console.log('User object:', user);
      console.log('Props:', { threadId, studentId, mode, initialMode });
      
      if (user) {
        // If threadId is provided (from teacher interface), use existing thread
        if (threadId) {
          console.log('Using existing thread:', threadId);
          try {
            await initializeExistingThread(threadId);
            console.log('✅ Existing thread initialized successfully');
          } catch (error: any) {
            console.error('❌ Failed to initialize existing thread:', {
              threadId,
              error,
              errorMessage: error?.message,
              errorCode: error?.code
            });
          }
          return;
        }

        // Use the database user ID from the auth context (not the auth user ID)
        const currentUserId = user.id; // This is already the database user ID
        
        // Otherwise, get the teacher for this student's active lesson
        if (user.role === 'student') {
          try {
            console.log('Student user - looking for teacher...');
            // First try to get teacher from active lesson
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
              .eq('student_id', currentUserId)
              .eq('lessons.status', 'active')
              .single();

            console.log('Student lesson query result:', { data: studentLessonData, error });

            if (studentLessonData && !error) {
              const teacherId = (studentLessonData.lessons as any).classes.teacher_id;
              console.log('Found teacher from lesson:', teacherId);
              // Initialize thread with the actual teacher using database IDs
              try {
                await initializeThread(currentUserId, teacherId);
                console.log('✅ Thread initialized successfully');
              } catch (threadError: any) {
                console.error('❌ Thread initialization failed:', {
                  threadError,
                  currentUserId,
                  teacherId,
                  errorMessage: threadError?.message,
                  errorCode: threadError?.code
                });
              }
            } else {
              console.log('No active lesson found, checking class directly...');
              // If no active lesson, try to get the student's class teacher directly
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select(`
                  class_id,
                  classes!inner(
                    teacher_id
                  )
                `)
                .eq('id', currentUserId)
                .single();

              console.log('User class query result:', { data: userData, error: userError });

              if (userData?.class_id && userData.classes && !userError) {
                const teacherId = (userData.classes as any).teacher_id;
                console.log('Found teacher from class:', teacherId);
                try {
                  await initializeThread(currentUserId, teacherId);
                  console.log('✅ Thread initialized successfully');
                } catch (threadError: any) {
                  console.error('❌ Thread initialization failed:', {
                    threadError,
                    currentUserId,
                    teacherId,
                    errorMessage: threadError?.message,
                    errorCode: threadError?.code
                  });
                }
              } else {
                // No teacher found - show appropriate message
                console.log('No teacher assigned to student, using default thread');
                // For now, use default thread for testing
                try {
                  await initializeDefaultThread();
                  console.log('✅ Default thread initialized');
                } catch (defaultError: any) {
                  console.error('❌ Default thread initialization failed:', {
                    defaultError,
                    errorMessage: defaultError?.message
                  });
                }
              }
            }
          } catch (error) {
            console.error('Error getting teacher for student:', error);
            // Fallback to default thread
            try {
              await initializeDefaultThread();
              console.log('✅ Fallback to default thread successful');
            } catch (fallbackError: any) {
              console.error('❌ Fallback to default thread failed:', fallbackError);
            }
          }
        } else if (user.role === 'teacher' && studentId) {
          console.log('Teacher viewing student chat:', { teacherId: currentUserId, studentId });
          // Teacher viewing a specific student's chat - use database IDs
          try {
            await initializeThread(studentId, currentUserId);
            console.log('✅ Teacher-student thread initialized');
          } catch (teacherError: any) {
            console.error('❌ Teacher thread initialization failed:', {
              teacherError,
              studentId,
              teacherId: currentUserId,
              errorMessage: teacherError?.message
            });
          }
        } else {
          console.log('Other case - using default thread');
          // For other cases, use default thread
          try {
            await initializeDefaultThread();
            console.log('✅ Default thread initialized for other case');
          } catch (otherError: any) {
            console.error('❌ Default thread failed for other case:', otherError);
          }
        }
      } else {
        console.log('No user object available');
      }
      console.log('=== AIChat initializeChat END ===');
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
    
    // Determine receiver_id based on mode and user role
    let receiverId: string | undefined;
    
    if (user?.role === 'teacher' && studentId) {
      // Teacher sending message - receiver is the student
      receiverId = studentId;
    } else if (user?.role === 'student') {
      // Student sending message - need to find their teacher
      try {
        // First try to get teacher from student's active lesson
        const { data: studentPlant } = await supabase
          .from('plants')
          .select('lesson_id')
          .eq('student_id', user.id)
          .single();

        if (studentPlant?.lesson_id) {
          const { data: lesson } = await supabase
            .from('lessons')
            .select('class_id')
            .eq('id', studentPlant.lesson_id)
            .eq('status', 'active')
            .single();

          if (lesson?.class_id) {
            const { data: classData } = await supabase
              .from('classes')
              .select('teacher_id')
              .eq('id', lesson.class_id)
              .single();

            if (classData?.teacher_id) {
              receiverId = classData.teacher_id;
            }
          }
        }

        // Fallback: get teacher from student's class directly
        if (!receiverId) {
          const { data: userData } = await supabase
            .from('users')
            .select('class_id')
            .eq('id', user.id)
            .single();

          if (userData?.class_id) {
            const { data: classData } = await supabase
              .from('classes')
              .select('teacher_id')
              .eq('id', userData.class_id)
              .single();

            if (classData?.teacher_id) {
              receiverId = classData.teacher_id;
            }
          }
        }
      } catch (error) {
        console.error('Error finding teacher for student message:', error);
      }
    }
    
    // If current user is a teacher, send the message and any selected documents
    if (user?.role === 'teacher') {
      await sendMessage(message, imageUri || undefined, 'teacher', lessonId, plantId, receiverId);
      
      // Send document reference messages for each selected document
      for (const docId of selectedDocuments) {
        const docData = documentsData[docId];
        if (docData) {
          // Create a document message with URL embedded in content
          const documentContent = `DOCUMENT_REF:${docData.url}:${docData.title}`;
          await sendMessage(documentContent, undefined, 'teacher', lessonId, plantId, receiverId);
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
    await sendMessage(message, finalImageUrl || undefined, mode, lessonId, plantId, receiverId);
    
    // If we have AI analysis from the image, send it as a follow-up AI message
    if (aiAnalysisMessage && mode === 'ai') {
      // Small delay to ensure the user message is sent first
      setTimeout(() => {
        sendMessage(aiAnalysisMessage, undefined, 'ai', lessonId, plantId, undefined);
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

  const canSend = message.trim() !== '' || imageUri !== null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      {/* Display error if exists */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={clearError} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}
      
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesList}
      >
        {filteredMessages.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>
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
            let messageContent = safeMessageContent(msg.content);
            let documentUrl: string | undefined;
            
            if (msg.content?.startsWith('DOCUMENT_REF:')) {
              // Parse document reference: DOCUMENT_REF:url:title
              const parts = msg.content.split(':');
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
        <View style={styles.segmentedButtonContainer}>
          <Text style={styles.chatWithLabel}>Chat with: </Text>
          <SegmentedButtons
            value={mode}
            onValueChange={(value) => setMode(value as 'ai' | 'teacher')}
            buttons={[
              {
                value: 'ai',
                label: 'AI Assistant',
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
          style={styles.textInput}
          placeholder={mode === 'ai' ? "Ask about your plants..." : "Message your teacher..."}
          value={message}
          onChangeText={setMessage}
          multiline
        />
        <Pressable 
          style={[
            styles.sendButton,
            { 
              backgroundColor: canSend 
                ? (mode === 'ai' ? theme.colors.secondary : theme.colors.primary)
                : theme.colors.muted
            }
          ]}
          onPress={handleSend}
          disabled={!canSend || isLoading}
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
    backgroundColor: '#FAFAFA', // Use background token
  },
  errorContainer: {
    backgroundColor: colors.error,
    paddingVertical: 8,
    borderBottomColor: colors.error,
    borderBottomWidth: 1,
  },
  errorText: {
    textAlign: 'center',
    color: colors.white,
    fontSize: 14,
  },
  retryText: {
    textAlign: 'center',
    color: colors.white,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  messagesContainer: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#6B728040', // Use muted with opacity
  },
  messagesList: {
    flex: 1,
    paddingVertical: 8,
  },
  messageContainer: {
    marginBottom: 8,
  },
  loadingContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#6B7280', // Use muted token
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: '#6B728040', // Use muted with opacity
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageButton: {
    backgroundColor: '#6B7280', // Use muted token
    marginRight: 8,
  },
  imagePreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
  },
  segmentedButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  segmentedButtons: {
    maxWidth: 200,
  },
  segmentedButtonActiveAI: {
    backgroundColor: '#A78BFA', // Purple to match AI chat bubble
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
  chatWithLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
    marginRight: 12,
  },
  imagePreviewContainer: {
    padding: 8,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.grayLight,
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
  retryButton: {
    backgroundColor: colors.error,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
});