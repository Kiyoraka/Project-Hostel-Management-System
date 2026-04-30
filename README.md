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
│   │   ├── admin.js            Admin router + chrome
│   │   ├── admin-{users,rooms,rentals,maintenance,settings}.js
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

**Option B — Local server:**
```bash
python -m http.server 8080
# Then open http://localhost:8080
```

Or any other static file server (`npx serve`, `php -S localhost:8080`, etc.).

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@gmail.com` | `admin123` |
| **Student / Tenant** | `student1@gmail.com` | `student123` |
| **Driver** | `driver@gmail.com` | `driver123` |

The login modal has clickable demo-login buttons that auto-fill these credentials.

## Roles & Surfaces

### Admin (desktop, left sidebar)
- **Overview** — KPI tiles (tenants, occupancy, open maintenance, today's pickups), recent activity, 30-day occupancy trend chart
- **Users** — searchable + filtered + paginated user table with role-aware add/edit modal (tenant fields vs driver fields)
- **Rooms** — block-tabbed grid (A/B/C) with status dots, click for detail drawer with tenant info + amenities, mark maintenance toggle
- **Rentals** — payments table with status filter pills (Paid/Due/Late) + month dropdown, summary footer (Total billed/Paid/Outstanding)
- **Maintenance** — reports table sorted by recency, status filter pills, click row for detail drawer (description + photos + assign + status + notes), CSV export
- **Settings** — Profile / Password / Payment Settings / Hostel Info tabs

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
