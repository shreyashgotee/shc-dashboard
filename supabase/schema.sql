-- SHC Database Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Weekly plans (Ishaan writes, dashboard reads)
CREATE TABLE weekly_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_id TEXT NOT NULL UNIQUE, -- format: 2026-03-29 (Sunday date)
  workout_plan JSONB NOT NULL,
  meal_plan JSONB NOT NULL,
  week_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Daily workout logs (dashboard writes, Ishaan reads)
CREATE TABLE workout_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_id TEXT NOT NULL,
  day_index INTEGER NOT NULL, -- 0=Sun, 1=Mon, ...
  exercises JSONB NOT NULL DEFAULT '[]',
  cardio JSONB NOT NULL DEFAULT '[]',
  used_micro BOOLEAN DEFAULT false,
  completed BOOLEAN DEFAULT false,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(week_id, day_index)
);

-- Daily meal logs (dashboard writes, Ishaan reads)
CREATE TABLE meal_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_id TEXT NOT NULL,
  day_index INTEGER NOT NULL,
  meals JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(week_id, day_index)
);

-- Body measurements
CREATE TABLE measurements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_id TEXT NOT NULL,
  weight TEXT DEFAULT '',
  body_fat TEXT DEFAULT '',
  waist TEXT DEFAULT '',
  chest TEXT DEFAULT '',
  arms TEXT DEFAULT '',
  measured_at DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(week_id)
);

-- Enable Row Level Security but allow all access via anon key
-- (This is a single-user app, no auth needed)
ALTER TABLE weekly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON weekly_plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON workout_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON meal_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON measurements FOR ALL USING (true) WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER weekly_plans_updated BEFORE UPDATE ON weekly_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER workout_logs_updated BEFORE UPDATE ON workout_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER meal_logs_updated BEFORE UPDATE ON meal_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER measurements_updated BEFORE UPDATE ON measurements FOR EACH ROW EXECUTE FUNCTION update_updated_at();
