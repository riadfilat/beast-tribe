import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, ProgressBar } from '../../src/components/ui';
import { StepIndicator } from '../../src/components/onboarding/StepIndicator';
import { BeastScoreCard } from '../../src/components/habits/BeastScoreCard';
import { COLORS, FONTS, TIERS, TIER_ORDER, Tier, XP_REWARDS, HABIT_DEFINITIONS, HABIT_COLORS } from '../../src/lib/constants';
import { useAuth } from '../../src/providers/AuthProvider';
import { calculateLevel, xpForLevel, levelProgress } from '../../src/lib/xp';

/**
 * Estimate starting operation from baseline fitness data.
 */
function estimateOperationFromBaseline(profile: any): Tier {
  if (!profile) return 'initiate';
  let score = 0;

  const fiveK = profile.five_k_time_seconds;
  if (fiveK && fiveK > 0) {
    if (fiveK < 1500) score += 3;
    else if (fiveK < 1800) score += 2;
    else score += 1;
  }

  const bench = profile.max_bench_kg;
  if (bench && bench > 0) {
    if (bench >= 100) score += 3;
    else if (bench >= 70) score += 2;
    else score += 1;
  }

  const steps = profile.daily_steps_avg;
  if (steps && steps > 0) {
    if (steps >= 10000) score += 3;
    else if (steps >= 6000) score += 2;
    else score += 1;
  }

  if (score >= 8) return 'apex';
  if (score >= 5) return 'vanguard';
  return 'initiate';
}

const TIER_ICONS: Record<Tier, string> = {
  initiate: 'flash',
  vanguard: 'shield-half',
  apex: 'flash',
  prime: 'heart',
  beast: 'trophy',
};

const TIER_UNLOCK_LEVELS: Record<Tier, number> = {
  initiate: 1,
  vanguard: 15,
  apex: 35,
  prime: 65,
  beast: 100,
};

