import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, TierPill } from '../../src/components/ui';
import { StepIndicator } from '../../src/components/onboarding/StepIndicator';
import { COLORS, FONTS, TIERS, Tier } from '../../src/lib/constants';
import { useAuth } from '../../src/providers/AuthProvider';

/**
 * Estimate tier from baseline fitness data.
 * Uses a simple scoring system based on available metrics.
 */
function estimateTierFromBaseline(profile: any): Tier {
  if (!profile) return 'raw';
  let score = 0;

  // 5K time scoring (seconds): <25min=advanced, <30min=intermediate, else beginner
  const fiveK = profile.five_k_time_seconds;
  if (fiveK && fiveK > 0) {
    if (fiveK < 1500) score += 3;       // sub-25 min
    else if (fiveK < 1800) score += 2;  // sub-30 min
    else score += 1;
  }

  // Bench press scoring: >100kg=advanced, >70kg=intermediate
  const bench = profile.max_bench_kg;
  if (bench && bench > 0) {
    if (bench >= 100) score += 3;
    else if (bench >= 70) score += 2;
    else score += 1;
  }

  // Daily steps scoring: >10k=advanced, >6k=intermediate
  const steps = profile.daily_steps_avg;
  if (steps && steps > 0) {
    if (steps >= 10000) score += 3;
    else if (steps >= 6000) score += 2;
    else score += 1;
  }

  // Map score to tier
  if (score >= 7) return 'untamed';
  if (score >= 3) return 'forged';
  return 'raw';
}

export default function BeastLevelScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const assignedTier: Tier = estimateTierFromBaseline(profile);
  const config = TIERS[assignedTier];

  return (
    <SafeAreaView style={styles.container}>
      <StepIndicator currentStep={4} totalSteps={5} />
      <View style={styles.content}>
        {/* Avatar circle */}
        <View style={[styles.avatar, { borderColor: config.color, backgroundColor: `${config.color}15` }]}>
          <Text style={[styles.avatarText, { color: config.color }]}>
            {(profile?.full_name || 'B').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
          </Text>
        </View>

        <Text style={styles.title}>You're {config.label}</Text>
        <TierPill tier={assignedTier} size="medium" />

        <Text style={styles.description}>{config.tagline}. The tribe pushes you further.</Text>

        {/* Tier progression */}
        <View style={styles.tierRow}>
          {(['raw', 'forged', 'untamed'] as Tier[]).map((tier, i) => (
            <React.Fragment key={tier}>
              {i > 0 && <Text style={styles.arrow}>→</Text>}
              <View
                style={[
                  styles.tierDot,
                  {
                    backgroundColor: TIERS[tier].bgColor,
                    borderWidth: tier === assignedTier ? 1 : 0,
                    borderColor: TIERS[tier].color,
                  },
                ]}
              >
                <Text style={[styles.tierDotText, { color: TIERS[tier].color }]}>
                  {TIERS[tier].label}
                </Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        <Text style={styles.note}>Based on your experience and goals</Text>

        <Button title="Continue" onPress={() => router.push('/(onboarding)/connect-devices')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 24,
    fontFamily: FONTS.heading,
  },
  title: {
    fontSize: 22,
    fontFamily: FONTS.heading,
    color: COLORS.white,
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 20,
    lineHeight: 20,
    maxWidth: 260,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  arrow: {
    color: 'rgba(255,255,255,0.12)',
    fontSize: 16,
  },
  tierDot: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tierDotText: {
    fontSize: 10,
    fontFamily: FONTS.bodySemiBold,
  },
  note: {
    fontSize: 10,
    fontFamily: FONTS.body,
    color: COLORS.textTertiary,
    marginBottom: 20,
  },
});
