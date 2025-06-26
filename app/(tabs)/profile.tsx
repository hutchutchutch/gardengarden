import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Modal, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, MessageSquare, Book, Settings, LogOut, ChevronDown, Check } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useMode } from '@/contexts/ModeContext';
import colors from '@/constants/colors';
import { User } from '@/types';
import { supabase } from '@/utils/supabase';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut, getAllStudents, switchToStudent } = useAuth();
  const { isTeacherMode } = useMode();
  const [showStudentPicker, setShowStudentPicker] = useState(false);
  const [students, setStudents] = useState<User[]>([]);
  const [className, setClassName] = useState<string>('Loading...');
  const [classLoading, setClassLoading] = useState(true);

  useEffect(() => {
    // Fetch all students when component mounts (only if we're a teacher)
    const fetchStudents = async () => {
      try {
        const allStudents = await getAllStudents();
        setStudents(allStudents);
      } catch (error) {
        console.error('Failed to fetch students:', error);
      }
    };
    
    if (user?.role === 'teacher') {
      fetchStudents();
    }
  }, [user?.role]);

  useEffect(() => {
    // Fetch class name when user changes
    const fetchClassName = async () => {
      console.log('🔍 fetchClassName called with user:', user?.email, user?.role);
      
      setClassLoading(true);
      
      try {
        if (!user) {
          console.log('⚠️ No user found, skipping class fetch');
          setClassName('No User');
          setClassLoading(false);
          return;
        }

        if (user.role === 'teacher') {
          console.log('👨‍🏫 User is teacher, no class needed');
          setClassName('Teacher');
          setClassLoading(false);
          return;
        }

        if (!user.classId) {
          console.log('⚠️ No classId found for user');
          setClassName('No Class Assigned');
          setClassLoading(false);
          return;
        }

        console.log('🔄 Fetching class data for classId:', user.classId);
        
        // Direct class name query
        const { data: classData, error } = await supabase
          .from('classes')
          .select('name')
          .eq('id', user.classId)
          .single();
        
        console.log('📊 Direct query result - data:', classData, 'error:', error);
        
        if (error) {
          console.error('❌ Direct query error:', error);
          setClassName('Error Loading Class');
          setClassLoading(false);
          return;
        }
        
        if (classData?.name) {
          console.log('✅ Successfully got class name:', classData.name);
          setClassName(classData.name);
        } else {
          console.log('⚠️ No class data found');
          setClassName('Class Not Found');
        }
      } catch (error) {
        console.error('💥 Exception in fetchClassName:', error);
        setClassName('Error Loading Class');
      } finally {
        setClassLoading(false);
      }
    };
    
    fetchClassName();
  }, [user]);

  const handleAIChat = () => {
    router.push('/ai-chat');
  };

  const handleStudentSelect = async (studentId: string) => {
    try {
      await switchToStudent(studentId);
      setShowStudentPicker(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to switch student. Please try again.');
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView 
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.profileHeader}>
        <View style={styles.profileImage}>
          <Text style={styles.profileInitial}>
            {user?.name?.charAt(0).toUpperCase() || 'G'}
          </Text>
        </View>
        
        {/* Student Switcher - Only show for teachers */}
        {user?.role === 'teacher' && (
          <Pressable
            style={styles.studentSwitcher}
            onPress={() => setShowStudentPicker(true)}
          >
            <Text style={styles.profileName}>Viewing: {user?.name || 'Select Student'}</Text>
            <ChevronDown size={20} color={colors.textLight} />
          </Pressable>
        )}
        
        {/* Regular name display */}
        {user?.role === 'student' && (
          <Text style={styles.profileName}>{user?.name || 'Garden Student'}</Text>
        )}
        
        <Text style={styles.profileClass}>
          {user?.role === 'teacher' ? 'Teacher' : `Class: ${classLoading ? 'Loading...' : className}`}
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>3</Text>
          <Text style={styles.statLabel}>Plants</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Photos</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user?.streak || 0}</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>My Plants</Text>
      <Pressable style={styles.addButton}>
        <Plus size={20} color={colors.white} />
        <Text style={styles.addButtonText}>Add New Plant</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Resources</Text>
      <View style={styles.menuContainer}>
        <Pressable style={styles.menuItem} onPress={handleAIChat}>
          <MessageSquare size={20} color={colors.primary} style={styles.menuIcon} />
          <Text style={styles.menuText}>Garden Mentor AI</Text>
        </Pressable>
        <Pressable style={styles.menuItem}>
          <Book size={20} color={colors.primary} style={styles.menuIcon} />
          <Text style={styles.menuText}>Learning Resources</Text>
        </Pressable>
        <Pressable style={styles.menuItem}>
          <Settings size={20} color={colors.primary} style={styles.menuIcon} />
          <Text style={styles.menuText}>Settings</Text>
        </Pressable>
        <Pressable style={styles.menuItem} onPress={handleSignOut}>
          <LogOut size={20} color={colors.error} style={styles.menuIcon} />
          <Text style={[styles.menuText, { color: colors.error }]}>Sign Out</Text>
        </Pressable>
      </View>

      <Text style={styles.versionText}>GardenSnap v1.0.0</Text>

      {/* Student Picker Modal */}
      <Modal
        visible={showStudentPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStudentPicker(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowStudentPicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Switch Student</Text>
            <FlatList
              data={students}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.studentItem}
                  onPress={() => handleStudentSelect(item.id)}
                >
                  <View style={styles.studentInfo}>
                    <View style={styles.studentAvatar}>
                      <Text style={styles.studentInitial}>
                        {item.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.studentName}>{item.name}</Text>
                      <Text style={styles.studentEmail}>{item.email}</Text>
                    </View>
                  </View>
                  {user?.id === item.id && (
                    <Check size={20} color={colors.primary} />
                  )}
                </Pressable>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              style={styles.studentList}
            />
            <Pressable
              style={styles.cancelButton}
              onPress={() => setShowStudentPicker(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  profileInitial: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.white,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  profileClass: {
    fontSize: 16,
    color: colors.textLight,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textLight,
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: colors.grayLight,
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginLeft: 8,
  },
  menuContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
    color: colors.text,
  },
  versionText: {
    textAlign: 'center',
    color: colors.textLight,
    fontSize: 12,
    marginTop: 16,
  },
  studentSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingTop: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    color: colors.text,
  },
  studentList: {
    maxHeight: 400,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  studentInitial: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  studentEmail: {
    fontSize: 14,
    color: colors.textLight,
  },
  separator: {
    height: 1,
    backgroundColor: colors.grayLight,
    marginHorizontal: 16,
  },
  cancelButton: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: colors.grayLight,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});