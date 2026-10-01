# Product

<!-- impeccable:product-schema 1 -->

## Platform

ios

## Users

Primary: people in Saudi Arabia and the wider Gulf who want to train with others — they open the app to find a group session near them (run, gym class, padel, football, basketball, hyrox…), commit to it, show up, and meet their crew. Many sessions happen at dawn or after sunset.

Primary, overlapping: the Operation Beast brand community — customers and fans of the activewear brand, for whom the app is where the brand's energy lives day to day.

Secondary: clubs, companies, and coaches running their own tribes (admin-assigned communities, coach partners with bookings and trainees).

## Product Purpose

Beast Tribe turns the intent to train into actually showing up, together. Members discover, join, and host sessions, coordinate in each session's chat, and stay connected through packs and the tribe feed. Success metric: not yet formally defined (open decision).

## Positioning

A sports community app owned by a real activewear brand (Operation Beast) and built around showing up in person — sessions, packs, and communities rather than solo tracking. The Operation Beast shop is a separate product on Shopify; the app links to it (or a smart linkage between the two — mechanism undecided) but never becomes a store.

## Operating Context

- Sessions are created by members, coaches, and partners; anyone can host. Sessions can be public, pack-only, or women-only (women-only sessions are hidden from male members).
- Each session has a group chat with quick status messages ("On my way", "I arrived").
- Packs: member-made crews (up to 20 per member) with invite codes and a pack chat.
- Communities: admin-assigned tribes (e.g. a club or company); members auto-join the community's default packs.
- Popular locations are curated by admins per country/community (Riyadh, Jeddah, Dubai, Abu Dhabi…).
- An admin dashboard (Next.js on Vercel) moderates content, users, events, partners, locations, and communities.

## Capabilities and Constraints

- Keep: events/sessions (create, join, leave, pack-only, women-only, difficulty, duration, capacity), session chat, tribe feed (posts, "Beast" reactions, report, block), packs + pack chat, communities, nutrition tracker, coaches & bookings (availability, coach dashboard, trainees), in-app account deletion, push notifications (15-min reminders, "X joined", "seats full" — pending a native build).
- Shop: link out to the Operation Beast Shopify store; in-app shop screen is not a product surface.
- Gamification (XP, levels, tiers, badges, leaderboards, streaks, Beast Score, missions, habits) was deliberately removed in June 2026 to simplify the app. Do not reintroduce without the user.
- **Arabic + English at launch**, with full right-to-left layout for Arabic.
- Stack: Expo SDK 55, React Native 0.83, Expo Router, Reanimated 4, Supabase (Postgres + RLS + Storage), EAS Build/Update. JS changes ship over-the-air; the installed build lacks expo-notifications/expo-device until the next native build. No expo-blur or expo-image in the binary.
- Live data today: 2 accounts, no upcoming sessions. The product must work at zero content (cold start).

## Brand Commitments

- Name: Operation Beast (brand), Beast Tribe (app). The reaction is called "Beast".
- Colors from the adopted collateral: deep teal #023C3C as the dominant field, orange #E88F24 (the sun) as the accent, aqua #56C4C4 secondary.
- Parent mark: Operation Beast's howling wolf and orange sun, with an octagonal stencil wordmark.
- Beast Tribe logo (chosen 2026-09-29, "The Pack"): three of the parent's wolves howling together in the journey colours (Dreamer aqua, Seeker orange, Mover = surface ink), with BEAST TRIBE set in the parent logotype's own letterforms, endorsed "By Operation Beast". The orange sun is the parent's, never Beast Tribe's logo.
- Typefaces in use: Montserrat, Poppins, SlamDunk (Latin only).
- Mascots: neon hand-drawn Wolf, Eagle, Tiger, Rhino ("On Black Neon" and "On White" sets) are t-shirt art, not app identity; the app no longer uses them.
- Pack patches (chosen 2026-09-30): a pack's identity is a symbol on a round patch in a brand colourway. Symbols come from one professionally drawn silhouette family (game-icons.net, CC BY 3.0, credited in Settings): beasts, Greek myths and sport marks; or any emoji; or the pack's letters. Hand-drawn attempts were rejected by the user as not good enough.
- Voice: short imperatives — "Awaken the beast", "Awaken, advance, repeat", "Welcome to the tribe", "Unleash the beast", "Don't just move. Push. Break limits. Go further than yesterday."

## Evidence on Hand

- Brand books: `/Users/riadabulfilat/Desktop/OB/Operation Beast_Collateral 2.pdf` (adopted teal/orange collateral), `/Users/riadabulfilat/Desktop/OB/Huda the Designer x Operation Beast_v2.pdf` (logo exploration, vermillion option).
- Beast Tribe logo sources: `assets/brand/*.svg` (mark, wordmark, lockups) generated from the parent master file `drive-download-20260302T171831Z-3-001/Logo Variations/LogoVariations.ai`; geometry in `src/components/brand/paths.ts` (app) and `admin/src/components/brand/paths.ts` (web).
- Welcome photo (stand-in until an Operation Beast shoot): Mina Rad, "A group of people running down a street" (Tehran), Unsplash License. The brand guideline's photos are other brands' moodboard references and must not ship.
- Mascot art (t-shirt designs, unused in the app): `assets/images/animals/{Wolf,Eagle,Tiger,Rhino}/{1,2}.png`; source sets in `/Users/riadabulfilat/Desktop/OB/Designs/`.
- Pack glyphs: `assets/brand/pack-glyphs/*.svg` (+ CREDITS.md); sources and generator in `scripts/brand/pack-glyphs/` (writes `src/components/brand/glyphs.ts` and the admin copy). CC BY 3.0 requires the credit line to stay in the app.
- No member testimonials, member counts, partner logos, or press exist. Never fabricate them.

## Business Model (decided 2026-10-01)

- Community-driven and B2B first: companies, compounds and clubs buy a PRIVATE community (seats + contract) that their people join with an invite code. Open communities anyone can join; everyone starts in the open "Beast Tribe".
- Members can be in several communities; sessions live in a community or a pack; packs are private to their members.
- Revenue: B2B licences first, then a cut of paid sessions (prepared, switched off), coach subscriptions, featured venues, healthy-restaurant partnerships. No ads, no selling data, no paywall on joining sessions.

## Product Principles

1. Showing up is the product: every screen should move a member closer to attending or hosting a session.
2. Works at zero: an empty city still feels alive and gives the member something to do (host, invite, follow a pack).
3. Safe by design: women-only sessions, pack-only sessions, report and block are first-class, not buried.
4. Bilingual by default: Arabic and English are equals; nothing is designed English-first and mirrored later.
5. Simple over clever: no points, levels, or streak mechanics; progress is sessions attended and people met.

## Accessibility & Inclusion

- Arabic (RTL) and English (LTR) at launch.
- Women-only sessions are a core inclusion feature for the Saudi/Gulf audience.
