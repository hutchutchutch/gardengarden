import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, FlatList, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Mock lesson data with associated documents
const teacherLessons = [
  {
    id: '1',
    title: 'Understanding Plant Growth Stages',
    description: 'Learn about the different stages of plant development from seed to maturity.',
    duration: '15 min',
    studentsAssigned: 28,
    studentsCompleted: 24,
    averageScore: 85,
    category: 'Botany Basics',
    difficulty: 'Beginner',
    dueDate: '2024-02-15',
    isActive: true,
    documents: [
      {
        id: 'doc1',
        title: 'Plant Growth Fundamentals.pdf',
        type: 'PDF',
        uploadDate: '2024-01-15',
        ragReferences: 47,
        size: '2.3 MB'
      },
      {
        id: 'doc2',
        title: 'Growth Stages Visual Guide.png',
        type: 'Image',
        uploadDate: '2024-01-16',
        ragReferences: 23,
        size: '1.1 MB'
      },
      {
        id: 'doc3',
        title: 'Seedling Care Instructions.docx',
        type: 'Document',
        uploadDate: '2024-01-18',
        ragReferences: 12,
        size: '584 KB'
      }
    ]
  },
  {
    id: '2',
    title: 'Soil Composition and pH',
    description: 'Discover how soil composition affects plant health and growth.',
    duration: '12 min',
    studentsAssigned: 28,
    studentsCompleted: 28,
    averageScore: 92,
    category: 'Soil Science',
    difficulty: 'Intermediate',
    dueDate: '2024-01-28',
    isActive: false,
    documents: [
      {
        id: 'doc4',
        title: 'Soil pH Testing Guide.pdf',
        type: 'PDF',
        uploadDate: '2024-01-10',
        ragReferences: 65,
        size: '3.1 MB'
      },
      {
        id: 'doc5',
        title: 'Nutrient Deficiency Chart.jpg',
        type: 'Image',
        uploadDate: '2024-01-12',
        ragReferences: 38,
        size: '892 KB'
      }
    ]
  },
  {
    id: '3',
    title: 'Plant Identification Techniques',
    description: 'Master the art of identifying plants using key characteristics.',
    duration: '20 min',
    studentsAssigned: 28,
    studentsCompleted: 0,
    averageScore: null,
    category: 'Plant ID',
    difficulty: 'Advanced',
    dueDate: '2024-02-20',
    isActive: false,
    documents: [
      {
        id: 'doc6',
        title: 'Plant ID Field Guide.pdf',
        type: 'PDF',
        uploadDate: '2024-02-01',
        ragReferences: 8,
        size: '4.7 MB'
      },
      {
        id: 'doc7',
        title: 'Leaf Shape Reference.png',
        type: 'Image',
        uploadDate: '2024-02-02',
        ragReferences: 3,
        size: '1.5 MB'
      },
      {
        id: 'doc8',
        title: 'Common Plant Families.txt',
        type: 'Text',
        uploadDate: '2024-02-03',
        ragReferences: 1,
        size: '45 KB'
      }
    ]
  },
];

interface DocumentItemProps {
  document: any;
}

const DocumentItem = ({ document }: DocumentItemProps) => {
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'PDF': return '📄';
      case 'Image': return '🖼️';
      case 'Document': return '📝';
      case 'Text': return '📄';
      default: return '📎';
    }
  };

  return (
    <View className="flex-row items-center justify-between py-2 px-3 bg-muted/50 rounded-lg mb-2">
      <View className="flex-1 flex-row items-center">
        <Text className="text-lg mr-2">{getFileIcon(document.type)}</Text>
        <View className="flex-1">
          <Text className="text-sm font-medium" numberOfLines={1}>
            {document.title}
          </Text>
          <Text className="text-xs text-muted-foreground">
            {document.size} • {new Date(document.uploadDate).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center gap-1">
        <MaterialCommunityIcons name="message-outline" size={20} color="#64748B" />
        <Text className="text-sm font-semibold text-primary">
          {document.ragReferences}
        </Text>
      </View>
    </View>
  );
};

interface TeacherLessonCardProps {
  lesson: any;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
}

