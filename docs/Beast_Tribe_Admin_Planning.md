# Beast Tribe — Admin & Partner Portal
## Complete Planning Document

**Project:** Beast Tribe by Operation Beast
**Date:** March 28, 2026
**Stack:** Next.js 14 (App Router) + Supabase + Tailwind CSS + TypeScript
**Deployment:** Vercel (admin.operation-beast.com)

---

## 1. Project Overview

Beast Tribe is a gamified community fitness app for Operation Beast, a Saudi activewear brand. The Admin & Partner Portal provides management tools for the platform's operations, content moderation, analytics, and partner ecosystem.

### Goals
- Manage users, events, content, and partners from a single dashboard
- Provide role-based access for admin team members and external partners
- Moderate user-generated content (images, posts, comments)
- Track platform health through analytics and metrics
- Enable partners (coaches, gyms, event companies) to manage their own operations

---

## 2. Roles & Permissions

### Admin Roles

| Role | Access Level | Capabilities |
|------|-------------|--------------|
| **Super Admin** | Full | Everything + manage admin accounts, system settings, view audit logs |
| **Admin** | High | User management, events CRUD, partner verification, content moderation, analytics |
| **Moderator** | Limited | Content moderation (approve/reject images, hide posts/comments), view reports |

### Partner Roles

| Partner Type | Dashboard Access | Capabilities |
|-------------|-----------------|--------------|
| **Coach** | Own events, registered attendees, earnings | Create/edit own events, view attendee lists, track event performance |
| **Gym** | Facility events, member activity, bookings | Manage gym-hosted events, view facility usage stats |
| **Event Company** | All organized events, full attendee management | Create/manage large events, export attendee data, multi-coach coordination |

### Partner Verification Flow
1. Partner submits application (business name, type, documents)
2. Document upload required (business license, coaching certification, etc.)
3. Admin reviews application and documents
4. Admin approves or rejects with reason
5. Approved partners get portal access with role-specific dashboard

---

## 3. Data Collection Strategy

### From Mobile App (User-Facing)

| Data Point | When Collected | Table |
|-----------|----------------|-------|
| Full name, display name | Sign-up | profiles |
| Email, password | Sign-up | auth.users |
| Avatar photo | Sign-up / Edit Profile | profiles |
| Sports preferences | Onboarding Step 1 | user_sports |
| Weight, height, baseline metrics | Onboarding Step 2 | baselines |
| Goals (1-3) | Onboarding Step 3 | goals |
| Device connections | Onboarding Step 5 | device_connections |
| Gender, DOB, country, city, phone | Edit Profile (optional) | profiles |
| Workout completions | In-app | workout_logs |
| Meal logging | In-app | nutrition_logs |
| Water intake | In-app | water_logs |
| Step counts | Auto-sync | step_logs |
| Posts, comments | In-app | feed_posts, feed_comments |
| Event RSVPs | In-app | event_rsvps |
| QR code scans | In-app | qr_codes |

### From Admin Portal (Admin-Facing)

| Data Point | Who Creates | Table |
|-----------|------------|-------|
| Events | Admin / Partner | events |
| Workouts | Admin | workouts |
| Quests | Admin | quests |
| Badges | Admin | badges |
| Pack challenges | Admin | pack_challenges |
| Admin audit actions | Auto-logged | admin_audit_log |
| Content moderation decisions | Admin / Moderator | image_moderation_queue, content_reports |
| Partner verification | Admin | partners |

---

## 4. Page-by-Page Requirements

### PAGE 1: Login
**Status:** Complete

- [x] Email + password sign-in via Supabase Auth
- [x] "Remember me" checkbox
- [x] "Forgot password?" link
- [x] Forgot password page (email reset request)
- [x] Reset password page (new password + confirmation)
- [x] Error handling (invalid credentials, connection errors)
- [x] Redirect to dashboard on success
- [x] Role check in middleware (only admin_roles users can access)
- [x] Brand styling (teal background, dot grid, wolf icon)

**Testing Criteria:**
- [ ] Valid admin credentials → redirects to dashboard
- [ ] Invalid credentials → shows error
- [ ] Non-admin user → shows unauthorized error
- [ ] Password reset email sends correctly
- [ ] New password saves and allows login

