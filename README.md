# QuestList — Gamified Productivity To-Do App

A full-stack productivity app with RPG-style gamification. Complete tasks to earn XP, level up, unlock achievements, and track your productivity through analytics.

## Features
- **Gamification** — XP system, levels, achievements, daily streaks
- **Task Management** — priorities (Low/Medium/High), categories, due dates
- **Analytics Dashboard** — XP history, completion charts, category breakdowns
- **JWT Authentication** — secure register/login
- **Dark RPG Theme** — custom glassmorphism UI

## Tech Stack
| Layer | Tech |
|-------|------|
| Frontend | React, Vite, Tailwind CSS v4, Framer Motion, Recharts |
| Backend | Node.js, Express, Prisma ORM |
| Database | PostgreSQL (Supabase) |
| Auth | JWT + bcrypt |

## Getting Started

### Prerequisites
- Node.js v18+
- A Supabase project (free at supabase.com)

### Backend
```bash
cd backend
npm install
# Add your DATABASE_URL and JWT_SECRET to .env
npx prisma db push
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`, API at `http://localhost:5000`.

## Environment Variables

**backend/.env**
```
DATABASE_URL="your-supabase-connection-string"
JWT_SECRET="your-secret-key"
PORT=5000
```

> ⚠️ Never commit your `.env` file — it's already in `.gitignore`.
