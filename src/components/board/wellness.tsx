import React, { useEffect, useState } from 'react';
import { Switch, View } from 'react-native';
import { useKit } from '../../theme';
import { useI18n } from '../../i18n';
import { useAuth } from '../../providers/AuthProvider';
import { Challenge, PackagePartner, connectExpert, joinChallenge, leaveChallenge, useChallengeBoard, useChallenges, useMySteps, usePackagePartners } from '../../data/wellness';
import { connectHealth, healthAvailable, healthConnected, syncSteps } from '../../lib/health';
import { invalidate } from '../../data/query';
import { Txt } from './Txt';
import { Icon } from './Icon';
import { MarkerButton, OutlineButton, SectionHeading, TextButton } from './controls';
import { Magnet } from './people';
import { Sheet } from './sheet';
import { toast } from './toast';
import { haptic } from '../../lib/haptics';

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

function ChallengeCard({ c }: { c: Challenge }) {
  const { p, lang } = useKit();
  const { t } = useI18n();
  const { user } = useAuth();
  const board = useChallengeBoard(c.joined || c.entrants ? c.id : null);
  const [busy, setBusy] = useState(false);
  const today = new Date();
  const started = c.startsOn <= today;
  const ended = new Date(c.endsOn.getTime() + 86400000) <= today;
  const rows = board.data ?? [];
  const mine = rows.find((r) => r.userId === user?.id);
  const top = rows.slice(0, 5);

  async function toggle() {
    if (!user) return;
    setBusy(true);
    try {
      if (c.joined) await leaveChallenge(user.id, c.id);
      else {
        await joinChallenge(user.id, c.id);
        if (healthAvailable() && !(await healthConnected())) await connectHealth(user.id).catch(() => {});
        haptic('success');
      }
    } catch {
      toast.show(t('wellness.joinError'), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ marginHorizontal: 16, marginTop: 12, padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: c.joined ? p.marker : p.rule, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="steps" size={18} color={p.marker} />
        <Txt v="title" size={18} style={{ flex: 1 }} numberOfLines={2}>
          {c.title}
        </Txt>
      </View>
      <Txt v="meta">
        {[
          `${dayLabel(c.startsOn, lang)} – ${dayLabel(c.endsOn, lang)}`,
          c.dailyGoal ? t('wellness.goal', { n: fmt(c.dailyGoal, lang) }) : null,
          t('wellness.joinedCount', { n: c.entrants }),
        ]
          .filter(Boolean)
          .join(' · ')}
      </Txt>

      {top.length && started ? (
        <View style={{ gap: 8 }}>
          {top.map((r) => (
            <View key={r.userId} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Txt v="time" size={15} style={{ width: 22 }} color={r.place === 1 ? p.marker : p.inkSoft}>
                {r.place}
              </Txt>
              <Magnet person={{ id: r.userId, name: r.name, avatarUrl: r.avatarUrl } as any} size={28} yours={r.userId === user?.id} />
              <Txt v="row" size={15} style={{ flex: 1 }} numberOfLines={1}>
                {r.name}
              </Txt>
              <Txt v="time" size={15}>
                {fmt(r.steps, lang)}
              </Txt>
            </View>
          ))}
          {mine && mine.place > 5 ? (
            <Txt v="meta">{t('wellness.yourPlace', { place: mine.place, steps: fmt(mine.steps, lang) })}</Txt>
          ) : null}
        </View>
      ) : null}

      {!ended ? (
        c.joined ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Txt v="meta" color={p.aqua}>
              {started ? t('wellness.youreIn') : t('wellness.startsOn', { date: dayLabel(c.startsOn, lang) })}
            </Txt>
            <TextButton label={t('wellness.leave')} onPress={toggle} color={p.inkSoft} disabled={busy} />
          </View>
        ) : (
          <MarkerButton label={t('wellness.join')} icon="plus" loading={busy} onPress={toggle} />
        )
      ) : (
        <Txt v="meta">{t('wellness.ended')}</Txt>
      )}
      <Txt v="caption">{t('wellness.privacy')}</Txt>
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
  const [open, setOpen] = useState<PackagePartner | null>(null);
  if (!challenges.length && !partners.length) return null;

  return (
    <View style={{ marginTop: 8 }}>
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
