# V1 Development Plan

**Document date:** April 2026  
**Event:** Cafe Cursor Kuala Lumpur — April 7, 2026 (see `packages/core/src/config/event.ts`)  
**Reference:** [v1-doc.md](./v1-doc.md)

---

## Phase Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DEVELOPMENT PHASES                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Phase 1: Schema & Auth ✅ ──┬──► Phase 2: Admin Import ✅                   │
│                              │                 │                             │
│                              │                 ├──► Phase 3: Participant UI ✅│
│                              │                 │                             │
│                              │                 └──► Phase 4: Credits+Checkins ✅
│                              │                           │                   │
│                              │                           ▼                   │
│                              │              Phase 5: Ops Check-in System     │
│                              │              (incl. code assignment + email)  │
│                              │                           │                   │
│                              │                           ▼                   │
│                              │              Phase 7: Admin Dashboard         │
│                              │                                               │
│  ✅ = Complete                                                               │
│  Note: Phase 6 merged into Phase 5, Phase 7 renumbered                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Architectural Decisions

### Dashboard Routing Strategy (Decided: Dec 2, 2025)

**Decision:** Separate routes for different user roles

```
Route Structure:
├── /                  → Landing page (all users, shows login or "Go to Dashboard")
├── /login             → Authentication page
├── /dashboard         → Participant dashboard (participants only)
├── /ops               → Ops scanner dashboard (ops + admin) [Phase 5/6]
└── /admin             → Admin management dashboard (admin only)
```

**Rationale:**
1. **UX Optimization**: Ops scanner needs mobile-first, camera-centric UI. Admin management needs desktop-first, data-table UI.
2. **Device Patterns**: Ops use phones/tablets for scanning. Admins use laptops for management.
3. **Access Control**: Clear separation of permissions per route.

**Landing Page Behavior (`/`):**
- Unauthenticated: Show event info (name, date, location) + "Login" button
- Authenticated Participant: Show event info + "Go to Dashboard" → `/dashboard`
- Authenticated Ops: Show event info + "Go to Dashboard" → placeholder (until `/ops` built)
- Authenticated Admin: Show event info + "Go to Dashboard" → `/admin`

---

## Phase 1: Database Schema & Authentication

**Status:** ✅ Completed  
**Priority:** Critical  
**Estimated Effort:** 1 day  
**Dependencies:** None

### Tasks

- [x] 1.1 Create event schema files in `packages/core/src/business.server/events/schemas/`
  - [x] Enums: `code_status`, `checkin_type` (attendance | meal)
  - [x] `credit-types.sql.ts`
  - [x] `codes.sql.ts`
  - [x] `checkin-types.sql.ts` (admin-configurable check-in categories)
  - [x] `checkin-records.sql.ts` (check-in log entries)
  - [x] `schema.ts` (exports + relations)

- [x] 1.2 Extend `UsersTable` in `packages/core/src/auth/schema.ts`
  - [x] Add `lumaId`, `role`, `participantType`, `status`, `checkedInAt`, `checkedInBy`, `qrCodeValue`
  - [x] Add indexes

- [x] 1.3 Generate and run migrations
  - [x] `pnpm db:generate`
  - [x] `pnpm db:migrate`

- [x] 1.4 Configure Better Auth with magic link plugin
  - [x] Add `magicLink` plugin to `auth.ts`
  - [x] Configure `disableSignUp: true`
  - [x] Add VIP login prevention in `sendMagicLink`

- [x] 1.5 Update auth client with `magicLinkClient` plugin
  - [x] Update `apps/web/src/utils/auth-client.ts`

- [x] 1.6 Create QR code utilities in `packages/core/src/business.server/events/`
  - [x] `events.ts` with `generateQRCodeValue()` and `verifyQRCodeValue()`

- [x] 1.7 Add environment variables
  - [x] `QR_SECRET_KEY` (min 32 chars)
  - [x] `RESEND_API_KEY`

### Deliverable

- ✅ Migrations generated and applied
- ✅ Magic link login flow configured
- ✅ QR code generation utility implemented
- ✅ Email client and templates created
- ✅ Seed script created

---

## Phase 2: Admin - Participant Import

**Status:** ✅ Completed  
**Priority:** Critical  
**Estimated Effort:** 1 day  
**Dependencies:** Phase 1

### Tasks

- [x] 2.0 Login page
  - [x] `/login` route with magic link + Google OAuth
  - [x] Magic link for participants and ops
  - [x] Google OAuth for admin
  - [x] Post-login redirect based on role
  - [x] Error handling for unregistered/VIP users

