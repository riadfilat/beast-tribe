import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/ui';
import { StepIndicator } from '../../src/components/onboarding/StepIndicator';
import { useGoalTemplates, useSaveGoals } from '../../src/hooks';
import { COLORS, FONTS, GOAL_TEMPLATES, SPORTS } from '../../src/lib/constants';

interface GoalItem {
  id: string;
  sportName: string;
  sportEmoji: string;
  sportId: string;
  title: string;
  suggestedMonths: number;
  difficulty: string;
  selected: boolean;
}

// Fallback goals if no templates loaded (demo mode)
const FALLBACK_GOALS: GoalItem[] = [
  { id: 'f1', sportName: 'Running', sportEmoji: '🏃', sportId: '', title: 'Run a sub-30 min 5K', suggestedMonths: 3, difficulty: 'beginner', selected: true },
  { id: 'f2', sportName: 'Gym', sportEmoji: '🏋', sportId: '', title: 'Bench press 80 kg', suggestedMonths: 3, difficulty: 'beginner', selected: true },
  { id: 'f3', sportName: 'Cycling', sportEmoji: '🚴', sportId: '', title: 'Complete a 25 km ride', suggestedMonths: 2, difficulty: 'beginner', selected: false },
];

const SPORT_COLORS: Record<string, string> = {
  Running: COLORS.aqua,
  Gym: COLORS.orange,
  Cycling: COLORS.green,
  CrossFit: COLORS.coral,
  Swimming: COLORS.blueGray,
  Hyrox: COLORS.orange,
  Yoga: COLORS.aqua,
  Pilates: COLORS.coral,
  Walking: COLORS.green,
};

function getTargetDate(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return `By ${d.toLocaleString('en-US', { month: 'long', year: 'numeric' })}`;
}

function getDifficultyLabel(d: string): string {
  if (d === 'beginner') return '🟢';
  if (d === 'intermediate') return '🟡';
  return '🔴';
}

