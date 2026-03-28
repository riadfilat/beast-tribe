import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProgressBar } from '../ui';
import { COLORS, FONTS } from '../../lib/constants';

interface PackChallengeCardProps {
  packAName: string;
  packBName: string;
  packAXP: number;
  packBXP: number;
  daysLeft: number;
  userPackIsA: boolean;
}

export function PackChallengeCard({
  packAName,
  packBName,
  packAXP,
  packBXP,
  daysLeft,
  userPackIsA,
}: PackChallengeCardProps) {
  const total = packAXP + packBXP;
  const progress = total > 0 ? packAXP / total : 0.5;
  const leading = packAXP >= packBXP;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {packAName} vs {packBName}
        </Text>
        <Text style={styles.daysLeft}>{daysLeft} days left</Text>
      </View>
      <ProgressBar progress={progress} color={COLORS.orange} />
      <Text style={styles.detail}>
        Your pack: {(userPackIsA ? packAXP : packBXP).toLocaleString()} XP
        {leading === userPackIsA ? ' — Leading!' : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(232,143,36,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(232,143,36,0.15)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 12,
    fontFamily: FONTS.heading,
    color: COLORS.white,
  },
  daysLeft: {
    fontSize: 9,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.orange,
  },
  detail: {
    fontSize: 9,
    fontFamily: FONTS.body,
    color: COLORS.textTertiary,
    marginTop: 4,
  },
});
