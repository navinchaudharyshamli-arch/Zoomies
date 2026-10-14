# Zoomies - Pet Food Ordering App (Shared Test Prototype)

Zoomies is a mobile-first, installable Progressive Web App (PWA) for a cafe selling fresh, home-style meals for dogs and cats. It supports customer ordering (delivery or takeaway) and a shared live staff & admin kitchen portal in the same app.

---

## 🚀 Quick Start (Demo Mode)

The app works instantly out-of-the-box with **no environment variables needed**.

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Build & preview
npm run build
npm run preview
```

### Quick Demo Logins
In demo mode, you can log in with any password (e.g., `password123`):
- **Customer:** `customer@zoomies.com`
- **Kitchen Staff:** `staff@zoomies.com`
- **Owner / Admin:** `admin@zoomies.com`

*In Demo mode, cross-tab real-time sync is simulated automatically using `BroadcastChannel`.*

---

## ⚡ Supabase Setup (Shared Realtime Mode)

For multi-device shared testing across phones and laptops:

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a free project.
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Paste and run [`supabase/schema.sql`](file:///d:/Zoomies/supabase/schema.sql) (creates tables, RLS policies, and realtime publications).
4. Paste and run [`supabase/seed.sql`](file:///d:/Zoomies/supabase/seed.sql) (populates dog/cat menus, add-ons, and cafe settings).

### 2. Bootstrap the FIRST Admin User
1. Go to **Supabase Dashboard > Authentication > Users > Add User**.
2. Create an admin user (e.g. `admin@zoomies.com` with a secure password).
3. Open **SQL Editor** and execute:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE email = 'admin@zoomies.com';
   ```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` or set these in your hosting provider:

```ini
# Client-side (Public)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_TEST_BANNER=true

# Server-only (Used exclusively in /api and /netlify/functions)
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

> **Free-tier Supabase Note:**
> Free-tier Supabase projects automatically pause after a week of inactivity. If paused, restore the project in the Supabase dashboard. If unreachable during resume, Zoomies shows a friendly *"Waking up, try again in a minute"* screen instead of failing.

---

## 🌐 Deploy to Vercel

1. Push this repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: complete Zoomies shared prototype"
   git push -u origin main
   ```
2. Import the repository in [Vercel](https://vercel.com).
3. Set the Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_TEST_BANNER` = `true`
   - `SUPABASE_SERVICE_ROLE_KEY` (Serverless admin user management)
4. Deploy! `vercel.json` already contains the SPA rewrite and `/api` serverless handler.

---

## 🌍 Move to Netlify

Deploying to Netlify requires zero code changes:
1. Connect the repository in [Netlify](https://netlify.com).
2. Set the same environment variables in **Site configuration > Environment variables**.
3. Deploy! `netlify.toml` and `public/_redirects` will automatically handle SPA routing and `/netlify/functions/admin-users`.

---

## 📋 Features Checklist & Defaults

| Feature | Implementation | Default / Notes |
| :--- | :--- | :--- |
| **PWA & Offline** | `vite-plugin-pwa` with auto-update & install prompt | API endpoints excluded from cache to prevent stale data. |
| **Private Test Shield** | `<meta name="robots" content="noindex">` + `robots.txt` | Crawlers disallowed. |
| **Allergy Safety** | Auto-checks item ingredients against active pet's allergies | Displays allergy confirmation sheet before bowl addition. |
| **Add-ons in Grams** | Stepper in 50g increments (default 100g) with live price | Rates configurable in `menuData.ts` and Supabase `addons`. |
| **Birthday Paw-cake** | Live CSS/SVG cake preview with candle and custom name | 24-hour lead time enforced for baking. |
| **Multi-Pet Bowls** | One checkout with bowls grouped by pet (`Bruno's bowl`, `Misty's bowl`) | Supports guest pets and stores restrictions per bowl. |
| **Delivery & GPS** | Draggable pin / GPS reverse geocoding via free Nominatim | Free delivery over ₹300 (₹30 fee under ₹300). |
| **Pass Ticket Receipt** | Notched-edge boarding pass ticket with QR SVG | Prompts user to save bowl for 1-tap reorder. |
| **Staff Kitchen Console** | Realtime incoming list at `/staff` with audio chime | **Red restriction warning banners at the VERY TOP and VERY END** of each order card. |
| **Cancellation Rule** | Customers can cancel within 2 minutes of placement | Restricted once accepted by kitchen staff. |
| **Post-Delivery Rating** | 1-5 star rating bottom sheet | Stored in Supabase `ratings` table. |
