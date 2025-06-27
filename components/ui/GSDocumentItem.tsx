import React from 'react';
import { View, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../config/theme';
import { GSLoadingSpinner } from './GSLoadingSpinner';
import { GSIconButton } from './GSIconButton';
import { Text } from './text';
import { ShimmerPlaceholder } from './ShimmerPlaceholder';

export interface DocumentItemProps {
  title: string;
  url: string;
  status: 'completed' | 'processing' | 'failed' | 'pending';
  sections?: number;
  processingProgress?: number;
  errorMessage?: string;
  ragReferences?: number;
  chunkCount?: number;
  onRetry?: () => void;
  isLoading?: boolean;
}

export const GSDocumentItem: React.FC<DocumentItemProps> = ({
  title,
  url,
  status,
  sections = 0,
  processingProgress = 0,
  errorMessage,
  ragReferences = 0,
  chunkCount = 0,
  onRetry,
  isLoading = false,
}) => {
  const theme = useAppTheme();

  if (isLoading) {
    return (
      <View 
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.colors.surfaceVariant,
          borderRadius: theme.borderRadius.sm,
          padding: theme.spacing.sm,
          marginBottom: theme.spacing.xs,
        }}
      >
        <ShimmerPlaceholder width={20} height={20} borderRadius={10} />
        <View style={{ flex: 1, marginLeft: theme.spacing.sm }}>
          <ShimmerPlaceholder width={150} height={16} />
          <View style={{ height: theme.spacing.xxs }} />
          <ShimmerPlaceholder width={200} height={12} />
          <View style={{ height: theme.spacing.xxs }} />
          <ShimmerPlaceholder width={100} height={12} />
        </View>
      </View>
    );
  }

  const getStatusIcon = () => {
    const iconSize = 20;
    switch (status) {
      case 'completed':
        return <MaterialCommunityIcons name="check-circle" size={iconSize} color={theme.colors.excellent} />;
      case 'processing':
        return <GSLoadingSpinner size="small" />;
      case 'failed':
        return <MaterialCommunityIcons name="alert-circle" size={iconSize} color={theme.colors.error} />;
      default:
        return <MaterialCommunityIcons name="file-document-outline" size={iconSize} color={theme.colors.onSurfaceVariant} />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'completed':
        return chunkCount > 0 ? `Chunks: ${chunkCount}` : `Ready - ${sections} sections`;
      case 'processing':
        return `Processing... ${processingProgress}%`;
      case 'failed':
        return errorMessage || 'Failed - Retry';
      default:
        return 'Pending';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return theme.colors.excellent;
      case 'processing':
        return theme.colors.brandSecondary;
      case 'failed':
        return theme.colors.error;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  return (
    <View 
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceVariant,
        borderRadius: theme.borderRadius.sm,
        padding: theme.spacing.sm,
        marginBottom: theme.spacing.xs,
        borderWidth: 0.5,
        borderColor: theme.colors.outlineVariant,
      }}
    >
      <View style={{ marginRight: theme.spacing.sm }}>
        {getStatusIcon()}
      </View>
      
      <View style={{ flex: 1 }}>
        <Text 
          style={{ 
            fontSize: 14, 
            fontWeight: '500',
            color: theme.colors.onSurface,
            marginBottom: theme.spacing.xxs,
          }} 
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text 
          style={{ 
            fontSize: 12, 
            color: theme.colors.onSurfaceVariant,
            marginBottom: theme.spacing.xxs,
          }} 
          numberOfLines={1}
        >
          {url}
        </Text>
        <Text 
          style={{ 
            fontSize: 12,
            color: getStatusColor(),
            fontWeight: status === 'failed' ? '500' : '400',
          }}
        >
          {getStatusText()}
        </Text>
      </View>

      {status === 'completed' && ragReferences > 0 && (
        <View 
          style={{ 
            flexDirection: 'row', 
            alignItems: 'center',
            marginLeft: theme.spacing.xs,
            backgroundColor: theme.colors.primaryContainer,
            paddingHorizontal: theme.spacing.xs,
            paddingVertical: theme.spacing.xxs,
            borderRadius: theme.borderRadius.xs,
          }}
        >
          <MaterialCommunityIcons name="eye-outline" size={14} color={theme.colors.onPrimaryContainer} />
          <Text 
            style={{ 
              fontSize: 12, 
              fontWeight: '600',
              color: theme.colors.onPrimaryContainer,
              marginLeft: theme.spacing.xxs,
            }}
          >
            {ragReferences}
          </Text>
        </View>
      )}

      {status === 'failed' && onRetry && (
        <View style={{ marginLeft: theme.spacing.xs }}>
          <GSIconButton
            icon="refresh"
            size={20}
            onPress={onRetry}
          />
        </View>
      )}
    </View>
  );
}; 