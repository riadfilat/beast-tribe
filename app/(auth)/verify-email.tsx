import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../src/components/ui';
import { useAuth } from '../../src/providers/AuthProvider';
import { supabase } from '../../src/lib/supabase';
import { COLORS, FONTS } from '../../src/lib/constants';

type Status = 'idle' | 'checking' | 'resending' | 'resent' | 'error';

export default function VerifyEmailScreen() {
  const { user, signOut, refreshSession } = useAuth();
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const email = user?.email ?? '';

  async function handleCheck() {
    setStatus('checking');
    setErrorMsg('');
    try {
      await refreshSession();
      // AuthGate will automatically redirect once isEmailConfirmed becomes true
    } catch {
      setStatus('error');
      setErrorMsg('Could not refresh. Please try again.');
    } finally {
      setStatus('idle');
    }
  }

  async function handleResend() {
    if (!email) return;
    setStatus('resending');
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      setStatus('resent');
    } catch (e: any) {
      setStatus('error');
      setErrorMsg(e.message || 'Failed to resend. Please try again.');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        {/* Icon */}
        <View style={styles.iconWrap}>
          <Ionicons name="mail-unread-outline" size={56} color={COLORS.aqua} />
        </View>

        <Text style={styles.title}>Confirm your email</Text>
        <Text style={styles.body}>
          We sent a confirmation link to
        </Text>
        <Text style={styles.email}>{email}</Text>
        <Text style={styles.sub}>
          Click the link in the email to verify your account. Check your spam folder if you don't see it.
        </Text>

        {/* Status feedback */}
        {status === 'resent' && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.green} />
            <Text style={styles.successText}>Confirmation email resent!</Text>
          </View>
        )}
        {status === 'error' && errorMsg ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color="#EF5B5B" />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Primary CTA — check if confirmed */}
        <Button
          title={status === 'checking' ? 'Checking…' : "I've confirmed my email"}
          onPress={handleCheck}
          loading={status === 'checking'}
        />

        {/* Resend */}
        <TouchableOpacity
          style={styles.resendRow}
          onPress={handleResend}
          disabled={status === 'resending' || status === 'resent'}
          activeOpacity={0.7}
        >
          {status === 'resending' ? (
            <ActivityIndicator size="small" color={COLORS.aqua} />
          ) : (
            <Text style={[styles.resendText, status === 'resent' && styles.resendTextDone]}>
              {status === 'resent' ? 'Email sent ✓' : 'Resend confirmation email'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutRow} onPress={signOut} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.signOutText}>Use a different account</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },

  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(86,196,196,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(86,196,196,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  title: {
    fontSize: 24,
    fontFamily: FONTS.heading,
    color: COLORS.white,
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  email: {
    fontSize: 14,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.aqua,
    textAlign: 'center',
  },
  sub: {
    fontSize: 12,
    fontFamily: FONTS.body,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },

  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(98,183,151,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(98,183,151,0.25)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: '100%',
  },
  successText: {
    fontSize: 12,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.green,
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239,91,91,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,91,91,0.25)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: '100%',
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONTS.body,
    color: '#EF5B5B',
  },

  resendRow: {
    marginTop: 4,
    paddingVertical: 8,
    alignItems: 'center',
  },
  resendText: {
    fontSize: 13,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.aqua,
  },
  resendTextDone: {
    color: COLORS.green,
  },

  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 8,
  },
  signOutText: {
    fontSize: 12,
    fontFamily: FONTS.body,
    color: COLORS.textMuted,
  },
});
