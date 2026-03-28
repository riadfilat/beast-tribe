import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../../lib/constants';

interface SportChipProps {
  emoji: string;
  name: string;
  selected: boolean;
  onPress: () => void;
}

export function SportChip({ emoji, name, selected, onPress }: SportChipProps) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {selected && <View style={styles.dot} />}
      <Text style={[styles.emoji, !selected && styles.emojiInactive]}>{emoji}</Text>
      <Text style={[styles.name, selected && styles.nameSelected]}>{name}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  chipSelected: {
    borderColor: COLORS.orange,
    backgroundColor: 'rgba(232,143,36,0.08)',
  },
  dot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.orange,
  },
  emoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  emojiInactive: {
    opacity: 0.3,
  },
  name: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontFamily: FONTS.body,
    textAlign: 'center',
    lineHeight: 12,
  },
  nameSelected: {
    color: COLORS.white,
  },
});
