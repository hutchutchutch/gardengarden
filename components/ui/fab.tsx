import React, { useState, useRef } from 'react';
import { View, Pressable, StyleSheet, Animated, Text, ScrollView, Platform } from 'react-native';
import { MessageCircle, Bot, User, Bell, Users, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FABProps {
  visible?: boolean;
}

export function FAB({ visible = true }: FABProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const router = useRouter();
  const { user, showFAB, updateUserRole } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const insets = useSafeAreaInsets();
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const translateAnim1 = useRef(new Animated.Value(0)).current;
  const translateAnim2 = useRef(new Animated.Value(0)).current;
  const notificationTranslate = useRef(new Animated.Value(0)).current;
  const menuOpacity = useRef(new Animated.Value(0)).current;

  const toggleExpanded = () => {
    const toValue = isExpanded ? 0 : 1;
    
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue,
        useNativeDriver: true,
        friction: 5,
      }),
      Animated.spring(translateAnim1, {
        toValue: isExpanded ? 0 : -70,
        useNativeDriver: true,
        friction: 5,
      }),
      Animated.spring(translateAnim2, {
        toValue: isExpanded ? 0 : -140,
        useNativeDriver: true,
        friction: 5,
      }),
      Animated.spring(notificationTranslate, {
        toValue: isExpanded ? 0 : -210,
        useNativeDriver: true,
        friction: 5,
      }),
    ]).start();
    
    setIsExpanded(!isExpanded);
    if (showRoleMenu) setShowRoleMenu(false);
  };

  const toggleRoleMenu = () => {
    const toValue = showRoleMenu ? 0 : 1;
    
    Animated.timing(menuOpacity, {
      toValue,
      duration: 200,
      useNativeDriver: true,
    }).start();
    
    setShowRoleMenu(!showRoleMenu);
    if (isExpanded) setIsExpanded(false);
  };

  const handleAIChat = () => {
    setIsExpanded(false);
    router.push('/ai-chat');
  };

  const handleTeacherMessage = () => {
    setIsExpanded(false);
    router.push({
      pathname: '/ai-chat',
      params: { mode: 'teacher' }
    });
  };

  const handleRoleSwitch = async (newRole: 'student' | 'teacher') => {
    setShowRoleMenu(false);
    // Update user role
    await updateUserRole(newRole);
    // Navigate to appropriate interface
    router.replace('/(tabs)');
  };

  // Debug FAB visibility
  console.log('FAB Debug:', { 
    visible, 
    showFAB, 
    hasUser: !!user, 
    userRole: user?.role,
    shouldShow: visible && showFAB && user 
  });

  if (!visible || !showFAB || !user) return null;

  return (
    <>
      {/* Role Menu Dropdown */}
      {showRoleMenu && (
        <Animated.View
          style={[
            styles.roleMenu,
            {
              opacity: menuOpacity,
              transform: [{
                scale: menuOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.95, 1],
                }),
              }],
            },
          ]}
        >
          <View style={styles.roleMenuHeader}>
            <Text style={styles.roleMenuTitle}>Switch Role</Text>
            <Pressable onPress={toggleRoleMenu}>
              <X size={20} color="#64748B" />
            </Pressable>
          </View>
          
          <Pressable
            style={[
              styles.roleOption,
              !isTeacher && styles.roleOptionActive
            ]}
            onPress={() => handleRoleSwitch('student')}
          >
            <View style={styles.roleOptionIcon}>
              <User size={20} color={!isTeacher ? '#10B981' : '#64748B'} />
            </View>
            <View style={styles.roleOptionContent}>
              <Text style={[styles.roleOptionTitle, !isTeacher && styles.roleOptionTitleActive]}>
                Student View
              </Text>
              <Text style={styles.roleOptionDescription}>
                Access your plants and lessons
              </Text>
            </View>
            {!isTeacher && (
              <View style={styles.roleOptionCheck} />
            )}
          </Pressable>
          
          <Pressable
            style={[
              styles.roleOption,
              isTeacher && styles.roleOptionActive
            ]}
            onPress={() => handleRoleSwitch('teacher')}
          >
            <View style={styles.roleOptionIcon}>
              <Users size={20} color={isTeacher ? '#10B981' : '#64748B'} />
            </View>
            <View style={styles.roleOptionContent}>
              <Text style={[styles.roleOptionTitle, isTeacher && styles.roleOptionTitleActive]}>
                Teacher View
              </Text>
              <Text style={styles.roleOptionDescription}>
                Manage class and view analytics
              </Text>
            </View>
            {isTeacher && (
              <View style={styles.roleOptionCheck} />
            )}
          </Pressable>
        </Animated.View>
      )}

      <View style={[
        styles.container,
        {
          bottom: 64 + (Platform.OS === 'android' ? insets.bottom : 0) + 16, // Navigation height + safe area + padding
          backgroundColor: 'rgba(255, 0, 0, 0.3)', // Debug: Red background to see if FAB is positioned
          width: 100, // Debug: Give it a fixed width
          height: 100, // Debug: Give it a fixed height
        },
      ]}>
        {/* Backdrop */}
        {(isExpanded || showRoleMenu) && (
          <Pressable 
            style={StyleSheet.absoluteFillObject} 
            onPress={() => {
              setIsExpanded(false);
              setShowRoleMenu(false);
            }}
          />
        )}
        
        {/* Notification Button */}
        <Animated.View
          style={[
            styles.optionContainer,
            {
              transform: [{ translateY: notificationTranslate }],
              opacity: scaleAnim,
            },
          ]}
        >
          {isExpanded && (
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Notifications</Text>
            </View>
          )}
          <Pressable
            style={[styles.option, styles.notificationOption]}
            onPress={toggleRoleMenu}
          >
            <Bell size={24} color="#FFFFFF" />
            {/* Notification badge */}
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>3</Text>
            </View>
          </Pressable>
        </Animated.View>
        
        {/* AI Assistant Option */}
        <Animated.View
          style={[
            styles.optionContainer,
            {
              transform: [{ translateY: translateAnim1 }],
              opacity: scaleAnim,
            },
          ]}
        >
          {isExpanded && (
            <View style={styles.labelContainer}>
              <Text style={styles.label}>AI Assistant</Text>
            </View>
          )}
          <Pressable
            style={[styles.option, styles.aiOption]}
            onPress={handleAIChat}
          >
            <Bot size={24} color="#FFFFFF" />
          </Pressable>
        </Animated.View>

        {/* Teacher Message Option - Only show for students */}
        {!isTeacher && (
          <Animated.View
            style={[
              styles.optionContainer,
              {
                transform: [{ translateY: translateAnim2 }],
                opacity: scaleAnim,
              },
            ]}
          >
            {isExpanded && (
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Message Teacher</Text>
              </View>
            )}
            <Pressable
              style={[styles.option, styles.teacherOption]}
              onPress={handleTeacherMessage}
            >
              <User size={24} color="#FFFFFF" />
            </Pressable>
          </Animated.View>
        )}

        {/* Main FAB */}
        <Pressable
          style={[
            styles.fab,
            isExpanded && styles.fabExpanded
          ]}
          onPress={toggleExpanded}
        >
          <Animated.View
            style={{
              transform: [{
                rotate: scaleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '45deg'],
                }),
              }],
            }}
          >
            <MessageCircle size={28} color="#FFFFFF" />
          </Animated.View>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    zIndex: 1000,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10B981', // primary color from style guide
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabExpanded: {
    backgroundColor: '#64748B', // muted foreground when expanded
  },
  optionContainer: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  option: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  aiOption: {
    backgroundColor: '#3B82F6', // student color from style guide
  },
  teacherOption: {
    backgroundColor: '#8B5CF6', // teacher color from style guide
  },
  notificationOption: {
    backgroundColor: '#EAB308', // warning color for notifications
  },
  labelContainer: {
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#020817', // foreground color
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444', // destructive color
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  roleMenu: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: 280,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 1001,
  },
  roleMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  roleMenuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#020817',
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  roleOptionActive: {
    backgroundColor: '#ECFDF5', // primary-50
  },
  roleOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  roleOptionContent: {
    flex: 1,
  },
  roleOptionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#020817',
    marginBottom: 2,
  },
  roleOptionTitleActive: {
    color: '#10B981',
  },
  roleOptionDescription: {
    fontSize: 12,
    color: '#64748B',
  },
  roleOptionCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    marginLeft: 8,
  },
}); 