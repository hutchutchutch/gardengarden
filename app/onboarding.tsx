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
  Sparkles
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactElement;
  color: string;
  accentColor: string;
}

const slides: OnboardingSlide[] = [
  {
    id: 1,
    title: 'Your students will be using AI',
    subtitle: 'The future of learning is here',
    description: 'AI tools are becoming essential in education. Students are already using chatbots for homework, research, and learning support.',
    icon: <Brain size={60} color="#4CAF50" />,
    color: '#4CAF50',
    accentColor: '#E8F5E9',
  },
  {
    id: 2,
    title: 'So give them one that you trust',
    subtitle: 'Quality education requires quality tools',
    description: 'Not all AI is created equal. Your students deserve an AI assistant that provides accurate, educational, and age-appropriate responses.',
    icon: <Shield size={60} color="#43A047" />,
    color: '#43A047',
    accentColor: '#C8E6C9',
  },
  {
    id: 3,
    title: 'By choosing the knowledge that goes into their Chatbot',
    subtitle: 'Curated content for better learning',
    description: 'Take control of your students\' AI experience. Customize the knowledge base with curriculum-aligned content you trust.',
    icon: <BookOpen size={60} color="#388E3C" />,
    color: '#388E3C',
    accentColor: '#A5D6A7',
  },
  {
    id: 4,
    title: 'Garden Guru Demo',
    subtitle: 'Example implementation',
    description: 'This app is an example of how the teacher of a gardening class could implement this approach to enhance learning with AI assistance.',
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
      }, 4000); // 4 seconds per slide

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
        <View style={[styles.iconContainer, { backgroundColor: slide.accentColor }]}>
          {slide.icon}
          <View style={[styles.iconGlow, { backgroundColor: slide.color + '30' }]} />
        </View>
        
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