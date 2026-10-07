import React, { useEffect, useId, useRef } from 'react';
import { StyleProp, Text, View, ViewStyle } from 'react-native';
import Animated, { Easing, SharedValue, useAnimatedProps, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, G, Path } from 'react-native-svg';
import { Glyph, GLYPHS } from '../brand/glyphs';
import { Emblem, glyphId, packInitials, PATCH_PAINT } from '../../lib/emblem';

// The pack patch: a round badge in one of the brand colourways carrying the pack's symbol.
// The circle is reserved for patches and the orange marker (DESIGN.md › Shapes).
// Teal, chalk and black grounds get a hairline edge so they never vanish into a board of the same colour.
// Decorative: the pack's name always sits beside it, so screen readers skip the drawing.

const EDGE: Record<string, string> = { '#023C3C': 'rgba(244,241,234,0.32)', '#F4F1EA': 'rgba(2,60,60,0.30)', '#0E1212': 'rgba(244,241,234,0.22)' };
const AnimatedPath = Animated.createAnimatedComponent(Path);

export function Patch({ emblem, name = '', size, style, stitch }: { emblem: Emblem; name?: string; size: number; style?: StyleProp<ViewStyle>; stitch?: SharedValue<number> }) {
  const { ground, ink } = PATCH_PAINT[emblem.color] ?? PATCH_PAINT.slate;
  const edge = EDGE[ground];
  const clipId = 'pc' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const initials = emblem.kind === 'letters' ? packInitials(name) : null;

  if (emblem.kind === 'emoji' || (initials && initials.text)) {
    const arabic = !!initials?.arabic;
    return (
      <View
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: ground, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, edge ? { borderWidth: 1.5, borderColor: edge } : null, style]}
      >
        {emblem.kind === 'emoji' ? (
          <Text allowFontScaling={false} style={{ fontSize: Math.round(size * 0.54), lineHeight: Math.round(size * 0.66), textAlign: 'center' }}>
            {emblem.value}
          </Text>
        ) : (
          <Text
            allowFontScaling={false}
            style={{
              color: ink,
              fontFamily: arabic ? 'NotoKufiArabic-Black' : 'SlamDunk',
              fontSize: Math.round(size * (arabic ? 0.42 : 0.4)),
              lineHeight: Math.round(size * (arabic ? 0.62 : 0.48)),
              marginTop: arabic ? -size * 0.04 : size * 0.02,
              textAlign: 'center',
            }}
          >
            {initials!.text}
          </Text>
        )}
      </View>
    );
  }

  const g = GLYPHS[glyphId(emblem.kind === 'glyph' ? emblem.value : 'wolf')];
  const [tx, ty, s] = g.t;
  const edgeW = (1.5 * 100) / size;
  return (
    <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <ClipPath id={clipId}>
            <Circle cx={50} cy={50} r={50} />
          </ClipPath>
        </Defs>
        <Circle cx={50} cy={50} r={50} fill={ground} />
        <G clipPath={`url(#${clipId})`}>
          <G transform={`translate(${tx} ${ty}) scale(${s})`}>
            {stitch ? <StitchedGlyph glyph={g} ink={ink} stroke={1.6 / ((size * s) / 100)} progress={stitch} /> : <Path d={g.d} fill={ink} fillRule={g.rule} />}
          </G>
        </G>
        {edge ? <Circle cx={50} cy={50} r={50 - edgeW / 2} fill="none" stroke={edge} strokeWidth={edgeW} /> : null}
      </Svg>
    </View>
  );
}

/**
 * The glyph sewn onto the patch: its outline draws itself (stroke-dashoffset from the full
 * outline length to zero), the fill lands as the outline closes, then the outline fades so the
 * finished glyph is exactly the static one.
 */
function StitchedGlyph({ glyph, ink, stroke, progress }: { glyph: Glyph; ink: string; stroke: number; progress: SharedValue<number> }) {
  const len = glyph.len;
  const props = useAnimatedProps(() => {
    const t = progress.value;
    const drawn = Math.min(1, t / 0.7);
    return {
      strokeDashoffset: len * (1 - drawn),
      fillOpacity: Math.min(1, Math.max(0, (t - 0.5) / 0.4)),
      strokeOpacity: 1 - Math.min(1, Math.max(0, (t - 0.85) / 0.15)),
    };
  });
  return <AnimatedPath d={glyph.d} fill={ink} fillRule={glyph.rule} stroke={ink} strokeWidth={stroke} strokeLinejoin="round" strokeDasharray={[len, len]} animatedProps={props} />;
}

/** The big preview while choosing: the patch springs, and a new glyph is stitched on. */
export function PatchPreview({ emblem, name, size }: { emblem: Emblem; name: string; size: number }) {
  const reduce = useReducedMotion();
  const scale = useSharedValue(1);
  const stitch = useSharedValue(1);
  const key = `${emblem.kind}:${emblem.value}:${emblem.color}`;
  const first = useRef(true);
  const canStitch = emblem.kind === 'glyph';
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduce) return;
    scale.value = withSequence(withTiming(0.92, { duration: 80 }), withSpring(1, { damping: 12, stiffness: 240 }));
    if (canStitch) {
      stitch.value = 0;
      stitch.value = withTiming(1, { duration: 950, easing: Easing.out(Easing.cubic) });
    }
  }, [key]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={style}>
      <Patch emblem={emblem} name={name} size={size} stitch={canStitch ? stitch : undefined} />
    </Animated.View>
  );
}
