import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, TextInput, Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../src/components/ui';
import { useAuth } from '../../src/providers/AuthProvider';
import { supabase } from '../../src/lib/supabase';
import { COLORS, FONTS } from '../../src/lib/constants';

// ─── Types ────────────────────────────────────────────────────────────────────

type Step =
  | 'email'
  | 'name'
  | 'signup-password'
  | 'signin-password'
  | 'email-sent'
  | 'reset-sent';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Password strength ────────────────────────────────────────────────────────

interface StrengthResult {
  score: number;   // 0–4
  label: string;
  color: string;
}

function getStrength(pw: string): StrengthResult {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels: StrengthResult[] = [
    { score: 0, label: '',       color: '' },
    { score: 1, label: 'Weak',   color: '#EF5B5B' },
    { score: 2, label: 'Fair',   color: '#E88F24' },
    { score: 3, label: 'Good',   color: '#FFD700' },
    { score: 4, label: 'Strong', color: '#62B797' },
  ];
  return levels[score];
}

const REQUIREMENTS = [
  { key: 'length',  label: 'At least 8 characters',    test: (pw: string) => pw.length >= 8 },
  { key: 'upper',   label: 'One uppercase letter',      test: (pw: string) => /[A-Z]/.test(pw) },
  { key: 'number',  label: 'One number',                test: (pw: string) => /[0-9]/.test(pw) },
  { key: 'special', label: 'One special character',     test: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StrengthMeter({ password }: { password: string }) {
  const { score, label, color } = getStrength(password);
  if (!password) return null;
  return (
    <View style={meter.wrap}>
      <View style={meter.bars}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[meter.bar, { backgroundColor: i <= score ? color : 'rgba(255,255,255,0.08)' }]}
          />
        ))}
      </View>
      {label ? <Text style={[meter.label, { color }]}>{label}</Text> : null}
    </View>
  );
}

const meter = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  bars: { flex: 1, flexDirection: 'row', gap: 4 },
  bar:  { flex: 1, height: 4, borderRadius: 2 },
  label: { fontSize: 11, fontFamily: FONTS.bodySemiBold, width: 44, textAlign: 'right' },
});