---

### PAGE 2: Dashboard
**Status:** Pending

**Requirements:**
- [ ] Stat cards row: Total Users, Active Today, Total Events, Pending Moderation
- [ ] User growth chart (last 30 days)
- [ ] Recent activity feed (last 10 actions: signups, events created, reports filed)
- [ ] Quick action buttons: Create Event, View Reports, Manage Partners
- [ ] Top 5 users by XP this week (mini leaderboard)
- [ ] Platform health indicators (API response times, error rates — nice-to-have)

**Data Sources:**
- profiles (count, created_at for growth)
- events (count)
- image_moderation_queue (pending count)
- content_reports (pending count)
- xp_transactions (top users)
- admin_audit_log (recent activity)

**Testing Criteria:**
- [ ] All stat cards show correct numbers
- [ ] Growth chart renders with real data
- [ ] Quick actions navigate to correct pages
- [ ] Dashboard loads in under 2 seconds

---

### PAGE 3: Users Management
**Status:** Pending

**Requirements:**
- [ ] Paginated user list (25 per page)
- [ ] Search by name, email
- [ ] Filter by: tier (Raw/Forged/Untamed), pack, active/inactive, premium/free
- [ ] Sort by: join date, XP, last active
- [ ] User detail page showing:
  - Profile info (name, email, avatar, tier, level, XP)
  - Sports selections
  - Activity summary (workouts, posts, events attended)
  - XP transaction history
  - Badges earned
  - Content reports filed against them
  - Device connections
- [ ] Actions: Suspend user, Delete user (with confirmation), Reset password, Adjust XP (Super Admin only)
- [ ] Bulk actions: Export CSV, Suspend selected

**Data Sources:**
- profiles, user_sports, baselines, goals
- workout_logs, nutrition_logs, step_logs
- xp_transactions, user_badges
- content_reports, device_connections

**Testing Criteria:**
- [ ] Search returns correct results
- [ ] Filters work independently and combined
- [ ] Pagination works correctly
- [ ] User detail page loads all sections
- [ ] Suspend/delete actions work with audit logging
- [ ] CSV export downloads correctly

---

### PAGE 4: Events Management
**Status:** Pending

**Requirements:**
- [ ] Event list with search, filter (by sport, city, date range, status)
- [ ] Create event form:
  - Title, description, sport type (dropdown from sports table)
  - Date, time, duration
  - Location (city, venue name, address, map coordinates)
  - Capacity, price (0 = free)
  - Coach name, gym name (for search)
  - Cover image upload
  - Partner assignment (optional)
- [ ] Edit event (same form, pre-filled)
- [ ] Delete event (with confirmation, cascades RSVPs)
- [ ] View attendees list per event
  - Export attendee list as CSV
  - Check-in tracking (mark attended)
- [ ] Event status: Draft, Published, Cancelled, Completed

**Data Sources:**
- events, event_rsvps, sports, partners

**Testing Criteria:**
- [ ] Create event with all fields → appears in list
- [ ] Edit event → changes persist
- [ ] Delete event → removed from list, RSVPs cascade deleted
- [ ] Attendee list shows correct users
- [ ] CSV export includes all attendee details
- [ ] Filter by sport/city/date returns correct results

---

### PAGE 5: Image Moderation
**Status:** Pending

**Requirements:**
- [ ] Grid view of pending images (thumbnails)
- [ ] Each image shows: uploader name, source (avatar/post/baseline), upload date, AI scan score
- [ ] Actions per image: Approve, Reject (with reason dropdown)
- [ ] Bulk approve/reject selected images
- [ ] Auto-moderation settings:
  - NSFW detection threshold (0.0 - 1.0)
  - Auto-approve below threshold
  - Auto-reject above threshold
  - Queue for manual review in between
- [ ] Rejection reasons: NSFW, Violence, Spam, Other (with text field)
- [ ] 3-strike policy: Auto-suspend user after 3 rejected images
- [ ] Moderation history log

**Data Sources:**
- image_moderation_queue, profiles

