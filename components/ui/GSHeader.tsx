import React from 'react';
import { Appbar, Badge } from 'react-native-paper';
import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '../../config/theme';

type HeaderVariant = 'default' | 'back' | 'menu' | 'action';

interface GSHeaderProps {
  title: string;
  subtitle?: string;
  variant?: HeaderVariant;
  onBack?: () => void;
  onMenu?: () => void;
  actions?: Array<{
    icon: string;
    onPress: () => void;
    badge?: number;
    testID?: string;
  }>;
  elevated?: boolean;
  testID?: string;
}

export const GSHeader: React.FC<GSHeaderProps> = ({
  title,
  subtitle,
  variant = 'default',
  onBack,
  onMenu,
  actions = [],
  elevated = true,
  testID = 'gs-header',
}) => {
  const theme = useAppTheme();

  const renderLeftIcon = () => {
    switch (variant) {
      case 'back':
        return (
          <Appbar.BackAction
            onPress={onBack}
            testID={`${testID}-back-action`}
          />
        );
      case 'menu':
        return (
          <Appbar.Action
            icon="menu"
            onPress={onMenu}
            testID={`${testID}-menu-action`}
          />
        );
      default:
        return null;
    }
  };

  const renderActions = () => {
    return actions.map((action, index) => (
      <View key={index} style={styles.actionContainer}>
        <Appbar.Action
          icon={action.icon}
          onPress={action.onPress}
          testID={action.testID || `${testID}-action-${index}`}
        />
        {action.badge !== undefined && action.badge > 0 && (
          <Badge
            size={16}
            style={[
              styles.badge,
              { backgroundColor: theme.colors.secondary },
            ]}
            testID={`${testID}-badge-${index}`}
          >
            {action.badge > 99 ? '99+' : action.badge}
          </Badge>
        )}
      </View>
    ));
  };

  return (
    <Appbar.Header
      elevated={elevated}
      style={{
        backgroundColor: theme.colors.primary,
        elevation: elevated ? theme.elevation.level2 : theme.elevation.level0,
      }}
      testID={testID}
    >
      {renderLeftIcon()}
      <Appbar.Content
        title={title}
        subtitle={subtitle}
        titleStyle={[
          styles.title,
          { color: theme.colors.onPrimary },
        ]}
        subtitleStyle={[
          styles.subtitle,
          { color: theme.colors.onPrimary, opacity: 0.8 },
        ]}
        testID={`${testID}-content`}
      />
      {renderActions()}
    </Appbar.Header>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0.25,
  },
  actionContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
}); 