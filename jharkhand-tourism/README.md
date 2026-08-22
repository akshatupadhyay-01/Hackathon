# Jharkhand Tourism & Eco-Exploration Platform

A full-featured digital tourism, cultural discovery, and eco-travel web application for Jharkhand, India. Built with **React**, **Vite**, **TypeScript**, **Tailwind CSS**, and powered by **Supabase**.

---

## 🌟 Key Features

1. **Destinations Directory & Details**:
   - Filter by categories (Waterfalls, Wildlife, Spiritual, Heritage, Nature, Hills) and districts (Ranchi, Latehar, Giridih, Bokaro, etc.).
   - Detailed destination view with hero galleries, entry fees, timings, weather ratings, best visit seasons, cultural significance, and eco-guidelines.
2. **Local Marketplace & Guides**:
   - Verified local guides with certified badges, daily rates, languages spoken, and bio.
   - Eco-tourism handicraft and regional organic food vendors.
   - Built-in Eco-Pass booking modal with pricing calculator and instant confirmation ticket.
3. **Interactive Itinerary & Trip Planner**:
   - Multi-day trip curation with budget tracking, pace selector, and dynamic day-by-day itineraries.
4. **Dual Data Architecture (Supabase + Resilient Seed Fallback)**:
   - Direct integration with Supabase Postgres for real-time querying.
   - Zero-breakdown fallback seed database ensuring 100% offline and testing resilience.
5. **Responsive Design & Dark Mode**:
   - Clean earthy UI with dark mode support.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: Version 18+ or 20+
- **npm** or **bun** / **yarn**

### 2. Installation
```bash
# Clone or extract the project
cd jharkhand-tourism

# Install dependencies
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your Supabase credentials in `.env`:
```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

### 4. Database Setup (Supabase)
1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor**.
3. Run `db/schema.sql` to create all required tables (`districts`, `categories`, `destinations`, `local_guides`, `vendors`, `reviews`, `bookings`).
4. Run `db/seed.sql` to populate sample destinations, verified guides, artisan vendors, and user reviews.

### 5. Running the Application
```bash
# Start development server on port 3000
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Building for Production
```bash
# Type check and build
npm run lint
npm run build

# Preview production build
npm run preview
```

---

## 📁 Directory Structure

```
├── db/
│   ├── schema.sql           # Complete Supabase PostgreSQL schema with RLS
│   └── seed.sql             # Comprehensive seed data for Jharkhand destinations
├── public/                  # Static assets and downloadable bundle
├── src/
│   ├── components/          # Reusable UI cards, headers, modals, filters
│   ├── data/                # Fallback seed dataset and catalog
│   ├── lib/                 # Supabase client & utility helpers
│   ├── routes/              # Page routes (Explore, Details, Guides, Planner, etc.)
│   ├── services/            # Supabase API services with automatic fallback
│   ├── types/               # TypeScript interfaces and database schemas
│   ├── App.tsx              # Main layout and client router
│   ├── index.css            # Tailwind CSS styling
│   └── main.tsx             # Application entry point
├── .env.example             # Example environment variables
├── package.json             # Project dependencies and scripts
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite bundler configuration
```

---

## 📜 License
MIT License. Built for Jharkhand Tourism Initiative.
