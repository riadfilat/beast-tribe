import React, { useMemo, useState } from 'react';
import { Image, RefreshControl, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { makeStyles, useKit } from '../src/theme';
import { useI18n } from '../src/i18n';
import { Facility, useFacilities } from '../src/data/facilities';
import { money } from '../src/data/dues';
import { cityLabel } from '../src/lib/cities';
import { Txt } from '../src/components/board/Txt';
import { Icon } from '../src/components/board/Icon';
import { Press } from '../src/components/board/Press';
import { Chip, IconButton, SectionHeading } from '../src/components/board/controls';

// Book a court: courts, pitches, halls and school facilities listed by venues.
export default function CourtsScreen() {
  const s = useStyles();
  const { p, lang } = useKit();
  const { t } = useI18n();
  const router = useRouter();
  const q = useFacilities(lang);
  const [sport, setSport] = useState<string | null>(null);
  const all = q.data ?? [];
  const sports = useMemo(() => Array.from(new Set(all.flatMap((f) => f.sports))), [all]);
  const list = sport ? all.filter((f) => f.sports.includes(sport)) : all;
  // Your community's own courts first (private ones only members see), then everything else, best first.
  const ownGroups = useMemo(() => {
    const m = new Map<string, Facility[]>();
    list.filter((f) => f.reason === 'community').forEach((f) => m.set(f.communityName || '', [...(m.get(f.communityName || '') || []), f]));
    return Array.from(m.entries());
  }, [list]);
  const others = list.filter((f) => f.reason !== 'community');
  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/events'));

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <View style={s.top}>
        <IconButton name="back" label={t('common.back')} onPress={back} />
        <Txt v="row" size={15} style={{ flex: 1, textAlign: 'center' }}>
          {t('courts.title')}
        </Txt>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={q.refreshing} onRefresh={q.refetch} tintColor={p.ink} />}>
        {sports.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
            <Chip label={t('explore.allSports')} selected={!sport} onPress={() => setSport(null)} />
            {sports.map((id) => (
              <Chip key={id} sport={id} label={t(`sports.${id}`)} selected={sport === id} onPress={() => setSport(sport === id ? null : id)} />
            ))}
          </ScrollView>
        ) : (
          <View style={{ height: 12 }} />
        )}
        {q.loading ? null : list.length ? (
          <View style={{ paddingHorizontal: 16, gap: 14 }}>
            {ownGroups.map(([name, fs]) => (
              <View key={name} style={{ gap: 14 }}>
                <SectionHeading title={name || t('courts.yourCommunity')} />
                {fs.map((f) => (
                  <FacilityCard key={f.id} f={f} onPress={() => router.push({ pathname: '/court/[id]', params: { id: f.id } })} />
                ))}
              </View>
            ))}
            {others.length ? <SectionHeading title={ownGroups.length ? t('courts.forYou') : t('courts.title')} style={{ marginTop: ownGroups.length ? 8 : 0 }} /> : null}
            {others.map((f) => (
              <FacilityCard key={f.id} f={f} onPress={() => router.push({ pathname: '/court/[id]', params: { id: f.id } })} />
            ))}
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20, paddingTop: 24, gap: 10 }}>
            <Txt v="title" size={22}>
              {t('courts.emptyTitle')}
            </Txt>
            <Txt v="body" color={p.inkSoft}>
              {t('courts.emptyBody')}
            </Txt>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function FacilityCard({ f, onPress }: { f: Facility; onPress: () => void }) {
  const s = useStyles();
  const { p, lang } = useKit();
  const { t } = useI18n();
  return (
    <Press onPress={onPress} feedback="light" accessibilityRole="button" style={s.card}>
      {f.imageUrl ? <Image source={{ uri: f.imageUrl }} style={s.img} accessibilityIgnoresInvertColors /> : <View style={[s.img, { alignItems: 'center', justifyContent: 'center' }]}><Icon sport={f.sport} size={34} color={p.inkFaint} /></View>}
      <View style={{ padding: 14, gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon sport={f.sport} size={16} color={p.aqua} />
          <Txt v="row" size={16} style={{ flex: 1 }} numberOfLines={1}>
            {f.name}
          </Txt>
        </View>
        <Txt v="caption" numberOfLines={1}>
          {[f.venue, cityLabel(f.city, lang)].filter(Boolean).join(' · ')}
        </Txt>
        {!f.bookable ? (
          <Txt v="body" size={14} color={p.inkSoft} style={{ marginTop: 4 }}>
            {t('courts.classesOnly')}
          </Txt>
        ) : f.price === 0 ? (
          <Txt v="body" size={14} color={p.inkSoft} style={{ marginTop: 4 }}>
            {t('courts.freeLine', { n: f.maxPlayers, min: f.slotMinutes })}
          </Txt>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 4 }}>
            <Txt v="time" size={22} color={p.markerText}>
              {money(f.price / f.maxPlayers)}
            </Txt>
            <Txt v="caption" style={{ flex: 1, paddingBottom: 2 }}>
              {t('courts.eachLine', { total: money(f.price), n: f.maxPlayers, min: f.slotMinutes })}
            </Txt>
          </View>
        )}
        {f.sports.length > 1 ? <Txt v="caption">{f.sports.map((x) => t(`sports.${x}`)).join(' · ')}</Txt> : null}
        {f.audience === 'women' || f.isSchool || f.audience === 'community' || f.dailyLimit ? (
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            {f.audience === 'women' ? <Badge label={t('session.womenOnly')} /> : null}
            {f.isSchool ? <Badge label={t('courts.school')} /> : null}
            {f.audience === 'community' ? <Badge label={t('courts.membersOnly')} /> : null}
            {f.dailyLimit ? <Badge label={t('courts.dailyLimit', { n: f.dailyLimit })} /> : null}
          </View>
        ) : null}
      </View>
    </Press>
  );
}

function Badge({ label }: { label: string }) {
  const { p } = useKit();
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, borderWidth: 1.5, borderColor: p.aqua }}>
      <Txt v="label" size={11} color={p.aqua}>
        {label}
      </Txt>
    </View>
  );
}

const useStyles = makeStyles(({ p }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingBottom: 4 },
  chips: { gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  card: { borderRadius: 12, borderWidth: 1.5, borderColor: p.rule, overflow: 'hidden', backgroundColor: p.boardDeep },
  img: { width: '100%', height: 150, backgroundColor: p.wash },
}));
