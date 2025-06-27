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
import { LessonService } from '@/services/lesson-service';
import { MessageService } from '@/services/message-service';
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
import { ShimmerPlaceholder } from '@/components/ui/ShimmerPlaceholder';

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
  taskCompletionRate: number;
  overdueTasksCount: number;
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
  const { isTeacherMode, setIsTeacherMode, isSwitchingMode, setIsSwitchingMode } = useMode();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  
  const [classStats, setClassStats] = useState<ClassStats>({
    totalStudents: 0,
    submissionsToday: 0,
    averageHealthScore: 0,
    plantsNeedingAttention: 0,
    participationRate: 0,
    taskCompletionRate: 0,
    overdueTasksCount: 0,
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
      // If somehow not in teacher mode, navigate to student view immediately
      router.replace('/screens/student-index');
      return;
    }
    // Ensure switching mode is false when properly in teacher mode
    setIsSwitchingMode(false);
  }, [isTeacherMode]);

  const loadDashboardData = async () => {
    if (!user?.id) return;
    
    // Only load teacher data if user is actually a teacher
    if (user.role !== 'teacher') {
      console.log('User is not a teacher, skipping teacher dashboard data load');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      // Get current active lesson using the LessonService
      const activeLesson = await LessonService.getCurrentLesson(user.id);
      console.log('Active lesson from service:', activeLesson);
      setCurrentLesson(activeLesson);
      
      if (!activeLesson) {
        console.log('No active lesson found for teacher');
        setIsLoading(false);
        return;
      }

      // Get teacher's class for other queries
      const { data: classData } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', user.id)
        .single();
      
      if (!classData) {
        console.log('No class found for teacher');
        setIsLoading(false);
        return;
      }
      
      // Get students enrolled in the current lesson (those with plants for this lesson)
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
        .eq('role', 'student')
        .eq('plants.lesson_id', activeLesson.id);
      
      const enrolledStudents = students?.length || 0;
      
      // Get today's submissions and task data
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);
      
      let todaySubmissions: any[] = [];
      let allStudentsTaskCompletion: any[] = [];
      let overdueTasksCount = 0;
      
      if (activeLesson) {
        // Get today's submissions
        const { data: submissions } = await supabase
          .from('daily_submissions')
          .select(`
            *,
            plant:plants!inner(
              *,
              student:users!plants_student_id_fkey(*)
            )
          `)
          .gte('created_at', today.toISOString())
          .lte('created_at', todayEnd.toISOString())
          .eq('plant.lesson_id', activeLesson.id);
        
        todaySubmissions = submissions || [];
        
        // Get all tasks for today for this lesson
        const { data: todayTasks } = await supabase
          .from('lesson_tasks')
          .select('*')
          .eq('lesson_id', activeLesson.id)
          .eq('day_number', Math.max(1, Math.floor((Date.now() - new Date(activeLesson.start_date || activeLesson.created_at).getTime()) / (1000 * 60 * 60 * 24))));
        
        const totalTasksToday = todayTasks?.length || 0;
        
        // Calculate task completion for each student for today
        if (totalTasksToday > 0) {
          allStudentsTaskCompletion = await Promise.all(
            students?.map(async (student) => {
              const { data: completedTasks } = await supabase
                .from('task_submissions')
                .select('*')
                .eq('student_id', student.id)
                .eq('lesson_id', activeLesson.id)
                .gte('created_at', today.toISOString())
                .lte('created_at', todayEnd.toISOString());
              
              return {
                studentId: student.id,
                completedCount: completedTasks?.length || 0,
                totalTasks: totalTasksToday,
                completedAll: (completedTasks?.length || 0) === totalTasksToday
              };
            }) || []
          );
        }
        
        // Calculate overdue tasks (from previous days)
        if (students && activeLesson.start_date) {
          for (const student of students) {
            // Get all tasks from lesson start until yesterday
            const { data: allPreviousTasks } = await supabase
              .from('lesson_tasks')
              .select('*')
              .eq('lesson_id', activeLesson.id)
              .lt('day_number', Math.max(1, Math.floor((Date.now() - new Date(activeLesson.start_date || activeLesson.created_at).getTime()) / (1000 * 60 * 60 * 24))));
            
            // Get student's completed tasks for all previous days
            const { data: studentCompletedTasks } = await supabase
              .from('task_submissions')
              .select('*')
              .eq('student_id', student.id)
              .eq('lesson_id', activeLesson.id)
              .lt('created_at', today.toISOString());
            
            const totalPreviousTasks = allPreviousTasks?.length || 0;
            const completedCount = studentCompletedTasks?.length || 0;
            overdueTasksCount += Math.max(0, totalPreviousTasks - completedCount);
          }
        }
      }
      
      // Calculate stats
      const submissionsToday = todaySubmissions.length;
      
      // Calculate students who completed all tasks today
      const studentsCompletedAllTasks = allStudentsTaskCompletion.filter(s => s.completedAll).length;
      const taskCompletionRate = enrolledStudents > 0 ? Math.round((studentsCompletedAllTasks / enrolledStudents) * 100) : 0;
      
      // Calculate average health from all enrolled students' current health scores
      const avgHealth = enrolledStudents > 0 && students && students.length > 0
        ? students.reduce((sum, student) => {
            const currentHealth = student.plants[0]?.current_health_score || 0;
            return sum + currentHealth;
          }, 0) / enrolledStudents
        : 0;
      
      // Get students who haven't submitted today
      const submittedStudentIds = new Set(todaySubmissions.map(s => s.plant.student_id));
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
      const recentSubmissionsList = todaySubmissions.slice(0, 6).map(sub => ({
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
      
      // Count unread messages using MessageService
      const unreadCount = await MessageService.getUnreadMessageCount(user.id);
      setUnreadMessages(unreadCount);
      
      // Health distribution based on all enrolled students' current health
      const healthDist = students ? {
        excellent: students.filter(s => (s.plants[0]?.current_health_score || 0) >= 90).length,
        good: students.filter(s => {
          const health = s.plants[0]?.current_health_score || 0;
          return health >= 80 && health < 90;
        }).length,
        fair: students.filter(s => {
          const health = s.plants[0]?.current_health_score || 0;
          return health >= 70 && health < 80;
        }).length,
        poor: students.filter(s => (s.plants[0]?.current_health_score || 0) < 70).length
      } : {
        excellent: 0,
        good: 0,
        fair: 0,
        poor: 0
      };
      
      setClassStats({
        totalStudents: enrolledStudents,
        submissionsToday,
        averageHealthScore: Math.round(avgHealth),
        plantsNeedingAttention: pendingStudentsList.filter(s => s.needsAttention).length,
        participationRate: enrolledStudents > 0 ? Math.round((submissionsToday / enrolledStudents) * 100) : 0,
        taskCompletionRate,
        overdueTasksCount,
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

  // Create skeleton components
  const CurrentLessonSkeleton = () => (
    <GSCard variant="elevated" padding="large">
      <View style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <ShimmerPlaceholder width="70%" height={20} borderRadius={4} />
          <ShimmerPlaceholder width={60} height={16} borderRadius={12} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 }}>
          <ShimmerPlaceholder width={80} height={24} borderRadius={12} />
          <ShimmerPlaceholder width={100} height={24} borderRadius={12} />
        </View>
      </View>
      
      <ShimmerPlaceholder width="100%" height={8} borderRadius={4} style={{ marginBottom: 12 }} />
      <ShimmerPlaceholder width="40%" height={14} borderRadius={4} style={{ marginBottom: 16 }} />
      
      <GSCard variant="filled" padding="medium" margin="none">
        <View style={{ marginBottom: 12 }}>
          <ShimmerPlaceholder width="50%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
          <ShimmerPlaceholder width="30%" height={24} borderRadius={4} style={{ marginBottom: 4 }} />
          <ShimmerPlaceholder width="60%" height={14} borderRadius={4} />
        </View>
        
        <View style={{ borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 12, gap: 8 }}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ShimmerPlaceholder width={12} height={12} borderRadius={6} style={{ marginRight: 8 }} />
                <ShimmerPlaceholder width={80} height={14} borderRadius={4} />
              </View>
              <ShimmerPlaceholder width={20} height={14} borderRadius={4} />
            </View>
          ))}
        </View>
      </GSCard>
      
      <View style={{ marginTop: 16 }}>
        <ShimmerPlaceholder width="100%" height={40} borderRadius={8} />
      </View>
    </GSCard>
  );

  const TaskCompletionSkeleton = () => (
    <View>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        <View style={{ flex: 1 }}>
          <GSCard variant="elevated" padding="medium">
            <ShimmerPlaceholder width={40} height={24} borderRadius={4} style={{ marginBottom: 8 }} />
            <ShimmerPlaceholder width="70%" height={12} borderRadius={4} />
          </GSCard>
        </View>
        <View style={{ flex: 1 }}>
          <GSCard variant="elevated" padding="medium">
            <ShimmerPlaceholder width={20} height={24} borderRadius={4} style={{ marginBottom: 8 }} />
            <ShimmerPlaceholder width="60%" height={12} borderRadius={4} />
          </GSCard>
        </View>
      </View>
      
      <View style={{ gap: 8 }}>
        {[1, 2, 3].map((i) => (
          <GSCard key={i} variant="elevated" padding="medium">
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <ShimmerPlaceholder width="60%" height={16} borderRadius={4} style={{ marginBottom: 4 }} />
                <ShimmerPlaceholder width="40%" height={12} borderRadius={4} />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ShimmerPlaceholder width={24} height={16} borderRadius={8} />
                <ShimmerPlaceholder width={32} height={32} borderRadius={16} />
              </View>
            </View>
          </GSCard>
        ))}
      </View>
    </View>
  );

  const PhotoSubmissionsSkeleton = () => (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <View style={{ marginRight: 16 }}>
          <ShimmerPlaceholder width={80} height={80} borderRadius={40} />
        </View>
        <ShimmerPlaceholder width="50%" height={16} borderRadius={4} />
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <View key={i} style={{ width: '33.33%', paddingHorizontal: 4, marginBottom: 8 }}>
            <GSCard variant="elevated" padding="none">
              <ShimmerPlaceholder width="100%" height={120} borderRadius={8} style={{ marginBottom: 8 }} />
              <View style={{ padding: 8 }}>
                <ShimmerPlaceholder width="70%" height={12} borderRadius={4} style={{ marginBottom: 4 }} />
                <ShimmerPlaceholder width="50%" height={10} borderRadius={4} />
              </View>
            </GSCard>
          </View>
        ))}
      </View>
    </View>
  );

  const QuickActionsSkeleton = () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={{ width: '50%', paddingHorizontal: 6, marginBottom: 12 }}>
          <ShimmerPlaceholder width="100%" height={40} borderRadius={8} />
        </View>
      ))}
    </View>
  );

  const submissionPercentage = Math.round((classStats.submissionsToday / classStats.totalStudents) * 100);
  const todayDate = format(new Date(), 'EEEE, MMMM d');

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

        <View style={{ paddingHorizontal: 16 }}>
          {isSwitchingMode || isLoading ? (
            <>
              {/* Show skeleton loading while switching modes */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#000' }}>Current Lesson</Text>
                <CurrentLessonSkeleton />
              </View>

              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#000' }}>Task Completion</Text>
                <TaskCompletionSkeleton />
              </View>

              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#000' }}>Today's Gardens</Text>
                <PhotoSubmissionsSkeleton />
              </View>

              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#000' }}>Quick Actions</Text>
                <QuickActionsSkeleton />
              </View>
            </>
          ) : (
            <>
              {/* Current Lesson Progress Section */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#000' }}>Current Lesson Progress</Text>
                {isLoading ? (
                  <CurrentLessonSkeleton />
                ) : currentLesson ? (
              <GSCard variant="elevated" padding="large">
                <View style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 18, fontWeight: '600', color: '#000', flex: 1 }}>{currentLesson.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Feather name="users" size={16} color="#666" style={{ marginRight: 4 }} />
                      <Text style={{ fontSize: 14, fontWeight: '500', color: '#666' }}>{classStats.totalStudents}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, flexWrap: 'wrap', gap: 8 }}>
                    <GSChip label={currentLesson.plant_type} />
                    <GSBadge label={`Day ${Math.max(1, Math.floor((Date.now() - new Date(currentLesson.start_date).getTime()) / (1000 * 60 * 60 * 24)))} of ${currentLesson.expected_duration_days}`} variant="secondary" />
                  </View>
                </View>
                
                <View style={{ marginBottom: 12 }}>
                  <GSProgressIndicator type="linear" progress={Math.min(1, Math.max(0, (Date.now() - new Date(currentLesson.start_date).getTime()) / (new Date(currentLesson.end_date).getTime() - new Date(currentLesson.start_date).getTime())))} />
                </View>
                <Text style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
                  {Math.max(0, Math.floor((new Date(currentLesson.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days remaining
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
            ) : (
              <GSCard variant="filled" padding="large">
                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                  <Feather name="book-open" size={48} color="#666" style={{ marginBottom: 16 }} />
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 8 }}>
                    No Active Lesson
                  </Text>
                  <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 16 }}>
                    Start a new lesson to track your class progress
                  </Text>
                  <GSButton
                    variant="primary"
                    onPress={() => router.push('/(tabs)/lessons')}
                  >
                    Create New Lesson
                  </GSButton>
                </View>
              </GSCard>
            )}
          </View>

          {/* Task Completion Section */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#000' }}>Task Completion</Text>
              <Text style={{ fontSize: 14, color: '#666' }}>{todayDate}</Text>
            </View>
            {isLoading ? (
              <TaskCompletionSkeleton />
            ) : (
              <>
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                  <View style={{ flex: 1 }}>
                    <GSStatCard
                      value={`${classStats.taskCompletionRate || 0}%`}
                      label="Completed All Tasks"
                      icon="check-circle"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <GSStatCard
                      value={classStats.overdueTasksCount?.toString() || "0"}
                      label="Tasks Overdue"
                      icon="alert"
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
              </>
            )}
          </View>

          {/* Photo Submissions Section */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#000' }}>Today's Gardens</Text>
              <GSIconButton
                icon="refresh"
                size={20}
                onPress={onRefresh}
              />
            </View>

            {isLoading ? (
              <PhotoSubmissionsSkeleton />
            ) : (
              <>
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
              </>
            )}
          </View>

          {/* Quick Actions Section */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#000' }}>Quick Actions</Text>
            {isLoading ? (
              <QuickActionsSkeleton />
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
                <View style={{ width: '50%', paddingHorizontal: 6, marginBottom: 12 }}>
                  <View style={{ position: 'relative' }}>
                    <GSButton
                      variant="primary"
                      onPress={() => router.push('/ai-chat')}
                      size="medium"
                      fullWidth
                      icon="message-text-outline"
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
                    icon="account-multiple"
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
                    icon="chart-bar"
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
            )}
          </View>
            </>
          )}
        </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
} 