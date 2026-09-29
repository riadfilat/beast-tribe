import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { makeStyles, useKit } from '../src/theme';
import { useI18n } from '../src/i18n';
import { fmtAgo } from '../src/i18n/format';
import { useAuth } from '../src/providers/AuthProvider';
import { markAllRead, useInbox, InboxItem } from '../src/data/inbox';
import { invalidate } from '../src/data/query';
import { Txt } from '../src/components/board/Txt';
import { Icon, IconName } from '../src/components/board/Icon';
import { Press } from '../src/components/board/Press';
import { Magnet } from '../src/components/board/people';
import { IconButton, TextButton } from '../src/components/board/controls';
import { Group, GroupRow } from '../src/components/board/list';
import { toast } from '../src/components/board/toast';
import { pushPermission, registerForPushNotificationsAsync, savePushToken } from '../src/lib/notifications';

const TYPE_ICON: Record<string, IconName> = {
  event_full: 'people',
  spot_opened: 'check',
  event_cancelled: 'warning',
  beast: 'bolt',
  comment: 'chat',
  coach_request: 'coach',
  coach_accepted: 'coach',
};

export default function InboxScreen() {
  const s = useStyles();
  const { p, lang } = useKit();
  const { t } = useI18n();
  const router = useRouter();
  const { user } = useAuth();
  const inbox = useInbox();
  const [push, setPush] = useState<'granted' | 'denied' | 'undetermined' | 'unavailable'>('unavailable');

  useEffect(() => {
    pushPermission().then(setPush);
    // Seen = read, a moment after opening.
    const id = setTimeout(() => {
      markAllRead(user?.id).then(() => invalidate('inbox:unread'));
    }, 1200);
    return () => clearTimeout(id);
  }, []);

  function text(n: InboxItem) {
    const vars = { actor: n.actorName || t('inbox.someone'), event: n.eventTitle || t('inbox.aSession') };
    const key = `inbox.types.${n.type}`;
    const out = t(key, vars);
    return out === key ? t('inbox.types.fallback') : out;
  }

  function openItem(n: InboxItem) {
    if (n.type === 'coach_request') router.push('/(tabs)/profile');
    else if (n.type === 'coach_accepted') router.push('/(tabs)/profile/coach-dashboard');
    else if (n.eventId) router.push({ pathname: '/session/[id]', params: { id: n.eventId } });
    else if (n.postId) router.push('/(tabs)/feed');
  }

  async function enablePush() {
    const token = await registerForPushNotificationsAsync().catch(() => null);
    if (token && user?.id) {
      await savePushToken(user.id).catch(() => {});
      setPush('granted');
    } else {
      setPush(await pushPermission());
      toast.show(t('inbox.pushDenied'), 'info');
    }
  }

  const items = inbox.data ?? [];
  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'));

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <View style={s.header}>
        <IconButton name="back" label={t('common.back')} onPress={back} />
        <Txt v="title" size={22} style={{ flex: 1 }} accessibilityRole="header">
          {t('inbox.title')}
        </Txt>
        {items.some((n) => !n.read) ? (
          <TextButton label={t('inbox.markAllRead')} onPress={() => markAllRead(user?.id).then(() => { invalidate('inbox:'); })} style={{ paddingHorizontal: 8 }} />
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={inbox.refreshing} onRefresh={inbox.refetch} tintColor={p.ink} />}
      >
        {push === 'undetermined' || push === 'denied' ? (
          <Group style={{ margin: 16 }}>
            <GroupRow icon="bell" label={t('inbox.pushTitle')} sub={t('inbox.pushBody')} value={t('inbox.pushOn')} onPress={enablePush} />
          </Group>
        ) : null}

        {!inbox.loading && items.length === 0 ? (
          <View style={s.empty}>
            <Icon name="bell" size={30} color={p.inkFaint} />
            <Txt v="body" color={p.inkSoft} align="center">
              {t('inbox.empty')}
            </Txt>
          </View>
        ) : null}

        {items.map((n, i) => (
          <Press key={n.id} onPress={() => openItem(n)} feedback="selection" depress={0.99} style={[s.row, i === items.length - 1 ? { borderBottomWidth: 0 } : null]}>
            {n.actorName ? (
              <Magnet person={{ id: n.actorId || n.id, name: n.actorName }} size={38} />
            ) : (
              <View style={s.typeIcon}>
                <Icon name={TYPE_ICON[n.type] ?? 'info'} size={17} color={n.type === 'event_cancelled' ? p.danger : p.ink} />
              </View>
            )}
            <View style={{ flex: 1, gap: 2 }}>
              <Txt v="body" size={15} color={n.read ? p.inkSoft : p.ink}>
                {text(n)}
              </Txt>
              <Txt v="caption">{fmtAgo(n.createdAt, lang)}</Txt>
            </View>
            {!n.read ? <View style={s.dot} /> : null}
          </Press>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ p }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  header: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingStart: 4, paddingEnd: 8, paddingBottom: 6 },
  empty: { alignItems: 'center', gap: 12, paddingHorizontal: 40, paddingTop: 80 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: p.rule },
  typeIcon: { width: 38, height: 38, borderRadius: 8, borderWidth: 1.5, borderColor: p.ruleStrong, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: p.marker },
}));
