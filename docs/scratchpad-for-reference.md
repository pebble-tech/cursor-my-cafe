# Scratchpad - Cafe Cursor KL platform (historical flows; align copy with `config/event.ts`)

## Understanding from wireframes

- Left screen: QR code display for participant to show
- Middle screen: List of credits/codes they can redeem (Cursor, Anthropic, ElevenLabs shown)
- Right screen: Profile/settings page

## Core Flows - PHASE 1 ONLY

### 1. Pre-Event Setup Flow

```
1. Admin exports "going" guests from Luma → CSV (name, email, luma_id)
2. Admin imports CSV into platform
3. System creates 1000 participant records (status: registered, participant_type: regular)
4. Sponsors provide credit codes → CSV (type, code_value, redeem_url)
5. Admin adds email_instructions & web_instructions per credit type
6. Admin imports credit CSV
7. System auto-assigns codes to all 1000 participants (status: hidden)
8. Admin manually adds VIPs (name, email) → participant_type: vip, no codes assigned
9. Event day begins
```

### 2. Day 1 - Regular Participant Check-in Flow

```
1. Participant checks in at Luma registration desk (physical check-in)
2. Luma sends webhook to our backend: {email, luma_id, checked_in_at}
3. Backend finds participant by email/luma_id
4. Backend updates: status = checked_in, checked_in_at = timestamp
5. Backend reveals all codes: status hidden → available, revealed_at = timestamp
6. Backend triggers email via Resend:

   Subject: Welcome to Cafe Cursor Kuala Lumpur!

   Body:
   - Welcome message
   - Magic link to login: platform.com/login?email=[email]
   - List of ALL credits with email_instructions:
     ━━━━━━━━━━━━━━━━
     CURSOR (50 credits)
     Code: ABC123
     URL: cursor.com/redeem
     Instructions: [email_instructions from DB]
     ━━━━━━━━━━━━━━━━
     [... repeat for each credit type ...]
   - Note: "Access platform for QR code and detailed instructions"

7. Participant can now:
   - Click magic link → Login (or manually enter email for magic code)
   - View dashboard with QR code (auto-refreshes every 2 min)
   - See credit list with web_instructions
   - Click "Mark as redeemed" after using codes
```

### 3. Day 1 - VIP Check-in Flow

```
1. VIP checks in at registration desk
2. Admin manually marks VIP as checked-in in admin dashboard
   OR Luma webhook triggers (if VIP was added to Luma)
3. Backend updates: status = checked_in
4. Backend generates permanent QR code (qr_expires = false)
5. Backend triggers email via Resend:

   Subject: Welcome VIP - Cafe Cursor Kuala Lumpur

   Body:
   - Welcome message
   - QR code image embedded (or link to static QR image)
   - Instructions: "Show this QR at food stations"
   - Note: "No login needed, your QR never expires"

6. VIP shows QR code from email at food stations
7. VIP does NOT login to platform, does NOT receive credits
```

### 4. Participant Login Flow

```
1. Participant visits platform.com
2. Enters email address
3. System checks:
   - Email exists in participant table?
   - Status = checked_in? (reject if not checked in yet)
   - Participant_type = regular? (VIPs can't login)
4. If valid:
   - Generate 6-digit magic code (expires in 15 min)
   - Send via Resend to email
5. Participant enters code
6. System validates code → Create session
7. Redirect to dashboard
```

### 5. QR Code Generation & Validation

```
REGULAR PARTICIPANT QR:
- Format: JWT or signed payload
- Payload: {participant_id, timestamp, signature}
- Valid for: 2 minutes from timestamp
- Auto-refresh: Frontend polls every 2 min, requests new QR
- Server validates: timestamp within 2-min window + signature valid

VIP QR:
- Format: Simple UUID or signed payload without timestamp
- Payload: {participant_id, type: vip, signature}
- Valid for: Forever (no timestamp check)
- No refresh needed
- Server validates: signature valid + participant_type = vip
```

### 6. Food Check-in Flow (Ops Scanner)

```
1. Ops volunteer opens ops dashboard
2. Selects meal type from dropdown:
   - LUNCH_D1 (Dec 6 lunch)
   - DINNER_D1 (Dec 6 dinner)
   - BREAKFAST_D2 (Dec 7 breakfast)
3. Scans participant QR code (camera access)
4. System validates:

   For regular participants:
   a. Decode QR → extract participant_id, timestamp
   b. Check signature valid?
   c. Check timestamp within 2-min window? (server time - QR time < 120 sec)
   d. Check participant checked_in = true?
   e. Query FoodCheckin table: already claimed this meal type?

   For VIPs:
   a. Decode QR → extract participant_id
   b. Check signature valid?
   c. Check participant_type = vip?
   d. Query FoodCheckin table: already claimed this meal type?

5. Results:
   ✓ Valid & first time:
     - Insert FoodCheckin record
     - Show success: "[Name] - Lunch checked in ✓"

   ✗ Already claimed:
     - Show error: "[Name] already claimed lunch at [time]"

   ✗ Invalid QR (expired/bad signature):
     - Show error: "Invalid QR code, ask participant to refresh"

   ✗ Not checked in:
     - Show error: "Participant not checked in yet"

6. Ops can scan next participant
```

