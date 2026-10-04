import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { makeStyles, useKit } from '../../../src/theme';
import { useI18n } from '../../../src/i18n';
import { useAuth } from '../../../src/providers/AuthProvider';
import { createPack, PackAudience, PackVisibility, setPackPhoto } from '../../../src/data/packs';
import { useMyCommunities } from '../../../src/data/communities';
import { PREVIEW, PREVIEW_ME } from '../../../src/data/preview';
import { randomEmblem } from '../../../src/lib/emblem';
import { Txt } from '../../../src/components/board/Txt';
import { Icon } from '../../../src/components/board/Icon';
import { Press } from '../../../src/components/board/Press';
import { ChoiceList, Dropdown, Field, IconButton, MarkerButton, SectionHeading, TextButton } from '../../../src/components/board/controls';
import { Sheet } from '../../../src/components/board/sheet';
import { PatchPreview } from '../../../src/components/board/Patch';
import { PatchPicker } from '../../../src/components/board/PatchPicker';
import { toast } from '../../../src/components/board/toast';
import { haptic } from '../../../src/lib/haptics';
import { errorKey } from '../../../src/data/errors';

// Start a group: a name and a badge up top (tap the badge to change it or add a cover photo), then
// the three choices that matter, each a dropdown: which community it lives in, who can find it
// (open in that community, or invite only: your own circle), and who it's for.

type Open = 'badge' | 'community' | 'find' | 'for' | null;

