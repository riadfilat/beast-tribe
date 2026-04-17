import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from '../ui';
import { COLORS, FONTS } from '../../lib/constants';

interface MacroItem {
  label: string;
  current: number;
  goal: number;
  unit: string;
  color: string;
  icon: string;
}

interface MacroGridProps {
  macros: MacroItem[];
}

export function MacroGrid({ macros }: MacroGridProps) {
  return (
    <View style={styles.grid}>
      {macros.map((macro) => {
        const progress = macro.goal > 0 ? Math.min(1, macro.current / macro.goal) : 0;
        return (
          <View key={macro.label} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name={macro.icon as any} size={16} color={macro.color} />
              <Text style={[styles.cardLabel, { color: macro.color }]}>{macro.label.toUpperCase()}</Text>
            </View>
            <Text style={styles.cardValue}>
              {Math.round(macro.current)}<Text style={styles.cardGoal}> / {macro.goal}{macro.unit}</Text>
            </Text>
            <ProgressBar progress={progress} color={macro.color} height={3} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: 12,
  },
  card: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: 9,
    fontFamily: FONTS.bodySemiBold,
    letterSpacing: 1,
  },
  cardValue: {
    fontSize: 24,
    fontFamily: FONTS.heading,
    color: COLORS.white,
    marginBottom: 10,
  },
  cardGoal: {
    fontSize: 13,
    fontFamily: FONTS.body,
    color: COLORS.textTertiary,
  },
});
