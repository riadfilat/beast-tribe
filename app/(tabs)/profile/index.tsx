import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, TierPill, ProgressBar, Button } from '../../../src/components/ui';
import { StatsGrid } from '../../../src/components/home/StatsGrid';
import { useProfile, useUserGoals, useUserBadges, useUserSports, useWorkoutCount, useMyPack, usePackMembers } from '../../../src/hooks';
import { useAuth } from '../../../src/providers/AuthProvider';
import { calculateLevel, calculateTier } from '../../../src/lib/xp';
import { COLORS, FONTS } from '../../../src/lib/constants';

function formatMemberSince(dateStr: string | undefined): string {
  if (!dateStr) {
    return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { data: goalsData, loading: goalsLoading } = useUserGoals();
  const { data: badgesData, loading: badgesLoading } = useUserBadges();
  const { data: sportsData, loading: sportsLoading } = useUserSports();
  const { data: workoutCountData, loading: workoutCountLoading } = useWorkoutCount();
  const { data: myPackData } = useMyPack();
  const myPack = myPackData?.pack;
  const { data: packMembers } = usePackMembers(myPack?.id);

  const isLoading = profileLoading && goalsLoading;

  // Profile data with fallbacks
  const name = profile?.display_name || profile?.full_name || 'Beast';
  const totalXP = profile?.total_xp ?? 0;
  const tier = profile?.tier ?? calculateTier(totalXP);
  const level = profile?.level ?? calculateLevel(totalXP);
  const streak = profile?.current_streak ?? 0;
  const memberSince = formatMemberSince(profile?.created_at);

  // Map hook data with demo fallbacks
  const goals = (goalsData || []).map((g: any) => ({
    title: g.title,
    progress: (g.progress_pct || 0) / 100,
    color: COLORS.orange,
  }));

  const badges = (badgesData || []).map((ub: any) => ({
    name: ub.badge?.name || 'Badge',
    color: ub.badge?.color || COLORS.orange,
    bg: `${ub.badge?.color || COLORS.orange}1F`,
  }));

  const sports = (sportsData || []).map((us: any) => us.sport?.name || 'Sport');

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.orange} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
        <Avatar name={name} size={56} tier={tier} backgroundColor={COLORS.dark} />
        <Text style={styles.name}>{name}</Text>
        <TierPill tier={tier} size="medium" showLevel level={level} />
        <Text style={styles.memberSince}>Member since {memberSince}</Text>

        <View style={{ width: '100%' }}>
          <StatsGrid streak={streak} totalXP={totalXP} level={level} />
        </View>

        {/* My Pack */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>My Pack</Text>
          {myPack ? (
            <TouchableOpacity
              style={styles.packCard}
              activeOpacity={0.7}
              onPress={() => router.push('/(tabs)/profile/pack')}
            >
              <Text style={styles.packEmoji}>
                {myPack.animal === 'wolf' ? '🐺' : myPack.animal === 'eagle' ? '🦅' : myPack.animal === 'tiger' ? '🐯' : myPack.animal === 'rhino' ? '🦏' : '🐾'}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.packName}>{myPack.name}</Text>
                <Text style={styles.packSub}>{packMembers?.length || 1} members</Text>
              </View>
              <Text style={styles.packArrow}>→</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.packCta}
              activeOpacity={0.7}
              onPress={() => router.push('/(tabs)/profile/pack')}
            >
              <Text style={styles.packCtaText}>Join or create a Pack</Text>
              <Text style={styles.packCtaSub}>Compete with friends</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Goals progress */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Beast Goals</Text>
          {goals.length > 0 ? goals.map((goal) => (
            <View key={goal.title} style={styles.goalRow}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                <Text style={[styles.goalPct, { color: goal.color }]}>{Math.round(goal.progress * 100)}%</Text>
              </View>
              <ProgressBar progress={goal.progress} color={goal.color} />
            </View>
          )) : (
            <Text style={styles.emptyText}>Complete onboarding to set your goals</Text>
          )}
        </View>

        {/* Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Conquests</Text>
          {badges.length > 0 ? (
            <View style={styles.badgeGrid}>
              {badges.map((badge) => (
                <View key={badge.name} style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.color }]}>{badge.name}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>Complete workouts and quests to earn badges</Text>
          )}
        </View>

        {/* Sports */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>My Disciplines</Text>
          {sports.length > 0 ? (
            <View style={styles.sportsRow}>
              {sports.map((sport) => (
                <View key={sport} style={styles.sportChip}>
                  <Text style={styles.sportText}>{sport}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No disciplines selected yet</Text>
          )}
        </View>

        <Button title="Sign Out" variant="secondary" onPress={signOut} />

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1, paddingHorizontal: 16 },
  name: { fontSize: 18, fontFamily: FONTS.heading, color: COLORS.white, marginTop: 8 },
  memberSince: { fontSize: 9, fontFamily: FONTS.body, color: COLORS.textTertiary, marginTop: 4, marginBottom: 12 },
  section: { width: '100%', marginTop: 10 },
  sectionLabel: { fontSize: 11, fontFamily: FONTS.bodySemiBold, color: COLORS.textSecondary, marginBottom: 6 },
  goalRow: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 10, marginBottom: 6 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  goalTitle: { fontSize: 11, fontFamily: FONTS.body, color: COLORS.white },
  goalPct: { fontSize: 11, fontFamily: FONTS.bodySemiBold },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 7, fontFamily: FONTS.bodySemiBold, textAlign: 'center', lineHeight: 9 },
  sportsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  sportChip: { backgroundColor: 'rgba(232,143,36,0.15)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  sportText: { fontSize: 10, fontFamily: FONTS.bodyMedium, color: COLORS.orange },
  emptyText: { fontSize: 11, fontFamily: FONTS.body, color: COLORS.textMuted, marginTop: 2 },
  packCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(232,143,36,0.06)', borderWidth: 1, borderColor: 'rgba(232,143,36,0.2)',
    borderRadius: 14, padding: 14,
  },
  packEmoji: { fontSize: 28 },
  packName: { fontSize: 14, fontFamily: FONTS.heading, color: COLORS.white },
  packSub: { fontSize: 10, fontFamily: FONTS.body, color: COLORS.textSecondary, marginTop: 1 },
  packArrow: { fontSize: 18, color: COLORS.orange },
  packCta: {
    borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(232,143,36,0.2)',
    borderRadius: 14, padding: 16, alignItems: 'center',
  },
  packCtaText: { fontSize: 13, fontFamily: FONTS.heading, color: COLORS.orange },
  packCtaSub: { fontSize: 10, fontFamily: FONTS.body, color: COLORS.textMuted, marginTop: 2 },
});
