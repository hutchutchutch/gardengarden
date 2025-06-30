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
  Plus,
  MessageCircle,
  Link,
  FileText,
  ChevronDown,
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

// Demo Components
const AIUsageDemo: React.FC = () => {
  const [activeBubble, setActiveBubble] = useState(-1);
  const [currentQuote, setCurrentQuote] = useState('');
  const sourceOpacity = useRef([
    new Animated.Value(0.4),
    new Animated.Value(0.4),
    new Animated.Value(0.4),
  ]).current;
  const quoteOpacity = useRef(new Animated.Value(0)).current;

  const garbageSources = [
    { 
      name: 'Reddit', 
      color: '#666666', 
      quote: '"Math is just a conspiracy to make kids feel dumb"' 
    },
    { 
      name: 'Blogs', 
      color: '#666666', 
      quote: '"Science is fake, trust your gut instead"' 
    },
    { 
      name: 'Twitter', 
      color: '#666666', 
      quote: '"Reading is overrated, just watch videos"' 
    },
  ];

  useEffect(() => {
    let animationTimer: any;
    let cycleIndex = 0;

    const showNextSource = () => {
      // Clear any existing animations
      sourceOpacity.forEach(anim => anim.setValue(0.4));
      quoteOpacity.setValue(0);
      
      // Update to next source
      const currentSource = garbageSources[cycleIndex];
      setActiveBubble(cycleIndex);
      setCurrentQuote(currentSource.quote);
      
      // Animate in
      Animated.parallel([
        Animated.timing(sourceOpacity[cycleIndex], {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(quoteOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Schedule next source after 3 seconds
      animationTimer = setTimeout(() => {
        // Move to next index
        cycleIndex = (cycleIndex + 1) % garbageSources.length;
        showNextSource();
      }, 3000);
    };

    // Start the animation cycle
    const startTimer = setTimeout(showNextSource, 500);

    // Cleanup
    return () => {
      if (animationTimer) clearTimeout(animationTimer);
      clearTimeout(startTimer);
    };
  }, []);

  return (
    <View style={demoStyles.aiUsageContainer}>
      <Text style={demoStyles.aiUsageTitle}>AI learns from garbage sources:</Text>
      
      <View style={demoStyles.aiPlatformsContainer}>
        {garbageSources.map((source, index) => (
          <Animated.View
            key={source.name}
            style={[
              demoStyles.aiPlatform,
              { 
                backgroundColor: source.color,
                opacity: sourceOpacity[index],
              },
            ]}
          >
            <Text style={demoStyles.aiPlatformName}>{source.name}</Text>
          </Animated.View>
        ))}
      </View>
      
      <Animated.View 
        style={[
          demoStyles.quoteContainer,
          { opacity: quoteOpacity }
        ]}
      >
        <Text style={demoStyles.quoteText}>{currentQuote}</Text>
      </Animated.View>
    </View>
  );
};

const TeacherURLDemo: React.FC = () => {
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

      // Step 1: Paste URL
      setTimeout(() => {
        const url = 'https://extension.umn.edu/plant-diseases';
        setUrlText(url);
      }, 1000);

      // Step 2: Show processing
      setTimeout(() => {
        setShowProcessing(true);
      }, 3000);

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
      }, 5500);
    };

    runAnimation();
    const interval = setInterval(runAnimation, 12000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={demoStyles.teacherUrlContainer}>
      <View style={demoStyles.urlHeader}>
        <Shield size={20} color={colors.primary} />
        <Text style={demoStyles.urlHeaderText}>Add Trusted Sources</Text>
      </View>
      
      <View style={demoStyles.urlInputContainer}>
        <Text style={demoStyles.urlLabel}>Resource URL</Text>
        <View style={demoStyles.urlInputBox}>
          <Link size={16} color={colors.muted} />
          <Text style={demoStyles.urlText}>{urlText}</Text>
          <View style={demoStyles.addButton}>
            <Plus size={16} color={colors.white} />
          </View>
        </View>
      </View>
      
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
              {showProcessing ? 'Processing...' : `${chunkCount} chunks ready`}
            </Text>
          </View>
        </View>
      )}
      
      <Text style={demoStyles.urlBenefitText}>
        Now your AI has vetted, curriculum-aligned information
      </Text>
    </View>
  );
};

