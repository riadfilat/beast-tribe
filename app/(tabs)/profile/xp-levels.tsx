import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, TIERS, Tier } from '../../../src/lib/constants';

const XP_ACTIONS = [
  'Complete a workout: +100-300 XP',
  'Log meals: +50 XP/day',
  'Hit daily step goal: +120 XP',
  'Give 5 Beasts: +30 XP',
  'Complete a quest: +200-500 XP',
  'Win pack challenge: +1,000 XP',
  'Beast Roar winner: +500 XP',
];

const TIER_ORDER: Tier[] = ['raw', 'forged', 'untamed'];

export default function XPLevelsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Beast level system</Text>
        <Text style={styles.subtitle}>Earn XP through workouts, nutrition, and community</Text>

        {TIER_ORDER.map((tier) => {
          const config = TIERS[tier];
          return (
            <View
              key={tier}
              style={[
                styles.tierCard,
                {
                  backgroundColor: config.bgColor,
                  borderColor: config.borderColor || `${config.color}25`,
                },
              ]}
            >
              <Text style={[styles.tierName, { color: config.color }]}>
                {config.label.toUpperCase()} — Levels {config.levels[0]}-{config.levels[1]}
              </Text>
              <Text style={styles.tierTagline}>"{config.tagline}"</Text>
              <Text style={styles.tierXP}>
                {config.xpRange[0].toLocaleString()}
                {config.xpRange[1] === Infinity ? '+' : ` — ${config.xpRange[1].toLocaleString()}`} XP
              </Text>
            </View>
          );
        })}

        <Text style={[styles.sectionLabel, { marginTop: 16 }]}>How to earn XP</Text>
        {XP_ACTIONS.map((action) => (
          <Text key={action} style={styles.xpAction}>{action}</Text>
        ))}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1, paddingHorizontal: 16 },
  title: { fontSize: 20, fontFamily: FONTS.heading, color: COLORS.white, marginTop: 8, textAlign: 'center' },
  subtitle: { fontSize: 12, fontFamily: FONTS.body, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 16 },
  tierCard: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10 },
  tierName: { fontSize: 12, fontFamily: FONTS.heading },
  tierTagline: { fontSize: 11, fontFamily: FONTS.body, color: COLORS.textSecondary, marginTop: 3 },
  tierXP: { fontSize: 9, fontFamily: FONTS.body, color: COLORS.textMuted, marginTop: 4 },
  sectionLabel: { fontSize: 11, fontFamily: FONTS.bodySemiBold, color: COLORS.textSecondary, marginBottom: 8 },
  xpAction: { fontSize: 11, fontFamily: FONTS.body, color: COLORS.textTertiary, lineHeight: 20 },
});
