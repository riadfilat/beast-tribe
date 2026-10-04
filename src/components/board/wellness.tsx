import React, { useEffect, useState } from 'react';
import { Switch, View } from 'react-native';
import { useKit } from '../../theme';
import { useI18n } from '../../i18n';
import { useAuth } from '../../providers/AuthProvider';
import { Challenge, ChallengeMetric, PackagePartner, chooseTeam, connectExpert, joinChallenge, leaveChallenge, useChallengeBoard, useChallenges, useCommunityExtras, useMySteps, usePackagePartners, useTeamBoard, useTeams } from '../../data/wellness';
import { connectHealth, healthAvailable, healthConnected, syncSteps } from '../../lib/health';
import { invalidate } from '../../data/query';
import { Txt } from './Txt';
import { Icon, IconName } from './Icon';
import { Press } from './Press';
import { MarkerButton, OutlineButton, SectionHeading, Segmented, TextButton } from './controls';
import { Magnet } from './people';
import { Sheet } from './sheet';
import { toast } from './toast';
import { haptic } from '../../lib/haptics';
import { TRAIN_ENABLED } from '../../lib/constants';

// Wellness inside a community: step challenges members opt into, the experts and venues the
// company or gym includes, and the member's own steps from Apple Health.

const fmt = (n: number, lang: string) => n.toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US');
const dayLabel = (d: Date, lang: string) => d.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-GB', { day: 'numeric', month: 'short' });

/** Steps from Apple Health: a connect prompt, or today's and this week's steps. */
export function StepsCard() {
  const { p, lang } = useKit();
  const { t } = useI18n();
  const { user } = useAuth();
  const [connected, setConnected] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const steps = useMySteps();
  useEffect(() => {
    healthConnected().then(setConnected);
  }, []);
  if (!healthAvailable() || connected === null) return null;

  async function connect() {
    if (!user) return;
    setBusy(true);
    try {
      await connectHealth(user.id);
      setConnected(true);
      invalidate('wellness:');
      haptic('success');
    } catch {
      toast.show(t('wellness.healthError'), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ marginHorizontal: 16, marginTop: 12, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: p.rule, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="steps" size={16} color={p.aqua} />
        <Txt v="label" color={p.inkSoft}>
          {t('wellness.steps')}
        </Txt>
      </View>
      {connected ? (
        <View style={{ flexDirection: 'row' }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt v="stencil" size={34}>
              {fmt(steps.data?.today ?? 0, lang)}
            </Txt>
            <Txt v="meta">{t('wellness.today')}</Txt>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt v="stencil" size={34}>
              {fmt(steps.data?.week ?? 0, lang)}
            </Txt>
            <Txt v="meta">{t('wellness.last7')}</Txt>
          </View>
        </View>
      ) : (
        <>
          <Txt v="body" color={p.inkSoft}>
            {t('wellness.connectSub')}
          </Txt>
          <OutlineButton label={t('wellness.connect')} icon="heart" loading={busy} onPress={connect} />
        </>
      )}
    </View>
  );
}

/** Sync steps quietly when the app opens (only for members who connected). */
export function useStepsSync() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    syncSteps(user.id)
      .then((today) => {
        if (today != null) invalidate('wellness:');
      })
      .catch(() => {});
  }, [user?.id]);
}

const METRIC_ICON: Record<ChallengeMetric, IconName> = { steps: 'steps', active_days: 'calendar', workouts: 'train', minutes: 'timer', sessions: 'people' };

/** Pick or change your team in a community. */
function TeamSheet({ communityId, visible, onClose, onPicked }: { communityId: string; visible: boolean; onClose: () => void; onPicked?: () => void }) {
  const { p, lang } = useKit();
  const { t, tn } = useI18n();
  const q = useTeams(communityId, lang);
  const [busy, setBusy] = useState<string | null>(null);
  if (!visible) return null;
  async function pick(team: { id: string; name: string }) {
    setBusy(team.id);
    try {
      await chooseTeam(team.id);
      haptic('success');
      toast.show(t('wellness.teamSaved', { team: team.name }), 'yours');
      onClose();
      onPicked?.();
    } catch {
      toast.show(t('wellness.joinError'), 'error');
    } finally {
      setBusy(null);
    }
  }
  return (
    <Sheet visible title={t('wellness.pickTeam')} onClose={onClose}>
      <View style={{ gap: 10 }}>
        <Txt v="body" color={p.inkSoft}>
          {t('wellness.pickTeamSub')}
        </Txt>
        {(q.data?.teams ?? []).map((team) => {
          const mine = q.data?.mine === team.id;
          return (
            <Press key={team.id} onPress={() => pick(team)} disabled={!!busy} feedback="selection" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: mine ? p.marker : p.rule }}>
              <Txt v="row" size={16} style={{ flex: 1 }} numberOfLines={1}>
                {team.name}
              </Txt>
              <Txt v="meta">{tn('wellness.teamPeople', team.members)}</Txt>
              {mine ? <Icon name="check" size={16} color={p.marker} /> : null}
            </Press>
          );
        })}
      </View>
    </Sheet>
  );
}

