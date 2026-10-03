import React, { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import { useKit } from '../../theme';
import { useI18n } from '../../i18n';
import { Exercise, useExercises } from '../../data/exercises';
import { Sheet } from './sheet';
import { Txt } from './Txt';
import { Icon, IconName } from './Icon';
import { Press } from './Press';
import { Tag } from './marks';
import { MoveDemo } from './MoveDemo';

type Goal = 'strength' | 'muscle' | 'endurance' | 'hold' | 'easy' | 'hard' | 'warm' | 'stretch';

/** Evidence-based dose ranges (ACSM progression models) that fit how this move is trained. */
function doseGoals(ex: Exercise): Goal[] {
  if (ex.category === 'stretch') return ['stretch'];
  if (ex.category === 'warmup' || ex.category === 'mobility') return ['warm'];
  if (ex.category === 'cardio') return ex.level === 'hard' ? ['hard'] : ['easy', 'hard'];
  if (ex.tracking === 'time' && (ex.category === 'core' || ex.category === 'strength')) return ['hold'];
  if (ex.category === 'conditioning') return ex.tracking === 'reps_weight' ? ['muscle', 'hard'] : ['hard', 'endurance'];
  if (ex.tracking === 'reps_weight') return ['strength', 'muscle', 'endurance'];
  return ['muscle', 'endurance'];
}

/** "3-1-1-0" → "3 s down · 1 s pause · 1 s up" */
function tempoLine(tempo: string, t: (k: string, v?: any) => string) {
  const [down, pause, up] = tempo.split('-');
  return [t('ex.tempoDown', { s: down }), pause && pause !== '0' ? t('ex.tempoPause', { s: pause }) : null, up && up !== 'X' ? t('ex.tempoUp', { s: up }) : null]
    .filter(Boolean)
    .join(' · ');
}

function Section({ title, icon, children }: { title: string; icon?: IconName; children: React.ReactNode }) {
  const { p } = useKit();
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {icon ? <Icon name={icon} size={15} color={p.inkSoft} /> : null}
        <Txt v="label" color={p.inkSoft} accessibilityRole="header">
          {title}
        </Txt>
      </View>
      {children}
    </View>
  );
}

function Lines({ items, numbered, tone }: { items: string[]; numbered?: boolean; tone?: 'warn' }) {
  const { p } = useKit();
  return (
    <View style={{ gap: 8 }}>
      {items.map((line, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
          {numbered ? (
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: p.ink, alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
              <Txt v="label" size={12} color={p.board}>
                {i + 1}
              </Txt>
            </View>
          ) : (
            <Icon name={tone === 'warn' ? 'close' : 'minus'} size={14} color={tone === 'warn' ? p.danger : p.inkFaint} weight="bold" style={{ marginTop: 4 }} />
          )}
          <Txt v="body" size={16} style={{ flex: 1 }}>
            {line}
          </Txt>
        </View>
      ))}
    </View>
  );
}

/**
 * Everything a member needs to do a move well, as a coach would explain it:
 * setup, the three cues that matter, common mistakes, safety, breathing and tempo,
 * the muscles it trains, and an easier or harder version to switch to.
 */
