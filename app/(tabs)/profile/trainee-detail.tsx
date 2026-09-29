import React, { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { makeStyles, useKit } from '../../../src/theme';
import { useI18n } from '../../../src/i18n';
import { fmtDay, fmtShortDate } from '../../../src/i18n/format';
import { useAuth } from '../../../src/providers/AuthProvider';
import { PREVIEW, PREVIEW_ME } from '../../../src/data/preview';
import {
  addCoachNote,
  CoachNote,
  deleteCoachNote,
  endCoaching,
  Measurement,
  NOTE_TYPES,
  NoteType,
  recordMeasurement,
  sharesLine,
  useCoachNotes,
  useCoachProfile,
  useMeasurements,
  useTraineeIntake,
  useTraineeSessions,
  useTrainees,
} from '../../../src/data/coaching';
import { Magnet } from '../../../src/components/board/people';
import { Txt } from '../../../src/components/board/Txt';
import { Icon } from '../../../src/components/board/Icon';
import { Press } from '../../../src/components/board/Press';
import { Tag, TagTone } from '../../../src/components/board/marks';
import { Chip, Field, IconButton, MarkerButton, Segmented, SectionHeading } from '../../../src/components/board/controls';
import { Group, GroupRow } from '../../../src/components/board/list';
import { Sheet } from '../../../src/components/board/sheet';
import { toast } from '../../../src/components/board/toast';
import { haptic } from '../../../src/lib/haptics';

type Tab = 'overview' | 'body' | 'food' | 'notes';
const NOTE_TONE: Record<NoteType, TagTone> = { feedback: 'ink', goal: 'aqua', milestone: 'marker', program: 'ink', warning: 'danger' };
const fmtNum = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const dayOf = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export default function TraineeDetailScreen() {
  const s = useStyles();
  const { p, lang } = useKit();
  const { t, tn } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const meId = PREVIEW ? PREVIEW_ME : user?.id ?? null;
  const { traineeId } = useLocalSearchParams<{ traineeId: string }>();
  const coachId = useCoachProfile().data?.id ?? null;
  const list = useTrainees(coachId);
  const link = (list.data ?? []).find((x) => x.person.id === traineeId);
  const sharing = link?.sharing ?? { nutrition: false, body: false };
  const [tab, setTab] = useState<Tab>('overview');
  const [recording, setRecording] = useState(false);
  const [noting, setNoting] = useState(false);

  const sessions = useTraineeSessions(traineeId);
  const metrics = useMeasurements(traineeId, sharing.body);
  const intake = useTraineeIntake(traineeId, sharing.nutrition);
  const notes = useCoachNotes(coachId, traineeId);

  const name = link?.person.name ?? '';
  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile/coach-dashboard'));

  function stop() {
    if (!link) return;
    Alert.alert(t('coach.remove'), t('coach.removeConfirm', { name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('coach.remove'),
        style: 'destructive',
        onPress: async () => {
          try {
            await endCoaching(link.linkId);
            back();
          } catch {
            toast.show(t('common.somethingWrong'), 'error');
          }
        },
      },
    ]);
  }

  function removeNote(n: CoachNote) {
    if (!coachId || !traineeId) return;
    Alert.alert(t('coach.deleteNote'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          notes.setData((prev) => prev?.filter((x) => x.id !== n.id));
          try {
            await deleteCoachNote(coachId, traineeId, n.id);
          } catch {
            toast.show(t('common.somethingWrong'), 'error');
            notes.refetch();
          }
        },
      },
    ]);
  }

  const days = intake.data ?? [];
  const logged = days.filter((d) => d.meals > 0);
  const avg = logged.length ? logged.reduce((a, d) => a + d.calories, 0) / logged.length : 0;
  const ms = metrics.data ?? [];
  const latest = ms[0];
  const first = ms.length > 1 ? ms[ms.length - 1] : null;
  const delta = latest?.weight != null && first?.weight != null ? Math.round((latest.weight - first.weight) * 10) / 10 : null;

  const notShared = (
    <View style={s.locked}>
      <Icon name="lock" size={22} color={p.inkFaint} />
      <Txt v="body" color={p.inkSoft} align="center">
        {t('coach.notShared', { name })}
      </Txt>
    </View>
  );

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <View style={s.header}>
        <IconButton name="back" label={t('common.back')} onPress={back} />
        <View style={{ flex: 1 }} />
        {link ? <IconButton name="more" label={t('coach.remove')} onPress={stop} /> : null}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={sessions.refreshing || notes.refreshing}
            onRefresh={() => {
              list.refetch();
              sessions.refetch();
              metrics.refetch();
              intake.refetch();
              notes.refetch();
            }}
            tintColor={p.ink}
          />
        }
      >
        <View style={s.identity}>
          {link ? <Magnet person={link.person} size={64} /> : null}
          <View style={{ flex: 1, gap: 4 }}>
            <Txt v="title" size={26} numberOfLines={2} accessibilityRole="header">
              {name}
            </Txt>
            {link ? (
              <Txt v="meta">
                {[link.since ? t('coach.since', { date: fmtShortDate(link.since, lang) }) : null, sharesLine(t, sharing)].filter(Boolean).join(' · ')}
              </Txt>
            ) : null}
          </View>
        </View>

        <Segmented
          style={{ marginHorizontal: 16, marginTop: 18 }}
          value={tab}
          onChange={setTab}
          options={[
            { value: 'overview', label: t('coach.overview') },
            { value: 'body', label: t('coach.body') },
            { value: 'food', label: t('coach.food') },
            { value: 'notes', label: t('coach.notes') },
          ]}
        />

        {tab === 'overview' ? (
          <View style={s.body}>
            <SectionHeading title={t('coach.sessions30')} />
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
              <Txt v="time" size={40}>
                {sessions.data?.length ?? 0}
              </Txt>
            </View>
            {(sessions.data ?? []).length === 0 && !sessions.loading ? <Txt v="meta">{t('coach.noSessions')}</Txt> : null}
            {(sessions.data ?? []).slice(0, 5).map((x) => (
              <View key={x.id} style={s.line}>
                <Icon sport={x.sport} size={16} color={p.inkSoft} />
                <Txt v="body" style={{ flex: 1 }} numberOfLines={1}>
                  {x.title}
                </Txt>
                <Txt v="meta">{fmtDay(x.startsAt, lang)}</Txt>
              </View>
            ))}

            {sharing.body && latest ? (
              <>
                <SectionHeading title={t('coach.body')} style={{ marginTop: 18 }} />
                <Txt v="time" size={28}>
                  {latest.weight != null ? t('coach.kg', { n: latest.weight }) : '—'}
                </Txt>
                {delta != null && first ? (
                  <Txt v="meta">{t('coach.fromFirst', { delta: delta > 0 ? `+${delta}` : delta < 0 ? `\u2212${Math.abs(delta)}` : '0', date: fmtShortDate(first.at, lang) })}</Txt>
                ) : null}
              </>
            ) : null}

            {sharing.nutrition && logged.length ? (
              <>
                <SectionHeading title={t('coach.food')} style={{ marginTop: 18 }} />
                <Txt v="body">{t('coach.avgDay', { n: fmtNum(avg) })}</Txt>
                <Txt v="meta">{tn('coach.daysLogged', logged.length)}</Txt>
              </>
            ) : null}
          </View>
        ) : null}

        {tab === 'body' ? (
          <View style={s.body}>
            {!sharing.body ? (
              notShared
            ) : (
              <>
                {ms.length === 0 && !metrics.loading ? <Txt v="meta">{t('coach.noMeasurements')}</Txt> : null}
                {ms.map((m) => (
                  <MeasurementRow key={m.id} m={m} />
                ))}
              </>
            )}
          </View>
        ) : null}

        {tab === 'food' ? (
          <View style={s.body}>
            {!sharing.nutrition ? (
              notShared
            ) : (
              <>
                <Txt v="meta" style={{ marginBottom: 6 }}>
                  {logged.length ? `${t('coach.avgDay', { n: fmtNum(avg) })} · ${tn('coach.daysLogged', logged.length)}` : tn('coach.daysLogged', 0)}
                </Txt>
                {[...days].reverse().map((d) => (
                  <View key={d.date} style={s.line}>
                    <Txt v="body" style={{ flex: 1 }}>
                      {fmtDay(dayOf(d.date), lang)}
                    </Txt>
                    {d.meals ? (
                      <>
                        <Txt v="meta">{t('coach.proteinDay', { n: fmtNum(d.protein) })}</Txt>
                        <Txt v="time" size={16} style={{ minWidth: 64, textAlign: 'right' }}>
                          {fmtNum(d.calories)}
                        </Txt>
                      </>
                    ) : (
                      <Txt v="meta">—</Txt>
                    )}
                  </View>
                ))}
              </>
            )}
          </View>
        ) : null}

        {tab === 'notes' ? (
          <View style={s.body}>
            {(notes.data ?? []).length === 0 && !notes.loading ? <Txt v="meta">{t('coach.noNotes')}</Txt> : null}
            {(notes.data ?? []).map((n) => (
              <Press key={n.id} onPress={() => removeNote(n)} feedback="selection" depress={0.99} style={s.note} accessibilityHint={t('coach.deleteNote')}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Tag label={t(`coach.noteTypes.${n.type}`)} tone={NOTE_TONE[n.type]} />
                  {n.isPrivate ? <Icon name="lock" size={12} color={p.inkFaint} /> : null}
                  <View style={{ flex: 1 }} />
                  <Txt v="caption">{fmtShortDate(n.at, lang)}</Txt>
                </View>
                <Txt v="body">{n.content}</Txt>
              </Press>
            ))}
          </View>
        ) : null}
      </ScrollView>

      {(tab === 'body' && sharing.body) || tab === 'notes' ? (
        <View style={[s.bar, { paddingBottom: 12 + insets.bottom }]}>
          {tab === 'body' ? (
            <MarkerButton label={t('coach.record')} icon="plus" onPress={() => setRecording(true)} />
          ) : (
            <MarkerButton label={t('coach.addNote')} icon="edit" onPress={() => setNoting(true)} disabled={!link || link.status === 'pending'} />
          )}
        </View>
      ) : null}

      {meId && traineeId ? <RecordSheet visible={recording} meId={meId} traineeId={traineeId} onClose={() => setRecording(false)} /> : null}
      {coachId && traineeId ? <NoteSheet visible={noting} coachId={coachId} traineeId={traineeId} name={name} onClose={() => setNoting(false)} /> : null}
    </SafeAreaView>
  );
}

