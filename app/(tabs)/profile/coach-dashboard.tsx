import React, { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { makeStyles, useKit } from '../../../src/theme';
import { useI18n } from '../../../src/i18n';
import { fmtShortDate } from '../../../src/i18n/format';
import { useAuth } from '../../../src/providers/AuthProvider';
import { PREVIEW, PREVIEW_ME } from '../../../src/data/preview';
import { CoachError, endCoaching, requestTrainee, sharesLine, Trainee, useCoachProfile, useTrainees } from '../../../src/data/coaching';
import { searchMembers } from '../../../src/data/packs';
import type { Person } from '../../../src/components/board/people';
import { Magnet } from '../../../src/components/board/people';
import { Txt } from '../../../src/components/board/Txt';
import { Icon } from '../../../src/components/board/Icon';
import { Press } from '../../../src/components/board/Press';
import { Tag } from '../../../src/components/board/marks';
import { Field, IconButton, OutlineButton, SectionHeading, TextButton } from '../../../src/components/board/controls';
import { Sheet } from '../../../src/components/board/sheet';
import { toast } from '../../../src/components/board/toast';
import { haptic } from '../../../src/lib/haptics';

export default function CoachDashboardScreen() {
  const s = useStyles();
  const { p, lang } = useKit();
  const { t } = useI18n();
  const router = useRouter();
  const coach = useCoachProfile();
  const coachId = coach.data?.id ?? null;
  const list = useTrainees(coachId);
  const [adding, setAdding] = useState(false);

  const trainees = list.data ?? [];
  const active = trainees.filter((x) => x.status !== 'pending');
  const pending = trainees.filter((x) => x.status === 'pending');

  function withdraw(x: Trainee) {
    Alert.alert(t('coach.withdraw'), x.person.name, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('coach.withdraw'),
        style: 'destructive',
        onPress: async () => {
          list.setData((prev) => prev?.filter((y) => y.linkId !== x.linkId));
          try {
            await endCoaching(x.linkId);
          } catch {
            toast.show(t('common.somethingWrong'), 'error');
            list.refetch();
          }
        },
      },
    ]);
  }

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'));

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <View style={s.header}>
        <IconButton name="back" label={t('common.back')} onPress={back} />
        <Txt v="title" size={22} style={{ flex: 1 }} accessibilityRole="header">
          {t('coach.dashboard')}
        </Txt>
        {coachId ? <IconButton name="personAdd" label={t('coach.addTrainee')} onPress={() => setAdding(true)} /> : null}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={list.refreshing} onRefresh={list.refetch} tintColor={p.ink} />}
      >
        {!coach.loading && !coachId ? (
          <View style={s.empty}>
            <Icon name="coach" size={30} color={p.inkFaint} />
            <Txt v="body" color={p.inkSoft} align="center">
              {t('coach.notCoach')}
            </Txt>
          </View>
        ) : null}

        {coachId && !list.loading && trainees.length === 0 ? (
          <View style={s.empty}>
            <Icon name="coach" size={30} color={p.inkFaint} />
            <Txt v="body" color={p.inkSoft} align="center">
              {t('coach.empty')}
            </Txt>
            <OutlineButton label={t('coach.addTrainee')} icon="personAdd" onPress={() => setAdding(true)} style={{ marginTop: 8, alignSelf: 'stretch' }} />
          </View>
        ) : null}

        {active.length ? <SectionHeading title={t('coach.trainees')} style={s.section} /> : null}
        {active.map((x) => (
          <Press
            key={x.linkId}
            onPress={() => router.push({ pathname: '/(tabs)/profile/trainee-detail', params: { traineeId: x.person.id } })}
            feedback="selection"
            depress={0.99}
            style={s.row}
          >
            <Magnet person={x.person} size={44} />
            <View style={{ flex: 1, gap: 2 }}>
              <Txt v="headline" numberOfLines={1}>
                {x.person.name}
              </Txt>
              <Txt v="caption" numberOfLines={2}>
                {[x.since ? t('coach.since', { date: fmtShortDate(x.since, lang) }) : null, sharesLine(t, x.sharing)].filter(Boolean).join(' · ')}
              </Txt>
            </View>
            <Icon name="chevron" size={14} color={p.inkFaint} weight="bold" />
          </Press>
        ))}

        {pending.length ? <SectionHeading title={t('coach.requests')} style={s.section} /> : null}
        {pending.map((x) => (
          <View key={x.linkId} style={s.row}>
            <Magnet person={x.person} size={44} />
            <View style={{ flex: 1, gap: 4, alignItems: 'flex-start' }}>
              <Txt v="headline" numberOfLines={1}>
                {x.person.name}
              </Txt>
              <Tag label={t('coach.requested')} tone="ghost" icon="hourglass" />
            </View>
            <TextButton label={t('coach.withdraw')} onPress={() => withdraw(x)} color={p.inkSoft} />
          </View>
        ))}
      </ScrollView>

      {coachId ? <AddTraineeSheet visible={adding} coachId={coachId} known={trainees} onClose={() => setAdding(false)} onSent={() => list.refetch()} /> : null}
    </SafeAreaView>
  );
}

