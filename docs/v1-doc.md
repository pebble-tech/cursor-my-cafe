## Cafe Cursor Kuala Lumpur — event platform

## Requirements Documentation v1.0

**Document date:** April 2026  
**Event date:** April 7, 2026  
**Public listing:** https://luma.com/z3o7i2m8  
**Venue:** Afloat Coffee Roaster, Kuala Lumpur, Malaysia  

---

## Executive Summary

This repo powers check-in, credits, and participant communications for **Cafe Cursor Kuala Lumpur** — a Cursor community coworking/meetup (not the former Monash hackathon). The same platform patterns apply: QR check-in, sponsor credits, ops scanning, and admin import. **PDF/electronic certificates are not part of the product** (removed); participant display names come from import/admin only unless a future profile edit is added.

### Primary Objectives

1. **Simplified Check-in Process**: Enable fast, QR-based check-in for participants and VIPs
2. **Automated Credit Distribution**: Distribute sponsor credits (Cursor, Anthropic, ElevenLabs, etc.) to participants upon check-in on a first-come-first-serve basis
3. **Flexible Check-in System**: Admin-configurable check-in types (attendance, meals) with duplicate prevention
4. **VIP Handling**: Provide special treatment for VIP guests with permanent QR codes and no credit distribution
5. **Self-Service Platform**: Allow participants to access their QR codes and credits via web dashboard

### Key Features

- **Pre-Event Guest Import**: Bulk import approved participants from Luma CSV
- **Magic Link Authentication**: Passwordless login using email magic links
- **Permanent QR Codes**: Single QR code per participant for all interactions (check-in + food)
- **First-Come-First-Serve Credits**: Automatic code assignment during registration check-in until pool exhausts
- **Ops Scanner Interface**: Dedicated dashboard for operations volunteers to scan QR codes
- **Email Notifications**: Automated emails with credits and QR codes after check-in
- **VIP Management**: Separate workflow for VIP guests with email-only QR distribution

### Success Criteria

- 1,000 participants imported and ready before event day
- 95%+ successful check-ins on event day (Dec 6)
- Zero duplicate check-ins across all check-in types
- < 30 seconds average check-in time per participant
- All participants receive credit codes within 2 minutes of check-in

---

## System Overview

### Architecture Components

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (Web App)                    │
│  - Participant Dashboard (Mobile-First)                 │
│  - Ops Scanner Dashboard (Mobile/Tablet)                │
│  - Admin Dashboard (Desktop)                            │
│  Tech: TanStack Start + React 19 + Tailwind v4          │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│                   API Layer                             │
│  - Server Functions (TanStack Start)                    │
│  - Server Routes (webhooks, auth callbacks)             │
│  - TanStack Query (data fetching)                       │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│              Backend & Database                         │
│  - PostgreSQL (Database)                                │
│  - Drizzle ORM (Type-safe queries)                      │
│  - Better Auth + Magic Link Plugin (Authentication)     │
│  - Resend (Email Delivery)                              │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

| Component          | Technology                      | Purpose                                    |
| ------------------ | ------------------------------- | ------------------------------------------ |
| Frontend Framework | TanStack Start                  | React 19 full-stack framework              |
| Styling            | Tailwind v4 + Shadcn UI         | Component library and styling              |
| Data Fetching      | TanStack Query                  | Server state management                    |
| Database           | PostgreSQL                      | Relational database with row-level locking |
| ORM                | Drizzle ORM                     | Type-safe database queries                 |
| Authentication     | Better Auth + Magic Link Plugin | Passwordless authentication                |
| Email Service      | Resend                          | Transactional emails                       |
| QR Generation      | qrcode library                  | QR code generation                         |
| QR Scanning        | html5-qrcode                    | Camera-based QR scanning                   |

### User Journey Overview

```
Pre-Event:
Admin → Import Participants → System Sends Welcome Email

Participant → Receives Email → Clicks Platform URL → Enters Email →
Receives Magic Link → Logs In → Sees QR Code

Event Day:
Participant → Shows QR at Registration → Ops Scans → System Checks In →
Assigns Credits → Sends Email → Dashboard Updates

Throughout Event:
Participant → Shows QR at Food Station → Ops Scans → System Records →
Prevents Duplicates
```

---

## User Roles & Permissions

### 1. Participant (Regular)

**Access Level:** Limited  
**Count:** ~1,000  
**Authentication:** Magic link via email

**Permissions:**

- ✅ Login to platform with Luma-registered email
- ✅ View personal QR code (permanent, never expires)
- ✅ View assigned credits after check-in
- ✅ Copy credit codes
- ✅ Mark credits as redeemed
- ✅ Edit profile name
- ❌ Cannot access other participants' data
- ❌ Cannot perform check-ins
- ❌ Cannot access admin functions

**Dashboard Features:**

- QR code display (permanent)
- Credits list with copy buttons
- Redemption instructions (detailed web version)
- Profile settings

### 2. VIP

**Access Level:** Email-only (no platform login)  
**Count:** ~10-50  
**Authentication:** None (email-only access)

**Permissions:**

- ❌ Cannot login to platform
- ✅ Receives permanent QR code via email
- ✅ Can use QR for check-ins only
- ❌ Does not receive credit codes
- ❌ No dashboard access

**Workflow:**

- Admin manually adds VIP
- Admin checks in VIP on event day
- VIP receives email with permanent QR code image
- VIP shows QR from email at food stations

### 3. Operations (Ops)

**Access Level:** Medium  
**Count:** ~10-20 volunteers  
**Authentication:** Magic link via email

**Permissions:**

- ✅ Login to ops dashboard
- ✅ Scan participant QR codes
- ✅ Process check-ins (registration desk)
- ✅ Process check-ins (all types)
- ✅ View real-time check-in counts
- ✅ View recent scan history
- ❌ Cannot edit participant data
- ❌ Cannot import/export data
- ❌ Cannot manage credits

**Dashboard Features:**

- QR scanner interface (camera access)
- Check-in type selector (admin-configurable, e.g., Day 1 Attendance, Day 1 Lunch)
- Check Guest Status mode (view all check-in statuses)
- Real-time feedback (success/error messages)
- Participant name display after scan
- Check-in counters and statistics
- Recent scans history (last 10)

### 4. Administrator (Admin)

**Access Level:** Full  
**Count:** ~3-5 organizers  
**Authentication:** Magic link via email

**Permissions:**

- ✅ All Ops permissions
- ✅ Import participants from CSV
- ✅ Create and manage credit types
- ✅ Import credit codes in bulk
- ✅ Add and manage VIPs
- ✅ Manual check-in participants (backup)
- ✅ View all participant data
- ✅ Edit participant information
- ✅ Send welcome emails
- ✅ Export reports (Phase 2)
- ✅ View system-wide statistics

**Dashboard Features:**

- Participant management (import, view, edit)
- Credit management (types, codes, import)
- VIP management (add, check-in)
- System statistics and dashboards
- Manual override functions

### Permission Matrix

| Feature               | Participant | VIP  | Ops | Admin |
| --------------------- | ----------- | ---- | --- | ----- |
| Login to platform     | ✅          | ❌   | ✅  | ✅    |
| View own QR code      | ✅          | ❌\* | ❌  | ✅    |
| View own credits      | ✅          | ❌   | ❌  | ✅    |
| Mark credits redeemed | ✅          | ❌   | ❌  | ✅    |
| Scan QR codes         | ❌          | ❌   | ✅  | ✅    |
| Check in participants | ❌          | ❌   | ✅  | ✅    |
| Import participants   | ❌          | ❌   | ❌  | ✅    |
| Manage credit types   | ❌          | ❌   | ❌  | ✅    |
| Import codes          | ❌          | ❌   | ❌  | ✅    |
| Add VIPs              | ❌          | ❌   | ❌  | ✅    |
| View all participants | ❌          | ❌   | ✅  | ✅    |
| Export data           | ❌          | ❌   | ❌  | ✅    |

\*VIPs receive QR via email, not through platform

---

## Phase 1: Core Features (MVP)

These features are required for the event to function successfully on the scheduled event date (see `packages/core/src/config/event.ts` for current public copy).

### 1. Participant Management

#### 1.1 Guest Import from Luma

**Purpose:** Import pre-approved participants from Luma event platform

**Process:**

1. Admin exports "going" participants from Luma as CSV
2. CSV contains: `email`, `name`, `luma_id`
3. Admin uploads CSV to platform
4. System validates format and data integrity
5. System creates participant records with `status: registered`
6. System sends welcome email to all imported participants

**CSV Format:**

```csv
email,name,luma_id
john@example.com,John Doe,luma_abc123
sarah@example.com,Sarah Lee,luma_def456
```

**Validation Rules:**

- Email must be valid format
- Email must be unique (no duplicates)
- Name must not be empty
- Luma ID optional but recommended

**Welcome Email Template:** (actual copy in `packages/core/src/email/templates/welcome.ts`)

```
Subject: Welcome to Cafe Cursor Kuala Lumpur!

Hi [Name],

You're registered for Cafe Cursor Kuala Lumpur.

Event details, venue, and Luma link are in the HTML email; use [Platform URL]/login with this email.
```

#### 1.2 VIP Management

**Purpose:** Handle VIP guests who don't register via Luma

**Process:**

1. Admin manually adds VIP (name + email)
2. System creates VIP record with `participant_type: vip`
3. System generates permanent QR code immediately
4. VIP cannot login to platform (email-only workflow)
5. On event day, admin manually checks in VIP
6. System sends VIP email with QR code image

**VIP Characteristics:**

- No credit codes assigned
- Permanent QR code (never expires)
- Email-only access (no platform login)
- Special badge shown to ops during scans
- Food access only (no hackathon credits)

**VIP welcome email:** See `packages/core/src/email/templates/welcome-vip.ts` — same **Cafe Cursor Kuala Lumpur** venue/date as regular welcome; QR embedded for check-in.

### 2. Authentication System

#### 2.1 Magic Link Login

**Purpose:** Passwordless authentication for participants and staff

**Process:**

1. User visits platform URL
2. User enters email address
3. System validates email exists in database
4. If valid, system generates magic link (expires 1 hour)
5. System sends magic link via email
6. User clicks link to login
7. System creates session (lasts 7 days)

**Email Validation:**

- Email must exist in participant table
- Email must match Luma registration
- Error message if not found: "Email not registered. Please use your Luma registration email."

**Magic Link Email:**

```
Subject: Login to Hackathon Dashboard

Hi [Name],

Click here to login (expires in 1 hour):
[Platform URL]/auth/verify?token=[UUID]

If you didn't request this, please ignore this email.
```

**Security Features:**

- One-time use tokens
- 1-hour expiration
- Token marked as used after login
- 7-day session duration
- Rate limiting: Max 5 requests per 15 minutes per email

#### 2.2 Session Management

**Session Duration:** 7 days  
**Storage:** Server-side session storage  
**Logout:** Manual logout clears session immediately

### 3. QR Code System

#### 3.1 QR Code Generation

**Key Design Decision:** Permanent QR codes (no expiration)

