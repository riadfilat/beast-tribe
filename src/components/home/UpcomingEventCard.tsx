import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONTS } from '../../lib/constants';

interface UpcomingEventCardProps {
  type: string;
  title: string;
  details: string;
  onJoin: () => void;
}

export function UpcomingEventCard({ type, title, details, onJoin }: UpcomingEventCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.type}>{type.toUpperCase()}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.details}>{details}</Text>
      <TouchableOpacity style={styles.joinBtn} onPress={onJoin} activeOpacity={0.7}>
        <Text style={styles.joinText}>Join</Text>
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
  },
  title: {
    fontSize: 13,
    fontFamily: FONTS.heading,
    color: COLORS.white,
    marginTop: 2,
  },
  details: {
    fontSize: 10,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
    lineHeight: 15,
    marginTop: 2,
  },
  joinBtn: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: COLORS.orange,
  },
  joinText: {
    fontSize: 11,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.teal,
  },
});
