# AttendPro — Employee Attendance Management System

A full-stack web app for managing employee attendance with fingerprint & QR code check-in, daily tracking, and monthly reports.

---

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | React 18 + Vite + Chart.js        |
| Backend  | Node.js + Express                 |
| Database | PostgreSQL + Prisma ORM           |
| Auth     | JWT (jsonwebtoken + bcryptjs)     |
| QR Code  | qrcode + qrcode.react             |
| Deploy   | Docker + Docker Compose           |

---

## Features

- **Worker Registration** — full employee profiles with biometric & QR IDs
- **Fingerprint Check-in** — simulated biometric scanner UI (integrates with real hardware via API)
- **QR Code Check-in** — generate time-limited QR tokens for mobile check-in
- **Daily Attendance Tracking** — real-time today summary with check-in/out logs
- **Monthly Reports** — heatmaps, charts, per-employee summaries, CSV export
- **Leaderboard** — top attendance rankings
- **Department Analytics** — attendance rate per department
- **Company Settings** — work hours, late threshold, working days, departments
- **Device Management** — track biometric scanners online/offline status

---

## Quick Start (Local Dev)

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ running locally (or use Docker)

### 1. Clone & Install

```bash
# Backend
cd backend
cp .env.example .env      # Edit DATABASE_URL, JWT_SECRET
npm install
npx prisma migrate dev --name init
node src/prisma/seed.js   # Seed demo data

# Frontend
cd ../frontend
cp .env.example .env
npm install
```

### 2. Run

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Visit: http://localhost:3000
Login: **admin@techcorp.com** / **admin123**

---

## Docker Compose (Recommended)

```bash
cp backend/.env.example backend/.env
docker-compose up --build
```

Visit: http://localhost:3000

---

## API Endpoints

| Method | Endpoint                        | Description              |
|--------|---------------------------------|--------------------------|
| POST   | /api/auth/register              | Create company + admin   |
| POST   | /api/auth/login                 | Login                    |
| GET    | /api/employees                  | List employees           |
| POST   | /api/employees                  | Register employee        |
| GET    | /api/attendance                 | Get records (filtered)   |
| POST   | /api/attendance/checkin         | Check in                 |
| POST   | /api/attendance/checkout        | Check out                |
| POST   | /api/attendance/manual          | Manual entry             |
| GET    | /api/attendance/today-summary   | Today's stats            |
| GET    | /api/reports/monthly            | Monthly report           |
| GET    | /api/reports/weekly             | Weekly trend             |
| GET    | /api/reports/department         | By department            |
| POST   | /api/qr/generate/:employeeId    | Generate QR token        |
| POST   | /api/qr/scan                    | Process QR scan          |
| GET    | /api/company                    | Company settings         |
| PUT    | /api/company                    | Update settings          |

---

## Project Structure

```
attendance-system/
├── backend/
│   ├── prisma/schema.prisma       # Database models
│   └── src/
│       ├── server.js              # Express entry point
│       ├── config/prisma.js       # DB client
│       ├── middleware/auth.js     # JWT guard
│       ├── controllers/           # Business logic
│       ├── routes/                # API routes
│       └── prisma/seed.js         # Demo data
├── frontend/
│   └── src/
│       ├── App.jsx                # Router
│       ├── context/AuthContext    # Auth state
│       ├── utils/api.js           # Axios client
│       └── pages/
│           ├── DashboardPage
│           ├── CheckInPage        # Fingerprint + QR
│           ├── EmployeesPage
│           ├── AttendancePage
│           ├── ReportsPage        # Charts + Heatmap
│           ├── SettingsPage
│           └── QRScanPage         # Mobile QR landing
├── docker-compose.yml
└── README.md
```

---

## Connecting Real Fingerprint Hardware

The backend `/api/attendance/checkin` endpoint accepts `{ employeeId, method: "Fingerprint" }`.
Your hardware SDK should call this endpoint when a fingerprint is matched.
Match employees via their `fingerprintId` field stored in the database.

