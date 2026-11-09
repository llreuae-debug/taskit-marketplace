import React, { useState } from 'react';
import {
  Pressable,
  View,
  StyleSheet,
  ViewStyle,
  Platform,
} from 'react-native';
import { COLORS, SHADOWS } from '../../theme/tokens';
import { useAppStore } from '../../stores/useAppStore';

export type StickerCardVariant = 'grey' | 'lime' | 'black';

interface StickerCardProps {
  children: React.ReactNode;
  variant?: StickerCardVariant;
  radius?: 'web' | 'mobile';
  style?: ViewStyle;
  onPress?: () => void;
  interactive?: boolean;
}

export const StickerCard: React.FC<StickerCardProps> = ({
  children,
  variant = 'grey',
  radius = 'web',
  style,
  onPress,
  interactive = false,
}) => {
  const isDark = useAppStore((s) => s.theme === 'dark');
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const getBackgroundColor = () => {
    switch (variant) {
      case 'lime':
        return COLORS.lime.DEFAULT;
      case 'black':
        return isDark ? COLORS.ink.light : COLORS.ink.DEFAULT;
      case 'grey':
      default:
        return isDark ? '#1C1D26' : COLORS.greyCard;
    }
  };

  const getBorderColor = () => {
    if (variant === 'black' && isDark) return '#323440';
    return COLORS.ink.border;
  };

  const borderRadius = radius === 'web' ? 45 : 28;

  const shadowStyle = isPressed
    ? SHADOWS.stickerPressed
    : isHovered
    ? SHADOWS.stickerHover
    : SHADOWS.sticker;

  const transformStyle = isPressed
    ? [{ translateY: 3 }]
    : isHovered
    ? [{ translateY: -2 }]
    : [];

  const baseStyle: ViewStyle = {
    backgroundColor: getBackgroundColor(),
    borderRadius,
    borderWidth: 1,
    borderColor: getBorderColor(),
    padding: radius === 'web' ? 36 : 22,
    ...shadowStyle,
    transform: transformStyle,
  };

  if (onPress || interactive) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        // @ts-ignore
        onHoverIn={() => setIsHovered(true)}
        // @ts-ignore
        onHoverOut={() => setIsHovered(false)}
        style={[baseStyle, style]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[baseStyle, style]}>{children}</View>;
};
