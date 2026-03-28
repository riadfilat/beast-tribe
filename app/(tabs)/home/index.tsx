import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, TierPill } from '../../../src/components/ui';
import { StatsGrid } from '../../../src/components/home/StatsGrid';
import { DailyGoalCard } from '../../../src/components/home/DailyGoalCard';
import { QuestCard } from '../../../src/components/home/QuestCard';
import { PackChallengeCard } from '../../../src/components/home/PackChallengeCard';
import { UpcomingEventCard } from '../../../src/components/home/UpcomingEventCard';
import { COLORS, FONTS } from '../../../src/lib/constants';
import { calculateLevel, calculateTier } from '../../../src/lib/xp';
import {
  useProfile,
  useTodaySteps,
  useTodayQuest,
  useActivePackChallenge,
  useUpcomingEvents,
  useTodayNutrition,
  useJoinEvent,
} from '../../../src/hooks';

// Demo fallbacks — shown when hooks return null (no Supabase connection)
const DEMO = {
  name: 'Ahmed F.',
  fullName: 'Ahmed Failat',
  tier: 'forged' as const,
  streak: 14,
  totalXP: 2800,
  level: 8,
  steps: 7200,
  stepGoal: 10000,
  quest: { title: 'Complete a 30-min gym session', xp: 200 },
  pack: { a: 'Wolf Pack', b: 'Iron Tribe', aXP: 12400, bXP: 9800, daysLeft: 3 },
  event: {
    type: 'Community run',
    title: 'Riyadh 5K Beast Run',
    details: 'Sat, Jun 14 · 6:30 AM · King Fahd Park',
  },
  nutritionCals: 1680,
  nutritionGoal: 2200,
};

