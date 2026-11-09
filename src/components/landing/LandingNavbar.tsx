import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../theme/tokens';
import { useAppStore } from '../../stores/useAppStore';
import { SUPPORTED_LANGUAGES, SupportedLanguageCode } from '../../i18n/languages';

interface LandingNavbarProps {
  onNavigateSection?: (sectionId: string) => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({ onNavigateSection }) => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const currentLang = useAppStore((s) => s.language);
  const isRTL = useAppStore((s) => s.isRTL);

  const [langModalVisible, setLangModalVisible] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: t('nav.howItWorks', 'How it works'), id: 'how-it-works', route: '/how-it-works' },
    { label: t('nav.categories', 'Categories'), id: 'categories', route: '/categories' },
    { label: t('nav.safety', 'Safety'), id: 'safety', route: '/safety' },
    { label: t('nav.earn', 'Earn'), id: 'earn', route: '/earn' },
    { label: t('nav.faq', 'FAQ'), id: 'faq', route: '/faq' },
    { label: 'Styleguide', id: 'styleguide', route: '/styleguide' },
  ];

  const handleLinkPress = (link: typeof navLinks[0]) => {
    setMobileMenuOpen(false);
    if (onNavigateSection) {
      onNavigateSection(link.id);
    } else {
      router.push(link.route as any);
    }
  };

  const handleSelectLanguage = (code: SupportedLanguageCode) => {
    i18n.changeLanguage(code);
    useAppStore.setState({
      language: code,
      isRTL: code === 'ur' || code === 'ar' || code === 'fa',
    });
    setLangModalVisible(false);
  };

  const currentLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  return (
    <View style={[styles.navContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      {/* Brand Logo */}
      <Pressable
        onPress={() => router.push('/')}
        style={styles.logoRow}
        accessibilityRole="button"
        accessibilityLabel="TaskIt Home"
      >
        <View style={styles.boltBadge}>
          <Text style={styles.boltIcon}>⚡</Text>
        </View>
        <Text style={styles.brandText}>TASKIT</Text>
      </Pressable>

      {/* Desktop Navigation Links */}
      {isDesktop ? (
        <View style={[styles.navLinksRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {navLinks.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => handleLinkPress(item)}
              style={({ pressed }) => [
                styles.navItem,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.navItemText}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {/* Right Controls: Language, Theme, Launch CTA */}
      <View style={[styles.actionsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {/* Language Switcher Pill */}
        <Pressable
          onPress={() => setLangModalVisible(true)}
          style={styles.langPill}
          accessibilityLabel="Change Language"
        >
          <Text style={styles.langFlag}>{currentLangObj.flag}</Text>
          <Text style={styles.langLabel}>
            {isDesktop ? currentLangObj.name : currentLangObj.code.toUpperCase()}
          </Text>
          <Text style={styles.langChevron}>▾</Text>
        </Pressable>

        {/* Theme Toggle */}
        <Pressable
          onPress={toggleTheme}
          style={styles.themeBtn}
          accessibilityLabel="Toggle Theme"
        >
          <Text style={styles.themeBtnIcon}>{theme === 'dark' ? '☀️' : '🌙'}</Text>
        </Pressable>

        {/* Main "Get the App / Launch" Button */}
        {isDesktop ? (
          <Pressable
            onPress={() => router.push('/(tabs)')}
            style={({ pressed }) => [
              styles.launchBtn,
              pressed && styles.launchBtnPressed,
            ]}
          >
            <Text style={styles.launchBtnText}>
              {t('common.launchApp', 'Launch App')} ⚡
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={styles.burgerBtn}
            accessibilityLabel="Open Navigation Menu"
          >
            <Text style={styles.burgerIcon}>{mobileMenuOpen ? '✕' : '☰'}</Text>
          </Pressable>
        )}
      </View>

      {/* Mobile Drawer Dropdown */}
      {!isDesktop && mobileMenuOpen && (
        <View style={styles.mobileDrawer}>
          {navLinks.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => handleLinkPress(item)}
              style={styles.mobileNavItem}
            >
              <Text style={styles.mobileNavText}>{item.label}</Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => {
              setMobileMenuOpen(false);
              router.push('/(tabs)');
            }}
            style={styles.mobileLaunchBtn}
          >
            <Text style={styles.mobileLaunchText}>
              {t('common.launchApp', 'Launch App')} ⚡
            </Text>
          </Pressable>
        </View>
      )}

      {/* 15-Language Selection Modal */}
      <Modal
        visible={langModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLangModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setLangModalVisible(false)}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Language (15 Supported)</Text>
              <Pressable onPress={() => setLangModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = lang.code === currentLang;
                return (
                  <Pressable
                    key={lang.code}
                    onPress={() => handleSelectLanguage(lang.code)}
                    style={[
                      styles.langOption,
                      isSelected && styles.langOptionSelected,
                    ]}
                  >
                    <Text style={styles.langOptionFlag}>{lang.flag}</Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.langOptionName,
                          isSelected && styles.langOptionNameSelected,
                        ]}
                      >
                        {lang.name}
                      </Text>
                      <Text style={styles.langOptionLocal}>{lang.nativeName}</Text>
                    </View>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    maxWidth: 1240,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 50,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  boltBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.lime.DEFAULT,
    borderWidth: 1.5,
    borderColor: COLORS.ink.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.ink.DEFAULT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  boltIcon: {
    fontSize: 18,
  },
  brandText: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.ink.DEFAULT,
    letterSpacing: -0.5,
  },
  navLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28,
  },
  navItem: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  navItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.ink.DEFAULT,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.ink.DEFAULT,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    shadowColor: COLORS.ink.DEFAULT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  langFlag: {
    fontSize: 14,
  },
  langLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink.DEFAULT,
  },
  langChevron: {
    fontSize: 11,
    color: COLORS.muted,
  },
  themeBtn: {
    width: 38,
    height: 38,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.ink.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.ink.DEFAULT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  themeBtnIcon: {
    fontSize: 16,
  },
  launchBtn: {
    backgroundColor: COLORS.ink.DEFAULT,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.ink.DEFAULT,
    shadowColor: COLORS.ink.DEFAULT,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  launchBtnPressed: {
    transform: [{ translateY: 2 }],
    shadowOffset: { width: 0, height: 1 },
  },
  launchBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  burgerBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.ink.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  burgerIcon: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.ink.DEFAULT,
  },
  mobileDrawer: {
    position: 'absolute',
    top: 72,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: COLORS.ink.DEFAULT,
    borderRadius: 20,
    padding: 16,
    gap: 12,
    shadowColor: COLORS.ink.DEFAULT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
    zIndex: 100,
  },
  mobileNavItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  mobileNavText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.ink.DEFAULT,
  },
  mobileLaunchBtn: {
    backgroundColor: COLORS.lime.DEFAULT,
    borderWidth: 1.5,
    borderColor: COLORS.ink.DEFAULT,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  mobileLaunchText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink.DEFAULT,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 2,
    borderColor: COLORS.ink.DEFAULT,
    padding: 20,
    shadowColor: COLORS.ink.DEFAULT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E4E7',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink.DEFAULT,
  },
  closeBtn: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.muted,
    padding: 4,
  },
  modalList: {
    flexGrow: 0,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  langOptionSelected: {
    backgroundColor: COLORS.lime.subtle,
    borderWidth: 1,
    borderColor: COLORS.lime.dark,
  },
  langOptionFlag: {
    fontSize: 20,
  },
  langOptionName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink.DEFAULT,
  },
  langOptionNameSelected: {
    color: COLORS.ink.DEFAULT,
  },
  langOptionLocal: {
    fontSize: 12,
    color: COLORS.muted,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.ink.DEFAULT,
  },
});