**Rationale:**

- Simpler event day logistics (no refresh issues)
- Works offline (participants can screenshot)
- No clock synchronization problems
- Duplicate prevention handled by session tracking, not timestamps

**QR Code Format:**

```json
{
  "participant_id": "uuid-here",
  "type": "permanent",
  "signature": "hmac-sha256-signature"
}
```

**Generation Timing:**

- **Regular Participants:** Generated on first login
- **VIPs:** Generated when admin adds VIP

**Storage:** QR code value stored in database (`participant.qr_code_value`)

#### 3.2 QR Code Validation

**Server-Side Validation Process:**

1. Decode QR payload
2. Extract `participant_id`
3. Verify HMAC signature
4. Look up participant in database
5. Validate against business rules for selected check-in type

**Validation Logic:**

**For Registration Check-in (Day 1 Attendance):**

```
IF participant.status == "registered":
  ✓ Valid - proceed with check-in
ELSE IF participant.status == "checked_in":
  ✗ Invalid - already checked in
```

**For Other Check-in Types:**

```
IF participant.status != "checked_in":
  ✗ Invalid - must check in at registration first
ELSE:
  Check checkin_records table for checkin_type
  IF already checked in:
    ✗ Invalid - duplicate check-in
  ELSE:
    ✓ Valid - proceed
```

**Security Features:**

- HMAC-SHA256 signature verification
- Server-side validation only (never trust client)
- Rate limiting on validation attempts
- Audit logging of all scans

#### 3.3 QR Code Display

**Participant Dashboard:**

- Large, scannable QR code (300x300px minimum)
- "This QR never expires" message
- Instructions: "Show this at registration desk" or "Show at food stations"
- Can be screenshotted and saved offline

**VIP Email:**

- QR code embedded as image (PNG format)
- High resolution (600x600px)
- Instructions included in email body

### 4. Check-in Process

#### 4.1 Registration Check-in Flow

**Location:** Registration desk, Auditorium 1, Building 9  
**Time:** Dec 6, 9:00 AM - 11:00 PM  
**Staff:** Ops volunteers with scanner devices

**Step-by-Step Process:**

**Participant Actions:**

1. Arrives at registration desk
2. Opens platform on mobile device
3. Navigates to QR code page
4. Shows QR to ops volunteer

**Ops Actions:**

1. Opens ops dashboard
2. Selects "Day 1 Attendance" check-in type
3. Points camera at participant's QR code
4. Waits for scan result
5. Confirms success or handles error

**System Actions:**

1. Decodes QR code payload
2. Verifies signature is valid
3. Looks up participant by `participant_id`
4. Checks current status:
   - If `registered`: Proceed to step 5
   - If `checked_in`: Show error "Already checked in at [time]"
5. Creates checkin_record for "Day 1 Attendance"
6. Updates participant: `status = "checked_in"`, `checked_in_at = NOW()`
7. **Assigns codes** (see 4.2 below)
8. Sends check-in confirmation email
9. Shows success message to ops

**Success Display (Ops):**

```
✓ John Doe
Checked in successfully
6 codes assigned
```

**Error Display (Ops):**

```
⚠️ John Doe
Already checked in at 10:34 AM
```

#### 4.2 Code Assignment Algorithm

**Trigger:** Immediately upon successful check-in  
**Method:** First-come-first-serve from unassigned code pool

**Algorithm:**

```
assigned_codes = []

FOR EACH active_credit_type IN active_credit_types:

  // Lock one unassigned code
  code = SELECT * FROM codes
         WHERE credit_type_id = active_credit_type.id
         AND assigned_to IS NULL
         LIMIT 1
         FOR UPDATE  // Row-level lock

  IF code EXISTS:
    // Assign to participant
    UPDATE codes
    SET assigned_to = participant.id,
        assigned_at = NOW(),
        status = 'available'
    WHERE id = code.id

    assigned_codes.push({
      credit_type: active_credit_type,
      code: code
    })

  ELSE:
    // No codes left for this type
    LOG WARNING: "Code exhausted for {credit_type.name}"
    // Participant won't receive this credit type

END FOR

RETURN assigned_codes
```

**Handling Code Shortages:**

- If a credit type runs out of codes, late participants simply don't receive that credit
- No error shown to participant (they only see what they got)
- Warning logged for admin review
- Email includes only assigned credits

**Example Scenarios:**

**Scenario A:** Participant #1 (early arrival)

- All 6 credit types have available codes
- Receives codes from: Cursor, Anthropic, ElevenLabs, LeanMCP, Mobbin, Vercel
- Email lists all 6 credits

**Scenario B:** Participant #900 (late arrival)

