import React from 'react';
import { StyleProp, Text, TextProps, TextStyle } from 'react-native';
import { useKit } from '../../theme';
import { lh } from '../../theme/type';

/**
 * Board typography.
 * hero    — Slam Dunk (EN) / Noto Kufi Black (AR). Rare: TODAY, the welcome line.
 * stencil — Slam Dunk digits, for the hero time only.
 * title   — Montserrat ExtraBold / Noto Kufi Bold: screen and session titles.
 * row     — row titles (caps in English).
 * time    — Montserrat ExtraBold tabular digits for ordinary times and counts.
 * button  — bold caps (brand CTA style).
 * headline/body/meta/caption/label — the platform face.
 */
export type TxtVariant =
  | 'hero' | 'stencil' | 'title' | 'row' | 'time' | 'button'
  | 'headline' | 'body' | 'meta' | 'caption' | 'label';

const SIZES: Record<TxtVariant, number> = {
  hero: 52, stencil: 44, title: 24, row: 15, time: 20, button: 15,
  headline: 17, body: 16, meta: 13, caption: 12, label: 13,
};

interface Props extends TextProps {
  v?: TxtVariant;
  size?: number;
  color?: string;
  align?: TextStyle['textAlign'];
  style?: StyleProp<TextStyle>;
  children?: React.ReactNode;
}

export function Txt({ v = 'body', size, color, align, style, children, ...rest }: Props) {
  const { p, f, lang } = useKit();
  const ar = lang === 'ar';
  const s = size ?? SIZES[v];
  let base: TextStyle;
  switch (v) {
    case 'hero':
      base = ar
        ? { ...f.heading, fontSize: s * 0.78, lineHeight: lh(s * 0.78, 1.45) }
        : { ...f.heading, fontSize: s, lineHeight: Math.round(s * 1.04), letterSpacing: 0.5 };
      break;
    case 'stencil':
      base = { ...f.stencil, fontSize: s, lineHeight: Math.round(s * 1.02) };
      break;
    case 'title':
      base = { ...f.title, fontSize: s, lineHeight: lh(s, ar ? 1.5 : 1.18) };
      break;
    case 'row':
      base = { ...f.title, ...f.caps, fontSize: s, lineHeight: lh(s, ar ? 1.6 : 1.25), letterSpacing: ar ? 0 : 0.3 };
      break;
    case 'time':
      base = { fontFamily: 'Montserrat-ExtraBold', fontSize: s, lineHeight: Math.round(s * 1.15), fontVariant: ['tabular-nums'] };
      break;
    case 'button':
      base = { ...f.title, ...f.caps, fontSize: s, lineHeight: lh(s, ar ? 1.5 : 1.2), letterSpacing: ar ? 0 : 0.8 };
      break;
    case 'headline':
      base = { ...f.uiSemibold, fontSize: s, lineHeight: lh(s, f.leading) };
      break;
    case 'meta':
      base = { ...f.ui, fontSize: s, lineHeight: lh(s, f.leading) };
      break;
    case 'caption':
      base = { ...f.ui, fontSize: Math.max(11, s), lineHeight: lh(Math.max(11, s), f.leading) };
      break;
    case 'label':
      base = { ...f.uiSemibold, fontSize: s, lineHeight: lh(s, f.leading) };
      break;
    default:
      base = { ...f.ui, fontSize: s, lineHeight: lh(s, f.leading) };
  }
  const tone = color ?? (v === 'meta' || v === 'caption' ? p.inkSoft : p.ink);
  return (
    <Text
      {...rest}
      style={[base, { color: tone, textAlign: align ?? 'auto' }, style]}
    >
      {children}
    </Text>
  );
}
