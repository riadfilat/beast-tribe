import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { makeStyles, useKit } from '../../theme';
import { useI18n } from '../../i18n';
import { fmtClock } from '../../i18n/format';
import type { ChatMessage } from '../../data/chat';
import { Txt } from '../board/Txt';
import { Press } from '../board/Press';
import { Icon } from '../board/Icon';
import { IconButton } from '../board/controls';
import { MagnetRow, Person } from '../board/people';

const QUICK: { code: 'onMyWay' | 'arrived' | 'late' | 'whosComing'; kind: 'status' | 'ping' }[] = [
  { code: 'onMyWay', kind: 'status' },
  { code: 'arrived', kind: 'status' },
  { code: 'late', kind: 'status' },
  { code: 'whosComing', kind: 'ping' },
];

interface Props {
  title: string;
  subtitle?: string;
  people?: Person[];
  peopleTotal?: number;
  messages: ChatMessage[];
  meId: string | null;
  loading: boolean;
  sending?: boolean;
  onSend: (content: string, kind: 'text' | 'status' | 'ping') => void;
  onBack: () => void;
  onTitlePress?: () => void;
  quick?: boolean;
}

/** Quick statuses travel as codes and render in each reader's language. */
function useRenderContent() {
  const { t } = useI18n();
  return (content: string) => (content.startsWith('status:') ? t(`chat.quick.${content.slice(7)}`) : content);
}

export function ChatScreen({ title, subtitle, people, peopleTotal, messages, meId, loading, sending, onSend, onBack, onTitlePress, quick = true }: Props) {
  const s = useStyles();
  const { p, lang } = useKit();
  const { t } = useI18n();
  const render = useRenderContent();
  const [text, setText] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const id = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(id);
  }, [messages.length]);

  function send() {
    if (!text.trim() || sending) return;
    onSend(text.trim(), 'text');
    setText('');
  }

  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={s.header}>
          <IconButton name="back" label={t('common.back')} onPress={onBack} />
          <Press onPress={onTitlePress} disabled={!onTitlePress} feedback="selection" depress={0.98} style={{ flex: 1 }}>
            <Txt v="row" size={16} numberOfLines={1}>
              {title}
            </Txt>
            {subtitle ? (
              <Txt v="caption" numberOfLines={1}>
                {subtitle}
              </Txt>
            ) : null}
          </Press>
        </View>
        {people && people.length ? (
          <View style={s.people}>
            <MagnetRow people={people} total={peopleTotal} max={7} size={26} meId={meId} />
          </View>
        ) : null}

        {/* Messages */}
        <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={s.list} keyboardDismissMode="interactive" showsVerticalScrollIndicator={false}>
          {!loading && messages.length === 0 ? (
            <View style={s.empty}>
              <Icon name="chat" size={30} color={p.inkFaint} />
              <Txt v="meta" align="center">
                {t('chat.empty')}
              </Txt>
            </View>
          ) : null}
          {messages.map((m, i) => {
            const mine = m.userId === meId;
            const prev = messages[i - 1];
            const firstOfRun = !prev || prev.userId !== m.userId || prev.kind !== 'text';
            if (m.kind !== 'text') {
              return (
                <View key={m.id} style={s.noteRow}>
                  <View style={[s.note, m.kind === 'ping' ? { borderColor: p.aqua } : null]}>
                    <View style={[s.noteDot, { backgroundColor: mine ? p.marker : p.aqua }]} />
                    <Txt v="label" size={13}>
                      {mine ? t('chat.you') : m.authorName.split(' ')[0]} · {render(m.content)}
                    </Txt>
                  </View>
                  <Txt v="caption" size={11}>
                    {fmtClock(m.createdAt, lang)}
                  </Txt>
                </View>
              );
            }
            return (
              <View key={m.id} style={[s.bubbleRow, mine ? s.bubbleRowMine : null, firstOfRun ? { marginTop: 10 } : null]}>
                <View style={[s.bubble, mine ? s.bubbleMine : s.bubbleTheirs]}>
                  {!mine && firstOfRun ? (
                    <Txt v="label" size={12} color={p.aqua} style={{ marginBottom: 2 }}>
                      {m.authorName}
                    </Txt>
                  ) : null}
                  <Txt v="body" size={16} color={mine ? p.onMarker : p.ink}>
                    {m.content}
                  </Txt>
                  <Txt v="caption" size={11} color={mine ? p.onMarker : p.inkFaint} style={{ alignSelf: 'flex-end', marginTop: 2, opacity: mine ? 0.8 : 1 }}>
                    {fmtClock(m.createdAt, lang)}
                  </Txt>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Quick statuses */}
        {quick ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.quickBar} contentContainerStyle={s.quickRow} keyboardShouldPersistTaps="handled">
            {QUICK.map((q) => (
              <Press key={q.code} onPress={() => onSend(`status:${q.code}`, q.kind)} feedback="light" style={s.quick}>
                <Txt v="label" size={13}>
                  {t(`chat.quick.${q.code}`)}
                </Txt>
              </Press>
            ))}
          </ScrollView>
        ) : null}

        {/* Composer */}
        <View style={s.composer}>
          <TextInput
            style={[s.input, { textAlign: lang === 'ar' ? 'right' : 'left' }]}
            value={text}
            onChangeText={setText}
            placeholder={t('chat.placeholder')}
            placeholderTextColor={p.inkFaint}
            selectionColor={p.marker}
            multiline
            maxLength={1000}
          />
          <Press onPress={send} disabled={!text.trim() || sending} feedback="light" accessibilityLabel={t('chat.send')} style={[s.send, { backgroundColor: text.trim() ? p.marker : p.wash }]}>
            <Icon name="send" size={18} color={text.trim() ? p.onMarker : p.inkFaint} weight="bold" />
          </Press>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ p, f }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  header: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingEnd: 16, paddingStart: 4, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: p.rule },
  people: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: p.rule },
  list: { paddingHorizontal: 14, paddingVertical: 12 },
  empty: { alignItems: 'center', gap: 10, marginTop: 60 },
  noteRow: { alignItems: 'center', gap: 4, marginVertical: 10 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: p.ruleStrong, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  noteDot: { width: 8, height: 8, borderRadius: 4 },
  bubbleRow: { flexDirection: 'row', marginTop: 3 },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '80%', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  bubbleMine: { backgroundColor: p.marker, borderBottomEndRadius: 4 },
  bubbleTheirs: { backgroundColor: p.wash, borderWidth: 1, borderColor: p.rule, borderBottomStartRadius: 4 },
  quickBar: { flexGrow: 0, borderTopWidth: 1, borderTopColor: p.rule },
  quickRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  quick: { minHeight: 36, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 8, borderWidth: 1.5, borderColor: p.ruleStrong },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: p.rule },
  input: { flex: 1, minHeight: 42, maxHeight: 120, borderRadius: 21, borderWidth: 1.5, borderColor: p.ruleStrong, backgroundColor: p.wash, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, color: p.ink, fontSize: 16, ...f.ui },
  send: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
}));