- Cursor codes exhausted (only 800 available)
- Receives codes from: Anthropic, ElevenLabs, LeanMCP, Mobbin, Vercel
- Email lists only 5 credits
- No mention of Cursor (participant doesn't know it existed)

#### 4.3 Check-in Confirmation Email

**Sent:** Immediately after successful check-in  
**Delivery:** Via Resend API  
**Format:** HTML with embedded QR image

**Email Template:**

````
Subject: You're Checked In! 🎉

Hi [Name],

Welcome to Cafe Cursor Kuala Lumpur! You're all checked in. ✓

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 YOUR CREDITS

[FOR EACH assigned credit:]

[DISPLAY NAME]
Code: [code_value]
Redeem: [redeem_url]
Instructions: [email_instructions]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Example:
CURSOR PRO CREDITS (50 credits)
Code: ABC123XYZ
Redeem: https://cursor.com/redeem
Instructions: Login to Cursor, go to Settings > Billing,
paste your code in the redemption field.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🍽️ YOUR FOOD QR CODE

[QR Code Image Embedded - 400x400px]

Show this QR code at food stations for:
• Lunch (Dec 6, 12:00 PM)
• Dinner (Dec 6, 6:00 PM)
• Breakfast (Dec 7, 9:00 AM)

You### 5. Credit Management System

#### 5.1 Credit Type Creation

**Purpose:** Define categories of sponsor credits with instructions

**Admin Workflow:**
1. Navigate to Credit Management → Create Credit Type
2. Fill form with required fields
3. Select distribution type (unique or universal)
4. Save credit type
5. For unique types: import codes via CSV
6. For universal types: codes are auto-generated on creation

**Required Fields:**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| Name | String | Internal identifier (lowercase, no spaces) | `cursor` |
| Display Name | String | Shown to participants | `Cursor Pro Credits - 50 credits` |
| Distribution Type | Enum | 'unique' (CSV import) or 'universal' (same code for all) | `unique` |
| Email Instructions | Text | Concise text for email | `Login to cursor.com, go to Settings > Billing, paste code` |
| Web Instructions | Text | Plain text for dashboard | `How to Redeem: Go to cursor.com...` |
| Display Order | Integer | Sorting order in lists | `1` |
| Icon URL | String (optional) | Logo/icon for UI | `https://cdn.../cursor.png` |
| Is Active | Boolean | Enable/disable credit type | `true` |

**Universal Distribution Fields (required if distributionType is 'universal'):**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| Universal Code | String | The shared code value (auto-uppercased) | `CURSOR50` |
| Universal Redeem URL | String (optional) | The shared redemption URL | `https://cursor.com/redeem` |
| Universal Quantity | Integer | Number of code records to generate | `1000` |

**Business Rules:**
- Name must be unique
- Display order determines sort position in participant dashboard
- Inactive credit types won't assign codes during registration check-in
- Instructions are shared by all codes of this type
- All code values are normalized to uppercase
- Universal codes create N identical code records that are individually assigned to participants

**Example Credit Types:**
1. Cursor Pro Credits - 50 credits
2. Anthropic API Credits - 25 credits
3. ElevenLabs Voice AI - 6 month Scale tier
4. LeanMCP Pro - 1 week trial
5. Mobbin Pro - 3 month subscription
6. Vercel Deployment Credits - 5000 credits

#### 5.2 Code Import Process

**Purpose:** Bulk import redemption codes from sponsors

**Prerequisite:** Credit type must be created with `distributionType: 'unique'`

**Note:** This applies only to unique distribution types. Universal distribution types have codes auto-generated on creation.

**CSV Format:**
```csv
code,redeem_url
ABC123XYZ,https://cursor.com/redeem
DEF456ABC,
GHI789DEF,https://cursor.com/redeem
````

Note: `redeem_url` column is optional - empty values are allowed.

**Admin Workflow:**

1. Receive code CSV from sponsor
2. Navigate to Credit Management
3. Select credit type (e.g., "Cursor")
4. Click "Import Codes"
5. Upload CSV file
6. Review preview: "Will import X codes for [Credit Type]"
7. Confirm import
8. System validates and imports codes

**Validation Rules:**

- CSV must have `code` column (required), `redeem_url` column (optional)
- Code values must be unique within credit type
- Code values are normalized to uppercase
- Redeem URL must be valid format if provided
- Max 10,000 codes per import

**Import Result:**

- Success: "1,000 codes imported for Cursor"
- Partial success: "980 codes imported, 20 duplicates skipped"
- Failure: "Import failed: Invalid CSV format"

**Code Status After Import:**

- `status: unassigned`
- `assigned_to: NULL`
- Ready for assignment during registration check-in

#### 5.3 Code Pool Management

**Code Lifecycle:**

1. **Unassigned:** Imported but not assigned to participant
2. **Available:** Assigned to participant, not yet redeemed
3. **Redeemed:** Participant marked as redeemed (self-reported)

**Pool Exhaustion Handling:**

- System assigns codes first-come-first-serve
- When pool exhausts, subsequent participants don't receive that credit type
- No error shown to participant (only see what they got)
- Admin can monitor pool status (Phase 2 feature)

### 6. Check-in System

#### 6.1 Flexible Check-in Types

**Design:** Admin-configurable check-in categories instead of hardcoded meal types.

**Check-in Type Schema:**

| Field        | Type    | Description                            |
| ------------ | ------- | -------------------------------------- |
| id           | cuid    | Primary key                            |
| name         | text    | Unique name (e.g., "Day 1 Attendance") |
| type         | enum    | 'attendance' or 'meal'                 |
| description  | text    | Instructions shown to ops              |
| displayOrder | int     | Order in ops UI                        |
| isActive     | boolean | Can disable without deleting           |

**Example Check-in Types (seeded by admin):**

| name             | type       | display_order |
| ---------------- | ---------- | ------------- |
| Day 1 Attendance | attendance | 1             |
| Day 1 Lunch      | meal       | 2             |
| Day 1 Dinner     | meal       | 3             |
| Day 2 Attendance | attendance | 4             |
| Day 2 Breakfast  | meal       | 5             |

**Business Rules:**

- Each participant can complete each check-in type exactly once
- Must be checked in (Day 1 Attendance) before completing other check-in types
- VIPs can complete check-ins without receiving credits
- Same QR code used for all check-in types
- Admin can add/modify check-in types before event

#### 6.2 Check-in Guest Flow (Ops)

**Purpose:** Fast, single-purpose check-in for a specific type.

**Step-by-Step Process:**

**Ops Actions:**

1. Opens ops dashboard
2. Selects check-in type from list (e.g., "Day 1 Lunch")
3. Scanner camera activates
4. Scans participant's QR code

**System Actions:**

1. Decodes QR code payload
2. Verifies signature
3. Looks up participant
4. Queries `checkin_records` for this type + participant
5. If record exists: Show error "Already checked in at [time]"
6. If no record:
   - Insert checkin_record
   - Show success with participant name
   - Update real-time counter

**Success Display (Ops):**

```
✓ John Doe
Day 1 Lunch - Checked in successfully
```

**If VIP:**

```
✓ Jane Sponsor 🌟 VIP
Day 1 Lunch - Checked in successfully
```

**Error Display (Ops):**

```
⚠️ John Doe
Already checked in at 12:15 PM
```

#### 6.3 Check Guest Status Flow (Ops)

**Purpose:** View all check-in statuses for a participant.

**Step-by-Step Process:**

**Ops Actions:**

1. Opens "Check Guest Status" screen
2. Scans participant's QR code

**System Actions:**

1. Verify QR and lookup participant
2. Query all active check-in types (ordered)
3. Left join with checkin_records for this participant
4. Return list with completion status

**Display:**

```
John Doe
━━━━━━━━━━━━━━━━━━━━━━━
✓ Day 1 Attendance - 9:15 AM
✓ Day 1 Lunch - 12:15 PM
☐ Day 1 Dinner
☐ Day 2 Attendance
☐ Day 2 Breakfast
```

#### 6.4 Duplicate Prevention

**Primary Method:** Database uniqueness constraint

**Database Schema:**

```sql
CREATE TABLE checkin_records (
  id TEXT PRIMARY KEY,
  checkin_type_id TEXT REFERENCES checkin_types(id),
  participant_id TEXT REFERENCES users(id),
  checked_in_by TEXT REFERENCES users(id),
  checked_in_at TIMESTAMP,
  UNIQUE(checkin_type_id, participant_id)
);
```

**Concurrent Scan Protection:**

- Transaction isolation ensures atomic operations
- Unique constraint prevents race conditions
- If two ops scan simultaneously, second scan fails gracefully

**User Experience:**

- Ops sees clear error message
- Participant is informed (can dispute if error)
- All scans logged for audit trail

### 7. Dashboard Interfaces

#### 7.1 Participant Dashboard

**Access:** Mobile-first responsive design  
**URL:** `[platform]/dashboard`

**Key Sections:**

**A. Header**

- Welcome message: "Welcome, [Name]!"
- Check-in status badge: "✓ Checked in" or "⏰ Check-in opens Dec 6"
- Logout button

**B. QR Code Section**

```
┌─────────────────────────────────────┐
│ 🍽️ Your QR Code                     │
│                                     │
│     [Large QR Code - 300x300px]     │
│                                     │
│  Show this at:                      │
│  • Registration desk (check-in)     │
│  • Food stations (meals)            │
│                                     │
│  This QR never expires              │
└─────────────────────────────────────┘
```

**C. Credits Section (After Check-in)**

```
┌─────────────────────────────────────┐
│ 📦 Your Credits (6)                 │
│                                     │
│ Filter: [All] [Redeemed] [Pending] │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🎯 Cursor Pro (50 credits)      │ │
│ │                                 │ │
│ │ Code: ABC123XYZ   [📋 Copy]     │ │
│ │ Redeem: cursor.com/redeem       │ │
│ │                                 │ │
│ │ [📖 View Instructions ▼]        │ │
│ │                                 │ │
│ │ ☐ Mark as Redeemed              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🤖 Anthropic API (25 credits)   │ │
│ │ Code: XYZ789ABC   [📋 Copy]     │ │
│ │ ...                             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [5 more credit cards...]            │
└─────────────────────────────────────┘
```

**D. Profile Section**

- Name (editable)
- Email (read-only, from Luma)
- Status (registered / checked in)

**Features:**

- Copy button for each code (clipboard API)
- Expandable instructions (show/hide)
- Toggle redeemed status (checkbox)
- Filter credits by redemption status
- Mobile-optimized (thumb-friendly tap targets)

**Before Check-in State:**

- QR code visible
- "Check-in opens..." message
- Credits section shows: "Your credits will appear after check-in"

#### 7.2 Ops Dashboard

**Access:** Mobile/tablet optimized  
**URL:** `[platform]/ops`

**Two Modes:**

**A. Check-in Mode (Registration Desk)**

```
┌─────────────────────────────────────┐
│ 📋 Registration Check-in            │
├─────────────────────────────────────┤
│                                     │
│   [Camera View - QR Scanner]        │
│                                     │
│   Point camera at participant's     │
│   QR code                           │
│                                     │
├─────────────────────────────────────┤
│ ✓ 347 participants checked in today │
├─────────────────────────────────────┤
│ Recent Check-ins:                   │
│ • John Doe - 10:34 AM ✓            │
│ • Sarah Lee - 10:32 AM ✓           │
│ • Mike Chen - 10:30 AM ✓           │
│ • Alex Wong - 10:28 AM ✓           │
│ • Lisa Tan - 10:25 AM ✓            │
└─────────────────────────────────────┘
```

**B. Check-in Guest Mode**

```
┌─────────────────────────────────────┐
│ ✓ Check-in Guest                    │
├─────────────────────────────────────┤
│ Select Check-in Type:              │
│ (•) Day 1 Attendance                │
│ ( ) Day 1 Lunch                    │
│ ( ) Day 1 Dinner                   │
│ ( ) Day 2 Attendance                │
│ ( ) Day 2 Breakfast                │
│                                     │
│   [Camera View - QR Scanner]        │
│                                     │
├─────────────────────────────────────┤
│ ✓ 234 checked in for Day 1 Lunch  │
├─────────────────────────────────────┤
│ Recent Scans:                       │
│ • John Doe ✓ Day 1 Lunch - 12:15 PM│
│ • Sarah Lee ✓ Day 1 Lunch - 12:13 PM│
│ • Mike Chen ⚠️ Already checked in   │
│ • Alex Wong ✓ Day 1 Lunch - 12:10 PM│
└─────────────────────────────────────┘
```

**C. Check Guest Status Mode**

```
┌─────────────────────────────────────┐
│ 📋 Check Guest Status                │
├─────────────────────────────────────┤
│   [Camera View - QR Scanner]        │
│                                     │
│   Point camera at participant's     │
│   QR code                           │
│                                     │
├─────────────────────────────────────┤
│ John Doe                            │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ ✓ Day 1 Attendance - 9:15 AM       │
│ ✓ Day 1 Lunch - 12:15 PM           │
│ ☐ Day 1 Dinner                     │
│ ☐ Day 2 Attendance                  │
│ ☐ Day 2 Breakfast                   │
└─────────────────────────────────────┘
```

**Features:**

- Check-in type selector (admin-configurable)
- Check Guest Status mode (view all statuses)
- Large scan result display (success/error)
- Real-time counters
- Recent activity feed (last 10 scans)
- VIP badge display when scanning VIPs
- Audio/haptic feedback on successful scan
- Error messages persist for 5 seconds

**Scanner Behavior:**

- Auto-focus camera on QR codes
- Continuous scanning (ready for next scan immediately)
- Flash/torch toggle for low light
- Manual entry option (if camera fails - Phase 2)

#### 7.3 Admin Dashboard

**Access:** Desktop-optimized (mobile responsive)  
**URL:** `[platform]/admin`

**Main Sections:**

**A. Overview Dashboard**

```
┌─────────────────────────────────────────────────────┐
│ Cafe Cursor Kuala Lumpur                            │
│ Admin Dashboard                                     │
├─────────────────────────────────────────────────────┤
│ Quick Stats:                                        │
│                                                     │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│ │ 847 / 1000  │ │ 645 / 847   │ │ 234 / 847   │   │
│ │ Checked In  │ │ Day 1 Lunch │ │ Day 1 Dinner│  │
│ └─────────────┘ └─────────────┘ └─────────────┘   │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Recent Activity:                            │   │
│ │ • 10:45 AM - 23 participants checked in     │   │
│ │ • 10:30 AM - Cursor codes imported (1000)   │   │
│ │ • 10:15 AM - VIP added: Jane Sponsor        │   │
│ └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**B. Participant Management Tab**

```
┌─────────────────────────────────────────────────────┐
│ Participants                                        │
├─────────────────────────────────────────────────────┤
│ [Import Participants] [Export CSV]                  │
│                                                     │
│ Tabs: [Regular Participants] [VIP List]            │
│                                                     │
│ Search: [____________] 🔍                           │
│                                                     │
│ ┌────────────────────────────────────────────────┐ │
│ │ Name       │ Email        │ Status  │ Actions │ │
│ ├────────────────────────────────────────────────┤ │
│ │ John Doe   │ john@...     │ ✓ In    │ View    │ │
│ │ Sarah Lee  │ sarah@...    │ ✓ In    │ View    │ │
│ │ Mike Chen  │ mike@...     │ Reg     │ Check In│ │
│ │ ...        │ ...          │ ...     │ ...     │ │
│ └────────────────────────────────────────────────┘ │
│                                                     │
│ Showing 1-50 of 1,000                               │
│ [< Prev] [Next >]                                   │
└─────────────────────────────────────────────────────┘
```

**C. Credit Management Tab**

```
┌─────────────────────────────────────────────────────┐
│ Credit Management                                   │
├─────────────────────────────────────────────────────┤
│ [Create Credit Type]                                │
│                                                     │
│ ┌────────────────────────────────────────────────┐ │
│ │ Credit Type    │ Total │ Assigned │ Actions   │ │
│ ├────────────────────────────────────────────────┤ │
│ │ Cursor Pro     │ 1000  │ 347      │ Import... │ │
│ │ Anthropic API  │ 1000  │ 347      │ Import... │ │
│ │ ElevenLabs     │ 1000  │ 347      │ Import... │ │
│ │ LeanMCP Pro    │ 800   │ 347      │ Import... │ │
│ │ Mobbin Pro     │ 1000  │ 347      │ Import... │ │
│ │ Vercel Credits │ 1000  │ 347      │ Import... │ │
│ └────────────────────────────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Create Credit Type Form:**

```
┌─────────────────────────────────────┐
│ Create Credit Type                  │
├─────────────────────────────────────┤
│ Name (internal):                    │
│ [cursor_____________]               │
│                                     │
│ Display Name:                       │
│ [Cursor Pro Credits - 50 credits__] │
│                                     │
│ Email Instructions:                 │
│ [────────────────────────────────]  │
│ [Login to cursor.com, go to     ]  │
│ [Settings > Billing, paste code ]  │
│ [────────────────────────────────]  │
│                                     │
│ Web Instructions (HTML/Markdown):   │
│ [────────────────────────────────]  │
│ [<h3>How to Redeem</h3>         ]  │
│ [<ol><li>Go to cursor.com</li>  ]  │
│ [────────────────────────────────]  │
│                                     │
│ Display Order: [1___]               │
│                                     │
│ Icon URL (optional):                │
│ [https://cdn.../cursor-icon.png___] │
│                                     │
│ ☑ Active                            │
│                                     │
│ [Cancel] [Create Credit Type]       │
└─────────────────────────────────────┘
```

**Import Codes Interface:**

```
┌─────────────────────────────────────┐
│ Import Codes for: Cursor Pro        │
├─────────────────────────────────────┤
│ CSV Format: code, redeem_url        │
│                                     │
│ Expected columns: 2                 │
│ Max rows: 10,000                    │
│                                     │
│ [Choose File] cursor_codes.csv      │
│                                     │
│ [Upload]                            │
│                                     │
│ After upload:                       │
│ ────────────────────────────────    │
│ Preview: Will import 1,000 codes    │
│                                     │
│ Sample rows:                        │
│ ABC123XYZ, cursor.com/redeem        │
│ DEF456ABC, cursor.com/redeem        │
│ GHI789DEF, cursor.com/redeem        │
│                                     │
│ [Cancel] [Confirm Import]           │
└─────────────────────────────────────┘
```

**D. VIP Management Tab**

```
┌─────────────────────────────────────────────────────┐
│ VIP Management                                      │
├─────────────────────────────────────────────────────┤
│ [Add VIP]                                           │
│                                                     │
│ ┌────────────────────────────────────────────────┐ │
│ │ Name          │ Email       │ Status │ Actions │ │
│ ├────────────────────────────────────────────────┤ │
│ │ 🌟 Jane Sponsor│ jane@...   │ ✓ In   │ View   │ │
│ │ 🌟 Bob Speaker │ bob@...    │ Reg    │Check In│ │
│ │ 🌟 Lisa Judge  │ lisa@...   │ Reg    │Check In│ │
│ └────────────────────────────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Add VIP Form:**

```
┌─────────────────────────────────────┐
│ Add VIP                             │
├─────────────────────────────────────┤
│ Name:                               │
│ [Jane Sponsor_________________]     │
│                                     │
│ Email:                              │
│ [jane@sponsor.com____________]      │
│                                     │
│ Note: VIP will receive QR code via  │
│ email after check-in. VIPs cannot   │
│ login to platform.                  │
│                                     │
│ [Cancel] [Add VIP]                  │
└─────────────────────────────────────┘
```

**VIP Check-in Action:**

- Admin clicks "Check In" button next to VIP name
- System creates checkin_record for "Day 1 Attendance"
- System updates status to checked_in
- System sends VIP email with QR code image
- No codes assigned (VIPs don't receive credits)

**Admin Features Summary:**

- Import participants from CSV
- Create and manage credit types
- Bulk import codes per credit type
- Add VIPs manually
- View all participants (search, filter, paginate)
- Manual check-in (backup if QR scan fails)
- View system statistics and activity logs
- Export participant data (Phase 2)

### 8. Email System

You can also access everything anytime at:
[Platform URL]

Need help? Visit the help desk at Auditorium 1, Building 9.

Happy hacking! 🚀
The Hackathon Team

**Email Features:**

- Personalized with participant name
- Dynamic credit list (only assigned credits)
- QR code embedded as inline image
- Clickable redemption URLs
- Platform URL for dashboard access
- Mobile-optimized HTML

#### 8.1 Email Service Provider

**Provider:** Resend  
**Why:** Reliable transactional email delivery, developer-friendly API, good deliverability

**Email Types:**

| Email Type            | Trigger                     | Recipient                 | Priority |
| --------------------- | --------------------------- | ------------------------- | -------- |
| Welcome Email         | After participant import    | All imported participants | Low      |
| Magic Link            | Login attempt               | User requesting login     | High     |
| Check-in Confirmation | After registration check-in | Checked-in participant    | High     |
| VIP Check-in          | VIP checked in by admin     | VIP                       | High     |

#### 8.2 Email Templates

All emails use HTML templates with:

- Mobile-responsive design
- Plain text fallback
- Consistent branding (hackathon colors/logo)
- Clear call-to-action buttons
- Footer with contact info

**Template Structure:**

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="padding: 20px;">
      <!-- Header with logo -->
      <!-- Main content -->
      <!-- Footer -->
    </div>
  </body>
</html>
```

#### 8.3 Email Delivery

**Delivery Requirements:**

- Send within 2 minutes of trigger event
- Handle bounces gracefully (log but don't retry VIP emails)
- Support embedded images (QR codes)
- Rate limiting: Max 100 emails per second

**Error Handling:**

- If email fails: Log error with participant ID
- Admin can view failed emails in dashboard (Phase 2)
- No automatic retry (admin can manually resend if needed)

**Tracking:**

- Track email sent status in database
- Log delivery failures
- No open/click tracking (privacy)

---

## 5. Phase 2: Future Features

These features are nice-to-have and can be implemented after the event or for future iterations.

### 5.1 Workshop Management

**Purpose:** Allow participants to register for workshops/talks during the event

**Features:**

**A. Admin Workshop Creation**

- Create workshop with: name, description, date, time slot, capacity, location
- Edit workshop details
- Delete/cancel workshops
- View registration list per workshop

**B. Workshop Registration (Participant)**

- Browse available workshops
- View workshop details (time, location, capacity, speaker)
- Register for workshop (first-come-first-serve)
- Cancel registration
- View "My Workshops" list

**C. Business Rules**

- Capacity enforcement (max participants per workshop)
- Time conflict detection (can't register for overlapping workshops)
- Registration deadline (e.g., 1 hour before workshop starts)
- Waitlist system (if capacity reached - future enhancement)

**D. Workshop Check-in**

- Separate QR scan mode for workshop check-in
- Track workshop attendance
- Analytics: show rate, no-show rate

**Example Workshops:**

- Cursor AI Coding Workshop (10:30 AM, Room A, Capacity: 50)
- Building with Anthropic Claude (2:00 PM, Room B, Capacity: 100)
- Deploying to Vercel (4:00 PM, Room A, Capacity: 50)

**Database Schema:**

```
workshops:
  - id, name, description
  - date, time_slot_start, time_slot_end
  - capacity, location
  - created_at, updated_at

workshop_registrations:
  - id, participant_id, workshop_id
  - registered_at, cancelled_at
  - status (registered/cancelled/attended)
```

### 5.2 Team Management

**Purpose:** Allow participants to form teams for hackathon projects

**Features:**

**A. Team Creation**

- Participant creates team with team name
- Creator becomes team captain
- Team has unique invite code

**B. Team Joining**

- Participants can join team via invite code
- Max 4 members per team
- Participants can only be in one team

**C. Team Management**

- Captain can remove members
- Members can leave team voluntarily
- Captain can transfer captaincy
- Team can be disbanded by captain

**D. Team Display**

- Team profile page (name, members, captain)
- Show team members in participant list
- Team badge in dashboard

**E. Integration with Judging (Future)**

- Export team list for judges
- Link project submissions to teams
- Track which teams submitted projects

**Business Rules:**

- Team size: 2-4 members
- One team per participant
- Team name must be unique
- Cannot join team after submission deadline

**Database Schema:**

```
teams:
  - id, name
  - captain_id (FK to participants)
  - created_at, updated_at

team_members:
  - id, team_id, participant_id
  - joined_at, left_at
  - status (active/left)
```

### 5.3 Analytics & Reporting

**Purpose:** Provide insights and data export for event organizers

**Features:**

**A. Dashboard Analytics**

- Check-in rate over time (line chart)
- Check-in rates per type (bar chart)
- Code redemption rates per credit type (pie chart)
- Participant status breakdown (registered vs checked-in)

**B. Export Functionality**

- Export participant list (CSV)
- Export check-in log (CSV with timestamps)
- Export check-in log (CSV)
- Export code assignment report (who got which codes)

**C. Real-time Monitoring**

- Live check-in counter (updates every 5 seconds)
- Live check-in counter per type
- Alert if code pool running low (< 10% remaining)

**D. Audit Logs**

- Track all admin actions (who did what, when)
- Track all check-in events
- Track all code assignments
- Searchable log viewer

### 5.4 Enhanced Ops Features

**Purpose:** Improve ops volunteer experience

**Features:**

**A. Manual Participant Lookup**

- Search participant by name or email
- View participant details (status, check-in time, codes assigned)
- Manual check-in button (if QR scan fails)
- Manual check-in button (if QR scan fails)

**B. Ops Activity Log**

- View own scan history
- Filter by date/time, scan type
- Export own activity log

**C. Offline Mode**

- Queue scans when offline
- Sync when connection restored
- Show offline indicator in UI

**D. Scanner Enhancements**

- Bulk scan mode (scan multiple people quickly)
- Flash/torch toggle for low light
- Zoom controls for camera
- Manual code entry (if camera fails)

### 5.5 Code Pool Management

**Purpose:** Better visibility into code availability

**Features:**

**A. Real-time Pool Status**

- Show remaining codes per credit type in admin dashboard
- Color-coded alerts:
  - Green: > 50% remaining
  - Yellow: 10-50% remaining
  - Red: < 10% remaining

**B. Mid-Event Code Import**

- Allow importing additional codes during event
- Useful if sponsor provides more codes mid-event
- Newly imported codes immediately available for assignment

**C. Code Usage Analytics**

- Track redemption rates per credit type
- Show which credits are most popular
- Export redemption report

**D. Manual Code Assignment**

- Admin can manually assign specific code to specific participant
- Useful for VIPs or special cases
- Bypass automatic assignment logic

### 5.6 Participant Experience Enhancements

**Purpose:** Improve participant dashboard features

**Features:**

**A. Profile Customization**

- Add profile photo
- Add bio/introduction
- Social media links
- Skills/interests tags

**B. Networking Features**

- Browse other participants (opt-in)
- Search by skills/interests
- Send connection requests
- Team matching suggestions

**C. Schedule/Agenda**

- View event schedule
- Add sessions to personal agenda
- Set reminders for sessions
- View venue map

**D. Notifications**

- Email notifications for important updates
- Dashboard notifications (bell icon)
- Push notifications (if PWA installed)

**E. Credit Tracking**

- Show redemption status with checkmarks
- Add notes per credit
- Set reminders to redeem before expiry
- Link to redemption tutorials

### 5.7 VIP Experience Improvements

**Purpose:** Better VIP handling and experience

**Features:**

**A. VIP Categories**

- Different VIP tiers (Sponsor, Judge, Speaker, etc.)
- Different permissions per tier
- Custom badges per tier

**B. VIP Dashboard Access (Optional)**

- Allow VIPs to login if desired
- View-only access to platform
- Access to special VIP content/resources

**C. VIP Check-in Automation**

- Auto-check-in VIPs at specified time
- Batch VIP check-in (select multiple, check in all)

### 5.8 Security & Privacy Enhancements

**Purpose:** Improve security and user privacy

**Features:**

**A. Two-Factor Authentication**

- Optional 2FA for admin accounts
- SMS or authenticator app

**B. Role-Based Access Control**

- Granular permissions per role
- Custom roles (e.g., "Read-only admin")
- Permission inheritance

**C. Data Privacy**

- GDPR compliance features
- Data export for participants (download my data)
- Data deletion requests
- Privacy policy acceptance

**D. Security Logging**

- Track failed login attempts
- IP-based rate limiting
- Suspicious activity alerts
- Admin notification for security events

### 5.9 Multi-Event Support

**Purpose:** Reuse platform for future hackathons

**Features:**

**A. Event Configuration**

- Create multiple events in one platform
- Per-event settings (dates, check-in types, credit types)
- Event cloning (copy settings from previous event)

**B. Historical Data**

- Archive past events
- View past event statistics
- Compare event metrics

**C. Template System**

- Save email templates
- Save credit type templates
- Save workshop templates

### 5.10 Integration Enhancements

**Purpose:** Connect with other tools and services

**Features:**

**A. Luma Integration (if API available)**

- Real-time sync with Luma
- Automatic participant import
- Two-way sync of check-in status

**B. Slack Integration**

- Post check-in milestones to Slack (e.g., "500 checked in!")
- Alert for code pool running low
- Real-time activity feed

**C. Discord Integration**

- Participant verification via Discord
- Auto-assign roles based on check-in status
- Announcements to Discord channel

**D. Webhook System**

- Custom webhooks for external integrations
- Trigger webhooks on events (check-in, code assignment, etc.)
- Webhook logs and retry logic

---

**End of Phase 1 & Phase 2 Features**

---

## 6. Detailed User Flows

This section documents step-by-step user journeys for each major interaction with the platform. Each flow includes participant actions, system responses, and UI state changes.

### 6.1 Pre-Event Setup Flow

**Description:** Complete workflow for admin to prepare the system before event day, including importing participants, creating credit types, importing codes, and adding VIPs.

**Key Steps:**

- Export participants from Luma
- Import participant CSV to platform
- System sends welcome emails
- Admin creates credit types for all sponsors
- Admin imports codes for each credit type
- Admin manually adds VIP guests
- Platform URL distributed via Luma and social media

**Success Criteria:** 1,000 participants imported, 6 credit types created, codes imported for all types, welcome emails sent

---

### 6.2 Participant First Login Flow

**Description:** Step-by-step process for participants to access the platform for the first time using magic link authentication and view their permanent QR code.

**Key Steps:**

- Participant receives welcome email with platform URL
- Participant enters email address
- System validates email against imported list
- System sends magic link via email
- Participant clicks link and gets logged in
- System generates permanent QR code on first login
- Dashboard displays QR code with "Check-in opens Dec 6" message

**Success Criteria:** Participant successfully logged in, QR code visible, session created

---

### 6.3 Event Day Registration Check-in Flow

**Description:** Complete flow for participants arriving at registration desk, showing QR code to ops, getting checked in, and receiving credits via email.

**Key Steps:**

- Participant arrives at registration desk
- Opens dashboard and shows QR code
- Ops selects "Day 1 Attendance" check-in type
- Ops scans QR code
- System validates QR and participant status
- System creates checkin_record for "Day 1 Attendance"
- System updates status to checked_in
- System assigns codes from pool (first-come-first-serve)
- System sends check-in confirmation email with all codes
- Dashboard updates to show credits list

**Success Criteria:** Check-in processed in < 30 seconds, codes assigned, email sent, dashboard updated

---

### 6.4 Check-in Guest Flow (Detailed)

**Description:** Process for ops to check in participants for a specific check-in type (e.g., Day 1 Lunch, Day 1 Dinner).

**Key Steps:**

- Ops selects check-in type from list (e.g., "Day 1 Lunch")
- Participant shows QR code (from dashboard or email)
- Ops scans QR code
- System validates participant exists
- System checks if already checked in for this type
- System records check-in or shows duplicate error
- Ops confirms success/error to participant

**Success Criteria:** Check-in processed quickly, no duplicates allowed, VIP badge shown when applicable

---

### 6.5 VIP Complete Flow

**Description:** End-to-end workflow for VIP guests from admin adding them, checking them in on event day, to using QR code for check-ins.

**Key Steps:**

- Admin adds VIP manually (name + email)
- System generates permanent QR code
- On event day, VIP arrives at registration
- Admin manually checks in VIP (Day 1 Attendance)
- System sends VIP email with QR code image
- VIP shows QR from email at check-in stations
- Ops scans and sees VIP badge
- VIP completes check-ins (attendance, meals) without receiving credits

**Success Criteria:** VIP can complete all check-ins, no platform login required, email QR works correctly

---

### 6.6 Credit Redemption Flow

**Description:** Participant workflow for viewing assigned credits in dashboard, copying codes, accessing redemption instructions, and marking codes as redeemed.

**Key Steps:**

- Participant logs into dashboard after check-in
- Views list of assigned credits (only what they received)
- Clicks on credit card to expand instructions
- Copies code using copy button
- Opens redemption URL in new tab
- Follows web instructions to redeem
- Returns to dashboard and marks credit as redeemed

**Success Criteria:** All codes displayed correctly, copy function works, instructions are clear, redemption status tracked

---

## 7. Data Models

This section defines the database schema for all entities in the system using **Drizzle ORM with PostgreSQL**.

### 7.0 Technology Decision

**Database Stack:** Drizzle ORM + PostgreSQL (not Convex as mentioned in architecture diagram)

**Rationale:**

- Existing codebase already uses Drizzle ORM with PostgreSQL
- Better Auth integrates seamlessly with Drizzle adapter
- PostgreSQL supports row-level locking (`FOR UPDATE`) required for first-come-first-serve code assignment
- Strong typing with TypeScript inference

### 7.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA MODEL (Phase 1)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐         ┌─────────────────┐         ┌─────────────────┐   │
│  │   users     │────────<│     codes       │>────────│  credit_types   │   │
│  │  (Better    │         │                 │         │                 │   │
│  │   Auth +    │         │ assigned_to ────┘         │                 │   │
│  │  extended)  │         │ credit_type_id ───────────┘                 │   │
│  └──────┬──────┘         └─────────────────┘         └─────────────────┘   │
│         │                                                                   │
│         │ participant_id                                                    │
│         │ checked_in_by                                                     │
│         ▼                                                                   │
│  ┌─────────────────┐         ┌─────────────────┐                           │
│  │ checkin_types   │────────<│ checkin_records │                           │
│  │                 │         │                 │                           │
│  │ (admin-defined) │         │ UNIQUE(type_id, participant_id)             │
│  └─────────────────┘         └─────────────────┘                           │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   sessions      │  │    accounts     │  │  verifications  │             │
│  │  (Better Auth)  │  │  (Better Auth)  │  │  (Better Auth)  │             │
│  │                 │  │                 │  │  (Magic Links)  │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Users Table (Extended Better Auth)

**Description:** Core table storing all participant, VIP, ops, and admin user records. Extends Better Auth's standard user table with hackathon-specific fields.

**Strategy:** Extend Better Auth's `users` table rather than creating a separate `participants` table. This keeps authentication and participant data unified.

**Schema Definition:**

```typescript
// packages/core/src/auth/schema.ts (extended)
import { boolean, index, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

// Enums
export const userRoleEnum = pgEnum('user_role', ['participant', 'ops', 'admin']);
export const participantTypeEnum = pgEnum('participant_type', ['regular', 'vip']);
export const participantStatusEnum = pgEnum('participant_status', ['registered', 'checked_in']);

export const UsersTable = pgTable(
  'users',
  {
    // Better Auth standard fields
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    image: text('image'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),

    // Better Auth optional fields
    banned: boolean('banned').default(false),
    banReason: text('ban_reason'),
    banExpires: timestamp('ban_expires'),

    // Hackathon-specific fields (extensions)
    lumaId: text('luma_id'), // Luma event registration ID
    role: userRoleEnum('role').default('participant').notNull(), // Permission level
    participantType: participantTypeEnum('participant_type').default('regular').notNull(),
    status: participantStatusEnum('status').default('registered').notNull(),
    checkedInAt: timestamp('checked_in_at'), // When checked in at registration
    checkedInBy: text('checked_in_by'), // Ops user who checked them in
    qrCodeValue: text('qr_code_value'), // Permanent QR code payload
  },
  (table) => [
    index('users_email_idx').on(table.email),
    index('users_luma_id_idx').on(table.lumaId),
    index('users_status_idx').on(table.status),
    index('users_role_idx').on(table.role),
  ]
);
```

**Field Details:**

| Field           | Type      | Nullable | Default       | Description                                      |
| --------------- | --------- | -------- | ------------- | ------------------------------------------------ |
| id              | text      | No       | -             | CUID primary key                                 |
| name            | text      | No       | -             | Display name (from Luma or manual entry)         |
| email           | text      | No       | -             | Unique email address                             |
| emailVerified   | boolean   | No       | false         | Better Auth field                                |
| image           | text      | Yes      | null          | Profile image URL                                |
| lumaId          | text      | Yes      | null          | Luma registration ID for deduplication           |
| role            | enum      | No       | 'participant' | Permission level: participant, ops, admin        |
| participantType | enum      | No       | 'regular'     | Type: regular (gets credits) or vip (no credits) |
| status          | enum      | No       | 'registered'  | Lifecycle: registered → checked_in               |
| checkedInAt     | timestamp | Yes      | null          | Timestamp of registration check-in               |
| checkedInBy     | text      | Yes      | null          | User ID of ops who processed check-in            |
| qrCodeValue     | text      | Yes      | null          | HMAC-signed permanent QR payload                 |
| createdAt       | timestamp | No       | now()         | Record creation time                             |
| updatedAt       | timestamp | No       | now()         | Last update time                                 |

**VIP Handling:**

- VIPs have `participantType: 'vip'` and `role: 'participant'`
- VIPs are created by admin with `status: 'registered'`
- VIPs cannot request magic links (enforced at application level)
- Admin manually checks in VIPs, which triggers QR email

---

### 7.3 Magic Link Authentication (Better Auth Plugin)

**Description:** Magic link authentication is handled by Better Auth's built-in plugin, NOT a custom table. The plugin uses the existing `verifications` table.

**Implementation:**

```typescript
// packages/core/src/auth/auth.ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { magicLink } from 'better-auth/plugins';

import { env } from '~/config/env';
import { db } from '~/drizzle.server';
import { sendMagicLinkEmail } from '~/email/magic-link';

export const auth = betterAuth({
  baseURL: env.APP_BASE_URL,
  trustedOrigins: [env.APP_BASE_URL],
  database: drizzleAdapter(db, {
    provider: 'pg',
    usePlural: true,
  }),
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Refresh daily
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, token, url }, ctx) => {
        // Validate user exists and is allowed to login
        const user = await db.query.UsersTable.findFirst({
          where: (users, { eq }) => eq(users.email, email),
        });

        if (!user) {
          throw new Error('Email not registered');
        }

        if (user.participantType === 'vip') {
          throw new Error('VIP accounts cannot login. Please contact organizers.');
        }

        await sendMagicLinkEmail({
          to: email,
          name: user.name,
          magicLinkUrl: url,
        });
      },
      expiresIn: 60 * 60, // 1 hour
      disableSignUp: true, // Only pre-imported users can login
    }),
  ],
});
```

**Client-side Integration:**

```typescript
// apps/web/src/utils/auth-client.ts
import { createAuthClient } from 'better-auth/client';
import { magicLinkClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_APP_BASE_URL,
  plugins: [magicLinkClient()],
});

