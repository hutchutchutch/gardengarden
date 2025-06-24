import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Leaf } from 'lucide-react-native';
import { useAnalysisStore } from '@/store/analysisStore';
import { AnalysisCard } from '@/components/AnalysisCard';
import { EmptyState } from '@/components/EmptyState';
import { colors } from '@/constants/colors';

export default function HistoryScreen() {
  const router = useRouter();
  const { analyses } = useAnalysisStore();

  const navigateToIdentify = () => {
    router.push('/');
  };

  if (analyses.length === 0) {
    return (
      <EmptyState
        title="No Plant Analyses Yet"
        message="Take a photo or upload an image of a plant to identify it and get care instructions."
        buttonTitle="Identify a Plant"
        onButtonPress={navigateToIdentify}
        icon={<Leaf size={48} color={colors.primary} />}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Plant Analyses</Text>
      <FlatList
        data={analyses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AnalysisCard analysis={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
});