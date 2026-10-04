import React, { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { makeStyles, useKit } from '../src/theme';
import { useI18n } from '../src/i18n';
import { useAuth } from '../src/providers/AuthProvider';
import { PREVIEW, PREVIEW_ME } from '../src/data/preview';
import { useMySports } from '../src/data/member';
import { useMySessions } from '../src/data/sessions';
import { fmtPace, invitePartner, Partner, PartnerProfile, PARTNER_TIMES, PartnerTime, savePartnerProfile, usePartnerProfile, usePartners } from '../src/data/matching';
import { fmtDay, fmtClock } from '../src/i18n/format';
import { Txt } from '../src/components/board/Txt';
import { Icon } from '../src/components/board/Icon';
import { Press } from '../src/components/board/Press';
import { Magnet } from '../src/components/board/people';
import { Chip, Field, IconButton, MarkerButton, OutlineButton, SectionHeading } from '../src/components/board/controls';
import { Group, GroupRow } from '../src/components/board/list';
import { Sheet } from '../src/components/board/sheet';
import { toast } from '../src/components/board/toast';
import { haptic } from '../src/lib/haptics';
import { errorKey } from '../src/data/errors';

const PACES = [270, 300, 330, 360, 390, 420];

// Training partners: opt in, then see people of a similar level who train when you do.
export default function PartnersScreen() {
  const s = useStyles();
  const { t } = useI18n();
  const router = useRouter();
  const mine = usePartnerProfile();
  const [editing, setEditing] = useState(false);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/events'));
  const prof = mine.data;
  const showSetup = !!prof && (!prof.open || editing);

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <View style={s.top}>
        <IconButton name="back" label={t('common.back')} onPress={back} />
        <Txt v="row" size={15} style={{ flex: 1, textAlign: 'center' }}>
          {t('partners.title')}
        </Txt>
        {prof?.open && !editing ? <IconButton name="settings" label={t('partners.edit')} onPress={() => setEditing(true)} /> : <View style={{ width: 44 }} />}
      </View>
      {!prof ? null : showSetup ? <Setup initial={prof} onDone={() => setEditing(false)} /> : <Suggestions />}
    </SafeAreaView>
  );
}

