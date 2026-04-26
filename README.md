# 🏎️ F1 Live — Formula 1 Dashboard & Live Timing

A production-level, full-stack Formula 1 web application featuring real-time race simulation, interactive dashboards, and a premium motorsports-themed UI.

## 🔗 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript |
| Styling | Tailwind CSS v4, Framer Motion |
| Charts | Recharts (Line, Bar, Radar) |
| Real-time | Socket.io (client + server) |
| Backend | Node.js, Express, TypeScript |
| Data Source | Jolpica F1 API (real data) + Mock fallback |
| Caching | node-cache (5-min TTL) |
| Auth | JWT (in-memory store) |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm

### 1. Start the Backend
```bash
cd backend
npm install
npm run dev
```
Backend runs at `http://localhost:4000`

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:3000`

## 📱 Features

### Dashboard
- Season overview with stats cards
- Next Grand Prix countdown timer
- Driver & Constructor standings with animated progress bars

### Drivers
- Grid of all 20 drivers with search & team filter
- Individual driver profiles with points progression charts
- Team color branding and nationality flags

### Teams
- Constructor cards with driver info and points
- Team detail pages with driver comparison charts

### Race Calendar
- Full season timeline with past/upcoming indicators
- Next race highlighted with live indicator

### Live Race Simulation
- Real-time leaderboard with animated position changes
- Tire strategy tracking (Soft/Medium/Hard)
- DRS indicators, pit stop events, safety cars
- Live event feed with overtakes, retirements, and more
- 57-lap Monaco GP simulation

### Driver Comparison
- Head-to-head stat bars with animated fills
- Radar chart performance visualization
- All 20 drivers selectable

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/drivers` | All drivers |
| GET | `/api/drivers/:id` | Driver by ID |
| GET | `/api/teams` | All teams |
| GET | `/api/teams/:id` | Team by ID |
| GET | `/api/standings/drivers` | Driver standings |
| GET | `/api/standings/constructors` | Constructor standings |
| GET | `/api/races` | Season calendar |
| GET | `/api/races/next` | Next race |
| POST | `/api/live/start` | Start race simulation |
| POST | `/api/live/stop` | Stop race simulation |
| GET | `/api/live/status` | Race state |
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login user |

## 🔧 Environment Variables

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

### Backend (`.env`)
```env
PORT=4000
JWT_SECRET=your-secret-key
```

## 🚢 Deployment

### Frontend → Vercel
```bash
cd frontend
npx vercel
```

### Backend → Railway/Render
Deploy the `backend/` directory with `npm run dev` as the start command.

## 📂 Project Structure

```
f1-app/
├── frontend/          # Next.js 14 application
│   ├── src/app/       # Pages (App Router)
│   ├── src/components/# Reusable UI components
│   ├── src/context/   # Theme & Socket providers
│   ├── src/lib/       # API client, socket, utilities
│   └── src/types/     # TypeScript interfaces
├── backend/           # Express + Socket.io server
│   └── src/
│       ├── routes/    # REST API endpoints
│       ├── services/  # Data fetching, race simulation, cache
│       └── data/      # Mock data fallback
└── README.md
```
