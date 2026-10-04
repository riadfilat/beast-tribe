import React, { useState } from 'react';
import { Alert, Linking, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { makeStyles, useTheme } from '../../../src/theme';
import { useI18n, Lang } from '../../../src/i18n';
import { useAuth } from '../../../src/providers/AuthProvider';
import { PRIVACY_URL, SUPPORT_URL, TERMS_URL } from '../../../src/lib/constants';
import { Txt } from '../../../src/components/board/Txt';
import { IconButton, Segmented } from '../../../src/components/board/controls';
import { Group, GroupRow } from '../../../src/components/board/list';
import { Lockup } from '../../../src/components/brand/Logo';
import { GLYPH_CREDIT } from '../../../src/components/brand/glyphs';
import { toast } from '../../../src/components/board/toast';

export default function SettingsScreen() {
  const s = useStyles();
  const { p, appearance, setAppearance } = useTheme();
  const { t, lang, setLanguage } = useI18n();
  const router = useRouter();
  const { signOut, deleteAccount } = useAuth();
  const [deleting, setDeleting] = useState(false);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'));

  function switchLanguage(next: Lang) {
    if (next === lang) return;
    // Native apps restart to flip layout direction; say so before it happens.
    Alert.alert(next === 'ar' ? 'العربية' : 'English', t('settings.languageNote'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.continue'), onPress: () => setLanguage(next) },
    ]);
  }

  function confirmSignOut() {
    Alert.alert(t('settings.signOutTitle'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.signOut'), style: 'destructive', onPress: () => signOut().catch(() => toast.show(t('common.somethingWrong'), 'error')) },
    ]);
  }

  function confirmDelete() {
    Alert.alert(t('settings.deleteTitle'), t('settings.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.deleteConfirm'),
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await deleteAccount();
          } catch (e: any) {
            toast.show(e?.message || t('common.somethingWrong'), 'error');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  }

  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <View style={s.header}>
        <IconButton name="back" label={t('common.back')} onPress={back} />
        <Txt v="title" size={22} accessibilityRole="header">
          {t('settings.title')}
        </Txt>
      </View>
      <ScrollView contentContainerStyle={s.content}>
        <Txt v="label" color={p.inkSoft} style={s.groupTitle}>
          {t('settings.language')}
        </Txt>
        <Segmented
          value={lang}
          onChange={switchLanguage}
          options={[
            { value: 'en', label: t('settings.english') },
            { value: 'ar', label: t('settings.arabic') },
          ]}
        />

        <Txt v="label" color={p.inkSoft} style={s.groupTitle}>
          {t('settings.appearance')}
        </Txt>
        <Segmented
          value={appearance}
          onChange={setAppearance}
          options={[
            { value: 'slate', label: t('settings.slate') },
            { value: 'whiteboard', label: t('settings.whiteboard') },
          ]}
        />

        <Txt v="label" color={p.inkSoft} style={s.groupTitle}>
          {t('settings.account')}
        </Txt>
        <Group>
          <GroupRow icon="edit" label={t('settings.editProfile')} onPress={() => router.push({ pathname: '/(onboarding)/about-you', params: { edit: '1' } })} />
          <GroupRow icon="bell" label={t('settings.notifications')} sub={t('settings.remindersSub')} onPress={() => Linking.openSettings().catch(() => {})} />
        </Group>

        <Group style={{ marginTop: 20 }}>
          <GroupRow icon="shield" label={t('settings.privacy')} onPress={() => Linking.openURL(PRIVACY_URL)} />
          <GroupRow icon="doc" label={t('settings.terms')} onPress={() => Linking.openURL(TERMS_URL)} />
          <GroupRow icon="help" label={t('settings.support')} onPress={() => Linking.openURL(SUPPORT_URL)} />
          <GroupRow icon="people" label={t('settings.guidelines')} onPress={() => Alert.alert(t('settings.guidelines'), t('settings.guidelinesBody'))} />
        </Group>

        <Group style={{ marginTop: 20 }}>
          <GroupRow icon="signOut" label={t('settings.signOut')} chevron={false} onPress={confirmSignOut} />
        </Group>
        <Group style={{ marginTop: 20 }}>
          <GroupRow icon="trash" label={deleting ? t('settings.deleting') : t('settings.deleteAccount')} tone="danger" chevron={false} onPress={deleting ? undefined : confirmDelete} />
        </Group>

        <View style={{ alignItems: 'center', gap: 8, marginTop: 28 }}>
          <Lockup height={18} ink={p.ink} />
          <Txt v="caption" align="center">
            {t('auth.byOB')} · {t('settings.version', { v: version })}
          </Txt>
          <Txt v="caption" align="center" style={{ maxWidth: 300 }}>
            {t('settings.iconCredit', { credit: GLYPH_CREDIT })}
          </Txt>
          <Txt v="caption" align="center" style={{ maxWidth: 300 }}>
            {t('settings.photoCredit')}
          </Txt>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ p }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  header: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingStart: 4, paddingBottom: 6 },
  content: { padding: 16, paddingBottom: 48 },
  groupTitle: { marginTop: 18, marginBottom: 8, marginStart: 4 },
}));
