import React from 'react';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import { useAppStore } from '../../src/stores/useAppStore';
import { COLORS } from '../../src/theme/tokens';

export default function TabsLayout() {
  const { t } = useTranslation();
  const theme = useAppStore((s) => s.theme);
  const isDark = theme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark
            ? COLORS.background.darkElevated
            : COLORS.background.lightElevated,
          borderTopColor: isDark
            ? COLORS.background.darkBorder
            : COLORS.background.lightBorder,
          height: 68,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: COLORS.primary.DEFAULT,
        tabBarInactiveTintColor: isDark
          ? COLORS.text.darkSecondary
          : COLORS.text.lightSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav.home'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>⚡</Text>,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: t('nav.tasks'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>🛠️</Text>,
        }}
      />
      <Tabs.Screen
        name="real-estate"
        options={{
          title: t('nav.realEstate'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>🏡</Text>,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: t('nav.create'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>➕</Text>,
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: t('nav.chats'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>💬</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('nav.profile'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}
