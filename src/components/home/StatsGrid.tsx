import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../lib/constants';
import { formatXP } from '../../utils/format';

interface StatsGridProps {
  streak: number;
  totalXP: number;
  level: number;
  onLevelPress?: () => void;
}

export function StatsGrid({ streak, totalXP }: StatsGridProps) {
  return (
    <View style={styles.grid}>
      {/* Day Streak — compact card */}
      <View style={styles.streakCard}>
        <Ionicons name="flame-outline" size={20} color={COLORS.aqua} />
        <Text style={styles.streakValue}>{streak}</Text>
        <Text style={styles.streakLabel}>DAY STREAK</Text>
      </View>

      {/* Total XP — large orange card */}
      <View style={styles.xpCard}>
        <Ionicons name="star" size={22} color="rgba(255,255,255,0.5)" style={styles.xpIcon} />
        <Text style={styles.xpValue}>{formatXP(totalXP)}</Text>
        <Text style={styles.xpLabel}>TOTAL XP EARNED</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  streakCard: {
    flex: 0.4,
    backgroundColor: COLORS.statCardBg,
    borderWidth: 1,
    borderColor: COLORS.statCardBorder,
    borderRadius: 14,
    padding: 14,
    justifyContent: 'center',
  },
  streakValue: {
    fontSize: 28,
    fontFamily: FONTS.heading,
    color: COLORS.white,
    marginTop: 4,
  },
  streakLabel: {
    fontSize: 9,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.textTertiary,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  xpCard: {
    flex: 0.6,
    backgroundColor: COLORS.orange,
    borderRadius: 14,
    padding: 14,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  xpIcon: {
    marginBottom: 2,
  },
  xpValue: {
    fontSize: 34,
    fontFamily: FONTS.heading,
    color: '#FFFFFF',           // Always white on orange bg
  },
  xpLabel: {
    fontSize: 9,
    fontFamily: FONTS.bodySemiBold,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
    marginTop: 2,
  },
});
