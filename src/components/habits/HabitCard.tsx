import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, HABIT_COLORS } from '../../lib/constants';

interface HabitCardProps {
  icon: string;
  label: string;
  description: string;
  category: string;
  target: number;
  targetUnit: string;
  frequencyType: string;
  selected: boolean;
  onToggle: () => void;
  onTargetChange?: (newTarget: number) => void;
}

export function HabitCard({
  icon, label, description, category, target, targetUnit, frequencyType,
  selected, onToggle, onTargetChange,
}: HabitCardProps) {
  const color = HABIT_COLORS[category] || COLORS.aqua;
  const freqLabel = frequencyType === 'daily' ? '/day' : frequencyType === 'weekly' ? '/week' : '/month';

  // Show target adjuster for habits with adjustable targets (not steps)
  const showAdjuster = targetUnit === 'days' || targetUnit === 'meals' || targetUnit === 'liters' || targetUnit === 'events';
  const displayTarget = targetUnit === 'steps' ? `${(target / 1000).toFixed(0)}K` : String(target);

  return (
    <TouchableOpacity
      style={[styles.card, selected && { borderColor: color, backgroundColor: `${color}10` }]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        <View style={[styles.checkbox, selected && { backgroundColor: color, borderColor: color }]}>
          {selected && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
        </View>
      </View>

      {selected && showAdjuster && onTargetChange && (
        <View style={styles.adjusterRow}>
          <TouchableOpacity
            style={styles.adjusterBtn}
            onPress={() => onTargetChange(Math.max(1, target - 1))}
            activeOpacity={0.6}
          >
            <Ionicons name="remove" size={16} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={[styles.adjusterValue, { color }]}>
            {displayTarget} {targetUnit}{freqLabel}
          </Text>
          <TouchableOpacity
            style={styles.adjusterBtn}
            onPress={() => onTargetChange(target + 1)}
            activeOpacity={0.6}
          >
            <Ionicons name="add" size={16} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontFamily: FONTS.heading,
    color: COLORS.white,
  },
  description: {
    fontSize: 11,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjusterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  adjusterBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjusterValue: {
    fontSize: 14,
    fontFamily: FONTS.bodySemiBold,
    minWidth: 100,
    textAlign: 'center',
  },
});
