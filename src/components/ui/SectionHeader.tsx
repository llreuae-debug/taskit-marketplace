import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '../../theme/tokens';
import { useAppStore } from '../../stores/useAppStore';

interface SectionHeaderProps {
  label: string;
  blurb?: string;
  highlightColor?: string;
  labelColor?: string;
  style?: ViewStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  label,
  blurb,
  highlightColor = COLORS.lime.DEFAULT,
  labelColor = COLORS.ink.DEFAULT,
  style,
}) => {
  const isDark = useAppStore((s) => s.theme === 'dark');
  const isRTL = useAppStore((s) => s.isRTL);

  return (
    <View
      style={[
        styles.container,
        { flexDirection: isRTL ? 'row-reverse' : 'row' },
        style,
      ]}
    >
      <View style={[styles.badge, { backgroundColor: highlightColor }]}>
        <Text style={[styles.badgeText, { color: labelColor }]}>{label}</Text>
      </View>

      {blurb ? (
        <Text
          style={[
            styles.blurb,
            {
              color: isDark ? COLORS.text.darkSecondary : COLORS.muted,
              textAlign: isRTL ? 'right' : 'left',
            },
          ]}
        >
          {blurb}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 36,
    flexWrap: 'wrap',
    marginBottom: 40,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 32,
    fontWeight: '800',
    fontFamily: 'SpaceGrotesk',
    letterSpacing: -0.5,
  },
  blurb: {
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 580,
    fontWeight: '500',
  },
});
