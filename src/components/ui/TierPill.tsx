import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Tier, TIERS, FONTS } from '../../lib/constants';

interface TierPillProps {
  tier: Tier;
  size?: 'small' | 'medium';
  showLevel?: boolean;
  level?: number;
}

export function TierPill({ tier, size = 'small', showLevel, level }: TierPillProps) {
  const config = TIERS[tier];
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: config.bgColor,
          borderColor: config.borderColor || 'transparent',
          borderWidth: config.borderColor ? 1 : 0,
          paddingHorizontal: isSmall ? 10 : 14,
          paddingVertical: isSmall ? 2 : 4,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: config.color,
            fontSize: isSmall ? 9 : 11,
          },
        ]}
      >
        {config.label.toUpperCase()}
        {showLevel && level ? ` — Level ${level}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: FONTS.bodySemiBold,
    letterSpacing: 0.5,
  },
});
