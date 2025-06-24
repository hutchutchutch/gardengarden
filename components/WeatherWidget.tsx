import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { Weather } from '@/types';

interface WeatherWidgetProps {
  weather: Weather | null;
  isLoading: boolean;
}

export default function WeatherWidget({ weather, isLoading }: WeatherWidgetProps) {
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!weather) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Weather data unavailable</Text>
      </View>
    );
  }

  const getWeatherIcon = () => {
    switch (weather.condition) {
      case 'sunny':
        return <Feather name="sun" size={32} color={colors.warning} />;
      case 'cloudy':
        return <Feather name="cloud" size={32} color={colors.gray} />;
      case 'rainy':
        return <Feather name="cloud-rain" size={32} color={colors.secondary} />;
      case 'stormy':
        return <Feather name="cloud-lightning" size={32} color={colors.error} />;
      default:
        return <Feather name="sun" size={32} color={colors.warning} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        {getWeatherIcon()}
      </View>
      <View style={styles.dataContainer}>
        <Text style={styles.temperature}>{weather.temperature}°F</Text>
        <Text style={styles.condition}>{weather.condition}</Text>
        <View style={styles.detailsContainer}>
          <Text style={styles.detailText}>Humidity: {weather.humidity}%</Text>
          <Text style={styles.detailText}>Precipitation: {weather.precipitation}%</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  loadingContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  iconContainer: {
    marginRight: 16,
    justifyContent: 'center',
  },
  dataContainer: {
    flex: 1,
  },
  temperature: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
  },
  condition: {
    fontSize: 16,
    color: colors.textLight,
    textTransform: 'capitalize',
    marginBottom: 8,
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailText: {
    fontSize: 12,
    color: colors.textLight,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
  },
});