function Setup({ initial, onDone }: { initial: PartnerProfile; onDone: () => void }) {
  const s = useStyles();
  const { p } = useKit();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const meId = PREVIEW ? PREVIEW_ME : user?.id ?? null;
  const sports = useMySports().data ?? [];
  const [f, setF] = useState<PartnerProfile>({ ...initial, open: true });
  const [busy, setBusy] = useState(false);
  const hasGender = profile?.gender === 'female' || profile?.gender === 'male';

  async function save() {
    if (!meId) return;
    setBusy(true);
    try {
      await savePartnerProfile(meId, f);
      haptic('success');
      toast.show(f.open ? t('partners.savedOpen') : t('partners.savedClosed'), 'yours');
      onDone();
    } catch {
      toast.show(t('partners.errors.generic'), 'error');
    } finally {
      setBusy(false);
    }
  }
  const toggleTime = (x: PartnerTime) => setF((cur) => ({ ...cur, times: cur.times.includes(x) ? cur.times.filter((y) => y !== x) : [...cur.times, x] }));

  return (
    <>
      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        <Txt v="hero" size={38} accessibilityRole="header">
          {t('partners.setupTitle')}
        </Txt>
        <Txt v="body" color={p.inkSoft} style={{ marginTop: 8 }}>
          {t('partners.setupSub')}
        </Txt>
        <View style={{ marginTop: 18 }}>
          <Group>
            <GroupRow icon="people" label={t('partners.open')} sub={t('partners.openSub')} toggle={f.open} onToggle={(v) => setF({ ...f, open: v })} />
            <GroupRow icon="people" label={t('partners.sameCommunity')} toggle={f.sameCommunity} onToggle={(v) => setF({ ...f, sameCommunity: v })} />
            {hasGender ? <GroupRow icon="shield" label={t('partners.sameGender')} toggle={f.sameGender} onToggle={(v) => setF({ ...f, sameGender: v })} /> : null}
          </Group>
        </View>

        <SectionHeading title={t('partners.when')} style={{ marginTop: 16 }} />
        <View style={s.wrap}>
          {PARTNER_TIMES.map((x) => (
            <Chip key={x} label={t(`partners.times.${x}`)} selected={f.times.includes(x)} onPress={() => toggleTime(x)} />
          ))}
        </View>
        <Txt v="caption" style={{ marginTop: 6 }}>
          {t('partners.whenSub')}
        </Txt>

        {sports.includes('running' as any) ? (
          <>
            <SectionHeading title={t('partners.pace')} style={{ marginTop: 16 }} />
            <View style={s.wrap}>
              {PACES.map((x) => (
                <Chip key={x} label={`${fmtPace(x)} /km`} selected={f.paceS === x} onPress={() => setF({ ...f, paceS: f.paceS === x ? null : x })} />
              ))}
            </View>
            <Txt v="caption" style={{ marginTop: 6 }}>
              {t('partners.paceSub')}
            </Txt>
          </>
        ) : null}

        <SectionHeading title={t('partners.note')} style={{ marginTop: 16 }} />
        <Field value={f.note} onChangeText={(v) => setF({ ...f, note: v })} placeholder={t('partners.notePlaceholder')} maxLength={140} />

        <View style={s.privacy}>
          <Icon name="lock" size={14} color={p.aqua} />
          <Txt v="caption" style={{ flex: 1 }}>
            {t('partners.privacy')}
          </Txt>
        </View>
      </ScrollView>
      <View style={[s.bar, { paddingBottom: 12 + insets.bottom }]}>
        <MarkerButton label={f.open ? t('partners.saveOpen') : t('common.save')} onPress={save} loading={busy} />
      </View>
    </>
  );
}

function Suggestions() {
  const s = useStyles();
  const { p } = useKit();
  const { t } = useI18n();
  const router = useRouter();
  const sports = useMySports().data ?? [];
  const [sport, setSport] = useState<string | null>(null);
  const q = usePartners(true, sport);
  const [inviting, setInviting] = useState<Partner | null>(null);
  const list = q.data ?? [];
  return (
    <>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={q.refreshing} onRefresh={q.refetch} tintColor={p.ink} />}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
          <Chip label={t('explore.allSports')} selected={!sport} onPress={() => setSport(null)} />
          {sports.map((id) => (
            <Chip key={id} sport={id} label={t(`sports.${id}`)} selected={sport === id} onPress={() => setSport(sport === id ? null : id)} />
          ))}
        </ScrollView>
        {q.loading ? null : list.length ? (
          <View style={{ paddingHorizontal: 16, gap: 12 }}>
            {list.map((x) => (
              <PartnerCard key={x.id} x={x} onInvite={() => setInviting(x)} />
            ))}
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20, paddingTop: 30, gap: 12 }}>
            <Txt v="title" size={22}>
              {t('partners.emptyTitle')}
            </Txt>
            <Txt v="body" color={p.inkSoft}>
              {t('partners.emptyBody')}
            </Txt>
            <OutlineButton label={t('partners.findClub')} icon="people" onPress={() => router.push({ pathname: '/(tabs)/feed', params: { tab: 'communities' } })} />
          </View>
        )}
      </ScrollView>
      <InviteSheet partner={inviting} onClose={() => setInviting(null)} />
    </>
  );
}

