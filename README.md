# Hostel Management System

A modern student hostel management web application built as pure vanilla HTML / CSS / JS — no framework, no build step.

## Stack

- HTML5 + CSS3 + ES6 JavaScript (no React, Vue, Next, npm, or bundler)
- FontAwesome 6.5 (icons via CDN)
- Google Fonts: Inter (typography via CDN)
- qrcode.js (QR code generation, CDN)
- html5-qrcode (QR scanning via device camera, CDN)
- Chart.js (admin dashboard sparklines, CDN)
- localStorage (mock backend persistence)

## Folder Structure

```
.
├── index.html              Landing page + login modal
├── admin/index.html        Admin dashboard shell
├── tenant/index.html       Tenant (student) dashboard shell
├── driver/index.html       Driver mobile-only shell
├── assets/
│   ├── style/              CSS files (tokens, base, dashboard, page-specific)
│   ├── script/             JS modules (auth, store, seed, ui, page logic)
│   └── img/                Logos, photos, illustrations
└── README.md
```

## Run

No install, no build. Just open `index.html` in a modern browser, or serve locally:

```bash
python -m http.server 8080
# then open http://localhost:8080
```

For QR scanning to work, the driver dashboard must be served over HTTPS or `localhost` (browser camera permission requirement).

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@gmail.com | admin123 |
| Student / Tenant | student1@gmail.com | student123 |
| Driver | driver@gmail.com | driver123 |

## Roles

- **Admin** — manages users, rooms, rentals, maintenance reports. Desktop with left sidebar.
- **Tenant (Student)** — views their room, registers class schedule, generates time-bound pickup QR codes, submits maintenance reports, pays rent. Desktop with left sidebar.
- **Driver** — mobile-only, native-app feel with bottom tab bar. Views today's pickup schedule and scans student QR codes during class pickup windows.

## Centerpiece — Time-bound QR Pickup

A student schedules a class. During the 15-minute window before class start, the student app displays a fresh QR code (encoded with student ID + schedule ID + class date + issued/expires timestamps + integrity signature). The driver opens the scanner and aims at the QR. Five validation rules confirm the QR is valid for *this student × this schedule × this time window* — any mismatch shows a specific reason.

## Browser Support

- Chrome / Edge / Firefox (latest)
- Safari 16+
- Mobile Safari iOS 16+ / Android Chrome (driver dashboard)
