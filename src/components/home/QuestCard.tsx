import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../../lib/constants';

interface QuestCardProps {
  title: string;
  xpReward: number;
}

export function QuestCard({ title, xpReward }: QuestCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>TODAY'S CHALLENGE</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.xp}>+{xpReward} XP bonus</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(232,143,36,0.2)',
    backgroundColor: 'rgba(232,143,36,0.04)',
  },
  label: {
    fontSize: 9,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.orange,
    letterSpacing: 1,
  },
  title: {
    fontSize: 14,
    fontFamily: FONTS.heading,
    color: COLORS.white,
    marginTop: 4,
  },
  xp: {
    fontSize: 11,
    fontFamily: FONTS.body,
    color: COLORS.aqua,
    marginTop: 2,
  },
});