function ChallengeCard({ c }: { c: Challenge }) {
  const { p, lang } = useKit();
  const { t, tn } = useI18n();
  const { user } = useAuth();
  const show = c.joined || c.entrants > 0;
  const board = useChallengeBoard(show ? c.id : null);
  const teamBoard = useTeamBoard(show && c.byTeam ? c.id : null, lang);
  const teams = useTeams(c.byTeam ? c.communityId : null, lang);
  const [tab, setTab] = useState<'teams' | 'people'>(c.byTeam ? 'teams' : 'people');
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const today = new Date();
  const started = c.startsOn <= today;
  const ended = new Date(c.endsOn.getTime() + 86400000) <= today;
  const rows = board.data ?? [];
  const mine = rows.find((r) => r.userId === user?.id);
  const top = rows.slice(0, 5);
  const teamRows = teamBoard.data ?? [];
  const score = (n: number) => tn(`wellness.score.${c.metric}`, Math.round(n), { n: fmt(Math.round(n), lang) });

  async function join() {
    if (!user) return;
    setBusy(true);
    try {
      await joinChallenge(user.id, c.id);
      // Only a steps challenge needs Apple Health; the others count what the app already knows.
      if (c.metric === 'steps' && healthAvailable() && !(await healthConnected())) await connectHealth(user.id).catch(() => {});
      haptic('success');
    } catch {
      toast.show(t('wellness.joinError'), 'error');
    } finally {
      setBusy(false);
    }
  }
  async function leave() {
    if (!user) return;
    setBusy(true);
    try {
      await leaveChallenge(user.id, c.id);
    } catch {
      toast.show(t('wellness.joinError'), 'error');
    } finally {
      setBusy(false);
    }
  }
  // A team challenge needs a team first.
  const needsTeam = c.byTeam && (teams.data?.teams.length ?? 0) > 0 && !teams.data?.mine;
  const onJoin = () => (needsTeam ? setPicking(true) : join());

  return (
    <View style={{ marginHorizontal: 16, marginTop: 12, padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: c.joined ? p.marker : p.rule, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name={METRIC_ICON[c.metric]} size={18} color={p.marker} />
        <Txt v="title" size={18} style={{ flex: 1 }} numberOfLines={2}>
          {c.title}
        </Txt>
      </View>
      <Txt v="meta">
        {[
          c.byTeam ? t('wellness.byTeam') : null,
          t(`wellness.types.${c.metric}`),
          `${dayLabel(c.startsOn, lang)} – ${dayLabel(c.endsOn, lang)}`,
          c.metric === 'steps' && c.dailyGoal ? t('wellness.goal', { n: fmt(c.dailyGoal, lang) }) : null,
          t('wellness.joinedCount', { n: c.entrants }),
        ]
          .filter(Boolean)
          .join(' · ')}
      </Txt>
      {c.prize ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="sparkle" size={14} color={p.marker} />
          <Txt v="label" size={13} color={p.markerText} style={{ flex: 1 }}>
            {t('wellness.prize', { prize: c.prize })}
          </Txt>
        </View>
      ) : null}

      {c.byTeam && started && show ? (
        <Segmented options={[{ value: 'teams', label: t('wellness.tabTeams') }, { value: 'people', label: t('wellness.tabPeople') }]} value={tab} onChange={setTab} />
      ) : null}

      {started && show && tab === 'teams' && c.byTeam ? (
        teamRows.length ? (
          <View style={{ gap: 8 }}>
            {teamRows.slice(0, 6).map((r) => (
              <View key={r.teamId} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Txt v="time" size={15} style={{ width: 22 }} color={r.place === 1 ? p.marker : p.inkSoft}>
                  {r.place}
                </Txt>
                <View style={{ flex: 1 }}>
                  <Txt v="row" size={15} numberOfLines={1} color={r.mine ? p.markerText : p.ink}>
                    {r.name}
                  </Txt>
                  <Txt v="caption">{tn('wellness.teamPeople', r.people)}</Txt>
                </View>
                <Txt v="time" size={14}>
                  {t('wellness.teamAvg', { score: score(r.average) })}
                </Txt>
              </View>
            ))}
          </View>
        ) : (
          <Txt v="meta">{t('wellness.noTeamsYet')}</Txt>
        )
      ) : null}

      {started && show && tab === 'people' && top.length ? (
        <View style={{ gap: 8 }}>
          {top.map((r) => (
            <View key={r.userId} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Txt v="time" size={15} style={{ width: 22 }} color={r.place === 1 ? p.marker : p.inkSoft}>
                {r.place}
              </Txt>
              <Magnet person={{ id: r.userId, name: r.name, avatarUrl: r.avatarUrl } as any} size={28} yours={r.userId === user?.id} />
              <View style={{ flex: 1 }}>
                <Txt v="row" size={15} numberOfLines={1}>
                  {r.name}
                </Txt>
                {r.team ? <Txt v="caption">{r.team}</Txt> : null}
              </View>
              <Txt v="time" size={14}>
                {score(r.score)}
              </Txt>
            </View>
          ))}
          {mine && mine.place > 5 ? <Txt v="meta">{t('wellness.yourScore', { place: mine.place, score: score(mine.score) })}</Txt> : null}
        </View>
      ) : null}

      {!ended ? (
        c.joined ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Txt v="meta" color={p.aqua}>
              {started ? t('wellness.youreIn') : t('wellness.startsOn', { date: dayLabel(c.startsOn, lang) })}
            </Txt>
            <TextButton label={t('wellness.leave')} onPress={leave} color={p.inkSoft} disabled={busy} />
          </View>
        ) : (
          <MarkerButton label={t('wellness.join')} icon="plus" loading={busy} onPress={onJoin} />
        )
      ) : (
        <Txt v="meta">{t('wellness.ended')}</Txt>
      )}
      <Txt v="caption">{[t(`wellness.typeHint.${c.metric}`), t('wellness.privacy')].join(' ')}</Txt>
      {c.byTeam ? <TeamSheet communityId={c.communityId} visible={picking} onClose={() => setPicking(false)} onPicked={join} /> : null}
    </View>
  );
}

