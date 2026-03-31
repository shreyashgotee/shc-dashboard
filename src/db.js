const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

const api = (path) => `${SUPABASE_URL}/rest/v1/${path}`;

export const db = {
  // ─── WEEKLY PLAN ───
  async getPlan(weekId) {
    const res = await fetch(api(`weekly_plans?week_id=eq.${weekId}&select=*`), { headers });
    const data = await res.json();
    return data?.[0] || null;
  },

  async upsertPlan(weekId, workoutPlan, mealPlan, weekNotes = '') {
    const res = await fetch(api('weekly_plans'), {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=representation,resolution=merge-duplicates' },
      body: JSON.stringify({ week_id: weekId, workout_plan: workoutPlan, meal_plan: mealPlan, week_notes: weekNotes }),
    });
    const data = await res.json();
    return data?.[0] || null;
  },

  // ─── WORKOUT LOGS ───
  async getWorkoutLogs(weekId) {
    const res = await fetch(api(`workout_logs?week_id=eq.${weekId}&select=*&order=day_index`), { headers });
    return await res.json();
  },

  async upsertWorkoutLog(weekId, dayIndex, log) {
    const res = await fetch(api('workout_logs'), {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=representation,resolution=merge-duplicates' },
      body: JSON.stringify({ week_id: weekId, day_index: dayIndex, ...log }),
    });
    const data = await res.json();
    return data?.[0] || null;
  },

  // ─── MEAL LOGS ───
  async getMealLogs(weekId) {
    const res = await fetch(api(`meal_logs?week_id=eq.${weekId}&select=*&order=day_index`), { headers });
    return await res.json();
  },

  async upsertMealLog(weekId, dayIndex, meals) {
    const res = await fetch(api('meal_logs'), {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=representation,resolution=merge-duplicates' },
      body: JSON.stringify({ week_id: weekId, day_index: dayIndex, meals }),
    });
    const data = await res.json();
    return data?.[0] || null;
  },

  // ─── MEASUREMENTS ───
  async getMeasurements(weekId) {
    const res = await fetch(api(`measurements?week_id=eq.${weekId}&select=*`), { headers });
    const data = await res.json();
    return data?.[0] || null;
  },

  async upsertMeasurements(weekId, m) {
    const res = await fetch(api('measurements'), {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=representation,resolution=merge-duplicates' },
      body: JSON.stringify({ week_id: weekId, weight: m.weight, body_fat: m.bodyFat, waist: m.waist, chest: m.chest, arms: m.arms, measured_at: m.date || null }),
    });
    const data = await res.json();
    return data?.[0] || null;
  },
};
