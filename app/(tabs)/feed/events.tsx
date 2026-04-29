import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FilterTabs, BeastIcon } from '../../../src/components/ui';
import { EventCard } from '../../../src/components/feed/EventCard';
import { COLORS, FONTS } from '../../../src/lib/constants';
import { useEvents, useJoinEvent } from '../../../src/hooks';
import { useAuth } from '../../../src/providers/AuthProvider';
import { formatEventDate } from '../../../src/utils/format';
import { getLocalEvents } from '../../../src/lib/localEventStore';

const OB_LOGO = require('../../../assets/images/ob-logo-mark.png');
const WOLF_IMG = require('../../../assets/images/animals/Wolf/1.png');
const EAGLE_IMG = require('../../../assets/images/animals/Eagle/1.png');
const TIGER_IMG = require('../../../assets/images/animals/Tiger/1.png');

const TYPE_TABS = ['All', 'Runs', 'Gym classes', 'Community'];

interface MappedEvent {
  id: string;
  type: string;
  typeColor?: string;
  title: string;
  details: string;
  rsvpCount: number;
  buttonLabel: string;
  sport: string;
  coach?: string;
  gym?: string;
  country?: string;
  dateLabel?: string;
  locationLabel?: string;
  imageUrl?: string;
  isWomenOnly?: boolean;
  isPackOnly?: boolean;
  packName?: string;
  localImage?: any;
}

// Empty — real events come from Supabase. Will be populated at launch.
const DEMO_EVENTS: MappedEvent[] = [];

function getTypeFilter(index: number): string | undefined {
  switch (index) {
    case 1: return 'running';
    case 2: return 'gym';
    case 3: return 'community';
    default: return undefined;
  }
}