export default function HomeScreen() {
  const router = useRouter();

  // --- Supabase hooks ---
  const { profile, loading: profileLoading } = useProfile();
  const { data: stepData, loading: stepsLoading } = useTodaySteps();
  const { data: questData } = useTodayQuest();
  const { data: packData } = useActivePackChallenge();
  const { data: eventsData } = useUpcomingEvents(1);
  const { data: nutritionLogs } = useTodayNutrition();
  const { joinEvent } = useJoinEvent();

  // Show loading spinner while initial data loads
  const isLoading = profileLoading && stepsLoading;

  // --- Derive values with demo fallbacks ---
  const totalXP = profile?.total_xp ?? DEMO.totalXP;
  const tier = (profile?.tier ?? calculateTier(totalXP)) as 'raw' | 'forged' | 'untamed';
  const displayName = profile?.display_name ?? profile?.full_name ?? DEMO.name;
  const fullName = profile?.full_name ?? DEMO.fullName;
  const streak = profile?.current_streak ?? DEMO.streak;
  const level = calculateLevel(totalXP);

  const currentSteps = stepData?.steps ?? DEMO.steps;
  const stepGoal = stepData?.step_goal ?? DEMO.stepGoal;

  const questTitle = questData?.quest?.title ?? DEMO.quest.title;
  const questXP = questData?.quest?.xp_reward ?? DEMO.quest.xp;

  const packAName = packData?.pack_a?.name ?? DEMO.pack.a;
  const packBName = packData?.pack_b?.name ?? DEMO.pack.b;
  const packAXP = packData?.pack_a_xp ?? DEMO.pack.aXP;
  const packBXP = packData?.pack_b_xp ?? DEMO.pack.bXP;
  const packDaysLeft = packData
    ? Math.max(0, Math.ceil((new Date(packData.ends_at).getTime() - Date.now()) / 86400000))
    : DEMO.pack.daysLeft;
  const userPackIsA = packData
    ? profile?.pack_id === packData.pack_a_id
    : true;

  const upcomingEvent = eventsData && eventsData.length > 0 ? eventsData[0] : null;
  const eventType = upcomingEvent?.sport?.name ?? DEMO.event.type;
  const eventTitle = upcomingEvent?.title ?? DEMO.event.title;
  const eventDetails = upcomingEvent
    ? [
        new Date(upcomingEvent.starts_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        new Date(upcomingEvent.starts_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        upcomingEvent.gym_name,
      ].filter(Boolean).join(' · ')
    : DEMO.event.details;

  // Nutrition summary from logs
  const nutritionCals = nutritionLogs && nutritionLogs.length > 0
    ? nutritionLogs.reduce((sum: number, log: any) => sum + (log.calories ?? 0), 0)
    : DEMO.nutritionCals;
  const nutritionGoal = DEMO.nutritionGoal;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.teal} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcome}>Welcome back, Beast</Text>
            <Text style={styles.name}>{displayName}</Text>
          </View>
          <View style={styles.headerRight}>
            <TierPill tier={tier} />
            <Avatar name={fullName} size={34} tier={tier} backgroundColor={COLORS.dark} />
          </View>
        </View>

        {/* Stats */}
        <StatsGrid streak={streak} totalXP={totalXP} level={level} />

        {/* Daily Goal */}
        <DailyGoalCard currentSteps={currentSteps} goalSteps={stepGoal} xpReward={120} />

        {/* Today's Quest */}
        <QuestCard title={questTitle} xpReward={questXP} />

        {/* Pack Challenge — only show when user has an active pack challenge */}
        {packData ? (
          <PackChallengeCard
            packAName={packAName}
            packBName={packBName}
            packAXP={packAXP}
            packBXP={packBXP}
            daysLeft={packDaysLeft}
            userPackIsA={userPackIsA}
          />
        ) : (
          <TouchableOpacity
            style={styles.packCta}
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/profile/pack')}
          >
            <Text style={styles.packCtaTitle}>Join a Pack</Text>
            <Text style={styles.packCtaSub}>Compete in challenges with your tribe</Text>
          </TouchableOpacity>
        )}

        {/* Analytics shortcut */}
        <TouchableOpacity
          style={styles.analyticsLink}
          onPress={() => router.push('/(tabs)/home/analytics')}
          activeOpacity={0.7}
        >
          <View>
            <Text style={styles.nutritionTitle}>Performance tracker</Text>
            <Text style={styles.nutritionSub}>Workouts, steps & XP trends</Text>
          </View>
          <Text style={styles.nutritionArrow}>→</Text>
        </TouchableOpacity>

        {/* Nutrition shortcut */}
        <TouchableOpacity
          style={styles.nutritionLink}
          onPress={() => router.push('/(tabs)/home/nutrition')}
          activeOpacity={0.7}
        >
          <View>
            <Text style={styles.nutritionTitle}>Nutrition tracker</Text>
            <Text style={styles.nutritionSub}>{nutritionCals.toLocaleString()} / {nutritionGoal.toLocaleString()} cal today</Text>
          </View>
          <Text style={styles.nutritionArrow}>→</Text>
        </TouchableOpacity>

        {/* Upcoming Event */}
        <Text style={styles.sectionLabel}>Upcoming event</Text>
        <UpcomingEventCard
          type={eventType}
          title={eventTitle}
          details={eventDetails}
          onJoin={() => {
            if (upcomingEvent?.id) joinEvent(upcomingEvent.id);
          }}
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
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 8,
  },
  welcome: {
    fontSize: 11,
    fontFamily: FONTS.body,
    color: COLORS.textTertiary,
  },
  name: {
    fontSize: 18,
    fontFamily: FONTS.heading,
    color: COLORS.white,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.textSecondary,
    marginBottom: 6,
    marginTop: 4,
  },
  analyticsLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(232,143,36,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(232,143,36,0.15)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  nutritionLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(86,196,196,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(86,196,196,0.15)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  nutritionTitle: {
    fontSize: 13,
    fontFamily: FONTS.heading,
    color: COLORS.white,
  },
  nutritionSub: {
    fontSize: 10,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  nutritionArrow: {
    fontSize: 18,
    color: COLORS.aqua,
  },
  packCta: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(232,143,36,0.2)',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  packCtaTitle: {
    fontSize: 13,
    fontFamily: FONTS.heading,
    color: COLORS.orange,
  },
  packCtaSub: {
    fontSize: 10,
    fontFamily: FONTS.body,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
