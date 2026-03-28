import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FilterTabs } from '../../../src/components/ui';
import { WorkoutCard } from '../../../src/components/workouts/WorkoutCard';
import { useWorkouts } from '../../../src/hooks';
import { useAuth } from '../../../src/providers/AuthProvider';
import { COLORS, FONTS } from '../../../src/lib/constants';

const FILTER_TABS = ['All', 'Running', 'Gym', 'CrossFit', 'Cycling', 'Yoga', 'Swimming'];

export default function WorkoutsScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState(0);
  const sportFilter = FILTER_TABS[activeFilter];
  const { data: workoutsData, loading } = useWorkouts(sportFilter);
  const { profile } = useAuth();

  const workouts = (workoutsData || []).map((w: any) => ({
    id: w.id,
    sport_id: w.sport_id,
    title: w.title,
    description: w.description,
    duration: `${w.duration_minutes || 0} min`,
    duration_minutes: w.duration_minutes || 0,
    difficulty: w.difficulty || 'All levels',
    sport: w.sport?.name || 'Workout',
    xp: w.xp_reward || 100,
    instructions: w.instructions || [],
  }));

  const aiSuggestion = workouts.length > 0 ? workouts[0] : null;

  function openSession(workout: any) {
    router.push({
      pathname: '/(tabs)/workouts/session',
      params: {
        id: workout.id || '',
        sport_id: workout.sport_id || '',
        title: workout.title,
        sport: workout.sport,
        duration_minutes: String(workout.duration_minutes),
        difficulty: workout.difficulty,
        xp: String(workout.xp),
        instructions: JSON.stringify(workout.instructions),
      },
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Workouts</Text>

        <FilterTabs tabs={FILTER_TABS} activeIndex={activeFilter} onTabPress={setActiveFilter} />

        {/* AI Suggested */}
        {aiSuggestion && (
          <TouchableOpacity
            style={styles.aiCard}
            activeOpacity={0.7}
            onPress={() => openSession(aiSuggestion)}
          >
            <Text style={styles.aiLabel}>AI SUGGESTED</Text>
            <Text style={styles.aiTitle}>{aiSuggestion.title} — {aiSuggestion.difficulty}</Text>
            <Text style={styles.aiSub}>{aiSuggestion.duration} · +{aiSuggestion.xp} XP</Text>
          </TouchableOpacity>
        )}

        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={COLORS.orange} />
          </View>
        ) : workouts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No workouts found</Text>
            <Text style={styles.emptySubtext}>Try selecting a different sport filter</Text>
          </View>
        ) : (
          workouts.map((w) => (
            <WorkoutCard
              key={w.id || w.title}
              title={w.title}
              duration={w.duration}
              difficulty={w.difficulty}
              sport={w.sport}
              xpReward={w.xp}
              onPress={() => openSession(w)}
            />
          ))
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1, paddingHorizontal: 16 },
  title: { fontSize: 22, fontFamily: FONTS.heading, color: COLORS.white, marginTop: 8, marginBottom: 10 },
  aiCard: {
    borderRadius: 14, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(232,143,36,0.2)', backgroundColor: 'rgba(232,143,36,0.04)',
  },
  aiLabel: { fontSize: 9, fontFamily: FONTS.bodySemiBold, color: COLORS.orange, letterSpacing: 1 },
  aiTitle: { fontSize: 14, fontFamily: FONTS.heading, color: COLORS.white, marginTop: 4 },
  aiSub: { fontSize: 11, fontFamily: FONTS.body, color: COLORS.aqua, marginTop: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, fontFamily: FONTS.bodyMedium, color: COLORS.textSecondary },
  emptySubtext: { fontSize: 11, fontFamily: FONTS.body, color: COLORS.textMuted, marginTop: 4 },
});
