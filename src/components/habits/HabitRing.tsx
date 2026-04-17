import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../lib/constants';

interface HabitRingProps {
  icon: string;
  label: string;
  current: number;
  target: number;
  color: string;
  size?: number;
  completed?: boolean;
  onPress?: () => void;
}

export function HabitRing({ icon, label, current, target, color, size = 56, completed, onPress }: HabitRingProps) {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(1, target > 0 ? current / target : 0);
  const strokeDashoffset = circumference * (1 - progress);
  const isComplete = completed || progress >= 1;

  const content = (
    <View style={styles.container}>
      <View style={[styles.ringWrap, { width: size, height: size }]}>
        <Svg width={size} height={size} style={styles.svg}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={isComplete ? color : color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90, ${size / 2}, ${size / 2})`}
            opacity={isComplete ? 1 : 0.7}
          />
        </Svg>
        <View style={styles.iconCenter}>
          {isComplete ? (
            <Ionicons name="checkmark" size={20} color={color} />
          ) : (
            <Ionicons name={icon as any} size={18} color={color} />
          )}
        </View>
      </View>
      <Text style={[styles.label, isComplete && { color }]} numberOfLines={1}>{label}</Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 64,
  },
  ringWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  iconCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 9,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.textTertiary,
    marginTop: 4,
    textAlign: 'center',
  },
});