function RequirementsList({ password }: { password: string }) {
  if (!password) return null;
  return (
    <View style={req.wrap}>
      {REQUIREMENTS.map((r) => {
        const ok = r.test(password);
        return (
          <View key={r.key} style={req.row}>
            <Ionicons
              name={ok ? 'checkmark-circle' : 'ellipse-outline'}
              size={14}
              color={ok ? '#62B797' : COLORS.textMuted}
            />
            <Text style={[req.label, ok && req.labelOk]}>{r.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const req = StyleSheet.create({
  wrap:    { marginTop: 10, gap: 6 },
  row:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label:   { fontSize: 12, fontFamily: FONTS.body, color: COLORS.textMuted },
  labelOk: { color: COLORS.textSecondary },
});

function FieldInput({
  value, onChangeText, placeholder, secureTextEntry, autoFocus, error,
  keyboardType, autoCapitalize, returnKeyType, onSubmitEditing,
  rightElement,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  autoFocus?: boolean;
  error?: string;
  keyboardType?: any;
  autoCapitalize?: any;
  returnKeyType?: any;
  onSubmitEditing?: () => void;
  rightElement?: React.ReactNode;
}) {
  return (
    <View>
      <View style={[field.wrap, error ? field.wrapError : null]}>
        <TextInput
          style={field.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry={secureTextEntry}
          autoFocus={autoFocus}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'none'}
          returnKeyType={returnKeyType ?? 'next'}
          onSubmitEditing={onSubmitEditing}
          autoCorrect={false}
        />
        {rightElement}
      </View>
      {error ? (
        <View style={field.errorRow}>
          <Ionicons name="alert-circle-outline" size={13} color="#EF5B5B" />
          <Text style={field.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const field = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  wrapError: {
    borderColor: '#EF5B5B',
    backgroundColor: 'rgba(239,91,91,0.06)',
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.body,
    color: COLORS.white,
  },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  errorText: { fontSize: 12, fontFamily: FONTS.body, color: '#EF5B5B' },
});

function ServerError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <View style={se.box}>
      <Ionicons name="alert-circle-outline" size={15} color="#EF5B5B" />
      <Text style={se.text}>{message}</Text>
    </View>
  );
}

const se = StyleSheet.create({
  box: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: 'rgba(239,91,91,0.08)', borderWidth: 1,
    borderColor: 'rgba(239,91,91,0.25)', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16,
  },
  text: { flex: 1, fontSize: 13, fontFamily: FONTS.body, color: '#EF5B5B', lineHeight: 18 },
});

function EmailSentScreen({
  email, title, body, buttonLabel, onBack,
}: {
  email: string; title: string; body: string; buttonLabel: string; onBack: () => void;
}) {
  return (
    <SafeAreaView style={s.container}>
      <View style={s.centeredBox}>
        <View style={s.mailIconWrap}>
          <Ionicons name="mail-outline" size={40} color={COLORS.aqua} />
        </View>
        <Text style={s.sentTitle}>{title}</Text>
        <Text style={s.sentBody}>{body}</Text>
        <Text style={s.sentEmail}>{email}</Text>
        <Text style={s.sentSub}>
          Check your spam folder if you don't see it within a minute.
        </Text>
        <View style={{ width: '100%', marginTop: 8 }}>
          <Button title={buttonLabel} onPress={onBack} />
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SignInScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isSignUp = mode === 'signup';
  const router = useRouter();
  const { signIn, signUp } = useAuth();

  const [step, setStep] = useState<Step>('email');

  // Fields
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Errors
  const [emailError, setEmailError] = useState('');
  const [nameError, setNameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [serverError, setServerError] = useState('');

  const [loading, setLoading] = useState(false);

  function clearErrors() {
    setEmailError(''); setNameError('');
    setPasswordError(''); setServerError('');
  }

  // Reset when mode changes (switching sign up ↔ sign in)
  useEffect(() => {
    setStep('email');
    clearErrors();
  }, [mode]);

  // ── Step: Email ──────────────────────────────────────────────────────────

  function handleEmailContinue() {
    clearErrors();
    if (!email.trim()) { setEmailError('Enter your email address'); return; }
    if (!EMAIL_RE.test(email.trim())) { setEmailError('Enter a valid email address'); return; }
    setStep(isSignUp ? 'name' : 'signin-password');
  }

  // ── Step: Name ───────────────────────────────────────────────────────────

  function handleNameContinue() {
    clearErrors();
    if (!fullName.trim()) { setNameError('Enter your full name'); return; }
    if (fullName.trim().length < 2) { setNameError('Name must be at least 2 characters'); return; }
    setStep('signup-password');
  }

  // ── Step: Sign-up password ───────────────────────────────────────────────

  async function handleSignUp() {
    clearErrors();
    const { score } = getStrength(password);
    if (!password) { setPasswordError('Create a password'); return; }
    if (score < 2) { setPasswordError('Password is too weak — meet at least 2 requirements'); return; }

    setLoading(true);
    try {
      await signUp(email.trim(), password, fullName.trim());
    } catch (e: any) {
      const msg: string = e.message || '';
      if (msg === 'CHECK_EMAIL_CONFIRMATION' || msg.includes('confirm') || msg.includes('Check your email')) {
        setStep('email-sent');
        return;
      }
      if (msg.includes('User already registered') || msg.includes('already been registered')) {
        setServerError('An account with this email already exists. Try signing in instead.');
      } else if (msg.includes('rate limit') || msg.includes('too many')) {
        setServerError('Too many attempts. Please wait a moment and try again.');
      } else {
        setServerError(msg || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Step: Sign-in password ───────────────────────────────────────────────

  async function handleSignIn() {
    clearErrors();
    if (!password) { setPasswordError('Enter your password'); return; }

    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (e: any) {
      const msg: string = e.message || '';
      if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
        setPasswordError('Incorrect password');
      } else if (msg.includes('Email not confirmed') || msg.includes('email_not_confirmed')) {
        setServerError('Please confirm your email before signing in. Check your inbox for the confirmation link.');
      } else if (msg.includes('rate limit') || msg.includes('too many')) {
        setServerError('Too many attempts. Please wait a moment and try again.');
      } else {
        setServerError(msg || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Forgot password ──────────────────────────────────────────────────────

  const [resetEmail, setResetEmail] = useState('');
  const [resetEmailError, setResetEmailError] = useState('');
  const [showForgot, setShowForgot] = useState(false);

  async function handleResetPassword() {
    setResetEmailError(''); setServerError('');
    const addr = resetEmail.trim() || email.trim();
    if (!addr) { setResetEmailError('Enter your email address'); return; }
    if (!EMAIL_RE.test(addr)) { setResetEmailError('Enter a valid email address'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(addr);
      if (error) throw error;
      setResetEmail(addr);
      setStep('reset-sent');
      setShowForgot(false);
    } catch (e: any) {
      setServerError(e.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  if (step === 'email-sent') {
    return (
      <EmailSentScreen
        email={email.trim()}
        title="Check your inbox"
        body="We sent a confirmation link to"
        buttonLabel="Back to sign in"
        onBack={() => { setStep('email'); router.setParams({ mode: undefined }); }}
      />
    );
  }

  if (step === 'reset-sent') {
    return (
      <EmailSentScreen
        email={resetEmail || email.trim()}
        title="Reset link sent"
        body="We sent a password reset link to"
        buttonLabel="Back to sign in"
        onBack={() => setStep('signin-password')}
      />
    );
  }

  // Forgot password overlay
  if (showForgot) {
    return (
      <SafeAreaView style={s.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.kav}>
          <View style={s.stepWrap}>
            <TouchableOpacity style={s.backBtn} onPress={() => { setShowForgot(false); clearErrors(); }}>
              <Ionicons name="arrow-back" size={22} color={COLORS.white} />
            </TouchableOpacity>

            <Text style={s.heading}>Forgot password?</Text>
            <Text style={s.subheading}>Enter the email associated with your account.</Text>

            <View style={s.fieldWrap}>
              <FieldInput
                value={resetEmail || email}
                onChangeText={(v) => { setResetEmail(v); setResetEmailError(''); }}
                placeholder="your@email.com"
                keyboardType="email-address"
                autoFocus
                error={resetEmailError}
                returnKeyType="done"
                onSubmitEditing={handleResetPassword}
              />
            </View>

            <ServerError message={serverError} />

            <Button title="Send reset link" onPress={handleResetPassword} loading={loading} />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  const canGoBack = step !== 'email';

  function goBack() {
    clearErrors();
    setPassword(''); setShowPassword(false);
    if (step === 'name') setStep('email');
    else if (step === 'signup-password') setStep('name');
    else if (step === 'signin-password') setStep('email');
  }

  function switchMode() {
    clearErrors();
    setPassword(''); setFullName(''); setShowPassword(false);
    router.setParams({ mode: isSignUp ? undefined : 'signup' });
  }

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.kav}>
        <View style={s.stepWrap}>

          {/* Header row */}
          <View style={s.headerRow}>
            {canGoBack ? (
              <TouchableOpacity style={s.backBtn} onPress={goBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="arrow-back" size={22} color={COLORS.white} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 36 }} />
            )}
            {/* Step dots for sign-up */}
            {isSignUp && (
              <View style={s.dots}>
                {(['email', 'name', 'signup-password'] as Step[]).map((s_, i) => {
                  const currentIdx = ['email', 'name', 'signup-password'].indexOf(step);
                  const active = i <= currentIdx;
                  return (
                    <View
                      key={i}
                      style={[s.dot, active ? s.dotActive : s.dotInactive]}
                    />
                  );
                })}
              </View>
            )}
            <View style={{ width: 36 }} />
          </View>

          {/* ── Step: Email ── */}
          {step === 'email' && (
            <>
              <Text style={s.heading}>
                {isSignUp ? 'What\'s your email?' : 'Welcome back'}
              </Text>
              <Text style={s.subheading}>
                {isSignUp
                  ? 'We\'ll send a confirmation link to verify you own it.'
                  : 'Sign in to your Beast Tribe account.'}
              </Text>
              <View style={s.fieldWrap}>
                <FieldInput
                  value={email}
                  onChangeText={(v) => { setEmail(v); setEmailError(''); }}
                  placeholder="your@email.com"
                  keyboardType="email-address"
                  autoFocus
                  error={emailError}
                  returnKeyType="next"
                  onSubmitEditing={handleEmailContinue}
                />
              </View>
              <Button title="Continue" onPress={handleEmailContinue} />
              <TouchableOpacity style={s.switchRow} onPress={switchMode}>
                <Text style={s.switchText}>
                  {isSignUp ? 'Already have an account? ' : 'New to Beast Tribe? '}
                  <Text style={s.switchLink}>{isSignUp ? 'Sign in' : 'Create account'}</Text>
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Step: Name ── */}
          {step === 'name' && (
            <>
              <Text style={s.heading}>What's your name?</Text>
              <Text style={s.subheading}>This is how you'll appear to your tribe.</Text>
              <View style={s.fieldWrap}>
                <FieldInput
                  value={fullName}
                  onChangeText={(v) => { setFullName(v); setNameError(''); }}
                  placeholder="Full name"
                  autoCapitalize="words"
                  autoFocus
                  error={nameError}
                  returnKeyType="next"
                  onSubmitEditing={handleNameContinue}
                />
              </View>
              <Button title="Continue" onPress={handleNameContinue} />
            </>
          )}

          {/* ── Step: Sign-up password ── */}
          {step === 'signup-password' && (
            <>
              <Text style={s.heading}>Create a password</Text>
              <Text style={s.subheading}>Make it strong — your beast data deserves protection.</Text>
              <View style={s.fieldWrap}>
                <FieldInput
                  value={password}
                  onChangeText={(v) => { setPassword(v); setPasswordError(''); }}
                  placeholder="Password"
                  secureTextEntry={!showPassword}
                  autoFocus
                  error={passwordError}
                  returnKeyType="done"
                  onSubmitEditing={handleSignUp}
                  rightElement={
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={COLORS.textMuted}
                      />
                    </TouchableOpacity>
                  }
                />
                <StrengthMeter password={password} />
                <RequirementsList password={password} />
              </View>
              <ServerError message={serverError} />
              <Button
                title="Create account"
                onPress={handleSignUp}
                loading={loading}
                disabled={loading || getStrength(password).score < 2}
              />
            </>
          )}

          {/* ── Step: Sign-in password ── */}
          {step === 'signin-password' && (
            <>
              <Text style={s.heading}>Enter your password</Text>
              <Text style={s.subheading}>{email.trim()}</Text>
              <View style={s.fieldWrap}>
                <FieldInput
                  value={password}
                  onChangeText={(v) => { setPassword(v); setPasswordError(''); setServerError(''); }}
                  placeholder="Password"
                  secureTextEntry={!showPassword}
                  autoFocus
                  error={passwordError}
                  returnKeyType="done"
                  onSubmitEditing={handleSignIn}
                  rightElement={
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={COLORS.textMuted}
                      />
                    </TouchableOpacity>
                  }
                />
              </View>
              <ServerError message={serverError} />
              <Button title="Sign in" onPress={handleSignIn} loading={loading} />
              <TouchableOpacity
                style={s.forgotRow}
                onPress={() => { clearErrors(); setShowForgot(true); }}
              >
                <Text style={s.forgotText}>Forgot your password?</Text>
              </TouchableOpacity>
            </>
          )}

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  kav:       { flex: 1 },

  stepWrap: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 32,
    justifyContent: 'center',
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: { flexDirection: 'row', gap: 6 },
  dot:  { width: 6, height: 6, borderRadius: 3 },
  dotActive:   { backgroundColor: COLORS.orange, width: 18 },
  dotInactive: { backgroundColor: 'rgba(255,255,255,0.15)' },

  heading: {
    fontSize: 28,
    fontFamily: FONTS.heading,
    color: COLORS.white,
    marginBottom: 8,
    lineHeight: 34,
  },
  subheading: {
    fontSize: 14,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
    marginBottom: 28,
    lineHeight: 20,
  },

  fieldWrap: { marginBottom: 20 },

  switchRow: { alignItems: 'center', marginTop: 28 },
  switchText: { fontSize: 13, fontFamily: FONTS.body, color: COLORS.textTertiary },
  switchLink: { color: COLORS.aqua, fontFamily: FONTS.bodyMedium },

  forgotRow: { alignItems: 'center', marginTop: 18 },
  forgotText: { fontSize: 13, fontFamily: FONTS.bodyMedium, color: COLORS.aqua },

  /* Email sent / centered */
  centeredBox: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 32, gap: 12,
  },
  mailIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(86,196,196,0.1)',
    borderWidth: 1, borderColor: 'rgba(86,196,196,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  sentTitle: { fontSize: 24, fontFamily: FONTS.heading, color: COLORS.white },
  sentBody:  { fontSize: 14, fontFamily: FONTS.body, color: COLORS.textSecondary, textAlign: 'center' },
  sentEmail: { fontSize: 14, fontFamily: FONTS.bodySemiBold, color: COLORS.aqua, textAlign: 'center' },
  sentSub:   { fontSize: 12, fontFamily: FONTS.body, color: COLORS.textTertiary, textAlign: 'center', lineHeight: 18, marginBottom: 8 },
});
