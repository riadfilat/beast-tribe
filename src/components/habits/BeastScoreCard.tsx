import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from '../ui';
import { COLORS, FONTS } from '../../lib/constants';

interface BeastScoreCardProps {
  score: number;
  workoutConsistency: number;
  nutritionConsistency: number;
  stepConsistency: number;
  streakBonus: number;
  eventBonus: number;
  compact?: boolean;
}

const BREAKDOWN_ITEMS = [
  { key: 'workout', label: 'Workouts', icon: 'barbell-outline', color: '#E88F24', weight: '30%' },
  { key: 'nutrition', label: 'Nutrition', icon: 'restaurant-outline', color: '#62B797', weight: '25%' },
  { key: 'steps', label: 'Steps', icon: 'walk-outline', color: '#56C4C4', weight: '25%' },
  { key: 'streak', label: 'Streak', icon: 'flame-outline', color: '#EF8C86', weight: 'bonus' },
  { key: 'events', label: 'Events', icon: 'calendar-outline', color: '#4A9EE0', weight: 'bonus' },
];

export function BeastScoreCard({
  score, workoutConsistency, nutritionConsistency, stepConsistency, streakBonus, eventBonus, compact,
}: BeastScoreCardProps) {
  const values: Record<string, number> = {
    workout: workoutConsistency,
    nutrition: nutritionConsistency,
    steps: stepConsistency,
    streak: streakBonus,
    events: eventBonus,
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>BEAST SCORE</Text>
          <Text style={styles.subtitle}>30-day consistency</Text>
        </View>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreValue}>{score.toFixed(0)}</Text>
        </View>
      </View>

      {!compact && (
        <View style={styles.breakdown}>
          {BREAKDOWN_ITEMS.map((item) => {
            const val = values[item.key] || 0;
            const isBonus = item.weight === 'bonus';
            return (
              <View key={item.key} style={styles.breakdownRow}>
                <View style={styles.breakdownLabelRow}>
                  <Ionicons name={item.icon as any} size={14} color={item.color} />
                  <Text style={styles.breakdownLabel}>{item.label}</Text>
                  <Text style={styles.breakdownWeight}>{item.weight}</Text>
                </View>
                <View style={styles.breakdownBarRow}>
                  <View style={{ flex: 1 }}>
                    <ProgressBar
                      progress={isBonus ? val / (item.key === 'streak' ? 20 : 15) : val / 100}
                      color={item.color}
                      height={3}
                    />
                  </View>
                  <Text style={[styles.breakdownValue, { color: item.color }]}>
                    {isBonus ? `+${val.toFixed(0)}` : `${val.toFixed(0)}%`}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 12,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.white,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 10,
    fontFamily: FONTS.body,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  scoreBadge: {
    backgroundColor: COLORS.orange,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  scoreValue: {
    fontSize: 20,
    fontFamily: FONTS.heading,
    color: COLORS.dark,
  },
  breakdown: {
    marginTop: 16,
    gap: 10,
  },
  breakdownRow: {
    gap: 4,
  },
  breakdownLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  breakdownLabel: {
    fontSize: 11,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.textSecondary,
    flex: 1,
  },
  breakdownWeight: {
    fontSize: 9,
    fontFamily: FONTS.body,
    color: COLORS.textMuted,
  },
  breakdownBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breakdownValue: {
    fontSize: 11,
    fontFamily: FONTS.bodySemiBold,
    width: 36,
    textAlign: 'right',
  },
});