// Usage in login form
const handleLogin = async (email: string) => {
  const { data, error } = await authClient.signIn.magicLink({
    email,
    callbackURL: '/dashboard',
  });
};
```

**Verifications Table (Better Auth managed):**

The `verifications` table is already created by Better Auth and used for magic link tokens:

```typescript
// Already exists in schema - managed by Better Auth
export const VerificationsTable = pgTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(), // email address
  value: text('value').notNull(), // token hash
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
```

---

### 7.4 Credit Types Table

**Description:** Defines categories of sponsor credits with display information and redemption instructions.

**Schema Definition:**

```typescript
// packages/core/src/business.server/events/schemas/credit-types.sql.ts
import { boolean, index, integer, pgTable, text } from 'drizzle-orm/pg-core';

import { cuidId, timestamps } from '~/drizzle.server/types';

export const CreditTypesTable = pgTable(
  'credit_types',
  {
    id: cuidId('id'),
    name: text('name').notNull().unique(), // Internal key: 'cursor', 'anthropic'
    displayName: text('display_name').notNull(), // UI display: 'Cursor Pro Credits - 50 credits'
    emailInstructions: text('email_instructions').notNull(), // Concise text for email
    webInstructions: text('web_instructions').notNull(), // Detailed HTML/Markdown for dashboard
    displayOrder: integer('display_order').notNull().default(0),
    iconUrl: text('icon_url'), // Sponsor logo URL
    isActive: boolean('is_active').notNull().default(true),
    distributionType: text('distribution_type', { enum: ['unique', 'universal'] }).notNull().default('unique'),
    universalCode: text('universal_code'), // For universal distribution
    universalRedeemUrl: text('universal_redeem_url'), // For universal distribution
    ...timestamps,
  },
  (table) => [
    index('credit_types_display_order_idx').on(table.displayOrder),
    index('credit_types_is_active_idx').on(table.isActive),
  ]
);

