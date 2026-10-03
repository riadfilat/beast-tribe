import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useKit } from '../../theme';
import { useI18n } from '../../i18n';
import { useAuth } from '../../providers/AuthProvider';
import { GOALS, GOAL_SPORT, Goal, MyPlan, Program, ProgramSession, saveTrainingFocus, setWeekFocus, TrainLevel } from '../../data/programs';
import { invalidate } from '../../data/query';
import { Sheet } from './sheet';
import { Txt } from './Txt';
import { Icon } from './Icon';
import { Press } from './Press';
import { Chip, MarkerButton, OutlineButton, TextButton } from './controls';
import { toast } from './toast';

const LEVELS: TrainLevel[] = ['beginner', 'intermediate', 'advanced'];
const DAYS = [2, 3, 4, 5];

/** One screen, three questions: goal, level, days. Then Train shows the plan that fits. */
export function FocusSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { p } = useKit();
  const { t } = useI18n();
  const { user, profile, refreshProfile } = useAuth();
  const prof: any = profile;
  const [goal, setGoal] = useState<Goal | null>(prof?.train_goal ?? null);
  const [level, setLevel] = useState<TrainLevel>(prof?.train_level ?? 'beginner');
  const [days, setDays] = useState<number>(prof?.train_days ?? 3);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (visible) {
      setGoal(prof?.train_goal ?? null);
      setLevel(prof?.train_level ?? 'beginner');
      setDays(prof?.train_days ?? 3);
    }
  }, [visible]);

  async function save() {
    if (!goal || !user) return;
    setBusy(true);
    try {
      await saveTrainingFocus(user.id, { goal, level, days });
      await refreshProfile();
      invalidate('programs:');
      toast.show(t('plan.saved'), 'yours');
      onClose();
    } catch {
      toast.show(t('onboarding.saveError'), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      visible={visible}
      title={t('plan.goalTitle')}
      onClose={onClose}
      footer={<MarkerButton label={t('plan.showPlan')} onPress={goal ? save : () => toast.show(t('plan.findTitle'), 'error')} loading={busy} />}
    >
      <Txt v="title" size={24} accessibilityRole="header">
        {t('plan.findTitle')}
      </Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {GOALS.map((g) => {
          const on = goal === g;
          return (
            <Press
              key={g}
              onPress={() => setGoal(g)}
              feedback="selection"
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              style={{ width: '48%', flexGrow: 1, gap: 6, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: on ? p.ink : p.rule, backgroundColor: on ? p.ink : 'transparent' }}
            >
              <Icon sport={GOAL_SPORT[g]} size={22} color={on ? p.board : p.ink} />
              <Txt v="row" size={15} color={on ? p.board : p.ink}>
                {t(`plan.goals.${g}`)}
              </Txt>
              <Txt v="meta" color={on ? p.board : p.inkSoft} numberOfLines={2}>
                {t(`plan.goalSub.${g}`)}
              </Txt>
            </Press>
          );
        })}
      </View>

      <Txt v="label" color={p.inkSoft} style={{ marginTop: 8 }}>
        {t('plan.levelTitle')}
      </Txt>
      <View style={{ gap: 8 }}>
        {LEVELS.map((l) => {
          const on = level === l;
          return (
            <Press
              key={l}
              onPress={() => setLevel(l)}
              feedback="selection"
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: on ? p.ink : p.rule }}
            >
              <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: on ? p.ink : p.ruleStrong, alignItems: 'center', justifyContent: 'center' }}>
                {on ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: p.ink }} /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Txt v="row" size={15}>{t(`plan.levels.${l}`)}</Txt>
                <Txt v="meta">{t(`plan.levelSub.${l}`)}</Txt>
              </View>
            </Press>
          );
        })}
      </View>

      <Txt v="label" color={p.inkSoft} style={{ marginTop: 8 }}>
        {t('plan.daysTitle')}
      </Txt>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {DAYS.map((d) => (
          <Chip key={d} label={String(d)} selected={days === d} onPress={() => setDays(d)} />
        ))}
      </View>
    </Sheet>
  );
}

