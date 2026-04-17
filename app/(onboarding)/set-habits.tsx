import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../src/components/ui';
import { StepIndicator } from '../../src/components/onboarding/StepIndicator';
import { HabitCard } from '../../src/components/habits/HabitCard';
import { useSaveHabits, useUserHabits } from '../../src/hooks';
import { COLORS, FONTS, HABIT_DEFINITIONS } from '../../src/lib/constants';

interface HabitSelection {
  key: string;
  selected: boolean;
  target: number;
}

export default function SetHabitsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ frequency?: string; edit?: string }>();
  const isEditMode = params.edit === '1';
  const trainingFreq = parseInt(params.frequency || '4') || 4;
  const { saveHabits, loading: saving } = useSaveHabits();
  const { data: currentHabits } = useUserHabits();

  // Initialize selections — train_weekly pre-selected with user's frequency
  const [habits, setHabits] = useState<HabitSelection[]>(
    HABIT_DEFINITIONS.map(def => ({
      key: def.key,
      selected: def.key === 'train_weekly', // Pre-select training
      target: def.key === 'train_weekly' ? trainingFreq : def.default_target,
    }))
  );

  // In edit mode, pre-load current habits
  useEffect(() => {
    if (isEditMode && currentHabits && currentHabits.length > 0) {
      setHabits(HABIT_DEFINITIONS.map(def => {
        const existing = currentHabits.find((uh: any) => uh.habit_definition?.key === def.key);
        return {
          key: def.key,
          selected: !!existing,
          target: existing?.target ?? def.default_target,
        };
      }));
    }
  }, [isEditMode, currentHabits]);

  function toggleHabit(key: string) {
    setHabits(prev => prev.map(h =>
      h.key === key ? { ...h, selected: !h.selected } : h
    ));
  }

  function updateTarget(key: string, newTarget: number) {
    setHabits(prev => prev.map(h =>
      h.key === key ? { ...h, target: newTarget } : h
    ));
  }

  const selectedCount = habits.filter(h => h.selected).length;

  async function handleContinue() {
    const selectedHabits = habits.filter(h => h.selected).map(h => ({ key: h.key, target: h.target }));
    try {
      await saveHabits(selectedHabits);
    } catch (e) {
      console.warn('Failed to save habits:', e);
    }

    if (isEditMode) {
      router.canGoBack() ? router.back() : router.replace('/(tabs)/profile');
    } else {
      router.push('/(onboarding)/beast-level');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {isEditMode ? (
        <View style={styles.editHeader}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.editHeaderTitle}>Edit Habits</Text>
          <View style={{ width: 22 }} />
        </View>
      ) : (
        <StepIndicator currentStep={3} totalSteps={4} />
      )}
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{isEditMode ? 'Your Beast habits' : 'Build your Beast habits'}</Text>
        <Text style={styles.subtitle}>
          {isEditMode
            ? 'Adjust your habits and targets. Changes take effect immediately.'
            : 'Pick the habits you\'ll commit to. We\'ll track your streak and consistency.'}
        </Text>

        {HABIT_DEFINITIONS.map((def) => {
          const habit = habits.find(h => h.key === def.key)!;
          return (
            <HabitCard
              key={def.key}
              icon={def.icon}
              label={def.label}
              description={def.description}
              category={def.category}
              target={habit.target}
              targetUnit={def.target_unit}
              frequencyType={def.frequency_type}
              selected={habit.selected}
              onToggle={() => toggleHabit(def.key)}
              onTargetChange={(t) => updateTarget(def.key, t)}
            />
          );
        })}

        <View style={styles.bonusCard}>
          <Text style={styles.bonusTitle}>Perfect Day Bonus</Text>
          <Text style={styles.bonusText}>
            Complete all your habits in one day to earn +100 XP bonus!
          </Text>
        </View>

        <Button
          title={saving ? "Saving..." : isEditMode ? "Save Changes" : "Continue"}
          onPress={handleContinue}
          disabled={selectedCount === 0 || saving}
        />

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  editHeaderTitle: {
    fontSize: 16,
    fontFamily: FONTS.heading,
    color: COLORS.white,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontFamily: FONTS.heading,
    color: COLORS.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
    marginBottom: 20,
    lineHeight: 18,
  },
  bonusCard: {
    backgroundColor: 'rgba(232,143,36,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(232,143,36,0.25)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  bonusTitle: {
    fontSize: 14,
    fontFamily: FONTS.heading,
    color: COLORS.orange,
    marginBottom: 4,
  },
  bonusText: {
    fontSize: 11,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});
