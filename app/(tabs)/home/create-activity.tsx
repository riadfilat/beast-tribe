import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Platform, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Button, SportChip } from '../../../src/components/ui';
import { useCreateEvent, useCoachAvailability, useBookCoach, useMyPacks } from '../../../src/hooks';
import { useAuth } from '../../../src/providers/AuthProvider';
import { supabase, isSupabaseConfigured } from '../../../src/lib/supabase';
import { COLORS, FONTS, SPORTS } from '../../../src/lib/constants';

interface PopularLocation {
  id: string;
  name: string;
  city: string;
  country: string;
  sports: string[];
  description: string;
  imageUrl: string;
  image_url?: string;
}

// Fallback locations — used when DB is not available
const FALLBACK_LOCATIONS: PopularLocation[] = [
  {
    id: 'wadi-hanifah',
    name: 'Wadi Hanifah Path',
    city: 'Riyadh', country: 'SA',
    sports: ['running', 'cycling', 'walking'],
    description: '8km scenic trail along the valley — perfect for runs and cycling',
    imageUrl: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=600&h=300&fit=crop',
  },
  {
    id: 'king-fahd-park',
    name: 'King Fahd Park',
    city: 'Riyadh', country: 'SA',
    sports: ['running', 'walking', 'yoga', 'football'],
    description: 'Open green spaces with running tracks and outdoor workout areas',
    imageUrl: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&h=300&fit=crop',
  },
  {
    id: 'corniche-jeddah',
    name: 'Jeddah Corniche',
    city: 'Jeddah', country: 'SA',
    sports: ['running', 'cycling', 'walking'],
    description: '30km waterfront promenade — sunrise runs with sea views',
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=300&fit=crop',
  },
  {
    id: 'boulevard-riyadh',
    name: 'Riyadh Boulevard',
    city: 'Riyadh', country: 'SA',
    sports: ['running', 'walking'],
    description: 'Modern urban district with wide paths for evening runs',
    imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=300&fit=crop',
  },
  {
    id: 'leejam-olaya',
    name: 'Leejam Fitness — Olaya',
    city: 'Riyadh', country: 'SA',
    sports: ['gym', 'crossfit', 'swimming'],
    description: 'Full-equipped gym with pool, group classes, and CrossFit zone',
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=300&fit=crop',
  },
  {
    id: 'fitness-time',
    name: 'Fitness Time — King Fahd',
    city: 'Riyadh', country: 'SA',
    sports: ['gym', 'crossfit', 'hyrox'],
    description: 'Premium gym with Hyrox training area and personal coaches',
    imageUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&h=300&fit=crop',
  },
  {
    id: 'edge-jeddah',
    name: 'The Edge Fitness',
    city: 'Jeddah', country: 'SA',
    sports: ['gym', 'crossfit', 'yoga'],
    description: 'Community-focused gym with group sessions and yoga studio',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=300&fit=crop',
  },
  {
    id: 'padel-riyadh',
    name: 'Padel Saudi — Olaya',
    city: 'Riyadh', country: 'SA',
    sports: ['padel', 'tennis'],
    description: 'Indoor and outdoor padel courts with coaching available',
    imageUrl: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&h=300&fit=crop',
  },
  // UAE
  {
    id: 'kite-beach-dubai',
    name: 'Kite Beach',
    city: 'Dubai', country: 'AE',
    sports: ['running', 'swimming', 'yoga', 'volleyball'],
    description: 'Beach workouts, swimming, and yoga with skyline views',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=300&fit=crop',
  },
  {
    id: 'dubai-marina',
    name: 'Dubai Marina Walk',
    city: 'Dubai', country: 'AE',
    sports: ['running', 'cycling', 'walking'],
    description: '7km waterfront loop with stunning marina and skyline views',
    imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&h=300&fit=crop',
  },
  {
    id: 'yas-island',
    name: 'Yas Marina Circuit',
    city: 'Abu Dhabi', country: 'AE',
    sports: ['running', 'cycling'],
    description: 'Run or cycle the F1 track — iconic open-track sessions',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=300&fit=crop',
  },
];