function AddTraineeSheet({ visible, coachId, known, onClose, onSent }: { visible: boolean; coachId: string; known: Trainee[]; onClose: () => void; onSent: () => void }) {
  const s = useStyles();
  const { p } = useKit();
  const { t } = useI18n();
  const { user } = useAuth();
  const meId = PREVIEW ? PREVIEW_ME : user?.id ?? null;
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Person[]>([]);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setQ('');
      setResults([]);
      setSent(new Set());
    }
  }, [visible]);

  useEffect(() => {
    let alive = true;
    const id = setTimeout(() => {
      searchMembers(q, meId).then((r) => alive && setResults(r));
    }, 250);
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [q]);

  async function send(person: Person) {
    setBusy(person.id);
    try {
      await requestTrainee(coachId, person.id);
      haptic('success');
      setSent((prev) => new Set(prev).add(person.id));
      toast.show(t('coach.requestSent'), 'info');
      onSent();
    } catch (e) {
      toast.show(e instanceof CoachError && e.code === 'ALREADY' ? t('coach.already') : t('common.somethingWrong'), 'error');
    } finally {
      setBusy(null);
    }
  }

  return (
    <Sheet visible={visible} title={t('coach.addTrainee')} onClose={onClose}>
      <Field value={q} onChangeText={setQ} placeholder={t('coach.searchPlaceholder')} autoFocus autoCapitalize="none" autoCorrect={false} trailing={<Icon name="explore" size={18} color={p.inkFaint} />} />
      {q.trim().length >= 2 && results.length === 0 ? <Txt v="meta">{t('pack.noResults')}</Txt> : null}
      {results.map((person) => {
        const onList = known.some((k) => k.person.id === person.id) || sent.has(person.id);
        return (
          <View key={person.id} style={s.result}>
            <Magnet person={person} size={38} />
            <Txt v="headline" size={15} style={{ flex: 1 }} numberOfLines={1}>
              {person.name}
            </Txt>
            {onList ? (
              <Txt v="label" color={p.aqua}>
                {t('coach.requested')}
              </Txt>
            ) : (
              <OutlineButton label={t('coach.request')} onPress={() => send(person)} loading={busy === person.id} style={{ height: 38 }} />
            )}
          </View>
        );
      })}
    </Sheet>
  );
}

const useStyles = makeStyles(({ p }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  header: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingStart: 4, paddingEnd: 4, paddingBottom: 6 },
  section: { paddingHorizontal: 16, marginTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: p.rule },
  result: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: p.rule },
  empty: { alignItems: 'center', gap: 12, paddingHorizontal: 32, paddingTop: 72 },
}));
