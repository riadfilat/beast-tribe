import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/ui';
import { COLORS, FONTS } from '../../src/lib/constants';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={[COLORS.teal, COLORS.teal, '#011E1E']}
      locations={[0, 0.45, 1]}
      start={{ x: 0.3, y: 0 }}
      end={{ x: 0.7, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Operation Beast Logo */}
          <Image
            source={require('../../assets/images/ob-logo-stacked-teal.jpg')}
            style={styles.obLogo}
            resizeMode="contain"
          />

          <View style={styles.divider} />

          <Text style={styles.title}>
            Beast <Text style={styles.titleAccent}>Tribe</Text>
          </Text>

          <Text style={styles.subtitle}>
            Your fitness tribe awaits.{'\n'}Set goals. Train together.{'\n'}Unleash the beast.
          </Text>

          <View style={styles.buttons}>
            <Button
              title="Create account"
              onPress={() => router.push('/(auth)/sign-in?mode=signup')}
            />
            <Button
              title="Sign in"
              variant="secondary"
              onPress={() => router.push('/(auth)/sign-in')}
            />
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  content: {
    alignItems: 'center',
  },
  obLogo: {
    width: 220,
    height: 220,
    marginBottom: 16,
    borderRadius: 24,
  },
  divider: {
    width: 48,
    height: 2,
    backgroundColor: COLORS.orange,
    marginBottom: 20,
    borderRadius: 1,
  },
  title: {
    fontSize: 44,
    fontFamily: FONTS.heading,
    color: COLORS.white,
    letterSpacing: -1,
  },
  titleAccent: {
    color: COLORS.orange,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: FONTS.body,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 24,
    marginTop: 10,
    marginBottom: 40,
  },
  buttons: {
    width: '100%',
    gap: 8,
  },
});
