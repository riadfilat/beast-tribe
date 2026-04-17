import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChatScreen } from '../../../src/components/chat/ChatScreen';
import { useChatRoom, useChatMessages, useSendMessage } from '../../../src/hooks';
import { COLORS } from '../../../src/lib/constants';

const EVENT_STATUS_BUTTONS = [
  { label: "I arrived! 📍", icon: 'location', type: 'status' as const },
  { label: 'On my way! 🏃', icon: 'walk', type: 'status' as const },
  { label: 'Running late ⏰', icon: 'time', type: 'status' as const },
  { label: "Who's coming? 👋", icon: 'hand-left', type: 'ping' as const },
];

export default function ActivityChatScreen() {
  const router = useRouter();
  const { eventId, eventTitle, attendeeCount } = useLocalSearchParams<{
    eventId: string;
    eventTitle?: string;
    attendeeCount?: string;
  }>();

  const { roomId, loading: roomLoading } = useChatRoom('event', eventId);
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
        title={eventTitle || 'Activity Chat'}
        subtitle={attendeeCount ? `${attendeeCount} beasts joining` : undefined}
        messages={messages}
        loading={roomLoading || msgsLoading}
        onSend={handleSend}
        sending={sending}
        statusButtons={EVENT_STATUS_BUTTONS}
        onBack={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/home')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
});
