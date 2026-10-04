import React, { useState } from 'react';
import { Alert, Platform, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter, Redirect } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { makeStyles, useKit } from '../../src/theme';
import { useI18n } from '../../src/i18n';
import { useAuth } from '../../src/providers/AuthProvider';
import { leavePlan, ProgramSession, startPlan, useMyPlan, useProgram } from '../../src/data/programs';
import { Txt } from '../../src/components/board/Txt';
import { Icon } from '../../src/components/board/Icon';
import { IconButton, MarkerButton, SectionHeading, TextButton } from '../../src/components/board/controls';
import { SessionRows } from '../../src/components/board/plan';
import { LevelTag } from '../../src/components/board/level';
import { toast } from '../../src/components/board/toast';
import { TRAIN_ENABLED } from '../../src/lib/constants';

// A plan in full: what it's for, how it works, every week's sessions, and one button to start.
function ProgramScreenInner() {
  const s = useStyles();
  const { p, lang } = useKit();
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { user } = useAuth();
  const q = useProgram(slug, lang);
  const mine = useMyPlan(lang);
  const [busy, setBusy] = useState(false);
  const prog = q.data?.program;
  const isMine = !!prog && mine.data?.program.id === prog.id;
  const sessions: ProgramSession[] = isMine ? mine.data!.sessions : q.data?.sessions ?? [];
  const weeks = Array.from(new Set(sessions.map((x) => x.week)));
  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/train'));

  const confirm = (msg: string, go: () => void) => {
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) go();
      return;
    }
    Alert.alert('', msg, [{ text: t('common.cancel'), style: 'cancel' }, { text: t('common.continue'), onPress: go }]);
  };

  async function start() {
    if (!user || !prog) return;
    const run = async () => {
      setBusy(true);
      try {
        await startPlan(user.id, prog.id);
        await mine.refetch();
        back();
      } catch {
        toast.show(t('onboarding.saveError'), 'error');
      } finally {
        setBusy(false);
      }
    };
    if (mine.data && !isMine) confirm(t('plan.switchConfirm', { plan: prog.title, current: mine.data.program.title }), run);
    else run();
  }

  async function leave() {
    if (!user || !prog) return;
    confirm(t('plan.leaveConfirm', { plan: prog.title }), async () => {
      try {
        await leavePlan(user.id);
        await mine.refetch();
      } catch {
        toast.show(t('onboarding.saveError'), 'error');
      }
    });
  }

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <View style={s.topRow}>
        <IconButton name="back" label={t('common.back')} onPress={back} />
        <View style={{ width: 44 }} />
      </View>
      {!prog ? null : (
        <>
          <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
            <View style={{ paddingHorizontal: 20, gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon sport={prog.sport} size={16} color={p.inkSoft} />
                <Txt v="label" size={13} color={p.inkSoft}>
                  {isMine ? t('plan.current') : t(`plan.goals.${prog.goal}`)}
                </Txt>
              </View>
              <Txt v="hero" size={40} accessibilityRole="header">
                {lang === 'en' ? prog.title.toUpperCase() : prog.title}
              </Txt>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <LevelTag level={prog.level} />
                <Txt v="label" size={14} color={p.inkSoft}>
                  {t('plan.planMeta', { weeks: prog.weeks, days: prog.daysPerWeek, min: prog.minutes ?? 30 })}
                </Txt>
              </View>
              <Txt v="body" size={16}>
                {prog.summary}
              </Txt>
              {prog.equipment.length ? (
                <Txt v="meta">{prog.equipment.map((e) => t(`train.equipment.${e}`)).join(' · ')}</Txt>
              ) : (
                <Txt v="meta">{t('train.noKit')}</Txt>
              )}
            </View>

            {prog.principles.length ? (
              <View style={s.howBox}>
                <Txt v="label" color={p.inkSoft}>
                  {t('plan.howItWorks')}
                </Txt>
                {prog.principles.map((line, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
                    <Icon name="check" size={14} color={p.aqua} weight="bold" style={{ marginTop: 4 }} />
                    <Txt v="body" size={15} style={{ flex: 1 }}>
                      {line}
                    </Txt>
                  </View>
                ))}
              </View>
            ) : null}

            {weeks.map((w) => (
              <View key={w} style={{ marginTop: 18 }}>
                <SectionHeading title={t('plan.week', { n: w })} style={{ paddingHorizontal: 16 }} />
                <SessionRows
                  sessions={sessions.filter((x) => x.week === w)}
                  onOpen={(ps) => router.push({ pathname: '/workout/[id]', params: isMine ? { id: ps.workoutId, ps: ps.id } : { id: ps.workoutId } })}
                />
              </View>
            ))}
            {isMine ? <TextButton label={t('plan.leave')} onPress={leave} color={p.danger} style={{ alignSelf: 'center', marginTop: 24 }} /> : null}
          </ScrollView>
          {!isMine ? (
            <View style={[s.bar, { paddingBottom: 12 + insets.bottom }]}>
              <MarkerButton label={t('plan.startPlan')} onPress={start} loading={busy} />
            </View>
          ) : null}
        </>
      )}
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ p }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6 },
  howBox: { marginHorizontal: 16, marginTop: 18, padding: 14, gap: 10, borderRadius: 12, backgroundColor: p.wash },
  bar: { position: 'absolute', start: 0, end: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: p.boardDeep, borderTopWidth: 1, borderTopColor: p.rule },
}));

// Train is off for launch (TRAIN_ENABLED): old links and notifications land on the Board.
export default function ProgramScreen() {
  if (!TRAIN_ENABLED) return <Redirect href="/(tabs)/home" />;
  return <ProgramScreenInner />;
}
