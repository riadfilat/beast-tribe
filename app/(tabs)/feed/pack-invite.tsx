import React, { useEffect, useState } from 'react';
import { ScrollView, Share, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { makeStyles, useKit } from '../../../src/theme';
import { useI18n } from '../../../src/i18n';
import { useAuth } from '../../../src/providers/AuthProvider';
import { inviteToPack, searchMembers, usePack } from '../../../src/data/packs';
import { PREVIEW, PREVIEW_ME } from '../../../src/data/preview';
import type { Person } from '../../../src/components/board/people';
import { Magnet } from '../../../src/components/board/people';
import { Txt } from '../../../src/components/board/Txt';
import { Icon } from '../../../src/components/board/Icon';
import { Press } from '../../../src/components/board/Press';
import { Field, IconButton, OutlineButton, SectionHeading } from '../../../src/components/board/controls';
import { toast } from '../../../src/components/board/toast';
import { haptic } from '../../../src/lib/haptics';

export default function PackInviteScreen() {
  const s = useStyles();
  const { p } = useKit();
  const { t } = useI18n();
  const router = useRouter();
  const { packId } = useLocalSearchParams<{ packId?: string }>();
  const { user } = useAuth();
  const meId = PREVIEW ? PREVIEW_ME : user?.id ?? null;
  // The pack being invited to — not simply the member's first pack.
  const pack = usePack(packId).data;
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Person[]>([]);
  const [invited, setInvited] = useState<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;
    const id = setTimeout(() => {
      searchMembers(q, meId).then((r) => alive && setResults(r.filter((x) => !pack?.members.some((m) => m.id === x.id))));
    }, 250);
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [q, pack?.members.length]);

  async function invite(person: Person) {
    if (!meId || !packId) return;
    try {
      await inviteToPack(meId, packId, person.id);
      haptic('success');
      setInvited((prev) => new Set(prev).add(person.id));
    } catch {
      toast.show(t('pack.errors.generic'), 'error');
    }
  }

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <View style={s.header}>
        <IconButton name="back" label={t('common.back')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/feed'))} />
        <Txt v="title" size={22} accessibilityRole="header">
          {t('pack.invite')}
        </Txt>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} keyboardShouldPersistTaps="handled">
        {pack?.inviteCode ? (
          <Press
            onPress={() => Share.share({ message: t('pack.shareMessage', { name: pack.name, code: pack.inviteCode! }) }).catch(() => {})}
            feedback="light"
            style={s.code}
          >
            <View style={{ flex: 1 }}>
              <Txt v="label" size={13} color={p.inkSoft}>
                {pack.name} · {t('pack.code')}
              </Txt>
              <Txt v="time" size={30} style={{ letterSpacing: 4 }}>
                {pack.inviteCode}
              </Txt>
            </View>
            <Icon name="share" size={20} />
          </Press>
        ) : null}

        <SectionHeading title={t('pack.searchTitle')} />
        <Field value={q} onChangeText={setQ} placeholder={t('pack.searchPlaceholder')} autoCapitalize="none" autoCorrect={false} trailing={<Icon name="explore" size={18} color={p.inkFaint} />} />
        {q.trim().length >= 2 && results.length === 0 ? <Txt v="meta">{t('pack.noResults')}</Txt> : null}
        {results.map((person) => {
          const done = invited.has(person.id);
          return (
            <View key={person.id} style={s.row}>
              <Magnet person={person} size={38} />
              <Txt v="headline" size={15} style={{ flex: 1 }}>
                {person.name}
              </Txt>
              {done ? (
                <Txt v="label" color={p.aqua}>
                  {t('pack.invited')}
                </Txt>
              ) : (
                <OutlineButton label={t('session.invite')} onPress={() => invite(person)} style={{ height: 38 }} />
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ p }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  header: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingStart: 4, paddingBottom: 6 },
  code: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: p.ruleStrong, borderStyle: 'dashed' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: p.rule },
}));