export default function PackCreateScreen() {
  const s = useStyles();
  const { p } = useKit();
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  // Women can start women-only groups, men can start men-only groups (the database checks it too).
  const gender = PREVIEW ? 'female' : (profile?.gender || '').toLowerCase();
  const meId = PREVIEW ? PREVIEW_ME : user?.id ?? null;
  // Every group lives in a community: the general one, or a private one the member belongs to.
  const params = useLocalSearchParams<{ community?: string }>();
  const communities = useMyCommunities().data ?? [];
  const [communityId, setCommunityId] = useState<string | null>(params.community ?? null);
  const home = communities.find((c) => c.id === communityId) ?? communities.find((c) => c.isDefault) ?? communities[0] ?? null;
  const [name, setName] = useState('');
  const [emblem, setEmblem] = useState(randomEmblem);
  const [audience, setAudience] = useState<PackAudience>('everyone');
  const [visibility, setVisibility] = useState<PackVisibility>('invite');
  const [open, setOpen] = useState<Open>(null);
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const close = () => setOpen(null);

  async function pickPhoto() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [16, 9], quality: 0.85 });
    if (!res.canceled && res.assets?.[0]?.uri) setPhoto(res.assets[0].uri);
  }
  const shown = name.trim() || t('pack.namePlaceholder').replace(/^e\.g\.\s*|^مثال:\s*/, '');
  const community = home?.name ?? '';

  async function create() {
    if (!meId || !name.trim()) return;
    setBusy(true);
    try {
      const pack = await createPack(meId, name, emblem, audience, home?.id ?? null, visibility);
      // The photo is extra: the group exists even if its upload fails.
      if (photo) await setPackPhoto(meId, pack.id, photo).catch(() => toast.show(t('pack.photoFailed'), 'error'));
      haptic('success');
      router.replace({ pathname: '/(tabs)/feed/pack', params: { packId: pack.id } });
    } catch (e: any) {
      haptic('error');
      toast.show(t(errorKey('pack', e)), 'error');
    } finally {
      setBusy(false);
    }
  }

  const canFor = (a: PackAudience) => a === 'everyone' || (a === 'women' && gender === 'female') || (a === 'men' && gender === 'male');

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.header}>
          <IconButton name="back" label={t('common.back')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/feed'))} />
        </View>
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
          <Txt v="title" size={30} accessibilityRole="header">
            {t('pack.createTitle')}
          </Txt>
          <Txt v="body" color={p.inkSoft} style={{ marginTop: 6 }}>
            {t('pack.createSub')}
          </Txt>

          {/* The badge: tap it to pick a symbol, a colour or a cover photo */}
          <Press onPress={() => setOpen('badge')} feedback="light" depress={0.97} accessibilityRole="button" accessibilityLabel={t('pack.badgeTitle')} style={s.preview}>
            {photo ? <Image source={{ uri: photo }} style={s.cover} resizeMode="cover" accessibilityIgnoresInvertColors /> : null}
            <View>
              <PatchPreview emblem={emblem} name={shown} size={132} />
              <View style={s.editDot}>
                <Icon name="edit" size={15} color={p.board} />
              </View>
            </View>
            <Txt v="caption" style={{ marginTop: 10 }}>
              {t('pack.tapToChange')}
            </Txt>
          </Press>

          <SectionHeading title={t('pack.name')} />
          <Field value={name} onChangeText={setName} placeholder={t('pack.namePlaceholder')} maxLength={32} returnKeyType="done" />

          <SectionHeading title={t('pack.community')} style={s.gap} />
          <Dropdown label={community} sub={t('pack.communitySub')} icon={home && !home.isDefault && !home.open ? 'shield' : 'people'} onPress={() => setOpen('community')} accessibilityLabel={t('pack.community')} />

          <SectionHeading title={t('pack.findTitle')} style={s.gap} />
          <Dropdown
            label={t(`pack.visibility.${visibility}`, { community })}
            sub={t(`pack.visibilityHint.${visibility}`, { community })}
            icon={visibility === 'open' ? 'globe' : 'lock'}
            onPress={() => setOpen('find')}
            accessibilityLabel={t('pack.findTitle')}
          />

          <SectionHeading title={t('pack.forTitle')} style={s.gap} />
          <Dropdown label={t(`pack.audiences.${audience}`)} sub={t(`pack.audienceSub.${audience}`)} icon="people" onPress={() => setOpen('for')} accessibilityLabel={t('pack.forTitle')} />
          {!gender ? (
            <TextButton label={t('pack.addGender')} onPress={() => router.push({ pathname: '/(onboarding)/about-you', params: { edit: '1' } })} style={{ alignSelf: 'flex-start', marginTop: 4 }} />
          ) : null}
        </ScrollView>
        <View style={[s.bar, { paddingBottom: 12 + insets.bottom }]}>
          <MarkerButton label={t('pack.create')} onPress={create} loading={busy} disabled={!name.trim()} />
        </View>
      </KeyboardAvoidingView>

      <Sheet visible={open === 'badge'} title={t('pack.badgeTitle')} onClose={close} action={{ label: t('common.done'), onPress: close }}>
        <View style={{ alignItems: 'center' }}>
          <PatchPreview emblem={emblem} name={shown} size={96} />
        </View>
        <PatchPicker value={emblem} onChange={setEmblem} name={shown} />
        <SectionHeading title={t('pack.cover')} />
        <Txt v="caption" style={{ marginTop: -8 }}>
          {t('pack.coverSub')}
        </Txt>
        {photo ? <Image source={{ uri: photo }} style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 14 }} resizeMode="cover" accessibilityIgnoresInvertColors /> : null}
        <View style={{ flexDirection: 'row', marginTop: -8 }}>
          <TextButton label={photo ? t('pack.changePhoto') : t('pack.addPhoto')} onPress={pickPhoto} />
          {photo ? <TextButton label={t('pack.removePhoto')} onPress={() => setPhoto(null)} /> : null}
        </View>
      </Sheet>

      <Sheet visible={open === 'community'} title={t('pack.community')} onClose={close}>
        <ChoiceList
          options={communities.map((c) => ({ value: c.id, label: c.name, icon: c.isDefault || c.open ? ('people' as const) : ('shield' as const) }))}
          value={home?.id ?? null}
          onChange={(v) => {
            setCommunityId(v);
            close();
          }}
        />
      </Sheet>

      <Sheet visible={open === 'find'} title={t('pack.findTitle')} onClose={close}>
        <ChoiceList<PackVisibility>
          options={(['invite', 'open'] as PackVisibility[]).map((v) => ({
            value: v,
            label: t(`pack.visibility.${v}`, { community }),
            sub: t(`pack.visibilityHint.${v}`, { community }),
            icon: v === 'open' ? 'globe' : 'lock',
          }))}
          value={visibility}
          onChange={(v) => {
            setVisibility(v);
            close();
          }}
        />
      </Sheet>

      <Sheet visible={open === 'for'} title={t('pack.forTitle')} onClose={close}>
        <ChoiceList<PackAudience>
          options={(['everyone', 'women', 'men'] as PackAudience[]).map((a) => ({ value: a, label: t(`pack.audiences.${a}`), sub: t(`pack.audienceSub.${a}`), disabled: !canFor(a) }))}
          value={audience}
          onChange={(v) => {
            setAudience(v);
            close();
          }}
        />
        <Txt v="caption">{t('pack.audienceLocked')}</Txt>
      </Sheet>
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ p }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  header: { paddingStart: 4 },
  body: { paddingHorizontal: 20, paddingBottom: 32 },
  preview: { alignItems: 'center', marginVertical: 20 },
  cover: { position: 'absolute', top: -6, left: 0, right: 0, height: 120, borderRadius: 14, opacity: 0.35 },
  editDot: { position: 'absolute', right: 2, bottom: 2, width: 32, height: 32, borderRadius: 16, backgroundColor: p.ink, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: p.board },
  gap: { marginTop: 18 },
  bar: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: p.rule, backgroundColor: p.boardDeep },
}));
