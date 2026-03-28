import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { COLORS, FONTS } from '../../lib/constants';

interface XPLabelProps {
  amount: number;
  style?: TextStyle;
}

export function XPLabel({ amount, style }: XPLabelProps) {
  return <Text style={[styles.label, style]}>+{amount} XP</Text>;
}

const styles = StyleSheet.create({
  label: {
    fontSize: 10,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.aqua,
  },
});
