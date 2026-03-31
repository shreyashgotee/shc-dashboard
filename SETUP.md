# SHC Dashboard — Setup Guide

## What you're setting up
- A fitness dashboard at `your-name.vercel.app`
- Backed by a free Supabase database
- Ishaan reads/writes plans, you track on the dashboard
- Works on phone, tablet, laptop — bookmark it

## Time: ~15 minutes

---

## Step 1: Create Supabase Project (2 min)

1. Go to [supabase.com](https://supabase.com) → Sign in with GitHub
2. Click **New Project**
3. Name: `shc-dashboard`
4. Set a database password (save it somewhere)
5. Region: pick closest to you (West US)
6. Click **Create new project** — wait ~1 min

## Step 2: Create Database Tables (2 min)

1. In Supabase dashboard → **SQL Editor** (left sidebar)
2. Click **New Query**
3. Paste the ENTIRE contents of `supabase/schema.sql` from this project
4. Click **Run** — you should see "Success. No rows returned"

## Step 3: Get Your API Keys (1 min)

1. In Supabase → **Settings** (gear icon) → **API**
2. Copy these two values:
   - **Project URL** (looks like `https://abcdef123.supabase.co`)
   - **anon public** key (the long string under "Project API keys")

## Step 4: Set Up the Code (3 min)

1. Clone/download this project to your computer
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Edit `.env` and paste your Supabase values:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Test locally:
   ```bash
   npm run dev
   ```
6. Open `http://localhost:5173` — you should see the SHC dashboard
   (It'll say "No plan for this week yet" — that's correct!)

## Step 5: Push to GitHub (2 min)

```bash
git init
git add .
git commit -m "SHC Dashboard"
git remote add origin https://github.com/YOUR-USERNAME/shc-dashboard.git
git push -u origin main
```

## Step 6: Deploy to Vercel (3 min)

1. Go to [vercel.com](https://vercel.com) → Sign in with GitHub
2. Click **Add New** → **Project**
3. Import your `shc-dashboard` repo
4. Before clicking Deploy, add **Environment Variables**:
   - `VITE_SUPABASE_URL` → your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` → your Supabase anon key
5. Click **Deploy** — wait ~1 min
6. Your dashboard is live at `shc-dashboard.vercel.app`!

## Step 7: Bookmark It

- On your phone: open the URL → Share → Add to Home Screen
- On your tablet: same — it'll feel like a native app
- On your laptop: just bookmark it

---

## How Ishaan Connects

1. Share the `ISHAAN_SKILL.md` file with your Ishaan chat as project knowledge
2. Also give Ishaan your Supabase URL and anon key
3. Ishaan can then read your logs and write weekly plans using `web_fetch`

## Weekly Workflow

1. **You**: "Ishaan, plan my week" → Ishaan reads last week's data, generates a new plan, writes it to DB
2. **Dashboard**: Refresh → new plan appears
3. **You**: Track workouts and meals throughout the week
4. **Repeat every Sunday**
