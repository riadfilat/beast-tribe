import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from '../../../src/components/ui';
import { COLORS, FONTS, TIERS, TIER_ORDER, XP_REWARDS, type Tier } from '../../../src/lib/constants';
import {
  calculateLevel,
  calculateTier,
  levelProgress,
  xpForLevel,
  xpToNextTier,
  tierProgress,
} from '../../../src/lib/xp';
import { useProfile } from '../../../src/hooks';
import { formatXP } from '../../../src/utils/format';

const DEMO_XP = 0;

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

const XP_ACTIVITIES: { icon: string; color: string; label: string; reward: string }[] = [
  { icon: 'barbell-outline', color: COLORS.orange, label: 'Complete a workout', reward: `+${XP_REWARDS.workout.min}–${XP_REWARDS.workout.max} XP` },
  { icon: 'star-outline', color: COLORS.orange, label: 'Perfect Day (all habits)', reward: `+${XP_REWARDS.perfectDay} XP` },
  { icon: 'trophy-outline', color: '#FFD700', label: 'Win a challenge', reward: `+${XP_REWARDS.packChallengeWin} XP` },
  { icon: 'flame-outline', color: '#EF8C86', label: '7-Day Streak', reward: `+${XP_REWARDS.streak * 7} XP` },
  { icon: 'clipboard-outline', color: COLORS.aqua, label: 'Daily quest', reward: `+${XP_REWARDS.quest.min}–${XP_REWARDS.quest.max} XP` },
  { icon: 'nutrition-outline', color: COLORS.green, label: 'Log a meal', reward: `+${XP_REWARDS.mealLog} XP` },
  { icon: 'footsteps-outline', color: '#759CA9', label: 'Hit step goal', reward: `+${XP_REWARDS.dailySteps} XP` },
  { icon: 'flash-outline', color: COLORS.orange, label: 'Give a Beast reaction', reward: `+${XP_REWARDS.giveBeast} XP` },
  { icon: 'megaphone-outline', color: '#FFD700', label: 'Beast Roar winner', reward: `+${XP_REWARDS.beastRoarWinner} XP` },
];

