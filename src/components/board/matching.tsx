import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useKit } from '../../theme';
import { useI18n } from '../../i18n';
import { EMPTY_PARTNER_PROFILE, MAX_GOALS, PARTNER_GOALS, PARTNER_VIBES, PARTNER_WORK, PartnerGoal, PartnerProfile, savePartnerProfile, selfLevel, usePartnerProfile } from '../../data/matching';
import { useAuth } from '../../providers/AuthProvider';
import { PREVIEW, PREVIEW_ME } from '../../data/preview';
import type { Lvl } from './level';
import { LEVEL_KEY } from './level';
import { Txt } from './Txt';
import { Icon } from './Icon';
import { Chip, SectionHeading, TextButton } from './controls';
import { Group, GroupRow } from './list';
import { Sheet } from './sheet';
import { toast } from './toast';
import { haptic } from '../../lib/haptics';

// Training-partner pieces shared by the partners screen and the You page.

/** "Show my level": your own chosen level, seen only by matches who show theirs. */
export function ShowLevelRow({ value, level, onChange }: { value: boolean; level: Lvl | null; onChange: (v: boolean) => void }) {
  const { t } = useI18n();
  const router = useRouter();
  if (!level) {
    return <GroupRow icon="bolt" label={t('partners.showLevel')} sub={t('partners.showLevelNone')} onPress={() => router.push({ pathname: '/(onboarding)/about-you', params: { edit: '1' } })} />;
  }
  return <GroupRow icon="bolt" label={t('partners.showLevel')} sub={t('partners.showLevelSub', { level: t(`plan.levels.${LEVEL_KEY[level]}`) })} toggle={value} onToggle={onChange} />;
}

/** Optional one-tap answers that sharpen the match. Every group can be left empty. */
export function AboutYouFields({ value, onChange }: { value: PartnerProfile; onChange: (v: PartnerProfile) => void }) {
  const { p } = useKit();
  const { t } = useI18n();
  const toggleGoal = (g: PartnerGoal) => {
    const has = value.goals.includes(g);
    if (!has && value.goals.length >= MAX_GOALS) return;
    onChange({ ...value, goals: has ? value.goals.filter((x) => x !== g) : [...value.goals, g] });
  };
  return (
    <View>
      <SectionHeading title={t('partners.workTitle')} style={{ marginTop: 16 }} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {PARTNER_WORK.map((x) => (
          <Chip key={x} label={t(`partners.work.${x}`)} selected={value.work === x} onPress={() => onChange({ ...value, work: value.work === x ? null : x })} />
        ))}
      </View>

      <SectionHeading title={t('partners.goalsTitle')} style={{ marginTop: 16 }} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {PARTNER_GOALS.map((x) => (
          <Chip key={x} label={t(`partners.goals.${x}`)} selected={value.goals.includes(x)} disabled={!value.goals.includes(x) && value.goals.length >= MAX_GOALS} onPress={() => toggleGoal(x)} />
        ))}
      </View>
      <Txt v="caption" style={{ marginTop: 6 }}>
        {t('partners.goalsSub')}
      </Txt>

      <SectionHeading title={t('partners.vibeTitle')} style={{ marginTop: 16 }} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {PARTNER_VIBES.map((x) => (
          <Chip key={x} label={t(`partners.vibes.${x}`)} selected={value.vibe === x} onPress={() => onChange({ ...value, vibe: value.vibe === x ? null : x })} />
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 14, padding: 12, borderRadius: 10, backgroundColor: p.wash }}>
        <Icon name="lock" size={14} color={p.aqua} />
        <Txt v="caption" style={{ flex: 1 }}>
          {t('partners.aboutPrivacy')}
        </Txt>
      </View>
    </View>
  );
}

/** How many of the optional answers are filled in, for "2 of 3" on the You page. */
export const aboutAnswered = (v: PartnerProfile) => [v.work, v.goals.length ? 1 : null, v.vibe].filter(Boolean).length;

/** A clear-all for the optional answers. */
export function ClearAbout({ value, onChange }: { value: PartnerProfile; onChange: (v: PartnerProfile) => void }) {
  const { t } = useI18n();
  if (!aboutAnswered(value)) return null;
  return <TextButton label={t('partners.aboutClear')} onPress={() => onChange({ ...value, work: null, goals: [], vibe: null })} style={{ alignSelf: 'flex-start', marginTop: 8 }} />;
}

/**
 * You page: matching in one place. Switch partner matching on or off, show your level, answer the
 * optional questions, and open the list. Every switch saves at once.
 */
export function PartnersSection({ style }: { style?: any }) {
  const { t } = useI18n();
  const router = useRouter();
  const { user, profile } = useAuth();
  const meId = PREVIEW ? PREVIEW_ME : user?.id ?? null;
  const q = usePartnerProfile();
  const prof = q.data ?? EMPTY_PARTNER_PROFILE;
  const [aboutOpen, setAboutOpen] = useState(false);

  async function save(next: PartnerProfile) {
    if (!meId) return;
    try {
      await savePartnerProfile(meId, next);
      haptic('selection');
    } catch {
      haptic('error');
      toast.show(t('partners.errors.generic'), 'error');
    }
  }
  const answered = aboutAnswered(prof);

  return (
    <View>
      <SectionHeading title={t('partners.title')} action={prof.open ? t('partners.find') : undefined} onAction={() => router.push('/partners')} style={style} />
      <Group style={{ marginHorizontal: 16 }}>
        <GroupRow icon="people" label={t('partners.open')} sub={prof.open ? t('partners.openSub') : t('partners.offSub')} toggle={prof.open} onToggle={(v) => save({ ...prof, open: v })} />
        <ShowLevelRow value={prof.showLevel} level={selfLevel(profile as any)} onChange={(v) => save({ ...prof, showLevel: v })} />
        <GroupRow icon="sparkle" label={t('partners.aboutTitle')} sub={t('partners.aboutRowSub')} value={answered ? t('partners.aboutCount', { n: answered }) : t('partners.optional')} onPress={() => setAboutOpen(true)} />
      </Group>
      <AboutSheet visible={aboutOpen} initial={prof} onClose={() => setAboutOpen(false)} onSave={async (v) => { await save(v); setAboutOpen(false); toast.show(t('partners.aboutSaved'), 'yours'); }} />
    </View>
  );
}

function AboutSheet({ visible, initial, onClose, onSave }: { visible: boolean; initial: PartnerProfile; onClose: () => void; onSave: (v: PartnerProfile) => void }) {
  const { p } = useKit();
  const { t } = useI18n();
  const [f, setF] = useState(initial);
  useEffect(() => {
    if (visible) setF(initial);
  }, [visible]);
  return (
    <Sheet visible={visible} title={t('partners.aboutTitle')} onClose={onClose} action={{ label: t('common.save'), onPress: () => onSave(f) }}>
      <Txt v="body" size={14} color={p.inkSoft}>
        {t('partners.aboutSub')}
      </Txt>
      <AboutYouFields value={f} onChange={setF} />
      <ClearAbout value={f} onChange={setF} />
    </Sheet>
  );
}
