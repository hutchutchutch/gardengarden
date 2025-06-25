import React, { useEffect, useState } from 'react';
import { View, ScrollView, Image, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  TrendingUp, 
  Droplets, 
  Sun, 
  MessageCircle, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  Lightbulb,
  Target,
  HelpCircle
} from 'lucide-react-native';
import { usePlantStore } from '@/store/plant-store';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Text, Button } from 'react-native-paper';

// Mock weekly task data
const weeklyTasks = [
  { day: 'Mon', date: 18, completed: true, tasks: ['Photo', 'Water', 'Measure'] },
  { day: 'Tue', date: 19, completed: true, tasks: ['Photo', 'Observe'] },
  { day: 'Wed', date: 20, completed: false, tasks: ['Photo', 'Water', 'Journal'] },
  { day: 'Thu', date: 21, completed: true, tasks: ['Photo', 'Measure'] },
  { day: 'Fri', date: 22, completed: false, tasks: ['Photo', 'Water', 'Quiz'] },
  { day: 'Sat', date: 23, completed: true, tasks: ['Photo', 'Observe'] },
  { day: 'Sun', date: 24, completed: true, tasks: ['Photo', 'Journal'] },
];

// Mock plant tips
const plantTips = [
  {
    id: '1',
    category: 'Watering',
    tip: 'Your tomato plant needs deep, infrequent watering. Check soil moisture 2 inches down.',
    icon: '💧',
    priority: 'high'
  },
  {
    id: '2',
    category: 'Growth',
    tip: 'At 3 weeks old, your plant should start showing its second set of true leaves.',
    icon: '🌱',
    priority: 'medium'
  },
  {
    id: '3',
    category: 'Light',
    tip: 'Tomatoes need 6-8 hours of direct sunlight. Consider rotating your plant for even growth.',
    icon: '☀️',
    priority: 'medium'
  },
  {
    id: '4',
    category: 'Problem',
    tip: 'Yellow lower leaves are normal as your plant grows. Remove them to encourage new growth.',
    icon: '🍃',
    priority: 'low'
  }
];

