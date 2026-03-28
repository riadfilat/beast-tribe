import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, Tier, TIERS } from '../../lib/constants';
import { getInitials } from '../../utils/format';

interface AvatarProps {
  name: string;
  size?: number;
  tier?: Tier;
  backgroundColor?: string;
}

const BG_COLORS = [COLORS.teal, COLORS.orange, COLORS.aqua, COLORS.coral, COLORS.blueGray, COLORS.green];

function hashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return BG_COLORS[Math.abs(hash) % BG_COLORS.length];
}

export function Avatar({ name, size = 32, tier, backgroundColor }: AvatarProps) {
  const bg = backgroundColor || hashColor(name);
  const borderColor = tier ? TIERS[tier].color : 'transparent';
  const hasBorder = !!tier;
  const fontSize = size * 0.35;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          borderWidth: hasBorder ? 2 : 0,
          borderColor,
        },
      ]}
    >
      <Text style={[styles.text, { fontSize }]}>{getInitials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.white,
  },
});