function MeasurementRow({ m }: { m: Measurement }) {
  const s = useStyles();
  const { lang } = useKit();
  const { t } = useI18n();
  const parts = [
    m.weight != null ? t('coach.kg', { n: m.weight }) : null,
    m.bodyFat != null ? `${m.bodyFat}%` : null,
    m.waist != null ? `${t('coach.waist').replace(/\s*\(.*\)$/, '')} ${m.waist}` : null,
    m.chest != null ? `${t('coach.chest').replace(/\s*\(.*\)$/, '')} ${m.chest}` : null,
    m.bmi != null ? `${t('coach.bmi')} ${m.bmi}` : null,
  ].filter(Boolean);
  return (
    <View style={s.note}>
      <Txt v="label" size={14}>
        {fmtDay(m.at, lang)}
      </Txt>
      <Txt v="body">{parts.join(' · ')}</Txt>
      {m.notes ? <Txt v="meta">{m.notes}</Txt> : null}
    </View>
  );
}

function RecordSheet({ visible, meId, traineeId, onClose }: { visible: boolean; meId: string; traineeId: string; onClose: () => void }) {
  const { t } = useI18n();
  const [f, setF] = useState({ weight: '', height: '', bodyFat: '', waist: '', chest: '', notes: '' });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (visible) setF({ weight: '', height: '', bodyFat: '', waist: '', chest: '', notes: '' });
  }, [visible]);
  const num = (v: string) => {
    const n = Number(v.replace(',', '.'));
    return v.trim() && isFinite(n) && n > 0 ? n : null;
  };
  const any = ['weight', 'height', 'bodyFat', 'waist', 'chest'].some((k) => num((f as any)[k]) != null);

  async function save() {
    if (!any) return;
    setBusy(true);
    try {
      await recordMeasurement(meId, traineeId, { weight: num(f.weight), height: num(f.height), bodyFat: num(f.bodyFat), waist: num(f.waist), chest: num(f.chest), notes: f.notes });
      haptic('success');
      toast.show(t('coach.saved'), 'info');
      onClose();
    } catch {
      toast.show(t('common.somethingWrong'), 'error');
    } finally {
      setBusy(false);
    }
  }

  const fields: { k: keyof typeof f; label: string }[] = [
    { k: 'weight', label: t('coach.weight') },
    { k: 'height', label: t('coach.height') },
    { k: 'bodyFat', label: t('coach.bodyFat') },
    { k: 'waist', label: t('coach.waist') },
    { k: 'chest', label: t('coach.chest') },
  ];
  return (
    <Sheet visible={visible} title={t('coach.record')} onClose={onClose} action={{ label: busy ? t('common.saving') : t('common.save'), onPress: save, disabled: !any || busy }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {fields.map((x) => (
          <View key={x.k} style={{ width: '48%', gap: 6 }}>
            <Txt v="caption">{x.label}</Txt>
            <Field value={f[x.k]} onChangeText={(v) => setF((prev) => ({ ...prev, [x.k]: v }))} keyboardType="decimal-pad" placeholder="0" maxLength={5} style={{ textAlign: 'center' }} />
          </View>
        ))}
      </View>
      <Field value={f.notes} onChangeText={(v) => setF((prev) => ({ ...prev, notes: v }))} placeholder={t('coach.notesOptional')} multiline maxLength={300} />
    </Sheet>
  );
}

