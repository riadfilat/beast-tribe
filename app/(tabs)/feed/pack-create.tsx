import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { makeStyles, useKit } from '../../../src/theme';
import { useI18n } from '../../../src/i18n';
import { useAuth } from '../../../src/providers/AuthProvider';
import { createPack, PackAudience, setPackPhoto } from '../../../src/data/packs';
import { PREVIEW, PREVIEW_ME } from '../../../src/data/preview';
import { randomEmblem } from '../../../src/lib/emblem';
import { Txt } from '../../../src/components/board/Txt';
import { Field, IconButton, MarkerButton, SectionHeading, Segmented, TextButton } from '../../../src/components/board/controls';
import { PatchPreview } from '../../../src/components/board/Patch';
import { PatchPicker } from '../../../src/components/board/PatchPicker';
import { toast } from '../../../src/components/board/toast';
import { haptic } from '../../../src/lib/haptics';
import { errorKey } from '../../../src/data/errors';

export default function PackCreateScreen() {
  const s = useStyles();
  const { p } = useKit();
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  // Women can start women-only groups, men can start men-only groups (the database checks it too).
  const gender = PREVIEW ? 'female' : (profile?.gender || '').toLowerCase();
  const audiences: PackAudience[] = ['everyone', ...(gender === 'female' ? (['women'] as PackAudience[]) : gender === 'male' ? (['men'] as PackAudience[]) : [])];
  const meId = PREVIEW ? PREVIEW_ME : user?.id ?? null;
  const [name, setName] = useState('');
  const [emblem, setEmblem] = useState(randomEmblem);
  const [audience, setAudience] = useState<PackAudience>('everyone');
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  async function pickPhoto() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [16, 9], quality: 0.85 });
    if (!res.canceled && res.assets?.[0]?.uri) setPhoto(res.assets[0].uri);
  }
  const shown = name.trim() || t('pack.namePlaceholder').replace(/^e\.g\.\s*|^مثال:\s*/, '');

  async function create() {
    if (!meId || !name.trim()) return;
    setBusy(true);
    try {
      const pack = await createPack(meId, name, emblem, audience);
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

          <View style={s.preview}>
            <PatchPreview emblem={emblem} name={shown} size={132} />
            <Txt v="row" size={22} align="center" numberOfLines={2} style={{ marginTop: 14 }}>
              {shown}
            </Txt>
          </View>

          <SectionHeading title={t('pack.name')} />
          <Field value={name} onChangeText={setName} placeholder={t('pack.namePlaceholder')} maxLength={32} returnKeyType="done" />

          <SectionHeading title={t('pack.audience')} style={{ marginTop: 18 }} />
          <Segmented
            options={audiences.map((k) => ({ value: k, label: t(`pack.audiences.${k}`) }))}
            value={audience}
            onChange={setAudience}
          />
          <Txt v="caption" style={{ marginTop: 6 }}>
            {t(`pack.audienceHint.${audience}`)}
          </Txt>
          {!gender ? (
            <TextButton label={t('pack.addGender')} onPress={() => router.push({ pathname: '/(onboarding)/about-you', params: { edit: '1' } })} style={{ alignSelf: 'flex-start', marginTop: 4 }} />
          ) : null}

          <SectionHeading title={t('pack.photo')} style={{ marginTop: 18 }} />
          {photo ? <Image source={{ uri: photo }} style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 14 }} resizeMode="cover" accessibilityIgnoresInvertColors /> : null}
          <View style={{ flexDirection: 'row', marginStart: -8 }}>
            <TextButton label={photo ? t('pack.changePhoto') : t('pack.addPhoto')} onPress={pickPhoto} />
            {photo ? <TextButton label={t('pack.removePhoto')} onPress={() => setPhoto(null)} /> : null}
          </View>

          <SectionHeading title={t('pack.patch')} style={{ marginTop: 18 }} />
          <PatchPicker value={emblem} onChange={setEmblem} name={shown} />
        </ScrollView>
        <View style={[s.bar, { paddingBottom: 12 + insets.bottom }]}>
          <MarkerButton label={t('pack.create')} onPress={create} loading={busy} disabled={!name.trim()} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ p }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  header: { paddingStart: 4 },
  body: { paddingHorizontal: 20, paddingBottom: 32 },
  preview: { alignItems: 'center', marginVertical: 24 },
  bar: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: p.rule, backgroundColor: p.boardDeep },
}));
