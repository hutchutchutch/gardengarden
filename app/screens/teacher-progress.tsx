import React, { useState, useEffect } from 'react';
import { View, FlatList, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useMode } from '@/contexts/ModeContext';
import {
  GSCard,
  GSButton,
  GSStudentCard,
  GSProgressIndicator,
  GSStatCard,
  SectionHeader,
  GSSegmentedButtons,
  GSBadge,
  Text,
  GSModeToggle,
} from '@/components/ui';

// Mock class data
const classStats = {
  totalStudents: 25,
  activeStudents: 23,
  averageCompletion: 78,
  plantsHealthy: 20,
  plantsNeedAttention: 5,
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
    needsHelp: false,
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
    needsHelp: false,
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
    needsHelp: true,
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
    needsHelp: false,
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
    needsHelp: true,
  },
];

// Mock assignment data
const upcomingAssignments = [
  {
    id: '1',
    title: 'Week 4 Plant Measurement',
    dueDate: '2024-03-25',
    completed: 18,
    total: 25,
    type: 'measurement',
  },
  {
    id: '2',
    title: 'Growth Journal Entry',
    dueDate: '2024-03-27',
    completed: 15,
    total: 25,
    type: 'journal',
  },
  {
    id: '3',
    title: 'Plant Care Quiz',
    dueDate: '2024-03-28',
    completed: 0,
    total: 25,
    type: 'quiz',
  },
];

const filterOptions = ['all', 'needsHelp', 'active'];
const filterLabels = ['All', 'Needs Help', 'Active'];

const parseLastActive = (lastActive: string): Date => {
  const now = new Date();
  if (lastActive.includes('hour')) {
    const hours = parseInt(lastActive.split(' ')[0], 10);
    now.setHours(now.getHours() - hours);
  } else if (lastActive.includes('day')) {
    const days = parseInt(lastActive.split(' ')[0], 10);
    now.setDate(now.getDate() - days);
  }
  return now;
};

export default function TeacherProgressScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isTeacherMode } = useMode();
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    if (!isTeacherMode) {
      router.replace('/screens/student-progress');
    }
  }, [isTeacherMode]);

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
    router.push({
      pathname: '/ai-chat',
      params: { studentId, type: 'student-detail' },
    });
  };

  const handleMessageStudent = (studentId: string) => {
    router.push({
      pathname: '/ai-chat',
      params: { studentId, type: 'teacher-student' },
    });
  };

  const renderStudentCard = ({ item: student }: { item: (typeof students)[0] }) => (
    <GSStudentCard
      name={student.name}
      plantName={`${student.plantName} • ${student.plantSpecies}`}
      healthScore={student.plantHealth}
      lastSubmission={parseLastActive(student.lastActive)}
      onPress={() => handleStudentPress(student.id)}
      onMessage={() => handleMessageStudent(student.id)}
      onViewDetails={() => handleStudentPress(student.id)}
    />
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{ flex: 1 }}>
        {/* Fixed Mode Toggle at the top */}
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, backgroundColor: 'white' }}>
          <GSModeToggle />
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
        >
          <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 24 }}>
            {/* Class Overview */}
            <View>
              <SectionHeader title="Class Overview" />
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', gap: 8 }}>
                <GSStatCard
                  label="Active"
                  value={`${classStats.activeStudents}/${classStats.totalStudents}`}
                  icon="account-multiple-outline"
                  className="flex-1"
                />
                <GSStatCard
                  label="Avg Complete"
                  value={`${classStats.averageCompletion}%`}
                  icon="chart-donut"
                  className="flex-1"
                />
                <GSStatCard
                  label="Healthy"
                  value={`${classStats.plantsHealthy}`}
                  icon="leaf-outline"
                  className="flex-1"
                />
                <GSStatCard
                  label="Needs Help"
                  value={`${classStats.plantsNeedAttention}`}
                  icon="alert-circle-outline"
                  className="flex-1"
                />
              </View>
            </View>

            {/* Upcoming Assignments */}
            <GSCard padding="medium">
              <SectionHeader title="Current Assignments" />
              <View style={{ gap: 16 }}>
                {upcomingAssignments.map(assignment => (
                  <View key={assignment.id}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ fontWeight: '500' }}>{assignment.title}</Text>
                      <Text style={{ fontSize: 12, color: '#6B7280' }}>
                        Due {new Date(assignment.dueDate).toLocaleDateString()}
                      </Text>
                    </View>
                    <GSProgressIndicator
                      progress={assignment.completed / assignment.total}
                      showPercentage={false}
                    />
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                      <Text style={{ fontSize: 12, color: '#6B7280' }}>
                        {assignment.completed}/{assignment.total} completed
                      </Text>
                      <GSBadge label={assignment.type} variant="outline" size="small" />
                    </View>
                  </View>
                ))}
              </View>
            </GSCard>

            {/* Student Filter */}
            <View>
              <SectionHeader title={`Students (${filteredStudents.length})`} />
              <GSSegmentedButtons
                options={filterLabels}
                selectedIndex={filterOptions.indexOf(selectedFilter)}
                onIndexChange={index => setSelectedFilter(filterOptions[index])}
              />
            </View>

            {/* Students List */}
            <FlatList
              data={filteredStudents}
              renderItem={renderStudentCard}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            />

            {/* Quick Actions */}
            <GSCard padding="medium">
              <SectionHeader title="Quick Actions" />
              <View style={{ gap: 12 }}>
                <GSButton
                  icon="clipboard-list-outline"
                  onPress={() => {}}
                  fullWidth
                >
                  Create New Assignment
                </GSButton>
                <GSButton
                  icon="message-outline"
                  onPress={() => {}}
                  variant="secondary"
                  fullWidth
                >
                  Send Class Announcement
                </GSButton>
                <GSButton
                  icon="trophy-outline"
                  onPress={() => {}}
                  variant="secondary"
                  fullWidth
                >
                  View Achievement Leaderboard
                </GSButton>
              </View>
            </GSCard>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
