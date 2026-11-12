# Johar Jharkhand Smart Tourism Platform

An intelligent, resilient tourism platform for discovering Jharkhand's destinations, planning sustainable trips, supporting local businesses, and improving tourist safety. The application combines an immersive public tourism experience with authenticated traveller tools and a government intelligence dashboard.

## Problem statement

Tourism information for Jharkhand is distributed across disconnected sources, while travellers need reliable destination information, realistic routes, local experiences, emergency support, and trip planning in one place. Tourism stakeholders also need an operational view of demand, visitor sentiment, crowd signals, and destination performance. Johar brings these needs together without making the core browsing experience dependent on a live backend.

## Key features

- Destination discovery with filters, detailed destination pages, galleries, seasons, fees, timings, tags, and eco-guidelines.
- Interactive maps, GPS/geolocation support, destination routing, and route-aware itinerary planning.
- Multi-day trip planner with budget, pace, group, interests, and travel-circuit preferences.
- Local guides, vendors, crafts, regional products, and digital Eco-Pass booking flow.
- Tourist reviews and review-intelligence summaries.
- SOS and emergency-help modal with Jharkhand emergency contacts and safety guidance.
- Authenticated sign-up, sign-in, password recovery, profile, and role-aware admin access.
- Government intelligence dashboard with tourism, crowd, voice-of-tourist, and destination signals.
- Gemini-powered itinerary recommendations when `GEMINI_API_KEY` is configured, with deterministic local fallback data when it is not.
- Supabase-backed data access with a resilient seed-catalog fallback for local development and degraded connectivity.
- Responsive earthy visual design with dark-mode support. The existing UI has been preserved.

## Technology stack

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS 4 with the Tailwind Vite plugin
- Leaflet for maps
- Lucide React, Motion, QRCode, and JSZip

### Backend and services

- Vite serves the production frontend.
- Supabase JavaScript client provides authentication and Postgres-backed data access from the browser using the public anon key.
- `src/server/itineraryService.ts` contains the server-side itinerary recommendation service and keeps the Gemini API key server-side.
- Local seed data in `src/data/` keeps browsing and planning functional without Supabase.

### Database

Supabase Postgres schema, row-level security policies, and seed data are provided in:

- `db/schema.sql`
- `db/security.sql`
- `db/seed.sql`

### Authentication

Supabase Auth is optional for local browsing and required for authenticated account flows. Configure the public project URL and anon key in the Vite environment. Never place a Supabase service-role key in the frontend or in this repository.

### Maps and geolocation

The map and routing services use browser geolocation where available and map/routing providers configured by the application. Review `docs/API_AND_SERVICES.md` before enabling external production services. Location permissions are requested by the browser at runtime.

### AI and recommendation features

The itinerary service sends sanitized trip preferences and the authorized destination catalog to Gemini when `GEMINI_API_KEY` (or the server-only compatibility variable `API_KEY`) is configured. Without the key, the application uses the built-in itinerary logic and seed catalog.

### SOS and emergency features

Emergency contacts and safety actions are implemented in `src/data/emergency-contacts.ts` and `src/components/emergency-help-modal.tsx`. The SOS experience is designed to provide quick access to local emergency numbers and location-aware assistance; verify phone numbers and operational procedures before a public launch.

### Government intelligence dashboard

The protected admin route combines destination, crowd, tourist-voice, review, and tourism-intelligence services. Use the configured admin guard and Supabase policies to control access in production.

## Project structure

```text
db/                 Supabase schema, security policies, and seed data
docs/               External API/service notes
scripts/            Source bundle utilities
src/components/     Reusable UI, map, dashboard, booking, and safety components
src/data/           Jharkhand catalog and emergency fallback data
src/lib/            Supabase, authentication, theme, and utility helpers
src/routes/         Public, authenticated, and admin route screens
src/server/         Server-only itinerary recommendation service
src/services/       Data, routing, review, vendor, and intelligence services
src/types/          Shared TypeScript and database types
```

## Installation and setup

### Prerequisites

- Node.js 18+ (Node.js 20+ recommended)
- npm, or Bun/Yarn
- A Supabase project for authentication and persistent data (optional for fallback-only local browsing)

### Install

```bash
git clone https://github.com/<owner>/johar-jharkhand-tourism.git
cd johar-jharkhand-tourism
npm install
cp .env.example .env
```

Edit `.env` with the variables required for the features you want. `.env` is ignored by Git.

### Database setup

1. Open the Supabase SQL Editor.
2. Run `db/schema.sql`.
3. Run `db/security.sql`.
4. Run `db/seed.sql`.
5. Confirm the authentication providers and redirect URLs in Supabase Auth settings.

### Required environment variables

```env
# Browser-safe Supabase project settings
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>

# Server-only Gemini key for AI itinerary generation (optional)
GEMINI_API_KEY=<your-gemini-api-key>
```

`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are optional for fallback-only browsing. `GEMINI_API_KEY` is optional; omit it to use the local recommendation fallback. Do not commit `.env`, service-role keys, private credentials, or API keys.

## Run and build commands

```bash
npm run dev       # development server on port 8080
npm run lint      # TypeScript type check
npm run build     # production build to dist/
npm run preview   # preview the production build
npm run clean     # remove generated build output
```

## Deployment

Deploy the Vite output using a static hosting provider or a Replit deployment. Configure the same environment variables in the deployment secret/environment manager, not in source control. For production Supabase usage, apply the SQL files, configure Auth redirect URLs, review RLS policies, and validate all map, routing, Gemini, and emergency integrations for the target operating environment.

## Security and repository hygiene

The repository ignores dependencies, build output, environment files, temporary files, editor metadata, certificates, and common secret formats. Only `.env.example` is intentionally tracked. Review changes with `git diff --check` and `git status` before committing.

## License

MIT License. Built for the Jharkhand Tourism Initiative.