import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { FilterTabs, Button, BeastIcon } from '../../../src/components/ui';
import { FeedPost } from '../../../src/components/feed/FeedPost';
import { COLORS, FONTS, Tier } from '../../../src/lib/constants';

// Local placeholder images from Operation Beast assets
const OB_LOGO = require('../../../assets/images/ob-logo-mark.png');
const WOLF_IMG = require('../../../assets/images/animals/Wolf/1.png');
const EAGLE_IMG = require('../../../assets/images/animals/Eagle/1.png');
const TIGER_IMG = require('../../../assets/images/animals/Tiger/1.png');
import { useFeedPosts, useToggleBeast, useUserBeasts, useCreatePost } from '../../../src/hooks';
import { formatRelativeTime } from '../../../src/utils/format';
import { useAuth } from '../../../src/providers/AuthProvider';
import { supabase } from '../../../src/lib/supabase';

const SPORT_TABS = ['All', 'Running', 'Gym', 'Yoga', 'Swimming'];

const RHINO_IMG = require('../../../assets/images/animals/Rhino/1.png');

interface DemoPost {
  id: string;
  name: string;
  tier: Tier;
  content: string;
  workoutName?: string;
  timeAgo: string;
  beastCount: number;
  hasBeasted: boolean;
  xpEarned: number;
  commentCount: number;
  imageUrl?: string;
  localImage?: any;
  avatarLocalImage?: any;
  stats?: { label: string; value: string }[];
  reactorNames: string[];
}

// Empty — real posts come from Supabase. Will be populated at launch.
const DEMO_POSTS: DemoPost[] = [];

