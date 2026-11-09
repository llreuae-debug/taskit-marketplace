import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { TaskItem } from '../../../types/tasks';
import { COLORS, TYPOGRAPHY } from '../../../theme/tokens';
import { useAppStore } from '../../../stores/useAppStore';
import { SurfaceCard } from '../../../components/ui/SurfaceCard';
import { PillButton } from '../../../components/ui/PillButton';
import { formatCurrency } from '../../../utils/formatters';

interface TaskCardProps {
  task: TaskItem;
  onInstantAccept?: (taskId: string) => void;
  accepting?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onInstantAccept,
  accepting = false,
}) => {
  const router = useRouter();
  const theme = useAppStore((s) => s.theme);
  const isRTL = useAppStore((s) => s.isRTL);
  const language = useAppStore((s) => s.language);
  const isDark = theme === 'dark';

  const textColor = isDark ? COLORS.text.darkPrimary : COLORS.text.lightPrimary;
  const subTextColor = isDark ? COLORS.text.darkSecondary : COLORS.text.lightSecondary;

  // Deadline calculation
  const deadlineDate = new Date(task.deadline);
  const hoursLeft = Math.max(
    0,
    Math.round((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60))
  );

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/tasks/[id]', params: { id: task.id } })}
      accessibilityRole="button"
      accessibilityLabel={`Task: ${task.title}`}
    >
      <SurfaceCard
        accentBorder={task.task_charges >= 2000 ? 'violet' : 'none'}
        style={styles.card}
      >
        {/* Category & Badge Header */}
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.categoryBadge, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={{ fontSize: 13 }}>{task.category?.icon || '⚡'}</Text>
            <Text style={styles.categoryText}>
              {language === 'ur' ? task.category?.name_ur : task.category?.name_en}
            </Text>
          </View>

          <View style={styles.rewardContainer}>
            <Text style={styles.rewardLabel}>REWARD</Text>
            <Text style={[styles.rewardAmount, { color: COLORS.lime.DEFAULT }]}>
              {formatCurrency(task.task_charges, task.currency, language)}
            </Text>
          </View>
        </View>

        {/* Task Title & Description */}
        <Text
          style={[styles.title, { color: textColor, textAlign: isRTL ? 'right' : 'left' }]}
          numberOfLines={2}
        >
          {task.title}
        </Text>
        <Text
          style={[styles.description, { color: subTextColor, textAlign: isRTL ? 'right' : 'left' }]}
          numberOfLines={2}
        >
          {task.description}
        </Text>

        {/* Location & Metadata Bar */}
        <View style={[styles.metaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={[styles.metaItem, { color: subTextColor }]}>
            📍{' '}
            {task.location_type === 'online'
              ? 'Online / Digital'
              : task.location_name || task.location_address || 'Local Task'}
            {task.distance_km !== undefined ? ` (${task.distance_km} km)` : ''}
          </Text>
          <Text
            style={[
              styles.metaItem,
              { color: hoursLeft <= 2 ? COLORS.coral.DEFAULT : subTextColor, fontWeight: '700' },
            ]}
          >
            ⏳ {hoursLeft}h left
          </Text>
        </View>

        {/* Poster & Action Footer */}
        <View style={[styles.footerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.posterInfo, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.avatarPlaceholder}>
              <Text style={{ fontSize: 13, color: '#FFFFFF', fontWeight: '800' }}>
                {task.poster?.full_name ? task.poster.full_name[0] : 'U'}
              </Text>
            </View>
            <View>
              <Text style={[styles.posterName, { color: textColor }]}>
                {task.poster?.full_name || 'Member'}
              </Text>
              <Text style={{ fontSize: 11, color: COLORS.lime.dark, fontWeight: '700' }}>
                ⭐ {task.poster?.poster_rating || '5.0'} • 🛡️ Verified
              </Text>
            </View>
          </View>

          {task.status === 'open' && (
            <View style={{ minWidth: 120 }}>
              <PillButton
                label={task.acceptance_method === 'instant' ? 'Accept ⚡' : 'View / Offer'}
                variant={task.acceptance_method === 'instant' ? 'primary' : 'outline'}
                loading={accepting}
                onPress={() => {
                  if (task.acceptance_method === 'instant' && onInstantAccept) {
                    onInstantAccept(task.id);
                  } else {
                    router.push({ pathname: '/tasks/[id]', params: { id: task.id } });
                  }
                }}
                style={styles.actionBtn}
                textStyle={{ fontSize: 13 }}
              />
            </View>
          )}
        </View>
      </SurfaceCard>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    gap: 10,
    marginBottom: 12,
  },
  headerRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: COLORS.primary.subtle,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignItems: 'center',
    gap: 6,
  },
  categoryText: {
    color: COLORS.primary.light,
    fontSize: 12,
    fontWeight: '800',
  },
  rewardContainer: {
    alignItems: 'flex-end',
  },
  rewardLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  rewardAmount: {
    fontSize: 18,
    fontWeight: '900',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  metaRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.08)',
    paddingVertical: 8,
  },
  metaItem: {
    fontSize: 12,
    fontWeight: '600',
  },
  footerRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginTop: 2,
  },
  posterInfo: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterName: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionBtn: {
    minHeight: 40,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
});
