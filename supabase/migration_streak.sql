-- ═══════════════════════════════════════════════
-- SHC Streak Tracker Migration
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════

-- 1. Create streak tracker table
CREATE TABLE IF NOT EXISTS streak_tracker (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  last_freeze_date DATE,
  freezes_used INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE streak_tracker ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_read" ON streak_tracker FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_insert" ON streak_tracker FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_update" ON streak_tracker FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. Backfill: Calculate streak from existing workout_logs
-- This walks backwards from today and counts consecutive days with completed exercises
-- Replace YOUR-UUID with your user id

-- First, insert the row:
-- INSERT INTO streak_tracker (user_id, current_streak, longest_streak) VALUES ('YOUR-UUID', 0, 0);

-- Then run this to see which dates have completed workouts:
-- SELECT DISTINCT
--   (DATE(wp.week_id::date + wl.day_index * INTERVAL '1 day')) as workout_date,
--   wl.completed,
--   wl.used_micro,
--   jsonb_array_length(wl.exercises) as num_exercises
-- FROM workout_logs wl
-- JOIN weekly_plans wp ON wl.week_id = wp.week_id
-- WHERE wl.user_id = 'YOUR-UUID'
-- ORDER BY workout_date DESC;

-- After reviewing, manually set your streak based on the dates:
-- UPDATE streak_tracker SET current_streak = X, longest_streak = X, last_activity_date = 'YYYY-MM-DD' WHERE user_id = 'YOUR-UUID';
