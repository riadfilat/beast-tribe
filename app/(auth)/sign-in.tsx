import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { makeStyles, useKit } from '../../src/theme';
import { useI18n } from '../../src/i18n';
import { useAuth } from '../../src/providers/AuthProvider';
import { supabase } from '../../src/lib/supabase';
import { PRIVACY_URL, TERMS_URL } from '../../src/lib/constants';
import { Txt, alignStart } from '../../src/components/board/Txt';
import { Icon } from '../../src/components/board/Icon';
import { Press } from '../../src/components/board/Press';
import { Field, IconButton, MarkerButton, TextButton } from '../../src/components/board/controls';
import { PackMark } from '../../src/components/brand/Logo';

type Step = 'email' | 'name' | 'signup-password' | 'signin-password' | 'forgot' | 'reset-sent';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REQS = [
  { key: 'length', test: (pw: string) => pw.length >= 8 },
  { key: 'upper', test: (pw: string) => /[A-Z]/.test(pw) },
  { key: 'number', test: (pw: string) => /[0-9]/.test(pw) },
  { key: 'special', test: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
] as const;

function strength(pw: string) {
  return REQS.filter((r) => r.test(pw)).length;
}

export default function SignInScreen() {
  const s = useStyles();
  const { p } = useKit();
  const { t, lang } = useI18n();
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isSignUp = mode === 'signup';
  const { signIn, signUp } = useAuth();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [fieldError, setFieldError] = useState('');
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setStep('email');
    clear();
  }, [mode]);

  function clear() {
    setFieldError('');
    setServerError('');
  }

  function next() {
    clear();
    if (step === 'email') {
      if (!email.trim()) return setFieldError(t('auth.errors.emailEmpty'));
      if (!EMAIL_RE.test(email.trim())) return setFieldError(t('auth.errors.emailInvalid'));
      setStep(isSignUp ? 'name' : 'signin-password');
    } else if (step === 'name') {
      if (!fullName.trim()) return setFieldError(t('auth.errors.nameEmpty'));
      if (fullName.trim().length < 2) return setFieldError(t('auth.errors.nameShort'));
      setStep('signup-password');
    }
  }

  async function doSignUp() {
    clear();
    if (!password || password.length < 8 || strength(password) < 2) return setFieldError(t('auth.errors.passwordWeak'));
    if (!agreed) return setServerError(t('auth.errors.terms'));
    setLoading(true);
    try {
      await signUp(email.trim(), password, fullName.trim());
    } catch (e: any) {
      const msg: string = e?.message || '';
      if (msg === 'CHECK_EMAIL_CONFIRMATION' || msg.includes('confirm') || msg.includes('Check your email')) {
        // Carry the credentials so the verify screen can sign in once the link is tapped.
        router.replace({ pathname: '/(auth)/verify-email', params: { email: email.trim(), password } });
        return;
      }
      if (msg.includes('already registered') || msg.includes('already been registered')) setServerError(t('auth.errors.exists'));
      else if (msg.includes('rate limit') || msg.includes('too many')) setServerError(t('auth.errors.rateLimit'));
      else setServerError(msg || t('common.somethingWrong'));
    } finally {
      setLoading(false);
    }
  }

  async function doSignIn() {
    clear();
    if (!password) return setFieldError(t('auth.errors.passwordEmpty'));
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (e: any) {
      const msg: string = e?.message || '';
      if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) setFieldError(t('auth.errors.wrongPassword'));
      else if (msg.includes('Email not confirmed') || msg.includes('email_not_confirmed')) {
        router.replace({ pathname: '/(auth)/verify-email', params: { email: email.trim(), password } });
        return;
      } else if (msg.includes('rate limit') || msg.includes('too many')) setServerError(t('auth.errors.rateLimit'));
      else setServerError(msg || t('common.somethingWrong'));
    } finally {
      setLoading(false);
    }
  }

  async function doReset() {
    clear();
    if (!email.trim()) return setFieldError(t('auth.errors.emailEmpty'));
    if (!EMAIL_RE.test(email.trim())) return setFieldError(t('auth.errors.emailInvalid'));
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) throw error;
      setStep('reset-sent');
    } catch (e: any) {
      setServerError(e?.message || t('auth.errors.resetFailed'));
    } finally {
      setLoading(false);
    }
  }

  function back() {
    clear();
    setPassword('');
    setShow(false);
    if (step === 'name' || step === 'signin-password') setStep('email');
    else if (step === 'signup-password') setStep('name');
    else if (step === 'forgot' || step === 'reset-sent') setStep('signin-password');
    else router.canGoBack() ? router.back() : router.replace('/(auth)/welcome');
  }

  function switchMode() {
    clear();
    setPassword('');
    setAgreed(false);
    router.setParams({ mode: isSignUp ? undefined : 'signup' });
  }

  const steps: Step[] = ['email', 'name', 'signup-password'];
  const eye = (
    <IconButton name={show ? 'eyeOff' : 'eye'} label={show ? t('auth.hidePassword') : t('auth.showPassword')} size={18} color={p.inkFaint} onPress={() => setShow(!show)} />
  );

  if (step === 'reset-sent') {
    return (
      <SafeAreaView style={s.screen}>
        <View style={s.centered}>
          <Icon name="mail" size={40} color={p.aqua} />
          <Txt v="title" size={26} align="center">
            {t('auth.resetSentTitle')}
          </Txt>
          <Txt v="body" color={p.inkSoft} align="center">
            {t('auth.resetSentBody')}
          </Txt>
          <Txt v="headline" color={p.aqua} align="center">
            {email.trim()}
          </Txt>
          <Txt v="meta" align="center">
            {t('auth.spamHint')}
          </Txt>
          <MarkerButton label={t('auth.backToSignIn')} onPress={() => setStep('signin-password')} style={{ alignSelf: 'stretch', marginTop: 12 }} />
        </View>
      </SafeAreaView>
    );
  }

  const title =
    step === 'email' ? (isSignUp ? t('auth.emailTitleSignUp') : t('auth.emailTitleSignIn'))
    : step === 'name' ? t('auth.nameTitle')
    : step === 'signup-password' ? t('auth.passwordTitle')
    : step === 'signin-password' ? t('auth.signInPasswordTitle')
    : t('auth.forgotTitle');
  const sub =
    step === 'email' ? (isSignUp ? t('auth.emailSubSignUp') : t('auth.emailSubSignIn'))
    : step === 'name' ? t('auth.nameSub')
    : step === 'signup-password' ? t('auth.passwordSub')
    : step === 'signin-password' ? email.trim()
    : t('auth.forgotSub');

  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.topRow}>
          <IconButton name="back" label={t('common.back')} onPress={back} />
          {isSignUp && steps.includes(step) ? (
            <View style={s.dots}>
              {steps.map((st, i) => (
                <View key={st} style={[s.dot, i <= steps.indexOf(step) ? s.dotOn : null]} />
              ))}
            </View>
          ) : null}
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
          <PackMark height={20} ink={p.ink} style={{ marginBottom: 22 }} />
          <Txt v="title" size={30} accessibilityRole="header">
            {title}
          </Txt>
          <Txt v="body" color={p.inkSoft} style={{ marginTop: 8, marginBottom: 24 }}>
            {sub}
          </Txt>

          {step === 'email' || step === 'forgot' ? (
            <Field
              value={email}
              onChangeText={(v) => { setEmail(v); clear(); }}
              placeholder={t('auth.emailPlaceholder')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              autoFocus
              error={fieldError}
              returnKeyType={step === 'forgot' ? 'send' : 'next'}
              onSubmitEditing={step === 'forgot' ? doReset : next}
            />
          ) : null}

          {step === 'name' ? (
            <Field
              value={fullName}
              onChangeText={(v) => { setFullName(v); clear(); }}
              placeholder={t('auth.namePlaceholder')}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              autoFocus
              error={fieldError}
              returnKeyType="next"
              onSubmitEditing={next}
            />
          ) : null}

          {step === 'signup-password' || step === 'signin-password' ? (
            <Field
              value={password}
              onChangeText={(v) => { setPassword(v); clear(); }}
              placeholder={t('auth.passwordPlaceholder')}
              secureTextEntry={!show}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete={step === 'signup-password' ? 'new-password' : 'current-password'}
              textContentType={step === 'signup-password' ? 'newPassword' : 'password'}
              autoFocus
              error={fieldError}
              returnKeyType="done"
              onSubmitEditing={step === 'signup-password' ? doSignUp : doSignIn}
              trailing={eye}
            />
          ) : null}

          {step === 'signup-password' && password ? (
            <View style={s.reqs}>
              {REQS.map((r) => {
                const ok = r.test(password);
                return (
                  <View key={r.key} style={s.req}>
                    <Icon name={ok ? 'check' : 'minus'} size={13} color={ok ? p.aqua : p.inkFaint} weight="bold" />
                    <Txt v="meta" color={ok ? p.ink : p.inkFaint}>
                      {t(`auth.req.${r.key}`)}
                    </Txt>
                  </View>
                );
              })}
            </View>
          ) : null}

          {step === 'signup-password' ? (
            <Press onPress={() => { setAgreed(!agreed); clear(); }} feedback="selection" style={s.terms} accessibilityRole="checkbox" accessibilityState={{ checked: agreed }}>
              <View style={[s.box, agreed ? { backgroundColor: p.ink, borderColor: p.ink } : null]}>{agreed ? <Icon name="check" size={13} color={p.board} weight="bold" /> : null}</View>
              <Text style={[s.termsText, { textAlign: alignStart(lang) }]}>
                {t('auth.agree', { terms: '\u0001', privacy: '\u0002' })
                  .split(/(\u0001|\u0002)/)
                  .map((part, i) =>
                    part === '\u0001' ? (
                      <Text key={i} style={s.link} onPress={() => Linking.openURL(TERMS_URL)}>
                        {t('auth.termsLink')}
                      </Text>
                    ) : part === '\u0002' ? (
                      <Text key={i} style={s.link} onPress={() => Linking.openURL(PRIVACY_URL)}>
                        {t('auth.privacyLink')}
                      </Text>
                    ) : (
                      <Text key={i}>{part}</Text>
                    ),
                  )}
              </Text>
            </Press>
          ) : null}

          {serverError ? (
            <View style={s.serverError}>
              <Icon name="warning" size={15} color={p.danger} />
              <Txt v="meta" color={p.danger} style={{ flex: 1 }}>
                {serverError}
              </Txt>
            </View>
          ) : null}

          <View style={{ marginTop: 20 }}>
            {step === 'email' || step === 'name' ? (
              <MarkerButton label={t('common.continue')} onPress={next} />
            ) : step === 'signup-password' ? (
              <MarkerButton label={t('auth.createAccount')} onPress={doSignUp} loading={loading} />
            ) : step === 'signin-password' ? (
              <MarkerButton label={t('auth.signIn')} onPress={doSignIn} loading={loading} />
            ) : (
              <MarkerButton label={t('auth.sendReset')} onPress={doReset} loading={loading} />
            )}
          </View>

          {step === 'signin-password' ? (
            <TextButton label={t('auth.forgot')} onPress={() => { clear(); setStep('forgot'); }} style={{ alignSelf: 'center', marginTop: 8 }} />
          ) : null}
          {step === 'email' ? (
            <View style={s.switchRow}>
              <Txt v="meta">{isSignUp ? t('auth.haveAccount') : t('auth.newHere')}</Txt>
              <TextButton label={isSignUp ? t('auth.signIn') : t('auth.createAccount')} onPress={switchMode} />
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ p, f }) => ({
  screen: { flex: 1, backgroundColor: p.board },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: p.ruleStrong },
  dotOn: { width: 22, backgroundColor: p.ink },
  body: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
  reqs: { marginTop: 12, gap: 6 },
  req: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  terms: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 20, minHeight: 44 },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: p.ruleStrong, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  termsText: { flex: 1, color: p.inkSoft, fontSize: 15, lineHeight: 22, ...f.ui },
  link: { color: p.aqua, textDecorationLine: 'underline', ...f.uiSemibold },
  serverError: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: p.danger },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20, flexWrap: 'wrap' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 10 },
}));
