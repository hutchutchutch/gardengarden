import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList,
  RefreshControl,
  Image,
  Pressable,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { Feather } from '@expo/vector-icons';
import { 
  CheckCircle2, 
  AlertCircle, 
  MessageCircle,
  RefreshCcw,
  Users,
  BarChart3,
  BookOpen,
  MessageSquare
} from 'lucide-react-native';
import { useMode } from '@/contexts/ModeContext';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import {
  GSModeToggle,
  GSProgressIndicator,
  GSStatCard,
  GSStudentCard,
  GSPlantCard,
  GSHealthBadge,
  GSIconButton,
  GSButton,
  GSBadge,
  GSChip,
  GSLoadingSpinner,
  GSCard
} from '@/components/ui';

interface StudentData {
  id: string;
  name: string;
  submitted: boolean;
  healthScore: number;
  daysSinceLastSubmission: number;
  plantStage: 'seed' | 'sprout' | 'growing' | 'mature';
  needsAttention: boolean;
  lastPhotoUrl?: string;
  missedTasks?: number;
  timeAgo?: string;
}

interface ClassStats {
  totalStudents: number;
  submissionsToday: number;
  averageHealthScore: number;
  plantsNeedingAttention: number;
  participationRate: number;
  weeklyHealthScores: number[];
  healthDistribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
}

