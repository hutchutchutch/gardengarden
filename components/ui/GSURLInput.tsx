import React, { useState, useCallback } from 'react';
import { TextInput, IconButton, HelperText } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';
import { useAppTheme } from '../../config/theme';

interface GSURLInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  onAdd?: () => void;
  onRemove?: () => void;
  placeholder?: string;
  disabled?: boolean;
  testID?: string;
}

export const GSURLInput: React.FC<GSURLInputProps> = ({
  label = 'URL',
  value,
  onChangeText,
  onAdd,
  onRemove,
  placeholder = 'https://example.com',
  disabled = false,
  testID = 'gs-url-input',
}) => {
  const theme = useAppTheme();
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const validateURL = useCallback((url: string) => {
    if (!url) {
      setError(false);
      setErrorMessage('');
      return true;
    }

    try {
      // Basic URL validation
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      
      if (!urlPattern.test(url)) {
        setError(true);
        setErrorMessage('Please enter a valid URL');
        return false;
      }

      // Additional validation for common URL mistakes
      if (url.includes(' ')) {
        setError(true);
        setErrorMessage('URLs cannot contain spaces');
        return false;
      }

      setError(false);
      setErrorMessage('');
      return true;
    } catch (e) {
      setError(true);
      setErrorMessage('Invalid URL format');
      return false;
    }
  }, []);

  const handleChangeText = (text: string) => {
    onChangeText(text);
    validateURL(text);
  };

  const handleBlur = () => {
    setIsFocused(false);
    validateURL(value);
  };

  const handleAdd = () => {
    if (validateURL(value) && onAdd) {
      onAdd();
    }
  };

  const isValidURL = !error && value.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          label={label}
          value={value}
          onChangeText={handleChangeText}
          error={error}
          placeholder={placeholder}
          disabled={disabled}
          mode="outlined"
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          left={<TextInput.Icon icon="link" />}
          right={
            onAdd ? (
              <TextInput.Icon
                icon="plus-circle"
                onPress={handleAdd}
                disabled={!isValidURL || disabled}
                color={isValidURL ? theme.colors.primary : theme.colors.onSurfaceDisabled}
                testID={`${testID}-add-button`}
              />
            ) : onRemove ? (
              <TextInput.Icon
                icon="minus-circle"
                onPress={onRemove}
                disabled={disabled}
                color={theme.colors.error}
                testID={`${testID}-remove-button`}
              />
            ) : null
          }
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
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          testID={testID}
          accessibilityState={{ disabled }}
          accessibilityLabel={label}
        />
      </View>
      
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    width: '100%',
  },
  input: {
    fontSize: 16,
  },
  inputContent: {
    paddingHorizontal: 16,
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    lineHeight: 16,
    paddingHorizontal: 12,
  },
}); 