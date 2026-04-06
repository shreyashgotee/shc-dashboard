const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const api = (path) => `${SUPABASE_URL}/rest/v1/${path}`;
const authApi = (path) => `${SUPABASE_URL}/auth/v1/${path}`;

let session = null;

function getHeaders(prefer) {
  const token = session?.access_token || SUPABASE_KEY;
  const h = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  if (prefer) h['Prefer'] = prefer;
  return h;
}

function uid() { return session?.user?.id || null; }

// ─── SHA-256 hash for PIN ───
async function hashPin(pin) {
  const enc = new TextEncoder().encode(pin);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── AUTH ───
export const auth = {
  getSession() { return session; },
  getUserId: uid,

  async init() {
    const stored = localStorage.getItem('shc-rt');
    if (!stored) return null;
    try {
      const res = await fetch(authApi('token?grant_type=refresh_token'), {
        method: 'POST',
        headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: stored }),
      });
      if (!res.ok) { localStorage.removeItem('shc-rt'); return null; }
      const data = await res.json();
      session = data;
      localStorage.setItem('shc-rt', data.refresh_token);
      return data;
    } catch { return null; }
  },

  async login(email, password) {
    const res = await fetch(authApi('token?grant_type=password'), {
      method: 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error_description || e.msg || 'Login failed'); }
    const data = await res.json();
    session = data;
    localStorage.setItem('shc-rt', data.refresh_token);
    return data;
  },

  async signup(email, password) {
    const res = await fetch(authApi('signup'), {
      method: 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error_description || e.msg || 'Signup failed'); }
    return await res.json();
  },

  logout() { session = null; localStorage.removeItem('shc-rt'); },
};

// ─── PIN ───
export const pin = {
  async getProfile() {
    const id = uid();
    if (!id) return null;
    const res = await fetch(api(`user_profiles?id=eq.${id}&select=*`), { headers: getHeaders() });
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  },

  async setPin(newPin) {
    const id = uid();
    if (!id) throw new Error('Not logged in');
    const hash = await hashPin(newPin);
    // Try update first
    const pRes = await fetch(api(`user_profiles?id=eq.${id}`), {
      method: 'PATCH', headers: getHeaders('return=representation'),
      body: JSON.stringify({ pin_hash: hash }),
    });
    const pData = await pRes.json();
    if (Array.isArray(pData) && pData.length > 0) return pData[0];
    // Insert if no profile exists
    const iRes = await fetch(api('user_profiles'), {
      method: 'POST', headers: getHeaders('return=representation'),
      body: JSON.stringify({ id, pin_hash: hash }),
    });
    const iData = await iRes.json();
    return iData?.[0] || null;
  },

  async verify(enteredPin) {
    const profile = await this.getProfile();
    if (!profile?.pin_hash) return true; // No PIN set = allow
    const hash = await hashPin(enteredPin);
    return hash === profile.pin_hash;
  },

  async hasPin() {
    const profile = await this.getProfile();
    return !!profile?.pin_hash;
  },
};

