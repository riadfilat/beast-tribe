import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../lib/constants';

interface SportChipProps {
  emoji?: string;
  icon?: string;
  name: string;
  selected: boolean;
  onPress: () => void;
}

export function SportChip({ emoji, icon, name, selected, onPress }: SportChipProps) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {selected && <View style={styles.dot} />}
      <View style={[styles.iconBox, selected && styles.iconBoxSelected]}>
        {icon ? (
          <Ionicons
            name={icon as any}
            size={22}
            color={selected ? COLORS.orange : COLORS.textTertiary}
          />
        ) : (
          <Text style={[styles.emoji, !selected && styles.emojiInactive]}>{emoji}</Text>
        )}
      </View>
      <Text style={[styles.name, selected && styles.nameSelected]}>{name}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minWidth: 68,
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
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(86,196,196,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconBoxSelected: {
    backgroundColor: 'rgba(232,143,36,0.12)',
  },
  emoji: {
    fontSize: 20,
  },
  emojiInactive: {
    opacity: 0.3,
  },
  name: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontFamily: FONTS.bodySemiBold,
    textAlign: 'center',
    lineHeight: 12,
    letterSpacing: 0.3,
  },
  nameSelected: {
    color: COLORS.orange,
  },
});
