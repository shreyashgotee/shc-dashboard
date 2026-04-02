-- ═══════════════════════════════════════════════
-- SHC Full Security Migration
-- Run this ONCE in Supabase SQL Editor
-- ═══════════════════════════════════════════════

-- 1. User profile table (stores PIN hash)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pin_hash TEXT,
  display_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 2. Add user_id to all data tables
ALTER TABLE weekly_plans ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE meal_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE measurements ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 3. Drop old permissive policies
DROP POLICY IF EXISTS "Allow all" ON weekly_plans;
DROP POLICY IF EXISTS "Allow all" ON workout_logs;
DROP POLICY IF EXISTS "Allow all" ON meal_logs;
DROP POLICY IF EXISTS "Allow all" ON measurements;

-- 4. User-scoped policies
CREATE POLICY "own_read" ON weekly_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_insert" ON weekly_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_update" ON weekly_plans FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_delete" ON weekly_plans FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "own_read" ON workout_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_insert" ON workout_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_update" ON workout_logs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_delete" ON workout_logs FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "own_read" ON meal_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_insert" ON meal_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_update" ON meal_logs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_delete" ON meal_logs FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "own_read" ON measurements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_insert" ON measurements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_update" ON measurements FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_delete" ON measurements FOR DELETE USING (auth.uid() = user_id);

-- 5. AFTER signup, backfill your existing data:
-- Replace YOUR-UUID with your auth user id from Supabase > Authentication > Users
--
-- INSERT INTO user_profiles (id) VALUES ('YOUR-UUID');
-- UPDATE weekly_plans SET user_id = 'YOUR-UUID' WHERE user_id IS NULL;
-- UPDATE workout_logs SET user_id = 'YOUR-UUID' WHERE user_id IS NULL;
-- UPDATE meal_logs SET user_id = 'YOUR-UUID' WHERE user_id IS NULL;
-- UPDATE measurements SET user_id = 'YOUR-UUID' WHERE user_id IS NULL;
