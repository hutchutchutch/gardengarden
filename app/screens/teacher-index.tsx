import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Image
} from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Feather } from '@expo/vector-icons';
import { Bell, Settings } from 'lucide-react-native';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import ModeToggle from '@/components/ui/mode-toggle';
import { useMode } from '@/contexts/ModeContext';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

interface StudentData {
  id: string;
  name: string;
  submitted: boolean;
  healthScore: number;
  daysSinceLastSubmission: number;
  plantStage: 'seed' | 'sprout' | 'growing' | 'mature';
  needsAttention: boolean;
  lastPhotoUrl?: string;
  avatar: string;
  lastActive: string;
  grade: string;
  progress: number;
}

interface ClassStats {
  totalStudents: number;
  submissionsToday: number;
  averageHealthScore: number;
  plantsNeedingAttention: number;
  participationRate: number;
}

export default function TeacherIndex() {
  const { user, setShowFAB } = useAuth();
  const { isTeacherMode, setIsTeacherMode } = useMode();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'not-submitted' | 'low-health'>('all');
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  
        // Mock data - In real app, fetch from Supabase
  const [classStats, setClassStats] = useState<ClassStats>({
    totalStudents: 28,
    submissionsToday: 24,
    averageHealthScore: 82,
    plantsNeedingAttention: 3,
    participationRate: 86
  });

  const [students, setStudents] = useState<StudentData[]>([
    { id: '1', name: 'Sarah Chen', submitted: true, healthScore: 85, daysSinceLastSubmission: 0, plantStage: 'growing', needsAttention: false, avatar: '', lastActive: '', grade: '', progress: 0 },
    { id: '2', name: 'Alex Rivera', submitted: true, healthScore: 92, daysSinceLastSubmission: 0, plantStage: 'mature', needsAttention: false, avatar: '', lastActive: '', grade: '', progress: 0 },
    { id: '3', name: 'Maya Patel', submitted: false, healthScore: 78, daysSinceLastSubmission: 1, plantStage: 'growing', needsAttention: true, avatar: '', lastActive: '', grade: '', progress: 0 },
    { id: '4', name: 'Jordan Kim', submitted: true, healthScore: 65, daysSinceLastSubmission: 0, plantStage: 'sprout', needsAttention: true, avatar: '', lastActive: '', grade: '', progress: 0 },
    { id: '5', name: 'Emma Wilson', submitted: true, healthScore: 88, daysSinceLastSubmission: 0, plantStage: 'growing', needsAttention: false, avatar: '', lastActive: '', grade: '', progress: 0 },
  ]);

  const [recentActivity, setRecentActivity] = useState([
    { type: 'submission', student: 'Emma Wilson', action: 'submitted photo', time: '5m ago' },
    { type: 'message', student: 'Sarah Chen', action: 'sent message', time: '15m ago' },
    { type: 'achievement', student: 'Alex Rivera', action: 'earned First Flower badge', time: '1h ago' },
    { type: 'alert', student: 'Maya Patel', action: 'missed daily submission', time: '2h ago' },
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
      // FR-016: Calculate submission percentage
      // FR-017: Update within 5 seconds
      // In real app, fetch from Supabase
      await new Promise(resolve => setTimeout(resolve, 1000));
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

  const getHealthColor = (score: number) => {
    if (score >= 80) return '#10B981'; // excellent
    if (score >= 70) return '#84CC16'; // good
    if (score >= 60) return '#EAB308'; // warning
    return '#EF4444'; // danger
  };

  const getHealthLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Needs Attention';
    return 'Critical';
  };

  const filteredStudents = students.filter(student => {
    // FR-023: Filter dashboard
    if (filter === 'not-submitted' && student.submitted) return false;
    if (filter === 'low-health' && student.healthScore >= 70) return false;
    
    if (searchQuery) {
      return student.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    
    return true;
  });

  const studentsNeedingAttention = students.filter(s => 
    s.needsAttention || !s.submitted || s.healthScore < 60
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-backgroundLight">
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        className="flex-1"
      >
        {/* Header with notification bell and toggle */}
        <View className="px-4 pb-2">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-2xl font-bold text-foreground">Teacher Dashboard</Text>
            <View>
              <Pressable 
                className="relative"
                onPress={() => setShowNotificationMenu(!showNotificationMenu)}
              >
                <Bell size={24} color="#64748B" />
                <View className="absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full" />
              </Pressable>
              
              {showNotificationMenu && (
                <View className="absolute right-0 top-8 w-48 bg-card border border-border rounded-lg shadow-lg z-10">
                  <Pressable className="flex-row items-center p-2" onPress={() => {/* Handle notifications */}}>
                    <Bell size={16} color="#64748B" />
                    <Text className="text-sm ml-2">View Notifications</Text>
                  </Pressable>
                   <Pressable className="flex-row items-center p-2" onPress={() => router.push('/(tabs)/profile')}>
                    <Settings size={16} color="#64748B" />
                    <Text className="text-sm ml-2">Settings</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>

          {/* Student/Teacher Toggle */}
          <View className="mb-6">
            <ModeToggle />
          </View>
        </View>

        {/* Header Stats - FR-016, FR-017 */}
        <View className="bg-primary p-6">
          <Text className="text-2xl font-bold text-white mb-2">
            Good morning, {user?.name || 'Teacher'}!
          </Text>
          <Text className="text-primary-foreground/80 mb-4">
            Growing Tomatoes • Day 23 of 75
          </Text>
          
          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className="text-2xl font-bold text-white">
                {classStats.submissionsToday}/{classStats.totalStudents}
              </Text>
              <Text className="text-sm text-primary-foreground/80">
                Submitted Today
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-white">
                {classStats.averageHealthScore}%
              </Text>
              <Text className="text-sm text-primary-foreground/80">
                Avg Health
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-white">
                {classStats.plantsNeedingAttention}
              </Text>
              <Text className="text-sm text-primary-foreground/80">
                Need Attention
              </Text>
            </View>
          </View>
        </View>

        <View className="p-4 space-y-4">
          {/* Students Needing Attention - FR-018, FR-019 */}
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <View className="flex-row items-center">
                <Feather name="alert-triangle" size={20} color="#EAB308" style={{ marginRight: 8 }} />
                <CardTitle title="Students Needing Attention" />
              </View>
              <Badge className="bg-destructive">
                {studentsNeedingAttention.length}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {studentsNeedingAttention.map(student => (
                <Pressable 
                  key={student.id}
                  className="flex-row items-center justify-between p-3 bg-muted rounded-lg"
                  onPress={() => {/* FR-021: Navigate to student profile */}}
                >
                  <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 bg-gray-300 rounded-full items-center justify-center mr-3">
                      <Text className="font-semibold">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-medium text-foreground">{student.name}</Text>
                      <Text className="text-sm text-muted-foreground">
                        {!student.submitted 
                          ? 'No photo today' 
                          : `Health: ${student.healthScore}%`
                        }
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center space-x-2">
                    <Pressable className="p-2">
                      <Feather name="camera" size={18} color="#64748B" />
                    </Pressable>
                    <Pressable className="p-2">
                      <Feather name="message-circle" size={18} color="#64748B" />
                    </Pressable>
                  </View>
                </Pressable>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle title="Recent Activity" />
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivity.map((activity, index) => (
                <View key={index} className="flex-row items-center space-x-3">
                  <View 
                    className={`w-2 h-2 rounded-full ${
                      activity.type === 'alert' ? 'bg-destructive' : 
                      activity.type === 'achievement' ? 'bg-health-excellent' : 
                      'bg-primary'
                    }`} 
                  />
                  <View className="flex-1">
                    <Text className="text-sm">
                      <Text className="font-medium">{activity.student}</Text>
                      <Text className="text-muted-foreground"> {activity.action}</Text>
                    </Text>
                  </View>
                  <Text className="text-xs text-muted-foreground">{activity.time}</Text>
                </View>
              ))}
            </CardContent>
          </Card>

          {/* Student List with Search - FR-023 */}
          <Card>
            <CardHeader>
              <CardTitle title="All Students" />
              {/* Search Bar */}
              <View className="relative mt-3">
                <Feather name="search" size={20} color="#64748B" style={{ position: 'absolute', left: 12, top: 10 }} />
                <TextInput
                  className="pl-10 pr-4 py-2 bg-muted rounded-lg text-foreground"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              {/* Filter Buttons */}
              <View className="flex-row space-x-2 mt-3">
                <Pressable
                  onPress={() => setFilter('all')}
                  className={`px-3 py-1 rounded-full ${
                    filter === 'all' ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <Text className={filter === 'all' ? 'text-white' : 'text-muted-foreground'}>
                    All
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setFilter('not-submitted')}
                  className={`px-3 py-1 rounded-full ${
                    filter === 'not-submitted' ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <Text className={filter === 'not-submitted' ? 'text-white' : 'text-muted-foreground'}>
                    Not Submitted
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setFilter('low-health')}
                  className={`px-3 py-1 rounded-full ${
                    filter === 'low-health' ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <Text className={filter === 'low-health' ? 'text-white' : 'text-muted-foreground'}>
                    Low Health
                  </Text>
                </Pressable>
              </View>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredStudents.map(student => (
                <Pressable
                  key={student.id}
                  className="bg-background border border-border rounded-lg p-4"
                  onPress={() => {/* Navigate to student detail */}}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="w-12 h-12 bg-muted rounded-full items-center justify-center mr-3">
                        <Text className="font-semibold">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="font-semibold text-foreground">{student.name}</Text>
                        <Text className="text-sm text-muted-foreground capitalize">
                          {student.plantStage} stage
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <View 
                        className="px-2 py-1 rounded-full"
                        style={{ backgroundColor: getHealthColor(student.healthScore) }}
                      >
                        <Text className="text-white text-xs font-medium">
                          {getHealthLabel(student.healthScore)}
                        </Text>
                      </View>
                      <Text className="text-sm text-muted-foreground mt-1">
                        {student.healthScore}%
                      </Text>
                    </View>
                  </View>
                  
                  <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-border">
                    <View className="flex-row items-center">
                      {student.submitted ? (
                        <>
                          <Feather name="check-circle" size={16} color="#10B981" style={{ marginRight: 4 }} />
                          <Text className="text-sm text-muted-foreground">
                            Submitted today
                          </Text>
                        </>
                      ) : (
                        <>
                          <Feather name="clock" size={16} color="#EAB308" style={{ marginRight: 4 }} />
                          <Text className="text-sm text-muted-foreground">
                            {student.daysSinceLastSubmission}d ago
                          </Text>
                        </>
                      )}
                    </View>
                    <View className="flex-row space-x-2">
                      <Pressable className="p-2">
                        <Feather name="camera" size={16} color="#64748B" />
                      </Pressable>
                      <Pressable className="p-2">
                        <Feather name="message-circle" size={16} color="#64748B" />
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              ))}
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 