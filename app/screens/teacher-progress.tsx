import React, { useEffect, useState } from 'react';
import { View, ScrollView, FlatList, Pressable, Image, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Mock class data
const classStats = {
  totalStudents: 25,
  activeStudents: 23,
  averageCompletion: 78,
  plantsHealthy: 20,
  plantsNeedAttention: 5
};

// Mock student data
const students = [
  {
    id: '1',
    name: 'Alex Chen',
    avatar: '👦',
    plantName: 'Sunny',
    plantSpecies: 'Tomato',
    plantHealth: 92,
    weeklyCompletion: 100,
    lastActive: '2 hours ago',
    needsHelp: false
  },
  {
    id: '2',
    name: 'Emma Johnson',
    avatar: '👧',
    plantName: 'Rosie',
    plantSpecies: 'Sunflower',
    plantHealth: 85,
    weeklyCompletion: 85,
    lastActive: '1 day ago',
    needsHelp: false
  },
  {
    id: '3',
    name: 'Marcus Williams',
    avatar: '👦',
    plantName: 'Green Bean',
    plantSpecies: 'Bean Plant',
    plantHealth: 45,
    weeklyCompletion: 40,
    lastActive: '3 days ago',
    needsHelp: true
  },
  {
    id: '4',
    name: 'Sophie Davis',
    avatar: '👧',
    plantName: 'Pepper',
    plantSpecies: 'Bell Pepper',
    plantHealth: 78,
    weeklyCompletion: 70,
    lastActive: '1 hour ago',
    needsHelp: false
  },
  {
    id: '5',
    name: 'Dylan Rodriguez',
    avatar: '👦',
    plantName: 'Spicy',
    plantSpecies: 'Chili Pepper',
    plantHealth: 55,
    weeklyCompletion: 55,
    lastActive: '2 days ago',
    needsHelp: true
  }
];

// Mock assignment data
const upcomingAssignments = [
  {
    id: '1',
    title: 'Week 4 Plant Measurement',
    dueDate: '2024-03-25',
    completed: 18,
    total: 25,
    type: 'measurement'
  },
  {
    id: '2',
    title: 'Growth Journal Entry',
    dueDate: '2024-03-27',
    completed: 15,
    total: 25,
    type: 'journal'
  },
  {
    id: '3',
    title: 'Plant Care Quiz',
    dueDate: '2024-03-28',
    completed: 0,
    total: 25,
    type: 'quiz'
  }
];

export default function TeacherProgressScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filteredStudents = students.filter(student => {
    switch (selectedFilter) {
      case 'needsHelp':
        return student.needsHelp;
      case 'active':
        return !student.lastActive.includes('day');
      case 'all':
      default:
        return true;
    }
  });

  const handleStudentPress = (studentId: string) => {
    // Navigate to individual student detail view - using AI chat with student context for now
    router.push({
      pathname: '/ai-chat',
      params: { studentId, type: 'student-detail' }
    });
  };

  const handleMessageStudent = (studentId: string) => {
    router.push({
      pathname: '/ai-chat',
      params: { studentId, type: 'teacher-student' }
    });
  };

  const renderStudentCard = ({ item: student }: { item: typeof students[0] }) => (
    <Pressable
      onPress={() => handleStudentPress(student.id)}
      className="mb-3"
    >
      <Card className={cn(
        "border-l-4",
        student.needsHelp ? "border-l-red-500" :
        student.plantHealth >= 80 ? "border-l-green-500" : "border-l-amber-500"
      )}>
        <CardContent className="p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3 flex-1">
              <Text className="text-2xl">{student.avatar}</Text>
              <View className="flex-1">
                <Text className="font-semibold text-base">{student.name}</Text>
                <Text className="text-sm text-muted-foreground">
                  {student.plantName} • {student.plantSpecies}
                </Text>
              </View>
            </View>
            <View className="items-end gap-1">
              <Badge className={cn(
                student.plantHealth >= 80 ? "bg-green-500" :
                student.plantHealth >= 60 ? "bg-amber-500" : "bg-red-500"
              )}>
                <Text className="text-white text-xs">{student.plantHealth}%</Text>
              </Badge>
              {student.needsHelp && (
                <Feather name="alert-triangle" size={16} color="#EF4444" />
              )}
            </View>
          </View>
          
          <View className="mt-3 gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-muted-foreground">Weekly Tasks</Text>
              <Text className="text-xs font-medium">{student.weeklyCompletion}%</Text>
            </View>
            <Progress value={student.weeklyCompletion} className="h-2" />
          </View>
          
          <View className="flex-row items-center justify-between mt-3">
            <Text className="text-xs text-muted-foreground">
              Active {student.lastActive}
            </Text>
            <Pressable
              onPress={() => handleMessageStudent(student.id)}
              className="flex-row items-center gap-1"
            >
              <Feather name="message-circle" size={14} color="#3B82F6" />
              <Text className="text-xs text-blue-600">Message</Text>
            </Pressable>
          </View>
        </CardContent>
      </Card>
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-4 py-4 gap-4">
          
          {/* Class Overview */}
          <Card>
            <CardHeader>
              <CardTitle 
                title="Class Overview"
                left={() => <MaterialCommunityIcons name="chart-bar" size={20} color="#10B981" />}
              />
            </CardHeader>
            <CardContent>
              <View className="flex-row gap-4">
                <View className="flex-1 items-center">
                  <Text className="text-2xl font-bold text-blue-600">
                    {classStats.activeStudents}/{classStats.totalStudents}
                  </Text>
                  <Text className="text-xs text-muted-foreground text-center">
                    Active Students
                  </Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-2xl font-bold text-green-600">
                    {classStats.averageCompletion}%
                  </Text>
                  <Text className="text-xs text-muted-foreground text-center">
                    Avg Completion
                  </Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-2xl font-bold text-amber-600">
                    {classStats.plantsHealthy}
                  </Text>
                  <Text className="text-xs text-muted-foreground text-center">
                    Healthy Plants
                  </Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-2xl font-bold text-red-600">
                    {classStats.plantsNeedAttention}
                  </Text>
                  <Text className="text-xs text-muted-foreground text-center">
                    Need Attention
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Upcoming Assignments */}
          <Card>
            <CardHeader>
              <CardTitle 
                title="Current Assignments"
                left={() => <MaterialCommunityIcons name="clipboard-list" size={20} color="#3B82F6" />}
              />
            </CardHeader>
            <CardContent>
              <View className="gap-3">
                {upcomingAssignments.map((assignment) => (
                  <View key={assignment.id} className="p-3 bg-muted rounded-lg">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="font-medium">{assignment.title}</Text>
                      <Text className="text-xs text-muted-foreground">
                        Due {new Date(assignment.dueDate).toLocaleDateString()}
                      </Text>
                    </View>
                    <Progress 
                      value={(assignment.completed / assignment.total) * 100} 
                      className="mb-1" 
                    />
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs text-muted-foreground">
                        {assignment.completed}/{assignment.total} completed
                      </Text>
                      <Badge variant="outline">
                        <Text className="text-xs">{assignment.type}</Text>
                      </Badge>
                    </View>
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>

          {/* Student Filter */}
          <Card>
            <CardHeader>
              <View className="flex-row items-center justify-between">
                <CardTitle 
                  title={`Students (${filteredStudents.length})`}
                  left={() => <MaterialCommunityIcons name="account-group" size={20} color="#8B5CF6" />}
                />
                <View className="flex-row gap-2">
                  <Button
                    size="sm"
                    variant={selectedFilter === 'all' ? 'default' : 'outline'}
                    onPress={() => setSelectedFilter('all')}
                  >
                    <Text className={selectedFilter === 'all' ? 'text-white' : ''}>All</Text>
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedFilter === 'needsHelp' ? 'default' : 'outline'}
                    onPress={() => setSelectedFilter('needsHelp')}
                  >
                    <Text className={selectedFilter === 'needsHelp' ? 'text-white' : ''}>Help</Text>
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedFilter === 'active' ? 'default' : 'outline'}
                    onPress={() => setSelectedFilter('active')}
                  >
                    <Text className={selectedFilter === 'active' ? 'text-white' : ''}>Active</Text>
                  </Button>
                </View>
              </View>
            </CardHeader>
          </Card>

          {/* Students List */}
          <View>
            <FlatList
              data={filteredStudents}
              renderItem={renderStudentCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle title="Quick Actions" />
            </CardHeader>
            <CardContent>
              <View className="gap-3">
                <Button className="flex-row items-center gap-2">
                  <MaterialCommunityIcons name="clipboard-list" size={16} color="white" />
                  <Text className="text-white">Create New Assignment</Text>
                </Button>
                
                <Button variant="outline" className="flex-row items-center gap-2">
                  <Feather name="message-circle" size={16} color="#3B82F6" />
                  <Text>Send Class Announcement</Text>
                </Button>
                
                <Button variant="outline" className="flex-row items-center gap-2">
                  <MaterialCommunityIcons name="trophy" size={16} color="#3B82F6" />
                  <Text>View Achievement Leaderboard</Text>
                </Button>
              </View>
            </CardContent>
          </Card>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 