const StudentChatDemo: React.FC = () => {
  const [studentMessage, setStudentMessage] = useState('');
  const [aiMessage, setAIMessage] = useState('');
  const [showStudentMessage, setShowStudentMessage] = useState(false);
  const [showAIMessage, setShowAIMessage] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showSourcesToggle, setShowSourcesToggle] = useState(false);
  const [showSourcesBubbles, setShowSourcesBubbles] = useState(false);
  
  useEffect(() => {
    const runAnimation = () => {
      // Reset state
      setStudentMessage('');
      setAIMessage('');
      setShowStudentMessage(false);
      setShowAIMessage(false);
      setIsTyping(false);
      setShowSourcesToggle(false);
      setShowSourcesBubbles(false);

      // Step 1: Show student typing
      setTimeout(() => {
        setStudentMessage('Why do my tomato leaves turn yellow?');
        setShowStudentMessage(true);
      }, 1000);

      // Step 2: Show AI thinking
      setTimeout(() => {
        setIsTyping(true);
      }, 2500);

      // Step 3: Show AI response with sources toggle
      setTimeout(() => {
        setIsTyping(false);
        setShowAIMessage(true);
        setAIMessage('Yellow leaves often indicate overwatering, nutrient deficiency, or disease. Check soil moisture and consider adding nitrogen fertilizer.');
        
        setTimeout(() => {
          setShowSourcesToggle(true);
        }, 800);
      }, 4500);

      // Step 4: Show expanded sources as separate bubbles
      setTimeout(() => {
        setShowSourcesBubbles(true);
      }, 6000);
    };

    runAnimation();
    const interval = setInterval(runAnimation, 12000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={demoStyles.studentChatContainer}>
      <View style={demoStyles.chatHeader}>
        <Brain size={16} color={colors.primary} />
        <Text style={demoStyles.chatHeaderText}>Chat with: Garden Mentor AI</Text>
      </View>
      
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
            
            {showSourcesToggle && (
              <View style={demoStyles.sourcesToggle}>
                <Text style={demoStyles.sourcesToggleText}>See sources (2)</Text>
                <ChevronDown size={14} color={colors.white} />
              </View>
            )}
            
            <Text style={demoStyles.timestampText}>2:34 PM</Text>
          </View>
        )}
        
        {/* Source lesson bubbles */}
        {showSourcesBubbles && (
          <>
            <View style={demoStyles.sourceBubble}>
              <View style={demoStyles.sourceHeader}>
                <View style={demoStyles.sourceTitleRow}>
                  <BookOpen size={14} color={colors.primary} />
                  <Text style={demoStyles.sourceTitle}>Tomato Disease Identification</Text>
                  <Text style={demoStyles.externalLinkText}>🔗</Text>
                </View>
                <Text style={demoStyles.relevanceText}>95% relevant</Text>
              </View>
              <Text style={demoStyles.sourceContent}>
                Yellow leaves in tomatoes are commonly caused by{'\n'}overwatering or nitrogen deficiency...
              </Text>
              <Text style={demoStyles.seeMoreText}>See more ↓</Text>
            </View>
            
            <View style={demoStyles.sourceBubble}>
              <View style={demoStyles.sourceHeader}>
                <View style={demoStyles.sourceTitleRow}>
                  <BookOpen size={14} color={colors.primary} />
                  <Text style={demoStyles.sourceTitle}>Nutrient Deficiency Guide</Text>
                  <Text style={demoStyles.externalLinkText}>🔗</Text>
                </View>
                <Text style={demoStyles.relevanceText}>87% relevant</Text>
              </View>
              <Text style={demoStyles.sourceContent}>
                Nitrogen deficiency manifests as yellowing of{'\n'}older leaves first, progressing upward...
              </Text>
              <Text style={demoStyles.seeMoreText}>See more ↓</Text>
            </View>
          </>
        )}
      </View>
      
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

const TeacherAssistanceDemo: React.FC = () => {
  const [expandedThread, setExpandedThread] = useState(false);
  const [showExpandedMessage, setShowExpandedMessage] = useState(false);
  
  useEffect(() => {
    // Step 1: Show message threads for 2 seconds
    setTimeout(() => {
      setExpandedThread(true);
    }, 2000);
    
    // Step 2: Show expanded message with sources
    setTimeout(() => {
      setShowExpandedMessage(true);
    }, 3500);
  }, []);

  const messageThreads = [
    { name: 'Sarah M.', message: 'My tomato plant leaves are turning...', time: '2m', unread: true },
    { name: 'John D.', message: 'Thanks for the help yesterday!', time: '1h', unread: false },
    { name: 'Emma L.', message: 'Question about fertilizer types', time: '3h', unread: false },
  ];

  return (
    <View style={demoStyles.messageThreadContainer}>
      {/* Header */}
      <View style={demoStyles.messagesHeader}>
        <Text style={demoStyles.messagesHeaderTitle}>Messages</Text>
      </View>
      
      {/* Message Threads - Only show when not expanded */}
      {!expandedThread && (
        <View style={demoStyles.threadsContainer}>
          {messageThreads.map((thread, index) => (
            <View key={index} style={demoStyles.messageThreadItem}>
              {/* Avatar */}
              <View style={demoStyles.studentAvatar}>
                <Text style={demoStyles.avatarInitials}>
                  {thread.name.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
              
              {/* Message Content */}
              <View style={demoStyles.messageContent}>
                <View style={demoStyles.messageHeader}>
                  <Text style={demoStyles.studentName}>{thread.name}</Text>
                  <View style={demoStyles.messageMeta}>
                    <Text style={demoStyles.messageTime}>{thread.time}</Text>
                    {thread.unread && <View style={demoStyles.unreadIndicator} />}
                  </View>
                </View>
                <Text style={demoStyles.messagePreview} numberOfLines={1}>
                  {thread.message}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
      
      {/* Expanded Thread */}
      {expandedThread && (
        <View style={demoStyles.expandedThreadContainer}>
          <View style={demoStyles.expandedThreadHeader}>
            <Text style={demoStyles.expandedThreadTitle}>Chat with Sarah M.</Text>
          </View>
          
          {/* Student message with expanded sources */}
          <View style={demoStyles.expandedStudentMessage}>
            <Text style={demoStyles.expandedMessageText}>
              My tomato plant leaves are turning yellow and I'm not sure what's wrong. Can you help?
            </Text>
            
            {showExpandedMessage && (
              <>
                {/* Expanded sources dropdown */}
                <View style={demoStyles.expandedSourcesToggle}>
                  <Text style={demoStyles.expandedSourcesText}>📚 Recommended Resources (2)</Text>
                  <ChevronDown size={12} color={colors.white} style={{ transform: [{ rotate: '180deg' }] }} />
                </View>
                
                <Text style={demoStyles.expandedMessageTime}>2:34 PM</Text>
              </>
            )}
          </View>
          
          {/* Source chunks displayed below */}
          {showExpandedMessage && (
            <View style={demoStyles.sourceChunksContainer}>
              {/* First source chunk */}
              <View style={demoStyles.sourceChunk}>
                <View style={demoStyles.sourceChunkHeader}>
                  <View style={demoStyles.sourceChunkTitleRow}>
                    <BookOpen size={12} color={colors.primary} />
                    <Text style={demoStyles.sourceChunkTitle}>Tomato Disease Identification</Text>
                    <Text style={demoStyles.sourceRelevance}>95%</Text>
                  </View>
                </View>
                <Text style={demoStyles.sourceChunkContent} numberOfLines={2}>
                  Yellow leaves in tomatoes are commonly caused by overwatering, nutrient deficiency, or disease. Check soil moisture levels first - if soil is soggy, reduce watering frequency.
                </Text>
                <View style={demoStyles.sourceExpandRow}>
                  <Text style={demoStyles.sourceUrl}>📄 University Extension Guide</Text>
                  <ChevronDown size={10} color={colors.primary} />
                </View>
              </View>
              
              {/* Second source chunk */}
              <View style={demoStyles.sourceChunk}>
                <View style={demoStyles.sourceChunkHeader}>
                  <View style={demoStyles.sourceChunkTitleRow}>
                    <BookOpen size={12} color={colors.primary} />
                    <Text style={demoStyles.sourceChunkTitle}>Nutrient Deficiency Manual</Text>
                    <Text style={demoStyles.sourceRelevance}>87%</Text>
                  </View>
                </View>
                <Text style={demoStyles.sourceChunkContent} numberOfLines={2}>
                  Nitrogen deficiency manifests as yellowing of older leaves first, progressing upward through the plant. Apply balanced fertilizer at half strength.
                </Text>
                <View style={demoStyles.sourceExpandRow}>
                  <Text style={demoStyles.sourceUrl}>📄 Plant Nutrition Handbook</Text>
                  <ChevronDown size={10} color={colors.primary} />
                </View>
              </View>
            </View>
          )}
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
    subtitle: 'But it\'s trained on garbage.',
    description: '',
    icon: <Brain size={60} color="#4CAF50" />,
    color: '#4CAF50',
    accentColor: '#E8F5E9',
    demo: <AIUsageDemo />,
  },
  {
    id: 2,
    title: 'Give them trusted AI',
    subtitle: 'Upload vetted information.',
    description: '',
    icon: <Shield size={60} color="#43A047" />,
    color: '#43A047',
    accentColor: '#C8E6C9',
    demo: <TeacherURLDemo />,
  },
  {
    id: 3,
    title: 'Students see sources',
    subtitle: 'Responses show your sources.',
    description: '',
    icon: <BookOpen size={60} color="#388E3C" />,
    color: '#388E3C',
    accentColor: '#A5D6A7',
    demo: <StudentChatDemo />,
  },
  {
    id: 4,
    title: 'You get context',
    subtitle: 'See relevant sources instantly.',
    description: '',
    icon: <Users size={60} color="#2E7D32" />,
    color: '#2E7D32',
    accentColor: '#81C784',
    demo: <TeacherAssistanceDemo />,
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
      
      {/* Demo Component at top */}
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
      
      {/* Text Content below demo */}
      <View style={styles.textContent}>
        <Text style={styles.title}>
          {slide.title}
        </Text>
        
        <Text style={styles.subtitle}>
          {slide.subtitle}
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
          <View style={styles.buttonContainer}>
            <Pressable 
              onPress={handleGetStarted} 
              style={[styles.getStartedButton, { backgroundColor: currentSlide.color }]}
            >
              <Text style={styles.getStartedText}>Get Started</Text>
              <CheckCircle size={20} color={colors.white} />
            </Pressable>
          </View>
        ) : (
          <View style={styles.buttonContainer}>
            <Pressable 
              onPress={goToNext} 
              style={[styles.nextButton, { backgroundColor: currentSlide.color }]}
            >
              <Text style={styles.nextText}>Next</Text>
              <ChevronRight size={20} color={colors.white} />
            </Pressable>
          </View>
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
  // AI Usage Demo Styles
  aiUsageContainer: {
    width: 320,
    height: 240,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
  },
  aiUsageTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  aiPlatformsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 12,
  },
  aiPlatform: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    width: 80,
    height: 50,
  },
  aiPlatformName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
  },
  chatBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 6,
    minHeight: 30,
    justifyContent: 'center',
  },
  chatBubbleText: {
    fontSize: 8,
    color: colors.text,
    textAlign: 'center',
  },
  problemText: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  quoteContainer: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#666666',
    maxWidth: '90%',
  },
  quoteText: {
    fontSize: 24,
    color: colors.text,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 28,
  },

  // Teacher URL Demo Styles
  teacherUrlContainer: {
    width: 320,
    height: 240,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  urlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'center',
  },
  urlHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  urlInputContainer: {
    marginBottom: 12,
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
    marginLeft: 8,
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
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.grayLight,
    marginBottom: 8,
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
  urlBenefitText: {
    fontSize: 11,
    color: colors.success,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Student Chat Demo Styles
  studentChatContainer: {
    width: 320,
    height: 280,
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  chatHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  messagesContainer: {
    flex: 1,
    padding: 10,
    paddingTop: 8,
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
    maxWidth: '85%',
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
    fontSize: 11,
    color: colors.white,
    fontWeight: '600',
    marginBottom: 4,
  },
  sourceItem: {
    fontSize: 10,
    color: colors.white,
    opacity: 0.9,
    marginBottom: 3,
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
    backgroundColor: colors.secondaryLight,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // New source bubble styles for updated UI
  sourcesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  sourcesToggleText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '500',
  },
  timestampText: {
    fontSize: 10,
    color: colors.white,
    opacity: 0.7,
    marginTop: 4,
  },
  sourceBubble: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    marginLeft: 16,
    marginRight: 16,
    maxWidth: '85%',
    borderWidth: 1,
    borderColor: colors.grayLight,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sourceHeader: {
    marginBottom: 8,
  },
  sourceTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  sourceTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 6,
    marginRight: 6,
    lineHeight: 16,
  },
  externalLinkText: {
    fontSize: 10,
    color: colors.muted,
  },
  relevanceText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '500',
    marginLeft: 20, // Align with content below icon
  },
  sourceContent: {
    fontSize: 11,
    color: colors.text,
    lineHeight: 16,
    marginBottom: 6,
  },
  seeMoreText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '500',
  },

  // Teacher Assistance Demo Styles
  teacherAssistanceContainer: {
    width: 320,
    height: 240,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  assistanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    justifyContent: 'center',
  },
  assistanceHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  studentMessageContainer: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  studentName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  studentMessageContent: {
    fontSize: 11,
    color: colors.text,
    lineHeight: 16,
  },
  relevantSourcesContainer: {
    marginBottom: 8,
  },
  relevantSourcesTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  relevantSourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: 6,
    padding: 6,
    marginBottom: 3,
  },
  sourceDetails: {
    marginLeft: 8,
    flex: 1,
  },
  sourceRelevance: {
    fontSize: 9,
    color: colors.success,
    fontWeight: '500',
  },
  assistanceBenefitText: {
    fontSize: 10,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // Teacher Messages List Styles
  threadListContainer: {
    flex: 1,
    width: '100%',
  },
  messagesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  messageThread: {
    backgroundColor: colors.backgroundLight,
    marginBottom: 6,
    marginHorizontal: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  expandedMessageThread: {
    height: 140,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  threadContent: {
    flex: 1,
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  threadName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  threadMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  threadTime: {
    fontSize: 10,
    color: colors.muted,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  threadPreview: {
    fontSize: 11,
    color: colors.muted,
  },
  threadHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  expandedContent: {
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  
  // Open Thread Styles
  openThreadContainer: {
    flex: 1,
    width: '100%',
  },
  openChatHeader: {
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
    paddingBottom: 8,
    marginBottom: 8,
  },
  openChatHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  chatMessageContainer: {
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  studentChatBubble: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 10,
    maxWidth: '85%',
    alignSelf: 'flex-start',
  },
  studentChatText: {
    fontSize: 11,
    color: colors.white,
    lineHeight: 16,
  },
  teacherSourceBubblesContainer: {
    paddingHorizontal: 8,
    marginTop: 8,
  },
  teacherSourcesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  teacherSourcesToggleText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '500',
  },
  
  // Message Thread Demo Styles
  messageThreadContainer: {
    width: 320,
    height: 350,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  messagesHeader: {
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
    marginBottom: 8,
  },
  messagesHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  threadsContainer: {
    marginBottom: 8,
  },
  messageThreadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: colors.backgroundLight,
    borderRadius: 6,
    marginBottom: 4,
  },
  studentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarInitials: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  studentName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  messageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  messageTime: {
    fontSize: 10,
    color: colors.muted,
  },
  unreadIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  messagePreview: {
    fontSize: 11,
    color: colors.muted,
  },
  expandedThreadContainer: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    padding: 8,
  },
  expandedThreadHeader: {
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
    marginBottom: 8,
  },
  expandedThreadTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  expandedStudentMessage: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  expandedMessageText: {
    fontSize: 11,
    color: colors.white,
    lineHeight: 16,
  },
  expandedMessageTime: {
    fontSize: 9,
    color: colors.white,
    opacity: 0.7,
    marginTop: 4,
  },
  expandedSourcesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  expandedSourcesText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '500',
  },
  messageTimestamp: {
    fontSize: 10,
    color: colors.white,
    opacity: 0.7,
    marginTop: 4,
  },
  sourceChunksContainer: {
    marginTop: 8,
  },
  sourceChunk: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sourceChunkHeader: {
    marginBottom: 8,
  },
  sourceChunkTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sourceChunkTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 6,
  },
  sourceChunkContent: {
    fontSize: 11,
    color: colors.text,
    lineHeight: 16,
    marginBottom: 6,
  },
  sourceUrl: {
    fontSize: 10,
    color: colors.muted,
    fontStyle: 'italic',
  },
  sourceExpandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
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
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 60,
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
    marginBottom: 40,
    alignItems: 'center',
  },
  textContent: {
    alignItems: 'center',
    zIndex: 1,
    paddingHorizontal: 24,
    marginTop: 20,
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
    fontSize: 32,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.87)',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.60)',
    textAlign: 'center',
    marginBottom: 0,
  },
  description: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.60)',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 6,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  buttonContainer: {
    width: '100%',
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