export default function TeacherIndex() {
  const { user, setShowFAB } = useAuth();
  const { isTeacherMode, setIsTeacherMode } = useMode();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(3);
  
  // Mock data - In real app, fetch from Supabase
  const [classStats, setClassStats] = useState<ClassStats>({
    totalStudents: 28,
    submissionsToday: 24,
    averageHealthScore: 82,
    plantsNeedingAttention: 3,
    participationRate: 86,
    weeklyHealthScores: [78, 80, 79, 82, 85, 83, 82],
    healthDistribution: {
      excellent: 12,
      good: 10,
      fair: 4,
      poor: 2
    }
  });

  const [pendingStudents, setPendingStudents] = useState<StudentData[]>([
    { 
      id: '1', 
      name: 'Maya Patel', 
      submitted: false, 
      healthScore: 78, 
      daysSinceLastSubmission: 1, 
      plantStage: 'growing', 
      needsAttention: true, 
      missedTasks: 2
    },
    { 
      id: '2', 
      name: 'Jordan Kim', 
      submitted: false, 
      healthScore: 65, 
      daysSinceLastSubmission: 0, 
      plantStage: 'sprout', 
      needsAttention: true,
      missedTasks: 3
    },
  ]);

  const [recentSubmissions, setRecentSubmissions] = useState<StudentData[]>([
    { 
      id: '3', 
      name: 'Sarah Chen', 
      submitted: true, 
      healthScore: 85, 
      daysSinceLastSubmission: 0, 
      plantStage: 'growing', 
      needsAttention: false,
      timeAgo: '5m ago',
      lastPhotoUrl: 'https://images.unsplash.com/photo-1515150144380-bca9f1650ed9'
    },
    { 
      id: '4', 
      name: 'Alex Rivera', 
      submitted: true, 
      healthScore: 92, 
      daysSinceLastSubmission: 0, 
      plantStage: 'mature', 
      needsAttention: false,
      timeAgo: '15m ago',
      lastPhotoUrl: 'https://images.unsplash.com/photo-1515150144380-bca9f1650ed9'
    },
    { 
      id: '5', 
      name: 'Emma Wilson', 
      submitted: true, 
      healthScore: 88, 
      daysSinceLastSubmission: 0, 
      plantStage: 'growing', 
      needsAttention: false,
      timeAgo: '23m ago',
      lastPhotoUrl: 'https://images.unsplash.com/photo-1515150144380-bca9f1650ed9'
    },
  ]);

  const router = useRouter();

  useEffect(() => {
    // Show FAB on teacher dashboard
    setShowFAB(true);
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (!isTeacherMode) {
      router.replace('/screens/student-index');
    }
  }, [isTeacherMode]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // In real app, fetch from Supabase
      // Removed artificial delay for better performance
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleOpenChat = (studentId: string) => {
    // Navigate to chat with student
    console.log('Open chat with student:', studentId);
  };

  const renderHealthRow = (label: string, count: number, color: string) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View 
          style={{ 
            width: 12, 
            height: 12, 
            borderRadius: 6, 
            marginRight: 8,
            backgroundColor: color 
          }}
        />
        <Text style={{ fontSize: 14, color: '#000' }}>{label}</Text>
      </View>
      <Text style={{ fontSize: 14, fontWeight: '500', color: '#000' }}>{count}</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <GSLoadingSpinner size="large" />
      </View>
    );
  }

  const submissionPercentage = Math.round((classStats.submissionsToday / classStats.totalStudents) * 100);
  const yesterdayDate = format(new Date(Date.now() - 86400000), 'EEEE, MMMM d');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{ flex: 1 }}>
        {/* Fixed Mode Toggle at the top - standardized across all screens */}
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, backgroundColor: 'white' }}>
          <GSModeToggle />
        </View>
        
        {/* Scrollable Content */}
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 80 }}
        >

        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          {/* Current Lesson Progress Section */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#000' }}>Current Lesson Progress</Text>
            <GSCard variant="elevated" padding="large">
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#000' }}>Growing Tomatoes</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                  <GSChip label="Tomato" />
                  <View style={{ marginLeft: 8 }}>
                    <GSBadge label="Day 23 of 75" variant="secondary" />
                  </View>
                </View>
              </View>
              
              <View style={{ marginBottom: 12 }}>
                <GSProgressIndicator type="linear" progress={0.31} />
              </View>
              <Text style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
                {75 - 23} days remaining
              </Text>
              
              {/* Health Stats */}
              <GSCard variant="filled" padding="medium" margin="none">
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 14, color: '#666' }}>Average Health</Text>
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#000' }}>
                    {classStats.averageHealthScore}%
                  </Text>
                  <Text style={{ fontSize: 14, color: '#22c55e' }}>↑ +5% from yesterday</Text>
                </View>
                
                <View style={{ borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 12 }}>
                  {renderHealthRow('Excellent', classStats.healthDistribution.excellent, '#4CAF50')}
                  {renderHealthRow('Good', classStats.healthDistribution.good, '#8BC34A')}
                  {renderHealthRow('Fair', classStats.healthDistribution.fair, '#FFB74D')}
                  {renderHealthRow('Poor', classStats.healthDistribution.poor, '#F44336')}
                </View>
              </GSCard>
              
              <View style={{ marginTop: 16 }}>
                <GSButton
                  variant="secondary"
                  onPress={() => router.push('/(tabs)/lessons')}
                >
                  View Details →
                </GSButton>
              </View>
            </GSCard>
          </View>

          {/* Task Completion Section */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#000' }}>Task Completion</Text>
              <Text style={{ fontSize: 14, color: '#666' }}>{yesterdayDate}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <GSStatCard
                  value={`${classStats.participationRate}%`}
                  label="Completed All Tasks"
                  icon="check-circle"
                />
              </View>
              <View style={{ flex: 1 }}>
                <GSStatCard
                  value={pendingStudents.length.toString()}
                  label="Students Pending"
                  icon="alert-circle"
                />
              </View>
            </View>

            {/* Pending Students List */}
            {pendingStudents.length > 0 && (
              <View>
                <Text style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>
                  Students who need encouragement
                </Text>
                <View style={{ gap: 8 }}>
                  {pendingStudents.slice(0, 5).map((student) => (
                    <GSStudentCard
                      key={student.id}
                      name={student.name}
                      plantName={`Missed ${student.missedTasks} tasks`}
                      healthScore={student.healthScore}
                      onPress={() => router.push('/profile')}
                      onMessage={() => handleOpenChat(student.id)}
                    />
                  ))}
                </View>
                {pendingStudents.length > 5 && (
                  <View style={{ marginTop: 8 }}>
                    <GSButton
                      variant="secondary"
                      onPress={() => router.push('/profile')}
                    >
                      See all {pendingStudents.length} students →
                    </GSButton>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Photo Submissions Section */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#000' }}>Today's Gardens</Text>
              <GSIconButton
                icon="refresh-ccw"
                size={20}
                onPress={onRefresh}
              />
            </View>

            {/* Submission Stats */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ marginRight: 16 }}>
                <GSProgressIndicator
                  type="circular"
                  progress={submissionPercentage / 100}
                  size="large"
                  showPercentage
                />
              </View>
              <Text style={{ fontSize: 16, color: '#666' }}>
                {classStats.submissionsToday} of {classStats.totalStudents} submitted
              </Text>
            </View>

            {/* Photo Grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
              {recentSubmissions.slice(0, 6).map((submission, index) => (
                <View key={submission.id} style={{ width: '33.33%', paddingHorizontal: 4, marginBottom: 8 }}>
                  <GSPlantCard
                    imageUrl={submission.lastPhotoUrl || 'https://via.placeholder.com/150'}
                    studentName={submission.name}
                    plantName="Tomato"
                    dayNumber={23}
                    healthScore={submission.healthScore}
                    onExpand={() => router.push('/modal')}
                  />
                </View>
              ))}
            </View>
            <View style={{ marginTop: 8 }}>
              <GSButton
                variant="secondary"
                onPress={() => router.push('/(tabs)/camera')}
              >
                View all photos →
              </GSButton>
            </View>
          </View>

          {/* Quick Actions Section */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#000' }}>Quick Actions</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
              <View style={{ width: '50%', paddingHorizontal: 6, marginBottom: 12 }}>
                <View style={{ position: 'relative' }}>
                  <GSButton
                    variant="primary"
                    onPress={() => router.push('/ai-chat')}
                    size="medium"
                    fullWidth
                    icon="message-square"
                  >
                    Messages
                  </GSButton>
                  {unreadMessages > 0 && (
                    <View style={{ 
                      position: 'absolute', 
                      top: -8, 
                      right: -8, 
                      backgroundColor: '#ef4444', 
                      borderRadius: 12, 
                      width: 24, 
                      height: 24, 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}>
                      <Text style={{ fontSize: 12, color: 'white', fontWeight: '600' }}>{unreadMessages}</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={{ width: '50%', paddingHorizontal: 6, marginBottom: 12 }}>
                <GSButton
                  variant="secondary"
                  onPress={() => router.push('/(tabs)/profile')}
                  size="medium"
                  fullWidth
                  icon="users"
                >
                  Students
                </GSButton>
              </View>
              <View style={{ width: '50%', paddingHorizontal: 6, marginBottom: 12 }}>
                <GSButton
                  variant="secondary"
                  onPress={() => router.push('/(tabs)/progress')}
                  size="medium"
                  fullWidth
                  icon="bar-chart-3"
                >
                  Analytics
                </GSButton>
              </View>
              <View style={{ width: '50%', paddingHorizontal: 6, marginBottom: 12 }}>
                <GSButton
                  variant="secondary"
                  onPress={() => router.push('/(tabs)/lessons')}
                  size="medium"
                  fullWidth
                  icon="book-open"
                >
                  Lessons
                </GSButton>
              </View>
            </View>
          </View>
        </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
} 