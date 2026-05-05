# Hostel Management System

A modern student hostel management web application built as **pure vanilla HTML / CSS / JS** — no framework, no build step, no npm install. Open `index.html` in a browser and everything works.

## Stack

| Layer | Choice |
|---|---|
| Markup | HTML5 |
| Styling | CSS3 (Sky Blue palette `#0EA5E9`, Inter typography, custom token system) |
| Logic | ES6 JavaScript (IIFE per module, hash routing, DOMContentLoaded) |
| Persistence | `localStorage` (mock backend with seed data) |
| Icons | FontAwesome 6.5 (CDN) |
| QR generation | `qrcode-generator` (CDN) |
| QR scanning | `html5-qrcode` (CDN) |
| Charts | Chart.js (CDN, admin overview only) |

## Folder Structure

```
.
├── index.html                  Landing page + login modal
├── admin/index.html            Admin dashboard shell
├── tenant/index.html           Tenant (student) dashboard shell
├── driver/index.html           Driver mobile-only shell
├── assets/
│   ├── style/
│   │   ├── tokens.css          Design tokens (Sky Blue palette)
│   │   ├── base.css            Reset + typography + utilities + a11y
│   │   ├── landing.css         Landing-specific styles
│   │   ├── dashboard.css       Shared sidebar/topbar/cards (admin + tenant)
│   │   ├── admin.css           Admin section styles
│   │   ├── tenant.css          Tenant section styles
│   │   └── driver.css          Driver mobile-native styles
│   ├── script/
│   │   ├── auth.js             USERS array + login/logout + role guards
│   │   ├── store.js            localStorage CRUD wrapper
│   │   ├── seed.js             First-load seed data
│   │   ├── ui.js               Toast + modal + drawer + formatters + hash router
│   │   ├── landing.js          Landing + login modal
│   │   ├── admin.js            Admin router + Dashboard
│   │   ├── admin-{users,rooms,rentals,maintenance,settings}.js   Original 5 sections (still active)
│   │   ├── admin-{hostel,residents,transportation,billing,staff}.js   Tabbed PDMS wrappers
│   │   ├── admin-maintenance-tabbed.js  Maintenance 4-tab wrapper
│   │   ├── admin-{helpdesk,profile}.js  Single-view PDMS modules
│   │   ├── tenant.js           Tenant router + chrome
│   │   ├── tenant-{home,room,schedule,maintenance,payments,settings}.js
│   │   ├── driver.js           Driver router + chrome
│   │   └── driver-{today,scan,schedule,settings}.js
│   └── img/                    Logos/photos (placeholder folder)
├── README.md
└── .gitignore
```

## How to Run

No install, no build step. Either:

**Option A — Open directly:**
Double-click `index.html` to open in the default browser. Note: Driver QR scanner requires camera access, which most browsers only grant from `localhost` or HTTPS, not `file://`. Use Option B for the full driver demo.

**Option B — VS Code Live Server (recommended for camera demo):**
Right-click `index.html` in VS Code and select **"Open with Live Server"** (Ritwick Dey extension). The page opens at `http://127.0.0.1:5500` with auto-reload, and the driver QR camera works because the origin is `localhost`-class instead of `file://`.

No `npm install`, no build step, no Python required — just a static file server of your choice.