/** A notice from the community and its plan of the month, near the top of the community page. */
export function CommunityHighlights({ communityId, name, onOpenPlan }: { communityId: string; name: string; onOpenPlan: (slug: string) => void }) {
  const { p, lang } = useKit();
  const { t } = useI18n();
  const x = useCommunityExtras(communityId, lang).data;
  if (!x || (!x.notice && !(TRAIN_ENABLED && x.plan))) return null;
  return (
    <View style={{ gap: 10, marginTop: 16 }}>
      {x.notice ? (
        <View style={{ padding: 14, borderRadius: 12, backgroundColor: p.wash, gap: 4 }}>
          <Txt v="label" size={12} color={p.inkSoft}>
            {t('wellness.notice', { name })}
          </Txt>
          <Txt v="body">{x.notice}</Txt>
        </View>
      ) : null}
      {TRAIN_ENABLED && x.plan ? (
        <Press onPress={() => onOpenPlan(x.plan!.slug)} feedback="light" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: p.ruleStrong }}>
          <Icon name="train" size={20} color={p.marker} />
          <View style={{ flex: 1, gap: 2 }}>
            <Txt v="label" size={12} color={p.inkSoft}>
              {t('wellness.planOfMonth')}
            </Txt>
            <Txt v="row" size={16} numberOfLines={1}>
              {x.plan.title}
            </Txt>
            <Txt v="caption">{t('wellness.planOfMonthSub', { weeks: x.plan.weeks, days: x.plan.days, minutes: x.plan.minutes })}</Txt>
          </View>
          <Icon name="chevron" size={16} color={p.inkSoft} />
        </Press>
      ) : null}
    </View>
  );
}

