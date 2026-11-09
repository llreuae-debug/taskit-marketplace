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
import {
  PropertyCategory,
  PropertyFilterOptions,
  PropertyListingType,
} from '../../../types/realEstate';
import { COLORS, TYPOGRAPHY } from '../../../theme/tokens';
import { useAppStore } from '../../../stores/useAppStore';
import { PillButton } from '../../../components/ui/PillButton';

interface PropertyFilterBarProps {
  categories: PropertyCategory[];
  filters: PropertyFilterOptions;
  onFilterChange: (newFilters: PropertyFilterOptions) => void;
  viewMode: 'list' | 'grid' | 'map';
  onToggleViewMode: (mode: 'list' | 'grid' | 'map') => void;
  comparisonCount: number;
  onOpenCompare: () => void;
}

const CITIES = ['All Cities', 'Lahore', 'Islamabad', 'Karachi', 'Rawalpindi', 'Peshawar'];

export const PropertyFilterBar: React.FC<PropertyFilterBarProps> = ({
  categories,
  filters,
  onFilterChange,
  viewMode,
  onToggleViewMode,
  comparisonCount,
  onOpenCompare,
}) => {
  const theme = useAppStore((s) => s.theme);
  const isRTL = useAppStore((s) => s.isRTL);
  const language = useAppStore((s) => s.language);
  const isDark = theme === 'dark';

  const [modalVisible, setModalVisible] = useState(false);
  const [minPrice, setMinPrice] = useState(filters.minPrice?.toString() || '');
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice?.toString() || '');
  const [selectedCity, setSelectedCity] = useState(filters.city || 'All Cities');
  const [selectedBeds, setSelectedBeds] = useState<number | undefined>(filters.bedrooms);
  const [verifiedOnly, setVerifiedOnly] = useState(filters.verifiedOnly || false);
  const [sortBy, setSortBy] = useState(filters.sortBy || 'newest');

  const textColor = isDark ? COLORS.text.darkPrimary : COLORS.text.lightPrimary;
  const subTextColor = isDark ? COLORS.text.darkSecondary : COLORS.text.lightSecondary;
  const borderColor = isDark ? COLORS.background.darkBorder : COLORS.background.lightBorder;

  const handleApplyModal = () => {
    onFilterChange({
      ...filters,
      city: selectedCity === 'All Cities' ? undefined : selectedCity,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      bedrooms: selectedBeds,
      verifiedOnly,
      sortBy: sortBy as PropertyFilterOptions['sortBy'],
    });
    setModalVisible(false);
  };

  const handleClear = () => {
    setMinPrice('');
    setMaxPrice('');
    setSelectedCity('All Cities');
    setSelectedBeds(undefined);
    setVerifiedOnly(false);
    setSortBy('newest');
    onFilterChange({
      searchQuery: filters.searchQuery,
      listingType: filters.listingType,
      sortBy: 'newest',
    });
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Search and Action Row */}
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
            placeholder="Search City, Area, DHA, Bahria..."
            placeholderTextColor={subTextColor}
            style={[styles.searchInput, { color: textColor, textAlign: isRTL ? 'right' : 'left' }]}
          />
          {filters.searchQuery ? (
            <Pressable onPress={() => onFilterChange({ ...filters, searchQuery: '' })}>
              <Text style={{ color: subTextColor, fontSize: 16 }}>✕</Text>
            </Pressable>
          ) : null}
        </View>

        {/* View Mode Switcher (List, Grid, Map) */}
        <View style={[styles.viewModeGroup, { borderColor }]}>
          <Pressable
            onPress={() => onToggleViewMode('list')}
            style={[
              styles.viewBtn,
              viewMode === 'list' && { backgroundColor: COLORS.primary.DEFAULT },
            ]}
          >
            <Text style={{ fontSize: 13 }}>📋</Text>
          </Pressable>
          <Pressable
            onPress={() => onToggleViewMode('grid')}
            style={[
              styles.viewBtn,
              viewMode === 'grid' && { backgroundColor: COLORS.primary.DEFAULT },
            ]}
          >
            <Text style={{ fontSize: 13 }}>🔲</Text>
          </Pressable>
          <Pressable
            onPress={() => onToggleViewMode('map')}
            style={[
              styles.viewBtn,
              viewMode === 'map' && { backgroundColor: COLORS.primary.DEFAULT },
            ]}
          >
            <Text style={{ fontSize: 13 }}>🗺️</Text>
          </Pressable>
        </View>

        {/* Filter Dialog Trigger */}
        <Pressable
          onPress={() => setModalVisible(true)}
          style={[
            styles.iconBtn,
            {
              backgroundColor:
                filters.minPrice || filters.maxPrice || filters.city || filters.verifiedOnly
                  ? COLORS.lime.subtle
                  : isDark
                  ? COLORS.background.darkElevated
                  : '#FFFFFF',
              borderColor: filters.verifiedOnly ? COLORS.lime.DEFAULT : borderColor,
            },
          ]}
        >
          <Text style={{ fontSize: 16 }}>⚙️</Text>
        </Pressable>

        {/* Comparison Badge */}
        {comparisonCount > 0 && (
          <Pressable
            onPress={onOpenCompare}
            style={[styles.iconBtn, { backgroundColor: COLORS.lime.DEFAULT, borderColor: COLORS.lime.DEFAULT }]}
          >
            <Text style={{ fontSize: 12, fontWeight: '900', color: '#0F0F14' }}>
              ⚖️ {comparisonCount}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Listing Type Quick Switcher: All | Buy | Rent */}
      <View style={[styles.listingTypeRow, { borderColor }]}>
        {[
          { id: 'all', label: 'All Listings' },
          { id: 'for_sale', label: '🏡 Buy / For Sale' },
          { id: 'for_rent', label: '🔑 Rent / To Let' },
        ].map((lt) => {
          const isSelected = (filters.listingType || 'all') === lt.id;
          return (
            <Pressable
              key={lt.id}
              onPress={() =>
                onFilterChange({
                  ...filters,
                  listingType: lt.id as PropertyListingType | 'all',
                })
              }
              style={[
                styles.typePill,
                isSelected && { backgroundColor: COLORS.lime.DEFAULT },
              ]}
            >
              <Text
                style={[
                  styles.typePillText,
                  { color: isSelected ? '#0F0F14' : subTextColor },
                ]}
              >
                {lt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 15 Real Estate Category Chips Scroller */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.chipScroll, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
      >
        {categories.map((cat) => {
          return (
            <Pressable
              key={cat.id}
              onPress={() =>
                onFilterChange({
                  ...filters,
                  searchQuery: cat.name_en === 'Buy Property' || cat.name_en === 'Rent Property' ? undefined : cat.name_en,
                  listingType: cat.slug === 'rent-property' ? 'for_rent' : cat.slug === 'buy-property' ? 'for_sale' : filters.listingType,
                })
              }
              style={[
                styles.chip,
                {
                  backgroundColor: isDark ? COLORS.background.darkElevated : '#FFFFFF',
                  borderColor,
                },
              ]}
            >
              <Text style={{ fontSize: 13 }}>{cat.icon}</Text>
              <Text style={[styles.chipText, { color: textColor }]}>
                {language === 'ur' ? cat.name_ur : cat.name_en}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Detailed Filter Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: isDark ? COLORS.background.darkElevated : COLORS.background.lightElevated, borderColor }]}>
            <View style={[styles.modalHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Filter Properties</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Text style={{ color: COLORS.coral.DEFAULT, fontWeight: '700' }}>Close</Text>
              </Pressable>
            </View>

            {/* City Selector */}
            <Text style={[styles.modalSectionLabel, { color: textColor }]}>Select City</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {CITIES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setSelectedCity(c)}
                  style={[
                    styles.cityChip,
                    {
                      borderColor: selectedCity === c ? COLORS.lime.DEFAULT : borderColor,
                      backgroundColor: selectedCity === c ? COLORS.lime.subtle : 'transparent',
                    },
                  ]}
                >
                  <Text style={{ color: textColor, fontWeight: '700', fontSize: 13 }}>{c}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Price Range */}
            <Text style={[styles.modalSectionLabel, { color: textColor, marginTop: 8 }]}>Price Range (PKR)</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                value={minPrice}
                onChangeText={setMinPrice}
                placeholder="Min Price"
                placeholderTextColor={subTextColor}
                keyboardType="numeric"
                style={[styles.modalInput, { color: textColor, borderColor }]}
              />
              <TextInput
                value={maxPrice}
                onChangeText={setMaxPrice}
                placeholder="Max Price"
                placeholderTextColor={subTextColor}
                keyboardType="numeric"
                style={[styles.modalInput, { color: textColor, borderColor }]}
              />
            </View>

            {/* Bedrooms Count */}
            <Text style={[styles.modalSectionLabel, { color: textColor, marginTop: 8 }]}>Bedrooms</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[1, 2, 3, 4, 5].map((b) => (
                <Pressable
                  key={b}
                  onPress={() => setSelectedBeds(selectedBeds === b ? undefined : b)}
                  style={[
                    styles.bedChip,
                    {
                      borderColor: selectedBeds === b ? COLORS.lime.DEFAULT : borderColor,
                      backgroundColor: selectedBeds === b ? COLORS.lime.subtle : 'transparent',
                    },
                  ]}
                >
                  <Text style={{ color: textColor, fontWeight: '700', fontSize: 13 }}>{b}+</Text>
                </Pressable>
              ))}
            </View>

            {/* Verified Listings Only Checkbox */}
            <Pressable
              onPress={() => setVerifiedOnly(!verifiedOnly)}
              style={[styles.verifiedCheckbox, { borderColor }]}
            >
              <Text style={{ fontSize: 18 }}>{verifiedOnly ? '☑️' : '⬜'}</Text>
              <Text style={{ color: textColor, fontWeight: '700', fontSize: 13 }}>
                Show Verified Property Listings Only (3-Tier Verified)
              </Text>
            </Pressable>

            {/* Sort By */}
            <Text style={[styles.modalSectionLabel, { color: textColor }]}>Sort By</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {[
                { id: 'newest' as const, label: '🕒 Recently Added' },
                { id: 'price_asc' as const, label: '💰 Price: Low to High' },
                { id: 'price_desc' as const, label: '💎 Price: High to Low' },
                { id: 'size_desc' as const, label: '📐 Largest Area' },
                { id: 'popular' as const, label: '🔥 Most Popular' },
              ].map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => setSortBy(s.id)}
                  style={[
                    styles.sortChip,
                    {
                      borderColor: sortBy === s.id ? COLORS.lime.DEFAULT : borderColor,
                      backgroundColor: sortBy === s.id ? COLORS.lime.subtle : 'transparent',
                    },
                  ]}
                >
                  <Text style={{ color: textColor, fontWeight: '700', fontSize: 12 }}>{s.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Modal Actions */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <PillButton label="Reset" variant="outline" onPress={handleClear} style={{ flex: 1 }} />
              <PillButton label="Apply Filters" variant="lime" onPress={handleApplyModal} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 10 },
  searchRow: { alignItems: 'center', gap: 8 },
  searchBox: {
    flex: 1,
    minHeight: TYPOGRAPHY.minTouchTarget,
    borderWidth: 1,
    borderRadius: 9999,
    paddingHorizontal: 14,
    alignItems: 'center',
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, height: '100%' },
  viewModeGroup: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  viewBtn: {
    width: 32,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtn: {
    minWidth: 40,
    minHeight: 40,
    borderRadius: 9999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listingTypeRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 9999,
    padding: 3,
  },
  typePill: {
    flex: 1,
    minHeight: 34,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typePillText: { fontSize: 12, fontWeight: '800' },
  chipScroll: { gap: 8, paddingVertical: 2 },
  chip: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 9999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipText: { fontSize: 12, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, padding: 20, gap: 10 },
  modalHeader: { justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  modalSectionLabel: { fontSize: 13, fontWeight: '700' },
  cityChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  modalInput: { flex: 1, minHeight: 40, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 13 },
  bedChip: { minWidth: 44, minHeight: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  verifiedCheckbox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderWidth: 1, borderRadius: 12, marginVertical: 4 },
  sortChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
});
