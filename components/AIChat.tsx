import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { Send, ImageIcon } from 'lucide-react-native';
import { SegmentedButtons } from 'react-native-paper';
import colors, { DESIGN_TOKENS } from '@/constants/colors';
import { useAIStore } from '@/store/ai-store';
import { useColorScheme } from 'react-native';
import { usePlantStore } from '@/store/plant-store';
import { useTaskStore } from '@/store/task-store';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { AIPlantAnalysis, AIMessage } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { GSChatBubble } from './ui/GSChatBubble';
import { GSReferenceDocuments } from './ui/GSReferenceDocuments';
import { GSSourcesDropdown } from './ui/GSSourcesDropdown';
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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Also scroll to bottom when AI is thinking changes
  useEffect(() => {
    if (isAIThinking) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [isAIThinking]);

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
          try {
            await initializeExistingThread(threadId);
          } catch (error: any) {
            console.error('Failed to initialize thread:', threadId, error?.message);
          }
          return;
        }

        // Use the database user ID from the auth context (not the auth user ID)
        const currentUserId = user.id;
        
        // Otherwise, get the teacher for this student's active lesson
        if (user.role === 'student') {
          try {
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

            if (studentLessonData && !error) {
              const teacherId = (studentLessonData.lessons as any).classes.teacher_id;
              try {
                await initializeThread(currentUserId, teacherId);
              } catch (threadError: any) {
                console.error('Thread initialization failed:', threadError?.message);
              }
            } else {
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

              if (userData?.class_id && userData.classes && !userError) {
                const teacherId = (userData.classes as any).teacher_id;
                try {
                  await initializeThread(currentUserId, teacherId);
                } catch (threadError: any) {
                  console.error('Thread initialization failed:', threadError?.message);
                }
              } else {
                console.error('No teacher found for student');
              }
            }
          } catch (error) {
            console.error('Error in student initialization:', error);
          }
        } else if (user.role === 'teacher') {
          // For teachers, we don't need to initialize a thread here
          // Thread will be initialized when opening specific student conversations
        }
      }
    };

    initializeChat();
  }, [user, threadId]);

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

  // Filter out old chunk messages to show the new source bubble format
  const filteredMessages = messages.filter(msg => 
    !msg.content?.startsWith('📚 **Reference')
  );

  const canSend = message.trim() !== '' || imageUri !== null;

  // Helper functions for message positioning and colors
  const getMessagePosition = (message: AIMessage) => {
    const currentUserId = user?.id;
    
    // Determine sender_id and recipient_id from the message
    // For AIMessage type, we need to infer based on role
    const isCurrentUserMessage = message.role === 'user' && user?.role === 'student';
    const isCurrentTeacherMessage = message.role === 'teacher' && user?.role === 'teacher';
    
    // If current user sent the message, it goes on the right
    if (isCurrentUserMessage || isCurrentTeacherMessage) {
      return 'right';
    }
    
    // If message is from AI (role === 'assistant')
    if (message.role === 'assistant') {
      // AI messages: right side for teachers, left side for students
      return isTeacherMode ? 'right' : 'left';
    }
    
    // All other messages (from the other person) go on the left
    return 'left';
  };

  // Determine message bubble color based on sender role and position
  const getMessageBubbleColor = (message: AIMessage) => {
    const currentUserId = user?.id;
    
    // Check if current user sent the message
    const isCurrentUserMessage = message.role === 'user' && user?.role === 'student';
    const isCurrentTeacherMessage = message.role === 'teacher' && user?.role === 'teacher';
    
    // Current user's messages are always gray
    if (isCurrentUserMessage || isCurrentTeacherMessage) {
      return '#E5E7EB'; // gray-200
    }
    
    // AI messages are always purple
    if (message.role === 'assistant') {
      return '#8B5CF6'; // purple-500
    }
    
    // Other user's messages are always blue
    return '#3B82F6'; // blue-500
  };

  // Get text color based on bubble color
  const getMessageTextColor = (bubbleColor: string) => {
    // White text for colored bubbles, dark text for gray
    return bubbleColor === '#E5E7EB' ? '#1F2937' : '#FFFFFF';
  };

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
        showsVerticalScrollIndicator={false}
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
          filteredMessages.map((msg, index) => {
            const position = getMessagePosition(msg);
            const bubbleColor = getMessageBubbleColor(msg);
            const textColor = getMessageTextColor(bubbleColor);
            
            // Check if this is a document reference message and format it properly
            let messageContent = safeMessageContent(msg.content);
            let documentUrl: string | undefined;
            
            if (msg.content?.startsWith('DOCUMENT_REF:')) {
              // Parse document reference: DOCUMENT_REF:url:title
              const parts = msg.content.split(':');
              documentUrl = parts[1];
              const documentTitle = parts.slice(2).join(':');
              messageContent = `📄 Reference Document: ${documentTitle}`;
            }
            
            return (
              <View
                key={msg.id || index}
                style={[
                  styles.messageWrapper,
                  position === 'right' ? styles.messageWrapperRight : styles.messageWrapperLeft
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    { backgroundColor: bubbleColor },
                    position === 'right' ? styles.bubbleRight : styles.bubbleLeft
                  ]}
                >
                  <Text style={[styles.messageText, { color: textColor }]}>
                    {messageContent}
                  </Text>
                  {documentUrl && (
                    <Pressable onPress={() => handleDocumentPress(documentUrl)}>
                      <Text style={[styles.documentLink, { color: textColor, opacity: 0.8 }]}>
                        View Document
                      </Text>
                    </Pressable>
                  )}
                  {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                    <GSSourcesDropdown 
                      sources={msg.sources}
                      textColor={textColor}
                    />
                  )}
                  {msg.role === 'user' && msg.sources && msg.sources.length > 0 && (
                    <GSSourcesDropdown 
                      sources={msg.sources}
                      textColor={textColor}
                      title="Potential resources"
                    />
                  )}
                  <Text style={[styles.timestamp, { color: textColor, opacity: 0.7 }]}>
                    {formatTime(msg.timestamp)}
                  </Text>
                </View>
              </View>
            );
          })
        )}
        {isAIThinking && mode === 'ai' && (() => {
          const thinkingMessage: AIMessage = {
            id: 'thinking',
            role: 'assistant',
            content: 'Thinking...',
            timestamp: new Date().toISOString()
          };
          const position = getMessagePosition(thinkingMessage);
          const bubbleColor = getMessageBubbleColor(thinkingMessage);
          const textColor = getMessageTextColor(bubbleColor);

          return (
            <View
              style={[
                styles.messageWrapper,
                position === 'right' ? styles.messageWrapperRight : styles.messageWrapperLeft
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  { backgroundColor: bubbleColor },
                  position === 'right' ? styles.bubbleRight : styles.bubbleLeft
                ]}
              >
                <View style={styles.loadingDots}>
                  <View style={[styles.dot, { backgroundColor: textColor }]} />
                  <View style={[styles.dot, { backgroundColor: textColor }]} />
                  <View style={[styles.dot, { backgroundColor: textColor }]} />
                </View>
              </View>
            </View>
          );
        })()}
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
                style: {
                  backgroundColor: mode === 'ai' ? '#8B5CF6' : 'transparent',
                  borderColor: '#8B5CF6',
                },
                labelStyle: {
                  color: mode === 'ai' ? '#FFFFFF' : '#8B5CF6',
                  fontWeight: mode === 'ai' ? '600' : '400',
                },
              },
              {
                value: 'teacher',
                label: 'Teacher',
                style: {
                  backgroundColor: mode === 'teacher' ? '#3B82F6' : 'transparent',
                  borderColor: '#3B82F6',
                },
                labelStyle: {
                  color: mode === 'teacher' ? '#FFFFFF' : '#3B82F6',
                  fontWeight: mode === 'teacher' ? '600' : '400',
                },
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
    backgroundColor: DESIGN_TOKENS.background,
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
    flex: 1,
    backgroundColor: DESIGN_TOKENS.background,
  },
  messagesList: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageContainer: {
    marginBottom: 8,
  },
  messageWrapper: {
    paddingVertical: 4,
    width: '100%',
  },
  messageWrapperLeft: {
    alignItems: 'flex-start',
  },
  messageWrapperRight: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginVertical: 2,
  },
  bubbleLeft: {
    borderBottomLeftRadius: 4,
    marginRight: 40,
  },
  bubbleRight: {
    borderBottomRightRadius: 4,
    marginLeft: 40,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
  },
  documentLink: {
    fontSize: 14,
    marginTop: 4,
    textDecorationLine: 'underline',
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 8,
    color: DESIGN_TOKENS.muted,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: DESIGN_TOKENS.background,
    borderTopWidth: 1,
    borderTopColor: DESIGN_TOKENS.muted + '40',
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.muted + '40',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 8,
    fontSize: 16,
    color: DESIGN_TOKENS.primaryDark,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DESIGN_TOKENS.background,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.muted + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  segmentedButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: DESIGN_TOKENS.background,
    borderTopWidth: 1,
    borderTopColor: DESIGN_TOKENS.muted + '20',
  },
  segmentedButtons: {
    flex: 1,
    maxWidth: 280,
  },
  segmentedButtonActiveAI: {
    backgroundColor: DESIGN_TOKENS.secondaryLight,
  },
  segmentedButtonActiveTeacher: {
    backgroundColor: DESIGN_TOKENS.primary,
  },
  segmentedButtonInactive: {
    backgroundColor: DESIGN_TOKENS.background,
    borderColor: DESIGN_TOKENS.muted + '40',
  },
  segmentedButtonActiveLabelAI: {
    color: colors.white,
    fontWeight: '600',
  },
  segmentedButtonActiveLabelTeacher: {
    color: colors.white,
    fontWeight: '600',
  },
  segmentedButtonInactiveLabel: {
    color: DESIGN_TOKENS.muted,
  },
  chatWithLabel: {
    fontSize: 16,
    color: DESIGN_TOKENS.primaryDark,
    fontWeight: '500',
    marginRight: 12,
  },
  imagePreviewContainer: {
    padding: 16,
    backgroundColor: DESIGN_TOKENS.background,
    borderTopWidth: 1,
    borderTopColor: DESIGN_TOKENS.muted + '20',
    position: 'relative',
  },
  placeholderImage: {
    backgroundColor: DESIGN_TOKENS.muted + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: DESIGN_TOKENS.muted,
    fontSize: 14,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
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
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  retryButton: {
    backgroundColor: colors.error,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
});