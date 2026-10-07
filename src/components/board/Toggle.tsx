import React, { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useKit } from '../../theme';
import { haptic } from '../../lib/haptics';

const W = 50;
const H = 30;
const KNOB = 26;

/**
 * An on/off switch drawn by the app. The system switch changed size on newer iOS and no longer fits
 * the box React Native gives it (it sat high and ran off the edge), so rows use this one: same size
 * and position on every phone.
 */
export function Toggle({ value, onValueChange, onColor, accessibilityLabel }: { value: boolean; onValueChange?: (v: boolean) => void; onColor?: string; accessibilityLabel?: string }) {
  const { p, lang } = useKit();
  // In Arabic the row is mirrored: the knob starts on the right and slides left.
  const dir = lang === 'ar' ? -1 : 1;
  const x = useSharedValue(value ? 1 : 0);
  useEffect(() => {
    x.value = withTiming(value ? 1 : 0, { duration: 160 });
  }, [value]);
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: dir * x.value * (W - KNOB - 4) }] }), [dir]);
  return (
    <Pressable
      onPress={() => {
        haptic('selection');
        onValueChange?.(!value);
      }}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
      style={{ width: W, height: H, borderRadius: H / 2, padding: 2, justifyContent: 'center', backgroundColor: value ? onColor ?? p.marker : p.ruleStrong }}
    >
      <Animated.View style={[{ width: KNOB, height: KNOB, borderRadius: KNOB / 2, backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 2 }, knob]} />
    </Pressable>
  );
}
