import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProgressBar } from '../ui';
import { COLORS, FONTS } from '../../lib/constants';

interface DailyGoalCardProps {
  currentSteps: number;
  goalSteps: number;
  xpReward: number;
}

export function DailyGoalCard({ currentSteps, goalSteps, xpReward }: DailyGoalCardProps) {
  const progress = goalSteps > 0 ? currentSteps / goalSteps : 0;
  const pct = Math.round(progress * 100);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>Daily goal</Text>
        <Text style={styles.pct}>{pct}%</Text>
      </View>
      <ProgressBar progress={progress} color={COLORS.green} />
      <View style={styles.footer}>
        <Text style={styles.detail}>
          {currentSteps.toLocaleString()} / {goalSteps.toLocaleString()} steps
        </Text>
        <Text style={styles.xp}>+{xpReward} XP</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
  },
  pct: {
    fontSize: 11,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.green,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  detail: {
    fontSize: 9,
    fontFamily: FONTS.body,
    color: COLORS.textTertiary,
  },
  xp: {
    fontSize: 9,
    fontFamily: FONTS.body,
    color: COLORS.textTertiary,
  },
});
