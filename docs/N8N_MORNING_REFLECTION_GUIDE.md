# DreamStation — n8n Morning Reflection Workflow Guide

**Version:** 2.0 (structured observations, history context, dynamic child context)  
**Date:** March 2026  
**Importable workflow:** `n8n-workflows/morning-reflection.json`  
**SQL schema:** `supabase-morning-reactions-schema.sql`

---

## Overview

The Morning Reflection workflow runs at 7:00 AM UTC daily. For each full-programme child with a session the previous night, it generates **three structured observations** (THEME, PATTERN, LANGUAGE) using Claude, saves them to `morning_reactions`, and sends a push notification.

The parent later reacts to each observation ("Noticed this" / "Not sure" / "Didn't see that"), and these reactions feed into the Weekly Brief.

---

## Required Environment Variables

| Variable | Description |
|---|---|
| `SUPABASE_URL` | e.g. `https://xyz.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Service role key (bypasses RLS) |
| `ANTHROPIC_API_KEY` | Claude API key |
| `PUSH_LAMBDA_URL` | Web-push Lambda endpoint |

---

## Required Tables

- `child_profiles` — `supabase-child-profiles-schema.sql`
- `story_sessions` — `supabase-story-sessions-schema.sql`
- `child_dynamic_context` — `supabase-child-dynamic-context-schema.sql`
- `notification_preferences` — `supabase-notification-preferences-schema.sql`
- `morning_reactions` — `supabase-morning-reactions-schema.sql`

---

## Trigger

**Schedule Trigger** — `0 7 * * *` (7:00 AM UTC daily).

---

## Workflow Nodes

### 1. Get Active Children

```
GET /rest/v1/child_profiles
?mode=eq.full_programme
&onboarding_completed=eq.true
&select=id,user_id,name,age,gender_pronoun,personality_description,
        neuro_profile,neuro_flags,interests,family_structure,parent_context
```

Output: array of child objects → **Split In Batches** (1 at a time).

---

### 2. Fetch Session Data (Code node)

A single Code node that fetches four things per child:

1. **Last night's session** — `story_sessions` for this child, yesterday's date range, limit 1
2. **6-night history** — previous `story_sessions` before yesterday, limit 6, reversed to oldest-first
3. **Dynamic context** — `child_dynamic_context` for this child (fear_flags, standing_fears, current_stressors, characters)
4. **Push subscription** — `notification_preferences` for this user+child

Returns a single item: `{ session_found, lastSession, history, dynamicContext, pushSubscription, child }`

If no session found → returns `{ session_found: false, child }` and the IF node routes to the skip branch.

---

### 3. Session Found? (IF node)

- **True** → Build Claude Prompt
- **False** → No Session (NoOp) → loops back to Split In Batches

---

### 4. Build Claude Prompt (Code node)

Constructs the prompt with three observation types:

**System prompt instructs Claude to:**
- Generate exactly 3 observations: THEME, PATTERN (only if 4+ nights history), LANGUAGE
- Quality gate: "Would the parent have noticed this without the app? If yes, replace it."
- Return valid JSON only: `{ observations: [{ type, text }] }`
- Playback night rule: reflect on the return, not story content

**User prompt includes:**
- Full child profile (name, age, pronouns, personality, neuro profile, flags, interests, family)
- Dynamic context (fear flags, standing fears, stressors, allies/characters)
- Last night's session details (branches on co_creation vs playback)
- 6-night history timeline

---

### 5. Call Claude

```
POST https://api.anthropic.com/v1/messages
Model: claude-3-5-haiku-20241022
Max tokens: 600
```

Returns JSON: `{ observations: [{ type: "THEME", text: "..." }, ...] }`

---

### 6. Parse, Save, Notify (Code node)

1. **Parse** — strips markdown fences, parses JSON, validates exactly 3 observations
2. **Save** — POSTs to `morning_reactions`:
   ```json
   {
     "child_id": "...",
     "user_id": "...",
     "session_id": "...",
     "night_type": "co_creation|playback",
     "observations": [{ "type": "THEME", "text": "..." }, ...],
     "reactions": [],
     "skipped": false,
     "generated_at": "2026-03-20T07:00:00Z"
   }
   ```
3. **Push** — if `pushSubscription` exists, sends to Lambda:
   ```json
   {
     "subscription": { "endpoint": "...", "keys": {...} },
     "payload": {
       "title": "DreamStation ✨",
       "body": "Context-aware message based on night type",
       "tag": "morning-reflection",
       "data": { "type": "morning_reflection", "session_id": "..." }
     }
   }
   ```
   Push failure is non-fatal (caught silently).

**Notification body varies by night:**
- Playback: *"{name} chose a comfort story last night — we noticed something worth seeing."*
- Co-creation with prompt: *"{name} wanted "{prompt}" — we noticed something. Tap to see."*
- Co-creation without prompt: *"Three things worth noticing from {name}'s night. Tap to see."*

---

## Supabase Table: `morning_reactions`

See `supabase-morning-reactions-schema.sql` for full schema. Key fields:

| Field | Type | Notes |
|---|---|---|
| `observations` | jsonb | Array of `{ type, text }` — 3 items |
| `reactions` | jsonb | Parallel array — parent fills in later |
| `skipped` | boolean | Set by midday skip check |
| `generated_at` | timestamptz | When AI generated the observations |

---

## Midday Skip Check

A separate lightweight workflow runs at **12:00 PM** to mark unengaged morning reactions as skipped:

```
PATCH /rest/v1/morning_reactions
?skipped=eq.false
&reactions=eq.[]
&generated_at=lt.{{ $today_noon }}
Body: { "skipped": true }
```

---

## Parent Reaction Flow (Frontend — not yet built)

When the parent opens the app after a morning reflection:

1. Fetch latest `morning_reactions` where `skipped = false` and `reactions = []`
2. Display each observation with three buttons: "Noticed this" / "Not sure" / "Didn't see that"
3. PATCH `morning_reactions` with the completed `reactions` array: `["noticed", "unsure", "didnt_see"]`
4. These reactions feed into the Weekly Brief prompt as weighted context

---

## Behaviour Summary

| Night type | Session created | Observation focus |
|---|---|---|
| `co_creation` | Yes, at SEED submit | Story content, child's prompt words, themes, language choices |
| `playback` | Yes, at Play Tonight | The return itself; repetition count; comfort-seeking signal |
| No session | No | Workflow skips silently |

---

## QA Checklist

- [ ] Workflow fires at 7:00 AM
- [ ] Skips children with `mode = 'just_stories'`
- [ ] Skips nights with no session
- [ ] Generates exactly 3 observations per session
- [ ] PATTERN type only appears when 4+ nights of history exist
- [ ] Playback observations reflect on the return, not story content
- [ ] Co-creation observations reference prompt, themes, and language
- [ ] Dynamic context (fears, stressors, allies) is included in prompt
- [ ] `morning_reactions` record saves with `observations` jsonb array
- [ ] Push notification delivers with context-aware body; fails silently
- [ ] Midday skip check marks unengaged reactions as `skipped`
