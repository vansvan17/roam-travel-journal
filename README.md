# Roam — a personal travel journal

A complete MERN application for planning trips, keeping daily itineraries, recording travel expenses, and saving memories. Built with MongoDB, Express 5, React 19, and Node.js 22.

**Live app:** https://roam-travel-journal-rosy.vercel.app

**Production verified:** Connected to a free MongoDB Atlas cluster. Live registration, sign-in, trip creation, itinerary, expenses, journal entries, updates, and persistence after a fresh sign-in were verified on 27 October 2026. Disposable test records were removed.

The production database uses a dedicated database-scoped login. Its connection URI is stored as a server-only Vercel Production secret. The approved network configuration permits IPv4 connections because the free Vercel deployment uses changing outbound addresses; database authentication and TLS are still required.

## Features

- Registration and sign-in with salted scrypt password hashes
- Seven-day, revocable sessions in HttpOnly cookies; only token hashes are stored
- Private trips: create, view, update, and delete; every database query is scoped to the signed-in user
- Day-by-day itinerary with times and notes
- Expense recording with categories, remaining budget, and over-budget indicators
- Journal entries with dates and moods
- Overview, trip search, status filters, journal gallery, and budget dashboard
- Responsive layouts, keyboard focus handling, and accessible form labels
- Downloadable JSON journal export
- Explicit browser-local demo with sample journeys; no database dependency or shared demo credentials

## Quick start

Requires Node.js 22+ and MongoDB (local or Atlas).

```sh
npm ci
cp .env.example .env
# Set MONGODB_URI in .env
npm run dev
```

Open http://127.0.0.1:5173. The React dev server proxies `/api` to Express on port 3001.

For a production build served by Express:

```sh
npm run build
npm start
```

Open http://127.0.0.1:3001.

## Environment

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | Server-only MongoDB connection string. Use a dedicated database such as `roam`. |
| `NODE_ENV` | `production` enables secure cookies. Vercel sets this automatically. |
| `PORT` | Local Express port; defaults to 3001. |

Never put the database URI into a `VITE_` variable, client source, or a Git commit. `.env` files are ignored.

## Deploy to Vercel

The repository contains `vercel.json`: Vite builds the React app into `dist`; `/api/*` routes to the Express serverless entry point at `api/index.js`. Non-API routes serve the React app.

1. Import this GitHub repository in Vercel. Leave the root directory at the repository root.
2. Set `MONGODB_URI` in the Vercel project's Production environment.
3. Deploy. After changing environment variables, redeploy so the new values apply.
4. Confirm `/api/health` returns `200` and `{"status":"ok","database":"connected"}`.
5. Register an account and create a trip. Sign out and back in to verify persistence.

MongoDB Atlas must permit connections from the deployment environment. Prefer an appropriate restricted network setup for the chosen hosting plan. Use a database-scoped user with only the privileges this app requires. Do not commit credentials.

If the database is absent or unreachable, the API reports an honest `503`; the app's labeled demo remains usable. Demo changes are stored only in that browser and are not automatically imported into new accounts.

## Tests

```sh
npm test
npm run test:integration
npm run build
```

Integration tests launch an isolated temporary MongoDB instance using `mongodb-memory-server`, then exercise registration, session persistence, login, duplicate accounts, CRUD, trip ownership isolation, validation, cross-origin rejection, deletion, logout/revocation, and the database health check. The first integration run downloads a MongoDB binary. It never uses the production database.

GitHub Actions runs these checks on pushes and pull requests.

## API

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Verify database connectivity |
| POST | `/api/auth/register` | Create an account and session |
| POST | `/api/auth/login` | Create a session |
| GET | `/api/auth/me` | Current account |
| POST | `/api/auth/logout` | Revoke current session |
| GET | `/api/trips` | Current user's trips |
| POST | `/api/trips` | Create a trip |
| GET | `/api/trips/:id` | Read an owned trip |
| PUT | `/api/trips/:id` | Replace an owned trip's editable fields |
| DELETE | `/api/trips/:id` | Delete an owned trip |

Requests with bodies require JSON. Server validation is enforced with Zod. Unknown fields, invalid dates, negative budgets, and malformed IDs are rejected. Cookies use SameSite=Lax and are secure in production. Mutation requests with foreign origins are rejected. Auth endpoints have basic per-instance request limits. For a public service with significant traffic, replace in-memory rate limiting with a shared store and add email verification and password recovery.

## Data model

- `User`: name, normalized unique email, password hash
- `Session`: user reference, unique token hash, expiry with TTL index
- `Trip`: user reference, destination, dates, status, currency, budget, cover theme, notes, and bounded embedded itinerary, expense, and journal arrays

Amounts are shown in each trip's chosen currency. There is no exchange-rate conversion. Trips are personal; collaboration, booking, payments, and photo uploads are outside this version's scope.

## Structure

```text
client/src/        React UI, browser-local demo, and styles
client/public/     Self-hosted typefaces and favicon
server/            Express app, MongoDB models, validation, security
api/index.js       Vercel entry point
tests/            Security/validation and MongoDB integration tests
vercel.json        Deployment routing
```

Destination photography is served from Unsplash. Fonts are bundled locally; their licenses are included under `client/public/fonts`.
