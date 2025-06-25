import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, MessageSquare, Book, Settings, LogOut } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import colors from '@/constants/colors';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleAIChat = () => {
    router.push('/ai-chat');
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
        <Text style={styles.profileName}>{user?.name || 'Garden Student'}</Text>
        <Text style={styles.profileClass}>
          {user?.role === 'teacher' ? 'Teacher' : `Class: ${user?.classId || 'N/A'}`}
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
});