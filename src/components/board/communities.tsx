import React, { useState } from 'react';
import { Image, View } from 'react-native';
import { useKit } from '../../theme';
import { useI18n } from '../../i18n';
import { cityLabel } from '../../lib/cities';
import { Community, CommunityError, joinCommunityByCode, joinOpenCommunity } from '../../data/communities';
import { Txt } from './Txt';
import { Icon } from './Icon';
import { Press } from './Press';
import { Field, OutlineButton } from './controls';
import { toast } from './toast';
import { haptic } from '../../lib/haptics';

/** A community's mark: its logo, or its initial on a squared tile (communities are places, not patches). */
export function CommunityTile({ c, size = 44 }: { c: Community; size?: number }) {
  const { p, f } = useKit();
  if (c.logoUrl) {
    return <Image source={{ uri: c.logoUrl }} style={{ width: size, height: size, borderRadius: size * 0.22, backgroundColor: p.wash }} accessibilityIgnoresInvertColors />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.22, backgroundColor: c.open ? p.wash : p.ink, borderWidth: 1.5, borderColor: c.open ? p.rule : p.ink, alignItems: 'center', justifyContent: 'center' }}>
      <Txt v="time" size={size * 0.42} color={c.open ? p.ink : p.board} style={f.title}>
        {(c.name.trim()[0] || '#').toUpperCase()}
      </Txt>
    </View>
  );
}

/** Tappable when there's somewhere to go; a plain row otherwise (never a dimmed button). */
function Tap({ onPress, style, children }: { onPress?: () => void; style: any; children: React.ReactNode }) {
  if (!onPress) return <View style={style}>{children}</View>;
  return (
    <Press onPress={onPress} feedback="selection" depress={0.99} accessibilityRole="button" style={style}>
      {children}
    </Press>
  );
}

/** One community on a list: tile, name, kind · city · members, and a trailing join or chevron. */
export function CommunityRow({ c, onPress, onJoined, last }: { c: Community; onPress?: () => void; onJoined?: () => void; last?: boolean }) {
  const { p } = useKit();
  const { t, tn, lang } = useI18n();
  const [busy, setBusy] = useState(false);
  const meta = [c.open ? t('community.open') : t('community.private'), c.isDefault ? null : t(`community.kinds.${c.kind}`), cityLabel(c.city, lang), tn('tribe.members', c.members)].filter(Boolean).join(' · ');

  async function join() {
    setBusy(true);
    try {
      await joinOpenCommunity(c.id);
      haptic('success');
      toast.show(t('community.joined', { name: c.name }), 'yours');
      onJoined?.();
    } catch {
      haptic('error');
      toast.show(t('community.errors.generic'), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: last ? 0 : 1, borderBottomColor: p.rule }}>
      <Tap onPress={onPress} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
        <CommunityTile c={c} />
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {!c.open ? <Icon name="lock" size={12} color={p.aqua} /> : null}
            <Txt v="row" size={15} numberOfLines={2} style={{ flexShrink: 1 }}>
              {c.name}
            </Txt>
          </View>
          <Txt v="meta" numberOfLines={1}>
            {meta}
          </Txt>
        </View>
        {c.isMember && onPress ? <Icon name="chevron" size={14} color={p.inkFaint} weight="bold" /> : null}
      </Tap>
      {!c.isMember ? <OutlineButton label={t('community.join')} onPress={join} loading={busy} style={{ height: 38 }} /> : null}
    </View>
  );
}

/** "Have an invite code?" — joins a private community. */
export function JoinCommunityForm({ onJoined }: { onJoined?: (c: { id: string; name: string }) => void }) {
  const { p } = useKit();
  const { t } = useI18n();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function join() {
    if (!code.trim()) return;
    setBusy(true);
    setError('');
    try {
      const c = await joinCommunityByCode(code);
      haptic('success');
      toast.show(t('community.joined', { name: c.name }), 'yours');
      setCode('');
      onJoined?.(c);
    } catch (e: any) {
      haptic('error');
      setError(t(`community.errors.${e instanceof CommunityError ? e.code : 'generic'}`));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: 8 }}>
      <Txt v="title" size={18}>
        {t('community.haveCode')}
      </Txt>
      <Txt v="meta" color={p.inkSoft}>
        {t('community.codeSub')}
      </Txt>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginTop: 4 }}>
        <Field
          containerStyle={{ flex: 1 }}
          value={code}
          onChangeText={(v) => {
            setCode(v.toUpperCase());
            setError('');
          }}
          placeholder={t('community.codePlaceholder')}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={12}
          error={error}
          returnKeyType="go"
          onSubmitEditing={join}
          style={{ letterSpacing: 3 }}
          accessibilityLabel={t('community.codePlaceholder')}
        />
        <OutlineButton label={t('community.join')} onPress={join} loading={busy} disabled={!code.trim()} style={{ height: 52 }} />
      </View>
    </View>
  );
}