export default function FeedScreen() {
  const router = useRouter();
  const [viewTab, setViewTab] = useState(0); // 0 = Feed, 1 = Events
  const [sportTab, setSportTab] = useState(0);

  const { user, profile } = useAuth();
  const { data: feedData, loading, refetch: refetchFeed } = useFeedPosts(SPORT_TABS[sportTab]);
  const { toggleBeast } = useToggleBeast();
  const { createPost, loading: posting } = useCreatePost();

  // Post menu state
  const [menuPost, setMenuPost] = useState<{ id: string; isOwn: boolean } | null>(null);

  async function handleDeletePost(postId: string) {
    if (!postId.startsWith('demo-')) {
      await supabase.from('feed_posts').delete().eq('id', postId);
    }
    setMenuPost(null);
    refetchFeed();
  }

  // Compose modal state
  const [showCompose, setShowCompose] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postImageUri, setPostImageUri] = useState<string | null>(null);
  const [postFeeling, setPostFeeling] = useState('');

  const FEELINGS = [
    { emoji: '💪', label: 'Beast Mode' },
    { emoji: '🔥', label: 'On Fire' },
    { emoji: '😤', label: 'Pushed Hard' },
    { emoji: '😊', label: 'Feeling Good' },
    { emoji: '🥵', label: 'Exhausted' },
    { emoji: '🏆', label: 'New PR' },
  ];

  async function pickPostImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const { compressImage } = require('../../../src/lib/imageUtils');
      const compressed = await compressImage(result.assets[0].uri, 'post');
      setPostImageUri(compressed);
    }
  }

  async function handlePost() {
    if (!postContent.trim() || posting) return;
    const content = postFeeling
      ? `${postFeeling} ${postContent.trim()}`
      : postContent.trim();
    const success = await createPost(content, SPORT_TABS[sportTab]);
    if (success) {
      setPostContent('');
      setPostImageUri(null);
      setPostFeeling('');
      setShowCompose(false);
      refetchFeed();
    } else {
      Alert.alert('Error', 'Could not create post. Please try again.');
    }
  }

  // Get post IDs for beast-check query
  const postIds = (feedData || []).map((p: any) => p.id).filter(Boolean);
  const { data: userBeastsData } = useUserBeasts(postIds);
  const beastedPostIds = new Set((userBeastsData || []).map((b: any) => b.post_id));

  // Map Supabase data to component format, fallback to demo
  const posts: DemoPost[] = feedData?.length
    ? feedData.map((post: any) => ({
        id: post.id,
        name: post.author?.display_name || post.author?.full_name || 'Beast',
        tier: (post.author?.tier || 'initiate') as Tier,
        avatarUrl: post.author?.avatar_url,
        content: post.content || '',
        timeAgo: formatRelativeTime(post.created_at),
        beastCount: post.beast_count?.[0]?.count || 0,
        hasBeasted: beastedPostIds.has(post.id),
        xpEarned: post.xp_earned || 0,
        commentCount: post.comment_count || 0,
        imageUrl: post.image_url,
        workoutName: post.workout_name,
        stats: post.stats,
        reactorNames: [],
      }))
    : DEMO_POSTS;

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

        {/* Page title + Community Hub label */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>TRIBE</Text>
          <Text style={styles.communityLabel}>COMMUNITY HUB</Text>
        </View>

        {/* Underline tabs: Feed / Events */}
        <View style={styles.underlineTabs}>
          <TouchableOpacity
            style={styles.underlineTab}
            onPress={() => setViewTab(0)}
            activeOpacity={0.7}
          >
            <Text style={[styles.underlineTabText, viewTab === 0 && styles.underlineTabTextActive]}>
              Feed
            </Text>
            {viewTab === 0 && <View style={styles.underlineIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.underlineTab}
            onPress={() => {
              setViewTab(1);
              router.push('/(tabs)/feed/events');
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.underlineTabText, viewTab === 1 && styles.underlineTabTextActive]}>
              Events
            </Text>
            {viewTab === 1 && <View style={styles.underlineIndicator} />}
          </TouchableOpacity>
        </View>

        {/* Sport filter pills */}
        <FilterTabs tabs={SPORT_TABS} activeIndex={sportTab} onTabPress={setSportTab} size="small" />

        {/* Beast Roar leaderboard banner */}
        <TouchableOpacity
          style={styles.roarBanner}
          activeOpacity={0.7}
          onPress={() => router.push('/(tabs)/feed/leaderboard')}
        >
          <View style={styles.roarContent}>
            <View style={styles.roarLeft}>
              <View style={styles.roarTitleRow}>
                <Ionicons name="trophy" size={18} color={COLORS.orange} />
                <Text style={styles.roarTitle}>BEAST ROAR</Text>
              </View>
              <Text style={styles.roarSeason}>Leaderboard · Season 4</Text>
              <View style={styles.roarButton}>
                <Text style={styles.roarButtonText}>VIEW RANKINGS</Text>
              </View>
            </View>
            {/* Visual bars on right side */}
            <View style={styles.roarBars}>
              <View style={[styles.roarBar, { height: 40, backgroundColor: 'rgba(86,196,196,0.3)' }]} />
              <View style={[styles.roarBar, { height: 56, backgroundColor: 'rgba(86,196,196,0.5)' }]} />
              <View style={[styles.roarBar, { height: 32, backgroundColor: 'rgba(86,196,196,0.2)' }]} />
            </View>
          </View>
        </TouchableOpacity>

        {/* Feed posts */}
        {loading ? (
          <ActivityIndicator color={COLORS.aqua} style={{ marginTop: 40 }} />
        ) : (
          posts.map((post) => (
            <FeedPost
              key={post.id}
              name={post.name}
              tier={post.tier}
              content={post.content}
              timeAgo={post.timeAgo}
              beastCount={post.beastCount}
              hasBeasted={post.hasBeasted}
              xpEarned={post.xpEarned}
              commentCount={post.commentCount}
              imageUrl={post.imageUrl}
              localImage={post.localImage}
              workoutName={post.workoutName}
              stats={post.stats}
              reactorNames={post.reactorNames}
              avatarUrl={(post as any).avatarUrl}
              avatarLocalImage={post.avatarLocalImage}
              onBeast={async () => {
                if (post.id && !post.id.startsWith('demo-')) {
                  await toggleBeast(post.id, post.hasBeasted);
                  refetchFeed();
                }
              }}
              onMenu={() => {
                const isOwnPost = post.name === (profile?.display_name || profile?.full_name);
                setMenuPost({ id: post.id, isOwn: isOwnPost });
              }}
            />
          ))
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Compose FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => setShowCompose(true)}
      >
        <Ionicons name="add" size={28} color={COLORS.dark} />
      </TouchableOpacity>

      {/* Post Menu Modal */}
      <Modal visible={!!menuPost} transparent animationType="fade">
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setMenuPost(null)}>
          <View style={styles.menuSheet}>
            {menuPost?.isOwn && (
              <TouchableOpacity style={styles.menuItem} onPress={() => menuPost && handleDeletePost(menuPost.id)}>
                <Ionicons name="trash-outline" size={18} color="#EF5350" />
                <Text style={styles.menuItemTextDanger}>Delete Post</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.menuItem} onPress={() => setMenuPost(null)}>
              <Ionicons name="flag-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.menuItemText}>Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItemCancel} onPress={() => setMenuPost(null)}>
              <Text style={styles.menuItemTextCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Compose Post Modal */}
      <Modal visible={showCompose} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Share with the tribe</Text>

            {/* Feelings */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12, maxHeight: 40 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {FEELINGS.map(f => (
                  <TouchableOpacity key={f.label}
                    onPress={() => setPostFeeling(postFeeling === `${f.emoji} ${f.label}` ? '' : `${f.emoji} ${f.label}`)}
                    style={[styles.feelingChip, postFeeling === `${f.emoji} ${f.label}` && styles.feelingChipActive]}>
                    <Text style={styles.feelingText}>{f.emoji} {f.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TextInput
              style={styles.composeInput}
              placeholder="What did you crush today?"
              placeholderTextColor={COLORS.textMuted}
              value={postContent}
              onChangeText={setPostContent}
              multiline
              maxLength={500}
              autoFocus
            />

            {/* Image attachment */}
            {postImageUri ? (
              <View style={{ position: 'relative', marginBottom: 10 }}>
                <Image source={{ uri: postImageUri }} style={{ width: '100%', height: 160, borderRadius: 12 }} resizeMode="cover" />
                <TouchableOpacity onPress={() => setPostImageUri(null)}
                  style={{ position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 4 }}>
                  <Ionicons name="close" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <TouchableOpacity onPress={pickPostImage} style={styles.attachBtn}>
                <Ionicons name="camera-outline" size={20} color={COLORS.orange} />
                <Text style={{ color: COLORS.orange, fontSize: 12, marginLeft: 6 }}>Add Photo</Text>
              </TouchableOpacity>
              <Text style={[styles.charCount, { flex: 1, textAlign: 'right' }]}>{postContent.length}/500</Text>
            </View>

            <Button
              title={posting ? 'Posting...' : 'Post'}
              onPress={handlePost}
              disabled={posting || !postContent.trim()}
            />
            <TouchableOpacity onPress={() => { setShowCompose(false); setPostImageUri(null); setPostFeeling(''); }} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 0,
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

  /* Beast Roar banner */
  roarBanner: {
    backgroundColor: 'rgba(86,196,196,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(86,196,196,0.18)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  roarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roarLeft: {
    flex: 1,
  },
  roarTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roarTitle: {
    fontSize: 18,
    fontFamily: FONTS.heading,
    color: COLORS.orange,
    letterSpacing: 1,
  },
  roarSeason: {
    fontSize: 12,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  roarButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.orange,
    backgroundColor: 'transparent',
  },
  roarButtonText: {
    fontSize: 11,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.orange,
    letterSpacing: 1,
  },
  roarBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginLeft: 16,
  },
  roarBar: {
    width: 18,
    borderRadius: 4,
  },

  /* Compose FAB */
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.orange,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },

  /* Compose Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,
    marginBottom: 14,
  },
  composeInput: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    fontFamily: FONTS.body,
    color: COLORS.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 4,
  },
  charCount: {
    fontSize: 10,
    fontFamily: FONTS.body,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginBottom: 12,
  },
  cancelButton: { alignItems: 'center', marginTop: 10 },
  cancelText: { fontSize: 13, fontFamily: FONTS.bodyMedium, color: COLORS.textTertiary },
  feelingChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  feelingChipActive: { borderColor: COLORS.orange, backgroundColor: 'rgba(232,143,36,0.1)' },
  feelingText: { fontSize: 11, color: COLORS.textSecondary },
  attachBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },

  // Post menu
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  menuSheet: { width: '75%', backgroundColor: COLORS.background, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  menuItemText: { fontSize: 14, fontFamily: FONTS.bodyMedium, color: COLORS.textPrimary },
  menuItemTextDanger: { fontSize: 14, fontFamily: FONTS.bodyMedium, color: '#EF5350' },
  menuItemCancel: { paddingVertical: 14, alignItems: 'center' },
  menuItemTextCancel: { fontSize: 14, fontFamily: FONTS.bodyMedium, color: COLORS.textTertiary },
});
