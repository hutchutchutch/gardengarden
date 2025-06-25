import React, { useState } from 'react';
import { Searchbar, Chip } from 'react-native-paper';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useAppTheme } from '../../config/theme';
import { ShimmerPlaceholder } from './ShimmerPlaceholder';

export interface FilterChip {
  id: string;
  label: string;
  icon?: string;
}

interface GSSearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (query: string) => void;
  onSubmit?: () => void;
  filters?: FilterChip[];
  selectedFilters?: string[];
  onFilterToggle?: (filterId: string) => void;
  showClearButton?: boolean;
  isLoading?: boolean;
  testID?: string;
}

export const GSSearchBar: React.FC<GSSearchBarProps> = ({
  placeholder = 'Search students...',
  value,
  onChangeText,
  onSubmit,
  filters = [],
  selectedFilters = [],
  onFilterToggle,
  showClearButton = true,
  isLoading = false,
  testID = 'gs-search-bar',
}) => {
  const theme = useAppTheme();
  const [isFocused, setIsFocused] = useState(false);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ShimmerPlaceholder 
          height={48} 
          borderRadius={8}
        />
        {filters.length > 0 && (
          <View style={styles.filterContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterContent}
            >
              {[1, 2, 3, 4].map((i) => (
                <ShimmerPlaceholder 
                  key={i}
                  width={60} 
                  height={32} 
                  borderRadius={16}
                  style={{ marginHorizontal: 4 }}
                  delay={i * 50}
                />
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  }

  const handleClear = () => {
    onChangeText('');
  };

  const isFilterSelected = (filterId: string) => {
    return selectedFilters.includes(filterId);
  };

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder={placeholder}
        onChangeText={onChangeText}
        value={value}
        onSubmitEditing={onSubmit}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onClearIconPress={showClearButton ? handleClear : undefined}
        style={[
          styles.searchBar,
          {
            backgroundColor: theme.colors.surface,
            borderColor: isFocused ? theme.colors.primary : theme.colors.outline,
            borderWidth: isFocused ? 2 : 1,
            elevation: isFocused ? theme.elevation.level1 : theme.elevation.level0,
          },
        ]}
        inputStyle={styles.input}
        iconColor={isFocused ? theme.colors.primary : theme.colors.onSurfaceVariant}
        placeholderTextColor={theme.colors.textHint}
        testID={testID}
        accessibilityLabel="Search"
      />

      {filters.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {filters.map((filter) => (
            <Chip
              key={filter.id}
              icon={filter.icon}
              selected={isFilterSelected(filter.id)}
              onPress={() => onFilterToggle?.(filter.id)}
              style={[
                styles.chip,
                {
                  backgroundColor: isFilterSelected(filter.id)
                    ? theme.colors.primaryContainer
                    : theme.colors.surface,
                  borderColor: isFilterSelected(filter.id)
                    ? theme.colors.primary
                    : theme.colors.outline,
                },
              ]}
              textStyle={{
                color: isFilterSelected(filter.id)
                  ? theme.colors.onPrimaryContainer
                  : theme.colors.onSurfaceVariant,
              }}
              testID={`${testID}-filter-${filter.id}`}
            >
              {filter.label}
            </Chip>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  searchBar: {
    borderRadius: 8,
  },
  input: {
    fontSize: 16,
  },
  filterContainer: {
    marginTop: 12,
    maxHeight: 40,
  },
  filterContent: {
    paddingHorizontal: 4,
  },
  chip: {
    marginHorizontal: 4,
    borderWidth: 1,
  },
}); 