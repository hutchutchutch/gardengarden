import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { usePlantStore } from '@/store/plant-store';
import { useTaskStore } from '@/store/task-store';
import { Edit, Trash2, Camera, Droplet, Star } from 'lucide-react-native';
import colors from '@/constants/colors';
import TaskCard from '@/components/TaskCard';

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { plants, fetchPlants, isLoading: plantsLoading } = usePlantStore();
  const { tasks, fetchTasks, isLoading: tasksLoading } = useTaskStore();

  useEffect(() => {
    fetchPlants();
    fetchTasks();
  }, [fetchPlants, fetchTasks]);

  const plant = plants.find(p => p.id === id);
  const plantTasks = tasks.filter(task => task.plantId === id && !task.completed);

  if (plantsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!plant) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Plant not found</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen 
        options={{
          title: plant.name,
          headerStyle: {
            backgroundColor: colors.white,
          },
          headerTitleStyle: {
            color: colors.text,
            fontWeight: '600',
          },
          headerTintColor: colors.primary,
        }} 
      />

      <Image
        source={{ uri: plant.images[0]?.uri || 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?q=80&w=2787&auto=format&fit=crop' }}
        style={styles.heroImage}
        contentFit="cover"
      />

      <View style={styles.header}>
        <View>
          <Text style={styles.plantName}>{plant.name}</Text>
          <Text style={styles.plantSpecies}>{plant.species}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.iconButton}>
            <Edit size={20} color={colors.primary} />
          </Pressable>
          <Pressable style={[styles.iconButton, styles.deleteButton]}>
            <Trash2 size={20} color={colors.error} />
          </Pressable>
        </View>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Planted Date</Text>
          <Text style={styles.infoValue}>{formatDate(plant.plantedDate)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Growth Stage</Text>
          <Text style={styles.infoValue}>{plant.growthStage}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Health Status</Text>
          <Text style={styles.infoValue}>{plant.health}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Last Watered</Text>
          <Text style={styles.infoValue}>{formatDate(plant.lastWatered)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Last Fertilized</Text>
          <Text style={styles.infoValue}>{formatDate(plant.lastFertilized)}</Text>
        </View>
      </View>

      <View style={styles.notesContainer}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <Text style={styles.notesText}>{plant.notes}</Text>
      </View>

      <View style={styles.actionsContainer}>
        <Pressable style={styles.actionButton}>
          <Camera size={20} color={colors.white} />
          <Text style={styles.actionButtonText}>Take Photo</Text>
        </Pressable>
        <Pressable style={[styles.actionButton, styles.waterButton]}>
          <Droplet size={20} color={colors.white} />
          <Text style={styles.actionButtonText}>Water</Text>
        </Pressable>
        <Pressable style={[styles.actionButton, styles.fertilizeButton]}>
          <Star size={20} color={colors.white} />
          <Text style={styles.actionButtonText}>Fertilize</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Tasks</Text>
      {tasksLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : plantTasks.length > 0 ? (
        plantTasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))
      ) : (
        <Text style={styles.emptyText}>No pending tasks for this plant.</Text>
      )}

      <Text style={styles.sectionTitle}>Growth Timeline</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.timelineContainer}
      >
        {plant.images.map((image) => (
          <View key={image.id} style={styles.timelineCard}>
            <Image
              source={{ uri: image.uri }}
              style={styles.timelineImage}
              contentFit="cover"
            />
            <Text style={styles.timelineDate}>
              {formatDate(image.date)}
            </Text>
          </View>
        ))}
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  content: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 18,
    color: colors.error,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  heroImage: {
    width: '100%',
    height: 250,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  plantName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  plantSpecies: {
    fontSize: 16,
    fontStyle: 'italic',
    color: colors.textLight,
  },
  headerActions: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteButton: {
    backgroundColor: colors.backgroundLight,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  infoLabel: {
    fontSize: 16,
    color: colors.textLight,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    textTransform: 'capitalize',
  },
  notesContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  notesText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  waterButton: {
    backgroundColor: colors.secondary,
  },
  fertilizeButton: {
    backgroundColor: colors.success,
  },
  actionButtonText: {
    color: colors.white,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyText: {
    color: colors.textLight,
    textAlign: 'center',
    marginVertical: 16,
    fontStyle: 'italic',
    paddingHorizontal: 16,
  },
  timelineContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  timelineCard: {
    marginRight: 12,
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    width: 150,
  },
  timelineImage: {
    width: 150,
    height: 150,
  },
  timelineDate: {
    padding: 8,
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
  },
});