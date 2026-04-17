import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Modal, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../src/components/ui';
import { StepIndicator } from '../../src/components/onboarding/StepIndicator';
import { useAuth } from '../../src/providers/AuthProvider';
import { COLORS, FONTS } from '../../src/lib/constants';
import { supabase } from '../../src/lib/supabase';

// ─── DOB drum-roll picker ───────────────────────────────────────────────────

const ITEM_H = 50;
const VISIBLE = 5; // must be odd

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 71 }, (_, i) => CURRENT_YEAR - 10 - i); // age 10–80

function parseDob(dob: string) {
  const parts = dob ? dob.split('-') : [];
  const y = parts[0] ? parseInt(parts[0]) : CURRENT_YEAR - 25;
  const m = parts[1] ? parseInt(parts[1]) - 1 : 0;
  const d = parts[2] ? parseInt(parts[2]) : 1;
  return {
    year: YEARS.includes(y) ? y : CURRENT_YEAR - 25,
    month: m >= 0 && m <= 11 ? m : 0,
    day: d >= 1 && d <= 31 ? d : 1,
  };
}

function DrumColumn<T extends number | string>({
  items,
  selected,
  onSelect,
  renderLabel,
}: {
  items: T[];
  selected: T;
  onSelect: (v: T) => void;
  renderLabel?: (v: T) => string;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const indexRef = useRef(items.indexOf(selected as any));
  const didInit = useRef(false);

  useEffect(() => {
    const idx = items.indexOf(selected as any);
    if (idx >= 0) {
      indexRef.current = idx;
      // Small delay to let the modal finish mounting
      const t = setTimeout(() => {
        scrollRef.current?.scrollTo({ y: idx * ITEM_H, animated: false });
        didInit.current = true;
      }, 50);
      return () => clearTimeout(t);
    }
  }, []);

  const handleScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
      const clamped = Math.max(0, Math.min(idx, items.length - 1));
      indexRef.current = clamped;
      onSelect(items[clamped]);
    },
    [items, onSelect],
  );

  return (
    <View style={drumStyles.column}>
      {/* Static highlight band */}
      <View pointerEvents="none" style={drumStyles.highlight} />

      <ScrollView
        ref={scrollRef}
        style={drumStyles.scroll}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        contentContainerStyle={{ paddingVertical: ITEM_H * Math.floor(VISIBLE / 2) }}
      >
        {items.map((item, i) => {
          const isSelected = item === selected;
          return (
            <TouchableOpacity
              key={String(item)}
              style={drumStyles.item}
              activeOpacity={0.7}
              onPress={() => {
                onSelect(item);
                scrollRef.current?.scrollTo({ y: i * ITEM_H, animated: true });
              }}
            >
              <Text style={[drumStyles.itemText, isSelected && drumStyles.itemTextSelected]}>
                {renderLabel ? renderLabel(item) : typeof item === 'number' ? String(item).padStart(2, '0') : String(item)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

function DobPickerModal({
  visible,
  value,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  value: string;
  onClose: () => void;
  onConfirm: (dob: string) => void;
}) {
  const parsed = parseDob(value);
  const [day, setDay] = useState(parsed.day);
  const [month, setMonth] = useState(parsed.month);
  const [year, setYear] = useState(parsed.year);

  useEffect(() => {
    if (visible) {
      const p = parseDob(value);
      setDay(p.day);
      setMonth(p.month);
      setYear(p.year);
    }
  }, [visible]);

  function confirm() {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onConfirm(`${year}-${mm}-${dd}`);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={drumStyles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={drumStyles.sheet}>
        <View style={drumStyles.sheetHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={drumStyles.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={drumStyles.sheetTitle}>Date of Birth</Text>
          <TouchableOpacity onPress={confirm}>
            <Text style={drumStyles.done}>Done</Text>
          </TouchableOpacity>
        </View>

        <View style={drumStyles.drums}>
          <DrumColumn
            items={DAYS}
            selected={day}
            onSelect={setDay}
            renderLabel={(d) => String(d).padStart(2, '0')}
          />
          <DrumColumn
            items={MONTHS}
            selected={MONTHS[month]}
            onSelect={(m) => setMonth(MONTHS.indexOf(m as string))}
          />
          <DrumColumn items={YEARS} selected={year} onSelect={setYear} />
        </View>

        <View style={drumStyles.columnLabels}>
          <Text style={drumStyles.colLabel}>Day</Text>
          <Text style={drumStyles.colLabel}>Month</Text>
          <Text style={drumStyles.colLabel}>Year</Text>
        </View>
      </View>
    </Modal>
  );
}

const drumStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#011E1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderColor: 'rgba(86,196,196,0.18)',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(86,196,196,0.12)',
  },
  sheetTitle: { fontSize: 14, fontFamily: FONTS.heading, color: COLORS.white },
  cancel: { fontSize: 14, fontFamily: FONTS.body, color: COLORS.textSecondary },
  done: { fontSize: 14, fontFamily: FONTS.bodySemiBold, color: COLORS.aqua },

  drums: {
    flexDirection: 'row',
    height: ITEM_H * VISIBLE,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  column: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  scroll: { flex: 1 },
  highlight: {
    position: 'absolute',
    top: ITEM_H * Math.floor(VISIBLE / 2),
    left: 4,
    right: 4,
    height: ITEM_H,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(86,196,196,0.35)',
    backgroundColor: 'rgba(86,196,196,0.06)',
    borderRadius: 8,
    zIndex: 1,
  },
  item: {
    height: ITEM_H,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 16,
    fontFamily: FONTS.body,
    color: COLORS.textMuted,
  },
  itemTextSelected: {
    fontSize: 20,
    fontFamily: FONTS.heading,
    color: COLORS.white,
  },
  columnLabels: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginTop: 4,
  },
  colLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});

const COUNTRIES = [
  { id: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { id: 'AE', name: 'UAE', flag: '🇦🇪' },
  { id: 'BH', name: 'Bahrain', flag: '🇧🇭' },
  { id: 'KW', name: 'Kuwait', flag: '🇰🇼' },
  { id: 'QA', name: 'Qatar', flag: '🇶🇦' },
  { id: 'OM', name: 'Oman', flag: '🇴🇲' },
  { id: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { id: 'JO', name: 'Jordan', flag: '🇯🇴' },
];

const CITY_SUGGESTIONS: Record<string, string[]> = {
  SA: ['Riyadh', 'Jeddah', 'Dammam', 'Mecca', 'Medina', 'Khobar'],
  AE: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Al Ain'],
  BH: ['Manama', 'Riffa', 'Muharraq'],
  KW: ['Kuwait City', 'Hawalli', 'Salmiya'],
  QA: ['Doha', 'Al Wakrah', 'Al Khor'],
  OM: ['Muscat', 'Salalah', 'Sohar'],
  EG: ['Cairo', 'Alexandria', 'Giza'],
  JO: ['Amman', 'Aqaba', 'Irbid'],
};

const GENDERS = [
  { id: 'male', label: 'Male', icon: 'male-outline' },
  { id: 'female', label: 'Female', icon: 'female-outline' },
];

const EXPERIENCE_LEVELS = [
  { id: 'beginner', label: 'Beginner', icon: 'leaf-outline', desc: 'Just getting started', color: COLORS.green },
  { id: 'intermediate', label: 'Intermediate', icon: 'fitness-outline', desc: 'I train regularly', color: COLORS.aqua },
  { id: 'advanced', label: 'Advanced', icon: 'flame-outline', desc: 'Serious about fitness', color: COLORS.orange },
  { id: 'expert', label: 'Expert', icon: 'flash-outline', desc: 'Competitive athlete', color: '#FFD700' },
];

export default function AboutYouScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ edit?: string }>();
  const isEditMode = params.edit === '1';
  const { user, profile } = useAuth();

  const [country, setCountry] = useState('SA');
  const [city, setCity] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [experience, setExperience] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCities, setShowCities] = useState(false);
  const [showDobPicker, setShowDobPicker] = useState(false);

  // Pre-fill in edit mode
  useEffect(() => {
    if (isEditMode && profile) {
      if (profile.region) setCountry(profile.region);
      if (profile.city) setCity(profile.city);
      if (profile.date_of_birth) setDob(profile.date_of_birth);
      if (profile.gender) setGender(profile.gender);
      if (profile.experience_level) setExperience(profile.experience_level);
    }
  }, [isEditMode, profile]);

  const canContinue = country.length > 0 && experience.length > 0;

  async function handleContinue() {
    setSaving(true);
    try {
      if (user) {
        await supabase.from('profiles').update({
          region: country,
          city: city.trim() || null,
          date_of_birth: dob.trim() || null,
          gender: gender || null,
          experience_level: experience || null,
        }).eq('id', user.id);
      }
    } catch (e) {
      console.warn('Failed to save about you:', e);
    } finally {
      setSaving(false);
    }

    if (isEditMode) {
      router.canGoBack() ? router.back() : router.replace('/(tabs)/profile');
    } else {
      router.push('/(onboarding)/pick-sports');
    }
  }

  const cities = CITY_SUGGESTIONS[country] || [];

  return (
    <SafeAreaView style={styles.container}>
      {isEditMode ? (
        <View style={styles.editHeader}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.editHeaderTitle}>Edit Profile</Text>
          <View style={{ width: 22 }} />
        </View>
      ) : (
        <StepIndicator currentStep={1} totalSteps={4} />
      )}

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{isEditMode ? 'Your profile' : 'Tell us about you'}</Text>
        <Text style={styles.subtitle}>This helps personalize your Beast Tribe experience</Text>

        {/* Country */}
        <Text style={styles.label}>WHERE ARE YOU FROM?</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipRow}>
            {COUNTRIES.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.countryChip, country === c.id && styles.countryChipActive]}
                onPress={() => { setCountry(c.id); setCity(''); }}
                activeOpacity={0.7}
              >
                <Text style={styles.countryFlag}>{c.flag}</Text>
                <Text style={[styles.countryName, country === c.id && styles.countryNameActive]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* City */}
        <Text style={styles.label}>YOUR CITY</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your city"
          placeholderTextColor={COLORS.textMuted}
          value={city}
          onChangeText={setCity}
          onFocus={() => setShowCities(true)}
        />
        {showCities && cities.length > 0 && !city && (
          <View style={styles.citySuggestions}>
            {cities.map((c) => (
              <TouchableOpacity
                key={c}
                style={styles.citySuggestion}
                onPress={() => { setCity(c); setShowCities(false); }}
                activeOpacity={0.7}
              >
                <Text style={styles.citySuggestionText}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Date of Birth */}
        <Text style={styles.label}>DATE OF BIRTH</Text>
        <TouchableOpacity style={styles.dobTrigger} onPress={() => setShowDobPicker(true)} activeOpacity={0.7}>
          <Ionicons name="calendar-outline" size={16} color={dob ? COLORS.aqua : COLORS.textMuted} />
          <Text style={[styles.dobTriggerText, !dob && styles.dobPlaceholder]}>
            {dob
              ? (() => {
                  const [y, m, d] = dob.split('-');
                  return `${MONTHS[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
                })()
              : 'Select date of birth'}
          </Text>
          <Ionicons name="chevron-down" size={14} color={COLORS.textMuted} />
        </TouchableOpacity>

        <DobPickerModal
          visible={showDobPicker}
          value={dob}
          onClose={() => setShowDobPicker(false)}
          onConfirm={(v) => { setDob(v); setShowDobPicker(false); }}
        />

        {/* Gender */}
        <Text style={styles.label}>GENDER</Text>
        <View style={styles.genderRow}>
          {GENDERS.map((g) => (
            <TouchableOpacity
              key={g.id}
              style={[styles.genderChip, gender === g.id && styles.genderChipActive]}
              onPress={() => setGender(g.id)}
              activeOpacity={0.7}
            >
              <Ionicons name={g.icon as any} size={18} color={gender === g.id ? COLORS.orange : COLORS.textTertiary} />
              <Text style={[styles.genderText, gender === g.id && styles.genderTextActive]}>{g.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Experience Level */}
        <Text style={styles.label}>FITNESS EXPERIENCE</Text>
        <View style={styles.experienceGrid}>
          {EXPERIENCE_LEVELS.map((lvl) => (
            <TouchableOpacity
              key={lvl.id}
              style={[
                styles.experienceCard,
                experience === lvl.id && { borderColor: lvl.color, backgroundColor: `${lvl.color}10` },
              ]}
              onPress={() => setExperience(lvl.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.experienceIcon, experience === lvl.id && { backgroundColor: `${lvl.color}20` }]}>
                <Ionicons name={lvl.icon as any} size={20} color={experience === lvl.id ? lvl.color : COLORS.textTertiary} />
              </View>
              <Text style={[styles.experienceLabel, experience === lvl.id && { color: lvl.color }]}>{lvl.label}</Text>
              <Text style={styles.experienceDesc}>{lvl.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 16 }} />
        <Button
          title={saving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Continue'}
          onPress={handleContinue}
          disabled={!canContinue || saving}
        />
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  editHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  editHeaderTitle: { fontSize: 16, fontFamily: FONTS.heading, color: COLORS.white },
  scroll: { flex: 1, paddingHorizontal: 20 },
  title: { fontSize: 22, fontFamily: FONTS.heading, color: COLORS.white, marginBottom: 4 },
  subtitle: { fontSize: 12, fontFamily: FONTS.body, color: COLORS.textSecondary, marginBottom: 24, lineHeight: 18 },

  label: {
    fontSize: 9, fontFamily: FONTS.bodySemiBold, color: COLORS.textMuted,
    letterSpacing: 1.5, marginBottom: 8, marginTop: 20,
  },
  input: {
    backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.inputBorder,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, fontFamily: FONTS.body, color: COLORS.white,
  },

  // Country chips
  chipRow: { flexDirection: 'row', gap: 8 },
  countryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  countryChipActive: {
    borderColor: COLORS.orange, backgroundColor: 'rgba(232,143,36,0.08)',
  },
  countryFlag: { fontSize: 18 },
  countryName: { fontSize: 12, fontFamily: FONTS.bodyMedium, color: COLORS.textSecondary },
  countryNameActive: { color: COLORS.orange },

  // DOB trigger
  dobTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dobTriggerText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.body,
    color: COLORS.white,
  },
  dobPlaceholder: {
    color: COLORS.textMuted,
  },

  // City suggestions
  citySuggestions: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8,
  },
  citySuggestion: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: 'rgba(86,196,196,0.08)', borderWidth: 1, borderColor: 'rgba(86,196,196,0.15)',
  },
  citySuggestionText: { fontSize: 11, fontFamily: FONTS.bodyMedium, color: COLORS.aqua },

  // Gender
  genderRow: { flexDirection: 'row', gap: 8 },
  genderChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  genderChipActive: { borderColor: COLORS.orange, backgroundColor: 'rgba(232,143,36,0.08)' },
  genderText: { fontSize: 11, fontFamily: FONTS.bodyMedium, color: COLORS.textSecondary },
  genderTextActive: { color: COLORS.orange },

  // Experience
  experienceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  experienceCard: {
    width: '47%', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 8,
    borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  experienceIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  experienceLabel: { fontSize: 12, fontFamily: FONTS.heading, color: COLORS.textSecondary, marginBottom: 2 },
  experienceDesc: { fontSize: 9, fontFamily: FONTS.body, color: COLORS.textMuted, textAlign: 'center' },
});
