import { supabase } from '../lib/supabase';
import { LEGAL_BASE_URL } from '../lib/constants';
import { CodedError } from './errors';
import { PREVIEW } from './preview';

// Ask Beast: a Claude-powered assistant that finds partners, sessions, workouts and clubs.
// It runs on the Beast Tribe site (/api/assistant) with the member's own sign-in, so it only ever
// sees what the member can see.

export type AssistantCard =
  | { type: 'partner'; id: string; name: string; avatarUrl: string | null; line: string }
  | { type: 'session'; id: string; title: string; sport: string; startsAt: string; place: string | null }
  | { type: 'workout'; id: string; title: string; minutes: number | null; sport: string | null }
  | { type: 'club'; id: string; name: string; line: string }
  | { type: 'court'; id: string; name: string; line: string; sport: string }
  | { type: 'action'; action: 'partners' | 'host' | 'clubs' };

export interface AssistantTurn {
  role: 'user' | 'assistant';
  content: string;
  cards?: AssistantCard[];
}

export type AssistantErrorCode = 'not_configured' | 'limit' | 'signed_out' | 'generic';
export class AssistantError extends CodedError<AssistantErrorCode> {}

export async function askBeast(history: AssistantTurn[], lang: string): Promise<{ reply: string; cards: AssistantCard[] }> {
  if (PREVIEW) return { reply: lang === 'ar' ? 'هذه معاينة. اسأل في التطبيق الحقيقي.' : 'This is the preview. Ask in the real app.', cards: [] };
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new AssistantError('signed_out');
  const res = await fetch(`${LEGAL_BASE_URL}/api/assistant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ lang, messages: history.slice(-12).map((m) => ({ role: m.role, content: m.content })) }),
  });
  if (res.status === 503) throw new AssistantError('not_configured');
  if (res.status === 429) throw new AssistantError('limit');
  if (res.status === 401) throw new AssistantError('signed_out');
  if (!res.ok) throw new AssistantError('generic');
  const body = await res.json();
  return { reply: String(body.reply || ''), cards: Array.isArray(body.cards) ? body.cards : [] };
}
