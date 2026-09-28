import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useKit } from '../../../src/theme';
import { useI18n } from '../../../src/i18n';
import { useLiveChat } from '../../../src/data/chat';
import { ChatScreen } from '../../../src/components/chat/ChatScreen';
import { Txt } from '../../../src/components/board/Txt';
import { IconButton } from '../../../src/components/board/controls';
import { toast } from '../../../src/components/board/toast';

export default function PackChatScreen() {
  const router = useRouter();
  const { p } = useKit();
  const { t, tn } = useI18n();
  const { packId, packName, memberCount } = useLocalSearchParams<{ packId: string; packName?: string; memberCount?: string }>();
  const chat = useLiveChat('pack', packId);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/feed'));

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

  return (
    <ChatScreen
      title={packName || t('tribe.packs')}
      subtitle={memberCount ? tn('chat.members', Number(memberCount)) : undefined}
      messages={chat.messages}
      meId={chat.meId}
      loading={chat.loading}
      sending={chat.sending}
      quick={false}
      onSend={(content, kind) => chat.send(content, kind).catch(() => toast.show(t('common.somethingWrong'), 'error'))}
      onBack={back}
    />
  );
}
