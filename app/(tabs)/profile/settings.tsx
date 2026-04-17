import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../src/providers/AuthProvider';
import { useTheme } from '../../../src/providers/ThemeProvider';
import { COLORS, FONTS } from '../../../src/lib/constants';

interface SettingToggle {
  key: string;
  icon: string;
  label: string;
  description: string;
  value: boolean;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // Privacy settings
  const [privateProfile, setPrivateProfile] = useState(false);
  const [showActivity, setShowActivity] = useState(true);
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(true);
  const [packOnly, setPackOnly] = useState(false);

  // Notification settings
  const [notifyEvents, setNotifyEvents] = useState(true);
  const [notifyChat, setNotifyChat] = useState(true);
  const [notifyBeasts, setNotifyBeasts] = useState(true);

  function Toggle({ value, onToggle, color = COLORS.orange }: { value: boolean; onToggle: () => void; color?: string }) {
    return (
      <TouchableOpacity
        style={[styles.toggle, value && { backgroundColor: `${color}30` }]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={[styles.toggleDot, value && { alignSelf: 'flex-end', backgroundColor: color }]} />
      </TouchableOpacity>
    );
  }

  function SettingRow({ icon, label, description, children }: { icon: string; label: string; description: string; children: React.ReactNode }) {
    return (
      <View style={styles.settingRow}>
        <View style={styles.settingIconWrap}>
          <Ionicons name={icon as any} size={18} color={COLORS.orange} />
        </View>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>{label}</Text>
          <Text style={styles.settingDesc}>{description}</Text>
        </View>
        {children}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings & Privacy</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* PRIVACY */}
        <Text style={styles.sectionLabel}>PRIVACY</Text>
        <View style={styles.card}>
          <SettingRow icon="eye-off-outline" label="Private Profile" description="Only your pack members can see your profile and activity">
            <Toggle value={privateProfile} onToggle={() => setPrivateProfile(!privateProfile)} />
          </SettingRow>

          <SettingRow icon="people-outline" label="Pack Only Mode" description="Only interact with your tribe — hide from public feed">
            <Toggle value={packOnly} onToggle={() => setPackOnly(!packOnly)} />
          </SettingRow>

          <SettingRow icon="bar-chart-outline" label="Show on Leaderboard" description="Appear in Beast Rank public leaderboard">
            <Toggle value={showOnLeaderboard} onToggle={() => setShowOnLeaderboard(!showOnLeaderboard)} />
          </SettingRow>

          <SettingRow icon="calendar-outline" label="Show Activity Calendar" description="Let others see your workout streaks and activity">
            <Toggle value={showActivity} onToggle={() => setShowActivity(!showActivity)} />
          </SettingRow>
        </View>

        {/* NOTIFICATIONS */}
        <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
        <View style={styles.card}>
          <SettingRow icon="megaphone-outline" label="Event Updates" description="Get notified about new events and RSVPs">
            <Toggle value={notifyEvents} onToggle={() => setNotifyEvents(!notifyEvents)} color={COLORS.aqua} />
          </SettingRow>

          <SettingRow icon="chatbubbles-outline" label="Chat Messages" description="Notifications for pack and activity chats">
            <Toggle value={notifyChat} onToggle={() => setNotifyChat(!notifyChat)} color={COLORS.aqua} />
          </SettingRow>

          <SettingRow icon="heart-outline" label="Beast Reactions" description="When someone beasts your post">
            <Toggle value={notifyBeasts} onToggle={() => setNotifyBeasts(!notifyBeasts)} color={COLORS.aqua} />
          </SettingRow>
        </View>

        {/* COACH ACCESS */}
        <Text style={styles.sectionLabel}>COACH ACCESS</Text>
        <View style={styles.card}>
          <SettingRow icon="barbell-outline" label="Share Workouts" description="Let your coach see your workout history">
            <Toggle value={true} onToggle={() => {}} color={COLORS.green} />
          </SettingRow>
          <SettingRow icon="restaurant-outline" label="Share Nutrition" description="Let your coach see your meal logs">
            <Toggle value={true} onToggle={() => {}} color={COLORS.green} />
          </SettingRow>
          <SettingRow icon="checkbox-outline" label="Share Habits" description="Let your coach see your daily habits">
            <Toggle value={true} onToggle={() => {}} color={COLORS.green} />
          </SettingRow>
          <SettingRow icon="body-outline" label="Share Body Metrics" description="Let your coach see weight, BMI, measurements">
            <Toggle value={true} onToggle={() => {}} color={COLORS.green} />
          </SettingRow>
          <SettingRow icon="camera-outline" label="Share Progress Photos" description="Allow coach to view your before/after photos">
            <Toggle value={false} onToggle={() => {}} color={COLORS.green} />
          </SettingRow>
          <SettingRow icon="megaphone-outline" label="Post My Transformation" description="Allow coach to share your progress on the feed">
            <Toggle value={false} onToggle={() => {}} color={COLORS.green} />
          </SettingRow>
        </View>

        {/* APPEARANCE */}
        <Text style={styles.sectionLabel}>APPEARANCE</Text>
        <View style={styles.card}>
          <SettingRow icon={isDark ? 'moon' : 'sunny'} label={isDark ? 'Dark Mode' : 'Light Mode'} description="Switch between dark and light theme">
            <Toggle value={isDark} onToggle={toggleTheme} />
          </SettingRow>
        </View>

        {/* ACCOUNT */}
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.settingRow} onPress={() => router.push('/(onboarding)/about-you?edit=1')} activeOpacity={0.7}>
            <View style={styles.settingIconWrap}>
              <Ionicons name="person-outline" size={18} color={COLORS.orange} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Edit Profile</Text>
              <Text style={styles.settingDesc}>Country, city, gender, experience level</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={() => router.push('/(onboarding)/pick-sports?edit=1')} activeOpacity={0.7}>
            <View style={styles.settingIconWrap}>
              <Ionicons name="fitness-outline" size={18} color={COLORS.orange} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Edit Disciplines</Text>
              <Text style={styles.settingDesc}>Sports and training frequency</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={() => router.push('/(onboarding)/set-habits?edit=1')} activeOpacity={0.7}>
            <View style={styles.settingIconWrap}>
              <Ionicons name="checkbox-outline" size={18} color={COLORS.orange} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Edit Habits</Text>
              <Text style={styles.settingDesc}>Daily habits and targets</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* COMMUNITY BEST PRACTICES */}
        <Text style={styles.sectionLabel}>COMMUNITY GUIDELINES</Text>
        <View style={styles.guidelinesCard}>
          <View style={styles.guidelineItem}>
            <View style={styles.guidelineIconWrap}>
              <Ionicons name="shield-checkmark" size={20} color={COLORS.green} />
            </View>
            <View style={styles.guidelineContent}>
              <Text style={styles.guidelineTitle}>Be Respectful</Text>
              <Text style={styles.guidelineText}>Treat every beast with respect. No harassment, bullying, or hate speech. We're all here to grow.</Text>
            </View>
          </View>