### 7. Admin Dashboard - VIP Management

```
1. Admin clicks "Add VIP"
2. Form: Name, Email
3. Submit → System creates:
   - Participant record: participant_type=vip, status=registered, qr_expires=false
   - Generate permanent QR code
4. Admin sees VIP in participant list with 🌟 VIP badge
5. When VIP checks in (manual or webhook):
   - Admin clicks "Mark as checked in" OR webhook auto-triggers
   - System sends email with permanent QR code
```

### 3. Login Flow

- User visits platform with email from Luma registration
- Enter email → System checks if email exists in synced guest list
- If exists: Send magic code via Resend
- If not: Reject with message "Email not found in registration"
- Magic code valid for X minutes (15 mins?)

### 4. QR Code System

- Each participant gets a unique QR code (UUID-based?)
- QR code payload: participant ID + timestamp + signature
- QR refreshes every 2 mins automatically
- **TECH NOTE**: Need server-side validation of timestamp to prevent replays

### 5. Credits Distribution

Based on sponsors doc:

- Cursor: ~50 credits per attendee (need code generation)
- Anthropic: 25 API credits (need code generation)
- ElevenLabs: 6-month Scale tier (winner-only, manual?)
- LeanMCP: 1-week Pro for all (need code generation)
- Mobbin: 3-month subs for all (need code generation)
- Plus other track-specific credits

**QUESTION**: Who generates these codes? Us or sponsors?
**QUESTION**: Are codes pre-generated or generated on-demand when participant clicks "Redeem"?
**QUESTION**: Do all participants get all credits, or only specific ones?

### 6. Food Check-in System

Types of food:

- Sponsored meals (lunch D1, possibly dinner D1, breakfast D2)
- Physical vouchers from external cafes/businesses

For sponsored meals:

- Participant shows QR code
- Volunteer scans QR with ops device
- System checks: Already claimed for this meal? Yes → Reject, No → Allow & mark as claimed
- Need separate check-in types: LUNCH_D1, DINNER_D1, BREAKFAST_D2

For voucher distribution:

- Physical vouchers handed out (outside our system scope?)
- **QUESTION**: Do we track physical voucher distribution in system?

### 7. Roles & Permissions

1. **Admin**: Full access - manage everything
2. **Ops**: Scan QR codes, check in people for meals, view participant list
3. **Participant**: View own QR, redeem credits, update profile

**QUESTION**: Can Admin manually add VIP/sponsors? What fields needed?
**QUESTION**: Can Ops see all participant details or just scan function?

### 8. Workshop Registration (GTH - Good To Have)

- List of workshops with capacity limits
- First-come-first-serve
- Participant can register from platform
- Ops/Admin can see registration list per workshop
- **QUESTION**: Can participants cancel registration?
- **QUESTION**: Do workshops have time slots or just capacity?

### 9. Team Management (GTH)

- Participants can create/join teams post-registration
- Link team members together
- **QUESTION**: Team size limits (2-4 people typical)?
- **QUESTION**: Team captain system or equal members?
- **QUESTION**: What data do you need from teams? Team name, project name, members only?

## Data models to think about

### Guest/Participant (UPDATED)

- id, email, name, luma_id (nullable for VIPs)
- role (participant/ops/admin)
- participant_type (regular/vip) ← NEW: to distinguish VIPs
- status (registered/checked_in)
- checked_in_at, created_at, updated_at
- qr_code_secret (UUID for generating time-based QR)
- bio (text, for profile page)

**Note**: VIPs have participant_type=vip, no credits assigned, QR code for food only

### Credit/Code (PHASE 1 - UPDATED)

- id, type (cursor/anthropic/elevenlabs/leanmcp/mobbin/etc)
- code_value (actual redemption code from sponsor)
- redeem_url (where to redeem, from sponsor)
- email_instructions (concise plain text for email, written by us)
- web_instructions (detailed HTML/Markdown for web, written by us)
- assigned_to (participant_id, auto-assigned on import)
- redeemed_at (nullable, self-reported by participant marking as redeemed)
- status (hidden/available/redeemed)
  - hidden: participant hasn't checked in yet
  - available: checked in, codes revealed
  - redeemed: participant marked as used
- revealed_at (timestamp when participant checked in)
- created_at, updated_at

**Import flow**:

1. Sponsor provides CSV: `type, code_value, redeem_url`
2. Admin writes email_instructions & web_instructions per type
3. Admin imports CSV → System auto-assigns to all participants
4. Codes stay status=hidden until check-in

### FoodCheckin

- id, participant_id, meal_type (LUNCH_D1/DINNER_D1/BREAKFAST_D2)
- checked_in_by (ops user id)
- checked_in_at

### Workshop (GTH) (UPDATED)

- id, name, description
- date, time_slot_start, time_slot_end
- capacity, current_registrations (computed)
- location (optional)
- created_at, updated_at

### WorkshopRegistration (GTH) (UPDATED)

- id, participant_id, workshop_id
- registered_at, cancelled_at (nullable)
- status (registered/cancelled)

