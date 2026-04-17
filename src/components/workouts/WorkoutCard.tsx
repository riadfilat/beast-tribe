import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../lib/constants';

interface WorkoutCardProps {
  title: string;
  duration: string;
  difficulty: string;
  sport: string;
  xpReward: number;
  onPress?: () => void;
}

const SPORT_ICONS: Record<string, { icon: string; color: string }> = {
  running: { icon: 'walk-outline', color: COLORS.orange },
  gym: { icon: 'barbell-outline', color: COLORS.aqua },
  crossfit: { icon: 'fitness-outline', color: '#EF8C86' },
  cycling: { icon: 'bicycle-outline', color: COLORS.green },
  yoga: { icon: 'body-outline', color: '#759CA9' },
  swimming: { icon: 'water-outline', color: '#4A9EE0' },
  hyrox: { icon: 'flash-outline', color: '#FFD700' },
};

export function WorkoutCard({ title, duration, difficulty, sport, xpReward, onPress }: WorkoutCardProps) {
  const sportKey = sport.toLowerCase();
  const { icon, color } = SPORT_ICONS[sportKey] || { icon: 'barbell-outline', color: COLORS.orange };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Left accent */}
      <View style={[styles.accent, { backgroundColor: color }]} />

      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={[styles.iconWrap, { backgroundColor: `${color}18` }]}>
            <Ionicons name={icon as any} size={20} color={color} />
          </View>
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaChip}>
                <Ionicons name="time-outline" size={11} color={COLORS.textTertiary} />
                <Text style={styles.metaText}>{duration}</Text>
              </View>
              <View style={styles.metaChip}>
                <Ionicons name="speedometer-outline" size={11} color={COLORS.textTertiary} />
                <Text style={styles.metaText}>{difficulty}</Text>
              </View>
              <Text style={[styles.sportLabel, { color }]}>{sport}</Text>
            </View>
          </View>
        </View>

        {/* XP badge + arrow */}
        <View style={styles.bottomRow}>
          <View style={styles.xpBadge}>
            <Ionicons name="flash" size={12} color={COLORS.orange} />
            <Text style={styles.xpText}>+{xpReward} XP</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  accent: {
    width: 4,
  },
  body: {
    flex: 1,
    padding: 14,
  },
  topRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontFamily: FONTS.heading,
    color: COLORS.white,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 10,
    fontFamily: FONTS.body,
    color: COLORS.textTertiary,
  },
  sportLabel: {
    fontSize: 10,
    fontFamily: FONTS.bodySemiBold,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(232,143,36,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  xpText: {
    fontSize: 11,
    fontFamily: FONTS.heading,
    color: COLORS.orange,
  },
});
