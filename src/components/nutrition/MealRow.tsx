import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../../lib/constants';

interface MealRowProps {
  mealType: string;
  description: string;
  calories: number;
  color: string;
}

export function MealRow({ mealType, description, calories, color }: MealRowProps) {
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View style={styles.info}>
        <Text style={styles.type}>{mealType}</Text>
        <Text style={styles.desc}>{description}</Text>
      </View>
      <Text style={styles.cal}>{calories}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    marginBottom: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  info: {
    flex: 1,
  },
  type: {
    fontSize: 12,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.white,
  },
  desc: {
    fontSize: 10,
    fontFamily: FONTS.body,
    color: COLORS.textTertiary,
  },
  cal: {
    fontSize: 12,
    fontFamily: FONTS.heading,
    color: COLORS.orange,
  },
});