- [x] 2.1 Create admin route layout with role guard
  - [x] `apps/web/src/routes/admin/` directory
  - [x] Role check middleware (redirect if not admin)

- [x] 2.2 CSV upload component
  - [x] File input with drag-drop
  - [x] Preview parsed data

- [x] 2.3 Participant import server function
  - [x] Parse CSV (email, name, luma_id)
  - [x] Validate format and duplicates
  - [x] Bulk create users with `status: 'registered'`
  - [x] Auto-generate QR code on creation
  - [x] Return skipped rows with reasons

- [x] 2.4 Manual user creation form
  - [x] Name + email input
  - [x] Type selector: VIP | Ops | Admin
  - [x] VIP: `participantType: 'vip'`, cannot login
  - [x] Ops/Admin: set role accordingly

- [x] 2.5 Participant list view
  - [x] Server-side paginated table
  - [x] Filter by status, type, role
  - [x] Search by name/email
  - [x] Status badge (registered/checked_in)

- [x] 2.6 Welcome email trigger
  - [x] "Send Welcome Emails" button
  - [x] Different content for regular vs VIP (VIP includes QR code image)
  - [x] Track sent status per user (`welcomeEmailSentAt` field)

### Deliverable

- ✅ Users can login via magic link or Google OAuth
- ✅ Admin can import 1000 participants from Luma CSV
- ✅ Admin can manually add VIPs, ops, and admin accounts
- ✅ QR codes auto-generated for all users
- ✅ Welcome emails can be batch-sent

---

## Phase 3: Participant Dashboard

**Status:** ✅ Completed  
**Priority:** High  
**Estimated Effort:** 1 day  
**Dependencies:** Phase 1, Phase 2

### Tasks

- [x] 3.1 Dashboard layout (mobile-first)
  - [x] Header with name and logout
  - [x] Status badge (registered/checked-in)

- [x] 3.2 QR code display component
  - [x] Large QR (280px, close to 300px spec)
  - [x] "This QR never expires" message
  - [x] Instructions text

- [~] 3.3 Pre-check-in state
  - [ ] ~~"Check-in opens Dec 6, 9:00 AM" message~~ (deferred per 003-plan.md)
  - [x] QR code visible

- [x] 3.4 Post-check-in state
  - [x] Credits list visible
  - [x] "Checked in at [time]" badge

- [x] 3.5 Credit card component
  - [x] Sponsor icon/name
  - [x] Code value with copy button
  - [x] Redeem URL link
  - [x] Expandable instructions

- [x] 3.6 Mark as redeemed toggle
  - [x] Checkbox per credit
  - [x] Persist to database
  - [x] Filter by status (all/redeemed/pending)

### Deliverable

- ✅ Participants can see their QR code
- ✅ View and copy credit codes after check-in

---

## Phase 4: Admin - Credits & Check-in Types Management

**Status:** ✅ Completed  
**Priority:** High  
**Estimated Effort:** 1 day  
**Dependencies:** Phase 1

### Tasks

#### Check-in Types Management

- [x] 4.1 Check-in type creation form
  - [x] Name (e.g., "Day 1 Attendance", "Day 1 Lunch")
  - [x] Type selector (attendance | meal)
  - [x] Description (optional, shown to ops)
  - [x] Display order
  - [x] Active toggle

- [x] 4.2 Check-in type list view
  - [x] Table with all check-in types (ordered by displayOrder)
  - [x] Edit/toggle active actions
  - [x] Delete action (only if no records exist)

#### Credit Types Management

- [x] 4.3 Credit type creation form
  - [x] Name (internal key)
  - [x] Display name
  - [x] Distribution type (unique or universal)
  - [x] Universal code fields (code, redeem URL, quantity)
  - [x] Email instructions
  - [x] Web instructions
  - [x] Display order
  - [x] Icon URL (optional)
  - [x] Active toggle

- [x] 4.4 Credit type list view
  - [x] Table with all credit types
  - [x] Edit/toggle active/delete actions

- [x] 4.5 Code CSV import per credit type
  - [x] Select credit type (unique distribution only)
  - [x] Upload CSV (code, redeem_url optional)
  - [x] Preview and confirm
  - [x] Duplicate detection
  - [x] Code uppercase normalization

- [x] 4.6 Code pool status display
  - [x] Total codes per type
  - [x] Assigned count
  - [x] Remaining count
  - [x] Visual indicator (green/yellow/red)

### Deliverable