export type CreditType = typeof CreditTypesTable.$inferSelect;
export type NewCreditType = typeof CreditTypesTable.$inferInsert;
```

**Field Details:**

| Field             | Type        | Nullable | Default   | Description                                                          |
| ----------------- | ----------- | -------- | --------- | -------------------------------------------------------------------- |
| id                | text (cuid) | No       | auto      | Primary key                                                          |
| name              | text        | No       | -         | Unique internal identifier (lowercase, no spaces)                    |
| displayName       | text        | No       | -         | Human-readable name shown in UI and emails                           |
| emailInstructions | text        | No       | -         | Brief redemption instructions for email                              |
| webInstructions   | text        | No       | -         | Detailed HTML/Markdown instructions for dashboard                    |
| displayOrder      | integer     | No       | 0         | Sort order in participant dashboard                                  |
| iconUrl           | text        | Yes      | null      | URL to sponsor logo/icon                                             |
| isActive          | boolean     | No       | true      | Whether codes of this type are assigned during registration check-in |
| distributionType  | enum        | No       | 'unique'  | 'unique' (CSV import) or 'universal' (same code for all)             |
| universalCode     | text        | Yes      | null      | The shared code value for universal distribution                     |
| universalRedeemUrl| text        | Yes      | null      | The shared redeem URL for universal distribution                     |

**Example Data:**

```sql
INSERT INTO credit_types (id, name, display_name, email_instructions, web_instructions, display_order, icon_url, is_active) VALUES
('cuid1', 'cursor', 'Cursor Pro Credits - 50 credits',
 'Login to cursor.com → Settings → Billing → Paste code',
 '<h3>How to Redeem</h3><ol><li>Go to cursor.com</li><li>Login to your account</li>...</ol>',
 1, 'https://cdn.example.com/cursor-logo.png', true),