**Testing Criteria:**
- [ ] Pending images display in grid
- [ ] Approve → image becomes visible in app
- [ ] Reject → image hidden, user notified
- [ ] 3rd rejection → user auto-suspended
- [ ] Bulk actions work correctly
- [ ] AI scan scores display accurately

---

### PAGE 6: Feed & Content Moderation
**Status:** Pending

**Requirements:**
- [ ] Feed posts list with filters (reported, hidden, all)
- [ ] Post detail: content, image, author, beast count, comments, reports
- [ ] Actions: Hide post, Delete post, Warn user
- [ ] Comments management:
  - List comments with filters (reported, hidden)
  - Hide/unhide comment
  - Delete comment
- [ ] Content reports queue:
  - List all pending reports
  - Report detail: reporter, target content, reason, details
  - Actions: Dismiss report, Take action (hide/delete content + warn/suspend user)
- [ ] Report categories: Inappropriate, Spam, Harassment, Nudity, Other

**Data Sources:**
- feed_posts, feed_comments, content_reports, beasts

**Testing Criteria:**
- [ ] Reported content appears in queue
- [ ] Hide post → not visible in app feed
- [ ] Delete post → permanently removed
- [ ] Dismiss report → removed from queue
- [ ] Action on report → content hidden + user warned

---

### PAGE 7: Partners Management
**Status:** Pending

**Requirements:**
- [ ] Partner list with filters (type, status, city)
- [ ] Partner detail page:
  - Business info (name, type, description, logo, contact)
  - Verification status and documents
  - Events created/managed
  - Performance metrics
- [ ] Verification workflow:
  - View uploaded documents (business license, certifications)
  - Approve with optional notes
  - Reject with required reason
- [ ] Actions: Activate, Deactivate, Delete partner
- [ ] Create partner account (invite by email)
- [ ] Partner types: Coach, Gym, Event Company

**Data Sources:**
- partners, partner_events, events, profiles

**Testing Criteria:**
- [ ] Partner list shows all partners with correct status
- [ ] Document viewer displays uploaded files
- [ ] Approve → partner gains portal access
- [ ] Reject → partner notified with reason
- [ ] Deactivate → partner loses access, events hidden
- [ ] Invite email sends correctly

---

### PAGE 8: Admin Users (Super Admin Only)
**Status:** Pending

**Requirements:**
- [ ] List all admin/moderator accounts
- [ ] Create new admin: email, role (Admin/Moderator), name
- [ ] Edit admin role
- [ ] Deactivate admin account
- [ ] Audit log viewer:
  - Filter by admin user, action type, date range
  - Shows: who did what, when, to which record
- [ ] Only accessible to Super Admin role

**Data Sources:**
- admin_roles, admin_audit_log, profiles

**Testing Criteria:**
- [ ] Only Super Admin can access this page
- [ ] Create admin → user can log in with assigned role
- [ ] Change role → permissions update immediately
- [ ] Deactivate → admin can no longer log in
- [ ] Audit log shows complete action history

---

### PAGE 9: Analytics
**Status:** Pending

**Requirements:**
- [ ] Date range selector (default: last 30 days)
- [ ] User Metrics:
  - Total users, new users (period), DAU, WAU, MAU
  - Retention rate (D1, D7, D30)
  - User tier distribution (pie chart)
  - Pack distribution (bar chart)
- [ ] Engagement Metrics:
  - Workouts completed per day (line chart)
  - Average workouts per user
  - Feed posts created per day
  - Beast reactions per day
  - Comments per day
- [ ] Event Metrics:
  - Events created vs completed
  - Average attendance rate
  - Revenue by event (if paid)
  - Most popular event types
- [ ] Gamification Metrics:
  - XP awarded per day
  - Quest completion rate
  - Badge earning rate
  - Level distribution
- [ ] Export: Download report as CSV/PDF

**Data Sources:**
- All tables (aggregated queries)

**Testing Criteria:**
- [ ] All charts render with real data
- [ ] Date range changes update all charts
- [ ] Numbers match database queries
- [ ] Export generates valid file

---

## 5. Partner Dashboards