function PartnerCard({ x, onInvite }: { x: Partner; onInvite: () => void }) {
  const { p } = useKit();
  const { t, tn } = useI18n();
  const reasons = [
    x.sport ? t(`sports.${x.sport}`) : null,
    x.closeLevel ? t('partners.similarLevel') : null,
    x.times.length ? x.times.slice(0, 2).map((y) => t(`partners.times.${y}`)).join(' / ') : null,
    x.sport === 'running' && x.paceS ? `${fmtPace(x.paceS)} /km` : null,
  ].filter(Boolean);
  return (
    <View style={{ padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: p.rule, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Magnet person={{ id: x.id, name: x.name, avatarUrl: x.avatarUrl }} size={46} />
        <View style={{ flex: 1, gap: 3 }}>
          <Txt v="row" size={16} numberOfLines={1}>
            {x.name}
          </Txt>
          <Txt v="caption" numberOfLines={2}>
            {reasons.join(' · ')}
          </Txt>
        </View>
      </View>
      {x.club || x.together ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {x.club ? <Badge label={x.club} icon="people" /> : null}
          {x.together ? <Badge label={tn('partners.together', x.together)} icon="check" /> : null}
        </View>
      ) : null}
      {x.note ? (
        <Txt v="body" size={14} color={p.inkSoft}>
          “{x.note}”
        </Txt>
      ) : null}
      <OutlineButton label={t('partners.invite')} icon="calendar" onPress={onInvite} />
    </View>
  );
}

function Badge({ label, icon }: { label: string; icon: 'people' | 'check' }) {
  const { p } = useKit();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 6, backgroundColor: p.wash }}>
      <Icon name={icon} size={11} color={p.aqua} />
      <Txt v="label" size={12} color={p.inkSoft} numberOfLines={1}>
        {label}
      </Txt>
    </View>
  );
}

function InviteSheet({ partner, onClose }: { partner: Partner | null; onClose: () => void }) {
  const { p, lang } = useKit();
  const { t } = useI18n();
  const router = useRouter();
  const mineQ = useMySessions();
  const [busy, setBusy] = useState<string | null>(null);
  const options = (mineQ.data ?? []).filter((x) => x.state === 'upcoming' && (x.isHost || x.myStatus === 'going'));
  async function send(eventId: string) {
    if (!partner) return;
    setBusy(eventId);
    try {
      await invitePartner(partner.id, eventId);
      haptic('success');
      toast.show(t('partners.invited', { name: partner.name.split(' ')[0] }), 'yours');
      onClose();
    } catch (e: any) {
      toast.show(t(errorKey('partners', e)), 'error');
    } finally {
      setBusy(null);
    }
  }
  return (
    <Sheet visible={!!partner} title={t('partners.inviteTitle', { name: partner?.name.split(' ')[0] || '' })} onClose={onClose}>
      <Txt v="body" color={p.inkSoft}>
        {t('partners.inviteSub')}
      </Txt>
      {options.length ? (
        <View style={{ gap: 8 }}>
          {options.map((x) => (
            <Press key={x.id} onPress={() => send(x.id)} disabled={!!busy} feedback="light" accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 10, borderWidth: 1.5, borderColor: p.rule }}>
              <Icon sport={x.sport} size={20} color={p.aqua} />
              <View style={{ flex: 1, gap: 2 }}>
                <Txt v="row" size={15} numberOfLines={1}>
                  {x.title}
                </Txt>
                <Txt v="caption">{`${fmtDay(x.startsAt, lang)} · ${fmtClock(x.startsAt, lang)}`}</Txt>
              </View>
              <Txt v="label" size={13} color={p.markerText}>
                {busy === x.id ? '…' : t('partners.send')}
              </Txt>
            </Press>
          ))}
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          <Txt v="meta">{t('partners.noSessions')}</Txt>
          <MarkerButton
            label={t('board.hostA11y')}
            icon="plus"
            onPress={() => {
              onClose();
              router.push('/host');
            }}
          />
        </View>
      )}
    </Sheet>
  );
}

const useStyles = makeStyles(({ p }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingBottom: 4 },
  body: { paddingHorizontal: 20, paddingBottom: 32 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chips: { gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  privacy: { flexDirection: 'row', gap: 8, marginTop: 20, padding: 12, borderRadius: 10, backgroundColor: p.wash },
  bar: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: p.rule, backgroundColor: p.boardDeep },
}));
