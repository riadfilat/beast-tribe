import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useKit } from '../../theme';
import { useI18n } from '../../i18n';
import { useAuth } from '../../providers/AuthProvider';
import { supabase } from '../../lib/supabase';
import { PREVIEW } from '../../data/preview';
import { invalidate } from '../../data/query';
import { cityKeys } from '../../lib/cities';
import { locationStatus, nearestCity, refreshPosition, useMyPosition } from '../../lib/location';
import { Sheet } from './sheet';
import { Txt } from './Txt';
import { Icon } from './Icon';
import { MarkerButton, TextButton } from './controls';

const DISMISSED = 'bt.locationAsk.dismissedAt';
const AGAIN_AFTER = 14 * 86400000;

/**
 * Before the phone's own prompt, say why (the way big apps do): once, on the Board, for members who
 * haven't been asked yet. "Not now" waits two weeks.
 */
export function LocationAsk() {
  const { p } = useKit();
  const { t } = useI18n();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ready = !PREVIEW && !!profile?.onboarding_completed && !!profile?.gender;

  useEffect(() => {
    if (!ready) return;
    let alive = true;
    (async () => {
      if ((await locationStatus()) !== 'undetermined') return;
      const at = Number((await AsyncStorage.getItem(DISMISSED).catch(() => null)) || 0);
      if (alive && Date.now() - at > AGAIN_AFTER) setOpen(true);
    })();
    return () => {
      alive = false;
    };
  }, [ready]);

  async function allow() {
    setBusy(true);
    await refreshPosition(true);
    setBusy(false);
    setOpen(false);
  }
  function later() {
    AsyncStorage.setItem(DISMISSED, String(Date.now())).catch(() => {});
    setOpen(false);
  }

  if (!open) return null;
  return (
    <Sheet visible={open} title={t('location.askTitle')} onClose={later} footer={<MarkerButton label={t('location.allow')} onPress={allow} loading={busy} />}>
      <View style={{ alignItems: 'center', gap: 12, paddingVertical: 6 }}>
        <Icon name="pin" size={34} color={p.marker} />
        <Txt v="body" align="center" color={p.inkSoft}>
          {t('location.askBody')}
        </Txt>
        <TextButton label={t('location.notNow')} onPress={later} color={p.inkSoft} />
      </View>
    </Sheet>
  );
}

/** When the phone's position puts the member in another known city, their profile city follows. */
export function useCitySync() {
  const pos = useMyPosition();
  const { user, profile, refreshProfile } = useAuth();
  useEffect(() => {
    if (PREVIEW || !pos || !user || !profile) return;
    const city = nearestCity(pos);
    if (!city || cityKeys(profile.city).includes(city.toLowerCase())) return;
    supabase
      .from('profiles')
      .update({ city })
      .eq('id', user.id)
      .then(({ error }) => {
        if (error) return;
        invalidate('sessions:');
        invalidate('facilities:');
        refreshProfile();
      });
  }, [pos?.lat, pos?.lng, user?.id, profile?.city]);
}