function ConnectSheet({ partner, onClose }: { partner: PackagePartner | null; onClose: () => void }) {
  const { p } = useKit();
  const { t } = useI18n();
  const [food, setFood] = useState(true);
  const [body, setBody] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!partner) return null;

  async function go() {
    if (!partner) return;
    setBusy(true);
    try {
      await connectExpert(partner.partnerId, { nutrition: food, body });
      haptic('success');
      toast.show(t('wellness.connected', { name: partner.name }), 'yours');
      onClose();
    } catch {
      toast.show(t('wellness.joinError'), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet visible title={partner.name} onClose={onClose} footer={<MarkerButton label={t('wellness.connectExpert')} loading={busy} onPress={go} />}>
      <View style={{ gap: 16 }}>
        <Txt v="body" color={p.inkSoft}>
          {t('wellness.connectExpertSub', { name: partner.name })}
        </Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Txt v="row" style={{ flex: 1 }}>
            {t('coach.shareNutrition')}
          </Txt>
          <Switch value={food} onValueChange={setFood} trackColor={{ true: p.aqua, false: p.rule }} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Txt v="row" style={{ flex: 1 }}>
            {t('coach.shareBody')}
          </Txt>
          <Switch value={body} onValueChange={setBody} trackColor={{ true: p.aqua, false: p.rule }} />
        </View>
        <Txt v="caption">{t('wellness.connectExpertNote')}</Txt>
      </View>
    </Sheet>
  );
}

/** Challenges and the community's included experts and venues, for the community page. */
export function CommunityWellness({ communityId }: { communityId: string }) {
  const { p, lang } = useKit();
  const { t } = useI18n();
  const challenges = useChallenges(communityId, lang).data ?? [];
  const partners = usePackagePartners(communityId, lang).data ?? [];
  const teams = useTeams(communityId, lang).data;
  const [open, setOpen] = useState<PackagePartner | null>(null);
  const [picking, setPicking] = useState(false);
  const hasTeams = (teams?.teams.length ?? 0) > 0;
  const myTeam = teams?.teams.find((x) => x.id === teams.mine) ?? null;
  if (!challenges.length && !partners.length && !hasTeams) return null;

  return (
    <View style={{ marginTop: 8 }}>
      {hasTeams ? (
        <View style={{ marginHorizontal: 16, marginTop: 20, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: p.rule, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Icon name="people" size={18} color={p.aqua} />
          <View style={{ flex: 1 }}>
            <Txt v="label" size={12} color={p.inkSoft}>
              {t('wellness.yourTeam')}
            </Txt>
            <Txt v="row" size={16} numberOfLines={1}>
              {myTeam ? myTeam.name : t('wellness.pickTeam')}
            </Txt>
          </View>
          <TextButton label={myTeam ? t('wellness.changeTeam') : t('wellness.pickTeam')} onPress={() => setPicking(true)} />
        </View>
      ) : null}
      <TeamSheet communityId={communityId} visible={picking} onClose={() => setPicking(false)} />
      {challenges.length ? (
        <>
          <SectionHeading title={t('wellness.challenges')} style={{ paddingHorizontal: 16, marginTop: 20 }} />
          {challenges.map((c) => (
            <ChallengeCard key={c.id} c={c} />
          ))}
        </>
      ) : null}

      {partners.length ? (
        <>
          <SectionHeading title={t('wellness.included')} style={{ paddingHorizontal: 16, marginTop: 24 }} />
          <View style={{ marginHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: p.rule }}>
            {partners.map((x, i) => {
              const expert = x.role === 'nutritionist' || x.role === 'coach';
              return (
                <View key={x.partnerId} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderTopWidth: i ? 1 : 0, borderTopColor: p.rule }}>
                  <Icon name={x.role === 'nutritionist' || x.role === 'kitchen' ? 'nutrition' : x.role === 'gym' ? 'train' : 'coach'} size={20} color={p.aqua} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt v="row" size={15} numberOfLines={1}>
                      {x.name}
                    </Txt>
                    <Txt v="meta" numberOfLines={2}>
                      {[t(`wellness.roles.${x.role}`), x.perk].filter(Boolean).join(' · ')}
                    </Txt>
                  </View>
                  {expert ? (
                    x.connected ? (
                      <Txt v="label" size={13} color={p.aqua}>
                        {t('wellness.working')}
                      </Txt>
                    ) : (
                      <TextButton label={t('wellness.connectShort')} onPress={() => setOpen(x)} />
                    )
                  ) : null}
                </View>
              );
            })}
          </View>
        </>
      ) : null}
      <ConnectSheet partner={open} onClose={() => setOpen(null)} />
    </View>
  );
}
