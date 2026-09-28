import React, { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { makeStyles, useKit } from '../src/theme';
import { useI18n } from '../src/i18n';
import { useAuth } from '../src/providers/AuthProvider';
import { useMySessions } from '../src/data/sessions';
import { PREVIEW, PREVIEW_ME } from '../src/data/preview';
import { Txt } from '../src/components/board/Txt';
import { IconButton, MarkerButton, Segmented } from '../src/components/board/controls';
import { SessionRow, useNow } from '../src/components/board/session';

export default function MySessionsScreen() {
  const s = useStyles();
  const { p } = useKit();
  const { t } = useI18n();
  const router = useRouter();
  const { user } = useAuth();
  const meId = PREVIEW ? PREVIEW_ME : user?.id;
  const q = useMySessions();
  const now = useNow();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  const all = q.data ?? [];
  const upcoming = all.filter((x) => x.state === 'upcoming' || x.state === 'live' || (x.state === 'cancelled' && x.startsAt.getTime() > now));
  const past = all
    .filter((x) => x.state === 'finished' || (x.state === 'cancelled' && x.startsAt.getTime() <= now))
    .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime());
  const list = tab === 'upcoming' ? upcoming : past;
  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'));

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <View style={s.header}>
        <IconButton name="back" label={t('common.back')} onPress={back} />
        <Txt v="title" size={22} accessibilityRole="header">
          {t('mySessions.title')}
        </Txt>
      </View>
      <Segmented
        value={tab}
        onChange={setTab}
        style={{ marginHorizontal: 16, marginBottom: 8 }}
        options={[
          { value: 'upcoming', label: `${t('mySessions.upcoming')} ${upcoming.length || ''}`.trim() },
          { value: 'past', label: `${t('mySessions.past')} ${past.length || ''}`.trim() },
        ]}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={q.refreshing} onRefresh={q.refetch} tintColor={p.ink} />}>
        {!q.loading && list.length === 0 ? (
          <View style={s.empty}>
            <Txt v="body" color={p.inkSoft} align="center">
              {t('mySessions.empty')}
            </Txt>
            <MarkerButton label={t('you.findSession')} onPress={() => router.push('/(tabs)/events')} style={{ alignSelf: 'stretch' }} />
          </View>
        ) : (
          list.map((x, i) => (
            <SessionRow
              key={x.id}
              s={x}
              now={now}
              meId={meId}
              size={tab === 'past' ? 'compact' : 'normal'}
              showDay
              last={i === list.length - 1}
              onPress={() => router.push({ pathname: '/session/[id]', params: { id: x.id } })}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ p }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  header: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingStart: 4, paddingBottom: 10 },
  empty: { alignItems: 'center', gap: 18, paddingHorizontal: 32, paddingTop: 60 },
}));