const TeacherLessonCard = ({ lesson, isExpanded, onToggleExpand, onEdit }: TeacherLessonCardProps) => {
  const completionRate = (lesson.studentsCompleted / lesson.studentsAssigned) * 100;
  
  const getCompletionColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const totalReferences = lesson.documents.reduce((sum: number, doc: any) => sum + doc.ragReferences, 0);

  return (
    <Card className={cn("mb-3", lesson.isActive && "border-primary")}>
      <Pressable onPress={onToggleExpand}>
        <CardHeader className="pb-2">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 flex-row items-center">
              {isExpanded ? (
                <MaterialCommunityIcons name="chevron-down" size={20} color="#64748B" />
              ) : (
                <MaterialCommunityIcons name="chevron-right" size={20} color="#64748B" />
              )}
              <View className="flex-1 ml-2">
                <CardTitle className="text-base">{lesson.title}</CardTitle>
                <View className="flex-row items-center gap-2 mt-1">
                  <Text className="text-xs text-muted-foreground">{lesson.category}</Text>
                  <Text className="text-xs text-muted-foreground">•</Text>
                  <Text className="text-xs text-muted-foreground">{lesson.duration}</Text>
                  <Text className="text-xs text-muted-foreground">•</Text>
                  <Text className="text-xs text-muted-foreground">
                    {lesson.documents.length} docs
                  </Text>
                  {totalReferences > 0 && (
                    <>
                      <Text className="text-xs text-muted-foreground">•</Text>
                      <View className="flex-row items-center gap-1">
                        <MaterialCommunityIcons name="message-outline" size={12} color="#64748B" />
                        <Text className="text-xs text-primary font-medium">
                          {totalReferences}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className={cn("text-xs font-medium", getCompletionColor(completionRate))}>
                {lesson.studentsCompleted}/{lesson.studentsAssigned}
              </Text>
              {lesson.isActive && (
                <Badge className="bg-primary/10">
                  <Text className="text-primary text-xs">Active</Text>
                </Badge>
              )}
              <Pressable onPress={onEdit} className="p-1">
                <MaterialCommunityIcons name="cog" size={16} color="#64748B" />
              </Pressable>
            </View>
          </View>
        </CardHeader>
      </Pressable>

      {isExpanded && (
        <CardContent className="pt-0">
          <Text className="text-sm text-muted-foreground mb-3" numberOfLines={2}>
            {lesson.description}
          </Text>
          
          {/* Progress Bar */}
          <View className="mb-4">
            <View className="flex-row justify-between mb-1">
              <Text className="text-xs text-muted-foreground">Completion Rate</Text>
              <Text className="text-xs font-medium">{Math.round(completionRate)}%</Text>
            </View>
            <View className="h-2 bg-gray-200 rounded-full">
              <View 
                className={cn(
                  "h-2 rounded-full",
                  completionRate >= 90 ? "bg-green-500" :
                  completionRate >= 70 ? "bg-yellow-500" : "bg-red-500"
                )}
                style={{ width: `${completionRate}%` }}
              />
            </View>
          </View>

          {/* Documents Section */}
          <View className="mb-3">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm font-semibold">
                Documents ({lesson.documents.length})
              </Text>
              <Text className="text-xs text-muted-foreground">
                Total References: {totalReferences}
              </Text>
            </View>
            
            {lesson.documents.map((document: any) => (
              <DocumentItem key={document.id} document={document} />
            ))}
          </View>

          {/* Stats Row */}
          <View className="flex-row items-center justify-between pt-3 border-t border-border">
            <View className="items-center">
              <Text className="text-xs text-muted-foreground">Students</Text>
              <Text className="text-sm font-medium">{lesson.studentsAssigned}</Text>
            </View>
            {lesson.averageScore && (
              <View className="items-center">
                <Text className="text-xs text-muted-foreground">Avg Score</Text>
                <Text className="text-sm font-medium">{lesson.averageScore}%</Text>
              </View>
            )}
            {lesson.dueDate && (
              <View className="items-center">
                <Text className="text-xs text-muted-foreground">Due Date</Text>
                <Text className="text-sm font-medium">
                  {new Date(lesson.dueDate).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </CardContent>
      )}
    </Card>
  );
};

export default function TeacherLessons() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<'active' | 'all'>('active');
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  
  // Calculate stats
  const totalLessons = teacherLessons.length;
  const activeLessons = teacherLessons.filter(lesson => lesson.isActive);
  const totalStudentsAssigned = teacherLessons.reduce((sum, lesson) => sum + lesson.studentsAssigned, 0);
  const totalStudentsCompleted = teacherLessons.reduce((sum, lesson) => sum + lesson.studentsCompleted, 0);
  const overallCompletionRate = totalStudentsAssigned > 0 ? (totalStudentsCompleted / totalStudentsAssigned) * 100 : 0;
  const totalRAGReferences = teacherLessons.reduce((sum, lesson) => 
    sum + lesson.documents.reduce((docSum: number, doc: any) => docSum + doc.ragReferences, 0), 0
  );

  const handleToggleExpand = (lessonId: string) => {
    setExpandedLessons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(lessonId)) {
        newSet.delete(lessonId);
      } else {
        newSet.add(lessonId);
      }
      return newSet;
    });
  };

  const handleEditLesson = (lessonId: string) => {
    router.push({
      pathname: '/modal',
      params: { type: 'edit-lesson', lessonId }
    });
  };

  const handleCreateLesson = () => {
    router.push({
      pathname: '/modal',
      params: { type: 'create-lesson' }
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Stats Section */}
      <View className="p-4">
        <Text className="text-2xl font-bold mb-4">Lesson Management</Text>
        
        <View className="flex-row gap-2 mb-6">
          <Card className="flex-1">
            <CardContent className="p-3 items-center">
              <MaterialCommunityIcons name="book-open-page-variant" size={20} color="#10B981" />
              <Text className="text-lg font-bold mt-1">{totalLessons}</Text>
              <Text className="text-xs text-muted-foreground">Lessons</Text>
            </CardContent>
          </Card>
          
          <Card className="flex-1">
            <CardContent className="p-3 items-center">
              <MaterialCommunityIcons name="trending-up" size={20} color="#3B82F6" />
              <Text className="text-lg font-bold mt-1">{Math.round(overallCompletionRate)}%</Text>
              <Text className="text-xs text-muted-foreground">Completion</Text>
            </CardContent>
          </Card>
          
          <Card className="flex-1">
            <CardContent className="p-3 items-center">
              <MaterialCommunityIcons name="message-outline" size={20} color="#8B5CF6" />
              <Text className="text-lg font-bold mt-1">{totalRAGReferences}</Text>
              <Text className="text-xs text-muted-foreground">References</Text>
            </CardContent>
          </Card>
        </View>

        <Button onPress={handleCreateLesson} className="w-full mb-4">
          <MaterialCommunityIcons name="plus-circle" size={16} color="white" />
          <Text className="text-primary-foreground ml-2">Create New Lesson</Text>
        </Button>
      </View>

      {/* Tab Section */}
      <View className="flex-1">
        <View className="flex-row bg-muted mx-4 rounded-lg p-1">
          <Pressable
            onPress={() => setSelectedTab('active')}
            className={cn(
              "flex-1 py-2 items-center rounded-md",
              selectedTab === 'active' ? 'bg-background shadow-sm' : ''
            )}
          >
            <Text className={cn(
              "font-medium text-sm",
              selectedTab === 'active' ? 'text-foreground' : 'text-muted-foreground'
            )}>
              Active ({activeLessons.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSelectedTab('all')}
            className={cn(
              "flex-1 py-2 items-center rounded-md",
              selectedTab === 'all' ? 'bg-background shadow-sm' : ''
            )}
          >
            <Text className={cn(
              "font-medium text-sm",
              selectedTab === 'all' ? 'text-foreground' : 'text-muted-foreground'
            )}>
              All Lessons ({totalLessons})
            </Text>
          </Pressable>
        </View>

        <FlatList
          data={selectedTab === 'active' ? activeLessons : teacherLessons}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TeacherLessonCard 
              lesson={item} 
              isExpanded={expandedLessons.has(item.id)}
              onToggleExpand={() => handleToggleExpand(item.id)}
              onEdit={() => handleEditLesson(item.id)}
            />
          )}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <MaterialCommunityIcons name="book-open-page-variant" size={48} color="#64748B" />
              <Text className="text-lg font-semibold mt-4 mb-2">No lessons yet</Text>
              <Text className="text-muted-foreground text-center mb-4">
                Create your first lesson to get started with teaching.
              </Text>
              <Button onPress={handleCreateLesson}>
                <MaterialCommunityIcons name="plus-circle" size={16} color="white" />
                <Text className="text-primary-foreground ml-2">Create Lesson</Text>
              </Button>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
} 