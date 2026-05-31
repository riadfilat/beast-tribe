import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ChatScreen } from '../../../src/components/chat/ChatScreen';
import { useChatRoom, useChatMessages, useSendMessage } from '../../../src/hooks';
import { COLORS, FONTS } from '../../../src/lib/constants';

export default function PackChatScreen() {
  const router = useRouter();
  const { packId, packName, memberCount } = useLocalSearchParams<{
    packId: string;
    packName?: string;
    memberCount?: string;
  }>();

  const { roomId, loading: roomLoading, error: roomError } = useChatRoom('pack', packId);
  const { messages, loading: msgsLoading, addLocalMessage } = useChatMessages(roomId);
  const { sendMessage, loading: sending } = useSendMessage();

  async function handleSend(content: string, type: 'text' | 'status' | 'ping') {
    if (!roomId) return;
    const msg = await sendMessage(roomId, content, type);
    if (msg) addLocalMessage(msg);
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
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')}
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
  errorWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, gap: 8 },
  errorText: { fontSize: 15, fontFamily: FONTS.heading, color: COLORS.textSecondary, marginTop: 8 },
  errorSub: { fontSize: 12, fontFamily: FONTS.body, color: COLORS.textMuted, textAlign: 'center' },
  retryBtn: {
    marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.orange,
  },
  retryText: { fontSize: 13, fontFamily: FONTS.bodySemiBold, color: COLORS.orange },
});