export default function CreateActivityScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { createEvent, loading } = useCreateEvent();
  const { bookCoach } = useBookCoach();

  const [coaches, setCoaches] = useState<{ id: string; name: string; sports?: string[] }[]>([]);
  const [popularLocations, setPopularLocations] = useState<PopularLocation[]>(FALLBACK_LOCATIONS);

  // Fetch coaches and popular locations from database
  React.useEffect(() => {
    if (!isSupabaseConfigured) return;
    // Fetch coaches
    (async () => {
      const { data } = await supabase.from('partners').select('*').eq('partner_type', 'coach');
      if (data) setCoaches(data.map((c: any) => ({ id: c.id, name: c.name || c.business_name || 'Coach', sports: c.sports })));
    })();
    // Fetch popular locations filtered by user's country
    (async () => {
      const userCountry = profile?.region || 'SA';
      const { data } = await supabase.from('popular_locations')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (data && data.length > 0) {
        setPopularLocations(
          data
            .sort((a: any, b: any) => {
              // User's country first
              if (a.country === userCountry && b.country !== userCountry) return -1;
              if (b.country === userCountry && a.country !== userCountry) return 1;
              return 0;
            })
            .map((loc: any) => ({
              id: loc.id,
              name: loc.name,
              city: loc.city,
              country: loc.country,
              sports: loc.sports || [],
              description: loc.description || '',
              imageUrl: loc.image_url || '',
            }))
        );
      }
    })();
  }, [profile?.region]);

  const [title, setTitle] = useState('');
  const [sport, setSport] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [coachName, setCoachName] = useState('');
  const [selectedCoachId, setSelectedCoachId] = useState('');
  const [showCoach, setShowCoach] = useState(false);
  const [isWomenOnly, setIsWomenOnly] = useState(false);
  const [isPackOnly, setIsPackOnly] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState<string>('');
  const { data: myPacksData } = useMyPacks();
  const myPacks = (myPacksData || []).map((m: any) => m.pack).filter(Boolean);

  // Fetch coach availability when coach + date selected
  const { slots: coachSlots, loading: slotsLoading } = useCoachAvailability(
    selectedCoachId || undefined,
    date || undefined
  );
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [showLocations, setShowLocations] = useState(false);

  function selectLocation(loc: PopularLocation) {
    setLocation(loc.name);
    setCity(loc.city);
    if (!imageUri) setImageUri(loc.imageUrl);
    setShowLocations(false);
    // Auto-select matching sport if none selected
    if (!sport) {
      const match = SPORTS.find(s => loc.sports.includes(s.id));
      if (match) setSport(match.id);
    }
  }

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library to add an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }

  const canSubmit = title.trim().length > 0 && sport.length > 0 && date.trim().length > 0 && time.trim().length > 0;

  const [error, setError] = useState('');

  async function handleCreate() {
    if (loading) return; // Prevent double-submission
    setError('');
    if (!canSubmit) {
      setError('Please fill in all required fields: name, sport, date, and time');
      return;
    }

    // Normalize time
    let normalizedTime = time.trim();
    if (/^\d{1,2}:\d{2}$/.test(normalizedTime)) {
      const [h, m] = normalizedTime.split(':');
      normalizedTime = `${h.padStart(2, '0')}:${m}`;
    } else if (/^\d{3,4}$/.test(normalizedTime)) {
      const padded = normalizedTime.padStart(4, '0');
      normalizedTime = `${padded.slice(0, 2)}:${padded.slice(2)}`;
    }

    // Build date — try multiple formats
    let startsAt: string;
    const dateStr = `${date.trim()}T${normalizedTime}:00`;
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) {
      // Fallback: use tomorrow if date is invalid
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const [h = '06', m = '00'] = normalizedTime.split(':');
      tomorrow.setHours(parseInt(h) || 6, parseInt(m) || 0, 0, 0);
      startsAt = tomorrow.toISOString();
    } else {
      startsAt = parsed.toISOString();
    }

    // Warn if event is in the past (more than 1 hour ago)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    if (new Date(startsAt).getTime() < oneHourAgo) {
      const localTime = new Date(startsAt).toLocaleString();
      setError(`This activity is set to start in the past (${localTime}). Please pick a future date and time.`);
      return;
    }

    // Validate pack-only events
    if (isPackOnly && !selectedPackId) {
      setError('Please select which pack this activity is for.');
      return;
    }

    try {
      const result = await createEvent({
        title: title.trim(),
        event_type: sport,
        starts_at: startsAt,
        location_name: location.trim() || undefined,
        location_city: city.trim() || undefined,
        coach_name: showCoach && coachName.trim() ? coachName.trim() : undefined,
        description: description.trim() || undefined,
        difficulty: difficulty || undefined,
        is_women_only: isWomenOnly || undefined,
        country: profile?.region || 'SA',
        image_url: imageUri || undefined,
        pack_id: isPackOnly ? selectedPackId : undefined,
        visibility: isPackOnly ? 'pack' : 'public',
      });
      if (result) {
        // Book the coach if one was selected
        if (selectedCoachId && date && time) {
          const endH = String(parseInt(time.split(':')[0]) + 1).padStart(2, '0');
          const endTime = `${endH}:${time.split(':')[1] || '00'}`;
          await bookCoach(selectedCoachId, date, time, endTime, result.id);

          // Add coach to event chat — get their user_id from partners table
          if (isSupabaseConfigured) {
            try {
              const { data: partner } = await supabase.from('partners').select('user_id').eq('id', selectedCoachId).single();
              if (partner?.user_id && result.id) {
                // RSVP the coach so they can access the event chat
                await supabase.from('event_rsvps').upsert({
                  event_id: result.id,
                  user_id: partner.user_id,
                  status: 'going',
                });
              }
            } catch {}
          }
        }
        Alert.alert('Activity created!', `"${title.trim()}" is live. Your tribe can join now.`, [
          { text: 'OK', onPress: () => router.replace('/(tabs)/home') },
        ]);
      }
    } catch (e: any) {
      const detail = e?.message || e?.details || e?.hint || 'Please try again.';
      setError(`Could not create activity: ${detail}`);
      Alert.alert('Could not create activity', detail);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/home')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Activity</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Organize a Tribe Activity</Text>
        <Text style={styles.pageSubtitle}>Rally the community for a workout, run, or session</Text>

        {/* Title */}
        <Text style={styles.label}>ACTIVITY NAME</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Friday Night Run, HIIT Session"
          placeholderTextColor={COLORS.textMuted}
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />

        {/* Sport */}
        <Text style={styles.label}>ACTIVITY TYPE</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sportScroll}>
          <View style={styles.sportRow}>
            {SPORTS.map((s) => (
              <SportChip
                key={s.id}
                icon={s.icon}
                emoji={s.emoji}
                name={s.name}
                selected={sport === s.id}
                onPress={() => setSport(s.id)}
              />
            ))}
          </View>
        </ScrollView>

        {/* Difficulty */}
        <Text style={styles.label}>DIFFICULTY LEVEL</Text>
        <View style={styles.difficultyRow}>
          {([
            { id: 'easy', label: 'Easy', icon: 'leaf-outline', color: COLORS.green },
            { id: 'medium', label: 'Medium', icon: 'flame-outline', color: COLORS.orange },
            { id: 'hard', label: 'Hard', icon: 'flash-outline', color: '#EF5350' },
          ] as const).map((d) => (
            <TouchableOpacity
              key={d.id}
              style={[
                styles.difficultyChip,
                difficulty === d.id && { borderColor: d.color, backgroundColor: `${d.color}12` },
              ]}
              onPress={() => setDifficulty(d.id)}
              activeOpacity={0.7}
            >
              <Ionicons name={d.icon} size={18} color={difficulty === d.id ? d.color : COLORS.textTertiary} />
              <Text style={[styles.difficultyText, difficulty === d.id && { color: d.color }]}>{d.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date — next 14 days as scrollable chips */}
        <Text style={styles.label}>DATE</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
          <View style={styles.dateRow}>
            {Array.from({ length: 14 }, (_, i) => {
              const d = new Date();
              d.setDate(d.getDate() + i);
              const dateVal = d.toISOString().split('T')[0];
              const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
              const dateNum = d.getDate();
              const monthName = d.toLocaleDateString('en-US', { month: 'short' });
              const isSelected = date === dateVal;
              return (
                <TouchableOpacity
                  key={dateVal}
                  style={[styles.dateChip, isSelected && styles.dateChipActive]}
                  onPress={() => setDate(dateVal)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dateChipDay, isSelected && styles.dateChipDayActive]}>{dayName}</Text>
                  <Text style={[styles.dateChipNum, isSelected && styles.dateChipNumActive]}>{dateNum}</Text>
                  <Text style={[styles.dateChipMonth, isSelected && styles.dateChipMonthActive]}>{monthName}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Time — common time slots */}
        <Text style={styles.label}>TIME</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
          <View style={styles.timeRow}>
            {['05:00', '05:30', '06:00', '06:30', '07:00', '07:30', '08:00', '09:00', '10:00',
              '12:00', '14:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'].map((t) => {
              const isSelected = time === t;
              const [h, m] = t.split(':');
              const hour = parseInt(h);
              const ampm = hour >= 12 ? 'PM' : 'AM';
              const display = `${hour > 12 ? hour - 12 : hour}:${m} ${ampm}`;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.timeChip, isSelected && styles.timeChipActive]}
                  onPress={() => setTime(t)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.timeChipText, isSelected && styles.timeChipTextActive]}>{display}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Location */}
        <Text style={styles.label}>LOCATION</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. King Fahd Park, Leejam Fitness"
          placeholderTextColor={COLORS.textMuted}
          value={location}
          onChangeText={setLocation}
          maxLength={200}
        />

        {/* Popular locations dropdown */}
        <TouchableOpacity
          style={styles.popularToggle}
          onPress={() => setShowLocations(!showLocations)}
          activeOpacity={0.7}
        >
          <Ionicons name="location" size={16} color={COLORS.orange} />
          <Text style={styles.popularToggleText}>Browse popular spots</Text>
          <Ionicons name={showLocations ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.textTertiary} />
        </TouchableOpacity>

        {showLocations && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.locationsScroll}
            contentContainerStyle={styles.locationsContent}
          >
            {popularLocations
              .filter(loc => !sport || loc.sports.includes(sport))
              .map((loc) => (
                <TouchableOpacity
                  key={loc.id}
                  style={styles.locationCard}
                  onPress={() => selectLocation(loc)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: loc.imageUrl }}
                    style={styles.locationImage}
                    resizeMode="cover"
                  />
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationName} numberOfLines={1}>{loc.name}</Text>
                    <Text style={styles.locationCity}>{loc.city}</Text>
                    <Text style={styles.locationDesc} numberOfLines={2}>{loc.description}</Text>
                    <View style={styles.locationSports}>
                      {loc.sports.slice(0, 3).map(s => (
                        <View key={s} style={styles.locationSportChip}>
                          <Text style={styles.locationSportText}>{s}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
          </ScrollView>
        )}

        <Text style={styles.label}>CITY</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Riyadh, Jeddah, Dubai"
          placeholderTextColor={COLORS.textMuted}
          value={city}
          onChangeText={setCity}
        />

        {/* Coach toggle */}
        <TouchableOpacity
          style={styles.coachToggle}
          onPress={() => setShowCoach(!showCoach)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={showCoach ? 'checkbox' : 'square-outline'}
            size={20}
            color={showCoach ? COLORS.orange : COLORS.textMuted}
          />
          <Text style={styles.coachToggleText}>Looking for a coach?</Text>
        </TouchableOpacity>

        {showCoach && (
          <>
            <Text style={styles.label}>SELECT A COACH</Text>
            {(() => {
              const filteredCoaches = coaches.filter(c => !sport || !c.sports?.length || c.sports.includes(sport));
              if (coaches.length === 0) {
                return (
                  <View style={styles.coachEmptyState}>
                    <Ionicons name="person-add-outline" size={24} color={COLORS.textMuted} />
                    <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 6, textAlign: 'center' }}>
                      No coaches available yet.{'\n'}Coaches are added by the admin.
                    </Text>
                  </View>
                );
              }
              if (filteredCoaches.length === 0) {
                return (
                  <View style={styles.coachEmptyState}>
                    <Text style={{ color: COLORS.textMuted, fontSize: 12, textAlign: 'center' }}>
                      No coaches available for this sport.{'\n'}Try selecting a different sport or check back later.
                    </Text>
                  </View>
                );
              }
              return (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.coachScroll}>
                  <View style={styles.coachRow}>
                    {filteredCoaches.map(c => {
                      const isSelected = selectedCoachId === c.id;
                      return (
                        <TouchableOpacity
                          key={c.id}
                          style={[styles.coachChip, isSelected && styles.coachChipActive]}
                          onPress={() => {
                            if (isSelected) { setSelectedCoachId(''); setCoachName(''); }
                            else { setSelectedCoachId(c.id); setCoachName(c.name); }
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={styles.coachAvatar}>
                            <Ionicons name="person" size={16} color={isSelected ? COLORS.orange : COLORS.textTertiary} />
                          </View>
                          <View>
                            <Text style={[styles.coachChipText, isSelected && styles.coachChipTextActive]}>{c.name}</Text>
                            {(c.sports?.length ?? 0) > 0 && (
                              <Text style={{ fontSize: 8, color: COLORS.textMuted, marginTop: 1 }}>
                                {c.sports?.slice(0, 3).join(' · ')}
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              );
            })()}

            {/* Coach availability — show when coach + date selected */}
            {selectedCoachId && date ? (
              <>
                <Text style={styles.label}>AVAILABLE SLOTS</Text>
                {slotsLoading ? (
                  <Text style={{ color: COLORS.textMuted, fontSize: 12, marginBottom: 8 }}>Loading availability...</Text>
                ) : coachSlots.length === 0 ? (
                  <Text style={{ color: COLORS.textMuted, fontSize: 12, marginBottom: 8 }}>No slots available for this date</Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.timeRow}>
                      {coachSlots.map((slot) => {
                        const isSelected = time === slot.start_time;
                        const h = parseInt(slot.start_time);
                        const ampm = h >= 12 ? 'PM' : 'AM';
                        const display = `${h > 12 ? h - 12 : h}:${slot.start_time.split(':')[1]} ${ampm}`;
                        return (
                          <TouchableOpacity
                            key={slot.start_time}
                            style={[
                              styles.timeChip,
                              isSelected && styles.timeChipActive,
                              slot.booked && styles.timeChipBooked,
                            ]}
                            onPress={() => !slot.booked && setTime(slot.start_time)}
                            disabled={slot.booked}
                            activeOpacity={0.7}
                          >
                            <Text style={[
                              styles.timeChipText,
                              isSelected && styles.timeChipTextActive,
                              slot.booked && styles.timeChipTextBooked,
                            ]}>
                              {slot.booked ? '🔒 ' : ''}{display}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                )}
              </>
            ) : selectedCoachId && !date ? (
              <Text style={{ color: COLORS.orange, fontSize: 11, marginTop: 8, marginBottom: 4 }}>Select a date above to see available slots</Text>
            ) : null}
          </>
        )}

        {/* Women Only toggle — only shown to female users */}
        {profile?.gender === 'female' && (
        <TouchableOpacity
          style={[styles.coachToggle, isWomenOnly && { backgroundColor: 'rgba(239,140,180,0.08)', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(239,140,180,0.25)' }]}
          onPress={() => setIsWomenOnly(!isWomenOnly)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isWomenOnly ? 'checkbox' : 'square-outline'}
            size={20}
            color={isWomenOnly ? '#E8729A' : COLORS.textMuted}
          />
          <Text style={[styles.coachToggleText, isWomenOnly && { color: '#E8729A' }]}>Women only event</Text>
        </TouchableOpacity>
        )}

        {/* Pack Exclusive toggle — only shown if user belongs to at least 1 pack */}
        {myPacks.length > 0 && (
        <>
          <TouchableOpacity
            style={[styles.coachToggle, isPackOnly && { backgroundColor: 'rgba(232,143,36,0.08)', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(232,143,36,0.3)' }]}
            onPress={() => {
              const next = !isPackOnly;
              setIsPackOnly(next);
              if (next && myPacks.length === 1) setSelectedPackId(myPacks[0].id);
              if (!next) setSelectedPackId('');
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isPackOnly ? 'checkbox' : 'square-outline'}
              size={20}
              color={isPackOnly ? COLORS.orange : COLORS.textMuted}
            />
            <Text style={[styles.coachToggleText, isPackOnly && { color: COLORS.orange }]}>Pack exclusive — only members can see & join</Text>
          </TouchableOpacity>

          {/* Pack picker — shown when toggle is on AND user has multiple packs */}
          {isPackOnly && myPacks.length > 1 && (
            <View style={{ marginTop: 8, marginBottom: 12 }}>
              <Text style={[styles.label, { marginTop: 4 }]}>SELECT PACK</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 2 }}>
                  {myPacks.map((p: any) => {
                    const selected = selectedPackId === p.id;
                    return (
                      <TouchableOpacity
                        key={p.id}
                        onPress={() => setSelectedPackId(p.id)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 18,
                          borderWidth: 1,
                          borderColor: selected ? COLORS.orange : 'rgba(255,255,255,0.15)',
                          backgroundColor: selected ? 'rgba(232,143,36,0.18)' : 'transparent',
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={{ color: selected ? COLORS.orange : COLORS.textMuted, fontFamily: FONTS.body, fontSize: 13, fontWeight: selected ? '600' : '400' }}>{p.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          )}
          {isPackOnly && myPacks.length === 1 && selectedPackId && (
            <Text style={{ color: COLORS.orange, fontSize: 11, marginTop: 4, marginBottom: 8, marginLeft: 4 }}>
              Will be visible only to {myPacks[0].name} members
            </Text>
          )}
        </>
        )}

        <Text style={styles.label}>DESCRIPTION (OPTIONAL)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Tell the tribe what to expect..."
          placeholderTextColor={COLORS.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {/* Cover Image */}
        <Text style={styles.label}>COVER IMAGE (OPTIONAL)</Text>
        {imageUri ? (
          <View style={styles.imagePreviewWrap}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
            <TouchableOpacity style={styles.imageRemoveBtn} onPress={() => setImageUri(null)} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.7}>
            <View style={styles.imagePickerIcon}>
              <Ionicons name="camera-outline" size={28} color={COLORS.orange} />
            </View>
            <Text style={styles.imagePickerTitle}>Add a cover image</Text>
            <Text style={styles.imagePickerSub}>Help the tribe know what to expect</Text>
          </TouchableOpacity>
        )}

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        <View style={{ height: 12 }} />
        <Button
          title={loading ? 'Creating...' : 'Create Activity'}
          onPress={handleCreate}
          disabled={loading || !canSubmit}
        />
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
  },
  scroll: { flex: 1, paddingHorizontal: 20 },
  pageTitle: {
    fontSize: 22,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  label: {
    fontSize: 9,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: FONTS.body,
    color: COLORS.textPrimary,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  sportScroll: {
    marginBottom: 4,
  },
  sportRow: {
    flexDirection: 'row',
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  coachToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    fontFamily: FONTS.bodyMedium,
    color: '#EF5350',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  coachEmptyState: {
    alignItems: 'center', justifyContent: 'center', paddingVertical: 20,
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)', marginBottom: 8,
  },
  coachScroll: { marginBottom: 4 },
  coachRow: { flexDirection: 'row', gap: 8 },
  coachChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  coachChipActive: { borderColor: COLORS.orange, backgroundColor: 'rgba(232,143,36,0.1)' },
  coachAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(232,143,36,0.08)', alignItems: 'center', justifyContent: 'center',
  },
  coachChipText: { fontSize: 12, fontFamily: FONTS.bodyMedium, color: COLORS.textSecondary },
  coachChipTextActive: { color: COLORS.orange },
  coachToggleText: {
    fontSize: 13,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.textPrimary,
  },

  // Date chips
  dateScroll: { marginBottom: 4 },
  dateRow: { flexDirection: 'row', gap: 8 },
  dateChip: {
    alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', minWidth: 64,
  },
  dateChipActive: { borderColor: COLORS.orange, backgroundColor: 'rgba(232,143,36,0.12)' },
  dateChipDay: { fontSize: 9, fontFamily: FONTS.bodySemiBold, color: COLORS.textMuted, letterSpacing: 0.5 },
  dateChipDayActive: { color: COLORS.orange },
  dateChipNum: { fontSize: 20, fontFamily: FONTS.heading, color: COLORS.textSecondary, marginVertical: 2 },
  dateChipNumActive: { color: COLORS.orange },
  dateChipMonth: { fontSize: 9, fontFamily: FONTS.body, color: COLORS.textMuted },
  dateChipMonthActive: { color: COLORS.orange },

  // Time chips
  timeScroll: { marginBottom: 4 },
  timeRow: { flexDirection: 'row', gap: 8 },
  timeChip: {
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  timeChipActive: { borderColor: COLORS.orange, backgroundColor: 'rgba(232,143,36,0.12)' },
  timeChipText: { fontSize: 12, fontFamily: FONTS.bodyMedium, color: COLORS.textTertiary },
  timeChipTextActive: { color: COLORS.orange },
  timeChipBooked: { backgroundColor: 'rgba(239,83,80,0.06)', borderColor: 'rgba(239,83,80,0.15)', opacity: 0.6 },
  timeChipTextBooked: { color: COLORS.textMuted, textDecorationLine: 'line-through' as const },

  // Difficulty
  difficultyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  difficultyChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  difficultyText: {
    fontSize: 12,
    fontFamily: FONTS.heading,
    color: COLORS.textTertiary,
  },

  // Popular locations
  popularToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    marginBottom: 4,
    paddingVertical: 8,
  },
  popularToggleText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.orange,
  },
  locationsScroll: {
    marginBottom: 8,
  },
  locationsContent: {
    gap: 10,
    paddingVertical: 4,
  },
  locationCard: {
    width: 200,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  locationImage: {
    width: '100%',
    height: 100,
  },
  locationInfo: {
    padding: 10,
  },
  locationName: {
    fontSize: 12,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
  },
  locationCity: {
    fontSize: 9,
    fontFamily: FONTS.body,
    color: COLORS.orange,
    marginTop: 1,
  },
  locationDesc: {
    fontSize: 9,
    fontFamily: FONTS.body,
    color: COLORS.textMuted,
    marginTop: 4,
    lineHeight: 13,
  },
  locationSports: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
  },
  locationSportChip: {
    backgroundColor: 'rgba(86,196,196,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  locationSportText: {
    fontSize: 8,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.aqua,
    textTransform: 'capitalize',
  },

  // Image picker
  imagePicker: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1.5,
    borderColor: 'rgba(232,143,36,0.2)',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 28,
    gap: 8,
  },
  imagePickerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(232,143,36,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickerTitle: {
    fontSize: 13,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
  },
  imagePickerSub: {
    fontSize: 10,
    fontFamily: FONTS.body,
    color: COLORS.textMuted,
  },
  imagePreviewWrap: {
    position: 'relative',
    borderRadius: 14,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 14,
  },
  imageRemoveBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 14,
  },
});
