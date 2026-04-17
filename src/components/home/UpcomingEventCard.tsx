import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ImageBackground, ImageSourcePropType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS } from '../../lib/constants';

interface UpcomingEventCardProps {
  type: string;
  title: string;
  details: string;
  date?: string;
  location?: string;
  joined?: boolean;
  joining?: boolean;
  onJoin: () => void;
  onPress?: () => void;
  localImage?: ImageSourcePropType;
  imageUrl?: string;
}

export function UpcomingEventCard({
  type,
  title,
  details,
  date,
  location,
  joined = false,
  joining = false,
  onJoin,
  onPress,
  localImage,
  imageUrl,
}: UpcomingEventCardProps) {
  // Prefer uploaded image, fall back to local asset
  const imageSource = imageUrl ? { uri: imageUrl } : localImage || null;

  // The whole card is tappable — JOIN when not joined, ENTER when joined
  function handleCardPress() {
    if (joining) return;
    if (joined && onPress) {
      onPress();
    } else if (!joined) {
      onJoin();
    }
  }

  const content = (
    <>
      {/* Date tag */}
      {date && (
        <View style={styles.dateTag}>
          <Text style={styles.dateTagText}>{date}</Text>
        </View>
      )}

      {/* Type watermark */}
      {type ? <Text style={styles.typeWatermark}>{type}</Text> : null}

      {/* Title + button row */}
      <View style={styles.bottomRow}>
        <View style={styles.titleArea}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {location ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={12} color={COLORS.green} />
              <Text style={styles.locationText}>{location}</Text>
            </View>
          ) : null}
          {!location && details ? <Text style={styles.details}>{details}</Text> : null}
        </View>
        <View style={[joined ? styles.statusBadge : styles.joinBtn]}>
          {joining ? (
            <ActivityIndicator size="small" color={COLORS.dark} />
          ) : joined ? (
            <>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.green} />
              <Text style={styles.statusText}>JOINED</Text>
            </>
          ) : (
            <Text style={styles.joinText}>JOIN</Text>
          )}
        </View>
      </View>

      {/* Enter hint when joined */}
      {joined && (
        <View style={styles.enterRow}>
          <Ionicons name="chatbubbles-outline" size={14} color={COLORS.aqua} />
          <Text style={styles.enterText}>Tap to enter event</Text>
          <Ionicons name="chevron-forward" size={12} color={COLORS.textTertiary} />
        </View>
      )}
    </>
  );

  if (imageSource) {
    return (
      <TouchableOpacity onPress={handleCardPress} activeOpacity={0.8}>
        <ImageBackground
          source={imageSource}
          style={styles.card}
          imageStyle={styles.imageStyle}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(1,30,30,0.3)', 'rgba(1,30,30,0.85)', 'rgba(1,30,30,0.95)']}
            style={styles.gradient}
          >
            {content}
          </LinearGradient>
        </ImageBackground>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={handleCardPress} activeOpacity={0.8}>
      <View style={[styles.card, styles.cardNoImage]}>
        {content}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
    minHeight: 160,
  },
  cardNoImage: {
    backgroundColor: 'rgba(232,143,36,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(232,143,36,0.15)',
    padding: 16,
    justifyContent: 'flex-end',
  },
  imageStyle: {
    borderRadius: 16,
  },
  gradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'flex-end',
    borderRadius: 16,
  },
  dateTag: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.orange,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  dateTagText: {
    fontSize: 9,
    fontFamily: FONTS.bodySemiBold,
    color: '#FFFFFF',           // Always white on orange tag
    letterSpacing: 0.5,
  },
  typeWatermark: {
    fontSize: 32,
    fontFamily: FONTS.heading,
    color: 'rgba(255,255,255,0.08)',
    position: 'absolute',
    top: 16,
    right: 16,
    textTransform: 'uppercase',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  titleArea: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontFamily: FONTS.heading,
    color: '#FFFFFF',           // Always white — sits on dark gradient
    textTransform: 'uppercase',
    lineHeight: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 11,
    fontFamily: FONTS.body,
    color: 'rgba(255,255,255,0.7)', // Always light — on dark gradient
  },
  details: {
    fontSize: 11,
    fontFamily: FONTS.body,
    color: 'rgba(255,255,255,0.7)', // Always light — on dark gradient
    marginTop: 3,
  },
  joinBtn: {
    backgroundColor: COLORS.orange,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinText: {
    fontSize: 12,
    fontFamily: FONTS.heading,
    color: '#FFFFFF',           // Always white on orange button
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(98,183,151,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(98,183,151,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 10,
    fontFamily: FONTS.heading,
    color: COLORS.green,
    letterSpacing: 0.5,
  },
  enterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  enterText: {
    flex: 1,
    fontSize: 11,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.aqua,
  },
});
