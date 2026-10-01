import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { useKit } from '../../theme';
import { Txt } from './Txt';

export interface Person {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

export function initialsOf(name?: string | null): string {
  const clean = (name || '').trim();
  if (!clean) return '·';
  const parts = clean.split(/\s+/).filter(Boolean);
  const first = Array.from(parts[0] || '')[0] || '';
  const second = parts.length > 1 ? Array.from(parts[parts.length - 1])[0] || '' : Array.from(parts[0] || '')[1] || '';
  return (first + second).toUpperCase();
}

// Photos sit on the board under a light wash of brand teal, so faces read as part of the board.
const PHOTO_WASH = 'rgba(2,60,60,0.24)';

/** A name magnet: the squared tag you stick on the class board — a face when there's a photo. Yours is orange. */
export function Magnet({
  person,
  size = 30,
  yours,
  snap,
}: {
  person: Person;
  size?: number;
  yours?: boolean;
  /** animate the magnet snapping onto the board */
  snap?: boolean;
}) {
  const { p } = useKit();
  const reduce = useReducedMotion();
  const [broken, setBroken] = useState(false);
  const y = useSharedValue(snap && !reduce ? -14 : 0);
  const sc = useSharedValue(snap && !reduce ? 1.25 : 1);
  useEffect(() => {
    if (!snap || reduce) return;
    y.value = withSpring(0, { damping: 9, stiffness: 260 });
    sc.value = withSpring(1, { damping: 10, stiffness: 260 });
  }, [snap, reduce]);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }, { scale: sc.value }] }));

  const radius = Math.round(size * 0.22);
  const showPhoto = !!person.avatarUrl && !broken;
  return (
    <Animated.View
      accessible
      accessibilityLabel={person.name}
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: yours ? p.marker : p.wash,
          // Your photo keeps the orange: it rings the face instead of filling the tag.
          borderWidth: yours ? (showPhoto ? Math.max(2, Math.round(size * 0.07)) : 0) : 1.5,
          borderColor: yours ? p.marker : p.ruleStrong,
        },
        anim,
      ]}
    >
      {showPhoto ? (
        <>
          <Image source={{ uri: person.avatarUrl! }} style={{ width: size, height: size }} onError={() => setBroken(true)} />
          <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: PHOTO_WASH }]} />
        </>
      ) : (
        <Txt v="time" size={Math.round(size * 0.36)} color={yours ? p.onMarker : p.ink} style={{ lineHeight: Math.round(size * 0.5) }}>
          {initialsOf(person.name)}
        </Txt>
      )}
    </Animated.View>
  );
}

/** Up to `max` magnets, then a "+N" magnet. */
export function MagnetRow({
  people,
  total,
  max = 5,
  size = 26,
  meId,
  snapId,
}: {
  people: Person[];
  /** total going (may exceed people.length when the list is truncated) */
  total?: number;
  max?: number;
  size?: number;
  meId?: string | null;
  snapId?: string | null;
}) {
  const { p } = useKit();
  // Your own magnet always leads, so "you're in" is visible at a glance.
  const ordered = meId ? [...people.filter((x) => x.id === meId), ...people.filter((x) => x.id !== meId)] : people;
  const shown = ordered.slice(0, max);
  const count = Math.max(total ?? people.length, people.length);
  const extra = count - shown.length;
  if (count === 0) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      {shown.map((person) => (
        <Magnet key={person.id} person={person} size={size} yours={!!meId && person.id === meId} snap={!!snapId && person.id === snapId} />
      ))}
      {extra > 0 ? (
        <View
          style={{
            height: size,
            minWidth: size,
            paddingHorizontal: 5,
            borderRadius: Math.round(size * 0.22),
            borderWidth: 1.5,
            borderColor: p.rule,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Txt v="time" size={Math.round(size * 0.4)} color={p.inkSoft}>
            +{extra}
          </Txt>
        </View>
      ) : null}
    </View>
  );
}
