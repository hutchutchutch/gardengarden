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
import { supabase } from '@/config/supabase';
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
  const [unreadMessages, setUnreadMessages] = useState(0);
  
  const [classStats, setClassStats] = useState<ClassStats>({
    totalStudents: 0,
    submissionsToday: 0,
    averageHealthScore: 0,
    plantsNeedingAttention: 0,
    participationRate: 0,
    weeklyHealthScores: [],
    healthDistribution: {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0
    }
  });

  const [pendingStudents, setPendingStudents] = useState<StudentData[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<StudentData[]>([]);

  const router = useRouter();

  useEffect(() => {
    // Show FAB on teacher dashboard
    setShowFAB(true);
    if (user?.id) {
      loadDashboardData();
    }
  }, [user?.id]);

  useEffect(() => {
    if (!isTeacherMode) {
      router.replace('/screens/student-index');
    }
  }, [isTeacherMode]);

  const loadDashboardData = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      // Get teacher's class
      const { data: classData } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', user.id)
        .single();
      
      if (!classData) return;
      
      // Get all students in class
      const { data: students } = await supabase
        .from('users')
        .select(`
          *,
          plants!inner(
            *,
            daily_submissions(*)
          )
        `)
        .eq('class_id', classData.id)
        .eq('role', 'student');
      
      const totalStudents = students?.length || 0;
      
      // Get today's submissions
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: todaySubmissions } = await supabase
        .from('daily_submissions')
        .select(`
          *,
          plant:plants!inner(
            *,
            student:users!plants_student_id_fkey(*)
          )
        `)
        .gte('created_at', today.toISOString())
        .eq('plant.lesson_id', '11112222-3333-4444-5555-666677778888'); // Current active lesson
      
      // Calculate stats
      const submissionsToday = todaySubmissions?.length || 0;
      const avgHealth = todaySubmissions?.reduce((sum, sub) => sum + (sub.health_score || 0), 0) / (submissionsToday || 1);
      
      // Get students who haven't submitted today
      const submittedStudentIds = new Set(todaySubmissions?.map(s => s.plant.student_id));
      const pendingStudentsList = students?.filter(s => 
        !submittedStudentIds.has(s.id) && s.plants.length > 0
      ).map(s => ({
        id: s.id,
        name: s.name,
        submitted: false,
        healthScore: s.plants[0]?.current_health_score || 0,
        daysSinceLastSubmission: 0,
        plantStage: s.plants[0]?.current_stage || 'seed',
        needsAttention: s.plants[0]?.current_health_score < 70,
        missedTasks: Math.floor(Math.random() * 4) // TODO: Calculate actual missed tasks
      } as StudentData)) || [];
      
      // Get recent submissions for display
      const recentSubmissionsList = todaySubmissions?.slice(0, 6).map(sub => ({
        id: sub.id,
        name: sub.plant.student.name,
        submitted: true,
        healthScore: sub.health_score || 0,
        daysSinceLastSubmission: 0,
        plantStage: sub.growth_stage as any || 'growing',
        needsAttention: false,
        lastPhotoUrl: sub.photo_url,
        timeAgo: getTimeAgo(new Date(sub.created_at))
      } as StudentData)) || [];
      
      // Count unread messages
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .not('sender_id', 'is', null);
      
      setUnreadMessages(count || 0);
      
      // Health distribution
      const healthDist = {
        excellent: todaySubmissions?.filter(s => s.health_score >= 90).length || 0,
        good: todaySubmissions?.filter(s => s.health_score >= 80 && s.health_score < 90).length || 0,
        fair: todaySubmissions?.filter(s => s.health_score >= 70 && s.health_score < 80).length || 0,
        poor: todaySubmissions?.filter(s => s.health_score < 70).length || 0
      };
      
      setClassStats({
        totalStudents,
        submissionsToday,
        averageHealthScore: Math.round(avgHealth),
        plantsNeedingAttention: pendingStudentsList.filter(s => s.needsAttention).length,
        participationRate: Math.round((submissionsToday / totalStudents) * 100),
        weeklyHealthScores: [78, 80, 79, 82, 85, 83, Math.round(avgHealth)], // TODO: Calculate actual weekly scores
        healthDistribution: healthDist
      });
      
      setPendingStudents(pendingStudentsList);
      setRecentSubmissions(recentSubmissionsList);
      
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
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