/** Train something else for a week; the plan waits. */
export function WeekFocusSheet({ visible, onClose, current, planGoal }: { visible: boolean; onClose: () => void; current: Goal | null; planGoal: Goal | null }) {
  const { p } = useKit();
  const { t } = useI18n();
  const { user, refreshProfile } = useAuth();
  async function pick(g: Goal | null) {
    if (!user) return;
    try {
      await setWeekFocus(user.id, g);
      await refreshProfile();
      invalidate('programs:');
      onClose();
    } catch {
      toast.show(t('onboarding.saveError'), 'error');
    }
  }
  return (
    <Sheet visible={visible} title={t('plan.weekFocusTitle')} onClose={onClose}>
      <Txt v="body" color={p.inkSoft}>
        {t('plan.weekFocusSub')}
      </Txt>
      {planGoal ? (
        <OutlineButton label={t('plan.backToPlan')} icon="back" onPress={() => pick(null)} />
      ) : null}
      <View style={{ gap: 8 }}>
        {GOALS.map((g) => {
          const on = current === g;
          return (
            <Press
              key={g}
              onPress={() => pick(g)}
              feedback="selection"
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: on ? p.ink : p.rule, backgroundColor: on ? p.wash : 'transparent' }}
            >
              <Icon sport={GOAL_SPORT[g]} size={20} color={p.ink} />
              <View style={{ flex: 1 }}>
                <Txt v="row" size={15}>{t(`plan.goals.${g}`)}</Txt>
                <Txt v="meta">{t(`plan.goalSub.${g}`)}</Txt>
              </View>
              {on ? <Icon name="check" size={16} color={p.ink} weight="bold" /> : null}
            </Press>
          );
        })}
      </View>
    </Sheet>
  );
}

/** The plan at a glance: where you are, what's next, one tap to start. */
export function NextUpCard({ plan, onStart, onOpenSession, onOpenPlan }: { plan: MyPlan; onStart: (s: ProgramSession) => void; onOpenSession: (s: ProgramSession) => void; onOpenPlan: () => void }) {
  const { p, lang } = useKit();
  const { t } = useI18n();
  const thisWeek = plan.sessions.filter((s) => s.week === plan.week);
  const doneWeek = thisWeek.filter((s) => s.done).length;
  return (
    <View style={{ marginHorizontal: 16, marginTop: 4, padding: 16, borderRadius: 16, backgroundColor: p.ink, gap: 12 }}>
      <Press onPress={onOpenPlan} feedback="selection" depress={0.99} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Txt v="label" size={12} color={p.board} style={{ flex: 1, opacity: 0.85, ...(lang === 'en' ? { textTransform: 'uppercase', letterSpacing: 0.8 } : null) }} numberOfLines={1}>
          {`${plan.program.title} · ${t('plan.weekOf', { w: plan.week, total: plan.program.weeks })}`}
        </Txt>
        <Icon name="chevron" size={12} color={p.board} weight="bold" />
      </Press>
      {plan.next ? (
        <>
          <Press onPress={() => onOpenSession(plan.next!)} feedback="selection" depress={0.99} accessibilityRole="button" style={{ gap: 4 }}>
            <Txt v="label" size={12} color={p.board} style={{ opacity: 0.75 }}>
              {t('plan.nextUp')}
            </Txt>
            <Txt v="hero" size={30} color={p.board} numberOfLines={2}>
              {lang === 'en' ? plan.next.focus.toUpperCase() : plan.next.focus}
            </Txt>
            <Txt v="meta" color={p.board} style={{ opacity: 0.85 }}>
              {`${plan.next.title} · ${plan.next.minutes} ${lang === 'ar' ? 'د' : 'min'}`}
            </Txt>
          </Press>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {thisWeek.map((s) => (
              <View key={s.id} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: s.done ? p.marker : 'rgba(255,255,255,0.22)' }} />
            ))}
          </View>
          <Txt v="caption" color={p.board} style={{ opacity: 0.8 }}>
            {t('plan.doneThisWeek', { done: doneWeek, total: thisWeek.length })}
          </Txt>
          <MarkerButton label={t('plan.start')} icon="play" onPress={() => onStart(plan.next!)} />
        </>
      ) : (
        <Txt v="body" color={p.board}>
          {t('plan.finished')}
        </Txt>
      )}
    </View>
  );
}