export function ExerciseSheet({ slug, onClose }: { slug: string | null; onClose: () => void }) {
  const { p, lang } = useKit();
  const { t } = useI18n();
  const lib = useExercises(lang).data;
  const [current, setCurrent] = useState<string | null>(slug);
  useEffect(() => setCurrent(slug), [slug]);
  const ex: Exercise | undefined = current ? lib?.get(current) : undefined;

  const muscle = (m: string) => t(`ex.muscle.${m}`);
  const variant = (s: string | null, label: string, icon: IconName) => {
    const v = s ? lib?.get(s) : null;
    if (!v) return null;
    return (
      <Press
        onPress={() => setCurrent(v.slug)}
        feedback="selection"
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${v.name}`}
        style={{ flex: 1, gap: 4, padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: p.ruleStrong }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name={icon} size={13} color={p.inkSoft} weight="bold" />
          <Txt v="label" size={12} color={p.inkSoft}>
            {label}
          </Txt>
        </View>
        <Txt v="row" size={15} numberOfLines={2}>
          {v.name}
        </Txt>
      </Press>
    );
  };

  return (
    <Sheet visible={!!slug} title={ex?.name ?? ''} onClose={onClose}>
      {!ex ? null : (
        <>
          {ex.demoId ? (
            <MoveDemo id={ex.demoId} size={240} />
          ) : ex.posterUrl ? (
            <Image source={{ uri: ex.posterUrl }} style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 12, backgroundColor: p.wash }} resizeMode="cover" accessibilityIgnoresInvertColors />
          ) : null}

          <View style={{ gap: 10 }}>
            <Txt v="hero" size={30}>
              {lang === 'ar' ? ex.name : ex.name.toUpperCase()}
            </Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              <Tag label={t(`train.level.${ex.level}`)} />
              <Tag label={t(`ex.category.${ex.category}`)} tone="aqua" />
              {ex.mechanic ? <Tag label={t(`ex.mechanic.${ex.mechanic}`)} /> : null}
              {ex.pattern ? <Tag label={t(`ex.pattern.${ex.pattern}`)} /> : null}
              {ex.unilateral ? <Tag label={t('ex.unilateral')} /> : null}
            </View>
          </View>

          <Section title={t('ex.muscles')} icon="bolt">
            <Txt v="row" size={16}>
              {ex.primary.map(muscle).join(' · ')}
            </Txt>
            {ex.secondary.length ? (
              <Txt v="body" size={15} color={p.inkSoft}>
                {t('ex.alsoWorks', { list: ex.secondary.map(muscle).join(' · ') })}
              </Txt>
            ) : null}
          </Section>

          {ex.setup.length ? (
            <Section title={t('ex.setup')}>
              <Lines items={ex.setup} />
            </Section>
          ) : null}

          <Section title={t('ex.howTo')}>
            <Lines items={ex.cues} numbered />
          </Section>

          {ex.mistakes.length ? (
            <Section title={t('ex.mistakes')} icon="warning">
              <Lines items={ex.mistakes} tone="warn" />
            </Section>
          ) : null}

          {ex.safety.length ? (
            <Section title={t('ex.safety')} icon="shield">
              <Lines items={ex.safety} />
            </Section>
          ) : null}

          {ex.breathing || ex.tempo || ex.restSeconds ? (
            <View style={{ gap: 10, padding: 14, borderRadius: 12, backgroundColor: p.wash }}>
              {ex.breathing ? (
                <View style={{ gap: 2 }}>
                  <Txt v="label" size={12} color={p.inkSoft}>{t('ex.breathing')}</Txt>
                  <Txt v="body" size={15}>{ex.breathing}</Txt>
                </View>
              ) : null}
              {ex.tempo ? (
                <View style={{ gap: 2 }}>
                  <Txt v="label" size={12} color={p.inkSoft}>{t('ex.tempo')}</Txt>
                  <Txt v="body" size={15}>{`${ex.tempo}  ·  ${tempoLine(ex.tempo, t)}`}</Txt>
                </View>
              ) : null}
              {ex.restSeconds ? (
                <View style={{ gap: 2 }}>
                  <Txt v="label" size={12} color={p.inkSoft}>{t('ex.rest')}</Txt>
                  <Txt v="body" size={15}>{ex.restSeconds >= 60 ? t('ex.restMin', { m: Math.round((ex.restSeconds / 60) * 10) / 10 }) : t('ex.restSec', { s: ex.restSeconds })}</Txt>
                </View>
              ) : null}
            </View>
          ) : null}

          <Section title={t('ex.dose')} icon="timer">
            <View style={{ borderRadius: 12, borderWidth: 1.5, borderColor: p.rule, overflow: 'hidden' }}>
              {doseGoals(ex).map((g, i) => (
                <View key={g} style={{ padding: 12, gap: 3, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: p.rule }}>
                  <Txt v="row" size={14}>
                    {t(`ex.goal.${g}`)}
                  </Txt>
                  <Txt v="body" size={14} color={p.inkSoft}>
                    {t(`ex.doseLine.${g}`)}
                  </Txt>
                </View>
              ))}
            </View>
            {doseGoals(ex).some((g) => g === 'strength' || g === 'muscle' || g === 'endurance') ? (
              <Txt v="caption">{t('ex.doseNote')}</Txt>
            ) : null}
          </Section>

          {ex.easier || ex.harder ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {variant(ex.easier, t('ex.easier'), 'minus')}
              {variant(ex.harder, t('ex.harder'), 'plus')}
            </View>
          ) : null}

          <Section title={t('ex.equipment')}>
            <Txt v="body" size={15} color={p.inkSoft}>
              {ex.equipment.length ? ex.equipment.map((e) => t(`train.equipment.${e}`)).join(' · ') : t('train.noKit')}
            </Txt>
          </Section>

          {ex.sports.length ? (
            <Section title={t('ex.goodFor')}>
              <Txt v="body" size={15} color={p.inkSoft}>
                {ex.sports.map((s) => t(`sports.${s}`)).join(' · ')}
              </Txt>
            </Section>
          ) : null}
        </>
      )}
    </Sheet>
  );
}