**Business Rules**:

- Participants can register for multiple workshops if no time conflict
- Participants can cancel registration (how far in advance? TBD - Q19)
- First-come-first-serve up to capacity
- No info collection during registration (just click and register)

### Team (GTH)

- id, name, project_name, created_by, created_at

### TeamMember (GTH)

- id, team_id, participant_id, joined_at

## Tech Stack Notes

- Convex: Backend + DB
- Better Auth: Auth system (with magic link support)
- Tanstack Start: Frontend framework
- Hono: API routes
- Resend: Email delivery

## ANSWERED - Critical questions

1. **Credit code generation**: Sponsors pre-generate → We assign to participants → Reveal after check-in ✓
2. **Luma sync**: One-time import before event (no day-of registration support) ✓
3. **VIP/Sponsor manual add**: Name + Email only, QR code for food check-in ONLY (no credits) ✓
4. **Physical vouchers**: Fully offline (out of scope) ✓
5. **Workshop details**: Has date + timeslot, participants can cancel ✓
6. **Team size limits**: NEED TO ASK
7. **Email content**: Include ALL codes + instructions directly in email ✓
8. **QR security**: Ops devices need internet (online-only scanning) ✓

## NEW QUESTIONS from answers

### Credit Code System Flow

- Sponsors give us bulk codes (CSV format?)
- We import codes into system
- We assign codes to participants (auto-assign on import? manual assignment?)
- Codes are "hidden" until participant checks in via Luma
- After Luma webhook confirms check-in → Codes become visible in participant dashboard
- **Q14**: What format do sponsors provide codes in? CSV with columns like code, redeem_url, instructions?
- **Q15**: Do we auto-assign codes to all "going" participants when importing codes, or wait until check-in?
- **Q16**: If a sponsor provides 1000 codes but we have 1200 participants, how do we handle shortage?

### Email Instructions Strategy

Your idea: 2 fields per credit type (email_instructions, web_instructions)

- email_instructions: Plain text or simple HTML for email
- web_instructions: Rich HTML/Markdown for web display

This makes sense. Alternative approach:

- Single instruction field with template variables like {{redemption_url}}, {{code}}
- System renders differently based on context (email vs web)

**Q17**: Your 2-field approach is cleaner. Confirm this is the way to go?

### Workshop System Details

- Workshops have date + time slot + capacity
- Participants can register and cancel
- **Q18**: Can participants register for multiple workshops if time slots don't conflict?
- **Q19**: How far in advance can they cancel? (e.g., up to 1 hour before workshop starts?)
- **Q20**: Do you need to collect any info during workshop registration (e.g., "Why do you want to attend?") or just click and register?

### Team Management

- **Q21**: Team size limits? (typical is 2-4, some allow up to 6)
- **Q22**: Can participants be in multiple teams or just one?
- **Q23**: What info do you need per team? Team name, project name/description, team captain designation?
- **Q24**: Can team captain remove members, or can members only leave voluntarily?

### VIP/Sponsor Edge Cases

VIPs get: Name, Email, QR code for food only (no credits, no vouchers)

- **Q25**: Do VIPs still need to "check in" on Day 1, or are they auto-checked-in when admin adds them?
- **Q26**: Can VIPs access the platform to see their QR code, or is their QR code sent via email?
- **Q27**: Do VIPs show up in the participant list that ops see, or separate "VIP list"?

## Edge cases to handle

1. Guest registers last minute on Luma → How do they get into system?
2. Guest loses internet → QR code won't refresh (accept last valid QR within 5 min window?)
3. Ops device loses internet → Queue scan events locally, sync later?
4. Guest changes email after Luma registration → Can't login (support flow needed?)
5. Guest tries to share screenshot of QR → Timestamp validation prevents this
6. Multiple ops scanning same person simultaneously → Use optimistic locking/transaction
7. Guest didn't receive magic code email → Resend button with rate limit
8. Admin manually adds VIP with wrong email → Edit function needed?

## Dashboard features needed (admin/ops)

### Admin Dashboard

- Import guest list from CSV
- View all participants (search, filter by status)
- Manually add VIP/sponsors
- Configure credit codes (add new code types, edit redemption URLs)
- View food check-in stats (how many people claimed lunch, etc)
- Workshop management (GTH)
- Export data for reporting

### Ops Dashboard

- QR scanner interface (camera access)
- Select meal type (lunch/dinner/breakfast) before scanning
- Real-time feedback (success/already claimed/invalid)
- View today's check-in count
- Search participant by name/email to manually check-in if QR fails

### Participant Dashboard

- View & display QR code (auto-refresh)
- List of available credits with redeem buttons
- Profile page (view/edit name, email read-only, add bio)
- Workshop registration list (GTH)
- Team management (GTH)

## Missing info that would be good to know

- Approximate timing: When do credits become available? Immediately after check-in or after certain milestone (e.g., after opening ceremony)?
- Do all 1,200 expected participants get all credits, or tiered based on something?
- Is there a "admin announcement" feature needed? (e.g., "Dinner is ready")
- Do you need participant-to-participant discovery/networking features?
- Should ops be able to manually mark food as claimed if system fails?
