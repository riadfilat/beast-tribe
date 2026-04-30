import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Modal, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Avatar, TierPill, ProgressBar, BeastIcon } from '../../../src/components/ui';
import { HabitChecklist } from '../../../src/components/habits/HabitChecklist';
import { BeastScoreCard } from '../../../src/components/habits/BeastScoreCard';
import { ActivityCalendar } from '../../../src/components/profile/ActivityCalendar';
import { useProfile, useUserGoals, useUserBadges, useUserSports, useWorkoutCount, useMyPack, usePackMembers, useUserHabits, useTodayHabitProgress, useBeastScore, useMyCommunity } from '../../../src/hooks';
import { useAuth } from '../../../src/providers/AuthProvider';
import { useTheme } from '../../../src/providers/ThemeProvider';
import { calculateLevel, calculateTier, levelProgress, xpForLevel } from '../../../src/lib/xp';
import { COLORS, FONTS, TIERS, HABIT_DEFINITIONS, HABIT_COLORS } from '../../../src/lib/constants';

const OB_LOGO = require('../../../assets/images/ob-logo-mark.png');

function formatXP(xp: number): string {
  if (xp >= 1000) return `${(xp / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(xp);
}

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  async function pickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library to upload a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      // Compress avatar to ~20-50KB
      const { compressImage } = require('../../../src/lib/imageUtils');
      const compressed = await compressImage(result.assets[0].uri, 'avatar');
      setAvatarUri(compressed);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
      setShowSignOutModal(false);
    }
  }
  const { profile, loading: profileLoading } = useProfile();
  const { data: goalsData, loading: goalsLoading } = useUserGoals();
  const { data: badgesData } = useUserBadges();
  const { data: sportsData } = useUserSports();
  const { data: myPackData } = useMyPack();
  const myPack = myPackData?.pack;
  const { data: packMembers } = usePackMembers(myPack?.id);
  const { data: userHabits } = useUserHabits();
  const { data: todayHabitLogs } = useTodayHabitProgress();
  const { data: beastScoreData } = useBeastScore();
  const { data: myCommunity } = useMyCommunity();

  const isLoading = profileLoading && goalsLoading;

  // Profile data with fallbacks
  const name = profile?.display_name || profile?.full_name || 'Beast';
  const totalXP = profile?.total_xp ?? 0;
  const tier = profile?.tier ?? calculateTier(totalXP);
  const level = profile?.level ?? calculateLevel(totalXP);
  const streak = profile?.current_streak ?? 0;
  const tierConfig = TIERS[tier] || TIERS.initiate;

  // Map hook data
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

  // Habits for profile
  const habitItems = (userHabits || []).map((uh: any) => {
    const def = uh.habit_definition;
    if (!def) return null;
    const log = (todayHabitLogs || []).find((l: any) => l.user_habit_id === uh.id);
    return {
      id: uh.id,
      icon: def.icon,
      label: def.label,
      current: log?.value ?? 0,
      target: uh.target,
      category: def.category,
      completed: (log?.value ?? 0) >= 1,
    };
  }).filter((x): x is NonNullable<typeof x> => x != null);

  const beastScore = beastScoreData?.score ?? profile?.beast_score ?? 0;

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
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* App header */}
        <View style={styles.appHeader}>
          <View style={styles.brandRow}>
            <BeastIcon size={28} color={COLORS.orange} />
            <Text style={styles.brandName}>BEAST TRIBE</Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Profile avatar + info centered */}
        <View style={styles.profileCenter}>
          <TouchableOpacity style={styles.avatarContainer} onPress={pickAvatar} activeOpacity={0.8}>
            <Avatar name={name} size={90} tier={tier} backgroundColor={COLORS.dark} imageUrl={avatarUri || undefined} />
            <View style={styles.cameraOverlay}>
              <Ionicons name="camera" size={14} color={COLORS.white} />
            </View>
          </TouchableOpacity>
          <TierPill tier={tier} size="medium" showLevel level={level} />
          <Text style={styles.profileName}>{name.toUpperCase()}</Text>
          <Text style={styles.profileSubtitle}>ELITE ATHLETE</Text>
          {myCommunity && (
            <View style={styles.communityBadge}>
              <Ionicons name="shield-checkmark" size={12} color={COLORS.orange} />
              <Text style={styles.communityBadgeText}>{myCommunity.name}</Text>
            </View>
          )}
        </View>

        {/* Stats cards — streak + XP */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <Ionicons name="flame-outline" size={20} color={COLORS.orange} />
            </View>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>DAY STREAK</Text>
          </View>
          <View style={[styles.statCard, styles.statCardHighlight]}>
            <View style={[styles.statIconWrap, { backgroundColor: 'rgba(0,0,0,0.15)' }]}>
              <Ionicons name="flash" size={20} color={COLORS.dark} />
            </View>
            <Text style={[styles.statValue, { color: COLORS.dark }]}>{formatXP(totalXP)}</Text>
            <Text style={[styles.statLabel, { color: 'rgba(1,30,30,0.6)' }]}>TOTAL XP EARNED</Text>
          </View>
        </View>

        {/* BEAST LEVEL */}
        <TouchableOpacity
          style={styles.beastLevelCard}
          activeOpacity={0.7}
          onPress={() => router.push('/(tabs)/home/levels')}
        >
          <View style={styles.beastLevelTop}>
            <View style={styles.beastLevelLeft}>
              <View style={styles.beastLevelCircle}>
                <Text style={styles.beastLevelNumber}>{level}</Text>
              </View>
              <View>
                <Text style={styles.beastLevelTitle}>BEAST LEVEL</Text>
                <Text style={styles.beastLevelSub}>{tierConfig.shortLabel} · {formatXP(totalXP)} XP</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
          </View>
          <View style={styles.beastLevelProgress}>
            <ProgressBar progress={levelProgress(totalXP)} color={COLORS.orange} height={6} />
            <Text style={styles.beastLevelXpText}>
              {formatXP(xpForLevel(level + 1) - totalXP)} XP to Level {level + 1}
            </Text>
          </View>
        </TouchableOpacity>

        {/* MY PACK */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>MY PACK</Text>
            {myPack && (
              <TouchableOpacity onPress={() => router.push('/(tabs)/profile/pack')} activeOpacity={0.7}>
                <Text style={styles.sectionAction}>MANAGE</Text>
              </TouchableOpacity>
            )}
          </View>
          {myPack ? (
            <TouchableOpacity
              style={styles.packCard}
              activeOpacity={0.7}
              onPress={() => router.push('/(tabs)/profile/pack')}
            >
              <View style={styles.packIconWrap}>
                <Ionicons name="people" size={20} color={COLORS.aqua} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.packName}>{myPack.name}</Text>
                <Text style={styles.packSub}>{packMembers?.length || 1} Active Members</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.packCard}
              activeOpacity={0.7}
              onPress={() => router.push('/(tabs)/profile/pack')}
            >
              <View style={styles.packIconWrap}>
                <Ionicons name="people" size={20} color={COLORS.aqua} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.packName}>Join a Pack</Text>
                <Text style={styles.packSub}>Compete with friends</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* BEAST SCORE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BEAST SCORE</Text>
          <BeastScoreCard
            score={beastScore}
            workoutConsistency={beastScoreData?.workout_consistency ?? 0}
            nutritionConsistency={beastScoreData?.nutrition_consistency ?? 0}
            stepConsistency={beastScoreData?.step_consistency ?? 0}
            streakBonus={beastScoreData?.streak_bonus ?? 0}
            eventBonus={beastScoreData?.event_bonus ?? 0}
          />
        </View>

        {/* MY JOURNEY — Activity Calendar */}
        <View style={styles.section}>
          <ActivityCalendar streak={streak} />
        </View>

        {/* DAILY HABITS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>DAILY HABITS</Text>
            <TouchableOpacity onPress={() => router.push('/(onboarding)/set-habits?edit=1')} activeOpacity={0.7}>
              <Text style={styles.sectionAction}>EDIT</Text>
            </TouchableOpacity>
          </View>
          {habitItems.length > 0 ? (
            <HabitChecklist habits={habitItems} />
          ) : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="checkbox-outline" size={28} color={COLORS.textMuted} />
              </View>
              <Text style={styles.emptyText}>Set up your daily habits{'\n'}to start tracking consistency.</Text>
            </View>
          )}
        </View>

        {/* CONQUESTS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONQUESTS</Text>
          {badges.length > 0 ? (
            <View style={styles.badgeGrid}>
              {badges.map((badge) => (
                <View key={badge.name} style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.color }]}>{badge.name}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="trophy-outline" size={28} color={COLORS.textMuted} />
              </View>
              <Text style={styles.emptyText}>Join a tribe conquest to start{'\n'}earning badges.</Text>
            </View>
          )}
        </View>

        {/* MY DISCIPLINES */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>MY DISCIPLINES</Text>
            <TouchableOpacity onPress={() => router.push('/(onboarding)/pick-sports?edit=1')} activeOpacity={0.7}>
              <Text style={styles.sectionAction}>EDIT</Text>
            </TouchableOpacity>
          </View>
          {sports.length > 0 ? (
            <View style={styles.sportsRow}>
              {sports.map((sport) => (
                <View key={sport} style={styles.sportChip}>
                  <Text style={styles.sportText}>{sport}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="hand-left-outline" size={28} color={COLORS.textMuted} />
              </View>
              <Text style={styles.emptyText}>Define your combat or training{'\n'}disciplines to personalize your{'\n'}XP.</Text>
            </View>
          )}
        </View>

        {/* ACCOUNT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <TouchableOpacity style={styles.accountRow} activeOpacity={0.7} onPress={() => router.push('/(tabs)/profile/settings')}>
            <View style={styles.accountIconWrap}>
              <Ionicons name="settings-outline" size={18} color={COLORS.textSecondary} />
            </View>
            <Text style={styles.accountRowText}>SETTINGS & PRIVACY</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.accountRow} activeOpacity={0.7} onPress={toggleTheme}>
            <View style={[styles.accountIconWrap, { backgroundColor: isDark ? 'rgba(232,143,36,0.1)' : 'rgba(86,196,196,0.1)' }]}>
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={isDark ? COLORS.orange : COLORS.aqua} />
            </View>
            <Text style={styles.accountRowText}>{isDark ? 'DARK MODE' : 'LIGHT MODE'}</Text>
            <View style={[styles.themeToggle, !isDark && styles.themeToggleLight]}>
              <View style={[styles.themeToggleDot, !isDark && styles.themeToggleDotLight]} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.accountRow}
            activeOpacity={0.7}
            onPress={() => setShowSignOutModal(true)}
          >
            <View style={[styles.accountIconWrap, { backgroundColor: 'rgba(239,83,80,0.1)' }]}>
              <Ionicons name="log-out-outline" size={18} color="#EF5350" />
            </View>
            <Text style={[styles.accountRowText, { color: '#EF5350' }]}>SIGN OUT</Text>
            <Ionicons name="chevron-forward" size={16} color="rgba(239,83,80,0.4)" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Sign Out Confirmation Modal */}
      <Modal visible={showSignOutModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => !signingOut && setShowSignOutModal(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="log-out-outline" size={32} color="#EF5350" />
            </View>
            <Text style={styles.modalTitle}>Sign Out?</Text>
            <Text style={styles.modalSubtitle}>
              You'll need to sign back in to access your tribe and progress.
            </Text>
            <TouchableOpacity
              style={styles.modalSignOutBtn}
              activeOpacity={0.8}
              onPress={handleSignOut}
              disabled={signingOut}
            >
              <Text style={styles.modalSignOutText}>
                {signingOut ? 'Signing out...' : 'Yes, Sign Out'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              activeOpacity={0.7}
              onPress={() => setShowSignOutModal(false)}
              disabled={signingOut}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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

  /* Profile center */
  profileCenter: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    marginBottom: 10,
    position: 'relative',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.orange,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  profileName: {
    fontSize: 22,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
    letterSpacing: 1.5,
    marginTop: 10,
  },
  profileSubtitle: {
    fontSize: 10,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.textSecondary,
    letterSpacing: 2,
    marginTop: 3,
  },
  communityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(232,143,36,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(232,143,36,0.35)',
  },
  communityBadgeText: {
    fontSize: 11,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.orange,
    letterSpacing: 0.5,
  },

  /* Stats row */
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statCardHighlight: {
    backgroundColor: COLORS.orange,
    borderColor: COLORS.orange,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(232,143,36,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 32,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 9,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.textTertiary,
    letterSpacing: 1,
    marginTop: 2,
  },

  /* Beast Level card */
  beastLevelCard: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  beastLevelTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  beastLevelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  beastLevelCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(232,143,36,0.15)',
    borderWidth: 2,
    borderColor: COLORS.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beastLevelNumber: {
    fontSize: 16,
    fontFamily: FONTS.heading,
    color: COLORS.orange,
  },
  beastLevelTitle: {
    fontSize: 13,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  beastLevelSub: {
    fontSize: 10,
    fontFamily: FONTS.body,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  beastLevelProgress: {
    gap: 4,
  },
  beastLevelXpText: {
    fontSize: 9,
    fontFamily: FONTS.body,
    color: COLORS.textMuted,
    textAlign: 'right',
  },

  /* Sections */
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
    letterSpacing: 1,
    marginBottom: 10,
  },
  sectionAction: {
    fontSize: 11,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.orange,
    letterSpacing: 0.5,
    marginBottom: 10,
  },

  /* Pack card */
  packCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 14,
  },
  packIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(86,196,196,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  packName: {
    fontSize: 14,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
  },
  packSub: {
    fontSize: 11,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
    marginTop: 1,
  },

  /* Goals */
  goalRow: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  goalTitle: {
    fontSize: 12,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.textPrimary,
  },
  goalPct: {
    fontSize: 12,
    fontFamily: FONTS.bodySemiBold,
  },

  /* Empty state cards */
  emptyCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 12,
    fontFamily: FONTS.body,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },

  /* Badges */
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontFamily: FONTS.bodySemiBold,
  },

  /* Sports / Disciplines */
  sportsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sportChip: {
    backgroundColor: 'rgba(232,143,36,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(232,143,36,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  sportText: {
    fontSize: 11,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.orange,
  },

  /* Account rows */
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  accountIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountRowText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },

  /* Theme toggle */
  themeToggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(232,143,36,0.25)',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  themeToggleLight: {
    backgroundColor: 'rgba(86,196,196,0.25)',
  },
  themeToggleDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.orange,
    alignSelf: 'flex-end',
  },
  themeToggleDotLight: {
    backgroundColor: COLORS.aqua,
    alignSelf: 'flex-start',
  },

  /* Coach Dashboard Card */
  coachDashboardCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(232,143,36,0.06)', borderWidth: 1, borderColor: 'rgba(232,143,36,0.2)',
    borderRadius: 14, padding: 14, marginBottom: 20,
  },
  coachDashboardIcon: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(232,143,36,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  coachDashboardTitle: { fontSize: 14, fontFamily: FONTS.heading, color: COLORS.orange },
  coachDashboardSub: { fontSize: 10, fontFamily: FONTS.body, color: COLORS.textTertiary, marginTop: 2 },

  /* Sign Out Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#012A2A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(239,83,80,0.15)',
  },
  modalIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239,83,80,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
    maxWidth: 280,
  },
  modalSignOutBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#EF5350',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalSignOutText: {
    fontSize: 15,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.textPrimary,
  },
  modalCancelBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.textSecondary,
  },
});