// ─── DATABASE ───
export const db = {
  async getPlan(weekId) {
    const res = await fetch(api(`weekly_plans?week_id=eq.${weekId}&select=*`), { headers: getHeaders() });
    const data = await res.json();
    return Array.isArray(data) ? data[0] || null : null;
  },

  async getWorkoutLogs(weekId) {
    const res = await fetch(api(`workout_logs?week_id=eq.${weekId}&select=*&order=day_index`), { headers: getHeaders() });
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async upsertWorkoutLog(weekId, dayIndex, log) {
    const id = uid();
    const body = {
      week_id: weekId, day_index: dayIndex,
      exercises: log.exercises || [], cardio: log.cardio || [],
      used_micro: log.usedMicro || false, completed: log.completed || false,
      notes: log.notes || '',
    };
    if (id) body.user_id = id;
    const pRes = await fetch(api(`workout_logs?week_id=eq.${weekId}&day_index=eq.${dayIndex}`), {
      method: 'PATCH', headers: getHeaders('return=representation'), body: JSON.stringify(body),
    });
    const pData = await pRes.json();
    if (Array.isArray(pData) && pData.length > 0) return pData[0];
    const iRes = await fetch(api('workout_logs'), {
      method: 'POST', headers: getHeaders('return=representation'), body: JSON.stringify(body),
    });
    return (await iRes.json())?.[0] || null;
  },

  async upsertMealLog(weekId, dayIndex, meals) {
    const id = uid();
    const body = { week_id: weekId, day_index: dayIndex, meals };
    if (id) body.user_id = id;
    const pRes = await fetch(api(`meal_logs?week_id=eq.${weekId}&day_index=eq.${dayIndex}`), {
      method: 'PATCH', headers: getHeaders('return=representation'), body: JSON.stringify(body),
    });
    const pData = await pRes.json();
    if (Array.isArray(pData) && pData.length > 0) return pData[0];
    const iRes = await fetch(api('meal_logs'), {
      method: 'POST', headers: getHeaders('return=representation'), body: JSON.stringify(body),
    });
    return (await iRes.json())?.[0] || null;
  },

  async getMealLogs(weekId) {
    const res = await fetch(api(`meal_logs?week_id=eq.${weekId}&select=*&order=day_index`), { headers: getHeaders() });
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async getMeasurements(weekId) {
    const res = await fetch(api(`measurements?week_id=eq.${weekId}&select=*`), { headers: getHeaders() });
    const data = await res.json();
    return Array.isArray(data) ? data[0] || null : null;
  },

  async upsertMeasurements(weekId, m) {
    const id = uid();
    const body = { week_id: weekId, weight: m.weight, body_fat: m.bodyFat, waist: m.waist, chest: m.chest, arms: m.arms, measured_at: m.date || null };
    if (id) body.user_id = id;
    const pRes = await fetch(api(`measurements?week_id=eq.${weekId}`), {
      method: 'PATCH', headers: getHeaders('return=representation'), body: JSON.stringify(body),
    });
    const pData = await pRes.json();
    if (Array.isArray(pData) && pData.length > 0) return pData[0];
    const iRes = await fetch(api('measurements'), {
      method: 'POST', headers: getHeaders('return=representation'), body: JSON.stringify(body),
    });
    return (await iRes.json())?.[0] || null;
  },

  // ─── STREAK TRACKER ───
  async getStreak() {
    const id = uid();
    if (!id) return null;
    const res = await fetch(api(`streak_tracker?user_id=eq.${id}&select=*`), { headers: getHeaders() });
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  },

  async updateStreak(localDate) {
    const id = uid();
    if (!id) return null;
    let row = await this.getStreak();
    const today = localDate; // "YYYY-MM-DD" from browser

    if (!row) {
      // First ever activity
      const res = await fetch(api('streak_tracker'), {
        method: 'POST', headers: getHeaders('return=representation'),
        body: JSON.stringify({ user_id: id, current_streak: 1, longest_streak: 1, last_activity_date: today }),
      });
      return (await res.json())?.[0] || null;
    }

    const last = row.last_activity_date;
    if (last === today) return row; // Already logged today

    // Calculate days between last activity and today
    const lastDate = new Date(last + "T12:00:00");
    const todayDate = new Date(today + "T12:00:00");
    const diffDays = Math.round((todayDate - lastDate) / 86400000);

    let newStreak;
    if (diffDays === 1) {
      // Yesterday — streak continues
      newStreak = row.current_streak + 1;
    } else if (diffDays === 2 && row.last_freeze_date === last) {
      // 2 days gap but yesterday was a freeze — streak continues
      // Wait, freeze should be the gap day, not the last activity day
      // If last_activity was 2 days ago, the gap day is yesterday
      // Check if yesterday was frozen
      const yesterday = new Date(todayDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      if (row.last_freeze_date === yesterdayStr) {
        newStreak = row.current_streak + 1;
      } else {
        newStreak = 1; // Streak broke
      }
    } else {
      newStreak = 1; // Streak broke
    }

    const newLongest = Math.max(newStreak, row.longest_streak);
    const res = await fetch(api(`streak_tracker?user_id=eq.${id}`), {
      method: 'PATCH', headers: getHeaders('return=representation'),
      body: JSON.stringify({ current_streak: newStreak, longest_streak: newLongest, last_activity_date: today }),
    });
    return (await res.json())?.[0] || null;
  },

  async freezeStreak(localDate) {
    const id = uid();
    if (!id) return { error: "Not logged in" };
    let row = await this.getStreak();
    if (!row) return { error: "No streak to freeze" };

    const today = localDate;

    // Can't freeze if already logged activity today
    if (row.last_activity_date === today) return { error: "Already logged today, no need to freeze" };

    // Can't freeze consecutive days
    if (row.last_freeze_date) {
      const lastFreeze = new Date(row.last_freeze_date + "T12:00:00");
      const todayDate = new Date(today + "T12:00:00");
      const diff = Math.round((todayDate - lastFreeze) / 86400000);
      if (diff === 1) return { error: "Can't freeze consecutive days" };
    }

    const res = await fetch(api(`streak_tracker?user_id=eq.${id}`), {
      method: 'PATCH', headers: getHeaders('return=representation'),
      body: JSON.stringify({ last_freeze_date: today, freezes_used: (row.freezes_used || 0) + 1 }),
    });
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : { error: "Failed to freeze" };
  },
};
