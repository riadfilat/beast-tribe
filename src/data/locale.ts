import { supabase } from '../lib/supabase';
import { PREVIEW } from './preview';

/** Remember the member's language on their profile so push notifications arrive in it. */
export async function saveLocale(meId: string | null | undefined, lang: 'en' | 'ar') {
  if (PREVIEW || !meId) return;
  try {
    await supabase.from('profiles').update({ locale: lang }).eq('id', meId);
  } catch {}
}