export default function EventsScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [rsvpBoosts, setRsvpBoosts] = useState<Record<string, number>>({});
  const { profile } = useAuth();

  // Re-read local events when screen is focused
  const [refreshKey, setRefreshKey] = useState(0);
  useFocusEffect(useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []));

  const typeFilter = getTypeFilter(activeFilter);
  const userCountry = profile?.region || 'SA';
  const { data: eventsData, loading } = useEvents(typeFilter, searchQuery.trim() || undefined, userCountry);
  const { joinEvent } = useJoinEvent();

  const handleJoin = async (eventId: string, eventTitle?: string) => {
    if (joinedIds.has(eventId) || joiningId === eventId) return;
    setJoiningId(eventId);
    try {
      if (eventId.startsWith('demo-')) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      } else {
        await joinEvent(eventId);
      }
      setJoinedIds((prev) => new Set(prev).add(eventId));
      setRsvpBoosts((prev) => ({ ...prev, [eventId]: (prev[eventId] || 0) + 1 }));
      // Navigate to event page after joining
      router.push({
        pathname: '/(tabs)/home/activity-chat',
        params: { eventId, eventTitle: eventTitle || 'Event' },
      });
    } finally {
      setJoiningId(null);
    }
  };

  const mappedEvents: MappedEvent[] = useMemo(() => {
    if (!eventsData?.length) return [];
    return eventsData.map((evt: any) => {
      const sportName = evt.sport?.name?.toLowerCase() || '';
      const rsvpCount = evt.rsvp_count?.[0]?.count || 0;
      const dateStr = formatEventDate(evt.starts_at);
      const location = evt.gym_name || evt.location || '';
      const detailParts = [dateStr, location].filter(Boolean);

      let type = evt.sport?.name || 'Event';
      if (evt.gym_name) type += ` · ${evt.gym_name}`;

      return {
        id: evt.id,
        type,
        typeColor: sportName === 'running' ? undefined :
                   sportName === 'gym' || sportName === 'hiit' ? COLORS.aqua :
                   sportName === 'yoga' ? COLORS.coral :
                   sportName === 'swimming' ? COLORS.green : undefined,
        title: evt.title,
        details: detailParts.join(' · '),
        dateLabel: dateStr,
        locationLabel: location,
        rsvpCount,
        buttonLabel: sportName === 'running' ? 'Join run' :
                     sportName === 'swimming' ? 'Join swim' :
                     evt.gym_name ? 'Book spot' : 'Join event',
        sport: sportName,
        coach: evt.coach_name,
        gym: evt.gym_name,
        imageUrl: evt.image_url,
        isWomenOnly: evt.is_women_only,
        isPackOnly: evt.visibility === 'pack',
        packName: evt.pack?.name,
      };
    });
  }, [eventsData]);

  // Merge DB events with locally created events (refreshKey triggers re-read)
  const localEvents: MappedEvent[] = useMemo(() => getLocalEvents().map((evt) => ({
    id: evt.id,
    type: evt.sport?.name || evt.event_type,
    title: evt.title,
    details: [
      formatEventDate(evt.starts_at),
      evt.location_name,
    ].filter(Boolean).join(' · '),
    dateLabel: formatEventDate(evt.starts_at),
    locationLabel: evt.location_name || '',
    rsvpCount: evt.rsvp_count?.[0]?.count || 1,
    buttonLabel: 'Enter',
    sport: evt.sport?.name?.toLowerCase() || evt.event_type,
    coach: evt.coach_name,
    country: evt.country,
    imageUrl: evt.image_url,
    isWomenOnly: evt.is_women_only,
  })), [refreshKey]);

  // Auto-mark local events as joined (creator is always going)
  const localEventIds = new Set(localEvents.map(e => e.id));
  const initialJoined = new Set([...joinedIds, ...localEventIds]);
  if (initialJoined.size > joinedIds.size) {
    // Sync local event IDs into joinedIds on first render
    localEventIds.forEach(id => joinedIds.add(id));
  }

  const filteredEvents = useMemo(() => {
    // Deduplicate: local events take priority, skip DB events with same title+date
    const localTitles = new Set(localEvents.map(e => e.title));
    const dbEvents = mappedEvents.filter(e => !localTitles.has(e.title));
    let result = [...localEvents, ...dbEvents];

    // Hide women-only events from male users
    const userGender = profile?.gender;
    if (userGender === 'male') {
      result = result.filter((e) => !e.isWomenOnly);
    }

    if (activeFilter === 1) result = result.filter((e) => e.sport === 'running');
    else if (activeFilter === 2) result = result.filter((e) => e.gym);
    else if (activeFilter === 3) result = result.filter((e) => e.type?.toLowerCase().includes('community'));

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.coach?.toLowerCase().includes(q) ||
          e.gym?.toLowerCase().includes(q) ||
          e.sport?.toLowerCase().includes(q) ||
          e.title.toLowerCase().includes(q)
      );
    }
    return result;
  }, [activeFilter, searchQuery, mappedEvents, localEvents]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* App header */}
        <View style={styles.appHeader}>
          <View style={styles.brandRow}>
            <BeastIcon size={28} color={COLORS.orange} />
            <Text style={styles.brandName}>BEAST TRIBE</Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Page title */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>TRIBE</Text>
          <Text style={styles.communityLabel}>COMMUNITY HUB</Text>
        </View>

        {/* Underline tabs: Feed / Events */}
        <View style={styles.underlineTabs}>
          <TouchableOpacity
            style={styles.underlineTab}
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/feed')}
            activeOpacity={0.7}
          >
            <Text style={styles.underlineTabText}>Feed</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.underlineTab} activeOpacity={0.7}>
            <Text style={[styles.underlineTabText, styles.underlineTabTextActive]}>Events</Text>
            <View style={styles.underlineIndicator} />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={16} color={COLORS.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by coach, gym, or sport..."
            placeholderTextColor={COLORS.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
        </View>

        <FilterTabs tabs={TYPE_TABS} activeIndex={activeFilter} onTabPress={setActiveFilter} size="small" />

        {loading ? (
          <ActivityIndicator color={COLORS.aqua} style={{ marginTop: 40 }} />
        ) : filteredEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No events nearby</Text>
            <Text style={styles.emptySubText}>Check back soon or rally your tribe.</Text>
          </View>
        ) : (
          filteredEvents.map((event) => {
            const isJoined = joinedIds.has(event.id);
            const isJoining = joiningId === event.id;
            const displayCount = event.rsvpCount + (rsvpBoosts[event.id] || 0);
            const countLine = `${displayCount} beast${displayCount !== 1 ? 's' : ''} joining`;
            const fullDetails = event.details ? `${event.details}\n${countLine}` : countLine;
            return (
              <EventCard
                key={event.id}
                type={event.type}
                typeColor={event.typeColor}
                title={event.title}
                details={fullDetails}
                buttonLabel={event.buttonLabel}
                joined={isJoined}
                joining={isJoining}
                onPress={() => handleJoin(event.id, event.title)}
                onEnter={() => router.push({
                  pathname: '/(tabs)/home/activity-chat',
                  params: { eventId: event.id, eventTitle: event.title },
                })}
                imageUrl={event.imageUrl}
                isWomenOnly={event.isWomenOnly}
                isPackOnly={event.isPackOnly}
                packName={event.packName}
                localImage={event.localImage}
              />
            );
          })
        )}

        <View style={{ height: 20 }} />
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

  /* App header */
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLogo: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  brandName: {
    fontSize: 16,
    fontFamily: FONTS.display,
    color: COLORS.orange,
    letterSpacing: 1,
  },
  notificationBtn: {
    padding: 4,
  },

  /* Title row */
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  communityLabel: {
    fontSize: 10,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.orange,
    letterSpacing: 1.5,
  },

  /* Underline tabs */
  underlineTabs: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  underlineTab: {
    paddingBottom: 10,
    position: 'relative',
  },
  underlineTabText: {
    fontSize: 15,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.textTertiary,
  },
  underlineTabTextActive: {
    color: COLORS.orange,
  },
  underlineIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: COLORS.orange,
    borderRadius: 2,
  },

  /* Search */
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: FONTS.body,
    color: COLORS.textPrimary,
  },

  /* Empty state */
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: FONTS.heading,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  emptySubText: {
    fontSize: 12,
    fontFamily: FONTS.body,
    color: COLORS.textTertiary,
  },
});
