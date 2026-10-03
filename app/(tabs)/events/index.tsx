import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { makeStyles, useKit } from '../../../src/theme';
import { useI18n } from '../../../src/i18n';
import { addDays, dayOffset, fmtDay, localDateKey, startOfLocalDay } from '../../../src/i18n/format';
import { useAuth } from '../../../src/providers/AuthProvider';
import { useBoardSessions } from '../../../src/data/sessions';
import { useMySports } from '../../../src/data/member';
import { useOpenCommunities } from '../../../src/data/communities';
import { CommunityRow } from '../../../src/components/board/communities';
import { PREVIEW, PREVIEW_ME } from '../../../src/data/preview';
import type { Session } from '../../../src/data/model';
import { Txt } from '../../../src/components/board/Txt';
import { Icon } from '../../../src/components/board/Icon';
import { Chip, Field, IconButton, MarkerButton, SectionHeading } from '../../../src/components/board/controls';
import { Press } from '../../../src/components/board/Press';
import { DayHeading, SessionRow, useNow } from '../../../src/components/board/session';

type SportFilter = 'all' | 'mine' | string;

export default function ExploreScreen() {
  const s = useStyles();
  const { p, lang } = useKit();
  const { t } = useI18n();
  const router = useRouter();
  const { user } = useAuth();
  const meId = PREVIEW ? PREVIEW_ME : user?.id;
  const q = useBoardSessions(14);
  const mySports = useMySports().data ?? [];
  const openCommunities = useOpenCommunities();
  const discover = (openCommunities.data ?? []).slice(0, 3);
  const now = useNow();
  const [sport, setSport] = useState<SportFilter>('all');
  const [day, setDay] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const open = useMemo(() => (q.data ?? []).filter((x) => x.state === 'upcoming' || x.state === 'live'), [q.data, now]);

  // Only offer filters that lead somewhere.
  const sportCounts = useMemo(() => {
    const m = new Map<string, number>();
    open.forEach((x) => m.set(x.sport, (m.get(x.sport) ?? 0) + 1));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [open]);
  const days = useMemo(() => {
    const base = startOfLocalDay(new Date(now));
    return Array.from({ length: 7 }, (_, i) => addDays(base, i)).map((d) => ({
      key: localDateKey(d),
      date: d,
      count: open.filter((x) => localDateKey(x.startsAt) === localDateKey(d)).length,
    }));
  }, [open, now]);

  const needle = search.trim().toLowerCase();
  const filtered = open.filter((x) => {
    if (sport === 'mine' && !mySports.includes(x.sport)) return false;
    if (sport !== 'all' && sport !== 'mine' && x.sport !== sport) return false;
    if (day && localDateKey(x.startsAt) !== day) return false;
    if (needle) {
      const hay = [x.title, x.place, x.city, x.coachName, x.host?.name, t(`sports.${x.sport}`)].filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });

  const groups: { key: string; label: string; items: Session[] }[] = [];
  filtered.forEach((x) => {
    const key = localDateKey(x.startsAt);
    let g = groups.find((y) => y.key === key);
    if (!g) {
      const off = dayOffset(x.startsAt, new Date(now));
      g = { key, label: off <= 0 ? t('board.today') : fmtDay(x.startsAt, lang, new Date(now)), items: [] };
      groups.push(g);
    }
    g.items.push(x);
  });

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <ScrollView
        stickyHeaderIndices={[2]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardDismissMode="on-drag"
        refreshControl={<RefreshControl refreshing={q.refreshing} onRefresh={q.refetch} tintColor={p.ink} />}
      >
        <View style={s.header}>
          <Txt v="title" size={32} accessibilityRole="header" style={{ flex: 1 }}>
            {t('tabs.explore')}
          </Txt>
          <IconButton name="plus" label={t('board.hostA11y')} onPress={() => router.push('/host')} />
        </View>
        <View style={s.tiles}>
          <Press onPress={() => router.push('/partners')} feedback="light" accessibilityRole="button" style={s.tile}>
            <Icon name="people" size={20} color={p.aqua} />
            <Txt v="row" size={14}>{t('partners.title')}</Txt>
            <Txt v="caption" numberOfLines={2}>{t('partners.tileSub')}</Txt>
          </Press>
          <Press onPress={() => router.push('/assistant')} feedback="light" accessibilityRole="button" style={s.tile}>
            <Icon name="sparkle" size={20} color={p.marker} />
            <Txt v="row" size={14}>{t('assistant.title')}</Txt>
            <Txt v="caption" numberOfLines={2}>{t('assistant.tileSub')}</Txt>
          </Press>
        </View>

        {/* Filters stay pinned while the schedule scrolls */}
        <View style={s.filters}>
          <View style={{ paddingHorizontal: 16 }}>
            <Field
              value={search}
              onChangeText={setSearch}
              placeholder={t('explore.search')}
              returnKeyType="search"
              autoCorrect={false}
              trailing={search ? <IconButton name="close" label={t('explore.clear')} size={16} onPress={() => setSearch('')} /> : <Icon name="explore" size={18} color={p.inkFaint} />}
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow} keyboardShouldPersistTaps="handled">
            <Chip label={t('explore.allSports')} selected={sport === 'all'} onPress={() => setSport('all')} />
            {mySports.length ? <Chip label={t('explore.mySports')} icon="sparkle" selected={sport === 'mine'} onPress={() => setSport('mine')} /> : null}
            {sportCounts.map(([id, n]) => (
              <Chip key={id} sport={id} label={`${t(`sports.${id}`)} ${n}`} selected={sport === id} onPress={() => setSport(sport === id ? 'all' : id)} />
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
            {days.map((d, i) => (
              <Chip
                key={d.key}
                label={`${i === 0 ? t('board.today') : i === 1 ? t('board.tomorrow') : fmtDay(d.date, lang, new Date(now))}${d.count ? ` · ${d.count}` : ''}`}
                selected={day === d.key}
                disabled={!d.count}
                onPress={() => setDay(day === d.key ? null : d.key)}
              />
            ))}
          </ScrollView>
        </View>

        {q.loading && !q.data ? null : groups.length === 0 ? (
          <View style={s.empty}>
            <Txt v="body" color={p.inkSoft} align="center">
              {t('explore.noResults')}
            </Txt>
            <MarkerButton label={t('board.hostA11y')} icon="plus" onPress={() => router.push('/host')} style={{ alignSelf: 'stretch' }} />
          </View>
        ) : (
          groups.map((g, gi) => (
            <View key={g.key}>
              <DayHeading label={g.label} first={gi === 0} />
              {g.items.map((x, i) => (
                <SessionRow
                  key={x.id}
                  s={x}
                  now={now}
                  meId={meId}
                  last={i === g.items.length - 1}
                  onPress={() => router.push({ pathname: '/session/[id]', params: { id: x.id } })}
                />
              ))}
            </View>
          ))
        )}

        {discover.length ? (
          <View style={{ paddingHorizontal: 16, marginTop: 28 }}>
            <SectionHeading title={t('explore.openCommunities')} action={t('common.seeAll')} onAction={() => router.push({ pathname: '/(tabs)/feed', params: { tab: 'communities' } })} />
            {discover.map((c, i) => (
              <CommunityRow key={c.id} c={c} onJoined={() => { openCommunities.refetch(); q.refetch(); }} last={i === discover.length - 1} />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ p }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  header: { flexDirection: 'row', alignItems: 'center', paddingStart: 16, paddingEnd: 8, paddingTop: 6, paddingBottom: 8 },
  tiles: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 10 },
  tile: { flex: 1, gap: 4, padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: p.rule },
  filters: { backgroundColor: p.board, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: p.rule, gap: 2, paddingTop: 4 },
  chipRow: { paddingHorizontal: 16, paddingTop: 10, gap: 8 },
  empty: { paddingHorizontal: 32, paddingTop: 48, gap: 18, alignItems: 'center' },
}));
