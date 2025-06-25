import React, { useEffect, useState } from 'react';
import { View, ScrollView, Image, Pressable, TextInput, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { usePlantStore } from '@/store/plant-store';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Text, Button } from 'react-native-paper';
import { Award, TrendingUp, Calendar } from 'lucide-react-native';
import colors from '@/constants/colors';
import { useTaskStore } from '@/store/task-store';
import { useStoryStore } from '@/store/story-store';
import PlantCard from '@/components/PlantCard';

// Mock data for achievements
const achievements = [
  { id: '1', name: 'First Sprout', description: 'Your seed sprouted!', icon: '🌱', earned: true, date: '2024-03-15' },
  { id: '2', name: 'Week Warrior', description: '7-day photo streak', icon: '📸', earned: true, date: '2024-03-20' },
  { id: '3', name: 'Flowering Expert', description: 'First flower appeared', icon: '🌸', earned: false, progress: 80 },
  { id: '4', name: 'Problem Solver', description: 'Fixed 5 plant issues', icon: '🔧', earned: false, progress: 60 },
  { id: '5', name: 'Green Thumb', description: 'Plant health above 90% for a week', icon: '👍', earned: false, progress: 40 },
];

// Timeline milestones
const milestones = [
  { stage: 'Seed', day: 0, reached: true },
  { stage: 'Sprout', day: 7, reached: true },
  { stage: 'Vegetative', day: 14, reached: true },
  { stage: 'Flowering', day: 28, reached: false, predicted: true },
  { stage: 'Fruiting', day: 45, reached: false },
  { stage: 'Harvest', day: 75, reached: false },
];

