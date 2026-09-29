import React, { useId } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Svg, { Defs, G, Mask, Path, Rect } from 'react-native-svg';
import { BRAND, LOCKUP, PACK_GAP, PACK_LAYOUT, PACK_SIZE, WOLF_PATHS, WOLF_SIZE, WORDMARK_GLYPHS, WORDMARK_SIZE } from './paths';

// Beast Tribe identity ("The Pack"): three of Operation Beast's wolves howling together.
// Journey colours back → front: Dreamer aqua, Seeker orange, Mover (the ink of the surface).
// Source vectors: assets/brand/*.svg (generated from the parent brand's master file).

type Tone = 'journey' | 'mono';

function Wolf({ x, y, s, fill, stroke, strokeWidth }: { x: number; y: number; s: number; fill: string; stroke?: string; strokeWidth?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="miter">
      {WOLF_PATHS.map((d, i) => (
        <Path key={i} d={d} />
      ))}
    </G>
  );
}

/** The pack drawn with real transparent gaps, so it sits cleanly on photos and both boards. */
function PackShapes({ ink, tone, color, id }: { ink: string; tone: Tone; color?: string; id: string }) {
  const [[x1, y1, s1], [x2, y2, s2], [x3, y3, s3]] = PACK_LAYOUT;
  const fills = tone === 'mono' ? [color ?? ink, color ?? ink, color ?? ink] : [BRAND.aqua, BRAND.orange, ink];
  const pad = 20;
  const box = { x: -pad, y: -pad, width: PACK_SIZE.width + pad * 2, height: PACK_SIZE.height + pad * 2 };
  const cut = (x: number, y: number, s: number) => <Wolf x={x} y={y} s={s} fill="#000" stroke="#000" strokeWidth={(2 * PACK_GAP) / s} />;
  return (
    <>
      <Defs>
        <Mask id={`${id}a`} maskUnits="userSpaceOnUse" {...box}>
          <Rect {...box} fill="#fff" />
          {cut(x2, y2, s2)}
          {cut(x3, y3, s3)}
        </Mask>
        <Mask id={`${id}b`} maskUnits="userSpaceOnUse" {...box}>
          <Rect {...box} fill="#fff" />
          {cut(x3, y3, s3)}
        </Mask>
      </Defs>
      <G mask={`url(#${id}a)`}>
        <Wolf x={x1} y={y1} s={s1} fill={fills[0]} />
      </G>
      <G mask={`url(#${id}b)`}>
        <Wolf x={x2} y={y2} s={s2} fill={fills[1]} />
      </G>
      <Wolf x={x3} y={y3} s={s3} fill={fills[2]} />
    </>
  );
}

const useMaskId = () => 'bt' + useId().replace(/[^a-zA-Z0-9]/g, '');

/** The mark alone. `height` sets the size; width follows the pack's proportions. */
export function PackMark({ height, ink, tone = 'journey', color, style }: { height: number; ink: string; tone?: Tone; color?: string; style?: StyleProp<ViewStyle> }) {
  const id = useMaskId();
  const width = (height * PACK_SIZE.width) / PACK_SIZE.height;
  return (
    <View style={style} accessible accessibilityRole="image" accessibilityLabel="Beast Tribe">
      <Svg width={width} height={height} viewBox={`0 0 ${PACK_SIZE.width} ${PACK_SIZE.height}`}>
        <PackShapes ink={ink} tone={tone} color={color} id={id} />
      </Svg>
    </View>
  );
}

/** BEAST TRIBE in the parent logotype's letterforms. `height` is the cap height. */
export function Wordmark({ height, color, style }: { height: number; color: string; style?: StyleProp<ViewStyle> }) {
  const width = (height * WORDMARK_SIZE.width) / WORDMARK_SIZE.height;
  return (
    <View style={style} accessible accessibilityRole="image" accessibilityLabel="Beast Tribe">
      <Svg width={width} height={height} viewBox={`0 0 ${WORDMARK_SIZE.width} ${WORDMARK_SIZE.height}`}>
        <G fill={color}>
          {WORDMARK_GLYPHS.map((g, i) => (
            <Path key={i} d={g.d} transform={`translate(${g.x} ${g.y})`} />
          ))}
        </G>
      </Svg>
    </View>
  );
}

/** Mark + wordmark, left to right (the lockup never mirrors: it is a logo, not text). */
export function Lockup({ height, ink, tone = 'journey', style }: { height: number; ink: string; tone?: Tone; style?: StyleProp<ViewStyle> }) {
  const id = useMaskId();
  const width = (height * LOCKUP.width) / LOCKUP.height;
  return (
    <View style={style} accessible accessibilityRole="image" accessibilityLabel="Beast Tribe">
      <Svg width={width} height={height} viewBox={`0 0 ${LOCKUP.width} ${LOCKUP.height}`}>
        <PackShapes ink={ink} tone={tone} id={id} />
        <G transform={`translate(${LOCKUP.wordX} ${LOCKUP.wordY}) scale(${LOCKUP.wordScale})`} fill={ink}>
          {WORDMARK_GLYPHS.map((g, i) => (
            <Path key={i} d={g.d} transform={`translate(${g.x} ${g.y})`} />
          ))}
        </G>
      </Svg>
    </View>
  );
}

/** One wolf: the parent silhouette, used as the "Beast" reaction glyph. */
export function WolfGlyph({ size, color }: { size: number; color: string }) {
  const h = size;
  const w = (size * WOLF_SIZE.width) / WOLF_SIZE.height;
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${WOLF_SIZE.width} ${WOLF_SIZE.height}`}>
      <G fill={color}>
        {WOLF_PATHS.map((d, i) => (
          <Path key={i} d={d} />
        ))}
      </G>
    </Svg>
  );
}