- ✅ Admin can create check-in types (Day 1 Attendance, Day 1 Lunch, Day 1 Dinner, Day 2 Attendance, Day 2 Breakfast)
- ✅ Admin can create credit types with unique or universal distribution
- ✅ Admin can import codes for unique distribution types
- ✅ Universal codes auto-generated on creation
- ✅ Pool status visible with color-coded indicators
- ✅ Credit types can be deleted if no codes assigned

---

## Phase 5: Ops - Check-in System

**Status:** Not Started  
**Priority:** Critical  
**Estimated Effort:** 2 days  
**Dependencies:** Phase 1, Phase 2, Phase 4

> **Note:** This phase combines the original Phase 5 (Registration Check-in) and Phase 6 (Check-in System).
> See detailed plan: `docs/workspace/tasks/005-phase5-ops-checkin/005-plan.md`

### Tasks

#### Route & Layout

- [ ] 5.1 Ops route layout with role guard
  - [ ] `apps/web/src/routes/ops.tsx` layout
  - [ ] Role check (ops or admin)
  - [ ] Mobile-first responsive design

#### QR Scanner Component

- [ ] 5.2 QR scanner component
  - [ ] html5-qrcode integration
  - [ ] Camera access request and error handling
  - [ ] Viewfinder UI with torch toggle

#### Check-in Guest Mode

- [ ] 5.3 Check-in type selector
  - [ ] Fetch active check-in types from DB (ordered)
  - [ ] Radio button list for selection
  - [ ] Default to first item

- [ ] 5.4 Check-in processing server function
  - [ ] QR validation (decode + verify HMAC)
  - [ ] Participant lookup
  - [ ] Duplicate check (unique constraint)
  - [ ] Code assignment on first attendance check-in
  - [ ] Update user status, checkedInAt, checkedInBy
  - [ ] Create checkin_record

- [ ] 5.5 Code assignment algorithm
  - [ ] Transaction with row-level locking (FOR UPDATE SKIP LOCKED)
  - [ ] Assign one code per active credit type
  - [ ] Skip for VIPs
  - [ ] Handle pool exhaustion gracefully

- [ ] 5.6 Success/error popup
  - [ ] Large success message with participant name
  - [ ] Code count assigned (or VIP badge)
  - [ ] Error message if already checked in
  - [ ] Auto-dismiss after 5 seconds + manual close

- [ ] 5.7 Check-in counter
  - [ ] Count per selected check-in type
  - [ ] Refresh on each scan

- [ ] 5.8 Recent scans history
  - [ ] Last 10 scans by current ops user
  - [ ] Name, time, status (success/duplicate)

#### Guest Status Mode

- [ ] 5.9 Guest Status mode
  - [ ] Mode toggle (Check-in Guest / Guest Status)
  - [ ] Scan participant QR
  - [ ] Query all check-in types with status
  - [ ] Display list with checkmarks for completed

#### Email Integration

- [ ] 5.10 Check-in confirmation email
  - [ ] Email template with credits list
  - [ ] Embedded QR code image
  - [ ] Send on first attendance check-in (skip VIPs)

### Deliverable

- Ops can scan QR codes and select check-in type
- Participants checked in with codes assigned on first attendance
- VIPs checked in with badge display (no codes)
- Check Guest Status shows all check-in statuses
- Confirmation email sent with credits
- Real-time counters and recent scans history

---

## Phase 6: Email Integration (Completed)

**Status:** ✅ Complete  
**Priority:** High  
**Estimated Effort:** 1 day  
**Dependencies:** Phase 1

> **Note:** Check-in confirmation email is now part of Phase 5.

### Tasks

- [x] 6.1 Resend client setup
  - [x] `packages/core/src/email/client.ts`
  - [x] Configure API key

- [x] 6.2 Magic link email template
  - [x] HTML template (mobile-responsive)
  - [x] Subject: uses `EVENT_NAME_SHORT` (see `config/event.ts`)
  - [x] Link button with 1-hour expiry note

- [x] 6.3 Welcome email template
  - [x] Subject: uses `EVENT_NAME` (Cafe Cursor Kuala Lumpur)
  - [x] Platform URL
  - [x] Event date/time info

- [x] 6.4 Check-in confirmation email (moved to Phase 5)
  - [x] Subject: "You're Checked In!"
  - [x] Credits list with codes and instructions
  - [x] Embedded QR code image

- [x] 6.5 VIP welcome email (moved to Phase 2)
  - [x] Subject: uses `EVENT_NAME` (VIP variant in `welcome-vip.ts`)
  - [x] QR code image embedded
  - [x] Event venue/time (no separate food schedule block in template)

