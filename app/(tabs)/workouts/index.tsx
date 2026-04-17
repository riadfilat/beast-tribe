import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FilterTabs, BeastIcon } from '../../../src/components/ui';
import { WorkoutCard } from '../../../src/components/workouts/WorkoutCard';
import { useWorkouts } from '../../../src/hooks';
import { useAuth } from '../../../src/providers/AuthProvider';
import { supabase, isSupabaseConfigured } from '../../../src/lib/supabase';
import { COLORS, FONTS } from '../../../src/lib/constants';

const OB_LOGO = require('../../../assets/images/ob-logo-mark.png');

const FILTER_TABS = ['All', 'Running', 'Gym', 'CrossFit', 'Cycling', 'Yoga', 'Swimming'];

export default function WorkoutsScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState(0);
  const [activeTab, setActiveTab] = useState<'workouts' | 'history'>('workouts');
  const sportFilter = FILTER_TABS[activeFilter];
  const { data: workoutsData, loading } = useWorkouts(sportFilter);
  const { profile, user } = useAuth();
  const [coachMissions, setCoachMissions] = useState<any[]>([]);

  // Fetch coach-assigned workout programs for this user
  React.useEffect(() => {
    if (!isSupabaseConfigured || !user) return;
    (async () => {
      const { data } = await supabase.from('program_assignments')
        .select('*, program:workout_programs(*)')
        .eq('trainee_id', user.id)
        .eq('status', 'active');
      if (data) setCoachMissions(data);
    })();
  }, [user]);

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
        {/* App header — matches events page */}
        <View style={styles.appHeader}>
          <View style={styles.brandRow}>
            <BeastIcon size={28} color={COLORS.orange} />
            <Text style={styles.brandName}>BEAST TRIBE</Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Page title row */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>MISSION</Text>
          <Text style={styles.subLabel}>TRAIN HARDER</Text>
        </View>

        {/* Underline tabs: Workouts / History */}
        <View style={styles.underlineTabs}>
          <TouchableOpacity
            style={styles.underlineTab}
            onPress={() => setActiveTab('workouts')}
            activeOpacity={0.7}
          >
            <Text style={[styles.underlineTabText, activeTab === 'workouts' && styles.underlineTabTextActive]}>
              Workouts
            </Text>
            {activeTab === 'workouts' && <View style={styles.underlineIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.underlineTab}
            onPress={() => setActiveTab('history')}
            activeOpacity={0.7}
          >
            <Text style={[styles.underlineTabText, activeTab === 'history' && styles.underlineTabTextActive]}>
              History
            </Text>
            {activeTab === 'history' && <View style={styles.underlineIndicator} />}
          </TouchableOpacity>
        </View>

        {/* Coach Missions — assigned by your coach */}
        {coachMissions.length > 0 && activeTab === 'workouts' && (
          <View style={styles.missionsSection}>
            <View style={styles.missionHeader}>
              <Text style={styles.missionTitle}>COACH MISSIONS</Text>
              <View style={styles.missionBadge}>
                <Text style={styles.missionBadgeText}>{coachMissions.length}</Text>
              </View>
            </View>
            {coachMissions.map((cm: any) => {
              const p = cm.program;
              if (!p) return null;
              const exCount = p.exercises?.length || 0;
              const diffColor = { easy: COLORS.green, medium: COLORS.orange, hard: '#EF5350' }[p.difficulty as string] || COLORS.orange;
              return (
                <TouchableOpacity
                  key={cm.id}
                  style={styles.missionCard}
                  activeOpacity={0.7}
                  onPress={() => openSession({
                    id: p.id, sport_id: '', title: p.title, sport: p.sport || 'Workout',
                    duration_minutes: p.duration_minutes || 0, difficulty: p.difficulty || 'medium',
                    xp: 200, instructions: p.exercises || [],
                  })}
                >
                  <View style={[styles.missionAccent, { backgroundColor: diffColor }]} />
                  <View style={styles.missionContent}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="flash" size={14} color={COLORS.orange} />
                      <Text style={styles.missionLabel}>FROM YOUR COACH</Text>
                    </View>
                    <Text style={styles.missionName}>{p.title}</Text>
                    {p.description ? <Text style={styles.missionDesc} numberOfLines={2}>{p.description}</Text> : null}
                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
                      <Text style={styles.missionMeta}>{exCount} exercises</Text>
                      {p.duration_minutes ? <Text style={styles.missionMeta}>{p.duration_minutes} min</Text> : null}
                      <Text style={[styles.missionMeta, { color: diffColor }]}>{(p.difficulty || 'medium').toUpperCase()}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {activeTab === 'workouts' ? (
          <>
            {/* AI Suggested card */}
            {aiSuggestion && (
              <TouchableOpacity
                style={styles.aiCard}
                activeOpacity={0.7}
                onPress={() => openSession(aiSuggestion)}
              >
                <View style={styles.aiHeader}>
                  <View style={styles.aiTagRow}>
                    <Ionicons name="sparkles" size={14} color={COLORS.dark} />
                    <Text style={styles.aiLabel}>AI SUGGESTED</Text>
                  </View>
                  <Ionicons name="arrow-forward-circle-outline" size={22} color={COLORS.orange} />
                </View>
                <Text style={styles.aiTitle}>{aiSuggestion.title}</Text>
                <View style={styles.aiMeta}>
                  <View style={styles.aiMetaChip}>
                    <Ionicons name="time-outline" size={12} color={COLORS.textSecondary} />
                    <Text style={styles.aiMetaText}>{aiSuggestion.duration}</Text>
                  </View>
                  <View style={styles.aiMetaChip}>
                    <Ionicons name="speedometer-outline" size={12} color={COLORS.textSecondary} />
                    <Text style={styles.aiMetaText}>{aiSuggestion.difficulty}</Text>
                  </View>
                  <View style={styles.aiXpChip}>
                    <Ionicons name="flash" size={12} color={COLORS.orange} />
                    <Text style={styles.aiXpText}>+{aiSuggestion.xp} XP</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {/* Sport filters */}
            <FilterTabs tabs={FILTER_TABS} activeIndex={activeFilter} onTabPress={setActiveFilter} size="small" />

            {loading ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.orange} />
              </View>
            ) : workouts.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="barbell-outline" size={40} color={COLORS.textMuted} />
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
          </>
        ) : (
          /* History tab — placeholder */
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No workout history</Text>
            <Text style={styles.emptySubtext}>Complete a workout to see it here</Text>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1, paddingHorizontal: 16 },

  /* App header */
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLogo: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  brandName: {
    fontSize: 16,
    fontFamily: FONTS.display,
    color: COLORS.orange,
    letterSpacing: 1,
  },
  notificationBtn: {
    padding: 4,
  },

  /* Title row */
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  subLabel: {
    fontSize: 10,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.orange,
    letterSpacing: 1.5,
  },

  /* Underline tabs */
  underlineTabs: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  underlineTab: {
    paddingBottom: 10,
    position: 'relative',
  },
  underlineTabText: {
    fontSize: 15,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.textTertiary,
  },
  underlineTabTextActive: {
    color: COLORS.orange,
  },
  underlineIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: COLORS.orange,
    borderRadius: 2,
  },

  /* AI suggested card */
  aiCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(232,143,36,0.35)',
    backgroundColor: 'rgba(232,143,36,0.06)',
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  aiTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.orange,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  aiLabel: {
    fontSize: 8,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.dark,
    letterSpacing: 1,
  },
  aiTitle: {
    fontSize: 18,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  aiMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aiMetaText: {
    fontSize: 11,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
  },
  aiXpChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(232,143,36,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  aiXpText: {
    fontSize: 11,
    fontFamily: FONTS.heading,
    color: COLORS.orange,
  },

  /* Empty */
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: FONTS.heading,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 12,
    fontFamily: FONTS.body,
    color: COLORS.textTertiary,
  },

  // Coach Missions
  missionsSection: { marginBottom: 16 },
  missionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  missionTitle: { fontSize: 12, fontFamily: FONTS.heading, color: COLORS.orange, letterSpacing: 1 },
  missionBadge: { backgroundColor: COLORS.orange, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  missionBadgeText: { fontSize: 10, fontFamily: FONTS.heading, color: '#FFFFFF' },
  missionCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(232,143,36,0.06)', borderWidth: 1, borderColor: 'rgba(232,143,36,0.2)',
    borderRadius: 14, overflow: 'hidden', marginBottom: 8,
  },
  missionAccent: { width: 4, alignSelf: 'stretch' },
  missionContent: { flex: 1, padding: 14 },
  missionLabel: { fontSize: 9, fontFamily: FONTS.bodySemiBold, color: COLORS.orange, letterSpacing: 0.5 },
  missionName: { fontSize: 14, fontFamily: FONTS.heading, color: COLORS.textPrimary, marginTop: 2 },
  missionDesc: { fontSize: 11, fontFamily: FONTS.body, color: COLORS.textTertiary, marginTop: 2 },
  missionMeta: { fontSize: 10, fontFamily: FONTS.body, color: COLORS.textMuted },
});
