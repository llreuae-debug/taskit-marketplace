import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../stores/useAppStore';
import { COLORS, TYPOGRAPHY } from '../../theme/tokens';

export const MarketplaceSwitcher: React.FC = () => {
  const { t } = useTranslation();
  const activeMarketplace = useAppStore((s) => s.activeMarketplace);
  const setActiveMarketplace = useAppStore((s) => s.setActiveMarketplace);
  const theme = useAppStore((s) => s.theme);
  const isRTL = useAppStore((s) => s.isRTL);
  const isDark = theme === 'dark';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark
            ? COLORS.background.darkElevated
            : '#EFEFF5',
          borderColor: isDark
            ? COLORS.background.darkBorder
            : COLORS.background.lightBorder,
          flexDirection: isRTL ? 'row-reverse' : 'row',
        },
      ]}
    >
      <Pressable
        onPress={() => setActiveMarketplace('tasks')}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeMarketplace === 'tasks' }}
        style={[
          styles.tab,
          activeMarketplace === 'tasks' && {
            backgroundColor: COLORS.primary.DEFAULT,
          },
        ]}
      >
        <Text
          style={[
            styles.tabText,
            {
              color:
                activeMarketplace === 'tasks'
                  ? '#FFFFFF'
                  : isDark
                  ? COLORS.text.darkSecondary
                  : COLORS.text.lightSecondary,
            },
          ]}
        >
          {t('home.taskMarketplaceTitle')}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => setActiveMarketplace('real_estate')}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeMarketplace === 'real_estate' }}
        style={[
          styles.tab,
          activeMarketplace === 'real_estate' && {
            backgroundColor: COLORS.lime.DEFAULT,
          },
        ]}
      >
        <Text
          style={[
            styles.tabText,
            {
              color:
                activeMarketplace === 'real_estate'
                  ? '#0F0F14'
                  : isDark
                  ? COLORS.text.darkSecondary
                  : COLORS.text.lightSecondary,
            },
          ]}
        >
          {t('home.realEstateTitle')}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 9999,
    borderWidth: 1,
    padding: 4,
    marginVertical: 12,
  },
  tab: {
    flex: 1,
    minHeight: TYPOGRAPHY.minTouchTarget,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
