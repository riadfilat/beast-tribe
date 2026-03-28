import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FilterTabs, Button } from '../../../src/components/ui';
import { FeedPost } from '../../../src/components/feed/FeedPost';
import { COLORS, FONTS, Tier } from '../../../src/lib/constants';
import { useFeedPosts, useToggleBeast, useUserBeasts, useCreatePost } from '../../../src/hooks';
import { formatRelativeTime } from '../../../src/utils/format';
import { useAuth } from '../../../src/providers/AuthProvider';

const VIEW_TABS = ['Feed', 'Events'];
const SPORT_TABS = ['All', 'Running', 'Gym', 'Yoga', 'Swimming'];

const DEMO_POSTS = [
  {
    id: 'demo-1',
    name: 'Sara M.',
    tier: 'untamed' as Tier,
    content: 'Crushed a 45-min Pilates session. Core on fire.',
    timeAgo: '2h ago',
    beastCount: 18,
    hasBeasted: true,
  },
  {
    id: 'demo-2',
    name: 'Khalid A.',
    tier: 'forged' as Tier,
    content: "New PR! Sub-27 min 5K. Two months ago I couldn't run 2K.",
    timeAgo: '4h ago',
    beastCount: 0,
    hasBeasted: false,
  },
  {
    id: 'demo-3',
    name: 'Noura R.',
    tier: 'raw' as Tier,
    content: 'Day 1 done. First yoga class ever. Every beast starts somewhere.',
    timeAgo: '5h ago',
    beastCount: 0,
    hasBeasted: false,
  },
];

export default function FeedScreen() {
  const router = useRouter();
  const [viewTab, setViewTab] = useState(0);
  const [sportTab, setSportTab] = useState(0);

  const { user } = useAuth();
  const { data: feedData, loading, refetch: refetchFeed } = useFeedPosts(SPORT_TABS[sportTab]);
  const { toggleBeast } = useToggleBeast();
  const { createPost, loading: posting } = useCreatePost();

  // Compose modal state
  const [showCompose, setShowCompose] = useState(false);
  const [postContent, setPostContent] = useState('');

  async function handlePost() {
    if (!postContent.trim()) return;
    const success = await createPost(postContent, SPORT_TABS[sportTab]);
    if (success) {
      setPostContent('');
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
  const posts = feedData?.length
    ? feedData.map((post: any) => ({
        id: post.id,
        name: post.author?.display_name || post.author?.full_name || 'Beast',
        tier: (post.author?.tier || 'raw') as Tier,
        content: post.content || '',
        timeAgo: formatRelativeTime(post.created_at),
        beastCount: post.beast_count?.[0]?.count || 0,
        hasBeasted: beastedPostIds.has(post.id),
      }))
    : DEMO_POSTS;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Tribe</Text>

        <FilterTabs
          tabs={VIEW_TABS}
          activeIndex={viewTab}
          onTabPress={(i) => {
            setViewTab(i);
            if (i === 1) router.push('/(tabs)/feed/events');
          }}
        />
        <FilterTabs tabs={SPORT_TABS} activeIndex={sportTab} onTabPress={setSportTab} size="small" />

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
              onBeast={async () => {
                if (post.id && !post.id.startsWith('demo-')) {
                  await toggleBeast(post.id, post.hasBeasted);
                  refetchFeed();
                }
              }}
            />
          ))
        )}

        {/* Beast Roar + Leaderboard banner */}
        <TouchableOpacity
          style={styles.roarBanner}
          activeOpacity={0.7}
          onPress={() => router.push('/(tabs)/feed/leaderboard')}
        >
          <Text style={styles.roarTitle}>Beast Roar · Leaderboard</Text>
          <Text style={styles.roarSub}>Vote for this week's most inspiring transformation!</Text>
          <Text style={styles.roarLink}>View rankings →</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Compose FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => setShowCompose(true)}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Compose Post Modal */}
      <Modal visible={showCompose} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Share with the tribe</Text>
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
            <Text style={styles.charCount}>{postContent.length}/500</Text>
            <Button
              title={posting ? 'Posting...' : 'Post'}
              onPress={handlePost}
              disabled={posting || !postContent.trim()}
            />
            <TouchableOpacity onPress={() => setShowCompose(false)} style={styles.cancelButton}>
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
  title: {
    fontSize: 22,
    fontFamily: FONTS.heading,
    color: COLORS.white,
    marginTop: 8,
    marginBottom: 10,
  },
  roarBanner: {
    backgroundColor: 'rgba(232,143,36,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(232,143,36,0.15)',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  roarTitle: {
    fontSize: 12,
    fontFamily: FONTS.heading,
    color: COLORS.orange,
  },
  roarSub: {
    fontSize: 10,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  roarLink: {
    fontSize: 11,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.orange,
    marginTop: 4,
  },
  // Compose FAB
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
  fabIcon: {
    fontSize: 28,
    color: COLORS.teal,
    fontFamily: FONTS.heading,
    marginTop: -2,
  },
  // Compose Modal
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
    color: COLORS.white,
    marginBottom: 14,
  },
  composeInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    fontFamily: FONTS.body,
    color: COLORS.white,
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
});
