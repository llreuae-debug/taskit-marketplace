import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../src/stores/useAppStore';
import { COLORS, TYPOGRAPHY } from '../../src/theme/tokens';
import { SurfaceCard } from '../../src/components/ui/SurfaceCard';
import { PillButton } from '../../src/components/ui/PillButton';

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useAppStore((s) => s.theme);
  const isRTL = useAppStore((s) => s.isRTL);
  const isDark = theme === 'dark';

  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const textColor = isDark ? COLORS.text.darkPrimary : COLORS.text.lightPrimary;
  const subTextColor = isDark ? COLORS.text.darkSecondary : COLORS.text.lightSecondary;

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? COLORS.background.dark : COLORS.background.light },
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.brand, { color: COLORS.primary.DEFAULT }]}>
          {t('brand.name')}
        </Text>
        <Text
          style={[
            styles.title,
            { color: textColor, textAlign: isRTL ? 'right' : 'left' },
          ]}
        >
          {t('auth.loginTitle')}
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: subTextColor, textAlign: isRTL ? 'right' : 'left' },
          ]}
        >
          {t('auth.welcomeSubtitle')}
        </Text>

        <SurfaceCard style={{ gap: 14 }}>
          <Text style={[styles.label, { color: textColor }]}>
            {t('auth.phoneLabel')}
          </Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder={t('auth.phonePlaceholder')}
            placeholderTextColor={subTextColor}
            keyboardType="phone-pad"
            accessibilityLabel={t('auth.phoneLabel')}
            style={[
              styles.input,
              {
                color: textColor,
                borderColor: isDark
                  ? COLORS.background.darkBorder
                  : COLORS.background.lightBorder,
              },
            ]}
          />

          {otpSent && (
            <>
              <Text style={[styles.label, { color: textColor }]}>
                {t('auth.otpLabel')}
              </Text>
              <TextInput
                value={otp}
                onChangeText={setOtp}
                placeholder="123456"
                placeholderTextColor={subTextColor}
                keyboardType="number-pad"
                maxLength={6}
                accessibilityLabel={t('auth.otpLabel')}
                style={[
                  styles.input,
                  {
                    color: textColor,
                    borderColor: isDark
                      ? COLORS.background.darkBorder
                      : COLORS.background.lightBorder,
                  },
                ]}
              />
            </>
          )}

          <PillButton
            label={otpSent ? t('auth.verifyOtp') : t('auth.sendOtp')}
            variant="primary"
            onPress={() => {
              if (!otpSent) {
                setOtpSent(true);
              } else {
                router.replace('/(tabs)');
              }
            }}
          />

          <PillButton
            label={t('auth.guestBrowse')}
            variant="ghost"
            onPress={() => router.replace('/(tabs)')}
          />
        </SurfaceCard>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, gap: 14, justifyContent: 'center', flex: 1 },
  brand: { fontSize: 22, fontWeight: '900' },
  title: { fontSize: 28, fontWeight: '900' },
  subtitle: { fontSize: 15, lineHeight: 22 },
  label: { fontSize: 14, fontWeight: '700' },
  input: {
    minHeight: TYPOGRAPHY.minTouchTarget,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
  },
});