export default function ProgressScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { plants, fetchPlants } = usePlantStore();
  const [editingNickname, setEditingNickname] = useState(false);
  
  const activePlant = plants[0];
  const plantAge = activePlant ? 
    Math.floor((new Date().getTime() - new Date(activePlant.plantedDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  useEffect(() => {
    fetchPlants();
  }, []);

  const getHealthColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 70) return '#059669';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  // Mock health history data
  const healthHistory = Array.from({ length: 7 }, (_, i) => ({
    day: plantAge - 6 + i,
    score: Math.max(60, Math.min(100, (activePlant?.healthScore || 75) + Math.random() * 20 - 10))
  }));

  if (!activePlant) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No plant data available</Text>
        <Button mode="contained" onPress={() => router.push('/(tabs)/camera')} style={styles.emptyButton}>
          Start Your Garden
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Plant Profile Card */}
          <Card>
            <CardHeader>
              <View style={styles.plantHeader}>
                <View style={styles.flex}>
                  <CardTitle 
                    title={activePlant.name || 'My Plant'}
                    right={() => (
                      <Pressable onPress={() => setEditingNickname(true)}>
                        <Feather name="edit-2" size={16} color="#64748B" />
                      </Pressable>
                    )}
                  />
                  <CardDescription>
                    <Text>{activePlant.species}</Text>
                  </CardDescription>
                </View>
                {activePlant.images.length > 0 && (
                  <Image 
                    source={{ uri: activePlant.images[0].uri }}
                    style={styles.plantImage}
                    resizeMode="cover"
                  />
                )}
              </View>
            </CardHeader>
            <CardContent>
              <View style={styles.badgeRow}>
                <Badge variant="secondary">
                  <Text>Age: {plantAge} days</Text>
                </Badge>
                <Badge variant="secondary">
                  <Text>Stage: {activePlant.growthStage}</Text>
                </Badge>
                <Badge style={[
                  styles.healthBadge,
                  { backgroundColor: getHealthColor(activePlant.healthScore) }
                ]}>
                  <Text style={styles.healthBadgeText}>Health: {activePlant.healthScore}%</Text>
                </Badge>
              </View>
            </CardContent>
          </Card>

          {/* Plant Journey Timeline */}
          <Card>
            <CardHeader>
              <CardTitle title="Plant Journey" />
              <CardDescription>
                <Text>Track your progress from seed to harvest</Text>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <View style={styles.timeline}>
                {/* Timeline line */}
                <View style={styles.timelineLine} />
                
                {/* Milestones */}
                {milestones.map((milestone, index) => {
                  const isReached = plantAge >= milestone.day;
                  const isCurrent = index > 0 && plantAge >= milestones[index - 1].day && plantAge < milestone.day;
                  
                  return (
                    <View key={milestone.stage} style={styles.milestoneRow}>
                      <View style={[
                        styles.milestoneCircle,
                        isReached ? styles.milestoneReached : 
                        isCurrent ? styles.milestoneCurrent : styles.milestoneFuture
                      ]}>
                        <Text style={[
                          styles.milestoneDay,
                          (isReached || isCurrent) && styles.milestoneDayActive
                        ]}>
                          {milestone.day}
                        </Text>
                      </View>
                      <View style={styles.milestoneContent}>
                        <Text style={[
                          styles.milestoneStage,
                          !isReached && styles.milestoneStageFuture
                        ]}>
                          {milestone.stage}
                        </Text>
                        {milestone.predicted && !isReached && (
                          <Text style={styles.milestonePrediction}>
                            Expected in ~{milestone.day - plantAge} days
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </CardContent>
          </Card>

          {/* Growth Metrics Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle title="Growth Metrics" />
            </CardHeader>
            <CardContent style={styles.metricsContent}>
              {/* Health Trend */}
              <View>
                <Text style={styles.metricsLabel}>Health Trend (7 days)</Text>
                <View style={styles.healthChart}>
                  {healthHistory.map((data, index) => (
                    <View key={index} style={styles.healthBar}>
                      <View 
                        style={[
                          styles.healthBarFill,
                          { 
                            height: `${(data.score / 100) * 80}%`,
                            backgroundColor: getHealthColor(data.score)
                          }
                        ]}
                      />
                      <Text style={styles.healthBarLabel}>
                        {index === 6 ? 'Today' : `${6 - index}d`}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Growth Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <View style={styles.statHeader}>
                    <Feather name="trending-up" size={16} color="#10B981" />
                    <Text style={styles.statLabel}>Height</Text>
                  </View>
                  <Text style={styles.statValue}>18 inches</Text>
                  <Text style={styles.statSubtext}>+1.2"/week</Text>
                </View>
                <View style={styles.statItem}>
                  <View style={styles.statHeader}>
                    <Feather name="sun" size={16} color="#EAB308" />
                    <Text style={styles.statLabel}>Light</Text>
                  </View>
                  <Text style={styles.statValue}>6-8 hrs</Text>
                  <Text style={styles.statSubtext}>Optimal</Text>
                </View>
                <View style={styles.statItem}>
                  <View style={styles.statHeader}>
                    <MaterialCommunityIcons name="water-outline" size={16} color="#3B82F6" />
                    <Text style={styles.statLabel}>Water</Text>
                  </View>
                  <Text style={styles.statValue}>2x/week</Text>
                  <Text style={styles.statSubtext}>Good</Text>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Achievement Center */}
          <Card>
            <CardHeader>
              <CardTitle title="Achievements" />
              <CardDescription>
                <Text>Unlock badges as you grow</Text>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <View style={styles.achievementsGrid}>
                {achievements.map((achievement) => (
                  <Pressable
                    key={achievement.id}
                    style={[
                      styles.achievementItem,
                      achievement.earned ? styles.achievementEarned : styles.achievementLocked
                    ]}
                  >
                    <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                    <Text style={[
                      styles.achievementName,
                      achievement.earned && styles.achievementNameEarned
                    ]}>
                      {achievement.name}
                    </Text>
                    {!achievement.earned && achievement.progress && (
                      <View style={styles.achievementProgressBar}>
                        <Progress value={achievement.progress} style={styles.achievementProgress} />
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            </CardContent>
          </Card>

          {/* Class Ranking (Optional) */}
          <Card>
            <CardHeader>
              <CardTitle title="Class Ranking" />
            </CardHeader>
            <CardContent>
              <View style={styles.rankingContainer}>
                <View style={styles.rankingRow}>
                  <Text style={styles.rankingLabel}>Plant Health</Text>
                  <View style={styles.rankingValue}>
                    <Feather name="award" size={16} color="#10B981" />
                    <Text style={styles.rankingText}>#3 of 25</Text>
                  </View>
                </View>
                <View style={styles.rankingRow}>
                  <Text style={styles.rankingLabel}>Photo Streak</Text>
                  <View style={styles.rankingValue}>
                    <Feather name="award" size={16} color="#EAB308" />
                    <Text style={styles.rankingText}>#5 of 25</Text>
                  </View>
                </View>
              </View>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#64748B',
  },
  emptyButton: {
    marginTop: 16,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  plantHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  flex: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  plantImage: {
    height: 64,
    width: 64,
    borderRadius: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  healthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  healthBadgeText: {
    color: '#FFFFFF',
  },
  timeline: {
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 16,
    top: 16,
    bottom: 16,
    width: 2,
    backgroundColor: '#E5E7EB',
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  milestoneCircle: {
    height: 32,
    width: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  milestoneReached: {
    backgroundColor: '#3B82F6',
  },
  milestoneCurrent: {
    backgroundColor: 'rgba(59, 130, 246, 0.5)',
  },
  milestoneFuture: {
    backgroundColor: '#F3F4F6',
  },
  milestoneDay: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748B',
  },
  milestoneDayActive: {
    color: '#FFFFFF',
  },
  milestoneContent: {
    marginLeft: 16,
    flex: 1,
  },
  milestoneStage: {
    fontWeight: '600',
  },
  milestoneStageFuture: {
    color: '#64748B',
  },
  milestonePrediction: {
    fontSize: 12,
    color: '#64748B',
  },
  metricsContent: {
    gap: 16,
  },
  metricsLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  healthChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 80,
  },
  healthBar: {
    flex: 1,
    alignItems: 'center',
  },
  healthBarFill: {
    width: 24,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  healthBarLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flex: 1,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  statSubtext: {
    fontSize: 12,
    color: '#64748B',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementItem: {
    width: 80,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  achievementEarned: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  achievementLocked: {
    backgroundColor: '#F3F4F6',
  },
  achievementIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  achievementName: {
    fontSize: 12,
    textAlign: 'center',
    color: '#64748B',
  },
  achievementNameEarned: {
    fontWeight: '600',
    color: '#000000',
  },
  achievementProgressBar: {
    width: '100%',
    marginTop: 4,
  },
  achievementProgress: {
    height: 4,
  },
  rankingContainer: {
    gap: 12,
  },
  rankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rankingLabel: {
    fontSize: 14,
  },
  rankingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rankingText: {
    fontWeight: '600',
  },
});