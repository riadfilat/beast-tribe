import React, { useState } from 'react';
import { Image, View, ViewStyle } from 'react-native';
import { useKit } from '../../theme';
import { useI18n } from '../../i18n';
import { Txt } from './Txt';

// An animated figure doing the move, from ExerciseDB. Their terms don't allow keeping copies, so the
// animation is loaded from ExerciseDB every time it is shown; if it can't load, the box disappears.
export const demoUrl = (id: string | null | undefined) => (id ? `https://static.exercisedb.dev/media/${id}.gif` : null);

export function MoveDemo({ id, size = 200, style }: { id: string | null | undefined; size?: number; style?: ViewStyle }) {
  const { p } = useKit();
  const { t } = useI18n();
  const [failed, setFailed] = useState(false);
  const uri = demoUrl(id);
  if (!uri || failed) return null;
  return (
    <View style={[{ alignItems: 'center', gap: 4 }, style]}>
      {/* The animations are drawn on white, so they sit on a white card in both themes. */}
      <View style={{ width: size, height: size, borderRadius: 16, backgroundColor: '#FFFFFF', overflow: 'hidden', borderWidth: 1, borderColor: p.rule }}>
        <Image
          source={{ uri }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="contain"
          onError={() => setFailed(true)}
          accessibilityRole="image"
          accessibilityLabel={t('ex.demoLabel')}
        />
      </View>
      <Txt v="caption" size={10} color={p.inkFaint}>
        {t('ex.demoCredit')}
      </Txt>
    </View>
  );
}