- [x] 6.6 QR code to PNG conversion
  - [x] Generate data URL from QR value (`qr-image.ts`)
  - [x] Embed as inline image in email

### Deliverable

- ✅ Resend client configured
- ✅ Magic link, welcome, and VIP welcome emails working
- ✅ QR codes embedded in VIP emails
- ✅ Check-in confirmation email (implemented in Phase 5)

---

## Phase 7: Admin Dashboard & Polish

**Status:** Not Started  
**Priority:** Medium  
**Estimated Effort:** 1 day  
**Dependencies:** Phase 5

### Tasks

- [ ] 7.1 Overview stats dashboard
  - [ ] Total registered / checked in
  - [ ] Check-ins per type
  - [ ] Codes assigned per type

- [ ] 7.2 Participant search and detail view
  - [ ] Search by name or email
  - [ ] Detail modal with all info
  - [ ] Assigned codes list

- [ ] 7.3 Manual check-in button
  - [ ] Backup if QR scan fails
  - [ ] Triggers same check-in flow

- [ ] 7.4 VIP check-in workflow
  - [ ] Check-in button in VIP list
  - [ ] Sends VIP email with QR

- [ ] 7.5 Send/resend welcome email action
  - [ ] Button per participant
  - [ ] Bulk send option

- [ ] 7.6 Error handling and edge cases
  - [ ] Network errors
  - [ ] Invalid data handling
  - [ ] Graceful degradation

- [ ] 7.7 Loading states and UX polish
  - [ ] Skeleton loaders
  - [ ] Button loading states
  - [ ] Toast notifications

- [ ] 7.8 Mobile responsiveness check
  - [ ] All dashboards work on mobile
  - [ ] Scanner optimized for tablet

### Deliverable

- Complete admin visibility
- Backup manual operations
- Polish and edge cases handled

---

## Timeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TIMELINE                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Dec 1-2 (Mon-Tue)                                                           │
│  ├── Phase 1: Schema & Auth ✅                                               │
│  └── Phase 2: Admin Import ✅                                                │
│                                                                              │
│  Dec 2-3 (Tue-Wed)                                                           │
│  ├── Phase 3: Participant Dashboard ✅                                       │
│  └── Phase 4: Credits & Check-in Types ✅                                    │
│                                                                              │
│  Dec 3-4 (Wed-Thu)                                                           │
│  └── Phase 5: Ops Check-in System (incl. confirmation email)                 │
│                                                                              │
│  Dec 4-5 (Thu-Fri)                                                           │
│  ├── Phase 5: Complete                                                       │
│  └── Phase 7: Admin Dashboard & Polish                                       │
│                                                                              │
│  Dec 5 (Fri)                                                                 │
│  └── Final testing with 100+ test users                                      │
│                                                                              │
│  Dec 6-7 (Sat-Sun)                                                           │
│  └── EVENT DAY                                                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Testing Checkpoints

| After Phase | Test Scenario                                               | Status |
| ----------- | ----------------------------------------------------------- | ------ |
| 1           | Run migrations, test magic link login flow                  | ✅     |
| 2           | Import 10 test users from CSV, verify QR generated          | ✅     |
| 3           | Login as participant, view QR, test copy button             | ✅     |
| 4           | Create check-in types, create credit type, import 10 codes  | ✅     |
| 5           | Full check-in flow: type selection, scan, codes, email      |        |
| 7           | End-to-end with 100+ test users, stress test scanner        |        |

---

## Pre-Event Checklist

- [ ] 1000 participants imported from Luma (admin import ready)
- [ ] All 6 credit types created
- [ ] All sponsor codes imported
- [ ] VIPs added and ready (manual creation ready)
- [ ] Welcome emails sent to all participants (send function ready)
- [ ] Ops accounts created (manual creation ready)
- [ ] Admin accounts created (manual creation ready)
- [ ] Test check-in flow on event venue WiFi
- [ ] Backup manual check-in process documented
- [ ] Scanner devices tested (phones/tablets)

---

## Risk Mitigation

| Risk                      | Mitigation                                          |
| ------------------------- | --------------------------------------------------- |
| Scanner camera issues     | Manual lookup by email in admin                     |
| Code pool exhaustion      | Monitor in admin dashboard, have backup codes       |
| Email delivery delays     | QR visible in dashboard, don't rely solely on email |
| Network issues at venue   | Test on venue WiFi before event                     |
| Concurrent scan conflicts | Row-level locking in PostgreSQL                     |
