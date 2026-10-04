import React from 'react';
import { Alert, RefreshControl, ScrollView, Share, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { makeStyles, useKit } from '../../../src/theme';
import { useI18n } from '../../../src/i18n';
import { cityLabel } from '../../../src/lib/cities';
import { useAuth } from '../../../src/providers/AuthProvider';
import { leaveCommunity, useCommunity } from '../../../src/data/communities';
import { useBoardSessions } from '../../../src/data/sessions';
import { PREVIEW, PREVIEW_ME } from '../../../src/data/preview';
import { Txt } from '../../../src/components/board/Txt';
import { Icon } from '../../../src/components/board/Icon';
import { Press } from '../../../src/components/board/Press';
import { Rule } from '../../../src/components/board/marks';
import { IconButton, MarkerButton, OutlineButton, SectionHeading, TextButton } from '../../../src/components/board/controls';
import { CommunityTile } from '../../../src/components/board/communities';
import { SessionRow, useNow } from '../../../src/components/board/session';
import { toast } from '../../../src/components/board/toast';
import { haptic } from '../../../src/lib/haptics';
import { CommunityHighlights, CommunityWellness } from '../../../src/components/board/wellness';
import { CommunityCaptains } from '../../../src/components/board/captain';
import { ClubByline, ClubLeaderPanel } from '../../../src/components/board/clubs';

export default function CommunityScreen() {
  const s = useStyles();
  const { p } = useKit();
  const { t, tn, lang } = useI18n();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const meId = PREVIEW ? PREVIEW_ME : user?.id ?? null;
  const q = useCommunity(id);
  const sessions = useBoardSessions();
  const now = useNow();
  const c = q.data;
  const upcoming = (sessions.data ?? []).filter((x) => x.communityId === id && (x.state === 'upcoming' || x.state === 'live'));
  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/feed'));

  function share() {
    if (!c?.joinCode) return;
    Share.share({ message: t('community.shareMessage', { name: c.name, code: c.joinCode }) }).catch(() => {});
  }

  function confirmLeave() {
    if (!c || !meId) return;
    Alert.alert(t('community.leaveTitle', { name: c.name }), c.open ? t('community.leaveBodyOpen') : t('community.leaveBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('community.leave'),
        style: 'destructive',
        onPress: async () => {
          try {
            await leaveCommunity(meId, c.id);
            haptic('warning');
            back();
          } catch {
            toast.show(t('community.errors.generic'), 'error');
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <View style={s.header}>
        <IconButton name="back" label={t('common.back')} onPress={back} />
      </View>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 48 }}
        refreshControl={<RefreshControl refreshing={q.refreshing || sessions.refreshing} onRefresh={() => { q.refetch(); sessions.refetch(); }} tintColor={p.ink} />}
      >
        {c ? (
          <View style={{ paddingHorizontal: 16 }}>
            <View style={s.hero}>
              <CommunityTile c={c} size={72} />
              <View style={{ flex: 1, gap: 4 }}>
                <Txt v="title" size={24} accessibilityRole="header" numberOfLines={2}>
                  {c.name}
                </Txt>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {!c.open ? <Icon name="lock" size={12} color={p.aqua} /> : null}
                  <Txt v="meta">
                    {[c.open ? t('community.open') : t('community.private'), c.isDefault ? null : t(`community.kinds.${c.kind}`), cityLabel(c.city, lang), tn('tribe.members', c.members)].filter(Boolean).join(' · ')}
                  </Txt>
                </View>
              </View>
            </View>
            <ClubByline c={c} meId={meId} />
            {c.description ? (
              <Txt v="body" color={p.inkSoft} style={{ marginTop: 14 }}>
                {c.description}
              </Txt>
            ) : null}

            {c.joinCode ? (
              <Press onPress={share} feedback="light" style={s.code} accessibilityLabel={`${t('community.inviteCode')} ${c.joinCode}`}>
                <View style={{ flex: 1 }}>
                  <Txt v="label" size={13} color={p.inkSoft}>
                    {t('community.inviteCode')}
                  </Txt>
                  <Txt v="time" size={30} style={{ letterSpacing: 4 }}>
                    {c.joinCode}
                  </Txt>
                </View>
                <Icon name="share" size={20} />
              </Press>
            ) : !c.open && c.isMember ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 }}>
                <Icon name="lock" size={12} color={p.inkSoft} />
                <Txt v="caption">{t('community.inviteAdminsOnly')}</Txt>
              </View>
            ) : null}

            {c.leaderId && (c.leaderId === meId || c.joinCode) ? <ClubLeaderPanel c={c} /> : null}
            {c.isMember ? <CommunityCaptains communityId={c.id} /> : null}
            {c.isMember ? <CommunityHighlights communityId={c.id} name={c.name} onOpenPlan={(slug) => router.push({ pathname: '/program/[slug]', params: { slug } })} /> : null}

            <View style={{ marginTop: 14 }}>
              <OutlineButton label={t('board.hostA11y')} icon="plus" onPress={() => router.push({ pathname: '/host', params: { community: c.id } })} />
            </View>

            <Rule style={{ marginVertical: 20 }} />
            <SectionHeading title={t('community.sessions')} />
          </View>
        ) : null}

        {c ? (
          upcoming.length ? (
            upcoming.map((x, i) => (
              <SessionRow key={x.id} s={x} now={now} meId={meId} size="compact" showDay last={i === upcoming.length - 1} onPress={() => router.push({ pathname: '/session/[id]', params: { id: x.id } })} />
            ))
          ) : (
            <View style={{ paddingHorizontal: 16, gap: 12 }}>
              <Txt v="meta">{t('community.sessionsEmpty')}</Txt>
              <MarkerButton label={t('board.hostA11y')} icon="plus" onPress={() => router.push({ pathname: '/host', params: { community: c.id } })} />
            </View>
          )
        ) : null}

        {c?.isMember ? <CommunityWellness communityId={c.id} /> : null}

        {c?.isMember && !c.isDefault ? <TextButton label={t('community.leave')} onPress={confirmLeave} color={p.danger} style={{ alignSelf: 'center', marginTop: 24 }} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ p }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  header: { paddingStart: 4, paddingBottom: 6 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4 },
  code: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: p.ruleStrong, borderStyle: 'dashed' },
}));
