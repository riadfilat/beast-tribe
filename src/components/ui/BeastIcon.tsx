import React from 'react';
import { Image } from 'react-native';
import { COLORS } from '../../lib/constants';

const BEAST_ICON = require('../../../assets/images/beast-icon.png');

interface BeastIconProps {
  size?: number;
  color?: string;
}

export function BeastIcon({ size = 28, color = COLORS.orange }: BeastIconProps) {
  return (
    <Image
      source={BEAST_ICON}
      tintColor={color}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}
