import React, { useState } from 'react';
import { ActivityIndicator, Image, Linking, RefreshControl, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { makeStyles, useKit } from '../../../src/theme';
import { useI18n } from '../../../src/i18n';
import { useAuth } from '../../../src/providers/AuthProvider';
import { useMyStats, useMySports, useMyPackList, saveAvatar } from '../../../src/data/member';
import { useMySessions } from '../../../src/data/sessions';
import { useIsCoach, useMyCommunity } from '../../../src/hooks';
import { PREVIEW, PREVIEW_ME } from '../../../src/data/preview';
import { SHOP_URL } from '../../../src/lib/constants';
import { Txt } from '../../../src/components/board/Txt';
import { Icon } from '../../../src/components/board/Icon';
import { Press } from '../../../src/components/board/Press';
import { Magnet } from '../../../src/components/board/people';
import { SectionHeading } from '../../../src/components/board/controls';
import { Group, GroupRow } from '../../../src/components/board/list';
import { SessionRow, useNow } from '../../../src/components/board/session';
import { patchFor } from '../../../src/components/board/patches';
import { toast } from '../../../src/components/board/toast';
import { haptic } from '../../../src/lib/haptics';
import { journeyStage } from '../../../src/lib/journey';

export default function YouScreen() {
  const s = useStyles();
  const { p, lang } = useKit();
  const { t } = useI18n();
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const meId = PREVIEW ? PREVIEW_ME : user?.id ?? null;
  const stats = useMyStats();
  const sports = useMySports().data ?? [];
  const packs = useMyPackList().data ?? [];
  const mine = useMySessions();
  const { isCoach } = useIsCoach();
  const community = useMyCommunity().data as any;
  const now = useNow();
  const [uploading, setUploading] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);

  const name = profile?.display_name || profile?.full_name || '';
  const stage = journeyStage(profile?.experience_level);
  const upcoming = (mine.data ?? []).filter((x) => x.state === 'upcoming' || x.state === 'live').slice(0, 2);

  async function changePhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted' || !meId) return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.85 });
    if (res.canceled || !res.assets[0]) return;
    setLocalAvatar(res.assets[0].uri);
    setUploading(true);
    try {
      await saveAvatar(meId, res.assets[0].uri);
      await refreshProfile();
      haptic('success');
    } catch {
      setLocalAvatar(null);
      toast.show(t('you.photoError'), 'error');
    } finally {
      setUploading(false);
    }
  }

  const facts = stats.data
    ? [
        lang === 'ar' ? `${stats.data.attended} ${arCount(stats.data.attended, 'تمرين', 'تمرينان', 'تمارين', 'تمرينًا')}` : `${stats.data.attended} session${stats.data.attended === 1 ? '' : 's'}`,
        lang === 'ar' ? `نظّمت ${stats.data.hosted}` : `${stats.data.hosted} hosted`,
        lang === 'ar' ? `قابلت ${stats.data.met} ${arCount(stats.data.met, 'شخصًا', 'شخصين', 'أشخاص', 'شخصًا')}` : `met ${stats.data.met} ${stats.data.met === 1 ? 'person' : 'people'}`,
      ].join(' · ')
    : null;

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={stats.refreshing || mine.refreshing} onRefresh={() => { stats.refetch(); mine.refetch(); refreshProfile(); }} tintColor={p.ink} />}
      >
        <View style={s.header}>
          <Txt v="title" size={32} style={{ flex: 1 }} accessibilityRole="header">
            {t('you.title')}
          </Txt>
          <Press onPress={() => router.push('/(tabs)/profile/settings')} feedback="selection" accessibilityLabel={t('you.settings')} style={s.iconBtn}>
            <Icon name="settings" size={22} />
          </Press>
        </View>

        {/* Identity */}
        <View style={s.identity}>
          <Press onPress={changePhoto} feedback="selection" accessibilityLabel={t('you.changePhoto')} style={{ alignSelf: 'flex-start' }}>
            <Magnet person={{ id: meId || 'me', name, avatarUrl: localAvatar || profile?.avatar_url }} size={84} yours />
            <View style={s.cam}>
              {uploading ? <ActivityIndicator size="small" color={p.onMarker} /> : <Icon name="camera" size={13} color={p.board} />}
            </View>
          </Press>
          <View style={{ flex: 1, gap: 4 }}>
            <Txt v="title" size={26} numberOfLines={2}>
              {name}
            </Txt>
            <Txt v="meta" size={14}>
              {[stage ? t(`onboarding.levels.${stage}`) : null, profile?.city].filter(Boolean).join(' · ')}
            </Txt>
            {community?.name ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name="shield" size={13} color={p.aqua} />
                <Txt v="label" size={13} color={p.aqua}>
                  {community.name}
                </Txt>
              </View>
            ) : null}
          </View>
        </View>
        {facts ? (
          <Txt v="body" style={s.facts}>
            {facts}
          </Txt>
        ) : null}

        {/* Next up */}
        <SectionHeading title={t('you.mySessions')} action={t('common.seeAll')} onAction={() => router.push('/my-sessions')} style={s.section} />
        {upcoming.length ? (
          upcoming.map((x, i) => (
            <SessionRow key={x.id} s={x} now={now} meId={meId} size="compact" showDay last={i === upcoming.length - 1} onPress={() => router.push({ pathname: '/session/[id]', params: { id: x.id } })} />
          ))
        ) : (
          <Press onPress={() => router.push('/(tabs)/events')} feedback="selection" style={s.emptyRow}>
            <Txt v="meta" style={{ flex: 1 }}>
              {t('you.upcomingEmpty')}
            </Txt>
            <Txt v="label" color={p.aqua}>
              {t('you.findSession')}
            </Txt>
          </Press>
        )}

        {/* Sports */}
        <SectionHeading title={t('you.mySports')} action={t('you.editSports')} onAction={() => router.push({ pathname: '/(onboarding)/pick-sports', params: { edit: '1' } })} style={s.section} />
        {sports.length ? (
          <View style={s.sports}>
            {sports.map((id) => (
              <View key={id} style={s.sport}>
                <Icon sport={id} size={16} />
                <Txt v="label" size={14}>
                  {t(`sports.${id}`)}
                </Txt>
              </View>
            ))}
          </View>
        ) : (
          <Txt v="meta" style={{ paddingHorizontal: 16 }}>
            {t('you.noSports')}
          </Txt>
        )}

        {/* Packs */}
        {packs.length ? (
          <>
            <SectionHeading title={t('you.packs')} action={t('common.seeAll')} onAction={() => router.push('/(tabs)/feed')} style={s.section} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 14 }}>
              {packs.map((pk) => (
                <Press key={pk.id} onPress={() => router.push({ pathname: '/(tabs)/feed/pack', params: { packId: pk.id } })} feedback="selection" style={{ width: 72, alignItems: 'center', gap: 6 }}>
                  <View style={s.patch}>
                    <Image source={patchFor(pk.animal)} style={{ width: 64, height: 64 }} />
                  </View>
                  <Txt v="caption" numberOfLines={1} align="center" style={{ width: 72 }}>
                    {pk.name}
                  </Txt>
                </Press>
              ))}
            </ScrollView>
          </>
        ) : null}

        <Group style={{ marginHorizontal: 16, marginTop: 28 }}>
          <GroupRow icon="calendar" label={t('you.mySessions')} onPress={() => router.push('/my-sessions')} />
          <GroupRow icon="nutrition" label={t('you.nutrition')} onPress={() => router.push('/(tabs)/home/nutrition')} />
          {isCoach ? <GroupRow icon="coach" label={t('you.coach')} onPress={() => router.push('/(tabs)/profile/coach-dashboard')} /> : null}
          {SHOP_URL ? <GroupRow icon="bag" label={t('you.shop')} onPress={() => Linking.openURL(SHOP_URL)} /> : null}
          <GroupRow icon="settings" label={t('you.settings')} onPress={() => router.push('/(tabs)/profile/settings')} />
        </Group>
      </ScrollView>
    </SafeAreaView>
  );
}

function arCount(n: number, one: string, two: string, few: string, many: string) {
  if (n === 1) return one;
  if (n === 2) return two;
  const m = n % 100;
  if (m >= 3 && m <= 10) return few;
  return many;
}

const useStyles = makeStyles(({ p }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  header: { flexDirection: 'row', alignItems: 'center', paddingStart: 16, paddingEnd: 8, paddingTop: 6, paddingBottom: 8 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16, paddingTop: 8 },
  cam: { position: 'absolute', end: -4, bottom: -4, width: 28, height: 28, borderRadius: 14, backgroundColor: p.ink, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: p.board },
  facts: { paddingHorizontal: 16, marginTop: 16 },
  section: { paddingHorizontal: 16, marginTop: 22, marginBottom: 4 },
  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: p.rule },
  sports: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16 },
  sport: { flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 36, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1.5, borderColor: p.rule },
  patch: { width: 64, height: 64, borderRadius: 32, overflow: 'hidden', backgroundColor: '#023C3C', borderWidth: 1.5, borderColor: p.rule },
}));
