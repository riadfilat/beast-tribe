import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Avatar, BeastIcon } from '../../../src/components/ui';
import { useProfile, useUserSports, useMyPack, usePackMembers, useMyCommunity, useIsCoach } from '../../../src/hooks';
import { useAuth } from '../../../src/providers/AuthProvider';
import { useTheme } from '../../../src/providers/ThemeProvider';
import { COLORS, FONTS } from '../../../src/lib/constants';

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  async function pickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library to upload a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const { compressImage } = require('../../../src/lib/imageUtils');
      const compressed = await compressImage(result.assets[0].uri, 'avatar');
      setAvatarUri(compressed);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
      setShowSignOutModal(false);
    }
  }
  const { profile, loading: profileLoading } = useProfile();
  const { data: sportsData } = useUserSports();
  const { data: myPackData } = useMyPack();
  const myPack = myPackData?.pack;
  const { data: packMembers } = usePackMembers(myPack?.id);
  const { data: myCommunity } = useMyCommunity();
  const { isCoach } = useIsCoach();

  const isLoading = profileLoading;

  // Profile data with fallbacks
  const name = profile?.display_name || profile?.full_name || 'Beast';

  const sports = (sportsData || []).map((us: any) => us.sport?.name || 'Sport');

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.orange} />
        </View>
      </SafeAreaView>
    );
  }

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

        {/* Profile avatar + info centered */}
        <View style={styles.profileCenter}>
          <TouchableOpacity style={styles.avatarContainer} onPress={pickAvatar} activeOpacity={0.8}>
            <Avatar name={name} size={90} backgroundColor={COLORS.dark} imageUrl={avatarUri || undefined} />
            <View style={styles.cameraOverlay}>
              <Ionicons name="camera" size={14} color={COLORS.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.profileName}>{name.toUpperCase()}</Text>
          {myCommunity && (
            <View style={styles.communityBadge}>
              <Ionicons name="shield-checkmark" size={12} color={COLORS.orange} />
              <Text style={styles.communityBadgeText}>{myCommunity.name}</Text>
            </View>
          )}
        </View>

        {/* MY PACK */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>MY PACK</Text>
            {myPack && (
              <TouchableOpacity onPress={() => router.push('/(tabs)/profile/pack')} activeOpacity={0.7}>
                <Text style={styles.sectionAction}>MANAGE</Text>
              </TouchableOpacity>
            )}
          </View>
          {myPack ? (
            <TouchableOpacity
              style={styles.packCard}
              activeOpacity={0.7}
              onPress={() => router.push('/(tabs)/profile/pack')}
            >
              <View style={styles.packIconWrap}>
                <Ionicons name="people" size={20} color={COLORS.aqua} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.packName}>{myPack.name}</Text>
                <Text style={styles.packSub}>{packMembers?.length || 1} Active Members</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.packCard}
              activeOpacity={0.7}
              onPress={() => router.push('/(tabs)/profile/pack')}
            >
              <View style={styles.packIconWrap}>
                <Ionicons name="people" size={20} color={COLORS.aqua} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.packName}>Join a Pack</Text>
                <Text style={styles.packSub}>Connect with friends</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* MY DISCIPLINES */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>MY DISCIPLINES</Text>
            <TouchableOpacity onPress={() => router.push('/(onboarding)/pick-sports?edit=1')} activeOpacity={0.7}>
              <Text style={styles.sectionAction}>EDIT</Text>
            </TouchableOpacity>
          </View>
          {sports.length > 0 ? (
            <View style={styles.sportsRow}>
              {sports.map((sport) => (
                <View key={sport} style={styles.sportChip}>
                  <Text style={styles.sportText}>{sport}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="hand-left-outline" size={28} color={COLORS.textMuted} />
              </View>
              <Text style={styles.emptyText}>Pick the sports you{'\n'}train in to personalize your profile.</Text>
            </View>
          )}
        </View>

        {/* COACH DASHBOARD — only visible to coaches */}
        {isCoach && (
          <TouchableOpacity
            style={styles.coachDashboardCard}
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/profile/coach-dashboard')}
          >
            <View style={styles.coachDashboardIcon}>
              <Ionicons name="clipboard-outline" size={20} color={COLORS.orange} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.coachDashboardTitle}>COACH DASHBOARD</Text>
              <Text style={styles.coachDashboardSub}>Manage your trainees and bookings</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>
        )}

        {/* ACCOUNT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <TouchableOpacity style={styles.accountRow} activeOpacity={0.7} onPress={() => router.push('/(tabs)/profile/settings')}>
            <View style={styles.accountIconWrap}>
              <Ionicons name="settings-outline" size={18} color={COLORS.textSecondary} />
            </View>
            <Text style={styles.accountRowText}>SETTINGS & PRIVACY</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.accountRow} activeOpacity={0.7} onPress={toggleTheme}>
            <View style={[styles.accountIconWrap, { backgroundColor: isDark ? 'rgba(232,143,36,0.1)' : 'rgba(86,196,196,0.1)' }]}>
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={isDark ? COLORS.orange : COLORS.aqua} />
            </View>
            <Text style={styles.accountRowText}>{isDark ? 'DARK MODE' : 'LIGHT MODE'}</Text>
            <View style={[styles.themeToggle, !isDark && styles.themeToggleLight]}>
              <View style={[styles.themeToggleDot, !isDark && styles.themeToggleDotLight]} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.accountRow}
            activeOpacity={0.7}
            onPress={() => setShowSignOutModal(true)}
          >
            <View style={[styles.accountIconWrap, { backgroundColor: 'rgba(239,83,80,0.1)' }]}>
              <Ionicons name="log-out-outline" size={18} color="#EF5350" />
            </View>
            <Text style={[styles.accountRowText, { color: '#EF5350' }]}>SIGN OUT</Text>
            <Ionicons name="chevron-forward" size={16} color="rgba(239,83,80,0.4)" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Sign Out Confirmation Modal */}
      <Modal visible={showSignOutModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => !signingOut && setShowSignOutModal(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="log-out-outline" size={32} color="#EF5350" />
            </View>
            <Text style={styles.modalTitle}>Sign Out?</Text>
            <Text style={styles.modalSubtitle}>
              You'll need to sign back in to access your tribe.
            </Text>
            <TouchableOpacity
              style={styles.modalSignOutBtn}
              activeOpacity={0.8}
              onPress={handleSignOut}
              disabled={signingOut}
            >
              <Text style={styles.modalSignOutText}>
                {signingOut ? 'Signing out...' : 'Yes, Sign Out'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              activeOpacity={0.7}
              onPress={() => setShowSignOutModal(false)}
              disabled={signingOut}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1, paddingHorizontal: 16 },

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
  brandName: {
    fontSize: 16,
    fontFamily: FONTS.display,
    color: COLORS.orange,
    letterSpacing: 1,
  },
  notificationBtn: {
    padding: 4,
  },

  /* Profile center */
  profileCenter: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 10,
    position: 'relative',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.orange,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  profileName: {
    fontSize: 22,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
    letterSpacing: 1.5,
    marginTop: 10,
  },
  communityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(232,143,36,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(232,143,36,0.35)',
  },
  communityBadgeText: {
    fontSize: 11,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.orange,
    letterSpacing: 0.5,
  },

  /* Sections */
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
    letterSpacing: 1,
    marginBottom: 10,
  },
  sectionAction: {
    fontSize: 11,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.orange,
    letterSpacing: 0.5,
    marginBottom: 10,
  },

  /* Pack card */
  packCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 14,
  },
  packIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(86,196,196,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  packName: {
    fontSize: 14,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
  },
  packSub: {
    fontSize: 11,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
    marginTop: 1,
  },

  /* Empty state cards */
  emptyCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 12,
    fontFamily: FONTS.body,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },

  /* Sports / Disciplines */
  sportsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sportChip: {
    backgroundColor: 'rgba(232,143,36,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(232,143,36,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  sportText: {
    fontSize: 11,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.orange,
  },

  /* Account rows */
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  accountIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountRowText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },

  /* Theme toggle */
  themeToggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(232,143,36,0.25)',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  themeToggleLight: {
    backgroundColor: 'rgba(86,196,196,0.25)',
  },
  themeToggleDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.orange,
    alignSelf: 'flex-end',
  },
  themeToggleDotLight: {
    backgroundColor: COLORS.aqua,
    alignSelf: 'flex-start',
  },

  /* Coach Dashboard Card */
  coachDashboardCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(232,143,36,0.06)', borderWidth: 1, borderColor: 'rgba(232,143,36,0.2)',
    borderRadius: 14, padding: 14, marginBottom: 20,
  },
  coachDashboardIcon: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(232,143,36,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  coachDashboardTitle: { fontSize: 14, fontFamily: FONTS.heading, color: COLORS.orange },
  coachDashboardSub: { fontSize: 10, fontFamily: FONTS.body, color: COLORS.textTertiary, marginTop: 2 },

  /* Sign Out Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#012A2A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(239,83,80,0.15)',
  },
  modalIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239,83,80,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
    maxWidth: 280,
  },
  modalSignOutBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#EF5350',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalSignOutText: {
    fontSize: 15,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.textPrimary,
  },
  modalCancelBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.textSecondary,
  },
});