export default function LevelsScreen() {
  const router = useRouter();
  const { profile } = useProfile();

  const totalXP = profile?.total_xp ?? DEMO_XP;
  const currentTier = calculateTier(totalXP) as Tier;
  const currentLevel = calculateLevel(totalXP);
  const lvProgress = levelProgress(totalXP);
  const tierIdx = TIER_ORDER.indexOf(currentTier);
  const nextTier = tierIdx < TIER_ORDER.length - 1 ? TIER_ORDER[tierIdx + 1] : null;
  const xpNeeded = xpToNextTier(totalXP);
  const tierProg = tierProgress(totalXP);
  const tierConfig = TIERS[currentTier] || TIERS.initiate;

  const currentLvXP = xpForLevel(currentLevel);
  const nextLvXP = xpForLevel(currentLevel + 1);
  const xpToNextLevel = nextLvXP - totalXP;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/home');
            }
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Beast Level</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Operation label + Tier badge ── */}
        <Text style={[styles.operationLabel, { color: tierConfig.color }]}>
          {tierConfig.label.toUpperCase()}
        </Text>
        <View style={[styles.tierBadge, { backgroundColor: tierConfig.bgColor, borderColor: tierConfig.color }]}>
          <Text style={[styles.tierBadgeText, { color: tierConfig.color }]}>
            {tierConfig.shortLabel.toUpperCase()}
          </Text>
        </View>

        {/* ── Big Level Display ── */}
        <Text style={styles.levelDisplay}>Lv {currentLevel}</Text>

        {/* ── XP Progress Bar ── */}
        <View style={styles.xpBarSection}>
          <ProgressBar progress={lvProgress} color={COLORS.orange} height={8} />
          <View style={styles.xpBarLabels}>
            <Text style={styles.xpBarLeft}>{formatXP(totalXP)} XP</Text>
            <Text style={styles.xpBarRight}>{xpToNextLevel} XP TO LV {currentLevel + 1}</Text>
          </View>
        </View>

        {/* ── Level Scale Card ── */}
        <View style={styles.scaleCard}>
          <View style={styles.scaleHeader}>
            <Text style={styles.scaleLabel}>LEVEL SCALE</Text>
            <Text style={styles.scaleMax}>LV 100</Text>
          </View>
          <View style={styles.scaleTrack}>
            <View style={styles.scaleTrackBg} />
            <View style={[styles.scaleTrackFill, { width: `${Math.min(100, (currentLevel / 100) * 100)}%` }]} />
            <View style={[styles.scaleThumb, { left: `${Math.min(100, (currentLevel / 100) * 100)}%` }]}>
              <View style={styles.scaleThumbDot} />
            </View>
          </View>
          <View style={styles.scaleMarkers}>
            <Text style={styles.scaleMarkerText}>LV 1</Text>
            <Text style={styles.scaleMarkerText}>LV 25</Text>
            <Text style={styles.scaleMarkerText}>LV 50</Text>
            <Text style={styles.scaleMarkerText}>LV 75</Text>
            <Text style={styles.scaleMarkerText}>LV 100</Text>
          </View>
          {/* Milestone XP values */}
          <View style={styles.milestoneRow}>
            {[10, 25, 50, 75, 100].map(lv => (
              <View key={lv} style={styles.milestoneItem}>
                <Text style={[styles.milestoneLv, currentLevel >= lv && { color: COLORS.orange }]}>{lv}</Text>
                <Text style={styles.milestoneXP}>{formatXP(xpForLevel(lv))}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Operation Tiers ── */}
        <Text style={styles.sectionTitle}>OPERATION TIERS</Text>
        <View style={styles.tiersList}>
          {TIER_ORDER.map((tier) => {
            const tc = TIERS[tier];
            const isActive = tier === currentTier;
            const isPast = TIER_ORDER.indexOf(tier) < tierIdx;
            const isLocked = !isActive && !isPast;
            const unlockLevel = TIER_UNLOCK_LEVELS[tier];

            return (
              <View
                key={tier}
                style={[
                  styles.tierRow,
                  isActive && { backgroundColor: tc.bgColor, borderColor: tc.color, borderWidth: 1.5 },
                  !isActive && { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)', borderWidth: 1 },
                ]}
              >
                <View style={[
                  styles.tierIconWrap,
                  { backgroundColor: isActive ? `${tc.color}30` : isPast ? `${tc.color}15` : 'rgba(255,255,255,0.06)' },
                ]}>
                  <Ionicons
                    name={TIER_ICONS[tier] as any}
                    size={18}
                    color={isActive ? tc.color : isPast ? `${tc.color}80` : COLORS.textMuted}
                  />
                </View>
                <View style={styles.tierInfo}>
                  <Text style={[
                    styles.tierName,
                    { color: isActive ? tc.color : isPast ? COLORS.white : COLORS.textTertiary },
                  ]}>
                    {tc.shortLabel.toUpperCase()}
                  </Text>
                  <Text style={styles.tierSub}>
                    {isActive ? 'CURRENT STATUS' : isPast ? 'COMPLETED' : `UNLOCKS AT LV ${unlockLevel}`}
                  </Text>
                  {/* XP range */}
                  <Text style={[styles.tierXpRange, { color: isActive ? tc.color : COLORS.textMuted }]}>
                    {tc.xpRange[1] === Infinity
                      ? `${formatXP(tc.xpRange[0])}+ XP`
                      : `${formatXP(tc.xpRange[0])} – ${formatXP(tc.xpRange[1])} XP`}
                  </Text>
                  {/* Progress bar for current tier */}
                  {isActive && nextTier && (
                    <View style={styles.tierProgressWrap}>
                      <ProgressBar progress={tierProg} color={tc.color} height={4} />
                      <Text style={[styles.tierProgressText, { color: tc.color }]}>
                        {formatXP(xpNeeded)} XP to {TIERS[nextTier].shortLabel}
                      </Text>
                    </View>
                  )}
                </View>
                {isActive ? (
                  <View style={[styles.tierCheck, { backgroundColor: tc.color }]}>
                    <Ionicons name="checkmark" size={14} color={COLORS.dark} />
                  </View>
                ) : isPast ? (
                  <View style={[styles.tierCheck, { backgroundColor: `${tc.color}40` }]}>
                    <Ionicons name="checkmark" size={14} color={tc.color} />
                  </View>
                ) : (
                  <Ionicons name="lock-closed" size={16} color={COLORS.textMuted} />
                )}
              </View>
            );
          })}
        </View>

        {/* ── How to Earn XP ── */}
        <Text style={styles.sectionTitle}>HOW TO EARN XP</Text>
        <View style={styles.xpTable}>
          <View style={styles.xpTableHeader}>
            <Text style={styles.xpTableHeaderText}>ACTIVITY</Text>
            <Text style={styles.xpTableHeaderText}>REWARD</Text>
          </View>
          {XP_ACTIVITIES.map((item, i) => (
            <View key={i} style={[styles.xpTableRow, i === XP_ACTIVITIES.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={styles.xpTableActivity}>
                <View style={[styles.xpTableIconWrap, { backgroundColor: `${item.color}18` }]}>
                  <Ionicons name={item.icon as any} size={16} color={item.color} />
                </View>
                <Text style={styles.xpTableLabel}>{item.label}</Text>
              </View>
              <Text style={styles.xpTableReward}>{item.reward}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  pageTitle: { fontSize: 16, fontFamily: FONTS.heading, color: COLORS.white },

  content: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 8 },

  /* Operation label + tier badge */
  operationLabel: {
    fontSize: 11,
    fontFamily: FONTS.bodySemiBold,
    letterSpacing: 2,
    marginTop: 8,
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

  /* XP bar */
  xpBarSection: {
    width: '100%',
    marginBottom: 24,
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
    marginBottom: 28,
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
    color: COLORS.textPrimary,
    fontStyle: 'italic',
  },
  scaleMax: {
    fontSize: 20,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
  },
  scaleTrack: {
    height: 6,
    borderRadius: 3,
    position: 'relative',
    marginBottom: 10,
  },
  scaleTrackBg: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)',
  },
  scaleTrackFill: {
    position: 'absolute', top: 0, left: 0,
    height: 6, borderRadius: 3, backgroundColor: COLORS.orange,
  },
  scaleThumb: {
    position: 'absolute', top: -4, marginLeft: -7, zIndex: 2,
  },
  scaleThumbDot: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: COLORS.orange, borderWidth: 2, borderColor: COLORS.background,
  },
  scaleMarkers: {
    flexDirection: 'row', justifyContent: 'space-between',
  },
  scaleMarkerText: {
    fontSize: 8, fontFamily: FONTS.body, color: COLORS.textMuted,
  },
  milestoneRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 10,
  },
  milestoneItem: { alignItems: 'center' },
  milestoneLv: {
    fontSize: 13, fontFamily: FONTS.heading, color: COLORS.textMuted, marginBottom: 2,
  },
  milestoneXP: {
    fontSize: 8, fontFamily: FONTS.body, color: COLORS.textMuted,
  },

  /* Section title */
  sectionTitle: {
    fontSize: 14,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },

  /* Operation Tiers */
  tiersList: {
    width: '100%',
    gap: 8,
    marginBottom: 28,
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
    width: 40,
    height: 40,
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
  tierXpRange: {
    fontSize: 9,
    fontFamily: FONTS.bodyMedium,
    marginTop: 3,
  },
  tierProgressWrap: {
    marginTop: 6,
  },
  tierProgressText: {
    fontSize: 8,
    fontFamily: FONTS.body,
    marginTop: 3,
  },
  tierCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* XP Table */
  xpTable: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
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
  xpTableIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  xpTableLabel: {
    fontSize: 12,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.textPrimary,
  },
  xpTableReward: {
    fontSize: 12,
    fontFamily: FONTS.heading,
    color: COLORS.orange,
  },
});
