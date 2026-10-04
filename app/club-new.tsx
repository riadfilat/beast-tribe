import React, { useState } from 'react';
import { ScrollView, Share, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { makeStyles, useKit } from '../src/theme';
import { useI18n } from '../src/i18n';
import { useAuth } from '../src/providers/AuthProvider';
import { useMySports } from '../src/data/member';
import { ClubListing, createClub } from '../src/data/clubs';
import { SPORT_LIST } from '../src/lib/sports';
import { cityLabel } from '../src/lib/cities';
import { Txt } from '../src/components/board/Txt';
import { Icon } from '../src/components/board/Icon';
import { Press } from '../src/components/board/Press';
import { Chip, Field, IconButton, MarkerButton, OutlineButton, SectionHeading, Segmented } from '../src/components/board/controls';
import { toast } from '../src/components/board/toast';
import { haptic } from '../src/lib/haptics';
import { errorKey } from '../src/data/errors';

// Start a club: any member can run one club for free (a run club, a padel group, a hiking crew).
export default function ClubNewScreen() {
  const s = useStyles();
  const { p, lang } = useKit();
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const mySports = useMySports().data ?? [];
  const sports = [...mySports, ...SPORT_LIST.map((x) => x.id).filter((id) => !mySports.includes(id as any) && id !== 'other' && id !== 'community')];
  const [name, setName] = useState('');
  const [sport, setSport] = useState<string | null>(mySports[0] ?? 'running');
  const [city, setCity] = useState(cityLabel(profile?.city, lang));
  const [about, setAbout] = useState('');
  const [listing, setListing] = useState<ClubListing>('public');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ id: string; joinCode: string } | null>(null);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/feed'));

  async function submit() {
    if (name.trim().length < 3) return toast.show(t('club.errors.NAME'), 'error');
    setBusy(true);
    try {
      const r = await createClub({ name, sport, city, description: about, listing });
      haptic('success');
      setDone(r);
    } catch (e: any) {
      toast.show(t(errorKey('club', e)), 'error');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <SafeAreaView style={s.screen} edges={['top']}>
        <View style={[s.body, { flex: 1, justifyContent: 'center', gap: 16 }]}>
          <Icon name="flag" size={34} color={p.marker} />
          <Txt v="hero" size={40}>
            {t('club.doneTitle')}
          </Txt>
          <Txt v="body" color={p.inkSoft}>
            {listing === 'public' ? t('club.doneBodyPublic') : t('club.doneBodyInvite')}
          </Txt>
          <Press onPress={() => Share.share({ message: t('community.shareMessage', { name: name.trim(), code: done.joinCode }) }).catch(() => {})} feedback="light" style={s.code} accessibilityLabel={`${t('community.inviteCode')} ${done.joinCode}`}>
            <View style={{ flex: 1 }}>
              <Txt v="label" size={13} color={p.inkSoft}>
                {t('community.inviteCode')}
              </Txt>
              <Txt v="time" size={34} style={{ letterSpacing: 4 }}>
                {done.joinCode}
              </Txt>
            </View>
            <Icon name="share" size={22} />
          </Press>
          <MarkerButton label={t('club.openClub')} onPress={() => router.replace({ pathname: '/(tabs)/feed/community', params: { id: done.id } })} />
          <OutlineButton label={t('club.hostFirst')} icon="plus" onPress={() => router.replace({ pathname: '/host', params: { community: done.id } })} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <View style={s.top}>
        <IconButton name="close" label={t('common.close')} onPress={back} />
      </View>
      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        <Txt v="hero" size={40} accessibilityRole="header">
          {t('club.newTitle')}
        </Txt>
        <Txt v="body" color={p.inkSoft} style={{ marginTop: 8 }}>
          {t('club.newSub')}
        </Txt>
        <View style={s.points}>
          {['point1', 'point2', 'point3'].map((k) => (
            <View key={k} style={{ flexDirection: 'row', gap: 10 }}>
              <Icon name="check" size={16} color={p.aqua} />
              <Txt v="body" size={15} style={{ flex: 1 }}>
                {t(`club.${k}`)}
              </Txt>
            </View>
          ))}
        </View>

        <SectionHeading title={t('club.name')} />
        <Field value={name} onChangeText={setName} placeholder={t('club.namePlaceholder')} maxLength={60} />

        <SectionHeading title={t('club.sport')} style={{ marginTop: 14 }} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {sports.map((id) => (
            <Chip key={id} sport={id} label={t(`sports.${id}`)} selected={sport === id} onPress={() => setSport(id)} />
          ))}
        </ScrollView>

        <SectionHeading title={t('host.city')} style={{ marginTop: 14 }} />
        <Field value={city} onChangeText={setCity} placeholder={t('host.cityPlaceholder')} maxLength={60} />

        <SectionHeading title={t('club.about')} style={{ marginTop: 14 }} />
        <Field value={about} onChangeText={setAbout} placeholder={t('club.aboutPlaceholder')} multiline maxLength={400} />

        <SectionHeading title={t('club.who')} style={{ marginTop: 14 }} />
        <Segmented options={[{ value: 'public', label: t('club.public') }, { value: 'invite', label: t('club.invite') }]} value={listing} onChange={setListing} />
        <Txt v="caption" style={{ marginTop: 8 }}>
          {listing === 'public' ? t('club.publicSub') : t('club.inviteSub')}
        </Txt>
      </ScrollView>
      <View style={[s.bar, { paddingBottom: 12 + insets.bottom }]}>
        <MarkerButton label={t('club.create')} onPress={submit} loading={busy} />
        <Txt v="caption" align="center" style={{ marginTop: 8 }}>
          {t('club.free')}
        </Txt>
      </View>
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ p }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  top: { paddingStart: 4, paddingBottom: 4 },
  body: { paddingHorizontal: 20, paddingBottom: 32 },
  points: { gap: 10, marginTop: 18, marginBottom: 10, padding: 14, borderRadius: 12, backgroundColor: p.wash },
  code: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: p.ruleStrong, borderStyle: 'dashed' },
  bar: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: p.rule, backgroundColor: p.boardDeep },
}));