function NoteSheet({ visible, coachId, traineeId, name, onClose }: { visible: boolean; coachId: string; traineeId: string; name: string; onClose: () => void }) {
  const { t } = useI18n();
  const [type, setType] = useState<NoteType>('feedback');
  const [text, setText] = useState('');
  const [priv, setPriv] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (visible) {
      setType('feedback');
      setText('');
      setPriv(false);
    }
  }, [visible]);

  async function save() {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await addCoachNote(coachId, traineeId, type, text, priv);
      haptic('success');
      onClose();
    } catch {
      toast.show(t('common.somethingWrong'), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet visible={visible} title={t('coach.addNote')} onClose={onClose} action={{ label: busy ? t('common.saving') : t('common.save'), onPress: save, disabled: !text.trim() || busy }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {NOTE_TYPES.map((x) => (
          <Chip key={x} label={t(`coach.noteTypes.${x}`)} selected={type === x} onPress={() => setType(x)} />
        ))}
      </View>
      <Field value={text} onChangeText={setText} placeholder={t('coach.notePlaceholder')} multiline autoFocus maxLength={1000} />
      <Group>
        <GroupRow icon="lock" label={t('coach.privateNote')} sub={priv ? t('coach.privateSub', { name }) : t('coach.sharedNote', { name })} toggle={priv} onToggle={setPriv} />
      </Group>
    </Sheet>
  );
}

const useStyles = makeStyles(({ p }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16 },
  body: { paddingHorizontal: 16, paddingTop: 10 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: p.rule },
  note: { gap: 6, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: p.rule },
  locked: { alignItems: 'center', gap: 10, paddingHorizontal: 24, paddingTop: 40 },
  bar: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: p.rule, backgroundColor: p.boardDeep },
}));