### Coach Dashboard
- **My Events**: List of events where they are the coach
- **My Attendees**: Users registered for their events
- **Performance**: Total attendees, average rating, event completion rate
- **Calendar**: Upcoming events schedule
- **Actions**: Create event (auto-assigned as coach), export attendee lists

### Gym Dashboard
- **Facility Events**: Events hosted at their gym
- **Members**: Users who attend their events regularly
- **Bookings**: Event capacity and registration tracking
- **Performance**: Facility utilization, popular time slots, event types
- **Actions**: Create event (auto-assigned as venue), manage facility details

### Event Company Dashboard
- **All Events**: Full list of organized events
- **Attendee Management**: Comprehensive registration tracking
- **Multi-Coach**: Assign coaches to events
- **Revenue**: Ticket sales and revenue tracking
- **Performance**: Event success metrics, attendance trends
- **Actions**: Create event, assign coaches/venues, export data

---

## 6. Nice-to-Have Features

Pick from these to add after core pages are complete:

### User Experience
- [ ] Dark mode toggle for admin portal
- [ ] Real-time notifications (new reports, partner applications)
- [ ] Dashboard customization (drag-and-drop widgets)
- [ ] Keyboard shortcuts for common actions
- [ ] Bulk user import via CSV

### Content & Engagement
- [ ] Push notification composer (send to all/segment)
- [ ] In-app announcement banner management
- [ ] Featured content curation (pin posts to top of feed)
- [ ] Trending hashtags management
- [ ] Beast Roar of the Week winner management

### Events
- [ ] Event templates (quick-create from template)
- [ ] Recurring events (weekly/monthly)
- [ ] Event waitlist management
- [ ] QR code check-in at events
- [ ] Event photo gallery moderation

### Gamification
- [ ] Custom badge creator (upload icon, set criteria)
- [ ] Quest builder (create custom quests)
- [ ] XP multiplier events (2x XP weekends)
- [ ] Seasonal challenges manager
- [ ] Leaderboard reset scheduler

### Analytics & Reporting
- [ ] Automated weekly email reports
- [ ] Cohort analysis
- [ ] Funnel visualization (signup → onboarding → active)
- [ ] Churn prediction indicators
- [ ] A/B test configuration
- [ ] User segmentation builder

### Partners
- [ ] Partner revenue sharing calculator
- [ ] Partner performance leaderboard
- [ ] Automated partner payout reports
- [ ] Partner API access management
- [ ] White-label event pages for partners

### Operations
- [ ] Scheduled maintenance mode
- [ ] Feature flags management
- [ ] Rate limiting configuration
- [ ] Error log viewer
- [ ] Database backup management
- [ ] Multi-language content management (Arabic/English)

### Security
- [ ] Two-factor authentication for admin accounts
- [ ] IP whitelist for admin portal
- [ ] Session management (view/revoke active sessions)
- [ ] Login attempt monitoring and auto-lockout
- [ ] Data export for GDPR/privacy compliance

---

## 7. Database Schema Summary

### Core Tables
| Table | Records | Purpose |
|-------|---------|---------|
| profiles | Users | User accounts with XP, level, tier, pack |
| sports | 12 | Sport catalog (Running, Gym, Yoga, etc.) |
| user_sports | Many | User sport selections |
| baselines | 1/user | Initial body measurements |
| goals | 1-3/user | User fitness goals |

### Activity Tables
| Table | Purpose |
|-------|---------|
| workouts | Workout library |
| workout_logs | Completed workouts |
| nutrition_logs | Meal entries |
| water_logs | Daily water intake |
| step_logs | Daily step counts |
| xp_transactions | XP ledger (trigger recalculates totals) |

### Social Tables
| Table | Purpose |
|-------|---------|
| feed_posts | Activity feed |
| feed_comments | Post comments |
| beasts | "Beast" reactions (like kudos) |
| beast_roar_nominations | Weekly transformation voting |
| beast_roar_votes | Votes on nominations |

### Events Tables
| Table | Purpose |
|-------|---------|
| events | Event listings |
| event_rsvps | Event registrations |
| partner_events | Partner-event associations |

