import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '../../theme/tokens';
import { useAppStore } from '../../stores/useAppStore';

interface SurfaceCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  accentBorder?: 'violet' | 'lime' | 'coral' | 'none';
}

export const SurfaceCard: React.FC<SurfaceCardProps> = ({
  children,
  style,
  accentBorder = 'none',
}) => {
  const theme = useAppStore((s) => s.theme);
  const isDark = theme === 'dark';

  const getBorderColor = () => {
    switch (accentBorder) {
      case 'violet':
        return COLORS.primary.DEFAULT;
      case 'lime':
        return COLORS.lime.DEFAULT;
      case 'coral':
        return COLORS.coral.DEFAULT;
      default:
        return isDark ? COLORS.background.darkBorder : COLORS.background.lightBorder;
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark
            ? COLORS.background.darkElevated
            : COLORS.background.lightElevated,
          borderColor: getBorderColor(),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
});
