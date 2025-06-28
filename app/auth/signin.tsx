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
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useMode } from '@/contexts/ModeContext';
import colors from '@/constants/colors';
import { Eye, EyeOff, CheckCircle, User, GraduationCap } from 'lucide-react-native';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { signIn, setShowFAB } = useAuth();
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
      // Navigate to main app for both teachers and students
      // The /(tabs)/index.tsx will conditionally render the correct screen
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Sign In Failed', error.message || 'Please check your credentials');
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
          <Text style={styles.infoTitle}>Teacher Benefits:</Text>
          <Text style={styles.infoText}>
            • Your students are going to use AI{'\n'}
            • Give them a chatbot that you trust{'\n'}
          </Text>
        </View>

        {/* Quick Fill Buttons for Testing */}
        <View style={styles.quickFillContainer}>
          <Text style={styles.quickFillLabel}>Quick Fill (for testing):</Text>
          <View style={styles.quickFillButtons}>
            <Pressable
              style={styles.quickFillButton}
              onPress={() => {
                setEmail('hutchenbach@gmail.com');
                setPassword('Donatello');
              }}
            >
              <User size={16} color={colors.primary} />
              <Text style={styles.quickFillText}>Hutch (Student)</Text>
            </Pressable>
            <Pressable
              style={styles.quickFillButton}
              onPress={() => {
                setEmail('herchenbach.hutch@gmail.com');
                setPassword('MasterSplinter');
              }}
            >
              <GraduationCap size={16} color="#8B5CF6" />
              <Text style={[styles.quickFillText, { color: '#8B5CF6' }]}>Hutch (Teacher)</Text>
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
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
  },
  form: {
    flex: 1,
    paddingHorizontal: 24,
  },
  infoBox: {
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  quickFillContainer: {
    marginBottom: 24,
  },
  quickFillLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 8,
  },
  quickFillButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  quickFillButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.grayLight,
  },
  quickFillText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
    marginLeft: 6,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.grayLight,
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  passwordInput: {
    paddingRight: 50,
    marginBottom: 0,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  linkText: {
    textAlign: 'center',
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
}); 