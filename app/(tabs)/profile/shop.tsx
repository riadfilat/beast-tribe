import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../../src/components/ui';
import { COLORS, FONTS } from '../../../src/lib/constants';

export default function ShopScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
        {/* Logo */}
        <View style={styles.logo}>
          <View style={styles.logoCircle} />
        </View>
        <Text style={styles.title}>Operation Beast</Text>
        <Text style={styles.subtitle}>Gear up. Rise up.</Text>

        {/* Collection */}
        <View style={styles.collectionCard}>
          <Text style={styles.collectionTitle}>SS26 Summer Collection</Text>
          <Text style={styles.collectionSub}>5 products · 19 colorways · Built for the heat</Text>
          <View style={styles.productRow}>
            <View style={styles.productThumb}>
              <Text style={styles.productText}>Performance Tee</Text>
            </View>
            <View style={styles.productThumb}>
              <Text style={styles.productText}>Core Energy Set</Text>
            </View>
          </View>
        </View>

        {/* Premium unlock */}
        <View style={styles.premiumCard}>
          <Text style={styles.premiumTitle}>Buy any item = 3 months free premium</Text>
          <Text style={styles.premiumSub}>
            Purchase unlocks full workout library, all sports, nutrition module, pack challenges.
          </Text>
        </View>

        <Button title="Visit operation-beast.com" onPress={() => {}} />
        <Button title="Scan QR from purchase" variant="secondary" onPress={() => {}} />

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1, paddingHorizontal: 16 },
  logo: {
    width: 52, height: 52, borderRadius: 16, backgroundColor: COLORS.dark,
    borderWidth: 2, borderColor: 'rgba(232,143,36,0.25)',
    alignItems: 'center', justifyContent: 'center', marginTop: 20, marginBottom: 12,
  },
  logoCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.orange },
  title: { fontSize: 18, fontFamily: FONTS.heading, color: COLORS.white },
  subtitle: { fontSize: 12, fontFamily: FONTS.body, color: COLORS.textSecondary, marginBottom: 16 },
  collectionCard: {
    width: '100%', backgroundColor: 'rgba(232,143,36,0.06)',
    borderWidth: 1, borderColor: 'rgba(232,143,36,0.2)', borderRadius: 14, padding: 14, marginBottom: 12,
  },
  collectionTitle: { fontSize: 12, fontFamily: FONTS.heading, color: COLORS.orange },
  collectionSub: { fontSize: 10, fontFamily: FONTS.body, color: COLORS.textSecondary, marginTop: 4 },
  productRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  productThumb: {
    flex: 1, height: 70, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  productText: { fontSize: 9, fontFamily: FONTS.body, color: COLORS.textMuted },
  premiumCard: {
    width: '100%', backgroundColor: 'rgba(86,196,196,0.06)',
    borderWidth: 1, borderColor: 'rgba(86,196,196,0.15)', borderRadius: 14, padding: 14, marginBottom: 12,
  },
  premiumTitle: { fontSize: 12, fontFamily: FONTS.heading, color: COLORS.aqua },
  premiumSub: { fontSize: 10, fontFamily: FONTS.body, color: COLORS.textTertiary, marginTop: 4 },
});
