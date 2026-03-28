import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../../lib/constants';

interface MacroItem {
  label: string;
  value: string;
  progress: number; // 0-1
  color: string;
}

interface MacroGridProps {
  macros: MacroItem[];
}

export function MacroGrid({ macros }: MacroGridProps) {
  return (
    <View style={styles.grid}>
      {macros.map((macro) => (
        <View key={macro.label} style={styles.item}>
          <View style={styles.barBg}>
            <View
              style={[
                styles.barFill,
                {
                  height: `${Math.min(100, macro.progress * 100)}%`,
                  backgroundColor: macro.color,
                },
              ]}
            />
          </View>
          <Text style={styles.label}>{macro.label}</Text>
          <Text style={styles.value}>{macro.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 12,
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  barBg: {
    width: '100%',
    height: 70,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 8,
  },
  label: {
    fontSize: 9,
    fontFamily: FONTS.body,
    color: COLORS.textTertiary,
    marginTop: 4,
  },
  value: {
    fontSize: 11,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.white,
  },
});
