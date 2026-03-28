import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input } from '../../src/components/ui';
import { useAuth } from '../../src/providers/AuthProvider';
import { COLORS, FONTS } from '../../src/lib/constants';

export default function SignInScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isSignUp = mode === 'signup';
  const router = useRouter();
  const { signIn, signUp } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (isSignUp && !fullName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Invalid email', 'Please enter a valid email address');
      return;
    }

    // Password validation (sign-up only)
    if (isSignUp && password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password, fullName);
      } else {
        await signIn(email, password);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <Text style={styles.title}>{isSignUp ? 'Create profile' : 'Welcome back, Beast'}</Text>
        <Text style={styles.subtitle}>
          {isSignUp ? 'Every beast starts here. Unleash the beast.' : 'Your tribe awaits. Let\'s go.'}
        </Text>

        <View style={styles.form}>
          {isSignUp && (
            <Input
              label="Name"
              placeholder="Ahmed Failat"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          )}
          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <Button
          title={isSignUp ? 'Create profile' : 'Sign in'}
          onPress={handleSubmit}
          loading={loading}
        />

        <Text style={styles.toggleText}>
          {isSignUp ? 'Already a member? ' : "Don't have an account? "}
          <Text
            style={styles.toggleLink}
            onPress={() =>
              router.setParams({ mode: isSignUp ? undefined : 'signup' })
            }
          >
            {isSignUp ? 'Sign in' : 'Create profile'}
          </Text>
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: FONTS.heading,
    color: COLORS.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
    marginBottom: 28,
  },
  form: {
    marginBottom: 16,
  },
  toggleText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 12,
    fontFamily: FONTS.body,
    color: COLORS.textTertiary,
  },
  toggleLink: {
    color: COLORS.aqua,
    fontFamily: FONTS.bodyMedium,
  },
});
