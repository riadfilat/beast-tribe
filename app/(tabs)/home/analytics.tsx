import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FilterTabs } from '../../../src/components/ui';
import { COLORS, FONTS } from '../../../src/lib/constants';
import { useWorkoutHistory, useStepHistory, useXPHistory, useProfile, useMyRSVPs } from '../../../src/hooks';

const PERIOD_TABS = ['This week', 'This month', 'All time'];

function getSinceDate(periodIndex: number): string | undefined {
  const now = new Date();
  if (periodIndex === 0) {
    // Start of current week (Sunday)
    const d = new Date(now);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }
  if (periodIndex === 1) {
    // Start of current month
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  }
  return undefined; // All time
}

// Demo data for when Supabase isn't connected
const DEMO_WORKOUTS = [
  { id: '1', title: 'Morning Run', duration_minutes: 35, calories_burned: 380, completed_at: new Date(Date.now() - 86400000).toISOString(), sport: { name: 'Running', emoji: '🏃' } },
  { id: '2', title: 'HIIT Session', duration_minutes: 45, calories_burned: 520, completed_at: new Date(Date.now() - 86400000 * 2).toISOString(), sport: { name: 'Gym', emoji: '🏋️' } },
  { id: '3', title: 'Yoga Flow', duration_minutes: 30, calories_burned: 180, completed_at: new Date(Date.now() - 86400000 * 3).toISOString(), sport: { name: 'Yoga', emoji: '🧘' } },
  { id: '4', title: 'Chest & Back', duration_minutes: 50, calories_burned: 420, completed_at: new Date(Date.now() - 86400000 * 4).toISOString(), sport: { name: 'Gym', emoji: '🏋️' } },
  { id: '5', title: '5K Run', duration_minutes: 28, calories_burned: 350, completed_at: new Date(Date.now() - 86400000 * 5).toISOString(), sport: { name: 'Running', emoji: '🏃' } },
];

const DEMO_STEPS = [
  { logged_date: new Date().toISOString().split('T')[0], steps: 7200, step_goal: 10000 },
  { logged_date: new Date(Date.now() - 86400000).toISOString().split('T')[0], steps: 9400, step_goal: 10000 },
  { logged_date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], steps: 6800, step_goal: 10000 },
  { logged_date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0], steps: 11200, step_goal: 10000 },
  { logged_date: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0], steps: 8100, step_goal: 10000 },
  { logged_date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0], steps: 5400, step_goal: 10000 },
  { logged_date: new Date(Date.now() - 86400000 * 6).toISOString().split('T')[0], steps: 10300, step_goal: 10000 },
];

