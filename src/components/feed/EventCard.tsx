import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ImageBackground, ImageSourcePropType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS } from '../../lib/constants';

interface EventCardProps {
  type: string;
  typeColor?: string;
  title: string;
  details: string;
  buttonLabel?: string;
  difficulty?: string;
  joined?: boolean;
  joining?: boolean;
  onPress: () => void;
  onEnter?: () => void;
  /** Remote image URL for the card background */
  imageUrl?: string;
  isWomenOnly?: boolean;
  /** Local require() image for the card background */
  localImage?: ImageSourcePropType;
}

export function EventCard({
  type,
  typeColor,
  title,
  details,
  buttonLabel = 'Join',
  joined = false,
  joining = false,
  onPress,
  onEnter,
  difficulty,
  isWomenOnly,
  imageUrl,
  localImage,
}: EventCardProps) {
  const womenPink = '#E8729A';
  const difficultyConfig = difficulty ? {
    easy: { label: 'Easy', color: '#62B797' },
    medium: { label: 'Medium', color: '#E88F24' },
    hard: { label: 'Hard', color: '#EF5350' },
  }[difficulty] : null;
  const detailLines = details.split('\n');
  const mainDetails = detailLines[0] || '';
  const countLine = detailLines[1] || '';
  const hasImage = !!(imageUrl || localImage);
  const imageSource = localImage || (imageUrl ? { uri: imageUrl } : undefined);

  const cardInner = (
    <>
      {/* Dark gradient overlay when image is present */}
      {hasImage && (
        <LinearGradient
          colors={['rgba(1,42,42,0.55)', 'rgba(1,42,42,0.92)']}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* Left accent bar — only when no image */}
      {!hasImage && (
        <View style={[styles.accentBar, { backgroundColor: isWomenOnly ? womenPink : (typeColor || COLORS.orange) }]} />
      )}

      <View style={styles.cardContent}>
        {/* Type label + difficulty */}
        <View style={styles.typeRow}>
          <Ionicons
            name="calendar-outline"
            size={12}
            color={typeColor || COLORS.orange}
            style={styles.typeIcon}
          />
          <Text style={[styles.type, typeColor ? { color: typeColor } : null]}>{type}</Text>
          {difficultyConfig && (
            <View style={[styles.difficultyBadge, { backgroundColor: `${difficultyConfig.color}20`, borderColor: `${difficultyConfig.color}40` }]}>
              <Text style={[styles.difficultyText, { color: difficultyConfig.color }]}>{difficultyConfig.label}</Text>
            </View>
          )}
          {isWomenOnly && (
            <View style={[styles.difficultyBadge, { backgroundColor: 'rgba(232,114,154,0.15)', borderColor: 'rgba(232,114,154,0.3)' }]}>
              <Text style={[styles.difficultyText, { color: womenPink }]}>Women Only</Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={[styles.title, hasImage && styles.titleWithImage]}>{title}</Text>

        {/* Details */}
        <Text style={styles.details}>{mainDetails}</Text>

        {/* RSVP count */}
        {countLine ? (
          <View style={styles.countRow}>
            <Ionicons name="people-outline" size={12} color={COLORS.aqua} />
            <Text style={styles.countText}>{countLine}</Text>
          </View>
        ) : null}

        {/* Join / Enter button */}
        <TouchableOpacity
          style={[styles.btn, joined && styles.btnJoined, joining && styles.btnJoining]}
          onPress={joined && onEnter ? onEnter : onPress}
          activeOpacity={0.7}
          disabled={joining}
        >
          {joining ? (
            <ActivityIndicator size="small" color={COLORS.teal} />
          ) : (
            <View style={styles.btnInner}>
              <Ionicons
                name={joined ? 'chatbubbles' : 'arrow-forward-circle'}
                size={16}
                color={joined ? COLORS.aqua : COLORS.dark}
              />
              <Text style={[styles.btnText, joined && styles.btnTextJoined]}>
                {joined ? 'Enter' : buttonLabel}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  // With background image
  if (hasImage && imageSource) {
    return (
      <View style={[styles.cardWrapper, joined && styles.cardJoined, isWomenOnly && { borderColor: 'rgba(232,114,154,0.3)', backgroundColor: 'rgba(232,114,154,0.03)' }]}>
        <ImageBackground
          source={imageSource}
          style={styles.imageBackground}
          imageStyle={styles.imageStyle}
          resizeMode="cover"
        >
          {cardInner}
        </ImageBackground>
      </View>
    );
  }

  // Without background image
  return (
    <View style={[styles.card, joined && styles.cardJoined]}>
      {cardInner}
    </View>
  );
}

const styles = StyleSheet.create({
  /* Card without image */
  card: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 16,
    marginBottom: 10,
    backgroundColor: COLORS.cardBg,
    overflow: 'hidden',
  },

  /* Card with image wrapper */
  cardWrapper: {
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardJoined: {
    borderColor: 'rgba(98,183,151,0.3)',
  },
  imageBackground: {
    width: '100%',
    minHeight: 160,
    flexDirection: 'row',
  },
  imageStyle: {
    borderRadius: 15,
  },

  /* Shared inner layout */
  accentBar: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    padding: 14,
    justifyContent: 'flex-end',
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typeIcon: {
    marginRight: 2,
  },
  type: {
    fontSize: 10,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.orange,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  difficultyBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  difficultyText: {
    fontSize: 8,
    fontFamily: FONTS.bodySemiBold,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 15,
    fontFamily: FONTS.heading,
    color: COLORS.textPrimary,  // Dark on light cards
    marginTop: 6,
  },
  titleWithImage: {
    fontSize: 18,
    color: '#FFFFFF',           // White on dark gradient
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  details: {
    fontSize: 12,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  countText: {
    fontSize: 11,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.aqua,
  },
  btn: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: COLORS.orange,
    minWidth: 100,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnJoined: {
    backgroundColor: 'rgba(98,183,151,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(98,183,151,0.4)',
  },
  btnJoining: {
    opacity: 0.7,
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnText: {
    fontSize: 11,
    fontFamily: FONTS.bodySemiBold,
    color: '#FFFFFF',           // Always white on orange button
    letterSpacing: 0.5,
  },
  btnTextJoined: {
    color: COLORS.green,
  },
});
