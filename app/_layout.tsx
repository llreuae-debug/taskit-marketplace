import '../global.css';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initializeI18n } from '../src/i18n';
import { isLanguageRTL } from '../src/i18n/languages';
import { useAppStore } from '../src/stores/useAppStore';
import { COLORS } from '../src/theme/tokens';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
    },
  },
});

export default function RootLayout() {
  const theme = useAppStore((s) => s.theme);
  const isDark = theme === 'dark';

  useEffect(() => {
    initializeI18n().then((lang) => {
      useAppStore.setState({
        language: lang,
        isRTL: isLanguageRTL(lang),
      });
    });
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: isDark
                ? COLORS.background.dark
                : COLORS.background.light,
            },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="tasks/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="tasks/create" options={{ headerShown: false }} />
          <Stack.Screen name="tasks/active/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="privacy" options={{ headerShown: false }} />
          <Stack.Screen name="admin/index" options={{ headerShown: false }} />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
