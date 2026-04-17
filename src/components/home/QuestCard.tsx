import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../lib/constants';

interface QuestCardProps {
  title: string;
  xpReward: number;
  description?: string;
  onComplete?: () => void;
}

export function QuestCard({ title, xpReward, description, onComplete }: QuestCardProps) {
  return (
    <View style={styles.card}>
      {/* Active Challenge tag */}
      <View style={styles.tagRow}>
        <View style={{ flex: 1 }} />
        <View style={styles.tag}>
          <Text style={styles.tagText}>ACTIVE CHALLENGE</Text>
        </View>
      </View>

      {/* Icon + Title */}
      <View style={styles.titleRow}>
        <View style={styles.iconWrap}>
          <Ionicons name="barbell-outline" size={20} color={COLORS.orange} />
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>

      {/* Description */}
      {description ? (
        <Text style={styles.description}>{description}</Text>
      ) : (
        <Text style={styles.description}>
          Push your limits today. High intensity interval training or heavy lifting required.
        </Text>
      )}

      {/* XP + Complete button */}
      <View style={styles.footer}>
        <View style={styles.xpRow}>
          <Ionicons name="flash" size={14} color={COLORS.orange} />
          <Text style={styles.xpText}>{xpReward} XP Bonus</Text>
        </View>
        <TouchableOpacity style={styles.completeBtn} onPress={onComplete} activeOpacity={0.7}>
          <Text style={styles.completeBtnText}>COMPLETE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(232,143,36,0.35)',
    backgroundColor: 'rgba(232,143,36,0.06)',
  },
  tagRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  tag: {
    backgroundColor: COLORS.orange,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 8,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.dark,
    letterSpacing: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(232,143,36,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
    flex: 1,
  },
  description: {
    fontSize: 12,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  xpText: {
    fontSize: 13,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
  },
  completeBtn: {
    backgroundColor: COLORS.orange,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
  },
  completeBtnText: {
    fontSize: 11,
    fontFamily: FONTS.heading,
    color: COLORS.dark,
    letterSpacing: 0.5,
  },
});
