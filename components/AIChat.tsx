import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
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

interface AIChatProps {
  analysis?: AIPlantAnalysis | null;
  photoUri?: string;
  plantId?: string;
  initialMode?: 'ai' | 'teacher';
}

export default function AIChat({ analysis, photoUri, plantId, initialMode = 'ai' }: AIChatProps) {
  const [message, setMessage] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(photoUri || null);
  const [mode, setMode] = useState<'ai' | 'teacher'>(initialMode);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const { messages, isLoading, sendMessage, fetchMessages, initializeThread, initializeDefaultThread } = useAIStore();
  const { user } = useAuth();
  const { plants } = usePlantStore();
  const scrollViewRef = useRef<ScrollView>(null);
  const isTeacher = user?.role === 'teacher';

  // Get the current lesson ID from the plant
  const currentPlant = plants.find(p => p.id === plantId);
  const lessonId = currentPlant?.lessonId;

  useEffect(() => {
    const initializeChat = async () => {
      if (user) {
        // Use one shared thread that contains both AI and teacher messages
        // For testing, use the default thread with Hutch users
        await initializeDefaultThread();
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

  const handleSend = async () => {
    if (message.trim() === '' && !imageUri) return;
    
    // Only show loading shimmer for AI mode
    if (mode === 'ai') {
      setIsAIThinking(true);
      
      // Start a timer to hide loading after response
      setTimeout(() => {
        setIsAIThinking(false);
      }, 3000); // Hide after 3 seconds max
    }
    
    // Send the message
    await sendMessage(message, imageUri || undefined, mode, lessonId, plantId);
    setMessage('');
    setImageUri(null);
    
    // For teacher mode, hide loading immediately since no response expected
    if (mode === 'teacher') {
      setIsAIThinking(false);
    }
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
            
            return (
              <GSChatBubble
                key={msg.id}
                type={bubbleType}
                message={msg.content}
                timestamp={msg.timestamp}
                showSources={bubbleType === 'ai' && msg.sources && msg.sources.length > 0}
                sources={msg.sources}
                isRead={true}
                isLoading={false}
              />
            );
          })
        )}
        {isAIThinking && mode === 'ai' && (
          <GSChatBubble
            type="ai"
            message="Thinking..."
            timestamp={new Date().toISOString()}
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

      {/* Mode Toggle - Only show for students - Above input */}
      {!isTeacher && (
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