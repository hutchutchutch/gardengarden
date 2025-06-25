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
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import colors from '@/constants/colors';
import { Eye, EyeOff, CheckCircle, User, Book } from 'lucide-react-native';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [classId, setClassId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { signUp, setShowFAB } = useAuth();

  useEffect(() => {
    // Hide FAB on auth screens
    setShowFAB(false);
    return () => setShowFAB(true);
  }, [setShowFAB]);

  const handleSignUp = async () => {
    if (!email || !password || !name || !classId) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      await signUp(email, password, name, role, classId);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message || 'Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <CheckCircle size={48} color={colors.primary} />
          <Text style={styles.title}>Join GardenSnap</Text>
          <Text style={styles.subtitle}>Start your garden journey!</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Password (min 6 characters)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Class Code"
            value={classId}
            onChangeText={setClassId}
            autoCapitalize="characters"
            autoCorrect={false}
          />

          <View style={styles.roleContainer}>
            <Text style={styles.roleLabel}>I am a:</Text>
            <View style={styles.roleButtons}>
              <Pressable 
                style={[
                  styles.roleButton, 
                  role === 'student' && styles.roleButtonActive
                ]}
                onPress={() => setRole('student')}
              >
                                  <User size={20} color={role === 'student' ? colors.white : colors.text} />
                  <Text style={[
                  styles.roleButtonText,
                  role === 'student' && styles.roleButtonTextActive
                ]}>Student</Text>
              </Pressable>

              <Pressable 
                style={[
                  styles.roleButton, 
                  role === 'teacher' && styles.roleButtonActive
                ]}
                onPress={() => setRole('teacher')}
              >
                                  <Book size={20} color={role === 'teacher' ? colors.white : colors.text} />
                  <Text style={[
                  styles.roleButtonText,
                  role === 'teacher' && styles.roleButtonTextActive
                ]}>Teacher</Text>
              </Pressable>
            </View>
          </View>

          <Pressable 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={handleSignUp}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </Pressable>

          <Pressable onPress={() => router.push('/auth/signin')}>
            <Text style={styles.linkText}>
              Already have an account? Sign In
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingVertical: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
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
  input: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.grayLight,
  },
  roleContainer: {
    marginTop: 8,
  },
  roleLabel: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.grayLight,
  },
  roleButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleButtonText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  roleButtonTextActive: {
    color: colors.white,
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
}); 