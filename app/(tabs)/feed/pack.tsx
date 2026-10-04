import React, { useEffect, useState } from 'react';
import { Alert, Image, RefreshControl, ScrollView, Share, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { makeStyles, useKit } from '../../../src/theme';
import { useI18n } from '../../../src/i18n';
import { useAuth } from '../../../src/providers/AuthProvider';
import { useMyPackList } from '../../../src/data/member';
import { joinPackByCode, leavePack, MAX_PACKS, PackInvite, PackVisibility, respondToInvite, setPackPhoto, updatePackEmblem, updatePackVisibility, usePack, usePackInvites, usePackSessions } from '../../../src/data/packs';
import type { Emblem } from '../../../src/lib/emblem';
import { PREVIEW, PREVIEW_ME } from '../../../src/data/preview';
import { Txt } from '../../../src/components/board/Txt';
import { Icon } from '../../../src/components/board/Icon';
import { Press } from '../../../src/components/board/Press';
import { Magnet } from '../../../src/components/board/people';
import { Rule } from '../../../src/components/board/marks';
import { ChoiceList, Dropdown, Field, IconButton, MarkerButton, OutlineButton, SectionHeading, TextButton } from '../../../src/components/board/controls';
import { SessionRow, useNow } from '../../../src/components/board/session';
import { Patch, PatchPreview } from '../../../src/components/board/Patch';
import { PatchPicker } from '../../../src/components/board/PatchPicker';
import { Sheet } from '../../../src/components/board/sheet';
import { toast } from '../../../src/components/board/toast';
import { haptic } from '../../../src/lib/haptics';
import { errorKey } from '../../../src/data/errors';

export default function PackScreen() {
  const s = useStyles();
  const { p } = useKit();
  const { t, tn } = useI18n();
  const router = useRouter();
  const params = useLocalSearchParams<{ packId?: string; join?: string }>();
  const { user } = useAuth();
  const meId = PREVIEW ? PREVIEW_ME : user?.id ?? null;
  const list = useMyPackList();
  const packs = list.data ?? [];
  const [selected, setSelected] = useState<string | null>(params.packId ?? null);
  // "Join with a code" on the Groups tab opens straight on the code field.
  const [adding, setAdding] = useState(params.join === '1');
  useEffect(() => {
    if (params.join === '1') setAdding(true);
  }, [params.join]);
  const [restyle, setRestyle] = useState<Emblem | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);

  async function pickPhoto(packId: string) {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [16, 9], quality: 0.85 });
    if (res.canceled || !res.assets?.[0]?.uri) return;
    await savePhoto(packId, res.assets[0].uri);
  }
  async function savePhoto(packId: string, uri: string | null) {
    if (!meId) return;
    setPhotoBusy(true);
    try {
      await setPackPhoto(meId, packId, uri);
    } catch {
      toast.show(t('pack.errors.generic'), 'error');
    } finally {
      setPhotoBusy(false);
    }
  }
  const [saving, setSaving] = useState(false);
  const [findOpen, setFindOpen] = useState(false);

  async function saveVisibility(v: PackVisibility) {
    const d = pack.data;
    setFindOpen(false);
    if (!d || v === d.visibility) return;
    try {
      await updatePackVisibility(d.id, v);
      haptic('success');
      toast.show(t('pack.visibilitySaved'), 'info');
      pack.refetch();
    } catch {
      haptic('error');
      toast.show(t('pack.errors.generic'), 'error');
    }
  }
  const pack = usePack(selected);
  const sessions = usePackSessions(selected, (pack.data?.members ?? []).map((m) => m.id));
  const now = useNow();

  useEffect(() => {
    if (!selected && packs.length) setSelected(packs[0].id);
  }, [packs.length]);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/feed'));

  function shareCode() {
    const d = pack.data;
    if (!d?.inviteCode) return;
    Share.share({ message: t('pack.shareMessage', { name: d.name, code: d.inviteCode }) }).catch(() => {});
  }

  function confirmLeave() {
    const d = pack.data;
    if (!d || !meId) return;
    Alert.alert(t('pack.leaveTitle', { name: d.name }), t('pack.leaveBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('pack.leave'),
        style: 'destructive',
        onPress: async () => {
          try {
            await leavePack(meId, d.id);
            haptic('warning');
            const rest = packs.filter((x) => x.id !== d.id);
            setSelected(rest[0]?.id ?? null);
            list.refetch();
          } catch {
            toast.show(t('pack.errors.generic'), 'error');
          }
        },
      },
    ]);
  }

  async function savePatch() {
    const d = pack.data;
    if (!d || !restyle) return;
    setSaving(true);
    try {
      await updatePackEmblem(d.id, restyle);
      haptic('success');
      toast.show(t('pack.patchSaved'), 'info');
      setRestyle(null);
      pack.refetch();
      list.refetch();
    } catch {
      haptic('error');
      toast.show(t('pack.errors.generic'), 'error');
    } finally {
      setSaving(false);
    }
  }

  const showJoin = adding || (!list.loading && packs.length === 0);
  const d = pack.data;

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <View style={s.header}>
        <IconButton name="back" label={t('common.back')} onPress={back} />
        <Txt v="title" size={22} style={{ flex: 1 }} accessibilityRole="header">
          {t('pack.title')}
        </Txt>
        {packs.length ? <Txt v="caption" style={{ marginEnd: 12 }}>{packs.length}/{MAX_PACKS}</Txt> : null}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} refreshControl={<RefreshControl refreshing={list.refreshing || pack.refreshing} onRefresh={() => { list.refetch(); pack.refetch(); sessions.refetch(); }} tintColor={p.ink} />}>
        {packs.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.selector}>
            {packs.map((pk) => {
              const on = pk.id === selected && !adding;
              return (
                <Press key={pk.id} onPress={() => { setSelected(pk.id); setAdding(false); }} feedback="selection" style={{ width: 70, alignItems: 'center', gap: 6 }} accessibilityState={{ selected: on }}>
                  <View style={[s.ring, on ? { borderColor: p.ink } : null]}>
                    <Patch emblem={pk.emblem} name={pk.name} size={54} />
                  </View>
                  <Txt v="caption" numberOfLines={1} color={on ? p.ink : p.inkSoft} align="center" style={{ width: 70 }}>
                    {pk.name}
                  </Txt>
                </Press>
              );
            })}
            {packs.length < MAX_PACKS ? (
              <Press onPress={() => setAdding(true)} feedback="selection" style={{ width: 70, alignItems: 'center', gap: 6 }} accessibilityLabel={t('pack.add')}>
                <View style={[s.patchSm, s.addPatch, adding ? { borderColor: p.ink } : null]}>
                  <Icon name="plus" size={22} />
                </View>
                <Txt v="caption" align="center">
                  {t('pack.add')}
                </Txt>
              </Press>
            ) : null}
          </ScrollView>
        ) : null}

        {showJoin ? (
          <JoinPanel meId={meId} hasGroups={packs.length > 0} onJoined={(id) => { setAdding(false); setSelected(id); list.refetch(); }} onCreate={() => router.push('/(tabs)/feed/pack-create')} />
        ) : d ? (
          <View style={{ paddingHorizontal: 16 }}>
            {d.photoUrl ? <Image source={{ uri: d.photoUrl }} style={s.photo} resizeMode="cover" accessibilityIgnoresInvertColors /> : null}
            <View style={s.hero}>
              <Press onPress={d.canEdit ? () => setRestyle(d.emblem) : undefined} disabled={!d.canEdit} feedback="light" accessibilityRole={d.canEdit ? 'button' : 'image'} accessibilityLabel={d.canEdit ? t('pack.changePatch') : d.name}>
                <Patch emblem={d.emblem} name={d.name} size={112} />
              </Press>
              <View style={{ flex: 1, gap: 4 }}>
                <Txt v="row" size={24} numberOfLines={2}>
                  {d.name}
                </Txt>
                <Txt v="meta">{[tn('tribe.members', d.members.length), t(`pack.visibilityShort.${d.visibility}`), d.audience === 'women' ? t('pack.womenOnly') : d.audience === 'men' ? t('pack.menOnly') : null, d.communityName].filter(Boolean).join(' · ')}</Txt>
                {d.isLeader ? (
                  <Txt v="label" size={13} color={p.markerText}>
                    {t('pack.leader')}
                  </Txt>
                ) : null}
                {d.canEdit ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginStart: -8 }}>
                    <TextButton label={t('pack.changePatch')} onPress={() => setRestyle(d.emblem)} color={p.aqua} />
                    <TextButton label={photoBusy ? t('common.saving') : d.photoUrl ? t('pack.changePhoto') : t('pack.addPhoto')} onPress={() => pickPhoto(d.id)} color={p.aqua} disabled={photoBusy} />
                    {d.photoUrl ? <TextButton label={t('pack.removePhoto')} onPress={() => savePhoto(d.id, null)} color={p.inkSoft} disabled={photoBusy} /> : null}
                  </View>
                ) : null}
              </View>
            </View>

            {d.inviteCode ? (
              <Press onPress={shareCode} feedback="light" style={s.code} accessibilityLabel={`${t('pack.code')} ${d.inviteCode}`}>
                <View style={{ flex: 1 }}>
                  <Txt v="label" size={13} color={p.inkSoft}>
                    {t('pack.code')}
                  </Txt>
                  <Txt v="time" size={30} style={{ letterSpacing: 4 }}>
                    {d.inviteCode}
                  </Txt>
                </View>
                <Icon name="share" size={20} />
              </Press>
            ) : null}

            {/* The leader decides who can find the group */}
            {d.canEdit ? (
              <View style={{ marginTop: 14, gap: 6 }}>
                <Txt v="label" size={13} color={p.inkSoft}>
                  {t('pack.findTitle')}
                </Txt>
                <Dropdown
                  label={t(`pack.visibility.${d.visibility}`, { community: d.communityName ?? '' })}
                  sub={t(`pack.visibilityHint.${d.visibility}`, { community: d.communityName ?? '' })}
                  icon={d.visibility === 'open' ? 'globe' : 'lock'}
                  onPress={() => setFindOpen(true)}
                  accessibilityLabel={t('pack.findTitle')}
                />
                <Sheet visible={findOpen} title={t('pack.findTitle')} onClose={() => setFindOpen(false)}>
                  <ChoiceList<PackVisibility>
                    options={(['invite', 'open'] as PackVisibility[]).map((v) => ({
                      value: v,
                      label: t(`pack.visibility.${v}`, { community: d.communityName ?? '' }),
                      sub: t(`pack.visibilityHint.${v}`, { community: d.communityName ?? '' }),
                      icon: v === 'open' ? 'globe' : 'lock',
                    }))}
                    value={d.visibility}
                    onChange={saveVisibility}
                  />
                </Sheet>
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <OutlineButton label={t('pack.chat')} icon="chat" style={{ flex: 1 }} onPress={() => router.push({ pathname: '/(tabs)/feed/pack-chat', params: { packId: d.id, packName: d.name, memberCount: String(d.members.length) } })} />
              {d.canInvite ? (
                <OutlineButton label={t('pack.invite')} icon="personAdd" style={{ flex: 1 }} onPress={() => router.push({ pathname: '/(tabs)/feed/pack-invite', params: { packId: d.id } })} />
              ) : null}
            </View>
            {!d.canInvite ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
                <Icon name="lock" size={12} color={p.inkSoft} />
                <Txt v="caption">{t('pack.inviteLeaderOnly')}</Txt>
              </View>
            ) : null}

            <Rule style={{ marginVertical: 20 }} />
            <SectionHeading title={tn('tribe.members', d.members.length)} />
            <View style={s.members}>
              {d.members.map((m) => (
                <View key={m.id} style={{ width: 64, alignItems: 'center', gap: 4 }}>
                  <Magnet person={m} size={44} yours={m.id === meId} />
                  <Txt v="caption" numberOfLines={1} align="center" style={{ width: 64 }}>
                    {m.id === meId ? t('common.you') : m.name.split(' ')[0]}
                  </Txt>
                  {m.role === 'leader' ? (
                    <Txt v="caption" size={11} color={p.markerText}>
                      {t('pack.leader')}
                    </Txt>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {!showJoin && d ? (
          <>
            <Rule style={{ marginVertical: 20, marginHorizontal: 16 }} />
            <SectionHeading title={t('pack.going')} style={{ paddingHorizontal: 16 }} />
            {(sessions.data ?? []).length ? (
              (sessions.data ?? []).map((x, i, arr) => (
                <SessionRow key={x.id} s={x} now={now} meId={meId} size="compact" showDay last={i === arr.length - 1} onPress={() => router.push({ pathname: '/session/[id]', params: { id: x.id } })} />
              ))
            ) : (
              <View style={{ paddingHorizontal: 16, gap: 12 }}>
                <Txt v="meta">{t('pack.goingEmpty')}</Txt>
                <OutlineButton label={t('board.hostA11y')} icon="plus" onPress={() => router.push('/host')} />
              </View>
            )}
            <TextButton label={t('pack.leave')} onPress={confirmLeave} color={p.danger} style={{ alignSelf: 'center', marginTop: 24 }} />
          </>
        ) : null}
      </ScrollView>

      {d && restyle ? (
        <Sheet visible title={t('pack.patchTitle')} onClose={() => setRestyle(null)} action={{ label: t('common.save'), onPress: savePatch, disabled: saving }}>
          <View style={{ alignItems: 'center', paddingVertical: 8 }}>
            <PatchPreview emblem={restyle} name={d.name} size={112} />
          </View>
          <PatchPicker value={restyle} onChange={setRestyle} name={d.name} />
        </Sheet>
      ) : null}
    </SafeAreaView>
  );
}

function JoinPanel({ meId, hasGroups, onJoined, onCreate }: { meId: string | null; hasGroups: boolean; onJoined: (id: string) => void; onCreate: () => void }) {
  const s = useStyles();
  const { p } = useKit();
  const { t } = useI18n();
  const invites = usePackInvites();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function join() {
    if (!meId || !code.trim()) return;
    setBusy(true);
    setError('');
    try {
      const pk = await joinPackByCode(meId, code);
      haptic('success');
      toast.show(t('pack.joined', { name: pk.name }), 'yours');
      setCode('');
      onJoined(pk.id);
    } catch (e: any) {
      haptic('error');
      setError(t(errorKey('pack', e)));
    } finally {
      setBusy(false);
    }
  }

  async function answer(inv: PackInvite, accept: boolean) {
    if (!meId) return;
    try {
      await respondToInvite(meId, inv, accept);
      invites.refetch();
      if (accept) onJoined(inv.packId);
    } catch (e: any) {
      toast.show(t(errorKey('pack', e)), 'error');
    }
  }

  return (
    <View style={{ padding: 16, gap: 14 }}>
      {!hasGroups ? (
        <Txt v="body" color={p.inkSoft}>
          {t('tribe.packsEmpty')}
        </Txt>
      ) : null}
      <MarkerButton label={t('tribe.startPack')} icon="plus" onPress={onCreate} />
      <Rule style={{ marginVertical: 6 }} />
      <SectionHeading title={t('pack.joinTitle')} />
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
        <Field
          containerStyle={{ flex: 1 }}
          value={code}
          onChangeText={(v) => { setCode(v.toUpperCase()); setError(''); }}
          placeholder={t('pack.codePlaceholder')}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={6}
          error={error}
          returnKeyType="go"
          onSubmitEditing={join}
          style={{ letterSpacing: 3 }}
        />
        <OutlineButton label={t('pack.join')} onPress={join} loading={busy} disabled={!code.trim()} style={{ height: 52 }} />
      </View>
      {(invites.data ?? []).length ? (
        <View style={{ gap: 8, marginTop: 6 }}>
          <SectionHeading title={t('pack.invites')} />
          {(invites.data ?? []).map((inv) => (
            <View key={inv.id} style={s.invite}>
              <Patch emblem={inv.emblem} name={inv.packName} size={40} />
              <View style={{ flex: 1 }}>
                <Txt v="headline" size={15}>
                  {inv.packName}
                </Txt>
                <Txt v="caption">{t('pack.inviteFrom', { name: inv.from })}</Txt>
              </View>
              <TextButton label={t('pack.pass')} onPress={() => answer(inv, false)} color={p.inkSoft} />
              <OutlineButton label={t('pack.join')} onPress={() => answer(inv, true)} style={{ height: 38 }} />
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles(({ p }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  header: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingStart: 4, paddingBottom: 6 },
  selector: { paddingHorizontal: 16, paddingVertical: 8, gap: 12 },
  ring: { padding: 3, borderRadius: 99, borderWidth: 2, borderColor: 'transparent' },
  patchSm: { width: 64, height: 64, borderRadius: 32, borderWidth: 1.5 },
  addPatch: { backgroundColor: p.wash, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderColor: p.ruleStrong },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 },
  photo: { width: '100%', aspectRatio: 16 / 9, borderRadius: 14, backgroundColor: p.wash, marginTop: 8 },
  code: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: p.ruleStrong, borderStyle: 'dashed' },
  members: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  invite: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: p.rule },
}));
