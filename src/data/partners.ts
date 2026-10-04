import { supabase } from '../lib/supabase';
import { useQuery, CATALOGUE } from './query';
import { PREVIEW, previewFood } from './preview';

// Healthy-food partners (partners.partner_type = 'nutrition'), added in the admin with a member
// offer in metadata: { offer, offer_ar, code }. A partner can be scoped to one community.
export interface FoodPartner {
  id: string;
  name: string;
  city: string | null;
  logoUrl: string | null;
  url: string | null;
  offer: string;
  code: string | null;
}

const PREVIEW_FOOD: FoodPartner[] = previewFood;

export function useFoodPartners(lang: string) {
  return useQuery<FoodPartner[]>(`partners:food:${lang}`, async () => {
    if (PREVIEW) return PREVIEW_FOOD;
    const { data, error } = await supabase
      .from('partners')
      .select('id, business_name, name, city, logo_url, website_url, metadata, is_active')
      .eq('partner_type', 'nutrition')
      .eq('is_active', true);
    if (error) throw error;
    return (data || [])
      .map((r: any) => {
        const m = r.metadata || {};
        return {
          id: r.id,
          name: r.business_name || r.name || '',
          city: r.city ?? null,
          logoUrl: r.logo_url ?? null,
          url: r.website_url ?? null,
          offer: (lang === 'ar' && m.offer_ar) || m.offer || '',
          code: m.code ?? null,
        };
      })
      .filter((p) => p.name && p.offer);
  }, CATALOGUE);
}