const DEMO_XP = [
  { amount: 200, source: 'workout', description: 'Completed: Morning Run', created_at: new Date(Date.now() - 86400000).toISOString() },
  { amount: 300, source: 'workout', description: 'Completed: HIIT Session', created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  { amount: 120, source: 'steps', description: 'Daily step goal reached', created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
  { amount: 150, source: 'workout', description: 'Completed: Yoga Flow', created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
  { amount: 50, source: 'quest', description: 'Quest: Log a meal', created_at: new Date(Date.now() - 86400000 * 4).toISOString() },
];

export default function AnalyticsScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState(0);
  const since = getSinceDate(period);

  const { profile } = useProfile();
  const { data: workouts } = useWorkoutHistory(since);
  const { data: steps } = useStepHistory(since);
  const { data: xpHistory } = useXPHistory(since);
  const { data: myRSVPs } = useMyRSVPs();

  const workoutData = workouts?.length ? workouts : DEMO_WORKOUTS;
  const stepData = steps?.length ? steps : DEMO_STEPS;
  const xpData = xpHistory?.length ? xpHistory : DEMO_XP;

  // Compute stats
  const stats = useMemo(() => {
    const totalWorkouts = workoutData.length;
    const totalMinutes = workoutData.reduce((sum: number, w: any) => sum + (w.duration_minutes || 0), 0);
    const totalCalories = workoutData.reduce((sum: number, w: any) => sum + (w.calories_burned || 0), 0);
    const totalXP = xpData.reduce((sum: number, x: any) => sum + (x.amount || 0), 0);
    const avgSteps = stepData.length > 0
      ? Math.round(stepData.reduce((sum: number, s: any) => sum + (s.steps || 0), 0) / stepData.length)
      : 0;
    const daysWithGoalMet = stepData.filter((s: any) => s.steps >= (s.step_goal || 10000)).length;

    // Sport breakdown
    const sportMap: Record<string, number> = {};
    workoutData.forEach((w: any) => {
      const name = w.sport?.name || 'Other';
      sportMap[name] = (sportMap[name] || 0) + 1;
    });
    const sportBreakdown = Object.entries(sportMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count, pct: totalWorkouts > 0 ? Math.round((count / totalWorkouts) * 100) : 0 }));

    return { totalWorkouts, totalMinutes, totalCalories, totalXP, avgSteps, daysWithGoalMet, sportBreakdown };
  }, [workoutData, stepData, xpData]);

  // Step bar chart data (last 7 days from stepData)
  const stepBars = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const maxSteps = Math.max(...stepData.map((s: any) => s.steps || 0), 1);
    return stepData.slice(0, 7).reverse().map((s: any) => {
      const date = new Date(s.logged_date + 'T00:00:00');
      return {
        day: days[date.getDay()],
        steps: s.steps || 0,
        pct: ((s.steps || 0) / maxSteps) * 100,
        metGoal: (s.steps || 0) >= (s.step_goal || 10000),
      };
    });
  }, [stepData]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Performance</Text>
          <View style={{ width: 24 }} />
        </View>

        <FilterTabs tabs={PERIOD_TABS} activeIndex={period} onTabPress={setPeriod} size="small" />

        {/* Summary Stats */}
        <View style={styles.statsGrid}>
          <StatBox label="Workouts" value={String(stats.totalWorkouts)} color={COLORS.orange} />
          <StatBox label="Minutes" value={String(stats.totalMinutes)} color={COLORS.aqua} />
          <StatBox label="Calories" value={stats.totalCalories.toLocaleString()} color={COLORS.coral} />
          <StatBox label="XP earned" value={stats.totalXP.toLocaleString()} color={COLORS.green} />
        </View>

        {/* Steps Overview */}
        <Text style={styles.sectionLabel}>DAILY STEPS</Text>
        <View style={styles.stepsCard}>
          <View style={styles.stepsHeader}>
            <Text style={styles.stepsAvg}>{stats.avgSteps.toLocaleString()}</Text>
            <Text style={styles.stepsAvgLabel}>avg/day</Text>
          </View>
          <Text style={styles.stepsGoalText}>{stats.daysWithGoalMet} of {stepData.length} days goal met</Text>

          {/* Bar chart */}
          <View style={styles.barChart}>
            {stepBars.map((bar, i) => (
              <View key={i} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: `${Math.max(bar.pct, 4)}%`, backgroundColor: bar.metGoal ? COLORS.green : COLORS.aqua }]} />
                </View>
                <Text style={styles.barLabel}>{bar.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Sport Breakdown */}
        {stats.sportBreakdown.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>SPORT BREAKDOWN</Text>
            <View style={styles.breakdownCard}>
              {stats.sportBreakdown.map((sport) => (
                <View key={sport.name} style={styles.breakdownRow}>
                  <Text style={styles.breakdownName}>{sport.name}</Text>
                  <View style={styles.breakdownBarTrack}>
                    <View style={[styles.breakdownBarFill, { width: `${sport.pct}%` }]} />
                  </View>
                  <Text style={styles.breakdownPct}>{sport.count} ({sport.pct}%)</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Recent Workouts */}
        <Text style={styles.sectionLabel}>RECENT WORKOUTS</Text>
        {workoutData.slice(0, 5).map((w: any, i: number) => (
          <View key={w.id || i} style={styles.workoutRow}>
            <Text style={styles.workoutEmoji}>{w.sport?.emoji || '💪'}</Text>
            <View style={styles.workoutInfo}>
              <Text style={styles.workoutTitle}>{w.title}</Text>
              <Text style={styles.workoutMeta}>
                {w.duration_minutes}min · {(w.calories_burned || 0).toLocaleString()} cal
              </Text>
            </View>
            <Text style={styles.workoutDate}>
              {new Date(w.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          </View>
        ))}

        {/* XP History */}
        <Text style={styles.sectionLabel}>XP HISTORY</Text>
        {xpData.slice(0, 5).map((x: any, i: number) => (
          <View key={i} style={styles.xpRow}>
            <View style={styles.xpDot} />
            <View style={styles.xpInfo}>
              <Text style={styles.xpDesc}>{x.description}</Text>
              <Text style={styles.xpDate}>
                {new Date(x.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            </View>
            <Text style={styles.xpAmount}>+{x.amount} XP</Text>
          </View>
        ))}

        {/* My Events (RSVPs) */}
        <Text style={styles.sectionLabel}>MY EVENTS</Text>
        {(myRSVPs && myRSVPs.length > 0) ? myRSVPs.slice(0, 5).map((rsvp: any, i: number) => {
          const evt = rsvp.event;
          if (!evt) return null;
          const isPast = new Date(evt.starts_at) < new Date();
          return (
            <View key={rsvp.id || i} style={styles.eventRow}>
              <Text style={styles.workoutEmoji}>{evt.sport?.emoji || '📅'}</Text>
              <View style={styles.workoutInfo}>
                <Text style={styles.workoutTitle}>{evt.title}</Text>
                <Text style={styles.workoutMeta}>
                  {new Date(evt.starts_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  {evt.location_name ? ` · ${evt.location_name}` : evt.gym_name ? ` · ${evt.gym_name}` : ''}
                </Text>
              </View>
              <View style={[styles.eventBadge, isPast && styles.eventBadgePast]}>
                <Text style={[styles.eventBadgeText, isPast && styles.eventBadgeTextPast]}>
                  {isPast ? 'Attended' : 'Going'}
                </Text>
              </View>
            </View>
          );
        }) : (
          <Text style={styles.emptyText}>No events joined yet. Check out Events to find one!</Text>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1, paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 12 },
  backArrow: { fontSize: 22, color: COLORS.white },
  title: { fontSize: 18, fontFamily: FONTS.heading, color: COLORS.white },

  // Stats grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14, marginBottom: 16 },
  statBox: {
    flex: 1, minWidth: '45%',
    backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.cardBorder,
    borderRadius: 14, padding: 14, alignItems: 'center',
  },
  statValue: { fontSize: 22, fontFamily: FONTS.heading },
  statLabel: { fontSize: 10, fontFamily: FONTS.body, color: COLORS.textSecondary, marginTop: 2 },

  // Section
  sectionLabel: { fontSize: 9, fontFamily: FONTS.bodySemiBold, color: COLORS.textSecondary, letterSpacing: 1, marginBottom: 8, marginTop: 12 },

  // Steps card
  stepsCard: {
    backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.cardBorder,
    borderRadius: 14, padding: 14,
  },
  stepsHeader: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 2 },
  stepsAvg: { fontSize: 24, fontFamily: FONTS.heading, color: COLORS.aqua },
  stepsAvgLabel: { fontSize: 11, fontFamily: FONTS.body, color: COLORS.textSecondary },
  stepsGoalText: { fontSize: 11, fontFamily: FONTS.body, color: COLORS.textTertiary, marginBottom: 12 },

  // Bar chart
  barChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 80 },
  barCol: { alignItems: 'center', flex: 1 },
  barTrack: { width: 16, height: 60, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 4 },
  barLabel: { fontSize: 9, fontFamily: FONTS.body, color: COLORS.textTertiary, marginTop: 4 },

  // Sport breakdown
  breakdownCard: {
    backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.cardBorder,
    borderRadius: 14, padding: 14, gap: 10,
  },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  breakdownName: { fontSize: 12, fontFamily: FONTS.bodyMedium, color: COLORS.white, width: 70 },
  breakdownBarTrack: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' },
  breakdownBarFill: { height: '100%', backgroundColor: COLORS.orange, borderRadius: 3 },
  breakdownPct: { fontSize: 10, fontFamily: FONTS.body, color: COLORS.textSecondary, width: 50, textAlign: 'right' },

  // Workout rows
  workoutRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  workoutEmoji: { fontSize: 20 },
  workoutInfo: { flex: 1 },
  workoutTitle: { fontSize: 13, fontFamily: FONTS.bodyMedium, color: COLORS.white },
  workoutMeta: { fontSize: 10, fontFamily: FONTS.body, color: COLORS.textSecondary },
  workoutDate: { fontSize: 10, fontFamily: FONTS.body, color: COLORS.textTertiary },

  // XP rows
  xpRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  xpDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.green },
  xpInfo: { flex: 1 },
  xpDesc: { fontSize: 12, fontFamily: FONTS.body, color: COLORS.white },
  xpDate: { fontSize: 10, fontFamily: FONTS.body, color: COLORS.textTertiary },
  xpAmount: { fontSize: 12, fontFamily: FONTS.heading, color: COLORS.green },

  // Event rows
  eventRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  eventBadge: {
    backgroundColor: 'rgba(98,183,151,0.15)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  eventBadgePast: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  eventBadgeText: { fontSize: 10, fontFamily: FONTS.bodySemiBold, color: COLORS.green },
  eventBadgeTextPast: { color: COLORS.textSecondary },
  emptyText: { fontSize: 12, fontFamily: FONTS.body, color: COLORS.textTertiary, textAlign: 'center', paddingVertical: 16 },
});
