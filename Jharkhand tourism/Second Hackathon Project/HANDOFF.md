# Jharkhand Tourism & Eco-Exploration — Session Handoff

> **Next session: read this file first.** It records exactly what has been done,
> what is still pending, and the rules to follow. Resume from "Pending work",
> do NOT re-audit or rebuild the project from scratch.

Last updated: 2026-08-20

---

## 0. Ground rules (carry forward every session)

- Do NOT rebuild from scratch. Do NOT remove working features.
- Preserve the custom React + Vite + TypeScript SPA architecture and the
  hand-rolled router in `src/App.tsx` (no React Router / TanStack Router).
- Preserve the Supabase-first / seed-fallback data architecture: every service
  tries Supabase, and falls back to seed constants when Supabase is not
  configured or the query fails. Never delete the fallback path.
- Backend decision: **keep the user's own Supabase project**. Lovable Cloud is
  NOT enabled. SQL is delivered as files under `db/` for the user to run.
- Keep the current UI/UX quality; changes must be incremental.
- Verify `npm run build` (or `bun run build:dev`) passes after each major change.

## 1. Architecture map

| Area | Location |
| --- | --- |
| Router (switch on `currentPath`) | `src/App.tsx` |
| Pages | `src/routes/*.tsx` |
| Shared UI | `src/components/`, `src/components/ui/` |
| Data services (Supabase + fallback) | `src/services/*.ts` |
| Seed/fallback data | `src/data/*.ts` |
| Auth + role state | `src/lib/auth-context.tsx` |
| Supabase client | `src/lib/supabase.ts` |
| Base schema | `db/schema.sql` |
| Security layer (new) | `db/security.sql` |

## 2. Completed work

### Build & dead code
- Re-implemented `src/lib/download-zip.ts` using Vite `import.meta.glob`
  (the old code imported a missing `project-files.json` and broke the build).
- Removed ghost/duplicate files at repo root under `lib/` and `types/`.
- Deleted the unused `MockMap` component.
- Added the missing `build:dev` script to `package.json`
  (`vite build --mode development`). Build now passes.

### Security (`db/security.sql` — must be run in the Supabase SQL editor)
- `GRANT` statements for `anon` / `authenticated` / `service_role` on every
  public table (PostgREST needs these; RLS alone is not enough).
- RLS enabled + owner-scoped policies (`auth.uid()`) for `profiles`,
  `bookings`, `saved_itineraries`, `reviews`.
- Public read policies for catalogue tables (destinations, districts, vendors).
- RBAC: `app_role` enum, separate `public.user_roles` table, and
  `public.has_role(_user_id, _role)` SECURITY DEFINER function.
  Roles are NEVER stored on `profiles` (privilege-escalation risk).
- Added missing `vendors` columns: latitude, longitude, specialties.

### Admin gating
- `src/lib/auth-context.tsx` now exposes `isAdmin`, resolved server-side from
  `user_roles` after sign-in (`loadAdminRole`).
- `src/components/site-header.tsx` hides Government Dashboard links from
  non-admins.
- New `src/routes/admin-guard.tsx` wraps `AdminPage`: shows a sign-in prompt
  when logged out and a "restricted area" screen when the user lacks the
  `admin` role. `/admin` in `src/App.tsx` renders `AdminGuard`, not `AdminPage`.

### Routing
- New `src/routes/not-found.tsx`; the router `default:` case now renders a real
  404 page instead of silently falling back to the home page.

## 3. Pending work (resume here, in this order)

1. **Vendor / local-economy persistence**
   - `src/services/localVendors.ts`: still returns the hardcoded
     `VERIFIED_JHARKHAND_VENDORS` array. Add a Supabase read from `vendors`
     (with the new lat/lng/specialties columns) and keep the array as fallback.
   - Add `submitVendorApplication()` writing to `vendors`
     (status `pending`, owner = `auth.uid()`).
   - `src/routes/business.tsx`: the onboarding form currently only shows a
     toast; wire it to `submitVendorApplication()` with loading/error states.
   - Add the corresponding insert/select RLS policies to `db/security.sql`.

2. **Government Tourism Intelligence Dashboard — real data**
   - `src/services/tourismIntelligence.ts` computes everything from seed
     constants. Replace with Supabase aggregations (district impact,
     under-utilised destinations, spending patterns, complaint heatmap,
     crowd intelligence), keeping seed output as fallback.

3. **Reviews & complaints out of `localStorage`**
   - Move review/complaint writes to the `reviews` table; feed the complaint
     heatmap from real rows.

4. **Nice-to-have**
   - Code-split the 2 MB bundle (dynamic import for Leaflet + admin charts).
   - Eco Pass / booking rows written to Supabase instead of local state only.

## 4. Known caveats

- `db/security.sql` has NOT been executed against the user's Supabase project;
  it ships as a file. Remind the user to run `db/schema.sql` then
  `db/security.sql`, and to insert their own admin row:
  `insert into public.user_roles (user_id, role) values ('<uuid>', 'admin');`
- Demo mode (no Supabase env vars) is intentional — keep it working.
- Footer and home page still contain "Government Dashboard" buttons; they now
  land on the guard screen for non-admins, which is acceptable.
