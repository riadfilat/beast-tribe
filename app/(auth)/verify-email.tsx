import React, { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { makeStyles, useKit } from '../../src/theme';
import { useI18n } from '../../src/i18n';
import { useAuth } from '../../src/providers/AuthProvider';
import { supabase } from '../../src/lib/supabase';
import { Txt } from '../../src/components/board/Txt';
import { Icon } from '../../src/components/board/Icon';
import { Sun } from '../../src/components/board/marks';
import { MarkerButton, TextButton } from '../../src/components/board/controls';
import { takeSignIn } from '../../src/lib/pendingSignIn';

type Status = 'idle' | 'checking' | 'resending' | 'resent' | 'error';

export default function VerifyEmailScreen() {
  const s = useStyles();
  const { p } = useKit();
  const { t } = useI18n();
  const { user, signOut, refreshSession } = useAuth();
  // The email comes as a param; the password only from memory (held by sign-up / sign-in).
  const params = useLocalSearchParams<{ email?: string }>();
  const [held] = useState(() => takeSignIn());
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const email = user?.email ?? params.email ?? '';
  const password = held && held.email === email ? held.password : '';

  async function check() {
    setStatus('checking');
    setError('');
    try {
      if (user) {
        await refreshSession();
        return;
      }
      if (!email || !password) {
        setStatus('error');
        setError(t('auth.verify.signInAgain'));
        return;
      }
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) {
        setStatus('error');
        setError(err.message.includes('not confirmed') || err.message.includes('email_not_confirmed') ? t('auth.verify.notYet') : err.message);
        return;
      }
      if (!data.user?.email_confirmed_at && !data.user?.confirmed_at) {
        await supabase.auth.signOut();
        setStatus('error');
        setError(t('auth.verify.notYet'));
      }
    } catch {
      setStatus('error');
      setError(t('auth.verify.failed'));
    } finally {
      setStatus((x) => (x === 'checking' ? 'idle' : x));
    }
  }

  async function resend() {
    if (!email) return;
    setStatus('resending');
    setError('');
    try {
      const { error: err } = await supabase.auth.resend({ type: 'signup', email });
      if (err) throw err;
      setStatus('resent');
    } catch (e: any) {
      setStatus('error');
      setError(e?.message || t('auth.verify.failed'));
    }
  }

  return (
    <SafeAreaView style={s.screen}>
      <View style={s.body}>
        <Sun size={96}>
          <Icon name="mail" size={34} color={p.onMarker} />
        </Sun>
        <Txt v="title" size={28} align="center" style={{ marginTop: 18 }} accessibilityRole="header">
          {t('auth.verify.title')}
        </Txt>
        <Txt v="body" color={p.inkSoft} align="center">
          {t('auth.verify.body')}
        </Txt>
        <Txt v="headline" color={p.aqua} align="center">
          {email}
        </Txt>
        <Txt v="meta" align="center" style={{ marginBottom: 8 }}>
          {t('auth.verify.sub')} {t('auth.spamHint')}
        </Txt>
        {status === 'error' && error ? (
          <Txt v="meta" color={p.danger} align="center">
            {error}
          </Txt>
        ) : null}
        <MarkerButton label={status === 'checking' ? t('auth.verify.checking') : t('auth.verify.check')} onPress={check} loading={status === 'checking'} style={{ alignSelf: 'stretch', marginTop: 8 }} />
        <TextButton
          label={status === 'resent' ? t('auth.verify.resent') : t('auth.verify.resend')}
          onPress={resend}
          disabled={status === 'resending' || status === 'resent'}
          style={{ alignSelf: 'center' }}
        />
        <TextButton label={t('auth.verify.otherAccount')} onPress={signOut} color={p.inkSoft} style={{ alignSelf: 'center' }} />
      </View>
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ p }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 8 },
}));
