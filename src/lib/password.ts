// Password rules for new and reset passwords. Length matters most; the most common passwords and
// ones built from the person's own email or the app's name are refused outright.
export const MIN_LENGTH = 10;

const COMMON = new Set([
  'password', 'password1', 'password12', 'password123', 'password1234', 'passw0rd', 'p@ssw0rd', 'p@ssword', 'qwerty', 'qwerty123', 'qwertyuiop',
  'asdfghjkl', 'zxcvbnm', '1q2w3e4r', '1q2w3e4r5t', 'q1w2e3r4', 'abc123', 'abcd1234', 'abcdefgh', 'iloveyou', 'letmein', 'welcome', 'welcome1',
  'welcome123', 'admin', 'admin123', 'administrator', 'login', 'master', 'monkey', 'dragon', 'football', 'baseball', 'soccer', 'superman',
  'batman', 'sunshine', 'princess', 'shadow', 'starwars', 'trustno1', 'whatever', 'freedom', 'michael', 'jennifer', 'charlie', 'liverpool',
  'chelsea', 'arsenal', 'realmadrid', 'barcelona', 'alhilal', 'alnassr', 'ittihad', 'saudi', 'saudiarabia', 'riyadh', 'jeddah', 'ramadan',
  'mohammed', 'muhammad', 'ahmed', 'abdullah', 'allah', 'bismillah', 'operationbeast', 'beasttribe', 'beast', 'tribe', 'changeme', 'secret',
  'computer', 'internet', 'samsung', 'iphone', 'google', 'facebook', 'instagram', 'snapchat', 'tiktok',
]);
const SEQUENCES = ['0123456789', '9876543210', 'abcdefghijklmnopqrstuvwxyz', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

export type PasswordProblem = 'short' | 'common' | 'personal' | 'simple' | null;

/** Why a password would be refused, or null when it's fine. `email` blocks passwords made from the address. */
export function passwordProblem(pw: string, email = '', min = MIN_LENGTH): PasswordProblem {
  if (pw.length < min) return 'short';
  const low = pw.toLowerCase();
  const core = low.replace(/[^a-z]/g, '');
  if (COMMON.has(low) || COMMON.has(core) || COMMON.has(low.replace(/[0-9!@#$%^&*._-]+$/, ''))) return 'common';
  // The address and each part of it (riad.filat → riad, filat) can't be the password's core.
  const local = email.toLowerCase().split('@')[0];
  const parts = [local.replace(/[^a-z0-9]/g, ''), ...local.split(/[^a-z0-9]+/)].filter((x) => x.length >= 4);
  if (parts.some((x) => low.includes(x))) return 'personal';
  if (/^(.)\1+$/.test(low) || SEQUENCES.some((s) => s.includes(low) || (low.length >= 6 && s.includes(low.slice(0, 6)))) || new Set(low).size < 4) return 'simple';
  return null;
}

/** 0–4 for the meter: length first, then variety. */
export function passwordScore(pw: string, email = ''): number {
  if (!pw) return 0;
  if (passwordProblem(pw, email)) return 1;
  const kinds = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  return Math.min(4, 1 + (pw.length >= 12 ? 1 : 0) + (pw.length >= 16 ? 1 : 0) + (kinds >= 3 ? 1 : 0));
}
