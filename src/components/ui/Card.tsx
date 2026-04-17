import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '../../lib/constants';

type CardVariant = 'default' | 'quest' | 'event' | 'stat';

interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  style?: ViewStyle;
}

export function Card({ children, variant = 'default', style }: CardProps) {
  return <View style={[styles.base, variantStyles[variant], style]}>{children}</View>;
}

const variantStyles: Record<CardVariant, ViewStyle> = {
  default: {
    backgroundColor: COLORS.cardBg,
    borderColor: COLORS.cardBorder,
    borderWidth: 1,
  },
  quest: {
    backgroundColor: 'rgba(232,143,36,0.07)',
    borderColor: 'rgba(232,143,36,0.28)',
    borderWidth: 1,
  },
  event: {
    backgroundColor: 'rgba(232,143,36,0.05)',
    borderColor: 'rgba(232,143,36,0.22)',
    borderWidth: 1,
  },
  stat: {
    backgroundColor: COLORS.statCardBg,
    borderColor: COLORS.statCardBorder,
    borderWidth: 1,
  },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
});
