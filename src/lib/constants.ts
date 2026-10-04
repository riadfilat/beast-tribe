// Beast Tribe — app-wide links and switches. Colours and type live in src/theme.

// ─── Legal / hosted pages ───────────────────────────────────────────────────
// Hosted on the admin (Vercel) deployment — public /legal/* routes.
export const LEGAL_BASE_URL = 'https://beast-tribe.vercel.app';
export const TERMS_URL = `${LEGAL_BASE_URL}/legal/terms`;
export const PRIVACY_URL = `${LEGAL_BASE_URL}/legal/privacy`;


// ─── Links ──────────────────────────────────────────────────────────────────
export const SUPPORT_URL = `${LEGAL_BASE_URL}/support`;
/** Public session invite page (opens the app via beasttribe://session/<id>). */
export const SESSION_LINK_BASE = `${LEGAL_BASE_URL}/s/`;
/** Operation Beast Shopify store. Empty = the Shop entry stays hidden until the store is live. */
export const SHOP_URL = '';

/**
 * Paid sessions (price per spot, checkout, host payouts). The database is ready (events.price_sar,
 * payments); turn this on once a payment provider (Moyasar / Tap) is connected.
 */
export const PAYMENTS_ENABLED = false;
