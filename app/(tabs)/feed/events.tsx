import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FilterTabs } from '../../../src/components/ui';
import { EventCard } from '../../../src/components/feed/EventCard';
import { COLORS, FONTS } from '../../../src/lib/constants';
import { useEvents, useJoinEvent } from '../../../src/hooks';
import { useAuth } from '../../../src/providers/AuthProvider';
import { formatEventDate } from '../../../src/utils/format';

const TYPE_TABS = ['All', 'Runs', 'Gym classes', 'Community'];

interface MappedEvent {
  id: string;
  type: string;
  typeColor?: string;
  title: string;
  details: string;
  buttonLabel: string;
  sport: string;
  coach?: string;
  gym?: string;
  country?: string;
}

const DEMO_EVENTS: MappedEvent[] = [
  {
    id: 'demo-1',
    type: 'Community run',
    title: 'Riyadh 5K Beast Run',
    details: 'Sat, Jun 14 · 6:30 AM · King Fahd Park\n42 beasts joining',
    buttonLabel: 'Join run',
    sport: 'running',
    coach: 'Coach Ali',
    country: 'SA',
  },
  {
    id: 'demo-2',
    type: 'Gym class · Leejam Fitness',
    typeColor: COLORS.aqua,
    title: 'HIIT Beast Mode',
    details: 'Mon, Jun 16 · 7:00 PM · Olaya branch\n12 spots left',
    buttonLabel: 'Book spot',
    sport: 'gym',
    gym: 'Leejam Fitness',
    coach: 'Coach Faisal',
    country: 'SA',
  },
  {
    id: 'demo-3',
    type: 'Yoga session · Flow Studio',
    typeColor: COLORS.coral,
    title: 'Sunrise yoga — women only',
    details: 'Tue, Jun 17 · 6:00 AM · Al Nakheel, Riyadh\n8 spots left',
    buttonLabel: 'Book spot',
    sport: 'yoga',
    gym: 'Flow Studio',
    coach: 'Coach Lina',
    country: 'SA',
  },
  {
    id: 'demo-4',
    type: 'Swimming · Aspire Swim',
    typeColor: COLORS.green,
    title: 'Open water swim 2K',
    details: 'Fri, Jun 20 · 5:30 AM · Jeddah Corniche\n28 beasts joining',
    buttonLabel: 'Join swim',
    sport: 'swimming',
    gym: 'Aspire Swim',
    country: 'SA',
  },
  {
    id: 'demo-5',
    type: 'Community',
    title: 'Dubai Beast Meetup',
    details: 'Sat, Jun 21 · 8:00 AM · Kite Beach\nCrossFit + Run + Chill',
    buttonLabel: 'Join event',
    sport: 'crossfit',
    country: 'AE',
  },
];

// Map TYPE_TABS filter index to a type string for the hook
function getTypeFilter(index: number): string | undefined {
  switch (index) {
    case 1: return 'running';
    case 2: return 'gym';
    case 3: return 'community';
    default: return undefined;
  }
}

export default function EventsScreen() {
  const [activeFilter, setActiveFilter] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const { profile } = useAuth();

  const typeFilter = getTypeFilter(activeFilter);
  const userCountry = profile?.region || 'SA';
  const { data: eventsData, loading } = useEvents(typeFilter, searchQuery.trim() || undefined, userCountry);
  const { joinEvent, loading: joining } = useJoinEvent();

  // Map Supabase events to component format
  const mappedEvents: MappedEvent[] = useMemo(() => {
    if (!eventsData?.length) return [];
    return eventsData.map((evt: any) => {
      const sportName = evt.sport?.name?.toLowerCase() || '';
      const rsvpCount = evt.rsvp_count?.[0]?.count || 0;
      const dateStr = formatEventDate(evt.starts_at);
      const location = evt.gym_name || evt.location || '';
      const detailParts = [dateStr, location, `${rsvpCount} beasts joining`].filter(Boolean);

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
        details: detailParts.join('\n'),
        buttonLabel: sportName === 'running' ? 'Join run' :
                     sportName === 'swimming' ? 'Join swim' :
                     evt.gym_name ? 'Book spot' : 'Join event',
        sport: sportName,
        coach: evt.coach_name,
        gym: evt.gym_name,
      };
    });
  }, [eventsData]);

  // Use real data or fall back to demo, then apply local filters for demo mode
  const events = mappedEvents.length ? mappedEvents : DEMO_EVENTS;

  const filteredEvents = useMemo(() => {
    // If using real data, server already filtered by type and search
    if (mappedEvents.length) return mappedEvents;

    // For demo data, apply local filters
    let result = DEMO_EVENTS.filter((e) => e.country === userCountry);
    if (activeFilter === 1) result = result.filter((e) => e.sport === 'running');
    else if (activeFilter === 2) result = result.filter((e) => e.gym);
    else if (activeFilter === 3) result = result.filter((e) => e.type.toLowerCase().includes('community'));

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.coach?.toLowerCase().includes(q) ||
          e.gym?.toLowerCase().includes(q) ||
          e.sport.toLowerCase().includes(q) ||
          e.title.toLowerCase().includes(q)
      );
    }
    return result;
  }, [activeFilter, searchQuery, mappedEvents]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Events</Text>

        {/* Search bar */}
        <TextInput
          style={styles.searchInput}
          placeholder="Search by coach, gym, or sport..."
          placeholderTextColor={COLORS.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />

        <FilterTabs tabs={TYPE_TABS} activeIndex={activeFilter} onTabPress={setActiveFilter} size="small" />

        {loading ? (
          <ActivityIndicator color={COLORS.aqua} style={{ marginTop: 40 }} />
        ) : filteredEvents.length === 0 ? (
          <Text style={styles.emptyText}>No events nearby. Check back soon or rally your tribe.</Text>
        ) : (
          filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              type={event.type}
              typeColor={event.typeColor}
              title={event.title}
              details={event.details}
              buttonLabel={event.buttonLabel}
              onPress={() => {
                if (!event.id.startsWith('demo-')) {
                  joinEvent(event.id);
                }
              }}
            />
          ))
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
  title: {
    fontSize: 22,
    fontFamily: FONTS.heading,
    color: COLORS.white,
    marginTop: 8,
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 13,
    fontFamily: FONTS.body,
    color: COLORS.white,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: FONTS.body,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: 40,
  },
});
