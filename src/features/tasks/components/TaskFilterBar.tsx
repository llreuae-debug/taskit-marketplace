import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Modal,
  StyleSheet,
} from 'react-native';
import { TaskCategory, TaskFilterOptions } from '../../../types/tasks';
import { COLORS, TYPOGRAPHY } from '../../../theme/tokens';
import { useAppStore } from '../../../stores/useAppStore';
import { PillButton } from '../../../components/ui/PillButton';

interface TaskFilterBarProps {
  categories: TaskCategory[];
  filters: TaskFilterOptions;
  onFilterChange: (newFilters: TaskFilterOptions) => void;
  viewMode: 'list' | 'map';
  onToggleViewMode: () => void;
}

export const TaskFilterBar: React.FC<TaskFilterBarProps> = ({
  categories,
  filters,
  onFilterChange,
  viewMode,
  onToggleViewMode,
}) => {
  const theme = useAppStore((s) => s.theme);
  const isRTL = useAppStore((s) => s.isRTL);
  const language = useAppStore((s) => s.language);
  const isDark = theme === 'dark';

  const [modalVisible, setModalVisible] = useState(false);
  const [minPrice, setMinPrice] = useState(filters.minPrice?.toString() || '');
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice?.toString() || '');
  const [sortBy, setSortBy] = useState(filters.sortBy || 'newest');

  const textColor = isDark ? COLORS.text.darkPrimary : COLORS.text.lightPrimary;
  const subTextColor = isDark ? COLORS.text.darkSecondary : COLORS.text.lightSecondary;
  const borderColor = isDark ? COLORS.background.darkBorder : COLORS.background.lightBorder;

  const handleApplyModalFilters = () => {
    onFilterChange({
      ...filters,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      sortBy: sortBy as TaskFilterOptions['sortBy'],
    });
    setModalVisible(false);
  };

  const handleClearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
    onFilterChange({
      searchQuery: filters.searchQuery,
      categoryId: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      sortBy: 'newest',
    });
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Search Input & Mode Toggles */}
      <View style={[styles.searchRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: isDark ? COLORS.background.darkElevated : '#FFFFFF',
              borderColor,
              flexDirection: isRTL ? 'row-reverse' : 'row',
            },
          ]}
        >
          <Text style={{ fontSize: 16 }}>🔍</Text>
          <TextInput
            value={filters.searchQuery || ''}
            onChangeText={(txt) => onFilterChange({ ...filters, searchQuery: txt })}
            placeholder="Search tasks (e.g. Car parts, AC, Courier)..."
            placeholderTextColor={subTextColor}
            style={[styles.searchInput, { color: textColor, textAlign: isRTL ? 'right' : 'left' }]}
          />
          {filters.searchQuery ? (
            <Pressable onPress={() => onFilterChange({ ...filters, searchQuery: '' })}>
              <Text style={{ color: subTextColor, fontSize: 16 }}>✕</Text>
            </Pressable>
          ) : null}
        </View>

        {/* View Toggle (List vs Map) */}
        <Pressable
          onPress={onToggleViewMode}
          accessibilityRole="button"
          accessibilityLabel="Toggle Map or List View"
          style={[
            styles.iconBtn,
            {
              backgroundColor: isDark ? COLORS.background.darkElevated : '#FFFFFF',
              borderColor,
            },
          ]}
        >
          <Text style={{ fontSize: 18 }}>{viewMode === 'list' ? '🗺️' : '📋'}</Text>
        </Pressable>

        {/* Filter Dialog Trigger */}
        <Pressable
          onPress={() => setModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Filter Options"
          style={[
            styles.iconBtn,
            {
              backgroundColor:
                filters.minPrice || filters.maxPrice || filters.sortBy !== 'newest'
                  ? COLORS.primary.subtle
                  : isDark
                  ? COLORS.background.darkElevated
                  : '#FFFFFF',
              borderColor:
                filters.minPrice || filters.maxPrice
                  ? COLORS.primary.DEFAULT
                  : borderColor,
            },
          ]}
        >
          <Text style={{ fontSize: 18 }}>⚙️</Text>
        </Pressable>
      </View>

      {/* Horizontal Category Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.chipScroll,
          { flexDirection: isRTL ? 'row-reverse' : 'row' },
        ]}
      >
        <Pressable
          onPress={() => onFilterChange({ ...filters, categoryId: undefined })}
          style={[
            styles.chip,
            {
              backgroundColor: !filters.categoryId
                ? COLORS.primary.DEFAULT
                : isDark
                ? COLORS.background.darkElevated
                : '#FFFFFF',
              borderColor: !filters.categoryId ? COLORS.primary.DEFAULT : borderColor,
            },
          ]}
        >
          <Text
            style={[
              styles.chipText,
              { color: !filters.categoryId ? '#FFFFFF' : textColor },
            ]}
          >
            ⚡ All Categories
          </Text>
        </Pressable>

        {categories.map((cat) => {
          const isSelected = filters.categoryId === cat.id;
          return (
            <Pressable
              key={cat.id}
              onPress={() =>
                onFilterChange({
                  ...filters,
                  categoryId: isSelected ? undefined : cat.id,
                })
              }
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected
                    ? COLORS.primary.DEFAULT
                    : isDark
                    ? COLORS.background.darkElevated
                    : '#FFFFFF',
                  borderColor: isSelected ? COLORS.primary.DEFAULT : borderColor,
                },
              ]}
            >
              <Text style={{ fontSize: 13 }}>{cat.icon}</Text>
              <Text
                style={[
                  styles.chipText,
                  { color: isSelected ? '#FFFFFF' : textColor },
                ]}
              >
                {language === 'ur' ? cat.name_ur : cat.name_en}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: isDark
                  ? COLORS.background.darkElevated
                  : COLORS.background.lightElevated,
                borderColor,
              },
            ]}
          >
            <View style={[styles.modalHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.modalTitle, { color: textColor }]}>
                Filter & Sort Tasks
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Text style={{ color: COLORS.coral.DEFAULT, fontWeight: '700' }}>Close</Text>
              </Pressable>
            </View>

            <Text style={[styles.modalSectionLabel, { color: textColor }]}>Price Range (PKR)</Text>
            <View style={[styles.priceInputRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TextInput
                value={minPrice}
                onChangeText={setMinPrice}
                placeholder="Min (e.g. 500)"
                placeholderTextColor={subTextColor}
                keyboardType="numeric"
                style={[styles.modalInput, { color: textColor, borderColor }]}
              />
              <Text style={{ color: subTextColor, alignSelf: 'center' }}>—</Text>
              <TextInput
                value={maxPrice}
                onChangeText={setMaxPrice}
                placeholder="Max (e.g. 5000)"
                placeholderTextColor={subTextColor}
                keyboardType="numeric"
                style={[styles.modalInput, { color: textColor, borderColor }]}
              />
            </View>

            <Text style={[styles.modalSectionLabel, { color: textColor, marginTop: 14 }]}>
              Sort Tasks By
            </Text>
            <View style={styles.sortOptionGrid}>
              {[
                { id: 'newest' as const, label: '🕒 Recently Added' },
                { id: 'price_asc' as const, label: '💰 Price: Low to High' },
                { id: 'price_desc' as const, label: '💎 Price: High to Low' },
                { id: 'deadline' as const, label: '⏳ Urgent / Nearest Deadline' },
                { id: 'distance' as const, label: '📍 Nearest Distance' },
              ].map((opt) => (
                <Pressable
                  key={opt.id}
                  onPress={() => setSortBy(opt.id)}
                  style={[
                    styles.sortChip,
                    {
                      borderColor: sortBy === opt.id ? COLORS.primary.DEFAULT : borderColor,
                      backgroundColor:
                        sortBy === opt.id ? COLORS.primary.subtle : 'transparent',
                    },
                  ]}
                >
                  <Text style={{ color: textColor, fontWeight: '700', fontSize: 13 }}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={[styles.modalActionRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <PillButton
                label="Reset All"
                variant="outline"
                onPress={handleClearFilters}
                style={{ flex: 1 }}
              />
              <PillButton
                label="Apply Filters"
                variant="primary"
                onPress={handleApplyModalFilters}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  searchRow: {
    alignItems: 'center',
    gap: 8,
  },
  searchBox: {
    flex: 1,
    minHeight: TYPOGRAPHY.minTouchTarget,
    borderWidth: 1,
    borderRadius: 9999,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  iconBtn: {
    minWidth: TYPOGRAPHY.minTouchTarget,
    minHeight: TYPOGRAPHY.minTouchTarget,
    borderWidth: 1,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 9999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  modalHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSectionLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  priceInputRow: {
    gap: 10,
  },
  modalInput: {
    flex: 1,
    minHeight: TYPOGRAPHY.minTouchTarget,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  sortOptionGrid: {
    gap: 8,
  },
  sortChip: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  modalActionRow: {
    gap: 10,
    marginTop: 10,
  },
});
