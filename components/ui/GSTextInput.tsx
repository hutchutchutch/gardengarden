import React, { useState } from 'react';
import { TextInput, HelperText } from 'react-native-paper';
import { View, StyleSheet, Text } from 'react-native';
import { useAppTheme } from '../../config/theme';
import { ShimmerPlaceholder } from './ShimmerPlaceholder';

interface GSTextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: boolean;
  errorMessage?: string;
  maxLength?: number;
  showCounter?: boolean;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  disabled?: boolean;
  left?: React.ReactNode;
  right?: React.ReactNode;
  mode?: 'flat' | 'outlined';
  isLoading?: boolean;
  testID?: string;
}

export const GSTextInput: React.FC<GSTextInputProps> = ({
  label,
  value,
  onChangeText,
  error = false,
  errorMessage,
  maxLength,
  showCounter = false,
  placeholder,
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  disabled = false,
  left,
  right,
  mode = 'outlined',
  isLoading = false,
  testID = 'gs-text-input',
}) => {
  const theme = useAppTheme();
  const [isFocused, setIsFocused] = useState(false);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ShimmerPlaceholder 
          width={80} 
          height={16} 
          borderRadius={4}
          style={{ marginBottom: 8 }}
        />
        <ShimmerPlaceholder 
          height={56} 
          borderRadius={4}
        />
      </View>
    );
  }

  const handleChangeText = (text: string) => {
    if (maxLength && text.length > maxLength) {
      return;
    }
    onChangeText(text);
  };

  const counterColor = () => {
    if (error) return theme.colors.error;
    if (value.length === maxLength) return theme.colors.fair;
    if (value.length > (maxLength || 0) * 0.8) return theme.colors.fair;
    return theme.colors.textHint;
  };

  return (
    <View style={styles.container}>
      <TextInput
        label={label}
        value={value}
        onChangeText={handleChangeText}
        error={error}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        numberOfLines={numberOfLines}
        disabled={disabled}
        mode={mode}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        left={left}
        right={right}
        activeOutlineColor={error ? theme.colors.error : theme.colors.primary}
        outlineColor={error ? theme.colors.error : theme.colors.outline}
        style={[
          styles.input,
          {
            backgroundColor: disabled 
              ? theme.colors.surfaceDisabled 
              : theme.colors.surface,
          },
        ]}
        contentStyle={styles.inputContent}
        outlineStyle={{
          borderRadius: theme.borderRadius.sm,
          borderWidth: isFocused ? 2 : 1,
        }}
        testID={testID}
        accessibilityState={{ disabled }}
        accessibilityLabel={label}
      />
      
      {(error && errorMessage) || (showCounter && maxLength) ? (
        <View style={styles.helperContainer}>
          {error && errorMessage && (
            <HelperText
              type="error"
              visible={error}
              style={styles.helperText}
              testID={`${testID}-error`}
            >
              {errorMessage}
            </HelperText>
          )}
          
          {showCounter && maxLength && (
            <Text
              style={[
                styles.counter,
                { color: counterColor() },
              ]}
              testID={`${testID}-counter`}
            >
              {value.length}/{maxLength}
            </Text>
          )}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  input: {
    fontSize: 16,
  },
  inputContent: {
    paddingHorizontal: 16,
    fontSize: 16,
  },
  helperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    minHeight: 20,
  },
  helperText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  counter: {
    fontSize: 12,
    lineHeight: 16,
    marginLeft: 8,
  },
}); 