          <View style={styles.guidelineItem}>
            <View style={styles.guidelineIconWrap}>
              <Ionicons name="hand-left" size={20} color={COLORS.orange} />
            </View>
            <View style={styles.guidelineContent}>
              <Text style={styles.guidelineTitle}>Keep It Safe</Text>
              <Text style={styles.guidelineText}>Never share personal info like phone numbers or addresses in public chats. Use private messages for personal details.</Text>
            </View>
          </View>

          <View style={styles.guidelineItem}>
            <View style={styles.guidelineIconWrap}>
              <Ionicons name="heart" size={20} color={COLORS.coral} />
            </View>
            <View style={styles.guidelineContent}>
              <Text style={styles.guidelineTitle}>Support Each Other</Text>
              <Text style={styles.guidelineText}>Celebrate wins, encourage effort, and lift up your tribe. Every beast started somewhere.</Text>
            </View>
          </View>

          <View style={styles.guidelineItem}>
            <View style={styles.guidelineIconWrap}>
              <Ionicons name="camera-outline" size={20} color={COLORS.aqua} />
            </View>
            <View style={styles.guidelineContent}>
              <Text style={styles.guidelineTitle}>Ask Before Sharing</Text>
              <Text style={styles.guidelineText}>Always get permission before posting photos or videos of others. Respect everyone's privacy.</Text>
            </View>
          </View>

          <View style={styles.guidelineItem}>
            <View style={styles.guidelineIconWrap}>
              <Ionicons name="warning-outline" size={20} color="#FFD700" />
            </View>
            <View style={styles.guidelineContent}>
              <Text style={styles.guidelineTitle}>Listen to Your Body</Text>
              <Text style={styles.guidelineText}>Push your limits, not past them. Rest days are beast days too. Consult a doctor before starting any new fitness program.</Text>
            </View>
          </View>

          <View style={styles.guidelineItem}>
            <View style={styles.guidelineIconWrap}>
              <Ionicons name="flag" size={20} color="#EF5350" />
            </View>
            <View style={styles.guidelineContent}>
              <Text style={styles.guidelineTitle}>Report Issues</Text>
              <Text style={styles.guidelineText}>See something wrong? Use the 3-dot menu on any post to report it. Our team reviews every report.</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerTitle: { fontSize: 16, fontFamily: FONTS.heading, color: COLORS.white },
  backBtn: { padding: 8 },
  scroll: { flex: 1, paddingHorizontal: 16 },

  sectionLabel: {
    fontSize: 9, fontFamily: FONTS.bodySemiBold, color: COLORS.textMuted,
    letterSpacing: 1.5, marginTop: 24, marginBottom: 10,
  },

  card: {
    backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.cardBorder,
    borderRadius: 14, overflow: 'hidden',
  },

  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  settingIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(232,143,36,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 13, fontFamily: FONTS.bodyMedium, color: COLORS.white },
  settingDesc: { fontSize: 10, fontFamily: FONTS.body, color: COLORS.textMuted, marginTop: 1 },

  toggle: {
    width: 44, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center', paddingHorizontal: 3,
  },
  toggleDot: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: COLORS.textMuted, alignSelf: 'flex-start',
  },

  // Guidelines
  guidelinesCard: {
    backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.cardBorder,
    borderRadius: 14, padding: 16, gap: 16,
  },
  guidelineItem: { flexDirection: 'row', gap: 12 },
  guidelineIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  guidelineContent: { flex: 1 },
  guidelineTitle: { fontSize: 13, fontFamily: FONTS.heading, color: COLORS.textPrimary, marginBottom: 2 },
  guidelineText: { fontSize: 11, fontFamily: FONTS.body, color: COLORS.textSecondary, lineHeight: 16 },
});
