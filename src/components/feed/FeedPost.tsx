import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Avatar, TierPill } from '../ui';
import { COLORS, FONTS, Tier } from '../../lib/constants';

interface FeedPostProps {
  name: string;
  tier: Tier;
  content: string;
  timeAgo: string;
  beastCount: number;
  hasBeasted: boolean;
  onBeast: () => void;
}

export function FeedPost({ name, tier, content, timeAgo, beastCount, hasBeasted, onBeast }: FeedPostProps) {
  return (
    <View style={styles.post}>
      <Avatar name={name} size={34} />
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{name}</Text>
          <TierPill tier={tier} size="small" />
        </View>
        <Text style={styles.content}>{content}</Text>
        <Text style={styles.time}>{timeAgo}</Text>
        <TouchableOpacity
          style={[styles.beastBtn, hasBeasted ? styles.beastBtnActive : styles.beastBtnInactive]}
          onPress={onBeast}
          activeOpacity={0.7}
        >
          <Text style={[styles.beastText, hasBeasted ? styles.beastTextActive : styles.beastTextInactive]}>
            {hasBeasted ? `+${beastCount} Beasts` : 'Give Beast'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  post: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  body: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 12,
    fontFamily: FONTS.heading,
    color: COLORS.white,
  },
  content: {
    fontSize: 11,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
    lineHeight: 16,
    marginTop: 3,
  },
  time: {
    fontSize: 9,
    fontFamily: FONTS.body,
    color: COLORS.textTertiary,
    marginTop: 3,
  },
  beastBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginTop: 4,
  },
  beastBtnActive: {
    backgroundColor: 'rgba(232,143,36,0.15)',
    borderWidth: 1,
    borderColor: COLORS.orange,
  },
  beastBtnInactive: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  beastText: {
    fontSize: 10,
    fontFamily: FONTS.bodyMedium,
  },
  beastTextActive: {
    color: COLORS.orange,
  },
  beastTextInactive: {
    color: COLORS.textTertiary,
  },
});
