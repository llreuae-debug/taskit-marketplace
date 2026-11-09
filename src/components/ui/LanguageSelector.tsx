import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, LanguageMetadata } from '../../i18n/languages';
import { useAppStore } from '../../stores/useAppStore';
import { COLORS, TYPOGRAPHY } from '../../theme/tokens';

export const LanguageSelector: React.FC = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const theme = useAppStore((s) => s.theme);
  const isRTL = useAppStore((s) => s.isRTL);
  const isDark = theme === 'dark';

  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  const handleSelect = async (item: LanguageMetadata) => {
    await setLanguage(item.code);
    setVisible(false);
  };

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={`${t('common.switchLanguage')}: ${currentLang.nativeName}`}
        style={[
          styles.trigger,
          {
            backgroundColor: isDark
              ? COLORS.background.darkElevated
              : COLORS.background.lightElevated,
            borderColor: isDark
              ? COLORS.background.darkBorder
              : COLORS.background.lightBorder,
            flexDirection: isRTL ? 'row-reverse' : 'row',
          },
        ]}
      >
        <Text style={styles.flag}>{currentLang.flag}</Text>
        <Text
          style={[
            styles.triggerText,
            { color: isDark ? COLORS.text.darkPrimary : COLORS.text.lightPrimary },
          ]}
        >
          {currentLang.nativeName}
        </Text>
      </Pressable>

      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.backdrop}>
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: isDark
                  ? COLORS.background.darkElevated
                  : COLORS.background.lightElevated,
                borderColor: isDark
                  ? COLORS.background.darkBorder
                  : COLORS.background.lightBorder,
              },
            ]}
          >
            <View
              style={[
                styles.sheetHeader,
                { flexDirection: isRTL ? 'row-reverse' : 'row' },
              ]}
            >
              <Text
                style={[
                  styles.sheetTitle,
                  { color: isDark ? COLORS.text.darkPrimary : COLORS.text.lightPrimary },
                ]}
              >
                {t('common.switchLanguage')} (15)
              </Text>
              <Pressable
                onPress={() => setVisible(false)}
                accessibilityRole="button"
                style={styles.closeBtn}
              >
                <Text style={{ color: COLORS.coral.DEFAULT, fontWeight: '700' }}>
                  {t('common.cancel')}
                </Text>
              </Pressable>
            </View>

            <FlatList
              data={SUPPORTED_LANGUAGES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => {
                const selected = item.code === language;
                return (
                  <Pressable
                    onPress={() => handleSelect(item)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={[
                      styles.langRow,
                      {
                        backgroundColor: selected
                          ? COLORS.primary.subtle
                          : 'transparent',
                        borderColor: selected
                          ? COLORS.primary.DEFAULT
                          : 'transparent',
                        flexDirection: isRTL ? 'row-reverse' : 'row',
                      },
                    ]}
                  >
                    <View
                      style={{
                        flexDirection: isRTL ? 'row-reverse' : 'row',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <Text style={{ fontSize: 22 }}>{item.flag}</Text>
                      <View>
                        <Text
                          style={[
                            styles.nativeName,
                            {
                              color: isDark
                                ? COLORS.text.darkPrimary
                                : COLORS.text.lightPrimary,
                            },
                          ]}
                        >
                          {item.nativeName}
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            color: isDark
                              ? COLORS.text.darkSecondary
                              : COLORS.text.lightSecondary,
                          }}
                        >
                          {item.name} {item.isRTL ? '• RTL' : ''}
                        </Text>
                      </View>
                    </View>
                    {selected && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>✓</Text>
                      </View>
                    )}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    minHeight: TYPOGRAPHY.minTouchTarget,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  flag: {
    fontSize: 18,
  },
  triggerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '80%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  sheetHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    minHeight: TYPOGRAPHY.minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  langRow: {
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  nativeName: {
    fontSize: 16,
    fontWeight: '700',
  },
  activeBadge: {
    backgroundColor: COLORS.primary.DEFAULT,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});