### Gamification Tables
| Table | Purpose |
|-------|---------|
| packs | Pack groups (Wolf, Eagle, Tiger, Rhino) |
| pack_challenges | Pack vs pack competitions |
| quests | Daily/weekly quests |
| user_quests | Quest progress |
| badges | Badge definitions |
| user_badges | Earned badges |

### Admin Tables
| Table | Purpose |
|-------|---------|
| admin_roles | Admin/moderator accounts |
| admin_audit_log | Action audit trail |
| partners | Partner businesses |
| image_moderation_queue | Image review queue |
| content_reports | User-submitted reports |

### Other Tables
| Table | Purpose |
|-------|---------|
| device_connections | Health app connections |
| qr_codes | Premium unlock codes |

---

## 8. Launch Checklist

### Pre-Launch: Page Sign-Off

| # | Page | Built | Tested | Data Verified | Approved |
|---|------|-------|--------|---------------|----------|
| 1 | Login + Password Reset | [x] | [ ] | [ ] | [ ] |
| 2 | Dashboard | [ ] | [ ] | [ ] | [ ] |
| 3 | Users Management | [ ] | [ ] | [ ] | [ ] |
| 4 | Events Management | [ ] | [ ] | [ ] | [ ] |
| 5 | Image Moderation | [ ] | [ ] | [ ] | [ ] |
| 6 | Feed Moderation | [ ] | [ ] | [ ] | [ ] |
| 7 | Partners Management | [ ] | [ ] | [ ] | [ ] |
| 8 | Admin Users | [ ] | [ ] | [ ] | [ ] |
| 9 | Analytics | [ ] | [ ] | [ ] | [ ] |
| 10 | Coach Dashboard | [ ] | [ ] | [ ] | [ ] |
| 11 | Gym Dashboard | [ ] | [ ] | [ ] | [ ] |
| 12 | Event Co. Dashboard | [ ] | [ ] | [ ] | [ ] |

### Pre-Launch: Security

- [ ] All admin routes require authentication
- [ ] Role-based access enforced (Super Admin pages blocked for others)
- [ ] Service role key only used server-side (never exposed to browser)
- [ ] CSRF protection enabled
- [ ] Rate limiting on auth endpoints
- [ ] Supabase RLS policies verified
- [ ] No sensitive data in client-side code
- [ ] Environment variables properly configured on Vercel
- [ ] Access tokens rotated after development

### Pre-Launch: Infrastructure

- [ ] Custom domain configured (admin.operation-beast.com)
- [ ] SSL certificate active
- [ ] Vercel deployment working from main branch
- [ ] Supabase project on appropriate plan
- [ ] Database backups configured
- [ ] Error monitoring set up (Sentry or similar)
- [ ] Performance baseline established

### Pre-Launch: Content

- [ ] All 12 sports seeded with correct emoji
- [ ] Sample workouts in database
- [ ] Sample events created
- [ ] Badge definitions created
- [ ] Quest templates configured
- [ ] Pack challenges set up
- [ ] At least one Super Admin account created

### Go-Live Steps

1. [ ] Final code review
2. [ ] Run all test criteria on staging
3. [ ] Sign off on each page (table above)
4. [ ] Configure production environment variables
5. [ ] Deploy to production
6. [ ] Verify all pages on production
7. [ ] Create production admin accounts
8. [ ] Configure custom domain DNS
9. [ ] Monitor for 24 hours
10. [ ] Announce to team

---

## 9. Technical Architecture

```
Browser → Vercel (Next.js 14)
              ├── Server Components → Supabase (service_role_key)
              ├── Server Actions → Supabase (service_role_key)
              └── Client Components → Supabase (anon key, auth only)

Supabase
  ├── Auth (email/password)
  ├── Database (PostgreSQL with RLS)
  ├── Storage (images, documents)
  └── Realtime (future: live updates)
```

### Key Patterns
- **Server Components** for data fetching (no client-side loading states needed)
- **Server Actions** for mutations (form submissions, CRUD operations)
- **React.cache()** for per-request deduplication
- **service_role_key** bypasses RLS for admin operations
- **Audit logging** on all write operations via admin_audit_log table

---

*Document generated for Operation Beast — Beast Tribe project planning.*
