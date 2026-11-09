import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { COLORS, SHADOWS } from '../../theme/tokens';
import { useAppStore } from '../../stores/useAppStore';

export interface AccordionItem {
  number: string; // e.g. "01"
  title: string;
  content: string;
}

interface AccordionProps {
  items: AccordionItem[];
  defaultOpenIndex?: number;
  style?: ViewStyle;
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  defaultOpenIndex = 0,
  style,
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpenIndex);
  const isDark = useAppStore((s) => s.theme === 'dark');
  const isRTL = useAppStore((s) => s.isRTL);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <View style={[styles.container, style]}>
      {items.map((item, idx) => {
        const isOpen = openIndex === idx;

        const bgColor = isOpen
          ? COLORS.lime.DEFAULT
          : isDark
          ? COLORS.ink.light
          : COLORS.greyCard;

        const textColor = isOpen ? COLORS.ink.DEFAULT : isDark ? '#FFFFFF' : COLORS.ink.DEFAULT;
        const subTextColor = isOpen ? COLORS.ink.DEFAULT : isDark ? COLORS.text.darkSecondary : COLORS.muted;

        return (
          <View
            key={item.number}
            style={[
              styles.itemCard,
              {
                backgroundColor: bgColor,
                borderColor: COLORS.ink.border,
                ...SHADOWS.sticker,
              },
            ]}
          >
            <Pressable
              onPress={() => toggle(idx)}
              style={[
                styles.headerRow,
                { flexDirection: isRTL ? 'row-reverse' : 'row' },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${item.number} ${item.title}`}
            >
              <View
                style={[
                  styles.titleGroup,
                  { flexDirection: isRTL ? 'row-reverse' : 'row' },
                ]}
              >
                <Text style={[styles.numberText, { color: textColor }]}>
                  {item.number}
                </Text>
                <Text style={[styles.titleText, { color: textColor }]}>
                  {item.title}
                </Text>
              </View>

              <View
                style={[
                  styles.toggleBtn,
                  {
                    backgroundColor: isOpen ? '#FFFFFF' : isDark ? '#2B2C38' : '#FFFFFF',
                    borderColor: COLORS.ink.border,
                  },
                ]}
              >
                <Text style={styles.toggleIcon}>{isOpen ? '—' : '+'}</Text>
              </View>
            </Pressable>

            {isOpen && (
              <View style={styles.bodyContainer}>
                <View style={styles.divider} />
                <Text
                  style={[
                    styles.contentText,
                    { color: subTextColor, textAlign: isRTL ? 'right' : 'left' },
                  ]}
                >
                  {item.content}
                </Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 20,
    width: '100%',
  },
  itemCard: {
    borderRadius: 36,
    borderWidth: 1,
    paddingHorizontal: 36,
    paddingVertical: 28,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    flex: 1,
  },
  numberText: {
    fontSize: 36,
    fontWeight: '900',
    fontFamily: 'SpaceGrotesk',
  },
  titleText: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk',
    flex: 1,
    letterSpacing: -0.3,
  },
  toggleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleIcon: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.ink.DEFAULT,
    lineHeight: 26,
  },
  bodyContainer: {
    marginTop: 20,
    gap: 16,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.ink.border,
    width: '100%',
  },
  contentText: {
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '500',
  },
});
