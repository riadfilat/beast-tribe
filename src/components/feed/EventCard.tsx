import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONTS } from '../../lib/constants';

interface EventCardProps {
  type: string;
  typeColor?: string;
  title: string;
  details: string;
  buttonLabel?: string;
  onPress: () => void;
}

export function EventCard({ type, typeColor, title, details, buttonLabel = 'Join', onPress }: EventCardProps) {
  return (
    <View style={styles.card}>
      <Text style={[styles.type, typeColor ? { color: typeColor } : null]}>{type}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.details}>{details}</Text>
      <TouchableOpacity style={styles.btn} onPress={onPress} activeOpacity={0.7}>
        <Text style={styles.btnText}>{buttonLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: 'rgba(232,143,36,0.15)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(232,143,36,0.03)',
  },
  type: {
    fontSize: 9,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.orange,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 13,
    fontFamily: FONTS.heading,
    color: COLORS.white,
    marginTop: 4,
  },
  details: {
    fontSize: 10,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
    lineHeight: 15,
    marginTop: 2,
  },
  btn: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: COLORS.orange,
  },
  btnText: {
    fontSize: 11,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.teal,
  },
});
