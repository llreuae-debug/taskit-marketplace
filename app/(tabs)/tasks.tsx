import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../src/stores/useAppStore';
import { COLORS } from '../../src/theme/tokens';
import { SurfaceCard } from '../../src/components/ui/SurfaceCard';
import { PillButton } from '../../src/components/ui/PillButton';
import { TaskCard } from '../../src/features/tasks/components/TaskCard';
import { TaskFilterBar } from '../../src/features/tasks/components/TaskFilterBar';
import { TaskMapView } from '../../src/features/tasks/components/TaskMapView';
import {
  TaskItem,
  TaskCategory,
  TaskFilterOptions,
} from '../../src/types/tasks';
import {
  getTaskCategories,
  getTasksFeed,
  acceptTaskAtomic,
} from '../../src/features/tasks/taskService';

export default function TasksTabScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useAppStore((s) => s.theme);
  const isRTL = useAppStore((s) => s.isRTL);
  const profile = useAppStore((s) => s.profile);
  const isDark = theme === 'dark';

  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const [filters, setFilters] = useState<TaskFilterOptions>({
    sortBy: 'newest',
    userCoords: { latitude: 31.5204, longitude: 74.3587 }, // Lahore default
  });

  const textColor = isDark ? COLORS.text.darkPrimary : COLORS.text.lightPrimary;
  const subTextColor = isDark ? COLORS.text.darkSecondary : COLORS.text.lightSecondary;

  const loadData = async () => {
    try {
      const [cats, feed] = await Promise.all([
        getTaskCategories(),
        getTasksFeed(filters),
      ]);
      setCategories(cats);
      setTasks(feed);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Instant Acceptance from Feed Card
  const handleInstantAccept = async (taskId: string) => {
    setAcceptingId(taskId);
    setActionNotice(null);
    try {
      const res = await acceptTaskAtomic(taskId, profile?.id || 'usr_tasker_demo');
      setActionNotice(`⚡ Task accepted! Completion code: ${res.completion_code || '****'}`);
      loadData();
    } catch (err: unknown) {
      setActionNotice(`⚠️ ${err instanceof Error ? err.message : 'Acceptance failed'}`);
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? COLORS.background.dark : COLORS.background.light },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header Bar */}
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View>
            <Text style={[styles.title, { color: textColor }]}>
              {t('home.taskMarketplaceTitle')}
            </Text>
            <Text style={[styles.subtitle, { color: subTextColor }]}>
              Escrow Protected • Atomic Row Locking • Real-Time
            </Text>
          </View>
          <PillButton
            label="+ Post Task ⚡"
            variant="primary"
            onPress={() => router.push('/tasks/create')}
            style={styles.postCta}
            textStyle={{ fontSize: 13 }}
          />
        </View>

        {actionNotice && (
          <SurfaceCard accentBorder="lime" style={{ padding: 12 }}>
            <Text style={{ color: COLORS.lime.DEFAULT, fontWeight: '800' }}>
              {actionNotice}
            </Text>
          </SurfaceCard>
        )}

        {/* Filter Bar (Search, 14 Categories, Filter Dialog, List/Map Switch) */}
        <TaskFilterBar
          categories={categories}
          filters={filters}
          onFilterChange={(newF) => setFilters(newF)}
          viewMode={viewMode}
          onToggleViewMode={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
        />

        {/* View Mode: Map View vs List View */}
        {viewMode === 'map' ? (
          <TaskMapView tasks={tasks} />
        ) : (
          <View style={styles.taskList}>
            {loading ? (
              <SurfaceCard style={{ padding: 24, alignItems: 'center' }}>
                <Text style={{ color: subTextColor }}>Loading verified tasks feed...</Text>
              </SurfaceCard>
            ) : tasks.length === 0 ? (
              <SurfaceCard style={{ padding: 24, alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 32 }}>🔍</Text>
                <Text style={{ color: textColor, fontWeight: '800', fontSize: 16 }}>
                  No tasks found matching your filters
                </Text>
                <PillButton
                  label="Clear Filters"
                  variant="outline"
                  onPress={() => setFilters({ sortBy: 'newest' })}
                />
              </SurfaceCard>
            ) : (
              tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onInstantAccept={handleInstantAccept}
                  accepting={acceptingId === task.id}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, gap: 14 },
  headerRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  title: { fontSize: 24, fontWeight: '900' },
  subtitle: { fontSize: 13, fontWeight: '600' },
  postCta: {
    minHeight: 38,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  taskList: {
    gap: 2,
    marginTop: 4,
  },
});
