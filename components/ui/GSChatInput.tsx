import React, { useState } from 'react';
import { TextInput, IconButton, Text } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';
import { useAppTheme } from '../../config/theme';

interface GSChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onPhotoAttach?: () => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  testID?: string;
}

export const GSChatInput: React.FC<GSChatInputProps> = ({
  value,
  onChangeText,
  onSend,
  onPhotoAttach,
  placeholder = 'Type a message...',
  maxLength = 500,
  disabled = false,
  testID = 'gs-chat-input',
}) => {
  const theme = useAppTheme();
  const [isFocused, setIsFocused] = useState(false);

  const handleSend = () => {
    if (value.trim() && !disabled) {
      onSend();
    }
  };

  const canSend = value.trim().length > 0 && !disabled;
  const characterCount = value.length;
  const isNearLimit = maxLength && characterCount > maxLength * 0.8;

  return (
    <View 
      style={[
        styles.container,
        { backgroundColor: theme.colors.surface },
      ]}
    >
      <View style={styles.inputContainer}>
        <TextInput
          value={value}
          onChangeText={(text) => {
            if (text.length <= maxLength) {
              onChangeText(text);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          multiline
          mode="outlined"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          left={
            onPhotoAttach ? (
              <TextInput.Icon
                icon="camera"
                onPress={onPhotoAttach}
                disabled={disabled}
                testID={`${testID}-photo`}
              />
            ) : null
          }
          right={
            <TextInput.Icon
              icon="send"
              onPress={handleSend}
              disabled={!canSend}
              color={canSend ? theme.colors.primary : theme.colors.onSurfaceDisabled}
              testID={`${testID}-send`}
            />
          }
          activeOutlineColor={theme.colors.primary}
          outlineColor={theme.colors.outline}
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
            borderRadius: 24,
            borderWidth: isFocused ? 2 : 1,
          }}
          testID={testID}
          accessibilityState={{ disabled }}
        />
      </View>

      {maxLength && (
        <View style={styles.footer}>
          <Text
            variant="labelSmall"
            style={[
              styles.characterCount,
              {
                color: isNearLimit 
                  ? theme.colors.fair 
                  : theme.colors.textHint,
              },
            ]}
            testID={`${testID}-counter`}
          >
            {characterCount}/{maxLength}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
  },
  inputContainer: {
    width: '100%',
  },
  input: {
    maxHeight: 120,
    minHeight: 56,
  },
  inputContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  footer: {
    alignItems: 'flex-end',
    marginTop: 4,
    paddingHorizontal: 12,
  },
  characterCount: {
    fontSize: 12,
  },
}); 