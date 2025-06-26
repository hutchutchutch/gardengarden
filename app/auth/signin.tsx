import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  Pressable, 
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useMode } from '@/contexts/ModeContext';
import colors from '@/constants/colors';
import { Eye, EyeOff, CheckCircle, PlayCircle, X, Book, Users, User, GraduationCap } from 'lucide-react-native';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { signIn, signInDemo, setShowFAB, studentUser, masterTeacherUser } = useAuth();
  const { setIsTeacherMode } = useMode();

  useEffect(() => {
    // Hide FAB on auth screens
    setShowFAB(false);
    return () => setShowFAB(true);
  }, [setShowFAB]);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const lowerEmail = email.toLowerCase().trim();
      
      // Sign in with Supabase
      await signIn(lowerEmail, password);
      
      // Check if this is the master teacher email
      if (lowerEmail === 'herchenbach.hutch@gmail.com') {
        // Set teacher mode for master teacher
        setIsTeacherMode(true);
      } else {
        // Ensure student mode for all other users
        setIsTeacherMode(false);
      }
      
      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Sign In Failed', error.message || 'Please check your credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = async (role: 'student' | 'teacher') => {
    setIsLoading(true);
    try {
      await signInDemo(role);
      setShowDemoModal(false);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Demo Mode Failed', 'Unable to start demo mode');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <CheckCircle size={48} color={colors.primary} />
        <Text style={styles.title}>GardenSnap</Text>
        <Text style={styles.subtitle}>Welcome back!</Text>
      </View>

      <View style={styles.form}>
        {/* Account Status Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>How it works:</Text>
          <Text style={styles.infoText}>
            • Sign in with your email to access your student portal{'\n'}
            • Switch to Teacher mode to view the class as "Hutch Herchenbach"
          </Text>
        </View>

        {/* Show logged in status */}
        {studentUser && (
          <View style={[styles.statusCard, styles.statusCardActive]}>
            <User size={20} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.statusTitle}>Logged in as</Text>
              <Text style={styles.statusEmail}>{studentUser.email}</Text>
            </View>
            <CheckCircle size={16} color={colors.success} />
          </View>
        )}

        {/* Quick Fill Buttons for Testing */}
        <View style={styles.quickFillContainer}>
          <Text style={styles.quickFillLabel}>Quick Fill (for testing):</Text>
          <View style={styles.quickFillButtons}>
            <Pressable
              style={styles.quickFillButton}
              onPress={() => {
                setEmail('hutchenbach@gmail.com');
                setPassword('password'); // You should set the actual password
              }}
            >
              <User size={16} color={colors.primary} />
              <Text style={styles.quickFillText}>Student</Text>
            </Pressable>
            <Pressable
              style={styles.quickFillButton}
              onPress={() => {
                setEmail('herchenbach.hutch@gmail.com');
                setPassword('password'); // You should set the actual password
              }}
            >
              <GraduationCap size={16} color="#8B5CF6" />
              <Text style={[styles.quickFillText, { color: '#8B5CF6' }]}>Teacher</Text>
            </Pressable>
          </View>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <Pressable 
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff size={20} color={colors.textLight} />
            ) : (
              <Eye size={20} color={colors.textLight} />
            )}
          </Pressable>
        </View>

        <Pressable 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={handleSignIn}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.push('/auth/signup')}>
          <Text style={styles.linkText}>
            Don't have an account? Sign Up
          </Text>
        </Pressable>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable 
          style={styles.demoButton} 
          onPress={() => setShowDemoModal(true)}
        >
          <PlayCircle size={20} color={colors.primary} />
          <Text style={styles.demoButtonText}>Try Demo Mode</Text>
        </Pressable>
      </View>

      <Modal
        visible={showDemoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDemoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Demo Role</Text>
              <Pressable 
                onPress={() => setShowDemoModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color={colors.textLight} />
              </Pressable>
            </View>
            
            <Text style={styles.modalDescription}>
              Experience GardenSnap from different perspectives
            </Text>

            <View style={styles.roleButtons}>
              <Pressable
                style={[styles.roleButton, styles.studentButton]}
                onPress={() => handleDemoSignIn('student')}
                disabled={isLoading}
              >
                <Book size={24} color={colors.white} />
                <Text style={styles.roleButtonText}>Student Mode</Text>
                <Text style={styles.roleButtonSubtext}>
                  Access lessons, tasks, and learning content
                </Text>
              </Pressable>

              <Pressable
                style={[styles.roleButton, styles.teacherButton]}
                onPress={() => handleDemoSignIn('teacher')}
                disabled={isLoading}
              >
                <Users size={24} color={colors.white} />
                <Text style={styles.roleButtonText}>Teacher Mode</Text>
                <Text style={styles.roleButtonSubtext}>
                  Manage classes, track progress, and create content
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
  },
  subtitle: {
    fontSize: 18,
    color: colors.textLight,
    marginTop: 4,
  },
  form: {
    gap: 16,
  },
  infoBox: {
    backgroundColor: '#e7f3ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.grayLight,
  },
  statusCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#f0f9ff',
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  statusEmail: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  input: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.grayLight,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 12,
    padding: 4,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  linkText: {
    color: colors.primary,
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.grayLight,
  },
  dividerText: {
    marginHorizontal: 16,
    color: colors.textLight,
    fontSize: 14,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  demoButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
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
    padding: 24,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: 32,
  },
  roleButtons: {
    gap: 16,
  },
  roleButton: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  studentButton: {
    backgroundColor: colors.primary,
  },
  teacherButton: {
    backgroundColor: '#8B5CF6',
  },
  roleButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  roleButtonSubtext: {
    color: colors.white,
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.9,
  },
  quickFillContainer: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  quickFillLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 8,
  },
  quickFillButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quickFillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.grayLight,
  },
  quickFillText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
  },
}); 