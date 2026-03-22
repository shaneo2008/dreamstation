# DreamStation — n8n Weekly Brief Workflow Guide

**Version:** 2.0 (reaction-weighted, dynamic context, previous brief awareness)  
**Date:** March 2026  
**Importable workflow:** `n8n-workflows/weekly-brief.json`  
**SQL schema:** `supabase-weekly-briefs-schema.sql`

---

## Overview

The Weekly Brief workflow runs every Sunday at 8:00 PM UTC. For each full-programme child with at least 3 sessions that week, it generates a structured narrative brief (HIGHLIGHTS, PATTERNS, WHAT TO WATCH) using Claude, saves it to `weekly_briefs`, and sends a push notification.

The brief uses parent reaction data from `morning_reactions` to weight which observations mattered most, and includes the previous week's brief to avoid repetition.

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
- `morning_reactions` — `supabase-morning-reactions-schema.sql`
- `notification_preferences` — `supabase-notification-preferences-schema.sql`
- `weekly_briefs` — `supabase-weekly-briefs-schema.sql`

---

## Trigger

**Schedule Trigger** — `0 20 * * 0` (Sunday 8:00 PM UTC).

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

Output: array → **Split In Batches** (1 at a time).

---

### 2. Fetch Week Data (Code node)

A single Code node that fetches five things per child:

1. **This week's sessions** — `story_sessions` for past 7 days, ordered asc
2. **Morning reactions** — `morning_reactions` for past 7 days (observations, reactions, skipped status)
3. **Dynamic context** — `child_dynamic_context` (fear_flags, standing_fears, current_stressors, characters)
4. **Previous brief** — latest `weekly_briefs` for this child (brief_text, week_start)
5. **Push subscription** — `notification_preferences` for this user+child

Returns: `{ session_count, has_minimum_sessions, sessions, reactions, dynamicContext, previousBrief, pushSubscription, child, week_start }`

**Minimum threshold:** `has_minimum_sessions = sessions.length >= 3`

---

### 3. Minimum Sessions? (IF node)

- **True (≥ 3 sessions)** → Build Brief Prompt
- **False (< 3 sessions)** → Skip Child (NoOp) → loops back to Split In Batches

---

### 4. Build Brief Prompt (Code node)

**System prompt instructs Claude to:**
- Structure with exactly three labelled sections: HIGHLIGHTS, PATTERNS, WHAT TO WATCH
- Only name a pattern if 2+ nights point in the same direction; otherwise write "Nothing clear enough to name this week."
- If more playback than co-creation nights, name that explicitly in PATTERNS
- Weight observations with parent "Noticed this" reactions more heavily
- Do not repeat last week's brief content unless clear continuation
- Max 200 words total

**User prompt includes:**
- Full child profile (name, age, pronouns, personality, neuro profile, flags, interests, family)
- Dynamic context (fear landscape, stressors, allies/characters)
- Per-session data labelled PLAYBACK or CO-CREATION with all relevant fields
- Morning reaction summary showing each observation + parent reaction (✓ Noticed / ~ Not sure / ✗ Didn't see / skipped)
- Previous week's brief text (or "No previous brief — this is the first week.")

---

### 5. Call Claude

```
POST https://api.anthropic.com/v1/messages
Model: claude-3-5-haiku-20241022
Max tokens: 600
```

Returns narrative text with HIGHLIGHTS / PATTERNS / WHAT TO WATCH sections.

---

### 6. Save + Notify (Code node)

1. **Validate** — throws if Claude returns empty text
2. **Save** — POSTs to `weekly_briefs`:
   ```json
   {
     "child_id": "...",
     "user_id": "...",
     "brief_text": "HIGHLIGHTS\n...\n\nPATTERNS\n...\n\nWHAT TO WATCH\n...",
     "week_start": "2026-03-14",
     "total_nights": 5,
     "co_creation_nights": 3,
     "playback_nights": 2,
     "status": "delivered"
   }
   ```
3. **Push** — if `pushSubscription` exists, sends to Lambda:
   ```json
   {
     "subscription": { "endpoint": "...", "keys": {...} },
     "payload": {
       "title": "{name}'s weekly brief is ready ✨",
       "body": "This week's bedtime patterns — tap to read.",
       "tag": "weekly-brief",
       "data": { "type": "weekly_brief", "child_id": "..." }
     }
   }
   ```
   Push failure is non-fatal.

---

## Supabase Table: `weekly_briefs`

See `supabase-weekly-briefs-schema.sql` for full schema. Key fields:

| Field | Type | Notes |
|---|---|---|
| `brief_text` | text | Full HIGHLIGHTS / PATTERNS / WHAT TO WATCH narrative |
| `week_start` | date | Start of the 7-day window |
| `total_nights` | integer | Total sessions that week |
| `co_creation_nights` | integer | Count of co-creation sessions |
| `playback_nights` | integer | Count of playback sessions |
| `status` | text | `delivered` on creation, `read` when parent views |

---

## How Morning Reactions Feed Into the Brief

The weekly brief prompt includes the full reaction data from each morning:

- Each observation is shown with the parent's reaction: `✓ Noticed this`, `~ Not sure`, `✗ Didn't see that`
- Skipped mornings (parent didn't engage) are labelled `[SKIPPED]`
- Claude is instructed to weight "Noticed this" reactions more heavily

This creates a feedback loop: parent reactions shape what the brief focuses on.

---

## Behaviour Summary

| Condition | Behaviour |
|---|---|
| < 3 sessions this week | No brief generated; child skipped |
| Mixed week | Both night types summarised |
| More playback than co-creation | PATTERNS names it explicitly |
| All playback | PATTERNS focuses on return behaviour |
| All co-creation | Standard story content + theme patterns |
| No genuine pattern | PATTERNS says "Nothing clear enough to name this week." |
| Parent reactions present | Weighted into brief priorities |
| Previous brief exists | Claude avoids repeating it unless continuation |

---

## QA Checklist

- [ ] Workflow fires Sundays at 8pm
- [ ] Skips children with `mode = 'just_stories'`
- [ ] Skips children with < 3 sessions that week
- [ ] Session data labels each night as PLAYBACK or CO-CREATION
- [ ] Playback lines include `source_story_title` and `playback_count_14d`
- [ ] Co-creation lines include `story_prompt` and `themes`
- [ ] Morning reactions included with parent engagement labels
- [ ] Previous brief included to prevent repetition
- [ ] Dynamic context (fears, stressors, allies) in prompt
- [ ] Weeks with more playback than co-creation named in PATTERNS
- [ ] `weekly_briefs` record saves with correct session counts and `status: delivered`
- [ ] Push notification delivers; fails silently
