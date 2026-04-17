import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../ui';
import { useAuth } from '../../providers/AuthProvider';
import { COLORS, FONTS } from '../../lib/constants';

interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  message_type: 'text' | 'status' | 'ping';
  created_at: string;
  author?: {
    display_name?: string;
    full_name?: string;
    tier?: string;
    avatar_url?: string;
  };
}

interface Attendee {
  id: string;
  name: string;
  tier: string;
  avatar_url?: string;
}

interface StatusButton {
  label: string;
  icon: string;
  type: 'status' | 'ping';
}

interface ChatScreenProps {
  title: string;
  subtitle?: string;
  messages: ChatMessage[];
  loading: boolean;
  onSend: (content: string, type: 'text' | 'status' | 'ping') => void;
  sending?: boolean;
  statusButtons?: StatusButton[];
  attendees?: Attendee[];
  onBack: () => void;
}

const DEFAULT_STATUS_BUTTONS: StatusButton[] = [
  { label: "I'm here! 📍", icon: 'location', type: 'status' },
  { label: 'On my way! 🏃', icon: 'walk', type: 'status' },
  { label: 'Running late ⏰', icon: 'time', type: 'status' },
  { label: "Who's coming? 👋", icon: 'hand-left', type: 'ping' },
];

// Empty — real attendees from event RSVPs
const DEMO_ATTENDEES: Attendee[] = [];

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ChatScreen({
  title,
  subtitle,
  messages,
  loading,
  onSend,
  sending,
  statusButtons = DEFAULT_STATUS_BUTTONS,
  attendees,
  onBack,
}: ChatScreenProps) {
  const [text, setText] = useState('');
  const [showMembers, setShowMembers] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const { user } = useAuth();

  const membersList = attendees && attendees.length > 0 ? attendees : DEMO_ATTENDEES;

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages.length]);

  function handleSend() {
    if (!text.trim()) return;
    onSend(text.trim(), 'text');
    setText('');
  }

  function handleStatusSend(btn: StatusButton) {
    onSend(btn.label, btn.type);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerSubtitle}>{membersList.length} beasts joining</Text>
        </View>
        <TouchableOpacity onPress={() => setShowMembers(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="people" size={20} color={COLORS.orange} />
        </TouchableOpacity>
      </View>

      {/* Attendee avatar row */}
      <View style={styles.attendeeBar}>
        <View style={styles.attendeeAvatars}>
          {membersList.slice(0, 6).map((a, i) => (
            <View key={a.id} style={[styles.attendeeAvatarWrap, { marginLeft: i === 0 ? 0 : -8 }]}>
              <Avatar
                name={a.name}
                size={28}
                tier={a.tier as any}
                backgroundColor={COLORS.dark}
              />
            </View>
          ))}
          {membersList.length > 6 && (
            <View style={[styles.attendeeMore, { marginLeft: -8 }]}>
              <Text style={styles.attendeeMoreText}>+{membersList.length - 6}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={() => setShowMembers(true)} activeOpacity={0.7}>
          <Text style={styles.attendeeSeeAll}>See all</Text>
        </TouchableOpacity>
      </View>

      {/* Quick status buttons */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusBar} contentContainerStyle={styles.statusBarContent}>
        {statusButtons.map((btn, i) => (
          <TouchableOpacity
            key={i}
            style={styles.statusBtn}
            onPress={() => handleStatusSend(btn)}
            activeOpacity={0.7}
          >
            <Text style={styles.statusBtnText}>{btn.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        showsVerticalScrollIndicator={false}
      >
        {loading && (
          <Text style={styles.loadingText}>Loading messages...</Text>
        )}
        {!loading && messages.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No messages yet. Be the first!</Text>
          </View>
        )}
        {messages.map((msg) => {
          const isMe = msg.user_id === user?.id || msg.user_id === 'me';
          const authorName = msg.author?.display_name || msg.author?.full_name || 'Beast';
          const isStatus = msg.message_type === 'status' || msg.message_type === 'ping';

          if (isStatus) {
            return (
              <View key={msg.id} style={styles.statusMessage}>
                <View style={styles.statusBubble}>
                  <Text style={styles.statusAuthor}>{isMe ? 'You' : authorName}</Text>
                  <Text style={styles.statusContent}>{msg.content}</Text>
                </View>
                <Text style={styles.statusTime}>{formatTime(msg.created_at)}</Text>
              </View>
            );
          }

          return (
            <View key={msg.id} style={[styles.messageBubbleWrap, isMe && styles.messageBubbleWrapMe]}>
              {!isMe && (
                <Avatar
                  name={msg.author?.full_name || authorName}
                  size={30}
                  tier={(msg.author?.tier || 'initiate') as any}
                  backgroundColor={COLORS.dark}
                />
              )}
              <View style={[styles.messageBubble, isMe && styles.messageBubbleMe]}>
                {!isMe && <Text style={styles.messageAuthor}>{authorName}</Text>}
                <Text style={[styles.messageText, isMe && styles.messageTextMe]}>{msg.content}</Text>
                <Text style={[styles.messageTime, isMe && styles.messageTimeMe]}>{formatTime(msg.created_at)}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={COLORS.textMuted}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={500}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
          activeOpacity={0.7}
        >
          <Ionicons name="send" size={18} color={text.trim() ? COLORS.dark : COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Members Modal */}
      <Modal visible={showMembers} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMembers(false)}
        >
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Who's Joining</Text>
            <Text style={styles.modalSubtitle}>{membersList.length} beasts</Text>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {membersList.map((member) => (
                <View key={member.id} style={styles.memberRow}>
                  <Avatar
                    name={member.name}
                    size={40}
                    tier={member.tier as any}
                    backgroundColor={COLORS.dark}
                  />
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberTier}>{member.tier.toUpperCase()}</Text>
                  </View>
                  <View style={[styles.memberStatus, { backgroundColor: 'rgba(98,183,151,0.12)' }]}>
                    <Text style={styles.memberStatusText}>Going</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowMembers(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 15, fontFamily: FONTS.heading, color: COLORS.white },
  headerSubtitle: { fontSize: 10, fontFamily: FONTS.body, color: COLORS.textTertiary, marginTop: 1 },

  // Attendee avatar row
  attendeeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  attendeeAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeeAvatarWrap: {
    borderWidth: 2,
    borderColor: COLORS.background,
    borderRadius: 16,
  },
  attendeeMore: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(232,143,36,0.2)',
    borderWidth: 2,
    borderColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attendeeMoreText: {
    fontSize: 9,
    fontFamily: FONTS.heading,
    color: COLORS.orange,
  },
  attendeeSeeAll: {
    fontSize: 11,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.orange,
  },

  statusBar: { maxHeight: 44, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  statusBarContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8, flexDirection: 'row' },
  statusBtn: {
    backgroundColor: 'rgba(232,143,36,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(232,143,36,0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusBtnText: { fontSize: 11, fontFamily: FONTS.bodyMedium, color: COLORS.orange },

  messageList: { flex: 1 },
  messageListContent: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8 },
  loadingText: { textAlign: 'center', color: COLORS.textMuted, fontFamily: FONTS.body, fontSize: 12, marginTop: 40 },
  emptyState: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { fontSize: 13, fontFamily: FONTS.body, color: COLORS.textMuted, textAlign: 'center' },

  // Status/ping messages
  statusMessage: { alignItems: 'center', marginVertical: 8 },
  statusBubble: {
    backgroundColor: 'rgba(232,143,36,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(232,143,36,0.15)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  statusAuthor: { fontSize: 9, fontFamily: FONTS.bodySemiBold, color: COLORS.orange, letterSpacing: 0.5 },
  statusContent: { fontSize: 12, fontFamily: FONTS.bodyMedium, color: COLORS.white, marginTop: 2 },
  statusTime: { fontSize: 8, fontFamily: FONTS.body, color: COLORS.textMuted, marginTop: 3 },

  // Regular messages
  messageBubbleWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 10 },
  messageBubbleWrapMe: { flexDirection: 'row-reverse' },
  messageBubble: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '75%',
  },
  messageBubbleMe: {
    backgroundColor: 'rgba(232,143,36,0.15)',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
  },
  messageAuthor: { fontSize: 10, fontFamily: FONTS.bodySemiBold, color: COLORS.aqua, marginBottom: 3 },
  messageText: { fontSize: 13, fontFamily: FONTS.body, color: COLORS.white, lineHeight: 18 },
  messageTextMe: { color: COLORS.white },
  messageTime: { fontSize: 8, fontFamily: FONTS.body, color: COLORS.textMuted, marginTop: 4, alignSelf: 'flex-end' },
  messageTimeMe: { color: 'rgba(232,143,36,0.5)' },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: FONTS.body,
    color: COLORS.white,
    maxHeight: 100,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.08)' },

  // Members Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FONTS.heading,
    color: COLORS.white,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 11,
    fontFamily: FONTS.body,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 16,
  },
  modalList: {
    flex: 1,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 14, fontFamily: FONTS.bodyMedium, color: COLORS.white },
  memberTier: { fontSize: 9, fontFamily: FONTS.body, color: COLORS.textMuted, letterSpacing: 0.5, marginTop: 1 },
  memberStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  memberStatusText: {
    fontSize: 10,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.green,
  },
  modalClose: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
  modalCloseText: {
    fontSize: 14,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.textTertiary,
  },
});
