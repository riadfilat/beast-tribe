import React, { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import { useKit } from '../../theme';
import { useI18n } from '../../i18n';
import { fmtClock, fmtDay } from '../../i18n/format';
import { GuestPreview, guestPreview, joinAsGuest } from '../../data/sessions';
import { Txt } from './Txt';
import { Icon } from './Icon';
import { MarkerButton } from './controls';
import { errorKey } from '../../data/errors';

// Someone outside the community opened a session's guest link: the basics, and one button to join.
export function GuestJoin({ eventId, token, onJoined }: { eventId: string; token: string; onJoined: () => void }) {
  const { p, lang } = useKit();
  const { t } = useI18n();
  const [x, setX] = useState<GuestPreview | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    guestPreview(eventId, token).then(setX).catch(() => setX(null));
  }, [eventId, token]);

  if (x === undefined) return null;
  if (!x) {
    return (
      <Txt v="headline" align="center" style={{ padding: 32 }}>
        {t('guest.invalid')}
      </Txt>
    );
  }

  async function join() {
    setBusy(true);
    setError('');
    try {
      await joinAsGuest(eventId, token);
      onJoined();
    } catch (e: any) {
      setError(t(errorKey('session', e)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ padding: 20, gap: 14 }}>
      {x.imageUrl ? <Image source={{ uri: x.imageUrl }} style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 14, backgroundColor: p.wash }} accessibilityIgnoresInvertColors /> : null}
      <Txt v="label" size={13} color={p.inkSoft}>
        {t('guest.invited', { community: x.community || '' })}
      </Txt>
      <Txt v="hero" size={34}>
        {lang === 'en' ? x.title.toUpperCase() : x.title}
      </Txt>
      <View style={{ gap: 8 }}>
        <Row icon="clock" text={`${fmtDay(x.startsAt, lang, new Date())} · ${fmtClock(x.startsAt, lang)}`} />
        {x.place || x.city ? <Row icon="pin" text={[x.place, x.city].filter(Boolean).join(' · ')} /> : null}
        {x.host ? <Row icon="people" text={t('guest.host', { name: x.host })} /> : null}
        <Row icon="check" text={x.capacity ? t('guest.spots', { going: x.going, capacity: x.capacity }) : t('guest.going', { going: x.going })} />
      </View>
      <MarkerButton label={t('guest.join')} onPress={join} loading={busy} style={{ marginTop: 6 }} />
      {error ? (
        <Txt v="body" color={p.danger}>
          {error}
        </Txt>
      ) : null}
    </View>
  );

  function Row({ icon, text }: { icon: any; text: string }) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Icon name={icon} size={16} color={p.inkSoft} />
        <Txt v="body" style={{ flex: 1 }}>
          {text}
        </Txt>
      </View>
    );
  }
}
