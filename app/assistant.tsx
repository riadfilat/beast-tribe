import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { makeStyles, useKit } from '../src/theme';
import { useI18n } from '../src/i18n';
import { AssistantCard, AssistantTurn, askBeast } from '../src/data/assistant';
import { fmtClock, fmtDay } from '../src/i18n/format';
import { Txt } from '../src/components/board/Txt';
import { Icon } from '../src/components/board/Icon';
import { Press } from '../src/components/board/Press';
import { Magnet } from '../src/components/board/people';
import { Chip, Field, IconButton } from '../src/components/board/controls';
import { haptic } from '../src/lib/haptics';

const SUGGESTIONS = ['partner', 'tonight', 'workout', 'clubs'] as const;

// Ask Beast: ask in plain words, get people, sessions, workouts and clubs back as cards.
export default function AssistantScreen() {
  const s = useStyles();
  const { p, lang } = useKit();
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [turns, setTurns] = useState<AssistantTurn[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/events'));

  async function ask(q: string) {
    const question = q.trim();
    if (!question || busy) return;
    const next: AssistantTurn[] = [...turns, { role: 'user', content: question }];
    setTurns(next);
    setText('');
    setBusy(true);
    haptic('light');
    try {
      const r = await askBeast(next, lang);
      setTurns([...next, { role: 'assistant', content: r.reply, cards: r.cards }]);
    } catch (e: any) {
      setTurns([...next, { role: 'assistant', content: t(`assistant.errors.${e?.code || 'generic'}`) }]);
    } finally {
      setBusy(false);
      setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 80);
    }
  }

  function open(c: AssistantCard) {
    if (c.type === 'session') router.push({ pathname: '/session/[id]', params: { id: c.id } });
    else if (c.type === 'workout') router.push({ pathname: '/workout/[id]', params: { id: c.id } });
    else if (c.type === 'club') router.push({ pathname: '/(tabs)/feed/community', params: { id: c.id } });
    else if (c.type === 'partner') router.push('/partners');
    else if (c.type === 'action') router.push(c.action === 'partners' ? '/partners' : c.action === 'host' ? '/host' : { pathname: '/(tabs)/feed', params: { tab: 'communities' } });
  }

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <View style={s.top}>
        <IconButton name="back" label={t('common.back')} onPress={back} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Txt v="row" size={15}>
            {t('assistant.title')}
          </Txt>
          <Txt v="caption">{t('assistant.by')}</Txt>
        </View>
        <View style={{ width: 44 }} />
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scroll} contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
          {!turns.length ? (
            <View style={{ gap: 14, paddingTop: 10 }}>
              <Icon name="sparkle" size={28} color={p.marker} />
              <Txt v="hero" size={36}>
                {t('assistant.hello')}
              </Txt>
              <Txt v="body" color={p.inkSoft}>
                {t('assistant.intro')}
              </Txt>
              <View style={{ gap: 8, marginTop: 6 }}>
                {SUGGESTIONS.map((k) => (
                  <Chip key={k} label={t(`assistant.suggest.${k}`)} onPress={() => ask(t(`assistant.suggest.${k}`))} />
                ))}
              </View>
            </View>
          ) : null}
          {turns.map((m, i) =>
            m.role === 'user' ? (
              <View key={i} style={s.mine}>
                <Txt v="body" size={15} color={p.onMarker}>
                  {m.content}
                </Txt>
              </View>
            ) : (
              <View key={i} style={{ gap: 10, alignSelf: 'stretch' }}>
                <Txt v="body" size={15}>
                  {m.content}
                </Txt>
                {(m.cards ?? []).map((c, j) => (
                  <Card key={j} c={c} onPress={() => open(c)} />
                ))}
              </View>
            ),
          )}
          {busy ? (
            <Txt v="meta" style={{ marginTop: 4 }}>
              {t('assistant.thinking')}
            </Txt>
          ) : null}
        </ScrollView>
        <View style={[s.bar, { paddingBottom: 10 + insets.bottom }]}>
          <Field
            value={text}
            onChangeText={setText}
            placeholder={t('assistant.placeholder')}
            returnKeyType="send"
            onSubmitEditing={() => ask(text)}
            maxLength={500}
            containerStyle={{ flex: 1 }}
            trailing={<IconButton name="send" label={t('assistant.send')} onPress={() => ask(text)} />}
          />
          <Txt v="caption" align="center" style={{ marginTop: 6 }}>
            {t('assistant.note')}
          </Txt>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Card({ c, onPress }: { c: AssistantCard; onPress: () => void }) {
  const { p, lang } = useKit();
  const { t } = useI18n();
  let title = '';
  let line = '';
  let lead: React.ReactNode = null;
  if (c.type === 'partner') {
    title = c.name;
    line = c.line;
    lead = <Magnet person={{ id: c.id, name: c.name, avatarUrl: c.avatarUrl }} size={34} />;
  } else if (c.type === 'session') {
    title = c.title;
    const d = new Date(c.startsAt);
    line = [`${fmtDay(d, lang)} · ${fmtClock(d, lang)}`, c.place].filter(Boolean).join(' · ');
    lead = <Icon sport={c.sport} size={22} color={p.aqua} />;
  } else if (c.type === 'workout') {
    title = c.title;
    line = [c.minutes ? `${c.minutes} ${lang === 'ar' ? 'د' : 'min'}` : null, c.sport ? t(`sports.${c.sport}`) : null].filter(Boolean).join(' · ');
    lead = <Icon name="train" size={22} color={p.aqua} />;
  } else if (c.type === 'club') {
    title = c.name;
    line = c.line;
    lead = <Icon name="people" size={22} color={p.aqua} />;
  } else {
    title = t(`assistant.actions.${c.action}`);
    lead = <Icon name={c.action === 'host' ? 'plus' : c.action === 'partners' ? 'people' : 'flag'} size={20} color={p.marker} />;
  }
  return (
    <Press onPress={onPress} feedback="light" accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: p.rule }}>
      <View style={{ width: 36, alignItems: 'center' }}>{lead}</View>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt v="row" size={14} numberOfLines={1}>
          {title}
        </Txt>
        {line ? (
          <Txt v="caption" numberOfLines={2}>
            {line}
          </Txt>
        ) : null}
      </View>
      <Icon name="chevron" size={14} color={p.inkFaint} />
    </Press>
  );
}

const useStyles = makeStyles(({ p }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: p.rule },
  body: { padding: 20, gap: 16, paddingBottom: 30 },
  mine: { alignSelf: 'flex-end', maxWidth: '85%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderBottomEndRadius: 4, backgroundColor: p.marker },
  bar: { paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: p.rule, backgroundColor: p.boardDeep },
}));
