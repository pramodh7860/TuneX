# TuneX

TuneX is an immersive 3D supercar tuning studio built with React, Vite, Three.js, and a Node.js backend. It combines realistic car configuration, performance modeling, AI-assisted tuning recommendations, and user authentication for a polished custom tuning experience.

## Features

- 3D car display and tuning interface with `@react-three/fiber`, `@react-three/drei`, and `three`
- User-selectable models, engine upgrades, wheels, aero kits, weight setup, paint, and interior styles
- Realtime performance metrics and tuning score calculations
- AI tuning recommendation engine powered by Gemini via backend API
- Local authentication with email/password plus Google OAuth support
- User profiles, saved car configurations, and profile completion flow

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Zustand, GSAP, Three.js
- Backend: Node.js, Express, MongoDB, Mongoose, dotenv, bcryptjs
- AI: Gemini (Google Generative Language API) via backend route

## Repository Layout

- `src/` — frontend application code
- `src/components/` — UI and 3D car components
- `src/services/` — client helpers for backend/AI communication
- `src/store.js` — persisted application state using Zustand
- `server/` — backend API service and auth routes
- `server/.env.example` — backend environment variable template

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/pramodh7860/TuneX.git
cd TuneX
```

### 2. Install dependencies

```bash
npm install
cd server
npm install
cd ..
```

### 3. Configure backend environment

Copy the backend environment template and fill in your values:

```bash
cd server
copy .env.example .env
```

Update `server/.env` with:

```env
MONGODB_URI=your-mongodb-connection-string
FRONTEND_URL=http://localhost:5173
GOOGLE_REDIRECT_URI=http://localhost:5173/google-callback.html
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GEMINI_API_KEY=your-gemini-api-key
```

### 4. Run the backend server

```bash
cd server
npm run dev
```

### 5. Run the frontend

```bash
cd ..
npm run dev
```

### 6. Open the app

Visit `http://localhost:5173` in your browser.

## Environment Variables

- `MONGODB_URI` — MongoDB connection string
- `FRONTEND_URL` — frontend origin for CORS and OAuth redirect
- `GOOGLE_REDIRECT_URI` — Google OAuth redirect page
- `GOOGLE_CLIENT_ID` — Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` — Google OAuth client secret
- `GEMINI_API_KEY` — Gemini API key for AI tuning

## Backend API

- `GET /` — status check
- `GET /health` — health endpoint
- `POST /api/ai-tune` — request AI tuning recommendations
- `POST /api/auth/register` — register local user
- `POST /api/auth/login` — login local user
- `POST /api/auth/google` — exchange Google auth code
- `PUT /api/auth/profile` — complete user profile
- `POST /api/auth/save-car` — save car configuration
- `GET /api/debug/oauth-config` — debug OAuth config (requires `DEBUG_OAUTH=true`)

## AI Integration

The frontend sends a user goal to `POST /api/ai-tune`, where the backend forwards it to Gemini with a strict JSON prompt. The response is parsed and returned as structured tuning recommendations.

## Development Notes

- `src/aiPrompt.js` defines the AI prompt and required JSON format.
- `src/services/aiClient.js` handles AI recommendation requests and basic rate limiting.
- `src/store.js` stores UI state, selected car configuration, and persist settings.
- `server/server.js` manages auth, Google OAuth, MongoDB user storage, and AI request handling.

## Build and Preview

```bash
npm run build
npm run preview
```

## Notes

- The project is currently private by default and does not include a license file.
- If you deploy the backend separately, set `VITE_BACKEND_URL` in the frontend environment to point to your API host.
