import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { makeStyles, useKit } from '../../../src/theme';
import { useI18n } from '../../../src/i18n';
import { useAuth } from '../../../src/providers/AuthProvider';
import { createPack, PackError } from '../../../src/data/packs';
import { PREVIEW, PREVIEW_ME } from '../../../src/data/preview';
import { Txt } from '../../../src/components/board/Txt';
import { Press } from '../../../src/components/board/Press';
import { Field, IconButton, MarkerButton, SectionHeading } from '../../../src/components/board/controls';
import { patchFor } from '../../../src/components/board/patches';
import { toast } from '../../../src/components/board/toast';
import { haptic } from '../../../src/lib/haptics';

const ANIMALS = ['wolf', 'eagle', 'tiger', 'rhino'] as const;

export default function PackCreateScreen() {
  const s = useStyles();
  const { p } = useKit();
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const meId = PREVIEW ? PREVIEW_ME : user?.id ?? null;
  const [name, setName] = useState('');
  const [animal, setAnimal] = useState<(typeof ANIMALS)[number]>('wolf');
  const [busy, setBusy] = useState(false);

  async function create() {
    if (!meId || !name.trim()) return;
    setBusy(true);
    try {
      const pack = await createPack(meId, name, animal);
      haptic('success');
      router.replace({ pathname: '/(tabs)/feed/pack', params: { packId: pack.id } });
    } catch (e: any) {
      haptic('error');
      toast.show(t(`pack.errors.${e instanceof PackError ? e.code : 'generic'}`), 'error');
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
            <View style={s.patchLg}>
              <Image source={patchFor(animal)} style={{ width: 150, height: 150 }} />
            </View>
            <Txt v="row" size={22} align="center" numberOfLines={2} style={{ marginTop: 14 }}>
              {name.trim() || t('pack.namePlaceholder').replace(/^e\.g\.\s*|^مثال:\s*/, '')}
            </Txt>
          </View>

          <SectionHeading title={t('pack.beast')} />
          <View style={s.animals}>
            {ANIMALS.map((a) => {
              const on = animal === a;
              return (
                <Press key={a} onPress={() => setAnimal(a)} feedback="selection" accessibilityRole="radio" accessibilityState={{ selected: on }} style={{ alignItems: 'center', gap: 6, flex: 1 }}>
                  <View style={[s.patchSm, on ? { borderColor: p.ink, borderWidth: 2.5 } : null]}>
                    <Image source={patchFor(a)} style={{ width: 64, height: 64 }} />
                  </View>
                  <Txt v="label" size={13} color={on ? p.ink : p.inkSoft}>
                    {t(`pack.animals.${a}`)}
                  </Txt>
                </Press>
              );
            })}
          </View>

          <SectionHeading title={t('pack.name')} style={{ marginTop: 18 }} />
          <Field value={name} onChangeText={setName} placeholder={t('pack.namePlaceholder')} maxLength={32} returnKeyType="done" onSubmitEditing={create} />
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
  patchLg: { width: 150, height: 150, borderRadius: 75, overflow: 'hidden', backgroundColor: '#023C3C', borderWidth: 1.5, borderColor: p.ruleStrong },
  patchSm: { width: 64, height: 64, borderRadius: 32, overflow: 'hidden', backgroundColor: '#023C3C', borderWidth: 1.5, borderColor: p.rule },
  animals: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  bar: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: p.rule, backgroundColor: p.boardDeep },
}));
