# SHC Database Skill for Ishaan

## Overview
You (Ishaan) can read and write to Shreyash's fitness dashboard database using the Supabase REST API.

## Connection Details
- **URL**: `{SUPABASE_URL}/rest/v1/`
- **API Key**: `{SUPABASE_ANON_KEY}`
- **Headers** (required on every request):
  ```
  apikey: {SUPABASE_ANON_KEY}
  Authorization: Bearer {SUPABASE_ANON_KEY}
  Content-Type: application/json
  ```

## Tables

### `weekly_plans` — You write, dashboard reads
| Column | Type | Description |
|--------|------|-------------|
| week_id | TEXT (unique) | Sunday date, format `2026-03-29` |
| workout_plan | JSONB | Array of 7 day objects |
| meal_plan | JSONB | Array of 7 day objects |
| week_notes | TEXT | Coach notes for the week |

### `workout_logs` — Dashboard writes, you read
| Column | Type | Description |
|--------|------|-------------|
| week_id | TEXT | Sunday date |
| day_index | INTEGER | 0=Sun, 1=Mon, ..., 6=Sat |
| exercises | JSONB | Array of exercise logs with sets/reps/weight |
| cardio | JSONB | Array of cardio logs |
| used_micro | BOOLEAN | Did they use the streak saver? |
| completed | BOOLEAN | Day marked complete? |
| notes | TEXT | User's notes for the day |

### `meal_logs` — Dashboard writes, you read
| Column | Type | Description |
|--------|------|-------------|
| week_id | TEXT | Sunday date |
| day_index | INTEGER | 0=Sun, ..., 6=Sat |
| meals | JSONB | Array of 3 meal objects with confirmed/actual/notes |

### `measurements` — Dashboard writes, you read
| Column | Type | Description |
|--------|------|-------------|
| week_id | TEXT | Sunday date |
| weight, body_fat, waist, chest, arms | TEXT | Measurements |
| measured_at | DATE | When measured |

## Writing a Weekly Plan

Use `web_fetch` to POST to Supabase:

```
POST {SUPABASE_URL}/rest/v1/weekly_plans
Headers:
  apikey: {KEY}
  Authorization: Bearer {KEY}
  Content-Type: application/json
  Prefer: return=representation,resolution=merge-duplicates

Body:
{
  "week_id": "2026-03-29",
  "workout_plan": [
    {
      "day": "Sunday",
      "focus": "Active Recovery + Mobility",
      "exercises": [
        {"name": "Cat-Cow Stretch", "targetSets": "2", "targetReps": "10", "rpe": "3"}
      ],
      "cardio": [{"type": "Walk", "duration": "20", "distance": ""}],
      "microOption": "5 min Surya Namaskar (3 slow rounds)",
      "notes": "Ease into the week."
    },
    ... // 7 days total (Sun-Sat)
  ],
  "meal_plan": [
    {
      "day": "Sunday",
      "meals": [
        {"slot": "Breakfast (8am)", "planned": "Besan chilla (2) + mint chutney + 2 boiled eggs"},
        {"slot": "Lunch (12pm)", "planned": "Jeera rice + dal tadka + aloo gobi + dahi"},
        {"slot": "Snack (4pm)", "planned": "Roasted makhana (1 cup) + black coffee"}
      ]
    },
    ... // 7 days total
  ],
  "week_notes": "Week 1: Re-entry week."
}
```

## Reading User Feedback (for weekly calibration)

**Get workout logs for a week:**
```
GET {SUPABASE_URL}/rest/v1/workout_logs?week_id=eq.2026-03-29&select=*&order=day_index
```

**Get meal logs for a week:**
```
GET {SUPABASE_URL}/rest/v1/meal_logs?week_id=eq.2026-03-29&select=*&order=day_index
```

**Get measurements:**
```
GET {SUPABASE_URL}/rest/v1/measurements?week_id=eq.2026-03-29&select=*
```

## Weekly Workflow

1. **Sunday**: Read last week's logs → analyze → generate new plan → POST to weekly_plans
2. **During week**: User logs workouts/meals on dashboard
3. **Next Sunday**: Repeat — read logs, calibrate, write new plan