/** When there's no plan yet: the one that fits the member's goal. */
export function RecommendedCard({ program, onStart, onSee, busy }: { program: Program; onStart: () => void; onSee: () => void; busy?: boolean }) {
  const { p, lang } = useKit();
  const { t } = useI18n();
  return (
    <View style={{ marginHorizontal: 16, marginTop: 4, padding: 16, borderRadius: 16, borderWidth: 1.5, borderColor: p.ink, gap: 10 }}>
      <Txt v="label" size={12} color={p.inkSoft} style={lang === 'en' ? { textTransform: 'uppercase', letterSpacing: 0.8 } : null}>
        {t('plan.recommended')}
      </Txt>
      <Txt v="hero" size={30}>
        {lang === 'en' ? program.title.toUpperCase() : program.title}
      </Txt>
      <Txt v="meta">{t('plan.planMeta', { weeks: program.weeks, days: program.daysPerWeek, min: program.minutes ?? 30 })}</Txt>
      <Txt v="body" size={15} color={p.inkSoft}>
        {program.summary}
      </Txt>
      <MarkerButton label={t('plan.startPlan')} onPress={onStart} loading={busy} />
      <TextButton label={t('plan.seePlan')} onPress={onSee} style={{ alignSelf: 'center' }} />
    </View>
  );
}

/** First visit: one question, one button. */
export function FindPlanCard({ onPress }: { onPress: () => void }) {
  const { p } = useKit();
  const { t } = useI18n();
  return (
    <View style={{ marginHorizontal: 16, marginTop: 4, padding: 18, borderRadius: 16, backgroundColor: p.ink, gap: 10 }}>
      <Txt v="title" size={24} color={p.board}>
        {t('plan.findTitle')}
      </Txt>
      <Txt v="body" size={15} color={p.board} style={{ opacity: 0.85 }}>
        {t('plan.findSub')}
      </Txt>
      <MarkerButton label={t('plan.setFocus')} onPress={onPress} />
    </View>
  );
}

/** A list of plan sessions (focus picks, a program's week). */
export function SessionRows({ sessions, onOpen }: { sessions: ProgramSession[]; onOpen: (s: ProgramSession) => void }) {
  const { p, lang } = useKit();
  return (
    <View>
      {sessions.map((s, i) => (
        <Press
          key={s.id}
          onPress={() => onOpen(s)}
          feedback="selection"
          depress={0.99}
          accessibilityRole="button"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: i === sessions.length - 1 ? 0 : 1, borderBottomColor: p.rule }}
        >
          <View style={{ width: 46, alignItems: 'center' }}>
            <Txt v="time" size={20}>
              {s.minutes}
            </Txt>
            <Txt v="caption" size={11} color={p.inkFaint}>
              {lang === 'ar' ? 'د' : 'MIN'}
            </Txt>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt v="row" size={15} numberOfLines={1}>
              {s.focus}
            </Txt>
            <Txt v="meta" numberOfLines={1}>
              {s.title}
            </Txt>
          </View>
          {s.done ? <Icon name="check" size={16} color={p.aqua} weight="bold" /> : <Icon name="chevron" size={13} color={p.inkFaint} weight="bold" />}
        </Press>
      ))}
    </View>
  );
}
