import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS, TYPOGRAPHY } from '../../theme/tokens';
import { useAppStore } from '../../stores/useAppStore';

export type ButtonVariant = 'primary' | 'lime' | 'coral' | 'outline' | 'ghost';

interface PillButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  accessibilityLabel?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const PillButton: React.FC<PillButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  accessibilityLabel,
  style,
  textStyle,
}) => {
  const isRTL = useAppStore((s) => s.isRTL);
  const theme = useAppStore((s) => s.theme);
  const isDark = theme === 'dark';

  const getBackgroundColor = () => {
    if (disabled) return isDark ? '#272736' : '#E5E7EB';
    switch (variant) {
      case 'primary':
        return COLORS.primary.DEFAULT;
      case 'lime':
        return COLORS.lime.DEFAULT;
      case 'coral':
        return COLORS.coral.DEFAULT;
      case 'outline':
      case 'ghost':
        return 'transparent';
    }
  };

  const getTextColor = () => {
    if (disabled) return '#9CA3AF';
    switch (variant) {
      case 'lime':
        return '#0F0F14';
      case 'primary':
      case 'coral':
        return '#FFFFFF';
      case 'outline':
      case 'ghost':
        return isDark ? '#F9FAFB' : '#111827';
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderColor:
            variant === 'outline'
              ? isDark
                ? COLORS.primary.light
                : COLORS.primary.DEFAULT
              : 'transparent',
          opacity: pressed ? 0.88 : 1,
          flexDirection: isRTL ? 'row-reverse' : 'row',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.label,
              {
                color: getTextColor(),
                marginLeft: icon && !isRTL ? 8 : 0,
                marginRight: icon && isRTL ? 8 : 0,
              },
              textStyle,
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: TYPOGRAPHY.minTouchTarget,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
