# Beast Tribe — store launch kit

Assets (screenshots, feature graphics, icons): `~/Desktop/OB/beast-tribe-store/`
- `screenshots/ios/{en,ar}/*.png` — 1290 × 2796 (iPhone 6.9"), 8 per language
- `screenshots/android/{en,ar}/*.png` — 1080 × 1920, 8 per language
- `feature-graphic-{en,ar}.png` — 1024 × 500 (Google Play)
- `app-icon-1024.png` (App Store), `play-icon-512.png` (Google Play)

Screens use demo content (people are Unsplash stand-ins). Swap in Operation Beast shoot photos when you have them.

---

## Launch plan for ~100 users (recommended)

1. **Pilot first (this week):** iOS through **TestFlight** (public link, up to 10,000 testers, ~1 day beta review) and Android through **Google Play internal testing** (up to 100 testers by email, live in minutes, no review). Same app, no public listing yet.
2. **Public release after ~2 weeks of pilot**, with real sessions on the board and the first coaches and restaurants in.
   - Google requires **personal** developer accounts created after Nov 2023 to run a closed test with **12+ testers for 14 days** before production. The pilot covers this. An **organisation** account (needs a D-U-N-S number) skips it.

## Before anyone gets an invite (blockers)

| # | What | Who |
|---|------|-----|
| 1 | **Sign-up email.** Supabase's built-in email only reaches your own team and a few emails per hour. Create a free Resend account, verify `operationbeast.com`, paste its SMTP details into Supabase → Authentication → Emails → SMTP. | You (10 min) |
| 2 | **Real sessions on the board** for week one (e.g. 10–15 across padel, running, Hyrox, football). Empty boards lose people on day one. Send me the schedule and I'll put them in. | You → me |
| 3 | **Apple sign-in for the iOS build** (Terminal tab "iOS store build": answer Y, sign in, 2FA, then accept the defaults incl. push notifications). | You (5 min) |
| 4 | **Privacy policy update** (draft in `store/privacy-policy-draft.md`) — covers nutrition, measurements, workouts, coach sharing, company communities. Approve and I'll publish it. | You → me |
| 5 | At least **one coach and one restaurant** in the admin (Partners), so Coaches and Eat well aren't empty. | You |
| 6 | Supabase **Pro** plan (USD 25/month) for daily backups and no pausing, once real people's data is in. | You (decision) |

## App Store Connect

- **Name:** Beast Tribe
- **Subtitle (30):** EN `Train together. Show up.` · AR `تمرّن مع فريقك واحضر`
- **Category:** Health & Fitness · secondary: Social Networking
- **Support URL:** https://beast-tribe.vercel.app/support
- **Privacy policy URL:** https://beast-tribe.vercel.app/legal/privacy
- **Copyright:** 2026 Operation Beast
- **Price:** Free. No in-app purchases.

**Promotional text (170)**
- EN: `Your crew already trains. Now it trains together. Find today's sessions, tap I'M IN, train with today's workout, and share the wins with your tribe.`
- AR: `فريقك يتمرن بالفعل. الآن يتمرن معًا. اعثر على تمارين اليوم، اضغط حاضر، تمرّن مع تمرين اليوم، وشارك إنجازاتك مع مجتمعك.`

**Keywords (100, comma-separated)**
- EN: `fitness,community,workout,padel,running,hyrox,gym,training,sessions,coach,crew,team,riyadh,saudi`
- AR: `لياقة,مجتمع,تمارين,بادل,جري,هايروكس,جيم,تدريب,مدرب,فريق,الرياض,السعودية,رياضة`

**Description — English**
```
Your crew already trains. Now it trains together.

Beast Tribe is the community app by Operation Beast. See today's sessions on one board, tap I'M IN, and your face goes on the board so your crew knows you're coming.

JOIN YOUR PEOPLE
• Join your company, club or gym with its invite code: a private community only its members see.
• Or join open communities of people who play your sport: padel, running, football and more.

SHOW UP
• Today's sessions in time order, with who's going and how many spots are left.
• Host a session in seconds: pick the sport, the time, the place, and who it's for.
• Chat with everyone going and get directions to the court.

TRAIN EVERY DAY
• Today's workout, the Operation Beast library, and workouts from coaches.
• A timer that follows the workout: AMRAP, every minute, intervals, rounds.
• Log what you did and share it with your community or your pack, or keep it to yourself.

YOUR CREW
• Start a pack with your friends and pick its patch. Only members see it.
• Share the wins and give a Beast.

AND MORE
• Add a coach to your session at a time they're free.
• Track meals and water, and get member offers from healthy restaurants.
• In English and Arabic.

Free to join. Made by Operation Beast.
```

**Description — Arabic**
```
فريقك يتمرن بالفعل. الآن يتمرن معًا.

بيست ترايب هو تطبيق مجتمع أوبريشن بيست. شاهد تمارين اليوم على لوحة واحدة، اضغط حاضر، وتظهر صورتك على اللوحة ليعرف فريقك أنك قادم.

انضم إلى ناسك
• انضم إلى شركتك أو ناديك أو صالتك الرياضية برمز الدعوة: مجتمع خاص لا يراه إلا أعضاؤه.
• أو انضم إلى مجتمعات مفتوحة لمن يلعبون رياضتك: البادل والجري وكرة القدم وغيرها.

احضر
• تمارين اليوم بحسب الوقت، مع من سيحضر وكم مكانًا بقي.
• نظّم تمرينًا في ثوانٍ: اختر الرياضة والوقت والمكان، ولمن هو.
• تحدّث مع الحاضرين واحصل على الاتجاهات إلى الملعب.

تمرّن كل يوم
• تمرين اليوم، ومكتبة أوبريشن بيست، وتمارين من المدربين.
• مؤقت يتبع التمرين: أكبر عدد جولات، كل دقيقة، فترات، جولات.
• سجّل ما أنجزته وشاركه مع مجتمعك أو فريقك، أو احتفظ به لنفسك.

فريقك
• أنشئ فريقًا مع أصدقائك واختر شارته. لا يراه إلا أعضاؤه.
• شارك إنجازاتك وأرسل بيست.

والمزيد
• أضف مدربًا إلى تمرينك في وقت يناسبه.
• تابع وجباتك وشربك للماء، واحصل على عروض الأعضاء من المطاعم الصحية.
• بالعربية والإنجليزية.

الانضمام مجاني. من أوبريشن بيست.
```

**App Privacy (nutrition labels)** — Tracking: **No**. All items: *linked to the user*, purpose *App Functionality*, not used for tracking.
- Contact Info → Email Address, Name
- Health & Fitness → Health (body measurements you record or share with a coach), Fitness (workouts, nutrition and water logs)
- User Content → Photos or Videos; Emails or Text Messages (session and pack chat); Other User Content (posts, comments)
- Identifiers → User ID
- Not collected: location from the device, contacts, browsing, purchases, diagnostics, advertising data.

**Age rating questionnaire:** user-generated content **Yes** (moderated: report + block); messaging/chat **Yes**; advertising **No**; health/wellness topics **Yes** (fitness, nutrition), medical treatment info **No**; gambling, violence, mature themes **No**.

**Review notes** (paste into App Review Information)
```
Beast Tribe is a community app for Operation Beast members: find and join in-person sports sessions, train with workouts, and share with their community.

Sign in with the demo account (email and password in the fields above).
- Board tab: today's sessions. Open one and tap I'M IN.
- Train tab: open a workout and tap Start workout; Finish to log it.
- Tribe tab: feed, communities (open ones can be joined with one tap), packs.
- Account deletion: You → Settings → Delete account.
- Moderation: any post can be reported and its author blocked from the ••• menu.
There are no purchases in the app.
```
Demo account: `appreview@operationbeast.com` (password in CLAUDE.md › reviewer account — paste it into App Store Connect, never into the listing).

## Google Play Console

- **App name:** Beast Tribe · **Default language:** English (add Arabic translation)
- **Short description (80):** EN `Find sessions, train with your crew, share the wins. By Operation Beast.` · AR `اعثر على التمارين، تمرّن مع فريقك، وشارك إنجازاتك. من أوبريشن بيست.`
- **Full description:** same as the App Store descriptions above.
- **Category:** Health & Fitness · **Contact email:** support@operationbeast.com
- **App access:** "All or some functionality is restricted" → demo account above.
- **Ads:** No ads.
- **Target audience:** 18 and over (recommended for launch: adult communities, open chat).
- **Content rating (IARC):** users can interact/communicate **Yes**; shares location **No**; digital purchases **No**; no violence, sexual content, gambling, drugs.
- **Account deletion URL:** https://beast-tribe.vercel.app/support (section "How do I delete my account?").

**Data safety**
- Collected: Personal info (name, email address, user IDs); Health and fitness (health info, fitness info); Photos and videos (photos); Messages (other in-app messages); App activity (other user-generated content, app interactions).
- Shared with third parties: **No** (Supabase hosts the data as a service provider).
- Encrypted in transit: **Yes** · Users can request deletion: **Yes** (in the app, or by email).
- Required: name, email. Optional: everything else.

**First upload:** Google requires the first build to be uploaded by hand: Play Console → Testing → Internal testing → Create release → upload the `.aab` from EAS (link in the build list on expo.dev). After that, I can publish new builds automatically with a service-account key saved as `play-service-account.json` (git-ignored).
