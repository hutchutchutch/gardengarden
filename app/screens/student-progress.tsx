import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePlantStore } from '@/store/plant-store';
import { useAuth } from '@/contexts/AuthContext';
import { useMode } from '@/contexts/ModeContext';
import { useAppTheme } from '@/config/theme';
import { ImageAnalysisService, ImageAnalysisRecord } from '@/services/image-analysis-service';
import {
  GSScreenLayout,
  GSCard,
  GSButton,
  GSBadge,
  GSChip,
  GSProgressIndicator,
  GSEmptyState,
  GSIconButton,
  GSStatCard,
  Text,
  SectionHeader,
  GSHealthBadge,
  GSGuidanceCard,
  GSTaskChecklist,
  GSMilestone,
  GSFAB,
  GSHeader,
  GSLoadingSpinner,
} from '@/components/ui';

// Mock data
const growthStages = [
  { id: 'seed', name: 'Seed', days: 3, completed: true },
  { id: 'sprout', name: 'Sprout', days: 7, completed: true },
  { id: 'seedling', name: 'Seedling', days: 14, completed: true },
  { id: 'vegetative', name: 'Vegetative', days: 21, completed: false, current: true },
  { id: 'flowering', name: 'Flowering', days: 14, completed: false },
  { id: 'fruiting', name: 'Fruiting', days: 30, completed: false },
];

const achievements = [
  { id: '1', name: 'First Sprout', icon: 'sprout', unlocked: true, description: 'Your seed has sprouted!' },
  { id: '2', name: 'Week Streak', icon: 'fire', unlocked: true, description: '7 days in a row' },
  { id: '3', name: 'Healthy Plant', icon: 'heart', unlocked: true, description: 'Maintained 80%+ health' },
  { id: '4', name: 'Green Thumb', icon: 'hand-peace', unlocked: false, description: 'Complete vegetative stage' },
  { id: '5', name: 'First Flower', icon: 'flower', unlocked: false, description: 'Reach flowering stage' },
  { id: '6', name: 'Harvest Ready', icon: 'fruit-cherries', unlocked: false, description: 'First fruit appears' },
];

export default function StudentProgressScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { user } = useAuth();
  const { isTeacherMode } = useMode();
  const { plants, fetchPlants } = usePlantStore();
  const [loading, setLoading] = useState(true);

  const activePlant = plants[0];
  const plantAge = activePlant
    ? Math.floor(
        (new Date().getTime() - new Date(activePlant.plantedDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  const currentStage = growthStages.find(stage => stage.current) || growthStages[3];
  const totalDays = growthStages.reduce((sum, stage) => sum + stage.days, 0);
  const completedDays = growthStages.filter(s => s.completed).reduce((sum, stage) => sum + stage.days, 0) + 3; // Mock days in current stage
  const overallProgress = Math.round((completedDays / totalDays) * 100);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchPlants();
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (isTeacherMode) {
      router.replace('/screens/teacher-progress');
    }
  }, [isTeacherMode]);

  if (loading) {
    return <GSScreenLayout isLoading={true} />;
  }

  if (!activePlant) {
    return (
      <GSScreenLayout>
        <GSHeader title="My Progress" variant="back" onBack={() => router.back()} />
        <GSEmptyState
          icon="sprout"
          title="No Plant Data"
          description="Start your first lesson to begin your garden journey!"
          actionLabel="Explore Lessons"
          onAction={() => router.push('/(tabs)/lessons')}
        />
      </GSScreenLayout>
    );
  }

  return (
    <GSScreenLayout showModeToggle={false}>
      <GSHeader
        title="My Progress"
        variant="back"
        onBack={() => router.back()}
        actions={[{ icon: 'share-variant-outline', onPress: () => {} }]}
      />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.modeToggleContainer}>
          <GSModeToggle />
        </View>

        {/* Hero Section */}
        <View style={styles.section}>
          <SectionHeader title="Progress Overview" />
          <GSCard variant="elevated" padding="large" style={styles.heroCard}>
            <View style={styles.heroContent}>
              <GSProgressIndicator
                type="circular"
                progress={completedDays / totalDays}
                size="large"
                showPercentage={false}
              />
              <View style={styles.heroTextContainer}>
                <Text style={styles.heroDayNumber}>{plantAge}</Text>
                <Text style={styles.heroDayLabel}>of {totalDays} days</Text>
              </View>
            </View>
            <GSBadge label={`Current Stage: ${currentStage.name}`} variant="primary" size="large" />
          </GSCard>
        </View>

        {/* Key Metrics Grid */}
        <View style={styles.section}>
          <SectionHeader title="Your Garden Stats" />
          <View style={styles.statsGrid}>
            <GSStatCard label="Current Streak" value="7 days" icon="fire" className={styles.statCard} />
            <GSStatCard label="Photos Taken" value="12" icon="camera-outline" className={styles.statCard} />
            <GSStatCard label="Average Health" value="88%" icon="heart-outline" className={styles.statCard} />
            <GSStatCard label="Badges Earned" value="3/12" icon="trophy-outline" className={styles.statCard} />
          </View>
        </View>

        {/* Health Trend Chart */}
        <View style={styles.section}>
          <SectionHeader title="Plant Health Journey" />
          <GSCard variant="elevated" padding="medium">
            <View style={styles.chartPlaceholder}>
              <Text>Health Trend Chart Placeholder</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipContainer}>
                <GSChip label="80-100%" variant="success" />
                <GSChip label="60-79%" variant="primary" />
                <GSChip label="40-59%" variant="warning" />
                <GSChip label="<40%" variant="destructive" />
              </View>
            </ScrollView>
          </GSCard>
        </View>

        {/* Growth Milestones */}
        <View style={styles.section}>
          <SectionHeader title="Growth Milestones" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.milestonesContainer}>
              {growthStages.map(stage => (
                <GSMilestone
                  key={stage.id}
                  icon={stage.completed ? 'check-circle' : 'circle-outline'}
                  title={stage.name}
                  description={`${stage.days} days`}
                  date={stage.completed ? 'Completed' : stage.current ? 'In Progress' : 'Upcoming'}
                />
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <SectionHeader title="Achievements">
            <GSButton onPress={() => {}}>View All</GSButton>
          </SectionHeader>
          <View style={styles.achievementGrid}>
            {achievements.slice(0, 6).map(ach => (
              <View key={ach.id} style={styles.achievementItem}>
                <GSIconButton
                  icon={ach.icon}
                  size={32}
                  onPress={() => {}}
                  mode="contained"
                  disabled={!ach.unlocked}
                />
                <Text style={styles.achievementName}>{ach.name}</Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
      <GSFAB icon="camera" onPress={() => router.push('/(tabs)/camera')} />
    </GSScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 80,
  },
  modeToggleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  heroCard: {
    alignItems: 'center',
    gap: 16,
  },
  heroContent: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTextContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  heroDayNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  heroDayLabel: {
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    marginBottom: 12,
  },
  chartPlaceholder: {
    height: 200,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  milestonesContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 16,
  },
  achievementItem: {
    alignItems: 'center',
    width: '30%',
  },
  achievementName: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});