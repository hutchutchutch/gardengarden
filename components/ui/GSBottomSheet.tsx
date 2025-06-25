import React from 'react';
import { View, Pressable, Modal, TouchableWithoutFeedback } from 'react-native';
import { Text } from './text';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { cn } from '@/lib/utils';

export interface MenuItem {
  label: string;
  icon?: string;
  variant?: 'default' | 'danger';
  onPress: () => void;
}

interface GSBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  options: MenuItem[];
  title?: string;
}

export const GSBottomSheet = ({ visible, onClose, options, title }: GSBottomSheetProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/50 justify-end">
          <TouchableWithoutFeedback>
            <View className="bg-background rounded-t-3xl p-4 pb-8">
              {title && (
                <View className="mb-4">
                  <Text className="text-lg font-semibold text-center">{title}</Text>
                </View>
              )}
              
              {options.map((option, index) => (
                <Pressable
                  key={index}
                  onPress={() => {
                    option.onPress();
                    onClose();
                  }}
                  className={cn(
                    "flex-row items-center py-4 px-2",
                    index < options.length - 1 ? "border-b border-border" : ""
                  )}
                >
                  {option.icon && (
                    <MaterialCommunityIcons
                      name={option.icon as any}
                      size={24}
                      color={option.variant === 'danger' ? '#EF4444' : '#64748B'}
                      style={{ marginRight: 12 }}
                    />
                  )}
                  <Text
                    className={cn(
                      "text-base",
                      option.variant === 'danger' ? 'text-red-500' : 'text-foreground'
                    )}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
              
              <Pressable
                onPress={onClose}
                className="mt-2 py-4 items-center"
              >
                <Text className="text-base text-muted-foreground">Cancel</Text>
              </Pressable>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};