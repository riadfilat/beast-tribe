import React, { useEffect } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import { create } from 'zustand';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKit } from '../../theme';
import { Txt } from './Txt';
import { Icon } from './Icon';

type Tone = 'yours' | 'info' | 'error';
interface ToastState {
  message: string | null;
  tone: Tone;
  key: number;
  show: (message: string, tone?: Tone) => void;
  hide: () => void;
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  tone: 'info',
  key: 0,
  show: (message, tone = 'info') => {
    AccessibilityInfo.announceForAccessibility?.(message);
    set((s) => ({ message, tone, key: s.key + 1 }));
  },
  hide: () => set({ message: null }),
}));

export const toast = {
  show: (m: string, tone?: Tone) => useToast.getState().show(m, tone),
};

export function ToastHost() {
  const { p } = useKit();
  const insets = useSafeAreaInsets();
  const reduce = useReducedMotion();
  const { message, tone, key, hide } = useToast();
  const y = useSharedValue(-120);

  useEffect(() => {
    if (!message) {
      y.value = reduce ? -120 : withTiming(-120, { duration: 200 });
      return;
    }
    y.value = reduce ? 0 : withSpring(0, { damping: 16, stiffness: 220 });
    const id = setTimeout(hide, 2800);
    return () => clearTimeout(id);
  }, [message, key]);

  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const accent = tone === 'error' ? p.danger : tone === 'yours' ? p.marker : p.aqua;

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', top: insets.top + 6, start: 14, end: 14, zIndex: 999 }, anim]}
    >
      {message ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            backgroundColor: p.sheet,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: p.rule,
            paddingHorizontal: 14,
            paddingVertical: 12,
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 8 },
            elevation: 8,
          }}
        >
          {tone === 'yours' ? (
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: p.marker, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="check" size={13} color={p.onMarker} weight="bold" />
            </View>
          ) : (
            <Icon name={tone === 'error' ? 'warning' : 'info'} size={20} color={accent} />
          )}
          <Txt v="label" size={15} style={{ flex: 1 }}>
            {message}
          </Txt>
        </View>
      ) : null}
    </Animated.View>
  );
}
