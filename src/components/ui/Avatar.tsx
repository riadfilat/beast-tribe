import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS, FONTS, Tier, TIERS } from '../../lib/constants';
import { getInitials } from '../../utils/format';

interface AvatarProps {
  name: string;
  size?: number;
  tier?: Tier;
  backgroundColor?: string;
  imageUrl?: string;
  localImage?: any;
}

const BG_COLORS = [COLORS.teal, COLORS.orange, COLORS.aqua, COLORS.coral, COLORS.blueGray, COLORS.green];

function hashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return BG_COLORS[Math.abs(hash) % BG_COLORS.length];
}

export function Avatar({ name, size = 32, tier, backgroundColor, imageUrl, localImage }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const bg = backgroundColor || hashColor(name);
  const borderColor = tier ? TIERS[tier].color : 'transparent';
  const hasBorder = !!tier;
  const fontSize = size * 0.35;
  const hasImage = (imageUrl || localImage) && !imgError;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: hasImage ? 'transparent' : bg,
          borderWidth: hasBorder ? 2 : 0,
          borderColor,
        },
      ]}
    >
      {hasImage ? (
        <Image
          source={localImage || { uri: imageUrl }}
          style={{
            width: size - (hasBorder ? 4 : 0),
            height: size - (hasBorder ? 4 : 0),
            borderRadius: (size - (hasBorder ? 4 : 0)) / 2,
          }}
          resizeMode="cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <Text style={[styles.text, { fontSize }]}>{getInitials(name)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  text: {
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.white,
  },
});
