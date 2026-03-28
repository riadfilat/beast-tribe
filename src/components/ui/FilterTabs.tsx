import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../../lib/constants';

interface FilterTabsProps {
  tabs: string[];
  activeIndex: number;
  onTabPress: (index: number) => void;
  size?: 'small' | 'medium';
}

export function FilterTabs({ tabs, activeIndex, onTabPress, size = 'medium' }: FilterTabsProps) {
  const isSmall = size === 'small';

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {tabs.map((tab, index) => {
        const isActive = index === activeIndex;
        return (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              isActive ? styles.activeTab : styles.inactiveTab,
              {
                paddingHorizontal: isSmall ? 10 : 14,
                paddingVertical: isSmall ? 4 : 6,
              },
            ]}
            onPress={() => onTabPress(index)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                isActive ? styles.activeText : styles.inactiveText,
                { fontSize: isSmall ? 10 : 12 },
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  tab: {
    borderRadius: 16,
  },
  activeTab: {
    backgroundColor: 'rgba(232,143,36,0.15)',
  },
  inactiveTab: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  tabText: {
    fontFamily: FONTS.bodyMedium,
  },
  activeText: {
    color: COLORS.orange,
  },
  inactiveText: {
    color: 'rgba(255,255,255,0.25)',
  },
});
