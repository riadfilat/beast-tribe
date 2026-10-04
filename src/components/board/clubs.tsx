import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useKit } from '../../theme';
import { useI18n } from '../../i18n';
import type { Community } from '../../data/communities';
import { ClubListing, updateMyClub } from '../../data/clubs';
import { Txt } from './Txt';
import { Icon } from './Icon';
import { Press } from './Press';
import { Field, MarkerButton, OutlineButton, Segmented } from './controls';
import { Sheet } from './sheet';
import { toast } from './toast';
import { haptic } from '../../lib/haptics';
import { errorKey } from '../../data/errors';

/** "Club leader: Sara · Verified" on a member-run club. */
export function ClubByline({ c, meId }: { c: Community; meId: string | null }) {
  const { p } = useKit();
  const { t } = useI18n();
  if (!c.leaderId) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
      <Icon name="flag" size={12} color={p.marker} />
      <Txt v="label" size={13} color={p.inkSoft}>
        {t('club.ledBy', { name: c.leaderId === meId ? t('common.you') : c.leaderName || t('club.leader') })}
      </Txt>
      {c.verified ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, borderWidth: 1.5, borderColor: p.aqua }}>
          <Icon name="check" size={10} color={p.aqua} />
          <Txt v="label" size={11} color={p.aqua}>
            {t('club.verified')}
          </Txt>
        </View>
      ) : null}
    </View>
  );
}

/** For the leader: where the club stands, and its edit sheet. */
export function ClubLeaderPanel({ c }: { c: Community }) {
  const { p } = useKit();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const status = c.listing === 'public' ? (c.verified ? t('club.statusListed') : t('club.statusPending')) : t('club.statusInvite');
  return (
    <View style={{ marginTop: 14, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: p.marker, gap: 10 }}>
      <Txt v="label" size={12} color={p.markerText}>
        {t('club.yourClub')}
      </Txt>
      <Txt v="body" size={14} color={p.inkSoft}>
        {status}
      </Txt>
      <OutlineButton label={t('club.edit')} icon="edit" onPress={() => setOpen(true)} />
      <ClubEditSheet c={c} visible={open} onClose={() => setOpen(false)} />
    </View>
  );
}

function ClubEditSheet({ c, visible, onClose }: { c: Community; visible: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const [name, setName] = useState(c.name);
  const [description, setDescription] = useState(c.description || '');
  const [notice, setNotice] = useState(c.notice || '');
  const [listing, setListing] = useState<ClubListing>(c.listing);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!visible) return;
    setName(c.name);
    setDescription(c.description || '');
    setNotice(c.notice || '');
    setListing(c.listing);
  }, [visible]);

  async function save() {
    if (name.trim().length < 3) return toast.show(t('club.errors.NAME'), 'error');
    setBusy(true);
    try {
      await updateMyClub(c.id, { name, description, notice, listing });
      haptic('success');
      toast.show(t('club.saved'), 'yours');
      onClose();
    } catch (e: any) {
      toast.show(t(errorKey('club', e)), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet visible={visible} title={t('club.edit')} onClose={onClose} footer={<MarkerButton label={t('common.save')} onPress={save} loading={busy} />}>
      <View style={{ gap: 8 }}>
        <Txt v="title" size={16}>{t('club.name')}</Txt>
        <Field value={name} onChangeText={setName} maxLength={60} />
      </View>
      <View style={{ gap: 8 }}>
        <Txt v="title" size={16}>{t('club.about')}</Txt>
        <Field value={description} onChangeText={setDescription} placeholder={t('club.aboutPlaceholder')} multiline maxLength={400} />
      </View>
      <View style={{ gap: 8 }}>
        <Txt v="title" size={16}>{t('club.notice')}</Txt>
        <Field value={notice} onChangeText={setNotice} placeholder={t('club.noticePlaceholder')} multiline maxLength={280} />
        <Txt v="caption">{t('club.noticeSub')}</Txt>
      </View>
      <View style={{ gap: 8 }}>
        <Txt v="title" size={16}>{t('club.who')}</Txt>
        <Segmented options={[{ value: 'invite', label: t('club.invite') }, { value: 'public', label: t('club.public') }]} value={listing} onChange={setListing} />
        <Txt v="caption">{listing === 'public' ? t('club.publicSub') : t('club.inviteSub')}</Txt>
      </View>
    </Sheet>
  );
}

/** In Tribe › Communities: for a member who could run a club. */
export function StartClubCard() {
  const { p } = useKit();
  const { t } = useI18n();
  const router = useRouter();
  return (
    <Press onPress={() => router.push('/club-new')} feedback="light" accessibilityRole="button" style={{ padding: 16, borderRadius: 12, borderWidth: 1.5, borderColor: p.ruleStrong, borderStyle: 'dashed', gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="flag" size={16} color={p.marker} />
        <Txt v="row" size={15} style={{ flex: 1 }}>
          {t('club.startTitle')}
        </Txt>
        <Icon name="chevron" size={14} color={p.inkFaint} />
      </View>
      <Txt v="caption">{t('club.startSub')}</Txt>
    </Press>
  );
}