> **Mobile demo tip:** to test admin's native mobile mode without a phone, open Chrome DevTools (F12) → toggle device toolbar (Ctrl+Shift+M) → pick iPhone 14 / Pixel 7 / iPad → reload. The admin dashboard switches to bottom-nav layout below 900px wide.

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@gmail.com` | `admin123` |
| **Student / Tenant** | `student1@gmail.com` | `student123` |
| **Driver** | `driver@gmail.com` | `driver123` |

The login modal has clickable demo-login buttons that auto-fill these credentials.

## Roles & Surfaces

### Admin (responsive — desktop sidebar OR mobile native bottom nav)

The admin dashboard adapts to the viewport. Above 900px wide it shows the desktop left-sidebar layout; below 900px it switches to a native mobile pattern with a 2-tier bottom navigation + slide-in sidebar drawer.

The admin dashboard is structured around the client's PDMS Hostel Management module spec. 10 sidebar items grouped into 3 visual sections (Operations / People / Account):

- **Dashboard** — 10 widgets across 3 rows: 6-tile KPI strip (Total Beds, Occupied, Available, Occupancy Rate, Outstanding Payments, Pending Maintenance), Room Status mini-grid + Payment Status donut, Occupancy Summary trend chart + Recent Activity feed
- **Hostel Management** *(tabbed)* — Overview (Hostel List) / Room & Beds (existing rich grid) / Check In/Out (form + recent table) / Appointments (timeline)
- **Resident Management** *(tabbed)* — Overview (existing user table) / Record (resident card grid) / Announcement (list + compose) / Attendance/GeoFencing (map + log) / History (timeline)
- **Maintenance** *(tabbed)* — Overview (existing reports + drawer) / Complaints (facility complaints) / Work Order (vendor tasks) / Records (resolved archive)
- **Transportation** *(tabbed)* — Overview (KPI strip) / Trip Schedule (table) / Trip Status (live reports)
- **Billings & Payment** *(tabbed)* — Overview (KPI strip) / Invoices (existing rentals) / Overdue (filtered view) / Compounds (fines) / Statistics (revenue chart)
- **Staff & Users** *(tabbed)* — Staff List (admins + drivers) / Roles & Permission (matrix) / Activity Logs (audit feed) / University Partners (MOU cards)
- **Helpdesk** — single-view ticket queue with KPI strip + table + drawer detail
- **Profile** — single-view account card with Activity + Preferences cards
- **Settings** — Profile / Password / Payment Settings / Hostel Info tabs (existing)

Tabs swap content in-memory without changing the hash route, so browser-back returns to the previous main section, not the previous tab.

#### Mobile Native Mode (admin viewport <900px)

When the admin dashboard opens at narrow widths (phone, tablet portrait, or DevTools mobile emulation), it auto-switches to a native mobile layout:

- **2-tier bottom navigation** — bottom row has 4 group tabs (Main / Operations / People / Account); a sub-row above it shows the routes inside the active group. Tap a group tab to swap the sub-row; tap a sub-row item to navigate. Tap the active group tab a second time to scroll content to top (iOS pattern).
- **Sub-row scrolls horizontally** — long groups (Operations has 5 items) swipe naturally with scroll-snap, scrollbar hidden.
- **No sidebar / no hamburger on mobile** — navigation flows exclusively through the bottom 2-tier nav. The desktop sidebar is hidden on mobile; less chrome, simpler mental model.
- **Dedicated mobile renders, page by page** — each module ships its own mobile-native layout separate from the desktop grid:
  - **Dashboard (Main)** — time-aware greeting, hero Occupancy card with 40px primary metric + thick progress bar, 2-col compact stats (Outstanding + Pending Maintenance), ALL-CAPS section labels (iOS pattern), swipeable Insights carousel for Payment Status / Occupancy Trend / Recent Activity (with pager dots), and a full Recent Activity list card below for complete reading.
  - **Hostel Management (Operations)** — per-tab mobile renders: Overview shows greeting + hero Occupancy card + 2-col Capacity/Established + Property Info list-card + Amenities chip grid; Room & Beds shows horizontal Block pills (A/B/C) + Room Status mini-grid + per-block room list-card; Check In/Out shows stacked form with segmented Action control + full-width Submit + Recent Check-Ins list + Coming next stub; Appointments shows full-width Book CTA + time-prefixed appointments list-card + Coming next stub.
  - **Resident Management (Operations)** — Overview shows greeting + hero (Total Residents) + 2-col stats + All Tenants list-card; Record shows resident records list-card with avatar circles; Announcement shows full-width [+ New] CTA + announcements list-card with HIGH priority badge; Attendance shows compact gradient map placeholder + recent attendance list-card with IN/OUT badges; History shows resident timeline list-card with kind-based icons.
  - **Maintenance (Operations)** — Overview shows hero (Pending count) + 2-col stats + Maintenance Reports list-card built directly from store; Complaints shows merged facility + helpdesk list-card with status badges; Work Order shows full-width [+ New] CTA + active work orders list-card with priority badges; Records shows resolved archive list-card with check icons.
  - **Transportation (Operations)** — Overview shows greeting + 2x2 stat grid (Trips Today/Completed/Pending/Drivers) + Today's Activity list-card; Trip Schedule shows trips-this-week list-card with clock icons + ACTIVE badges; Trip Status shows full-width Refresh CTA + live trip reports list-card with status badges color-coded by completion state.
  - **Billings & Payment (Operations)** — Overview shows greeting + hero (Total Billed RM with collection-rate bar) + 2-col stats (Collection % / Outstanding) + Recent Payments list-card; Invoices shows full payment list-card built directly from store with status badges; Overdue shows overdue-only filtered list-card with inline Send Reminder buttons; Compounds shows full-width [+ Issue] CTA + fines list-card; Statistics shows mobile bar chart (canvas#billing-stats-chart-mobile) + Coming Next stub.
  - **Other module pages** (Staff & Users / Helpdesk / Profile / Settings) currently use the responsive CSS adaptation from M1 and will get their own dedicated mobile renders in upcoming rounds.
- **Content adaptations on other pages** — section tabs become horizontal scroll-snap; wide tables scroll horizontally inside their wrappers; two-column layouts collapse to single column.
- **Auto-swap on resize** — if the browser is resized across the 900px boundary, the active section re-renders (debounced 150ms) so layout changes instantly without manual reload.
- **Safe area** — `env(safe-area-inset-bottom)` honored so the bottom nav clears the iPhone home indicator.

No action needed to switch modes — resize the browser below 900px wide or use Chrome DevTools mobile emulation and the layout transitions automatically.

### Student / Tenant (desktop, left sidebar)
- **Home** — welcome card + 4 action cards (My Room / Next Class Pickup / Rent Status / Open Maintenance)
- **My Room** — full room details with photo placeholder + amenities + roommate info
- **Class Schedule** — list of classes with NOW pulse-badge during pickup window, **Show QR** opens a large white QR card with countdown timer
- **Maintenance** — submit report form (auto-filled room, category, urgency, photos), my reports table with status badges
- **Payments** — current month + next month cards, Pay Now modal (FPX/Card/Bank picker), full payment history
- **Settings** — Profile / Password / Payment Methods (saved cards + auto-pay toggle)

### Driver (mobile-only, bottom tab bar — native app feel)
- **Today** — current pickup window with student list + Scan QR Now button, upcoming pickups, completed today
- **Scan QR** — full camera viewport with framing brackets + 5-rule QR validation
- **Schedule** — Mon-Fri week view with NOW/Done badges
- **Me** — profile card + grouped settings (Account / Vehicle / Payment / Preferences) with iOS-style toggles

> Open the driver dashboard on a mobile device or use browser DevTools mobile emulation. On desktop widths (>768px), a splash screen prompts to switch to mobile.

## Centerpiece — Time-bound QR Pickup Flow

The system's defining feature. **Direction: driver shows / student scans** — like a venue check-in. The driver is the pickup authority; the student verifies they're boarding the right ride.

1. **Student schedules a class** (day, start time, class, pickup location)
2. **15 minutes before class start**, both apps light up:
   - Driver's **My QR** tab activates and renders a fresh QR with a 10-minute validity window
   - Student's schedule row shows a pulsing **NOW** badge with a **Scan to Board** button
3. The QR encodes:
   ```json
   {
     "driverId":   "U003",
     "scheduleId": "SCH-Tue-1430",
     "classId":    "CLS-SE",
     "classDate":  "2026-04-30",
     "issuedAt":   1714476120000,
     "expiresAt":  1714476720000,
     "sig":        "a3f9..."
   }
   ```
   The `sig` is a SHA-256 hash of the rest of the payload — tamper detection.
4. **Student taps Scan to Board** → camera starts
5. **Student aims at driver's QR** → 5 validation rules fire:
   1. JSON parses cleanly
   2. Signature matches the hash of the payload
   3. Now is between `issuedAt` and `expiresAt`
   4. `scheduleId` belongs to ME and is for today with an open pickup window
   5. `driverId` is a registered driver
   6. (bonus) Student hasn't already boarded this pickup today
6. **All pass** → green "You're on board" overlay → student taps **Confirm boarding** → logged to `pickups` store
7. **Any fail** → red "Cannot board" overlay with the specific reason
8. **Driver sees boarded students appear live** in the QR view as students confirm

Each driver QR is a single, time-bound, signed token shared by all students of that pickup window.

## Module Coverage (PDMS)

This is a hardcoded prototype demonstrating the PDMS Hostel Management module structure. Each PDMS sub-item is mapped against one of three states:

- **Live** — existing rich screen reused, fully interactive with seed data persisted to `localStorage`
- **Demo** — stub backed by seed data, structure visible with sample content
- **Planned** — listed in IA + visible in UI but content ships in the next phase (signaled by the soft "Prototype scope" banner + Coming next sidebar)

| PDMS Group | Sub-item | Status |
|---|---|---|
| Dashboard | Total Beds / Occupied / Available / Occupancy Rate | Live |
| Dashboard | Outstanding Payments / Pending Maintenance | Live |
| Dashboard | Room Status grid / Payment Status donut | Live |
| Dashboard | Occupancy Summary / Recent Activity | Live |
| Hostel Management | Overview (Hostel List) | Demo |
| Hostel Management | Room & Beds | Live |
| Hostel Management | Check In/Out | Demo |
| Hostel Management | Appointments | Demo |
| Resident Management | Overview (all residents) | Live |
| Resident Management | Record | Demo |
| Resident Management | Announcement | Demo |
| Resident Management | Attendance / GeoFencing | Demo + Planned (live map) |
| Resident Management | History | Demo |
| Maintenance | Overview | Live |
| Maintenance | Complaints | Demo |
| Maintenance | Work Order | Demo |
| Maintenance | Records | Demo |
| Transportation | Overview | Demo |
| Transportation | Trip Schedule | Demo |
| Transportation | Trip Status | Demo |
| Billings & Payment | Overview | Live |
| Billings & Payment | Invoices | Live |
| Billings & Payment | Overdue | Live |
| Billings & Payment | Compounds | Demo |
| Billings & Payment | Statistics | Demo |
| Staff & Users | Staff List | Live |
| Staff & Users | Roles & Permission | Demo |
| Staff & Users | Activity Logs | Demo |
| Staff & Users | University Partners | Demo |
| Helpdesk | Ticket queue | Demo |
| Profile | Account info / Activity / Preferences | Live (uses current session) |
| Settings | Profile / Password / Payment Settings / Hostel Info | Live |

Demo seed data uses Malaysian-context names and addresses (Asrama Mahkota, +60 phone format, UTM/USM/UM partners, Block A/B/C wardens) so the prototype reads as regional rather than generic.

## Browser Support

- Chrome / Edge / Firefox (latest)
- Safari 16+
- Mobile Safari iOS 16+ / Chrome Android (driver dashboard)

## Resetting the Demo

The seed data lives in `localStorage`. To reset:

```js
// In browser DevTools console:
Object.keys(localStorage).filter(k => k.startsWith('hms_')).forEach(k => localStorage.removeItem(k));
location.reload();
```

Then refresh — `seed.js` will re-seed from scratch.

## License

Built for demo purposes. Contact the project owner for usage rights.