('cuid2', 'anthropic', 'Anthropic API Credits - $25',
 'Login to console.anthropic.com → Settings → Billing → Apply credit',
 '<h3>How to Redeem</h3>...',
 2, 'https://cdn.example.com/anthropic-logo.png', true);
```

---

### 7.5 Codes Table

**Description:** Individual redemption codes provided by sponsors. Tracks assignment to participants and redemption status.

**Schema Definition:**

```typescript
// packages/core/src/business.server/events/schemas/codes.sql.ts
import { index, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { UsersTable } from '~/auth/schema';
import { cuidId, timestamps } from '~/drizzle.server/types';

import { CreditTypesTable } from './credit-types.sql';

export const codeStatusEnum = pgEnum('code_status', ['unassigned', 'available', 'redeemed']);

export const CodesTable = pgTable(
  'codes',
  {
    id: cuidId('id'),
    creditTypeId: text('credit_type_id')
      .notNull()
      .references(() => CreditTypesTable.id, { onDelete: 'restrict' }),
    codeValue: text('code_value').notNull(), // The actual redemption code (uppercased)
    redeemUrl: text('redeem_url'), // URL where code is redeemed (optional)
    assignedTo: text('assigned_to').references(() => UsersTable.id, { onDelete: 'set null' }),
    assignedAt: timestamp('assigned_at'),
    redeemedAt: timestamp('redeemed_at'), // Self-reported by participant
    status: codeStatusEnum('status').notNull().default('unassigned'),
    ...timestamps,
  },
  (table) => [
    // Critical index for first-come-first-serve assignment query
    index('codes_assignment_idx').on(table.creditTypeId, table.status),
    // For looking up participant's assigned codes
    index('codes_assigned_to_idx').on(table.assignedTo),
  ]
);

export type Code = typeof CodesTable.$inferSelect;
export type NewCode = typeof CodesTable.$inferInsert;
```

**Field Details:**

| Field        | Type        | Nullable | Default      | Description                                              |
| ------------ | ----------- | -------- | ------------ | -------------------------------------------------------- |
| id           | text (cuid) | No       | auto         | Primary key                                              |
| creditTypeId | text        | No       | -            | FK to credit_types                                       |
| codeValue    | text        | No       | -            | The actual redemption code string (normalized uppercase) |
| redeemUrl    | text        | Yes      | null         | URL where participant redeems code (optional)            |
| assignedTo   | text        | Yes      | null         | FK to users (participant who received code)              |
| assignedAt   | timestamp   | Yes      | null         | When code was assigned during registration check-in      |
| redeemedAt   | timestamp   | Yes      | null         | When participant marked as redeemed                      |
| status       | enum        | No       | 'unassigned' | Lifecycle: unassigned → available → redeemed             |

**Status Lifecycle:**

1. `unassigned` - Imported but not assigned to anyone
2. `available` - Assigned to participant during registration check-in, not yet redeemed
3. `redeemed` - Participant self-reported as redeemed

**Code Assignment Query (with row-level locking):**

```typescript
// First-come-first-serve assignment with PostgreSQL FOR UPDATE
const assignCodeToParticipant = async (tx: Transaction, creditTypeId: string, participantId: string) => {
  // Lock one unassigned code
  const [code] = await tx
    .select()
    .from(CodesTable)
    .where(and(eq(CodesTable.creditTypeId, creditTypeId), eq(CodesTable.status, 'unassigned')))
    .limit(1)
    .for('update', { skipLocked: true }); // Skip already-locked rows

  if (!code) return null; // Pool exhausted

  // Assign to participant
  await tx
    .update(CodesTable)
    .set({
      assignedTo: participantId,
      assignedAt: new Date(),
      status: 'available',
    })
    .where(eq(CodesTable.id, code.id));

  return code;
};
```

---

### 7.6 Check-in Types Table

**Description:** Admin-configurable check-in categories (attendance, meals, etc.).

**Schema Definition:**

```typescript
// packages/core/src/business.server/events/schemas/checkin-types.sql.ts
import { boolean, index, integer, pgEnum, pgTable, text } from 'drizzle-orm/pg-core';

import { cuidId, timestamps } from '~/drizzle.server/types';

export const checkinTypeEnum = pgEnum('checkin_type', ['attendance', 'meal']);

export const CheckinTypesTable = pgTable(
  'checkin_types',
  {
    id: cuidId('id'),
    name: text('name').notNull().unique(),
    type: checkinTypeEnum('type').notNull(),
    description: text('description'),
    displayOrder: integer('display_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps,
  },
  (table) => [
    index('checkin_types_display_order_idx').on(table.displayOrder),
    index('checkin_types_is_active_idx').on(table.isActive),
  ]
);

export type CheckinType = typeof CheckinTypesTable.$inferSelect;
export type NewCheckinType = typeof CheckinTypesTable.$inferInsert;
```

**Field Details:**

| Field        | Type        | Nullable | Default | Description                       |
| ------------ | ----------- | -------- | ------- | --------------------------------- |
| id           | text (cuid) | No       | auto    | Primary key                       |
| name         | text        | No       | -       | Unique name (e.g., "Day 1 Lunch") |
| type         | enum        | No       | -       | 'attendance' or 'meal'            |
| description  | text        | Yes      | null    | Instructions shown to ops         |
| displayOrder | int         | No       | 0       | Order in ops UI                   |
| isActive     | boolean     | No       | true    | Can disable without deleting      |

### 7.7 Check-in Records Table

**Description:** Records of participant check-ins. Prevents duplicates per check-in type.

**Schema Definition:**

```typescript
// packages/core/src/business.server/events/schemas/checkin-records.sql.ts
import { index, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';

import { UsersTable } from '~/auth/schema';
import { cuidId } from '~/drizzle.server/types';

import { CheckinTypesTable } from './checkin-types.sql';

export const CheckinRecordsTable = pgTable(
  'checkin_records',
  {
    id: cuidId('id'),
    checkinTypeId: text('checkin_type_id')
      .notNull()
      .references(() => CheckinTypesTable.id, { onDelete: 'restrict' }),
    participantId: text('participant_id')
      .notNull()
      .references(() => UsersTable.id, { onDelete: 'cascade' }),
    checkedInBy: text('checked_in_by')
      .notNull()
      .references(() => UsersTable.id, { onDelete: 'restrict' }),
    checkedInAt: timestamp('checked_in_at').notNull().defaultNow(),
  },
  (table) => [
    unique('checkin_records_type_participant_unq').on(table.checkinTypeId, table.participantId),
    index('checkin_records_participant_idx').on(table.participantId),
    index('checkin_records_checked_in_at_idx').on(table.checkedInAt),
  ]
);

export type CheckinRecord = typeof CheckinRecordsTable.$inferSelect;
export type NewCheckinRecord = typeof CheckinRecordsTable.$inferInsert;
```

**Field Details:**

| Field         | Type        | Nullable | Default | Description                   |
| ------------- | ----------- | -------- | ------- | ----------------------------- |
| id            | text (cuid) | No       | auto    | Primary key                   |
| checkinTypeId | text        | No       | -       | FK to checkin_types           |
| participantId | text        | No       | -       | FK to users (participant)     |
| checkedInBy   | text        | No       | -       | FK to users (ops who scanned) |
| checkedInAt   | timestamp   | No       | now()   | When checked in               |

**Duplicate Prevention:**

The unique constraint `(checkin_type_id, participant_id)` prevents duplicate check-ins:

```typescript
const processCheckin = async (checkinTypeId: string, participantId: string, opsUserId: string) => {
  try {
    await db.insert(CheckinRecordsTable).values({
      checkinTypeId,
      participantId,
      checkedInBy: opsUserId,
    });
    return { success: true };
  } catch (error) {
    if (error.code === '23505') {
      // PostgreSQL unique violation
      const existing = await db.query.CheckinRecordsTable.findFirst({
        where: and(
          eq(CheckinRecordsTable.checkinTypeId, checkinTypeId),
          eq(CheckinRecordsTable.participantId, participantId)
        ),
      });
      return {
        success: false,
        error: `Already checked in at ${existing?.checkedInAt}`,
      };
    }
    throw error;
  }
};
```

---

### 7.8 Relations Definition

**Description:** Drizzle ORM relation definitions for type-safe queries with joins.

```typescript
// packages/core/src/business.server/events/schemas/schema.ts
import { relations } from 'drizzle-orm';

import { UsersTable } from '~/auth/schema';

import { CheckinRecordsTable } from './checkin-records.sql';
import { CheckinTypesTable } from './checkin-types.sql';
import { CodesTable } from './codes.sql';
import { CreditTypesTable } from './credit-types.sql';

export const usersRelations = relations(UsersTable, ({ many, one }) => ({
  assignedCodes: many(CodesTable, { relationName: 'assignedCodes' }),
  checkinRecords: many(CheckinRecordsTable, { relationName: 'participantCheckins' }),
  processedCheckins: many(CheckinRecordsTable, { relationName: 'opsCheckins' }),
  checkedInByUser: one(UsersTable, {
    fields: [UsersTable.checkedInBy],
    references: [UsersTable.id],
    relationName: 'checkedInBy',
  }),
}));

export const creditTypesRelations = relations(CreditTypesTable, ({ many }) => ({
  codes: many(CodesTable),
}));

export const codesRelations = relations(CodesTable, ({ one }) => ({
  creditType: one(CreditTypesTable, {
    fields: [CodesTable.creditTypeId],
    references: [CreditTypesTable.id],
  }),
  assignedToUser: one(UsersTable, {
    fields: [CodesTable.assignedTo],
    references: [UsersTable.id],
    relationName: 'assignedCodes',
  }),
}));

export const checkinTypesRelations = relations(CheckinTypesTable, ({ many }) => ({
  checkinRecords: many(CheckinRecordsTable),
}));

export const checkinRecordsRelations = relations(CheckinRecordsTable, ({ one }) => ({
  checkinType: one(CheckinTypesTable, {
    fields: [CheckinRecordsTable.checkinTypeId],
    references: [CheckinTypesTable.id],
  }),
  participant: one(UsersTable, {
    fields: [CheckinRecordsTable.participantId],
    references: [UsersTable.id],
    relationName: 'participantCheckins',
  }),
  processedBy: one(UsersTable, {
    fields: [CheckinRecordsTable.checkedInBy],
    references: [UsersTable.id],
    relationName: 'opsCheckins',
  }),
}));
```

---

### 7.9 Schema Export

**Description:** Central export file for all event schemas.

```typescript
// packages/core/src/business.server/events/schemas/schema.ts
export { CreditTypesTable, type CreditType, type NewCreditType } from './credit-types.sql';
export { CodesTable, codeStatusEnum, type Code, type NewCode } from './codes.sql';
export { CheckinTypesTable, checkinTypeEnum, type CheckinType, type NewCheckinType } from './checkin-types.sql';
export { CheckinRecordsTable, type CheckinRecord, type NewCheckinRecord } from './checkin-records.sql';
// Relations also exported from this file
```

---

### 7.10 QR Code Value Generation

**Description:** QR code values are generated once and stored in the user record. Uses HMAC-SHA256 for signature verification.

```typescript
// packages/core/src/business.server/events/events.ts
import { createHmac } from 'crypto';

import { env } from '~/config/env';

interface QRPayload {
  participantId: string;
  type: 'permanent';
  signature: string;
}

export const generateQRCodeValue = (participantId: string): string => {
  const payload = {
    participantId,
    type: 'permanent' as const,
  };

  const signature = createHmac('sha256', env.QR_SECRET_KEY).update(JSON.stringify(payload)).digest('hex');

  const fullPayload: QRPayload = { ...payload, signature };

  return Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
};

export const verifyQRCodeValue = (
  qrValue: string
): { valid: true; participantId: string } | { valid: false; error: string } => {
  try {
    const decoded = JSON.parse(Buffer.from(qrValue, 'base64url').toString()) as QRPayload;

    const expectedPayload = {
      participantId: decoded.participantId,
      type: decoded.type,
    };

    const expectedSignature = createHmac('sha256', env.QR_SECRET_KEY)
      .update(JSON.stringify(expectedPayload))
      .digest('hex');

    if (decoded.signature !== expectedSignature) {
      return { valid: false, error: 'Invalid signature' };
    }

    return { valid: true, participantId: decoded.participantId };
  } catch {
    return { valid: false, error: 'Invalid QR format' };
  }
};
```

**Environment Variable Required:**

```typescript
// Add to packages/core/src/config/env.ts
const EnvSchema = z.object({
  // ... existing
  QR_SECRET_KEY: z.string().min(32), // Minimum 32 chars for security
  RESEND_API_KEY: z.string().min(1),
});
```

---

### 7.11 Database Migration Strategy

**Description:** Migration approach for setting up the hackathon schema.

**Migration Files:**

```sql
-- 0002_hackathon_schema.sql

-- Enums
CREATE TYPE user_role AS ENUM ('participant', 'ops', 'admin');
CREATE TYPE participant_type AS ENUM ('regular', 'vip');
CREATE TYPE participant_status AS ENUM ('registered', 'checked_in');
CREATE TYPE code_status AS ENUM ('unassigned', 'available', 'redeemed');
CREATE TYPE checkin_type AS ENUM ('attendance', 'meal');

-- Extend users table
ALTER TABLE users
  ADD COLUMN luma_id TEXT,
  ADD COLUMN role user_role NOT NULL DEFAULT 'participant',
  ADD COLUMN participant_type participant_type NOT NULL DEFAULT 'regular',
  ADD COLUMN status participant_status NOT NULL DEFAULT 'registered',
  ADD COLUMN checked_in_at TIMESTAMP,
  ADD COLUMN checked_in_by TEXT REFERENCES users(id),
  ADD COLUMN qr_code_value TEXT;

CREATE INDEX users_luma_id_idx ON users(luma_id);
CREATE INDEX users_status_idx ON users(status);
CREATE INDEX users_role_idx ON users(role);

-- Credit types table
CREATE TABLE credit_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  email_instructions TEXT NOT NULL,
  web_instructions TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  icon_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX credit_types_display_order_idx ON credit_types(display_order);
CREATE INDEX credit_types_is_active_idx ON credit_types(is_active);

-- Codes table
CREATE TABLE codes (
  id TEXT PRIMARY KEY,
  credit_type_id TEXT NOT NULL REFERENCES credit_types(id) ON DELETE RESTRICT,
  code_value TEXT NOT NULL,
  redeem_url TEXT NOT NULL,
  assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP,
  redeemed_at TIMESTAMP,
  status code_status NOT NULL DEFAULT 'unassigned',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX codes_assignment_idx ON codes(credit_type_id, status);
CREATE INDEX codes_assigned_to_idx ON codes(assigned_to);
CREATE UNIQUE INDEX codes_unique_per_type_idx ON codes(credit_type_id, code_value);

-- Check-in types table (admin-configurable)
CREATE TABLE checkin_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type checkin_type NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX checkin_types_display_order_idx ON checkin_types(display_order);
CREATE INDEX checkin_types_is_active_idx ON checkin_types(is_active);

-- Check-in records table
CREATE TABLE checkin_records (
  id TEXT PRIMARY KEY,
  checkin_type_id TEXT NOT NULL REFERENCES checkin_types(id) ON DELETE RESTRICT,
  participant_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  checked_in_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  checked_in_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(checkin_type_id, participant_id)
);

CREATE INDEX checkin_records_participant_idx ON checkin_records(participant_id);
CREATE INDEX checkin_records_checked_in_at_idx ON checkin_records(checked_in_at);
```

**Generate Migration:**

```bash
pnpm db:generate  # Generate migration from Drizzle schema
pnpm db:migrate   # Apply migration to database
```

---

### 7.12 Phase 2 Tables (Reference Only)

These tables are documented for future implementation but NOT included in Phase 1.

**Workshops Table:**

```typescript
export const WorkshopsTable = pgTable('workshops', {
  id: cuidId('id'),
  name: text('name').notNull(),
  description: text('description'),
  date: timestamp('date').notNull(),
  timeSlotStart: timestamp('time_slot_start').notNull(),
  timeSlotEnd: timestamp('time_slot_end').notNull(),
  capacity: integer('capacity').notNull(),
  location: text('location').notNull(),
  ...timestamps,
});
```

**Workshop Registrations Table:**

```typescript
export const WorkshopRegistrationsTable = pgTable('workshop_registrations', {
  id: cuidId('id'),
  participantId: text('participant_id')
    .notNull()
    .references(() => UsersTable.id),
  workshopId: text('workshop_id')
    .notNull()
    .references(() => WorkshopsTable.id),
  registeredAt: timestamp('registered_at').notNull().defaultNow(),
  cancelledAt: timestamp('cancelled_at'),
  status: pgEnum('registration_status', ['registered', 'cancelled', 'attended']),
});
```

**Teams Table:**

```typescript
export const TeamsTable = pgTable('teams', {
  id: cuidId('id'),
  name: text('name').notNull().unique(),
  captainId: text('captain_id')
    .notNull()
    .references(() => UsersTable.id),
  ...timestamps,
});
```

**Team Members Table:**

````typescript
export const TeamMembersTable = pgTable('team_members', {
  id: cuidId('id'),
  teamId: text('team_id').notNull().references(() => TeamsTable.id),
  participantId: text('participant_id').notNull().references(() => UsersTable.id),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
  leftAt: timestamp('left_at'),
  status: pgEnum('member_status', ['active', 'left']),
});

---

## 8. UI/UX Specifications

This section provides detailed design specifications, wireframes, responsive behavior, accessibility requirements, and branding guidelines for all user interfaces.

### 8.1 Design System

**Description:** Core design tokens, color palette, typography, spacing system, and component library used throughout the platform.

**Topics Covered:**
- Primary/secondary colors
- Typography scale and font families
- Spacing/padding system (8px grid)
- Border radius and shadows
- Breakpoints for responsive design
- Component variants (buttons, cards, inputs)

---

### 8.2 Participant Dashboard Design

**Description:** Complete design specification for participant-facing dashboard including layout, components, interactions, and responsive behavior.

**Topics Covered:**
- Mobile-first layout (single column)
- QR code display (size, positioning, refresh indicator)
- Credit card component design
- Copy button interaction states
- Filter/sort controls
- Navigation structure
- Loading states and error handling

---

### 8.3 Ops Dashboard Design

**Description:** Scanner interface design optimized for mobile/tablet devices with large touch targets and clear scan feedback.

**Topics Covered:**
- Camera viewfinder design
- Scan result display (success/error)
- Check-in type selector design
- Check Guest Status mode design
- Real-time counters
- Recent activity feed
- Offline state indicator

---

### 8.4 Admin Dashboard Design

**Description:** Desktop-optimized admin interface with data tables, forms, and management tools.

**Topics Covered:**
- Multi-column layout for desktop
- Data table design (sortable, searchable, paginated)
- Form layouts for imports and creation
- Modal/drawer patterns
- Statistics dashboard widgets
- Navigation sidebar
- Responsive behavior for tablet/mobile

---

### 8.5 Email Design Templates

**Description:** HTML email templates with mobile-responsive design and plain-text fallbacks.

**Topics Covered:**
- Email layout structure (600px max width)
- Header/footer design
- QR code embedding (inline images)
- Button/link styling
- Plain text version generation
- Dark mode considerations
- Email client compatibility

---

### 8.6 Accessibility Requirements

**Description:** WCAG 2.1 AA compliance requirements for all interfaces including keyboard navigation, screen reader support, and color contrast.

**Topics Covered:**
- Keyboard navigation patterns
- ARIA labels and roles
- Screen reader announcements
- Color contrast ratios (4.5:1 minimum)
- Focus indicators
- Error message accessibility
- Alternative text for images/QR codes

---

## 9. Technical Stack

This section documents all technology choices, architecture decisions, deployment strategy, and infrastructure requirements.

### 9.1 Frontend Architecture

**Description:** Frontend framework selection, state management, routing, and build configuration.

**Technologies:**
- **TanStack Start** - React 19 full-stack framework with file-based routing
- **TanStack Query** - Server state management and data fetching
- **Tailwind v4** - Utility-first CSS framework
- **Shadcn UI** - Accessible component library (via `@base/ui`)
- **Vite** - Build tool and dev server

**Key Patterns:**
- Server functions for backend operations (in `apps/web/src/apis/`)
- Path aliases: `~/*` for same-package, `@base/core/*`, `@base/ui/*`
- Mobile-first responsive design

---

### 9.2 Backend Architecture

**Description:** Backend platform, API design, database setup, and server functions.

**Technologies:**
- **TanStack Start Server Functions** - RPC-style backend operations
- **TanStack Start Server Routes** - Stable URLs for webhooks/auth callbacks
- **Better Auth** - Authentication with magic link plugin
- **Drizzle ORM** - Type-safe database queries

**API Structure:**
- Server functions in `apps/web/src/apis/` for UI-triggered operations
- Server routes for external integrations (auth callbacks, webhooks)
- Business logic in `packages/core/src/business.server/events/`

---

### 9.3 Database Design

**Description:** Database technology, schema design, indexing strategy, and data migration approach.

**Technologies:**
- **PostgreSQL** - Relational database with row-level locking support
- **Drizzle ORM** - Type-safe schema definitions and queries
- **Drizzle Kit** - Migration generation and management

**Migration Commands:**
```bash
pnpm db:generate  # Generate migration from schema changes
pnpm db:migrate   # Apply migrations to database
pnpm db:push      # Quick schema sync (development only)
````

**Index Strategy:**

- `codes(credit_type_id, status)` - First-come-first-serve code assignment
- `codes(assigned_to)` - Participant's assigned codes lookup
- `checkin_records(checkin_type_id, participant_id)` - Unique constraint + lookup
- `users(email, luma_id, status, role)` - Various lookup patterns

---

### 9.4 Authentication & Authorization

**Description:** Authentication flow implementation, session management, and role-based access control.

**Technologies:**

- **Better Auth** - Core authentication framework
- **Magic Link Plugin** - Passwordless email authentication
- **Drizzle Adapter** - Database integration

**Configuration:**

```typescript
// Session: 7 days with daily refresh
session: {
  expiresIn: 60 * 60 * 24 * 7,
  updateAge: 60 * 60 * 24,
}

// Magic Link: 1 hour expiry, signup disabled
magicLink({
  expiresIn: 60 * 60,
  disableSignUp: true, // Only pre-imported users
})
```

**Role-Based Access:**
| Role | Access Level |
|------|--------------|
| participant | Own dashboard, QR code, credits |
| ops | Scanner interface, check-in processing |
| admin | Full access, imports, management |

**Authorization Middleware Pattern:**

```typescript
const requireRole = (allowedRoles: UserRole[]) => {
  return async (ctx) => {
    const session = await auth.api.getSession(ctx);
    if (!session || !allowedRoles.includes(session.user.role)) {
      throw new Error('Unauthorized');
    }
    return session;
  };
};
```

---

### 9.5 QR Code Implementation

**Description:** QR code generation library, encoding strategy, signature algorithm, and scanning library.

**Technologies:**

- **qrcode** - QR code image generation (PNG/SVG)
- **html5-qrcode** - Camera-based QR scanning in browser
- **crypto** (Node.js) - HMAC-SHA256 signature generation

**Payload Format:**

```json
{
  "participantId": "cuid_xxx",
  "type": "permanent",
  "signature": "hmac_sha256_hex"
}
```

**Encoding:** Base64URL encoded JSON payload

**Security:**

- HMAC-SHA256 signature using `QR_SECRET_KEY` environment variable
- Server-side validation only (never trust client)
- Signature verified before any action
- Permanent QR (no timestamp/expiry in payload)

**Generation Flow:**

1. User created/imported → `qr_code_value` generated and stored
2. Dashboard displays QR from stored value
3. Check-in email embeds QR as PNG image

**Validation Flow:**

1. Ops scans QR → decode base64url → parse JSON
2. Verify HMAC signature matches
3. Lookup participant by `participantId`
4. Process check-in

---

### 9.6 Email Service Integration

**Description:** Email delivery service setup, template management, and delivery monitoring.

**Technologies:**

- Resend API integration
- HTML email templates
- Image embedding (QR codes)
- Delivery status tracking
- Bounce/failure handling
- Rate limiting

---

### 9.7 Deployment & Hosting

**Description:** Hosting platform, deployment pipeline, environment configuration, and domain setup.

**Topics Covered:**

- Hosting platform (Vercel/Netlify)
- CI/CD pipeline
- Environment variables
- Custom domain configuration
- SSL/TLS certificates
- CDN configuration

---

### 9.8 Monitoring & Logging

**Description:** Application monitoring, error tracking, performance monitoring, and log aggregation.

**Technologies:**

- Error tracking (Sentry or similar)
- Performance monitoring
- Log aggregation
- Uptime monitoring
- Alert configuration

---

## 10. Security Requirements

This section outlines security measures, authentication protocols, data protection, and compliance requirements.

### 10.1 Authentication Security

**Description:** Secure authentication implementation including magic link security, session management, and brute force protection.

**Topics Covered:**

- Magic link token generation (cryptographically secure random)
- Token expiration (1 hour)
- One-time use enforcement
- Rate limiting (5 requests per 15 min)
- Session duration (7 days)
- Secure session storage
- Logout functionality

---

### 10.2 QR Code Security

**Description:** QR code signature verification, replay attack prevention, and validation security.

**Topics Covered:**

- HMAC-SHA256 signature algorithm
- Secret key management
- Server-side validation only
- No timestamp validation (permanent QR)
- Session-based duplicate prevention
- Signature verification process

---

### 10.3 API Security

**Description:** API endpoint protection, input validation, SQL injection prevention, and XSS protection.

**Topics Covered:**

- Authentication middleware
- Role-based authorization
- Input sanitization
- SQL injection prevention (parameterized queries)
- XSS protection
- CSRF token implementation
- Rate limiting per endpoint

---

### 10.4 Data Protection

**Description:** Sensitive data handling, encryption at rest and in transit, PII protection, and GDPR considerations.

**Topics Covered:**

- HTTPS enforcement
- Database encryption at rest
- Password hashing (not applicable - magic links only)
- PII data handling (emails, names)
- Data retention policies
- Right to deletion
- Data export functionality

---

### 10.5 Admin Access Control

**Description:** Admin privilege management, audit logging, and multi-factor authentication options.

**Topics Covered:**

- Role-based access control (RBAC)
- Admin action audit logs
- IP whitelisting (optional)
- Two-factor authentication (Phase 2)
- Session timeout for admins
- Privilege escalation prevention

---

## 11. Success Criteria

This section defines measurable goals, performance benchmarks, and success metrics for the platform.

### 11.1 Performance Metrics

**Description:** Target performance benchmarks for page load times, API response times, and system reliability.

**Targets:**

- Page load time < 2 seconds (mobile 3G)
- API response time < 500ms (p95)
- QR scan to check-in < 30 seconds
- Email delivery < 2 minutes after trigger
- 99.9% uptime during event hours
- Support 1,000 concurrent users

---

### 11.2 User Experience Metrics

**Description:** Measurable goals for user satisfaction, ease of use, and error rates.

**Targets:**

- 95% successful check-ins (no failures)
- < 1% duplicate check-ins (system should prevent all)
- < 5% failed QR scans (ops retry rate)
- Zero participants locked out (authentication failures)
- < 10 support tickets during event
- 90% participants access dashboard before event day

---

### 11.3 Business Metrics

**Description:** Event-level success criteria and key milestones.

**Targets:**

- 1,000 participants imported successfully
- 95% check-in rate (950+ participants checked in)
- All sponsor credits distributed (code assignment)
- 80%+ check-in rate per type
- Zero security incidents
- Complete audit trail of all transactions

---

### 11.4 Technical Metrics

**Description:** System health indicators and technical performance goals.

**Targets:**

- Zero data loss
- < 0.1% email bounce rate
- Database query time < 100ms (p95)
- No race conditions in code assignment
- Real-time dashboard updates < 5 seconds
- Successful backup/restore capability

---

**End of Requirements Documentation**

---

## Appendices

### Appendix A: Glossary

**Terms and definitions used throughout this document**

_To be filled with key terms like: Luma, Magic Link, QR Code, Credit Type, Food Check-in, etc._

---

### Appendix B: API Reference

**Complete API endpoint documentation**

_To be filled with API endpoint specifications, request/response formats, authentication requirements_

---

### Appendix C: Database Schema Diagrams

**Entity relationship diagrams and table structures**

_To be filled with visual ERD diagrams showing all table relationships_

---

### Appendix D: Testing Checklist

**Pre-launch testing requirements and scenarios**

_To be filled with test cases for all major flows, edge cases, and acceptance criteria_

---

### Appendix E: Deployment Checklist

**Step-by-step deployment and launch procedures**

_To be filled with deployment steps, environment setup, DNS configuration, pre-launch verification_

---
