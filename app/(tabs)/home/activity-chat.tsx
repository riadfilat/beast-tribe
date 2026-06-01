import React from 'react';
import { StyleSheet, Alert, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ChatScreen } from '../../../src/components/chat/ChatScreen';
import { useChatRoom, useChatMessages, useSendMessage, useLeaveEvent, useEventAttendees } from '../../../src/hooks';
import { COLORS, FONTS } from '../../../src/lib/constants';

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

  const { roomId, loading: roomLoading, error: roomError } = useChatRoom('event', eventId);
  const { messages, loading: msgsLoading, addLocalMessage } = useChatMessages(roomId);
  const { sendMessage, loading: sending } = useSendMessage();
  const { leaveEvent, loading: leaving } = useLeaveEvent();
  const { data: rsvps } = useEventAttendees(eventId);
  const attendees = (rsvps || [])
    .filter((r: any) => r.profile)
    .map((r: any) => ({
      id: r.profile.id,
      name: r.profile.display_name || r.profile.full_name || 'Beast',
      avatar_url: r.profile.avatar_url,
    }));

  async function handleSend(content: string, type: 'text' | 'status' | 'ping') {
    if (!roomId) return;
    const msg = await sendMessage(roomId, content, type);
    if (msg) addLocalMessage(msg);
  }

  function handleLeave() {
    if (leaving || !eventId) return;
    Alert.alert(
      'Leave this activity?',
      `You'll be removed from "${eventTitle || 'this activity'}". You can rejoin from the events list anytime.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveEvent(eventId);
              if (router.canGoBack()) router.back();
              else router.replace('/(tabs)/events');
            } catch (e: any) {
              Alert.alert('Could not leave activity', e?.message || 'Please try again.');
            }
          },
        },
      ]
    );
  }

  if (roomError && !roomLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorWrap}>
          <Ionicons name="cloud-offline-outline" size={40} color={COLORS.textMuted} />
          <Text style={styles.errorText}>Couldn't open this chat.</Text>
          <Text style={styles.errorSub}>{roomError}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/home')}
            activeOpacity={0.8}
          >
            <Text style={styles.retryText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ChatScreen
        title={eventTitle || 'Activity Chat'}
        messages={messages}
        loading={roomLoading || msgsLoading}
        onSend={handleSend}
        sending={sending}
        statusButtons={EVENT_STATUS_BUTTONS}
        attendees={attendees}
        onBack={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/home')}
        headerAction={{
          icon: 'exit-outline',
          onPress: handleLeave,
          color: '#EF5350',
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  errorWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, gap: 8 },
  errorText: { fontSize: 15, fontFamily: FONTS.heading, color: COLORS.textSecondary, marginTop: 8 },
  errorSub: { fontSize: 12, fontFamily: FONTS.body, color: COLORS.textMuted, textAlign: 'center' },
  retryBtn: {
    marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.orange,
  },
  retryText: { fontSize: 13, fontFamily: FONTS.bodySemiBold, color: COLORS.orange },
});
