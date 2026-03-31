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
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async upsertWorkoutLog(weekId, dayIndex, log) {
    const body = {
      week_id: weekId,
      day_index: dayIndex,
      exercises: log.exercises || [],
      cardio: log.cardio || [],
      used_micro: log.usedMicro || false,
      completed: log.completed || false,
      notes: log.notes || '',
    };
    // Try PATCH first (update existing)
    const patchRes = await fetch(api(`workout_logs?week_id=eq.${weekId}&day_index=eq.${dayIndex}`), {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify(body),
    });
    const patchData = await patchRes.json();
    if (Array.isArray(patchData) && patchData.length > 0) return patchData[0];
    // No existing row — POST new
    const postRes = await fetch(api('workout_logs'), {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify(body),
    });
    const postData = await postRes.json();
    return postData?.[0] || null;
  },

  // ─── MEAL LOGS ───
  async getMealLogs(weekId) {
    const res = await fetch(api(`meal_logs?week_id=eq.${weekId}&select=*&order=day_index`), { headers });
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async upsertMealLog(weekId, dayIndex, meals) {
    const body = { week_id: weekId, day_index: dayIndex, meals };
    const patchRes = await fetch(api(`meal_logs?week_id=eq.${weekId}&day_index=eq.${dayIndex}`), {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify(body),
    });
    const patchData = await patchRes.json();
    if (Array.isArray(patchData) && patchData.length > 0) return patchData[0];
    const postRes = await fetch(api('meal_logs'), {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify(body),
    });
    const postData = await postRes.json();
    return postData?.[0] || null;
  },

  // ─── MEASUREMENTS ───
  async getMeasurements(weekId) {
    const res = await fetch(api(`measurements?week_id=eq.${weekId}&select=*`), { headers });
    const data = await res.json();
    return data?.[0] || null;
  },

  async upsertMeasurements(weekId, m) {
    const body = { week_id: weekId, weight: m.weight, body_fat: m.bodyFat, waist: m.waist, chest: m.chest, arms: m.arms, measured_at: m.date || null };
    const patchRes = await fetch(api(`measurements?week_id=eq.${weekId}`), {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify(body),
    });
    const patchData = await patchRes.json();
    if (Array.isArray(patchData) && patchData.length > 0) return patchData[0];
    const postRes = await fetch(api('measurements'), {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify(body),
    });
    const postData = await postRes.json();
    return postData?.[0] || null;
  },
};