export default function SetGoalsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sports?: string }>();
  const selectedSports = params.sports ? params.sports.split(',') : [];

  const { data: templates } = useGoalTemplates(selectedSports);
  const { saveGoals, loading: saving } = useSaveGoals();
  const [goals, setGoals] = useState<GoalItem[]>([]);

  // Build goal list from templates (Supabase) or local constants (demo)
  useEffect(() => {
    if (templates && templates.length > 0) {
      const items: GoalItem[] = templates.map((t: any, i: number) => ({
        id: t.id || `t${i}`,
        sportName: t.sport?.name || 'General',
        sportEmoji: t.sport?.emoji || '🏆',
        sportId: t.sport?.id || '',
        title: t.title,
        suggestedMonths: t.suggested_months || 3,
        difficulty: t.difficulty || 'beginner',
        selected: i < 3,
      }));
      setGoals(items);
    } else if (goals.length === 0) {
      // Fallback: build from local GOAL_TEMPLATES based on selected sports
      const sportsToUse = selectedSports.length > 0 ? selectedSports : ['running', 'gym', 'cycling'];
      const items: GoalItem[] = [];
      let idx = 0;
      for (const sportId of sportsToUse) {
        const sportConst = SPORTS.find(s => s.id === sportId);
        const sportGoals = GOAL_TEMPLATES[sportId] || [];
        for (const g of sportGoals) {
          items.push({
            id: `local-${idx}`,
            sportName: sportConst?.name || sportId,
            sportEmoji: sportConst?.emoji || '🏆',
            sportId: '',
            title: g.title,
            suggestedMonths: g.months,
            difficulty: g.difficulty,
            selected: idx < 3,
          });
          idx++;
        }
      }
      setGoals(items);
    }
  }, [templates]);

  function toggleGoal(id: string) {
    setGoals(prev => prev.map(g =>
      g.id === id ? { ...g, selected: !g.selected } : g
    ));
  }

  const selectedGoals = goals.filter(g => g.selected);
  const unselectedGoals = goals.filter(g => !g.selected);
  const selectedCount = selectedGoals.length;

  async function handleContinue() {
    try {
      await saveGoals(selectedGoals.map(g => ({
        title: g.title,
        sport_id: g.sportId || undefined,
        target_date: new Date(Date.now() + g.suggestedMonths * 30 * 86400000).toISOString().split('T')[0],
      })));
    } catch (e) {
      console.warn('Failed to save goals:', e);
    }
    router.push('/(onboarding)/beast-level');
  }

  return (
    <SafeAreaView style={styles.container}>
      <StepIndicator currentStep={3} totalSteps={5} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Where do you want to be?</Text>
        <Text style={styles.subtitle}>
          Pick 1-5 goals based on your disciplines. We'll track your progress.
        </Text>

        {/* Selected Goals */}
        {selectedGoals.length > 0 && (
          <Text style={styles.sectionLabel}>YOUR GOALS ({selectedCount})</Text>
        )}
        {selectedGoals.map((goal, index) => (
          <TouchableOpacity
            key={goal.id}
            style={[styles.goalCard, styles.goalCardSelected]}
            onPress={() => toggleGoal(goal.id)}
            activeOpacity={0.7}
          >
            <View style={styles.goalHeader}>
              <Text style={[styles.goalSport, { color: SPORT_COLORS[goal.sportName] || COLORS.aqua }]}>
                {goal.sportEmoji} {goal.sportName.toUpperCase()}
              </Text>
              <Text style={styles.goalDifficulty}>
                {getDifficultyLabel(goal.difficulty)}
              </Text>
            </View>
            <Text style={styles.goalTitle}>{goal.title}</Text>
            <Text style={styles.goalDate}>{getTargetDate(goal.suggestedMonths)}</Text>
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Available Goals */}
        {unselectedGoals.length > 0 && (
          <Text style={[styles.sectionLabel, { marginTop: 16 }]}>MORE GOALS</Text>
        )}
        {unselectedGoals.map((goal) => (
          <TouchableOpacity
            key={goal.id}
            style={styles.goalCard}
            onPress={() => toggleGoal(goal.id)}
            activeOpacity={0.7}
          >
            <View style={styles.goalHeader}>
              <Text style={[styles.goalSport, { color: SPORT_COLORS[goal.sportName] || COLORS.aqua, opacity: 0.6 }]}>
                {goal.sportEmoji} {goal.sportName.toUpperCase()}
              </Text>
              <Text style={styles.goalDifficulty}>
                {getDifficultyLabel(goal.difficulty)}
              </Text>
            </View>
            <Text style={[styles.goalTitle, { opacity: 0.5 }]}>{goal.title}</Text>
            <Text style={styles.goalDate}>{getTargetDate(goal.suggestedMonths)}</Text>
          </TouchableOpacity>
        ))}

        <View style={{ height: 16 }} />
        <Button
          title={saving ? 'Saving...' : `Continue with ${selectedCount} goal${selectedCount !== 1 ? 's' : ''}`}
          onPress={handleContinue}
          disabled={selectedCount === 0 || saving}
        />
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  goalCard: {
    padding: 14,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 8,
    position: 'relative',
  },
  goalCardSelected: {
    borderColor: 'rgba(86,196,196,0.25)',
    backgroundColor: 'rgba(86,196,196,0.05)',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  goalSport: {
    fontSize: 10,
    fontFamily: FONTS.bodySemiBold,
    letterSpacing: 0.5,
  },
  goalDifficulty: {
    fontSize: 10,
  },
  goalTitle: {
    fontSize: 14,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.white,
  },
  goalDate: {
    fontSize: 11,
    fontFamily: FONTS.body,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  checkmark: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.aqua,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: COLORS.dark,
    fontSize: 12,
    fontWeight: '700',
  },
});
