# First Bysenes

Gamified **business launch simulator** (MVP): one active mission at a time, XP, levels **Idea → Validation → MVP → Launch → First Customer**, and an **AI coach** via DeepSeek (server-side only).

## Stack

- **Frontend:** React (Vite), TypeScript, TailwindCSS, Zustand, React Router  
- **Backend:** Node.js, Express, TypeScript  
- **Data:** In-memory store (resets when the server restarts)  
- **AI:** DeepSeek API from the backend (`DEEPSEEK_API_KEY`)

## Prerequisites

- Node.js 18+ (global `fetch`)

## Install

```bash
cd FirstBusiness/backend && npm install
cd ../frontend && npm install
```

## Environment

Copy the example and add your key:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and set `DEEPSEEK_API_KEY` for the AI page. Other variables are optional for local dev.

## Run

**Terminal 1 — API**

```bash
cd FirstBusiness/backend
npm run dev
```

Runs at `http://localhost:3001`.

**Terminal 2 — Web**

```bash
cd FirstBusiness/frontend
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api` to the backend.

### Production build

```bash
cd FirstBusiness/backend && npm run build && npm start
cd FirstBusiness/frontend && npm run build && npm run preview
```

If the frontend is not served from the same origin as the API, set `VITE_API_URL` (e.g. `https://api.example.com`) before `npm run build`.

## Routes (app)

| Path           | Description        |
|----------------|--------------------|
| `/login`       | Register / log in  |
| `/dashboard`   | Level, XP, current mission |
| `/mission/:id` | Checklist + complete tasks |
| `/ai`          | Chat (modes: chat, ideas, offer, analyze) |

## API (summary)

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/register` | — |
| POST | `/api/auth/login` | — |
| GET | `/api/me` | Bearer |
| PATCH | `/api/missions/:missionId/tasks/:taskIndex` | Bearer |
| GET | `/api/missions/:missionId` | Bearer |
| POST | `/api/ai` | Bearer (body: `message`, `mode`) |

## Success check

1. Register, open **Dashboard**, open the active mission.  
2. Complete all checklist items → XP increases and the next mission unlocks.  
3. Open **AI**, send a message (requires valid `DEEPSEEK_API_KEY` on the server).
