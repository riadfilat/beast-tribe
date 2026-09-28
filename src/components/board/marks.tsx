import React, { useEffect, useState } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Svg, { Line, Polyline } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useKit } from '../../theme';
import { Txt } from './Txt';
import { Icon, IconName } from './Icon';

// ─── Rules ──────────────────────────────────────────────────────────────────
export function Rule({ strong, style }: { strong?: boolean; style?: StyleProp<ViewStyle> }) {
  const { p } = useKit();
  return <View style={[{ height: strong ? 1.5 : 1, backgroundColor: strong ? p.ruleStrong : p.rule }, style]} />;
}

/** Brand zig-zag separator (Guideline p45: "zig-zags as separators"). */
export function ZigZag({ color, height = 8, period = 12, style }: { color?: string; height?: number; period?: number; style?: StyleProp<ViewStyle> }) {
  const { p } = useKit();
  const [w, setW] = useState(0);
  const pts: string[] = [];
  if (w > 0) {
    for (let x = 0, i = 0; x <= w + period; x += period / 2, i++) {
      pts.push(`${x},${i % 2 === 0 ? height - 1 : 1}`);
    }
  }
  return (
    <View style={[{ height }, style]} onLayout={(e) => setW(Math.round(e.nativeEvent.layout.width))}>
      {w > 0 ? (
        <Svg width={w} height={height}>
          <Polyline points={pts.join(' ')} fill="none" stroke={color ?? p.ruleStrong} strokeWidth={1.5} strokeLinejoin="miter" />
        </Svg>
      ) : null}
    </View>
  );
}

// ─── The orange circle ──────────────────────────────────────────────────────
/**
 * The brand's orange circle: marks what is yours, what is live, and the numbers
 * that matter. `rise` animates it up and in (the sun rising behind the time).
 */
export function Sun({
  size,
  color,
  rise = false,
  style,
  children,
}: {
  size: number;
  color?: string;
  rise?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  const { p } = useKit();
  const reduce = useReducedMotion();
  const s = useSharedValue(rise && !reduce ? 0.35 : 1);
  const y = useSharedValue(rise && !reduce ? size * 0.25 : 0);
  const o = useSharedValue(rise && !reduce ? 0 : 1);

  useEffect(() => {
    if (!rise || reduce) {
      s.value = 1;
      y.value = 0;
      o.value = 1;
      return;
    }
    o.value = withTiming(1, { duration: 160 });
    y.value = withSpring(0, { damping: 13, stiffness: 170 });
    s.value = withSpring(1, { damping: 11, stiffness: 190, mass: 0.9 });
  }, [rise, reduce]);

  const anim = useAnimatedStyle(() => ({
    opacity: o.value,
    transform: [{ translateY: y.value }, { scale: s.value }],
  }));

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Animated.View
        style={[
          { position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color ?? p.marker },
          anim,
        ]}
      />
      {children}
    </View>
  );
}

/** Small circle on the rail: hollow for the board, solid orange when it's yours or live. */
export function Node({ state, size = 12 }: { state: 'open' | 'yours' | 'live' | 'past'; size?: number }) {
  const { p } = useKit();
  const reduce = useReducedMotion();
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (state !== 'live' || reduce) return;
    let alive = true;
    const loop = () => {
      if (!alive) return;
      pulse.value = withTiming(1.7, { duration: 900, easing: Easing.out(Easing.quad) }, () => {
        pulse.value = 1;
      });
    };
    loop();
    const id = setInterval(loop, 1400);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [state, reduce]);
  const ring = useAnimatedStyle(() => ({
    opacity: state === 'live' ? Math.max(0, 1.7 - pulse.value) : 0,
    transform: [{ scale: pulse.value }],
  }));
  const solid = state === 'yours' || state === 'live';
  return (
    <View style={{ width: size + 8, height: size + 8, alignItems: 'center', justifyContent: 'center' }}>
      {state === 'live' ? (
        <Animated.View
          style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: p.marker }, ring]}
        />
      ) : null}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: solid ? p.marker : p.board,
          borderWidth: solid ? 0 : 2,
          borderColor: state === 'past' ? p.ghost : p.ruleStrong,
        }}
      />
    </View>
  );
}

// ─── Tally ──────────────────────────────────────────────────────────────────
/**
 * Capacity counted the way a coach counts sign-ups: groups of four uprights and a
 * slash. Open spots show as faint uprights. Falls back to a number past 20.
 */
export function Tally({ count, capacity, size = 14, color }: { count: number; capacity?: number | null; size?: number; color?: string }) {
  const { p } = useKit();
  const ink = color ?? p.ink;
  const total = capacity ? Math.max(capacity, count) : count;
  if (total === 0 || total > 20) return null;
  const gap = Math.round(size * 0.36);
  const groupGap = Math.round(size * 0.55);
  const strokes: { x: number; slash?: boolean; filled: boolean; x0?: number }[] = [];
  let x = 1;
  for (let i = 0; i < total; i++) {
    const inGroup = i % 5;
    if (inGroup === 4) {
      // slash across the previous four
      const start = strokes[strokes.length - 4]?.x ?? x;
      strokes.push({ x, x0: start - 2, slash: true, filled: i < count });
      x += groupGap;
    } else {
      strokes.push({ x, filled: i < count });
      x += gap;
    }
  }
  const width = x + 2;
  return (
    <Svg width={width} height={size}>
      {strokes.map((s, i) =>
        s.slash ? (
          <Line key={i} x1={s.x0!} y1={size - 2} x2={s.x - gap + 2} y2={2} stroke={s.filled ? ink : p.ghost} strokeWidth={2} strokeLinecap="square" />
        ) : (
          <Line key={i} x1={s.x} y1={2} x2={s.x} y2={size - 2} stroke={s.filled ? ink : p.ghost} strokeWidth={2} strokeLinecap="square" />
        ),
      )}
    </Svg>
  );
}

// ─── Tags ───────────────────────────────────────────────────────────────────
export type TagTone = 'ink' | 'marker' | 'aqua' | 'coral' | 'danger' | 'ghost';

export function Tag({ label, tone = 'ink', icon, solid }: { label: string; tone?: TagTone; icon?: IconName; solid?: boolean }) {
  const { p } = useKit();
  const c =
    tone === 'marker' ? p.marker :
    tone === 'aqua' ? p.aqua :
    tone === 'coral' ? p.coral :
    tone === 'danger' ? p.danger :
    tone === 'ghost' ? p.inkFaint : p.inkSoft;
  const fill = solid ? c : 'transparent';
  const text = solid ? (tone === 'marker' ? p.onMarker : p.board) : tone === 'marker' ? p.markerText : c;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderWidth: 1.5,
        borderColor: c,
        backgroundColor: fill,
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 1,
      }}
    >
      {icon ? <Icon name={icon} size={10} color={text} weight="bold" /> : null}
      <Txt v="label" size={11} color={text} style={{ letterSpacing: 0.3 }}>
        {label}
      </Txt>
    </View>
  );
}
