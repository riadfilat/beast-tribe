import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChatScreen } from '../../../src/components/chat/ChatScreen';
import { useChatRoom, useChatMessages, useSendMessage } from '../../../src/hooks';
import { COLORS } from '../../../src/lib/constants';

export default function PackChatScreen() {
  const router = useRouter();
  const { packId, packName, memberCount } = useLocalSearchParams<{
    packId: string;
    packName?: string;
    memberCount?: string;
  }>();

  const { roomId, loading: roomLoading } = useChatRoom('pack', packId);
  const { messages, loading: msgsLoading, addLocalMessage } = useChatMessages(roomId);
  const { sendMessage, loading: sending } = useSendMessage();

  async function handleSend(content: string, type: 'text' | 'status' | 'ping') {
    if (!roomId) return;
    const msg = await sendMessage(roomId, content, type);
    if (msg) addLocalMessage(msg);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ChatScreen
        title={packName || 'Pack Chat'}
        subtitle={memberCount ? `${memberCount} members` : undefined}
        messages={messages}
        loading={roomLoading || msgsLoading}
        onSend={handleSend}
        sending={sending}
        onBack={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
});
