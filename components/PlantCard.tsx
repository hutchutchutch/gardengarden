import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Plant } from '@/types';
import colors from '@/constants/colors';
import { useRouter } from 'expo-router';

interface PlantCardProps {
  plant: Plant;
}

export default function PlantCard({ plant }: PlantCardProps) {
  const router = useRouter();
  
  const getHealthColor = () => {
    switch (plant.health) {
      case 'excellent':
        return colors.success;
      case 'good':
        return colors.primary;
      case 'fair':
        return colors.warning;
      case 'poor':
        return colors.error;
      default:
        return colors.gray;
    }
  };

  const getGrowthStageText = () => {
    switch (plant.growthStage) {
      case 'seed':
        return 'Seed';
      case 'sprout':
        return 'Sprout';
      case 'growing':
        return 'Growing';
      case 'mature':
        return 'Mature';
      default:
        return '';
    }
  };

  const handlePress = () => {
    router.push(`/plant/${plant.id}`);
  };

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      <Image
        source={{ uri: plant.images[0]?.uri || 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?q=80&w=2787&auto=format&fit=crop' }}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{plant.name}</Text>
        <Text style={styles.species}>{plant.species}</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.healthIndicator, { backgroundColor: getHealthColor() }]} />
          <Text style={styles.statusText}>{plant.health}</Text>
          <View style={styles.divider} />
          <Text style={styles.statusText}>{getGrowthStageText()}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 150,
  },
  infoContainer: {
    padding: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  species: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: colors.textLight,
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: colors.grayLight,
    marginHorizontal: 8,
  },
});