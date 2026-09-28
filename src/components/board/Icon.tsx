import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Ionicons } from '@expo/vector-icons';
import { useKit } from '../../theme';
import { sportDef } from '../../lib/sports';

// Solid SF Symbols on iOS (bold weight suits the brand's sharp, confident icon rule);
// matching solid Ionicons on Android and web.
const ICONS = {
  board: { sf: 'calendar.day.timeline.leading', ion: 'reader' },
  explore: { sf: 'magnifyingglass', ion: 'search' },
  tribe: { sf: 'person.3.fill', ion: 'people' },
  you: { sf: 'person.crop.circle.fill', ion: 'person-circle' },
  bell: { sf: 'bell.fill', ion: 'notifications' },
  plus: { sf: 'plus', ion: 'add' },
  chevron: { sf: 'chevron.right', ion: 'chevron-forward', dir: true },
  back: { sf: 'chevron.left', ion: 'chevron-back', dir: true },
  close: { sf: 'xmark', ion: 'close' },
  pin: { sf: 'mappin.and.ellipse', ion: 'location' },
  clock: { sf: 'clock.fill', ion: 'time' },
  directions: { sf: 'arrow.triangle.turn.up.right.diamond.fill', ion: 'navigate' },
  chat: { sf: 'bubble.left.and.bubble.right.fill', ion: 'chatbubbles' },
  share: { sf: 'square.and.arrow.up', ion: 'share-outline' },
  lock: { sf: 'lock.fill', ion: 'lock-closed' },
  check: { sf: 'checkmark', ion: 'checkmark' },
  more: { sf: 'ellipsis', ion: 'ellipsis-horizontal' },
  photo: { sf: 'photo.fill', ion: 'image' },
  camera: { sf: 'camera.fill', ion: 'camera' },
  trash: { sf: 'trash.fill', ion: 'trash' },
  flag: { sf: 'flag.fill', ion: 'flag' },
  block: { sf: 'hand.raised.fill', ion: 'hand-left' },
  settings: { sf: 'gearshape.fill', ion: 'settings' },
  globe: { sf: 'globe', ion: 'globe' },
  signOut: { sf: 'rectangle.portrait.and.arrow.right', ion: 'log-out', dir: true },
  nutrition: { sf: 'fork.knife', ion: 'restaurant' },
  coach: { sf: 'figure.strengthtraining.traditional', ion: 'clipboard' },
  calendar: { sf: 'calendar', ion: 'calendar' },
  send: { sf: 'arrow.up', ion: 'arrow-up' },
  key: { sf: 'key.fill', ion: 'key' },
  personAdd: { sf: 'person.badge.plus', ion: 'person-add' },
  info: { sf: 'info.circle.fill', ion: 'information-circle' },
  warning: { sf: 'exclamationmark.triangle.fill', ion: 'warning' },
  hourglass: { sf: 'hourglass', ion: 'hourglass' },
  refresh: { sf: 'arrow.clockwise', ion: 'refresh' },
  doc: { sf: 'doc.text.fill', ion: 'document-text' },
  shield: { sf: 'checkmark.shield.fill', ion: 'shield-checkmark' },
  help: { sf: 'questionmark.circle.fill', ion: 'help-circle' },
  bag: { sf: 'bag.fill', ion: 'bag' },
  people: { sf: 'person.2.fill', ion: 'people' },
  eye: { sf: 'eye.fill', ion: 'eye' },
  eyeOff: { sf: 'eye.slash.fill', ion: 'eye-off' },
  mail: { sf: 'envelope.fill', ion: 'mail' },
  bolt: { sf: 'bolt.fill', ion: 'flash' },
  edit: { sf: 'pencil', ion: 'pencil' },
  contrast: { sf: 'circle.lefthalf.filled', ion: 'contrast' },
  minus: { sf: 'minus', ion: 'remove' },
  sparkle: { sf: 'sparkles', ion: 'sparkles' },
} as const;

export type IconName = keyof typeof ICONS;

interface Props {
  name?: IconName;
  /** Draw a sport glyph instead of a UI icon */
  sport?: string;
  size?: number;
  color?: string;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy';
  style?: StyleProp<ViewStyle>;
}

export function Icon({ name, sport, size = 20, color, weight = 'semibold', style }: Props) {
  const { p, isRTL } = useKit();
  const tint = color ?? p.ink;
  let sf: string;
  let ion: string;
  let dir = false;
  if (sport) {
    const d = sportDef(sport);
    sf = d.sf;
    ion = d.ion;
  } else {
    const d = ICONS[name ?? 'info'] as { sf: string; ion: string; dir?: boolean };
    sf = d.sf;
    ion = d.ion;
    dir = !!d.dir;
  }
  const flip = dir && isRTL ? { transform: [{ scaleX: -1 }] } : null;
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, flip, style]}>
      <SymbolView
        name={sf as any}
        size={size}
        tintColor={tint}
        weight={weight}
        type="monochrome"
        resizeMode="scaleAspectFit"
        fallback={<Ionicons name={ion as any} size={size} color={tint} />}
      />
    </View>
  );
}
