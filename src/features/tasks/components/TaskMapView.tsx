import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, DimensionValue } from 'react-native';
import { useRouter } from 'expo-router';
import { TaskItem } from '../../../types/tasks';
import { COLORS } from '../../../theme/tokens';
import { useAppStore } from '../../../stores/useAppStore';
import { SurfaceCard } from '../../../components/ui/SurfaceCard';
import { formatCurrency } from '../../../utils/formatters';

interface TaskMapViewProps {
  tasks: TaskItem[];
  onSelectTask?: (task: TaskItem) => void;
}

export const TaskMapView: React.FC<TaskMapViewProps> = ({ tasks }) => {
  const router = useRouter();
  const theme = useAppStore((s) => s.theme);
  const isDark = theme === 'dark';
  const language = useAppStore((s) => s.language);

  const textColor = isDark ? COLORS.text.darkPrimary : COLORS.text.lightPrimary;
  const subTextColor = isDark ? COLORS.text.darkSecondary : COLORS.text.lightSecondary;

  return (
    <View style={styles.container}>
      {/* Visual Map Representation / Radar Canvas */}
      <View
        style={[
          styles.mapCanvas,
          {
            backgroundColor: isDark ? '#12121A' : '#E8ECF2',
            borderColor: isDark ? COLORS.background.darkBorder : COLORS.background.lightBorder,
          },
        ]}
      >
        <View style={styles.gridOverlay}>
          <Text style={{ color: subTextColor, fontSize: 11, fontWeight: '700' }}>
            📍 RADAR MAP • DISCOVERY MODE
          </Text>
          <Text style={{ color: COLORS.lime.DEFAULT, fontSize: 12, fontWeight: '800' }}>
            {tasks.length} Active Tasks Near You
          </Text>
        </View>

        {/* Scattered Map Pins representing local geospatial tasks */}
        <View style={styles.pinsContainer}>
          {tasks.slice(0, 5).map((task, idx) => {
            const positions: Array<{ top: DimensionValue; left?: DimensionValue; right?: DimensionValue }> = [
              { top: '22%', left: '18%' },
              { top: '38%', right: '14%' },
              { top: '60%', left: '30%' },
              { top: '75%', right: '28%' },
              { top: '48%', left: '62%' },
            ];
            const pos = positions[idx % positions.length];

            return (
              <Pressable
                key={task.id}
                onPress={() => router.push({ pathname: '/tasks/[id]', params: { id: task.id } })}
                style={[styles.pinWrapper, pos]}
              >
                <View style={styles.pinBubble}>
                  <Text style={styles.pinText}>
                    {formatCurrency(task.task_charges, task.currency, language)}
                  </Text>
                </View>
                <View style={styles.pinTip} />
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Horizontal Carousel of Map Selected Tasks */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsScroll}
      >
        {tasks.map((task) => (
          <Pressable
            key={task.id}
            onPress={() => router.push({ pathname: '/tasks/[id]', params: { id: task.id } })}
            style={styles.carouselCard}
          >
            <SurfaceCard accentBorder="violet" style={{ padding: 12, gap: 6 }}>
              <View style={styles.cardHeader}>
                <Text style={{ fontSize: 13 }}>{task.category?.icon || '⚡'}</Text>
                <Text style={[styles.cardPrice, { color: COLORS.lime.DEFAULT }]}>
                  {formatCurrency(task.task_charges, task.currency, language)}
                </Text>
              </View>
              <Text style={[styles.cardTitle, { color: textColor }]} numberOfLines={1}>
                {task.title}
              </Text>
              <Text style={{ fontSize: 11, color: subTextColor }} numberOfLines={1}>
                📍 {task.location_name || task.location_address || 'Online'}
              </Text>
            </SurfaceCard>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  mapCanvas: {
    height: 280,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridOverlay: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 2,
  },
  pinsContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  pinWrapper: {
    position: 'absolute',
    alignItems: 'center',
  },
  pinBubble: {
    backgroundColor: COLORS.primary.DEFAULT,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  pinText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  pinTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.primary.DEFAULT,
  },
  cardsScroll: {
    gap: 12,
    paddingVertical: 4,
  },
  carouselCard: {
    width: 240,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: '900',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
});
