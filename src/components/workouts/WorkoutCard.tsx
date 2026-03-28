import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONTS } from '../../lib/constants';

interface WorkoutCardProps {
  title: string;
  duration: string;
  difficulty: string;
  sport: string;
  xpReward: number;
  onPress?: () => void;
}

export function WorkoutCard({ title, duration, difficulty, sport, xpReward, onPress }: WorkoutCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.imageArea}>
        <View style={styles.xpBadge}>
          <Text style={styles.xpText}>+{xpReward} XP</Text>
        </View>
        <Text style={styles.placeholder}>Workout preview</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.meta}>
        <Text style={styles.metaText}>{duration}</Text>
        <Text style={styles.metaText}>{difficulty}</Text>
        <Text style={styles.metaText}>{sport}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
  },
  imageArea: {
    height: 60,
    backgroundColor: 'rgba(86,196,196,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  xpBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: COLORS.orange,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  xpText: {
    fontSize: 9,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.teal,
  },
  placeholder: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontFamily: FONTS.body,
  },
  title: {
    fontSize: 13,
    fontFamily: FONTS.heading,
    color: COLORS.white,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  meta: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  metaText: {
    fontSize: 10,
    fontFamily: FONTS.body,
    color: COLORS.textTertiary,
  },
});
