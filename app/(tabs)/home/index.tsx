import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, BeastIcon } from '../../../src/components/ui';
import { UpcomingEventCard } from '../../../src/components/home/UpcomingEventCard';
import { WeeklyEventCalendar } from '../../../src/components/home/WeeklyEventCalendar';
import { COLORS, FONTS } from '../../../src/lib/constants';
import { getLocalEvents } from '../../../src/lib/localEventStore';
import { isEventOver } from '../../../src/lib/eventTime';
import {
  registerForPushNotificationsAsync,
  scheduleEventReminder,
  syncEventReminders,
} from '../../../src/lib/notifications';
import {
  useProfile,
  useUpcomingEvents,
  useJoinEvent,
  useMyPacks,
  useMyEvents,
} from '../../../src/hooks';

export default function HomeScreen() {
  const router = useRouter();
  // Track joined events across navigations within this mounted screen.
  // Scoped to the component (via ref) so RSVP state never leaks across
  // sign-out/sign-in. DB-backed rsvpedEventIds is the source of truth.
  const joinedEventIdsRef = useRef<Set<string>>(new Set());
  const joinedEventIds = joinedEventIdsRef.current;
  const [eventJoining, setEventJoining] = useState(false);
  // Refresh local events when screen is focused
  const [, setFocusKey] = useState(0);
  useFocusEffect(useCallback(() => { setFocusKey(k => k + 1); }, []));
  // Check if user already joined (persists across navigations)
  const [eventJoined, setEventJoined] = useState(false);
  // Set of event IDs the user has actually RSVP'd to (from DB) — refreshed on focus
  const [rsvpedEventIds, setRsvpedEventIds] = useState<Set<string>>(new Set());

  // Re-fetch user's RSVPs every time home is focused
  useFocusEffect(useCallback(() => {
    let cancelled = false;
    (async () => {
      try {
        const { supabase, isSupabaseConfigured } = await import('../../../src/lib/supabase');
        if (!isSupabaseConfigured) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('event_rsvps')
          .select('event_id')
          .eq('user_id', user.id)
          .eq('status', 'going');
        if (!cancelled && data) {
          const ids = new Set((data as any[]).map((r) => r.event_id));
          setRsvpedEventIds(ids);
          ids.forEach((id) => joinedEventIds.add(id));
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []));

  const { profile, loading: profileLoading } = useProfile();
  const { data: eventsData } = useUpcomingEvents(10);
  const { data: myPacks } = useMyPacks();
  const { data: myEvents } = useMyEvents();
  const isInPack = (myPacks?.length ?? 0) > 0;
  const { joinEvent } = useJoinEvent();

  // Re-schedule local reminders (15 min before) for all upcoming joined events.
  useFocusEffect(useCallback(() => {
    const reminders = (myEvents || [])
      .map((r: any) => r.event)
      .filter((e: any) => e && e.id && e.title && e.starts_at)
      .map((e: any) => ({ id: e.id, title: e.title, starts_at: e.starts_at }));
    if (reminders.length) syncEventReminders(reminders);
  }, [myEvents]));

  // Bell button → ask for / confirm notification permissions.
  const handleBellPress = useCallback(async () => {
    const token = await registerForPushNotificationsAsync();
    if (token) {
      Alert.alert(
        'Notifications on',
        "You'll get reminders 15 min before your events, and updates when people join."
      );
    } else {
      Alert.alert(
        'Notifications off',
        'Enable notifications in your phone Settings to get event reminders.'
      );
    }
  }, []);

  const isLoading = profileLoading;

  const displayName = profile?.display_name ?? profile?.full_name ?? 'Beast';
  const fullName = profile?.full_name ?? '';

  // Show locally created events first (newest), then DB events.
  // Hide women-only events from male users, and drop events that have already
  // finished so a passed run no longer lingers on the home screen.
  const isMale = profile?.gender === 'male';
  const localEvts = getLocalEvents().filter(e => (!isMale || !e.is_women_only) && !isEventOver(e));
  const firstLocalEvent = localEvts[0];
  const dbEvents = (eventsData || []).filter((e: any) => (!isMale || !e.is_women_only) && !isEventOver(e));
  const dbEvent = dbEvents.length > 0 ? dbEvents[0] : null;
  // Prioritize local events so user sees what they just created
  const upcomingEvent = firstLocalEvent || dbEvent || null;

  const eventType = upcomingEvent?.sport?.name || upcomingEvent?.event_type || '';
  const eventTitle = upcomingEvent?.title || '';
  const eventDetails = upcomingEvent?.starts_at
    ? [
        new Date(upcomingEvent.starts_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        new Date(upcomingEvent.starts_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        upcomingEvent.location_name || upcomingEvent.gym_name,
      ].filter(Boolean).join(' · ')
    : '';
  const eventDate = upcomingEvent?.starts_at
    ? new Date(upcomingEvent.starts_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }).toUpperCase() +
      ' · ' + new Date(upcomingEvent.starts_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '';
  const eventLocation = upcomingEvent?.location_name || upcomingEvent?.gym_name || '';

  // Build weekly calendar data
  const weekDays = (() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - ((dayOfWeek + 6) % 7)); // Monday start
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dbEvts = eventsData || [];
    const locals = getLocalEvents();
    const allEvents = [...dbEvts, ...locals];

    // If the user joined the home event, show it on today
    const joinedEvent = eventJoined ? {
      id: upcomingEvent?.id || 'demo-joined',
      title: eventTitle.replace('\n', ' '),
      sport: eventType,
      time: eventDate?.split('·')[1]?.trim() || '6:00 AM',
    } : null;

    return dayLabels.map((label, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const isToday = dateStr === today.toISOString().split('T')[0];

      // Real events from DB for this day
      const dayEvents = allEvents
        .filter((evt: any) => {
          const evtDate = new Date(evt.starts_at).toISOString().split('T')[0];
          return evtDate === dateStr;
        })
        .map((evt: any) => ({
          id: evt.id,
          title: evt.title,
          sport: evt.sport?.name
            || (evt.event_type ? evt.event_type.charAt(0).toUpperCase() + evt.event_type.slice(1) : 'Event'),
          time: new Date(evt.starts_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        }));

      const events = [...dayEvents];

      // Add joined event on today
      if (isToday && joinedEvent && !events.find(e => e.id === joinedEvent.id)) {
        events.push(joinedEvent);
      }

      return {
        dayLabel: label,
        dateNum: date.getDate(),
        isToday,
        events,
      };
    });
  })();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.orange} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* App Header */}
        <View style={styles.appHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.brandRow}>
              <BeastIcon size={24} color={COLORS.orange} />
              <Text style={styles.appTitle}>BEAST TRIBE</Text>
            </View>
            <Avatar name={fullName} size={38} backgroundColor={COLORS.dark} />
          </View>
          <TouchableOpacity style={styles.bellBtn} activeOpacity={0.7} onPress={handleBellPress}>
            <Ionicons name="notifications" size={20} color={COLORS.orange} />
          </TouchableOpacity>
        </View>

        {/* Welcome */}
        <Text style={styles.welcomeLine1}>Welcome back,</Text>
        <Text style={styles.welcomeLine2}>{displayName}</Text>

        {/* Weekly Event Calendar */}
        <WeeklyEventCalendar
          days={weekDays}
          onEventPress={(eventId) => {
            router.push({
              pathname: '/(tabs)/home/activity-chat',
              params: { eventId, eventTitle: weekDays.flatMap(d => d.events).find(e => e.id === eventId)?.title || 'Event' },
            });
          }}
        />

        {/* Nutrition Tracker */}
        <TouchableOpacity
          style={styles.trackerRow}
          onPress={() => router.push('/(tabs)/home/nutrition')}
          activeOpacity={0.7}
        >
          <Ionicons name="nutrition-outline" size={22} color={COLORS.green} />
          <Text style={styles.trackerTitle}>NUTRITION TRACKER</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
        </TouchableOpacity>

        {/* Pack section */}
        {isInPack ? (
          <TouchableOpacity
            style={styles.packCta}
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/profile/pack')}
          >
            <View style={styles.packCtaIconWrap}>
              <Ionicons name="people" size={24} color={COLORS.aqua} />
            </View>
            <Text style={styles.packCtaTitle}>YOUR PACK</Text>
            <Text style={styles.packCtaSub}>Stay connected with your tribe.</Text>
            <Text style={styles.packCtaLink}>VIEW PACK</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.packCta}>
            <View style={styles.packCtaIconWrap}>
              <Ionicons name="people-outline" size={24} color={COLORS.textTertiary} />
            </View>
            <Text style={styles.packCtaTitle}>JOIN A PACK</Text>
            <Text style={styles.packCtaSub}>Train better with a tribe. Shared goals, shared glory.</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile/pack')} activeOpacity={0.7}>
              <Text style={styles.packCtaLink}>BROWSE PACKS</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Upcoming Event — only show if real event exists */}
        {(upcomingEvent || eventTitle) ? <UpcomingEventCard
          type={eventType}
          title={eventTitle}
          details={eventDetails}
          date={eventDate}
          location={eventLocation}
          joined={eventJoined || upcomingEvent?.joined === true || !!(upcomingEvent?.id && rsvpedEventIds.has(upcomingEvent.id))}
          joining={eventJoining}
          imageUrl={upcomingEvent?.image_url || undefined}
          onJoin={async () => {
            if (eventJoined || eventJoining) return;
            const eid = upcomingEvent?.id || 'demo-event';
            setEventJoining(true);
            try {
              if (upcomingEvent?.id) {
                await joinEvent(upcomingEvent.id);
                if (upcomingEvent.starts_at) {
                  scheduleEventReminder({
                    id: upcomingEvent.id,
                    title: upcomingEvent.title,
                    starts_at: upcomingEvent.starts_at,
                  });
                }
              } else {
                await new Promise(r => setTimeout(r, 500));
              }
              setEventJoined(true);
              joinedEventIds.add(eid);
              router.push({
                pathname: '/(tabs)/home/activity-chat',
                params: { eventId: eid, eventTitle: eventTitle.replace('\n', ' ') },
              });
            } finally {
              setEventJoining(false);
            }
          }}
          onPress={() => router.push({
            pathname: '/(tabs)/home/activity-chat',
            params: {
              eventId: upcomingEvent?.id || 'demo-event',
              eventTitle: eventTitle,
            },
          })}
        /> : null}

        {/* Create Activity CTA */}
        <TouchableOpacity
          style={styles.createActivityCard}
          activeOpacity={0.7}
          onPress={() => router.push('/(tabs)/home/create-activity')}
        >
          <View style={styles.createActivityIcon}>
            <Ionicons name="add" size={22} color={COLORS.orange} />
          </View>
          <View style={styles.createActivityText}>
            <Text style={styles.createActivityTitle}>Organize a Tribe Activity</Text>
            <Text style={styles.createActivitySub}>Rally the tribe for a workout, run, or find a coach</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* App Header */
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appTitle: {
    fontSize: 15,
    fontFamily: FONTS.heading,
    color: COLORS.orange,
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(232,143,36,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Welcome */
  welcomeLine1: {
    fontSize: 26,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
    fontStyle: 'italic',
  },
  welcomeLine2: {
    fontSize: 26,
    fontFamily: FONTS.heading,
    color: COLORS.orange,
    fontStyle: 'italic',
    marginBottom: 16,
  },

  /* Tracker rows */
  trackerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  trackerTitle: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },

  /* Pack CTA */
  packCta: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  packCtaIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  packCtaTitle: {
    fontSize: 14,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  packCtaSub: {
    fontSize: 11,
    fontFamily: FONTS.body,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 10,
    maxWidth: 240,
  },
  packCtaLink: {
    fontSize: 12,
    fontFamily: FONTS.heading,
    color: COLORS.aqua,
    letterSpacing: 0.5,
  },

  /* Create Activity CTA */
  createActivityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    gap: 12,
  },
  createActivityIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(232,143,36,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createActivityText: {
    flex: 1,
  },
  createActivityTitle: {
    fontSize: 13,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
  },
  createActivitySub: {
    fontSize: 10,
    fontFamily: FONTS.body,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
});
