import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageSourcePropType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, TierPill } from '../ui';
import { COLORS, FONTS, Tier } from '../../lib/constants';

interface FeedPostProps {
  name: string;
  tier: Tier;
  content: string;
  timeAgo: string;
  beastCount: number;
  hasBeasted: boolean;
  onBeast: () => void;
  xpEarned?: number;
  commentCount?: number;
  imageUrl?: string;
  localImage?: ImageSourcePropType;
  workoutName?: string;
  stats?: { label: string; value: string }[];
  reactorNames?: string[];
  avatarUrl?: string;
  avatarLocalImage?: ImageSourcePropType;
  onComment?: () => void;
  onMenu?: () => void;
}

export function FeedPost({
  name,
  tier,
  content,
  timeAgo,
  beastCount,
  hasBeasted,
  onBeast,
  xpEarned,
  commentCount = 0,
  imageUrl,
  localImage,
  workoutName,
  stats,
  reactorNames = [],
  avatarUrl,
  avatarLocalImage,
  onComment,
  onMenu,
}: FeedPostProps) {
  // Highlight workout name in content if provided
  const renderContent = () => {
    if (!workoutName) {
      return <Text style={styles.content}>{content}</Text>;
    }

    const parts = content.split(workoutName);
    if (parts.length < 2) {
      return <Text style={styles.content}>{content}</Text>;
    }

    return (
      <Text style={styles.content}>
        {parts[0]}
        <Text style={styles.contentHighlight}>{workoutName}</Text>
        {parts.slice(1).join(workoutName)}
      </Text>
    );
  };

  return (
    <View style={styles.card}>
      {/* Header row */}
      <View style={styles.header}>
        <Avatar name={name} size={42} tier={tier} imageUrl={avatarUrl} localImage={avatarLocalImage} />
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{name}</Text>
            <TierPill tier={tier} size="small" />
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.time}>{timeAgo}</Text>
            {xpEarned ? (
              <>
                <Text style={styles.metaDot}> · </Text>
                <Text style={styles.xpBadge}>+{xpEarned} XP</Text>
              </>
            ) : null}
          </View>
        </View>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={onMenu}
          activeOpacity={0.6}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="ellipsis-horizontal" size={18} color={COLORS.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>

      {/* Image with stat overlay */}
      {(imageUrl || localImage) ? (
        <View style={styles.imageContainer}>
          <Image source={localImage || { uri: imageUrl }} style={styles.image} resizeMode="cover" />
          {stats && stats.length > 0 && (
            <View style={styles.statsOverlay}>
              {stats.map((stat, i) => (
                <View key={i} style={styles.statItem}>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  <Text style={styles.statValue}>{stat.value}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ) : null}

      {/* Bottom row: reactions + beast button */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          {/* Reactor avatars */}
          {beastCount > 0 && (
            <View style={styles.reactors}>
              {reactorNames.slice(0, 3).map((rName, i) => (
                <View key={i} style={[styles.reactorAvatar, { marginLeft: i > 0 ? -8 : 0, zIndex: 3 - i }]}>
                  <Avatar name={rName} size={24} />
                </View>
              ))}
              {beastCount > 3 && (
                <Text style={styles.reactorCount}>+{beastCount - 3}</Text>
              )}
              {beastCount <= 3 && beastCount > 0 && reactorNames.length === 0 && (
                <Text style={styles.reactorCount}>{beastCount}</Text>
              )}
            </View>
          )}

          {/* Comment count */}
          {commentCount > 0 && (
            <TouchableOpacity style={styles.commentBtn} onPress={onComment} activeOpacity={0.7}>
              <Ionicons name="chatbubble-outline" size={14} color={COLORS.textTertiary} />
              <Text style={styles.commentText}>{commentCount} COMMENTS</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Give Beast button */}
        <TouchableOpacity
          style={[styles.beastBtn, hasBeasted && styles.beastBtnActive]}
          onPress={onBeast}
          activeOpacity={0.7}
        >
          <Ionicons
            name={hasBeasted ? 'heart' : 'flash'}
            size={16}
            color={hasBeasted ? COLORS.orange : COLORS.orange}
          />
          <Text style={[styles.beastText, hasBeasted && styles.beastTextActive]}>
            {hasBeasted ? `${beastCount} BEASTS` : 'GIVE BEAST'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 14,
    fontFamily: FONTS.heading,
    color: COLORS.white,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  time: {
    fontSize: 11,
    fontFamily: FONTS.body,
    color: COLORS.textTertiary,
  },
  metaDot: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  xpBadge: {
    fontSize: 11,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.orange,
  },
  menuButton: {
    padding: 4,
  },
  contentContainer: {
    marginTop: 12,
    marginBottom: 4,
  },
  content: {
    fontSize: 15,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.white,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  contentHighlight: {
    color: COLORS.orange,
    fontFamily: FONTS.bodyBold,
  },
  imageContainer: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  statsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  statItem: {},
  statLabel: {
    fontSize: 10,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.orange,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 18,
    fontFamily: FONTS.heading,
    color: COLORS.white,
    marginTop: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reactors: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reactorAvatar: {},
  reactorCount: {
    fontSize: 11,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  commentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentText: {
    fontSize: 10,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.textTertiary,
    letterSpacing: 0.5,
  },
  beastBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(232,143,36,0.3)',
    backgroundColor: 'rgba(232,143,36,0.08)',
  },
  beastBtnActive: {
    backgroundColor: 'rgba(232,143,36,0.18)',
    borderColor: COLORS.orange,
  },
  beastText: {
    fontSize: 11,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.orange,
    letterSpacing: 0.5,
  },
  beastTextActive: {
    color: COLORS.orange,
  },
});
