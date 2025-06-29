import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Animated,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import colors from '@/constants/colors';
import { 
  Brain, 
  Shield, 
  BookOpen, 
  ChevronRight,
  Users,
  CheckCircle,
  Sparkles,
  Send,
  Plus
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

// Demo Components
const AIChatDemo: React.FC<{ showReferences?: boolean }> = ({ showReferences = false }) => {
  const [studentMessage, setStudentMessage] = useState('');
  const [aiMessage, setAIMessage] = useState('');
  const [showStudentMessage, setShowStudentMessage] = useState(false);
  const [showAIMessage, setShowAIMessage] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showSources, setShowSources] = useState(false);
  
  const animationStep = useRef(0);

  useEffect(() => {
    const runAnimation = () => {
      // Reset state
      setStudentMessage('');
      setAIMessage('');
      setShowStudentMessage(false);
      setShowAIMessage(false);
      setIsTyping(false);
      setShowSources(false);
      animationStep.current = 0;

      // Step 1: Show student typing
      setTimeout(() => {
        setStudentMessage('Help me identify this yellow leaf problem');
        setShowStudentMessage(true);
        animationStep.current = 1;
      }, 1000);

      // Step 2: Show AI thinking
      setTimeout(() => {
        setIsTyping(true);
        animationStep.current = 2;
      }, 3000);

      // Step 3: Show AI response
      setTimeout(() => {
        setIsTyping(false);
        setShowAIMessage(true);
        
        const response = showReferences 
          ? "Based on the image and gardening resources, yellow leaves often indicate overwatering or nutrient deficiency. Check soil moisture and consider adding nitrogen fertilizer."
          : "Yellow leaves often indicate overwatering or nutrient deficiency. Check soil moisture and consider adding nitrogen fertilizer.";
        
        setAIMessage(response);
        
        if (showReferences) {
          // Show sources after a brief delay
          setTimeout(() => {
            setShowSources(true);
          }, 1000);
        }
        animationStep.current = 3;
      }, 5000);
    };

    runAnimation();
    const interval = setInterval(runAnimation, 16000);
    
    return () => {
      clearInterval(interval);
    };
  }, [showReferences]);

  return (
    <View style={demoStyles.chatContainer}>
      {/* Messages */}
      <View style={demoStyles.messagesContainer}>
        {showStudentMessage && (
          <View style={[demoStyles.messageBubble, demoStyles.studentBubble]}>
            <Text style={demoStyles.studentMessageText}>{studentMessage}</Text>
          </View>
        )}
        
        {isTyping && (
          <View style={[demoStyles.messageBubble, demoStyles.aiBubble]}>
            <View style={demoStyles.typingIndicator}>
              <View style={demoStyles.typingDot} />
              <View style={demoStyles.typingDot} />
              <View style={demoStyles.typingDot} />
            </View>
          </View>
        )}
        
        {showAIMessage && (
          <View style={[demoStyles.messageBubble, demoStyles.aiBubble]}>
            <Text style={demoStyles.aiMessageText}>{aiMessage}</Text>
            {showReferences && showSources && (
              <View style={demoStyles.sourcesContainer}>
                <Text style={demoStyles.sourcesTitle}>📚 Sources (2)</Text>
                <Text style={demoStyles.sourceItem}>• Plant Disease Guide</Text>
                <Text style={demoStyles.sourceItem}>• Nutrient Deficiency Manual</Text>
              </View>
            )}
          </View>
        )}
      </View>
      
      {/* Input Area */}
      <View style={demoStyles.inputContainer}>
        <View style={demoStyles.textInput}>
          <Text style={demoStyles.placeholderText}>Ask about your plants...</Text>
        </View>
        <View style={demoStyles.sendButton}>
          <Send size={16} color={colors.white} />
        </View>
      </View>
    </View>
  );
};