export default function BeastLevelScreen() {
  const router = useRouter();
  const { profile, completeOnboarding } = useAuth();
  const [launching, setLaunching] = React.useState(false);

  async function handleLaunch() {
    setLaunching(true);
    try {
      await completeOnboarding();
      router.replace('/(tabs)/home');
    } catch (e) {
      console.warn('Failed to complete onboarding:', e);
    } finally {
      setLaunching(false);
    }
  }
  const assignedTier: Tier = estimateOperationFromBaseline(profile);
  const config = TIERS[assignedTier];

  const totalXP = profile?.total_xp ?? 0;
  const level = calculateLevel(totalXP);
  const progress = levelProgress(totalXP);
  const currentLevelXP = xpForLevel(level);
  const nextLevelXP = xpForLevel(level + 1);
  const xpToNext = nextLevelXP - totalXP;

  const xpActivities = [
    { icon: 'barbell-outline',      color: '#E88F24', label: 'Complete a workout',      reward: `+${XP_REWARDS.workout.min}–${XP_REWARDS.workout.max} XP` },
    { icon: 'star-outline',         color: '#FFD700', label: 'Perfect Day (all habits)', reward: `+${XP_REWARDS.perfectDay} XP` },
    { icon: 'trophy-outline',       color: '#FFD700', label: 'Win a challenge',          reward: `+${XP_REWARDS.packChallengeWin} XP` },
    { icon: 'flame-outline',        color: '#EF8C86', label: '7-Day Streak',             reward: `+${XP_REWARDS.streak * 7} XP` },
    { icon: 'checkbox-outline',     color: '#56C4C4', label: 'Daily quest',              reward: `+${XP_REWARDS.quest.min}–${XP_REWARDS.quest.max} XP` },
    { icon: 'restaurant-outline',   color: '#62B797', label: 'Log a meal',               reward: `+${XP_REWARDS.mealLog} XP` },
    { icon: 'walk-outline',         color: '#56C4C4', label: 'Hit step goal',            reward: `+${XP_REWARDS.dailySteps} XP` },
    { icon: 'flash-outline',        color: '#E88F24', label: 'Give a Beast reaction',    reward: `+${XP_REWARDS.giveBeast} XP` },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StepIndicator currentStep={4} totalSteps={4} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Operation label + Tier badge */}
        <Text style={styles.operationLabel}>{config.label.toUpperCase()}</Text>
        <View style={[styles.tierBadge, { backgroundColor: config.bgColor, borderColor: config.color }]}>
          <Text style={[styles.tierBadgeText, { color: config.color }]}>{config.shortLabel.toUpperCase()}</Text>
        </View>

        {/* Big Level Display */}
        <Text style={styles.levelDisplay}>Lv {level}</Text>

        {/* XP Progress Bar */}
        <View style={styles.xpBarSection}>
          <ProgressBar progress={progress} color={COLORS.orange} height={8} />
          <View style={styles.xpBarLabels}>
            <Text style={styles.xpBarLeft}>{totalXP} XP</Text>
            <Text style={styles.xpBarRight}>{xpToNext} XP TO LV {level + 1}</Text>
          </View>
        </View>

        {/* Level Scale Card */}
        <View style={styles.scaleCard}>
          <View style={styles.scaleHeader}>
            <Text style={styles.scaleLabel}>LEVEL SCALE</Text>
            <Text style={styles.scaleMax}>LV 100</Text>
          </View>
          <View style={styles.scaleTrack}>
            <View style={[styles.scaleThumb, { left: `${Math.min(100, (level / 100) * 100)}%` }]}>
              <View style={styles.scaleThumbDot} />
            </View>
            <View style={styles.scaleTrackBg} />
            <View style={[styles.scaleTrackFill, { width: `${Math.min(100, (level / 100) * 100)}%` }]} />
          </View>
          <View style={styles.scaleMarkers}>
            <Text style={styles.scaleMarkerText}>LV 1</Text>
            <Text style={styles.scaleMarkerText}>LV 25</Text>
            <Text style={styles.scaleMarkerText}>LV 50</Text>
            <Text style={styles.scaleMarkerText}>LV 75</Text>
            <Text style={styles.scaleMarkerText}>LV 100</Text>
          </View>
        </View>

        {/* Operation Tiers */}
        <Text style={styles.sectionTitle}>OPERATION TIERS</Text>
        <View style={styles.tiersList}>
          {TIER_ORDER.map((tier) => {
            const tc = TIERS[tier];
            const isActive = tier === assignedTier;
            const isPast = TIER_ORDER.indexOf(tier) < TIER_ORDER.indexOf(assignedTier);
            const isLocked = !isActive && !isPast;
            const unlockLevel = TIER_UNLOCK_LEVELS[tier];

            return (
              <View
                key={tier}
                style={[
                  styles.tierRow,
                  isActive && { backgroundColor: tc.bgColor, borderColor: tc.color, borderWidth: 1 },
                  !isActive && { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)', borderWidth: 1 },
                ]}
              >
                <View style={[
                  styles.tierIconWrap,
                  { backgroundColor: isActive ? `${tc.color}30` : 'rgba(255,255,255,0.06)' },
                ]}>
                  <Ionicons
                    name={TIER_ICONS[tier] as any}
                    size={18}
                    color={isActive ? tc.color : isLocked ? COLORS.textMuted : `${tc.color}80`}
                  />
                </View>
                <View style={styles.tierInfo}>
                  <Text style={[
                    styles.tierName,
                    { color: isActive ? tc.color : isLocked ? COLORS.textTertiary : `${tc.color}80` },
                  ]}>
                    {tc.shortLabel.toUpperCase()}
                  </Text>
                  <Text style={styles.tierSub}>
                    {isActive ? 'CURRENT STATUS' : `UNLOCKS AT LV ${unlockLevel}`}
                  </Text>
                </View>
                {isActive ? (
                  <View style={[styles.tierCheck, { backgroundColor: tc.color }]}>
                    <Ionicons name="checkmark" size={14} color={COLORS.dark} />
                  </View>
                ) : (
                  <Ionicons name="lock-closed" size={16} color={COLORS.textMuted} />
                )}
              </View>
            );
          })}
        </View>

        {/* How to Earn XP */}
        <Text style={styles.sectionTitle}>HOW TO EARN XP</Text>
        <View style={styles.xpTable}>
          <View style={styles.xpTableHeader}>
            <Text style={styles.xpTableHeaderText}>ACTIVITY</Text>
            <Text style={styles.xpTableHeaderText}>REWARD</Text>
          </View>
          {xpActivities.map((item, i) => (
            <View key={i} style={[styles.xpTableRow, i === xpActivities.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={styles.xpTableActivity}>
                <View style={[styles.xpIconWrap, { backgroundColor: `${item.color}18` }]}>
                  <Ionicons name={item.icon as any} size={16} color={item.color} />
                </View>
                <Text style={styles.xpTableLabel}>{item.label}</Text>
              </View>
              <Text style={styles.xpTableReward}>{item.reward}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 16 }} />

        {/* Beast Score Preview */}
        <Text style={styles.sectionTitle}>HOW BEAST SCORE WORKS</Text>
        <BeastScoreCard
          score={0}
          workoutConsistency={0}
          nutritionConsistency={0}
          stepConsistency={0}
          streakBonus={0}
          eventBonus={0}
        />

        <View style={styles.perfectDayCard}>
          <Ionicons name="star" size={18} color={COLORS.orange} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.perfectDayTitle}>Perfect Day Bonus</Text>
            <Text style={styles.perfectDayText}>Complete all your daily habits = +100 XP</Text>
          </View>
        </View>

        {/* Launch */}
        <View style={{ height: 12 }} />
        <Button
          title={launching ? "Launching..." : "Launch Beast Tribe"}
          onPress={handleLaunch}
          disabled={launching}
        />
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 },

  /* Operation label + tier badge */
  operationLabel: {
    fontSize: 11,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.textSecondary,
    letterSpacing: 2,
    marginTop: 12,
    marginBottom: 8,
  },
  tierBadge: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 4,
  },
  tierBadgeText: {
    fontSize: 10,
    fontFamily: FONTS.heading,
    letterSpacing: 1.5,
  },

  /* Big level */
  levelDisplay: {
    fontSize: 72,
    fontFamily: FONTS.display,
    color: COLORS.orange,
    marginVertical: 4,
    lineHeight: 80,
  },

  /* XP progress bar */
  xpBarSection: {
    width: '100%',
    marginBottom: 20,
  },
  xpBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  xpBarLeft: {
    fontSize: 10,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.textSecondary,
  },
  xpBarRight: {
    fontSize: 10,
    fontFamily: FONTS.body,
    color: COLORS.textTertiary,
  },

  /* Level Scale card */
  scaleCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  scaleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  scaleLabel: {
    fontSize: 12,
    fontFamily: FONTS.heading,
    color: COLORS.white,
    fontStyle: 'italic',
  },
  scaleMax: {
    fontSize: 20,
    fontFamily: FONTS.heading,
    color: COLORS.white,
  },
  scaleTrack: {
    height: 6,
    borderRadius: 3,
    position: 'relative',
    marginBottom: 10,
  },
  scaleTrackBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  scaleTrackFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.orange,
  },
  scaleThumb: {
    position: 'absolute',
    top: -4,
    marginLeft: -7,
    zIndex: 2,
  },
  scaleThumbDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.orange,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  scaleMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scaleMarkerText: {
    fontSize: 8,
    fontFamily: FONTS.body,
    color: COLORS.textMuted,
  },

  /* Operation Tiers */
  sectionTitle: {
    fontSize: 14,
    fontFamily: FONTS.heading,
    color: COLORS.white,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  tiersList: {
    width: '100%',
    gap: 8,
    marginBottom: 24,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  tierIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierInfo: {
    flex: 1,
  },
  tierName: {
    fontSize: 13,
    fontFamily: FONTS.heading,
    letterSpacing: 0.5,
  },
  tierSub: {
    fontSize: 9,
    fontFamily: FONTS.body,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  tierCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Perfect Day */
  perfectDayCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(232,143,36,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(232,143,36,0.25)',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    marginBottom: 8,
  },
  perfectDayTitle: {
    fontSize: 13,
    fontFamily: FONTS.heading,
    color: COLORS.orange,
  },
  perfectDayText: {
    fontSize: 11,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  /* XP Table */
  xpTable: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    marginBottom: 8,
  },
  xpTableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  xpTableHeaderText: {
    fontSize: 9,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  xpTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  xpTableActivity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  xpIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  xpTableLabel: {
    fontSize: 12,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.white,
  },
  xpTableReward: {
    fontSize: 12,
    fontFamily: FONTS.heading,
    color: COLORS.orange,
  },
});
