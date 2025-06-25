import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Image,
  FlatList,
  ViewToken,
} from 'react-native';
import { useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: any;
  icon: keyof typeof Feather.glyphMap;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Welcome to GardenSnap',
    subtitle: 'Your Plant Learning Companion',
    description: 'Discover, learn, and grow with our interactive gardening platform designed for students and teachers.',
    image: require('@/assets/images/Onboarding.webp'),
    icon: 'home',
  },
  {
    id: '2',
    title: 'Scan & Identify',
    subtitle: 'AI-Powered Plant Recognition',
    description: 'Take photos of plants and get instant identification with detailed information about species, care, and growing tips.',
    image: require('@/assets/images/Scan.webp'),
    icon: 'camera',
  },
  {
    id: '3',
    title: 'Learn & Analyze',
    subtitle: 'Deep Plant Knowledge',
    description: 'Access comprehensive plant analysis, care guides, and educational content to become a gardening expert.',
    image: require('@/assets/images/Analysis.webp'),
    icon: 'book-open',
  },
  {
    id: '4',
    title: 'Track Progress',
    subtitle: 'Complete Tasks & Stories',
    description: 'Engage with interactive lessons, complete gardening tasks, and track your learning journey.',
    image: require('@/assets/images/Task.webp'),
    icon: 'trending-up',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  const onViewableItemsChanged = ({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  };

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const goToNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      router.push('/auth/signin');
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({ index: currentIndex - 1 });
    }
  };

  const skip = () => {
    router.push('/auth/signin');
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={styles.slide}>
      <View style={styles.imageContainer}>
        <Image source={item.image} style={styles.image} resizeMode="contain" />
        <View style={styles.iconOverlay}>
          <Feather name={item.icon} size={24} color={colors.primary} />
        </View>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {slides.map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index === currentIndex ? styles.activeDot : styles.inactiveDot,
          ]}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={skip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      {renderDots()}

      <View style={styles.footer}>
        <Pressable
          onPress={goToPrevious}
          style={[styles.button, styles.previousButton]}
          disabled={currentIndex === 0}
        >
          <Feather 
            name="chevron-left" 
            size={20} 
            color={currentIndex === 0 ? colors.grayLight : colors.primary} 
          />
          <Text style={[
            styles.buttonText, 
            styles.previousButtonText,
            currentIndex === 0 && styles.disabledButtonText
          ]}>
            Previous
          </Text>
        </Pressable>

        <Pressable onPress={goToNext} style={[styles.button, styles.nextButton]}>
          <Text style={[styles.buttonText, styles.nextButtonText]}>
            {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <Feather name="chevron-right" size={20} color={colors.white} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
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
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '500',
  },
  slide: {
    width,
    flex: 1,
    paddingHorizontal: 24,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    width: width * 0.8,
    height: width * 0.6,
    borderRadius: 16,
  },
  iconOverlay: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: colors.primary,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: colors.grayLight,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    justifyContent: 'center',
  },
  previousButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.grayLight,
  },
  nextButton: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 4,
  },
  previousButtonText: {
    color: colors.primary,
  },
  nextButtonText: {
    color: colors.white,
  },
  disabledButtonText: {
    color: colors.grayLight,
  },
}); 