const TeacherLessonDemo: React.FC = () => {
  const [urlText, setUrlText] = useState('');
  const [showProcessing, setShowProcessing] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [chunkCount, setChunkCount] = useState(0);
  
  useEffect(() => {
    const runAnimation = () => {
      // Reset state
      setUrlText('');
      setShowProcessing(false);
      setShowCompleted(false);
      setChunkCount(0);

      // Step 1: Type URL
      setTimeout(() => {
        const url = 'https://extension.umn.edu/plant-diseases';
        let i = 0;
        const typeUrl = () => {
          if (i <= url.length) {
            setUrlText(url.slice(0, i));
            i++;
            setTimeout(typeUrl, 160);
          }
        };
        typeUrl();
      }, 1000);

      // Step 2: Show processing
      setTimeout(() => {
        setShowProcessing(true);
      }, 6000);

      // Step 3: Show completed with chunks
      setTimeout(() => {
        setShowProcessing(false);
        setShowCompleted(true);
        
        // Animate chunk count
        let chunks = 0;
        const animateChunks = () => {
          if (chunks <= 24) {
            setChunkCount(chunks);
            chunks++;
            setTimeout(animateChunks, 100);
          }
        };
        animateChunks();
      }, 10000);
    };

    runAnimation();
    const interval = setInterval(runAnimation, 20000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={demoStyles.lessonContainer}>
      {/* Header */}
      <View style={demoStyles.lessonHeader}>
        <Text style={demoStyles.lessonHeaderText}>Add Learning Resource</Text>
      </View>
      
      {/* URL Input */}
      <View style={demoStyles.urlInputContainer}>
        <Text style={demoStyles.urlLabel}>Resource URL</Text>
        <View style={demoStyles.urlInputBox}>
          <Text style={demoStyles.urlText}>{urlText}</Text>
          <View style={demoStyles.addButton}>
            <Plus size={16} color={colors.white} />
          </View>
        </View>
      </View>
      
      {/* Document Item */}
      {(showProcessing || showCompleted) && (
        <View style={demoStyles.documentItem}>
          <View style={demoStyles.documentIcon}>
            {showProcessing ? (
              <View style={demoStyles.spinningIcon} />
            ) : (
              <CheckCircle size={16} color={colors.success} />
            )}
          </View>
          <View style={demoStyles.documentInfo}>
            <Text style={demoStyles.documentTitle}>Plant Disease Guide</Text>
            <Text style={demoStyles.documentUrl}>extension.umn.edu</Text>
            <Text style={demoStyles.documentStatus}>
              {showProcessing ? 'Processing...' : `Chunks: ${chunkCount}`}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

interface OnboardingSlide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactElement;
  color: string;
  accentColor: string;
  demo?: React.ReactElement;
}

const slides: OnboardingSlide[] = [
  {
    id: 1,
    title: 'Students use AI',
    subtitle: 'It\'s happening now',
    description: 'Students are already using AI for homework and research.',
    icon: <Brain size={60} color="#4CAF50" />,
    color: '#4CAF50',
    accentColor: '#E8F5E9',
    demo: <AIChatDemo showReferences={false} />,
  },
  {
    id: 2,
    title: 'Give the AI trusted information',
    subtitle: 'Quality content in',
    description: 'Add your curriculum resources to the AI\'s knowledge.',
    icon: <Shield size={60} color="#43A047" />,
    color: '#43A047',
    accentColor: '#C8E6C9',
    demo: <TeacherLessonDemo />,
  },
  {
    id: 3,
    title: 'Advanced Cheating Detection',
    subtitle: 'Teaching, not copying',
    description: 'Help students learn and understand, not just copy and paste.',
    icon: <BookOpen size={60} color="#388E3C" />,
    color: '#388E3C',
    accentColor: '#A5D6A7',
    demo: <AIChatDemo showReferences={true} />,
  },
  {
    id: 4,
    title: 'Garden Guru Demo',
    subtitle: 'See it in action',
    description: 'Example: A gardening teacher\'s custom AI assistant.',
    icon: <Sparkles size={60} color="#2E7D32" />,
    color: '#2E7D32',
    accentColor: '#81C784',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();
  const { completeOnboarding } = useAuth();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Auto-advance slides with smooth animation, but stop on the last slide
    if (currentIndex < slides.length - 1) {
      const timer = setTimeout(() => {
        goToNext();
      }, 8000); // 8 seconds per slide

      return () => clearTimeout(timer);
    }
  }, [currentIndex]);

  const goToNext = () => {
    if (currentIndex < slides.length - 1) {
      // Animate transition with smooth easing
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -30,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentIndex(currentIndex + 1);
        slideAnim.setValue(30);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 120,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  };

  const handleGetStarted = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      completeOnboarding();
      router.replace('/auth/signin');
    });
  };

  const renderSlide = (slide: OnboardingSlide) => (
    <Animated.View
      style={[
        styles.slide,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      {/* Background decoration */}
      <View style={[styles.backgroundCircle, { backgroundColor: slide.accentColor }]} />
      <View style={[styles.backgroundCircle2, { backgroundColor: slide.accentColor }]} />
      
      {/* Content */}
      <View style={styles.content}>
        {/* Demo Component */}
        {slide.demo && (
          <View style={styles.demoContainer}>
            {slide.demo}
          </View>
        )}
        
        {/* Icon - only show if no demo */}
        {!slide.demo && (
          <View style={[styles.iconContainer, { backgroundColor: slide.accentColor }]}>
            {slide.icon}
            <View style={[styles.iconGlow, { backgroundColor: slide.color + '30' }]} />
          </View>
        )}
        
        <Text style={styles.title}>
          {slide.title}
        </Text>
        
        <Text style={styles.subtitle}>
          {slide.subtitle}
        </Text>
        
        <Text style={styles.description}>
          {slide.description}
        </Text>
      </View>
    </Animated.View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {slides.map((_, index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor: index === currentIndex ? slides[currentIndex].color : colors.grayLight,
              transform: [
                {
                  scale: index === currentIndex ? 1.2 : 1,
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );

  const currentSlide = slides[currentIndex];

  return (
    <View style={styles.container}>
      {/* Skip button */}
      <View style={styles.header}>
        <Pressable onPress={handleGetStarted} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Main content */}
      <View style={styles.slideContainer}>
        {renderSlide(currentSlide)}
      </View>

      {/* Progress dots */}
      {renderDots()}

      {/* Bottom section */}
      <View style={styles.footer}>
        {currentIndex === slides.length - 1 ? (
          <Pressable 
            onPress={handleGetStarted} 
            style={[styles.getStartedButton, { backgroundColor: currentSlide.color }]}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
            <CheckCircle size={20} color={colors.white} />
          </Pressable>
        ) : (
          <Pressable 
            onPress={goToNext} 
            style={[styles.nextButton, { backgroundColor: currentSlide.color }]}
          >
            <Text style={styles.nextText}>Next</Text>
            <ChevronRight size={20} color={colors.white} />
          </Pressable>
        )}
        
        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {currentIndex + 1} of {slides.length}
          </Text>
        </View>
      </View>
    </View>
  );
}

// Demo Styles
const demoStyles = StyleSheet.create({
  // AI Chat Demo Styles
  chatContainer: {
    width: 280,
    height: 220,
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  messagesContainer: {
    flex: 1,
    padding: 8,
    paddingTop: 12,
  },
  messageBubble: {
    marginVertical: 4,
    maxWidth: '80%',
    padding: 8,
    borderRadius: 12,
  },
  studentBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.grayLight,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.secondaryLight,
  },
  studentMessageText: {
    fontSize: 12,
    color: colors.black,
  },
  aiMessageText: {
    fontSize: 12,
    color: colors.white,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
    marginHorizontal: 2,
    opacity: 0.7,
  },
  sourcesContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  sourcesTitle: {
    fontSize: 10,
    color: colors.white,
    fontWeight: '600',
    marginBottom: 4,
  },
  sourceItem: {
    fontSize: 9,
    color: colors.white,
    opacity: 0.9,
    marginBottom: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderTopWidth: 1,
    borderTopColor: colors.grayLight,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  placeholderText: {
    fontSize: 12,
    color: colors.muted,
  },
  sendButton: {
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Teacher Lesson Demo Styles
  lessonContainer: {
    width: 280,
    height: 220,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  lessonHeader: {
    marginBottom: 16,
  },
  lessonHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  urlInputContainer: {
    marginBottom: 16,
  },
  urlLabel: {
    fontSize: 12,
    color: colors.text,
    marginBottom: 8,
    fontWeight: '500',
  },
  urlInputBox: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.grayLight,
  },
  urlText: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  documentItem: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.grayLight,
  },
  documentIcon: {
    marginRight: 12,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinningIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    borderTopColor: 'transparent',
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  documentUrl: {
    fontSize: 10,
    color: colors.muted,
    marginBottom: 2,
  },
  documentStatus: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '500',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'flex-end',
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.60)',
  },
  slideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slide: {
    width: width - 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  backgroundCircle: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    top: -50,
    right: -100,
    opacity: 0.15,
  },
  backgroundCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    bottom: -50,
    left: -50,
    opacity: 0.1,
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
  demoContainer: {
    marginBottom: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  iconGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    zIndex: -1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.87)',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.60)',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: 'rgba(0,0,0,0.60)',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 6,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  getStartedText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
    marginRight: 8,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
  },
  nextText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginRight: 6,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.60)',
  },
}); 