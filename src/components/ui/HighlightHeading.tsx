import React from 'react';
import { View, Text, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { COLORS } from '../../theme/tokens';
import { useAppStore } from '../../stores/useAppStore';

interface HighlightHeadingProps {
  prefix?: string;
  highlight: string;
  suffix?: string;
  size?: 'h1' | 'h2' | 'h3' | 'h4';
  highlightColor?: string;
  highlightTextColor?: string;
  textColor?: string;
  align?: 'left' | 'center' | 'right';
  containerStyle?: ViewStyle;
}

export const HighlightHeading: React.FC<HighlightHeadingProps> = ({
  prefix,
  highlight,
  suffix,
  size = 'h2',
  highlightColor = COLORS.lime.DEFAULT,
  highlightTextColor = COLORS.ink.DEFAULT,
  textColor,
  align = 'left',
  containerStyle,
}) => {
  const isDark = useAppStore((s) => s.theme === 'dark');
  const isRTL = useAppStore((s) => s.isRTL);

  const defaultTextColor = textColor || (isDark ? COLORS.text.darkPrimary : COLORS.ink.DEFAULT);

  const getFontSize = () => {
    switch (size) {
      case 'h1':
        return { fontSize: 44, lineHeight: 52 };
      case 'h2':
        return { fontSize: 32, lineHeight: 40 };
      case 'h3':
        return { fontSize: 24, lineHeight: 32 };
      case 'h4':
      default:
        return { fontSize: 20, lineHeight: 28 };
    }
  };

  const fontStyle = getFontSize();

  return (
    <View
      style={[
        styles.container,
        {
          justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
          flexDirection: isRTL ? 'row-reverse' : 'row',
        },
        containerStyle,
      ]}
    >
      {prefix ? (
        <Text style={[styles.text, fontStyle, { color: defaultTextColor }]}>
          {prefix}{' '}
        </Text>
      ) : null}

      <View
        style={[
          styles.highlightBlock,
          { backgroundColor: highlightColor },
        ]}
      >
        <Text style={[styles.text, fontStyle, { color: highlightTextColor }]}>
          {highlight}
        </Text>
      </View>

      {suffix ? (
        <Text style={[styles.text, fontStyle, { color: defaultTextColor }]}>
          {' '}{suffix}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  text: {
    fontWeight: '800',
    fontFamily: 'SpaceGrotesk',
    letterSpacing: -0.5,
  },
  highlightBlock: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
