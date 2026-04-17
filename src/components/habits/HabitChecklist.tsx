import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HabitRing } from './HabitRing';
import { COLORS, FONTS, HABIT_COLORS } from '../../lib/constants';

interface HabitItem {
  id: string;
  icon: string;
  label: string;
  current: number;
  target: number;
  category: string;
  completed: boolean;
}

interface HabitChecklistProps {
  habits: HabitItem[];
  onHabitPress?: (habitId: string) => void;
  isPerfectDay?: boolean;
}

export function HabitChecklist({ habits, onHabitPress, isPerfectDay }: HabitChecklistProps) {
  if (habits.length === 0) return null;

  const completedCount = habits.filter(h => h.completed).length;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>TODAY'S HABITS</Text>
        <Text style={[styles.counter, isPerfectDay && styles.counterComplete]}>
          {completedCount}/{habits.length}
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ringRow}>
        {habits.map((habit) => (
          <HabitRing
            key={habit.id}
            icon={habit.icon}
            label={habit.label}
            current={habit.current}
            target={habit.target}
            color={HABIT_COLORS[habit.category] || COLORS.aqua}
            completed={habit.completed}
            onPress={onHabitPress ? () => onHabitPress(habit.id) : undefined}
          />
        ))}
      </ScrollView>

      {isPerfectDay && (
        <View style={styles.perfectDayBanner}>
          <Ionicons name="star" size={14} color={COLORS.orange} />
          <Text style={styles.perfectDayText}>PERFECT DAY! +100 XP</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 11,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  counter: {
    fontSize: 11,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.textTertiary,
  },
  counterComplete: {
    color: COLORS.orange,
  },
  ringRow: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 16,
  },
  perfectDayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: 'rgba(232,143,36,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(232,143,36,0.25)',
    borderRadius: 10,
    paddingVertical: 8,
  },
  perfectDayText: {
    fontSize: 11,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.orange,
    letterSpacing: 0.5,
  },
});
