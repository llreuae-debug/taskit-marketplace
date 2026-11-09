import React, { useState } from 'react';
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS } from '../../theme/tokens';
import { useAppStore } from '../../stores/useAppStore';

interface ArrowLinkProps {
  label?: string;
  onPress?: () => void;
  variant?: 'blackOnLime' | 'limeOnBlack' | 'blackOnWhite' | 'whiteOnBlack';
  textColor?: string;
  style?: ViewStyle;
}

export const ArrowLink: React.FC<ArrowLinkProps> = ({
  label = 'Learn more',
  onPress,
  variant = 'blackOnLime',
  textColor,
  style,
}) => {
  const isRTL = useAppStore((s) => s.isRTL);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const getColors = () => {
    switch (variant) {
      case 'limeOnBlack':
        return {
          circleBg: COLORS.lime.DEFAULT,
          arrowColor: COLORS.ink.DEFAULT,
          labelColor: textColor || '#FFFFFF',
        };
      case 'whiteOnBlack':
        return {
          circleBg: '#FFFFFF',
          arrowColor: COLORS.ink.DEFAULT,
          labelColor: textColor || '#FFFFFF',
        };
      case 'blackOnWhite':
        return {
          circleBg: COLORS.ink.DEFAULT,
          arrowColor: '#FFFFFF',
          labelColor: textColor || COLORS.ink.DEFAULT,
        };
      case 'blackOnLime':
      default:
        return {
          circleBg: COLORS.ink.DEFAULT,
          arrowColor: COLORS.lime.DEFAULT,
          labelColor: textColor || COLORS.ink.DEFAULT,
        };
    }
  };

  const { circleBg, arrowColor, labelColor } = getColors();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      // @ts-ignore
      onHoverIn={() => setIsHovered(true)}
      // @ts-ignore
      onHoverOut={() => setIsHovered(false)}
      style={[
        styles.container,
        { flexDirection: isRTL ? 'row-reverse' : 'row' },
        style,
      ]}
    >
      <View
        style={[
          styles.circle,
          {
            backgroundColor: circleBg,
            transform: isPressed
              ? [{ scale: 0.94 }]
              : isHovered
              ? [{ scale: 1.08 }]
              : [{ scale: 1 }],
          },
        ]}
      >
        <Text style={[styles.arrow, { color: arrowColor }]}>
          {isRTL ? '↖' : '↗'}
        </Text>
      </View>

      {label ? (
        <Text
          style={[
            styles.label,
            {
              color: labelColor,
              textDecorationLine: isHovered ? 'underline' : 'none',
            },
          ]}
        >
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  circle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrow: {
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 22,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
