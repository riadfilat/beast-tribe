import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMyEvents, useLeaveEvent } from '../../../src/hooks';
import { COLORS, FONTS } from '../../../src/lib/constants';
import { isEventOver } from '../../../src/lib/eventTime';

function formatWhen(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function MyEventsScreen() {
  const router = useRouter();
  const { data, loading, refetch } = useMyEvents();
  const { leaveEvent } = useLeaveEvent();

  function removeFromMyEvents(e: any) {
    Alert.alert(
      'Remove from My Events?',
      `"${e.title}" will be removed from your events. This only affects your list — it won't delete the event for anyone else.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveEvent(e.id);
              await refetch();
            } catch (err: any) {
              Alert.alert('Could not remove', err?.message || 'Please try again.');
            }
          },
        },
      ]
    );
  }

  // Flatten RSVP rows -> events, drop any missing event, sort newest-first.
  const events = (data || [])
    .map((r: any) => r.event)
    .filter(Boolean)
    .sort((a: any, b: any) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());

  // Upcoming = not yet finished (includes events happening right now).
  const upcoming = events.filter((e: any) => !isEventOver(e))
    .sort((a: any, b: any) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  const past = events.filter((e: any) => isEventOver(e));

  function openChat(e: any) {
    router.push({
      pathname: '/(tabs)/home/activity-chat',
      params: { eventId: e.id, eventTitle: e.title || 'Event' },
    });
  }

  function EventRow({ e }: { e: any }) {
    const sportLabel = e.sport?.name
      || (e.event_type ? e.event_type.charAt(0).toUpperCase() + e.event_type.slice(1) : 'Event');
    const count = e.rsvp_count?.[0]?.count ?? 0;
    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => openChat(e)}>
        {e.image_url ? (
          <Image source={{ uri: e.image_url }} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={[styles.thumb, styles.thumbFallback]}>
            <Ionicons name="calendar" size={20} color={COLORS.orange} />
          </View>
        )}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>{e.title}</Text>
          <Text style={styles.cardMeta} numberOfLines={1}>{formatWhen(e.starts_at)}</Text>
          <View style={styles.cardTagRow}>
            <Text style={styles.cardTag}>{sportLabel}</Text>
            {e.pack?.name ? (
              <View style={styles.packTag}>
                <Ionicons name="lock-closed" size={9} color={COLORS.orange} />
                <Text style={styles.packTagText}>{e.pack.name}</Text>
              </View>
            ) : null}
            <Text style={styles.cardCount}>{count} joined</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.chatBtn}
          activeOpacity={0.7}
          onPress={() => openChat(e)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chatbubbles-outline" size={18} color={COLORS.aqua} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.removeBtn}
          activeOpacity={0.7}
          onPress={() => removeFromMyEvents(e)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={17} color="#EF5350" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Events</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.orange} /></View>
      ) : events.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="calendar-outline" size={40} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No events yet</Text>
          <Text style={styles.emptySub}>Events you join will appear here, with their chats.</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => router.replace('/(tabs)/events')} activeOpacity={0.8}>
            <Text style={styles.browseBtnText}>Browse events</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
          {upcoming.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>UPCOMING</Text>
              {upcoming.map((e: any) => <EventRow key={e.id} e={e} />)}
            </>
          )}
          {past.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 18 }]}>PAST</Text>
              {past.map((e: any) => <EventRow key={e.id} e={e} />)}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  headerTitle: { fontSize: 17, fontFamily: FONTS.heading, color: COLORS.textPrimary },
  scroll: { flex: 1, paddingHorizontal: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, gap: 8 },
  emptyTitle: { fontSize: 16, fontFamily: FONTS.heading, color: COLORS.textPrimary, marginTop: 6 },
  emptySub: { fontSize: 13, fontFamily: FONTS.body, color: COLORS.textSecondary, textAlign: 'center' },
  browseBtn: { marginTop: 14, backgroundColor: COLORS.orange, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  browseBtnText: { color: '#FFF', fontFamily: FONTS.heading, fontSize: 13 },
  sectionLabel: {
    fontSize: 11, fontFamily: FONTS.bodySemiBold, color: COLORS.textTertiary,
    letterSpacing: 1.5, marginBottom: 8, marginTop: 6,
  },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    borderRadius: 14, padding: 10, marginBottom: 8,
  },
  thumb: { width: 54, height: 54, borderRadius: 10, backgroundColor: COLORS.dark },
  thumbFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(232,143,36,0.08)' },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 14, fontFamily: FONTS.bodySemiBold, color: COLORS.textPrimary },
  cardMeta: { fontSize: 11, fontFamily: FONTS.body, color: COLORS.textSecondary, marginTop: 2 },
  cardTagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
  cardTag: { fontSize: 10, fontFamily: FONTS.bodySemiBold, color: COLORS.aqua, textTransform: 'capitalize' },
  packTag: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  packTagText: { fontSize: 10, fontFamily: FONTS.bodySemiBold, color: COLORS.orange },
  cardCount: { fontSize: 10, fontFamily: FONTS.body, color: COLORS.textTertiary },
  chatBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(86,196,196,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  removeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(239,83,80,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
});
