import React from 'react';
import { GestureResponderEvent, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { haptic, HapticKind } from '../../lib/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** Scale while pressed (1 = none) */
  depress?: number;
  feedback?: HapticKind | null;
  children?: React.ReactNode;
}

/** Pressable that gives a physical press: slight depress, spring back, haptic tick. */
export function Press({ style, depress = 0.97, feedback = 'light', onPress, onPressIn, onPressOut, disabled, children, ...rest }: Props) {
  const scale = useSharedValue(1);
  const reduce = useReducedMotion();
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      disabled={disabled}
      onPressIn={(e: GestureResponderEvent) => {
        if (!reduce && depress !== 1) scale.value = withTiming(depress, { duration: 90 });
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        scale.value = reduce ? 1 : withSpring(1, { damping: 14, stiffness: 320 });
        onPressOut?.(e);
      }}
      onPress={(e: GestureResponderEvent) => {
        if (feedback) haptic(feedback);
        onPress?.(e);
      }}
      style={[style, anim, disabled ? { opacity: 0.45 } : null]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
