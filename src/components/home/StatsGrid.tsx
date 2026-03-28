import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../../lib/constants';
import { formatXP } from '../../utils/format';

interface StatsGridProps {
  streak: number;
  totalXP: number;
  level: number;
}

export function StatsGrid({ streak, totalXP, level }: StatsGridProps) {
  const stats = [
    { value: streak.toString(), label: 'Day streak' },
    { value: formatXP(totalXP), label: 'Total XP' },
    { value: `Lv ${level}`, label: 'Beast level' },
  ];

  return (
    <View style={styles.grid}>
      {stats.map((stat) => (
        <View key={stat.label} style={styles.cell}>
          <Text style={styles.value}>{stat.value}</Text>
          <Text style={styles.label}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  cell: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(86,196,196,0.08)',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  value: {
    fontSize: 20,
    fontFamily: FONTS.heading,
    color: COLORS.orange,
  },
  label: {
    fontSize: 9,
    fontFamily: FONTS.body,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
});
