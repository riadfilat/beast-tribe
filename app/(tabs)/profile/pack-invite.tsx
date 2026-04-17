import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Share, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, TierPill } from '../../../src/components/ui';
import { COLORS, FONTS } from '../../../src/lib/constants';
import { useMyPack, useSearchUsers, useInviteToPack } from '../../../src/hooks';
import { useAuth } from '../../../src/providers/AuthProvider';

export default function PackInviteScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ packId?: string }>();
  const { data: membership } = useMyPack();
  const pack = membership?.pack;
  const packId = params.packId || pack?.id;

  const [searchQuery, setSearchQuery] = useState('');
  const { data: searchResults, loading: searching } = useSearchUsers(searchQuery);
  const { invite, loading: inviting } = useInviteToPack();
  const [invited, setInvited] = useState<Set<string>>(new Set());

  async function handleInvite(targetUserId: string) {
    if (!packId) return;
    await invite(packId, targetUserId);
    setInvited(prev => new Set([...prev, targetUserId]));
  }

  async function handleShareCode() {
    if (!pack?.invite_code) return;
    await Share.share({
      message: `Join my pack "${pack.name}" on Beast Tribe! Use code: ${pack.invite_code}`,
    });
  }

  // Filter out current user from results
  const filteredResults = (searchResults || []).filter((p: any) => p.id !== user?.id);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Invite Friends</Text>

        {/* Share code section */}
        {pack?.invite_code && (
          <TouchableOpacity style={styles.codeCard} onPress={handleShareCode} activeOpacity={0.7}>
            <View>
              <Text style={styles.codeLabel}>SHARE INVITE CODE</Text>
              <Text style={styles.codeValue}>{pack.invite_code}</Text>
            </View>
            <Text style={styles.shareIcon}>↗</Text>
          </TouchableOpacity>
        )}

        {/* Search users */}
        <Text style={styles.sectionLabel}>SEARCH BY NAME</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by display name..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />

        {searching && <ActivityIndicator color={COLORS.aqua} style={{ marginVertical: 16 }} />}

        {!searching && searchQuery.length >= 2 && filteredResults.length === 0 && (
          <Text style={styles.noResults}>No users found</Text>
        )}

        {filteredResults.map((profile: any) => {
          const isInvited = invited.has(profile.id);
          return (
            <View key={profile.id} style={styles.userRow}>
              <Avatar name={profile.display_name || profile.full_name || 'Beast'} size={32} tier={profile.tier} />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{profile.display_name || profile.full_name}</Text>
              </View>
              <TierPill tier={profile.tier || 'raw'} size="small" />
              <TouchableOpacity
                style={[styles.inviteButton, isInvited && styles.invitedButton]}
                onPress={() => handleInvite(profile.id)}
                disabled={isInvited || inviting}
              >
                <Text style={[styles.inviteText, isInvited && styles.invitedText]}>
                  {isInvited ? 'Sent' : 'Invite'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')} style={styles.backButton}>
          <Text style={styles.backText}>← Back to Pack</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1, paddingHorizontal: 16 },
  title: { fontSize: 22, fontFamily: FONTS.heading, color: COLORS.textPrimary, marginTop: 8, marginBottom: 16 },

  // Code card
  codeCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(86,196,196,0.06)', borderWidth: 1, borderColor: 'rgba(86,196,196,0.15)',
    borderRadius: 14, padding: 16, marginBottom: 20,
  },
  codeLabel: { fontSize: 9, fontFamily: FONTS.bodySemiBold, color: COLORS.textSecondary, letterSpacing: 1 },
  codeValue: { fontSize: 20, fontFamily: FONTS.heading, color: COLORS.aqua, letterSpacing: 4, marginTop: 2 },
  shareIcon: { fontSize: 20, color: COLORS.aqua },

  // Search
  sectionLabel: { fontSize: 9, fontFamily: FONTS.bodySemiBold, color: COLORS.textSecondary, letterSpacing: 1, marginBottom: 8 },
  searchInput: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13,
    fontFamily: FONTS.body, color: COLORS.textPrimary, marginBottom: 12,
  },
  noResults: { fontSize: 12, fontFamily: FONTS.body, color: COLORS.textMuted, textAlign: 'center', marginVertical: 20 },

  // User rows
  userRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 13, fontFamily: FONTS.bodyMedium, color: COLORS.white },
  inviteButton: {
    backgroundColor: COLORS.orange, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6,
  },
  invitedButton: { backgroundColor: 'rgba(255,255,255,0.05)' },
  inviteText: { fontSize: 11, fontFamily: FONTS.bodySemiBold, color: COLORS.teal },
  invitedText: { color: COLORS.textMuted },

  // Back
  backButton: { marginTop: 20, alignItems: 'center' },
  backText: { fontSize: 13, fontFamily: FONTS.bodyMedium, color: COLORS.aqua },
});
