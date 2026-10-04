import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { makeStyles, useKit } from '../src/theme';
import { useI18n } from '../src/i18n';
import { useAuth } from '../src/providers/AuthProvider';
import { COMMUNITY_KINDS, CommunityKind, requestCommunity } from '../src/data/clubs';
import { cityLabel } from '../src/lib/cities';
import { Txt } from '../src/components/board/Txt';
import { Icon } from '../src/components/board/Icon';
import { Chip, Field, IconButton, MarkerButton, OutlineButton, SectionHeading } from '../src/components/board/controls';
import { toast } from '../src/components/board/toast';
import { haptic } from '../src/lib/haptics';
import { errorKey } from '../src/data/errors';

// Your own community: communities are set up by Beast Tribe for companies, gyms, coaches, creators,
// compounds and clubs. The member says who they are, the screen speaks to that, and the request goes
// to the team (Leads in the dashboard). Every community is private: only people its owner or admins
// invite can join.

const SIZES: Record<'people' | 'followers', string[]> = {
  people: ['<50', '50-200', '200-1000', '1000+'],
  followers: ['<10k', '10k-100k', '100k-1M', '1M+'],
};

export default function CommunityRequestScreen() {
  const s = useStyles();
  const { p, lang } = useKit();
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const [kind, setKind] = useState<CommunityKind | null>(null);
  const [org, setOrg] = useState('');
  const [name, setName] = useState(profile?.full_name || profile?.display_name || '');
  const [role, setRole] = useState('');
  const [contact, setContact] = useState(user?.email || '');
  const [city, setCity] = useState(cityLabel(profile?.city, lang));
  const [size, setSize] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/feed'));
  const sizes = kind === 'influencer' ? SIZES.followers : SIZES.people;
  const first = (name.trim() || profile?.display_name || '').split(' ')[0];

  async function send() {
    if (!kind || busy) return;
    if (org.trim().length < 2) return toast.show(t(`request.orgNeeded.${kind}`), 'error');
    if (name.trim().length < 2) return toast.show(t('request.errors.NAME'), 'error');
    if (contact.trim().length < 5) return toast.show(t('request.errors.CONTACT'), 'error');
    setBusy(true);
    try {
      await requestCommunity({ kind, org, name, role, contact, city, size, message });
      haptic('success');
      setSent(true);
    } catch (e: any) {
      haptic('error');
      toast.show(t(errorKey('request', e)), 'error');
    } finally {
      setBusy(false);
    }
  }

  if (sent && kind) {
    return (
      <SafeAreaView style={s.screen} edges={['top']}>
        <View style={[s.body, { flex: 1, justifyContent: 'center', gap: 14 }]}>
          <Icon name="check" size={34} color={p.aqua} />
          <Txt v="hero" size={36} accessibilityRole="header">
            {first ? t('request.sentTitle', { name: first }) : t('request.sentTitleNoName')}
          </Txt>
          <Txt v="body" color={p.inkSoft}>
            {t(`request.sent.${kind}`, { org: org.trim() })}
          </Txt>
          <Txt v="body" color={p.inkSoft}>
            {t('request.private')}
          </Txt>
          <MarkerButton label={t('common.done')} onPress={back} style={{ marginTop: 12 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.top}>
          <IconButton name="close" label={t('common.close')} onPress={back} />
        </View>
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
          <Txt v="hero" size={38} accessibilityRole="header">
            {t('request.title')}
          </Txt>
          <Txt v="body" color={p.inkSoft} style={{ marginTop: 8 }}>
            {t('request.sub')}
          </Txt>

          <SectionHeading title={t('request.who')} style={{ marginTop: 18 }} />
          <View style={s.wrap}>
            {COMMUNITY_KINDS.map((k) => (
              <Chip key={k} label={t(`request.kinds.${k}`)} selected={kind === k} onPress={() => { setKind(k); setSize(null); }} />
            ))}
          </View>

          {kind ? (
            <>
              {/* What they get, in their own terms */}
              <View style={s.pitch}>
                <Txt v="title" size={20}>
                  {t(`request.pitch.${kind}.title`)}
                </Txt>
                <Txt v="body" size={15} color={p.inkSoft}>
                  {t(`request.pitch.${kind}.body`)}
                </Txt>
              </View>

              <SectionHeading title={t(`request.org.${kind}`)} style={{ marginTop: 6 }} />
              <Field value={org} onChangeText={setOrg} maxLength={120} />

              <SectionHeading title={t('request.yourName')} style={{ marginTop: 14 }} />
              <Field value={name} onChangeText={setName} maxLength={120} />

              <SectionHeading title={t('request.role')} style={{ marginTop: 14 }} />
              <Field value={role} onChangeText={setRole} placeholder={t(`request.rolePlaceholder.${kind}`)} maxLength={80} />

              <SectionHeading title={t(`request.size.${kind}`)} style={{ marginTop: 14 }} />
              <View style={s.wrap}>
                {sizes.map((x) => (
                  <Chip key={x} label={t(`request.sizes.${x}`)} selected={size === x} onPress={() => setSize(size === x ? null : x)} />
                ))}
              </View>

              <SectionHeading title={t('request.contact')} style={{ marginTop: 14 }} />
              <Field value={contact} onChangeText={setContact} keyboardType="email-address" autoCapitalize="none" maxLength={200} />
              <Txt v="caption" style={{ marginTop: 6 }}>
                {t('request.contactHint')}
              </Txt>

              <SectionHeading title={t('host.city')} style={{ marginTop: 14 }} />
              <Field value={city} onChangeText={setCity} placeholder={t('host.cityPlaceholder')} maxLength={80} />

              <SectionHeading title={t('request.message')} style={{ marginTop: 14 }} />
              <Field value={message} onChangeText={setMessage} placeholder={t(`request.messagePlaceholder.${kind}`)} multiline maxLength={1000} />
            </>
          ) : null}
        </ScrollView>
        {kind ? (
          <View style={[s.bar, { paddingBottom: 12 + insets.bottom }]}>
            <MarkerButton label={t('request.send')} onPress={send} loading={busy} />
            <Txt v="caption" align="center" style={{ marginTop: 8 }}>
              {t('request.private')}
            </Txt>
          </View>
        ) : (
          <View style={[s.bar, { paddingBottom: 12 + insets.bottom }]}>
            <OutlineButton label={t('common.close')} onPress={back} />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ p }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  top: { paddingStart: 4, paddingBottom: 4 },
  body: { paddingHorizontal: 20, paddingBottom: 32 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pitch: { gap: 6, marginTop: 18, marginBottom: 10, padding: 14, borderRadius: 12, backgroundColor: p.wash },
  bar: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: p.rule, backgroundColor: p.boardDeep },
}));
