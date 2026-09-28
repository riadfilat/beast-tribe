import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useKit } from '../../../src/theme';
import { useI18n } from '../../../src/i18n';
import { fmtClock, fmtDay } from '../../../src/i18n/format';
import { useSession } from '../../../src/data/sessions';
import { useLiveChat } from '../../../src/data/chat';
import { ChatScreen } from '../../../src/components/chat/ChatScreen';
import { Txt } from '../../../src/components/board/Txt';
import { IconButton } from '../../../src/components/board/controls';
import { toast } from '../../../src/components/board/toast';

export default function SessionChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { p, lang } = useKit();
  const { t, tn } = useI18n();
  const session = useSession(id).data;
  const chat = useLiveChat('event', id);

  const back = () => (router.canGoBack() ? router.back() : router.replace({ pathname: '/session/[id]', params: { id } }));

  if (chat.error && !chat.loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: p.board }}>
        <IconButton name="back" label={t('common.back')} onPress={back} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Txt v="headline" align="center">
            {t('chat.openError')}
          </Txt>
        </View>
      </SafeAreaView>
    );
  }

  const subtitle = session
    ? [`${fmtDay(session.startsAt, lang)} ${fmtClock(session.startsAt, lang)}`, session.place, tn('session.going', session.goingCount)].filter(Boolean).join(' · ')
    : undefined;

  return (
    <ChatScreen
      title={session?.title || t('session.chat')}
      subtitle={subtitle}
      people={session?.roster}
      peopleTotal={session?.goingCount}
      messages={chat.messages}
      meId={chat.meId}
      loading={chat.loading}
      sending={chat.sending}
      onSend={(content, kind) => chat.send(content, kind).catch(() => toast.show(t('common.somethingWrong'), 'error'))}
      onBack={back}
      onTitlePress={() => router.push({ pathname: '/session/[id]', params: { id } })}
    />
  );
}
