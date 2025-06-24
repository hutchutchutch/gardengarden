import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Camera, Edit2 } from 'lucide-react-native';
import { useProfileStore } from '@/store/profileStore';
import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=250&q=80';

const GARDEN_TYPES = [
  'Indoor Garden',
  'Outdoor Garden',
  'Balcony Garden',
  'Vegetable Garden',
  'Herb Garden',
  'Flower Garden',
  'Succulent Garden',
];

const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export default function ProfileScreen() {
  const { profile, updateProfile } = useProfileStore();
  const [name, setName] = useState(profile?.name || 'Garden Student');
  const [avatar, setAvatar] = useState(profile?.avatar || DEFAULT_AVATAR);
  const [gardenType, setGardenType] = useState(profile?.gardenType || GARDEN_TYPES[0]);
  const [experience, setExperience] = useState<'beginner' | 'intermediate' | 'advanced'>(profile?.experience || 'beginner');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Initialize profile if it doesn't exist
    if (!profile) {
      updateProfile({
        name: 'Garden Student',
        email: 'student@garden.edu',
        avatar: DEFAULT_AVATAR,
        gardenType: GARDEN_TYPES[0],
        experience: 'beginner',
        plantCount: 0,
      });
    }
  }, [profile, updateProfile]);

  const handlePickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to change your avatar.');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatar(result.assets[0].uri);
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      console.error('Error picking avatar:', error);
      Alert.alert('Error', 'Failed to pick avatar. Please try again.');
    }
  };

  const handleSaveProfile = () => {
    updateProfile({
      name,
      avatar,
      gardenType,
      experience,
    });
    
    setIsEditing(false);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const selectGardenType = (type: string) => {
    setGardenType(type);
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  };

  const selectExperience = (exp: 'beginner' | 'intermediate' | 'advanced') => {
    setExperience(exp);
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Profile</Text>
        <TouchableOpacity onPress={toggleEdit} style={styles.editButton}>
          <Edit2 size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.avatarContainer}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
        {isEditing && (
          <TouchableOpacity 
            style={styles.changeAvatarButton} 
            onPress={handlePickAvatar}
          >
            <Camera size={20} color="white" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.nameContainer}>
        {isEditing ? (
          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={setName}
            placeholder="Your Name"
          />
        ) : (
          <Text style={styles.name}>{name}</Text>
        )}
        <Text style={styles.email}>{profile?.email || 'student@garden.edu'}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{profile?.plantCount || 0}</Text>
          <Text style={styles.statLabel}>Plants Identified</Text>
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Garden Type</Text>
        {isEditing ? (
          <View style={styles.optionsContainer}>
            {GARDEN_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.optionButton,
                  gardenType === type && styles.selectedOption,
                ]}
                onPress={() => selectGardenType(type)}
              >
                <Text
                  style={[
                    styles.optionText,
                    gardenType === type && styles.selectedOptionText,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.infoText}>{gardenType}</Text>
        )}
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Experience Level</Text>
        {isEditing ? (
          <View style={styles.experienceContainer}>
            {EXPERIENCE_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.experienceButton,
                  experience === level.value && styles.selectedExperience,
                ]}
                onPress={() => selectExperience(level.value as 'beginner' | 'intermediate' | 'advanced')}
              >
                <Text
                  style={[
                    styles.experienceText,
                    experience === level.value && styles.selectedExperienceText,
                  ]}
                >
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.infoText}>
            {EXPERIENCE_LEVELS.find(level => level.value === experience)?.label || 'Beginner'}
          </Text>
        )}
      </View>

      {isEditing && (
        <Button
          title="Save Profile"
          onPress={handleSaveProfile}
          style={styles.saveButton}
        />
      )}
    </ScrollView>
  );
}

// Simple TextInput component to avoid importing from react-native-paper or other libraries
const TextInput = ({ style, value, onChangeText, placeholder }: any) => {
  return (
    <View style={[textInputStyles.container, style]}>
      <TextInputNative
        style={textInputStyles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
      />
    </View>
  );
};

import { TextInput as TextInputNative } from 'react-native';

const textInputStyles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    fontSize: 16,
    color: colors.text,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.card,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  changeAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    backgroundColor: colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  nameContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  nameInput: {
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
    width: '80%',
  },
  email: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
    paddingVertical: 16,
    backgroundColor: colors.card,
    borderRadius: 16,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.card,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: 14,
    color: colors.text,
  },
  selectedOptionText: {
    color: 'white',
    fontWeight: '500',
  },
  experienceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  experienceButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  experienceText: {
    fontSize: 14,
    color: colors.text,
  },
  selectedExperience: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  selectedExperienceText: {
    color: 'white',
    fontWeight: '500',
  },
  saveButton: {
    marginTop: 16,
    marginBottom: 40,
  },
});