export default function StudentProgressScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { plants, fetchPlants } = usePlantStore();
  
  const activePlant = plants[0];
  const plantAge = activePlant ? 
    Math.floor((new Date().getTime() - new Date(activePlant.plantedDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  const completedDays = weeklyTasks.filter(day => day.completed).length;
  const completionRate = Math.round((completedDays / weeklyTasks.length) * 100);

  useEffect(() => {
    fetchPlants();
  }, []);

  const handleAskQuestion = (context?: string) => {
    router.push({
      pathname: '/ai-chat',
      params: { context: context || 'general' }
    });
  };

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
          
          {/* Weekly Progress Calendar */}
          <Card>
            <CardHeader>
              <View style={styles.headerRow}>
                <View>
                  <CardTitle 
                    title="This Week's Progress"
                    left={() => <Calendar size={20} color="#10B981" />}
                    style={styles.titleRow}
                  />
                  <CardDescription>
                    <Text>{completedDays}/7 days completed ({completionRate}%)</Text>
                  </CardDescription>
                </View>
                <Badge style={[
                  styles.badge,
                  completionRate >= 80 ? styles.badgeGreen :
                  completionRate >= 60 ? styles.badgeAmber : styles.badgeRed
                ]}>
                  <Text style={styles.badgeText}>{completionRate}%</Text>
                </Badge>
              </View>
            </CardHeader>
            <CardContent>
              <View style={styles.weekRow}>
                {weeklyTasks.map((day, index) => (
                  <View key={index} style={styles.dayItem}>
                    <Text style={styles.dayLabel}>{day.day}</Text>
                    <View style={[
                      styles.dayCircle,
                      day.completed ? styles.dayCircleCompleted : styles.dayCircleIncomplete
                    ]}>
                      {day.completed ? (
                        <CheckCircle size={24} color="#10B981" />
                      ) : (
                        <AlertTriangle size={24} color="#EF4444" />
                      )}
                    </View>
                    <Text style={styles.dayDate}>{day.date}</Text>
                  </View>
                ))}
              </View>
              <Progress value={completionRate} style={styles.progressBar} />
            </CardContent>
          </Card>

          {/* Plant Status Card */}
          <Card>
            <CardHeader>
              <View style={styles.plantHeaderRow}>
                <View style={styles.flex}>
                  <CardTitle title={activePlant.name || 'My Plant'} />
                  <CardDescription>
                    <Text>{activePlant.species} • {plantAge} days old</Text>
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
              <View style={styles.gap4}>
                {/* Health Status */}
                <View>
                  <View style={styles.healthRow}>
                    <Text style={styles.labelText}>Plant Health</Text>
                    <Text style={styles.boldText}>{activePlant.healthScore}%</Text>
                  </View>
                  <Progress value={activePlant.healthScore} style={styles.healthProgress} />
                  <Text style={styles.healthDescription}>
                    {activePlant.healthScore >= 80 ? 'Excellent condition!' : 
                     activePlant.healthScore >= 70 ? 'Good health' : 
                     activePlant.healthScore >= 60 ? 'Needs attention' : 'Requires immediate care'}
                  </Text>
                </View>

                {/* Growth Comparison */}
                <View>
                  <Text style={styles.sectionTitle}>Growth vs Expected</Text>
                  <View style={styles.growthRow}>
                    <View style={styles.flex}>
                      <Text style={styles.statLabel}>Height</Text>
                      <Text style={styles.statValue}>15 inches</Text>
                      <Text style={styles.statAhead}>+2" ahead</Text>
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.statLabel}>Leaves</Text>
                      <Text style={styles.statValue}>12 leaves</Text>
                      <Text style={styles.statOnTrack}>On track</Text>
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.statLabel}>Stage</Text>
                      <Text style={styles.statValue}>Vegetative</Text>
                      <Text style={styles.statAhead}>Early</Text>
                    </View>
                  </View>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Plant-Specific Tips */}
          <Card>
            <CardHeader>
              <CardTitle 
                title={`Tips for Your ${activePlant.species}`}
                left={() => <Lightbulb size={20} color="#EAB308" />}
              />
              <CardDescription>
                <Text>Personalized advice based on your plant's progress</Text>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <View style={styles.gap3}>
                {plantTips.map((tip) => (
                  <View key={tip.id} style={[
                    styles.tipCard,
                    tip.priority === 'high' ? styles.tipCardHigh :
                    tip.priority === 'medium' ? styles.tipCardMedium : 
                    styles.tipCardLow
                  ]}>
                    <View style={styles.tipContent}>
                      <Text style={styles.tipIcon}>{tip.icon}</Text>
                      <View style={styles.flex}>
                        <Text style={styles.tipCategory}>{tip.category}</Text>
                        <Text style={styles.tipText}>{tip.tip}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>

          {/* Ask Questions Section */}
          <Card>
            <CardHeader>
              <CardTitle title="Need Help?" />
              <CardDescription>
                <Text>Ask questions about your plant or assignments</Text>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <View style={styles.gap3}>
                <Button 
                  mode="contained"
                  icon={() => <MessageCircle size={16} color="white" />}
                  onPress={() => handleAskQuestion('plant-care')}
                >
                  Ask About Plant Care
                </Button>
                
                <Button 
                  mode="outlined"
                  icon={() => <Target size={16} color="#3B82F6" />}
                  onPress={() => handleAskQuestion('assignments')}
                >
                  Help with Assignments
                </Button>
                
                <Button 
                  mode="outlined"
                  icon={() => <HelpCircle size={16} color="#3B82F6" />}
                  onPress={() => handleAskQuestion('general')}
                >
                  General Questions
                </Button>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeGreen: {
    backgroundColor: '#10B981',
  },
  badgeAmber: {
    backgroundColor: '#F59E0B',
  },
  badgeRed: {
    backgroundColor: '#EF4444',
  },
  badgeText: {
    color: '#FFFFFF',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayItem: {
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  dayCircle: {
    height: 40,
    width: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  dayCircleCompleted: {
    backgroundColor: '#D1FAE5',
  },
  dayCircleIncomplete: {
    backgroundColor: '#FEE2E2',
  },
  dayDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressBar: {
    marginTop: 16,
  },
  plantHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  flex: {
    flex: 1,
  },
  plantImage: {
    height: 64,
    width: 64,
    borderRadius: 8,
  },
  gap4: {
    gap: 16,
  },
  gap3: {
    gap: 12,
  },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '500',
  },
  boldText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  healthProgress: {
    marginBottom: 4,
  },
  healthDescription: {
    fontSize: 12,
    color: '#64748B',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  growthRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  statValue: {
    fontWeight: '600',
  },
  statAhead: {
    fontSize: 12,
    color: '#10B981',
  },
  statOnTrack: {
    fontSize: 12,
    color: '#F59E0B',
  },
  tipCard: {
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  tipCardHigh: {
    backgroundColor: '#FEF2F2',
    borderLeftColor: '#EF4444',
  },
  tipCardMedium: {
    backgroundColor: '#FFFBEB',
    borderLeftColor: '#F59E0B',
  },
  tipCardLow: {
    backgroundColor: '#EFF6FF',
    borderLeftColor: '#3B82F6',
  },
  tipContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipIcon: {
    fontSize: 18,
  },
  tipCategory: {
    fontWeight: '500',
    fontSize: 14,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: '#64748B',
  },
}); 