# SHC Database Skill for Ishaan

## Overview
You (Ishaan) can read and write to Shreyash's fitness dashboard database using the Supabase REST API.

## Connection Details
- **URL**: `https://kmigshxrkeztrgxtabjv.supabase.co/rest/v1/`
- **API Key**: `{SERVICE_ROLE_KEY}` ← Use the SERVICE ROLE key, not anon key (bypasses RLS)
- **User ID**: `{SHREYASH_USER_UUID}` ← Always include this as `user_id` in every write
- **Headers** (required on every request):
  ```
  apikey: {SERVICE_ROLE_KEY}
  Authorization: Bearer {SERVICE_ROLE_KEY}
  Content-Type: application/json
  ```

## CRITICAL: Week Format (Monday-start)
- **week_id** = the MONDAY date of the week, format `YYYY-MM-DD`
- **day_index**: 0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday, 5=Saturday, 6=Sunday
- **Plan arrays**: workout_plan and meal_plan are arrays of 7 objects in order [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
- **Always include `user_id`** in every POST/PATCH body

## Tables

### `weekly_plans` — You write, dashboard reads
| Column | Type | Description |
|--------|------|-------------|
| week_id | TEXT (unique) | **Monday** date, format `2026-04-06` |
| workout_plan | JSONB | Array of 7 day objects [Mon→Sun] |
| meal_plan | JSONB | Array of 7 day objects [Mon→Sun] |
| week_notes | TEXT | Coach notes for the week |
| user_id | UUID | Must be Shreyash's user_id |

### `workout_logs` — Dashboard writes, you read
| Column | Type | Description |
|--------|------|-------------|
| week_id | TEXT | Monday date |
| day_index | INTEGER | 0=Mon, 1=Tue, ..., 6=Sun |
| exercises | JSONB | Array of exercise logs |
| cardio | JSONB | Array of cardio logs |
| used_micro | BOOLEAN | Streak saver used? |
| completed | BOOLEAN | Any activity done? |
| notes | TEXT | User's notes |
| user_id | UUID | Shreyash's user_id |

### `meal_logs` — Dashboard writes, you read
| Column | Type | Description |
|--------|------|-------------|
| week_id | TEXT | Monday date |
| day_index | INTEGER | 0=Mon, ..., 6=Sun |
| meals | JSONB | Array of 3 meal objects |
| user_id | UUID | Shreyash's user_id |

### `measurements` — Dashboard writes, you read
| Column | Type | Description |
|--------|------|-------------|
| week_id | TEXT | Monday date |
| weight, body_fat, waist, chest, arms | TEXT | Measurements |
| measured_at | DATE | When measured |
| user_id | UUID | Shreyash's user_id |

## Writing a Weekly Plan

Use `web_fetch` to POST:

```
POST https://kmigshxrkeztrgxtabjv.supabase.co/rest/v1/weekly_plans
Headers:
  apikey: {SERVICE_ROLE_KEY}
  Authorization: Bearer {SERVICE_ROLE_KEY}
  Content-Type: application/json
  Prefer: return=representation,resolution=merge-duplicates

Body:
{
  "week_id": "2026-04-06",
  "user_id": "{SHREYASH_USER_UUID}",
  "workout_plan": [
    {"day": "Monday", "focus": "Upper Body Push", "exercises": [...], "cardio": [...], "microOption": "...", "notes": "..."},
    {"day": "Tuesday", ...},
    {"day": "Wednesday", ...},
    {"day": "Thursday", ...},
    {"day": "Friday", ...},
    {"day": "Saturday", ...},
    {"day": "Sunday", ...}
  ],
  "meal_plan": [
    {"day": "Monday", "meals": [{"slot": "Breakfast (8am)", "planned": "..."}, {"slot": "Lunch (12pm)", "planned": "..."}, {"slot": "Snack (4pm)", "planned": "..."}]},
    {"day": "Tuesday", ...},
    ...
  ],
  "week_notes": "Week 3: ..."
}
```

## Reading User Feedback

**Get workout logs for a week:**
```
GET https://kmigshxrkeztrgxtabjv.supabase.co/rest/v1/workout_logs?week_id=eq.2026-03-30&select=*&order=day_index
```

**Get meal logs for a week:**
```
GET https://kmigshxrkeztrgxtabjv.supabase.co/rest/v1/meal_logs?week_id=eq.2026-03-30&select=*&order=day_index
```

**Get measurements:**
```
GET https://kmigshxrkeztrgxtabjv.supabase.co/rest/v1/measurements?week_id=eq.2026-03-30&select=*
```

## Weekly Workflow

1. **Sunday evening**: Read current week's logs → analyze adherence → generate next week's plan
2. **POST** the new plan with next Monday's date as week_id
3. User opens dashboard Monday morning → new plan appears
4. During week: user logs workouts/meals on dashboard
5. Next Sunday: repeat
