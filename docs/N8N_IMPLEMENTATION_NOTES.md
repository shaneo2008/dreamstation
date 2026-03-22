# DreamStation — Morning Reflection Workflow: Implementation Notes
**Date:** March 2026  
**Status:** Workflow validated with seed data. Awaiting frontend session record integration.

---

## What Was Built

An n8n workflow that fires daily at 7am UTC, fetches all Full Programme children, checks for a story session from the previous night, generates three Claude-powered observations, saves them to Supabase, and sends a push notification to the parent.

---

## Fixes & Decisions Made During Implementation

### 1. Cron Schedule
Changed from 1-minute polling (which burned an entire month of n8n executions overnight) to a single daily cron:
```
0 7 * * *
```
Fires once at 7am UTC. User-configurable notification timing is deferred to post-trial.

### 2. n8n Variables vs Credentials
n8n Cloud stores credentials and variables separately. `$env.VARIABLE` does not work in n8n Cloud — use `$vars.VARIABLE` for variables set in the Variables tab. However, HTTP Request nodes using "Predefined Credential Type → Supabase API" only send the `Authorization: Bearer` header, not the `apikey` header that Supabase requires. Solution: set Authentication to None on all Supabase HTTP Request nodes and pass both headers manually:
- `apikey`: service role key
- `Authorization`: Bearer + service role key

### 3. SUPABASE_URL in HTTP Request nodes
`$vars.SUPABASE_URL` in the URL field of HTTP Request nodes shows as "not accessible via UI" and evaluates as undefined at runtime. Fix: hardcode the Supabase project URL directly in all HTTP Request node URL fields.

### 4. fetch is not defined
n8n Code nodes do not have access to the browser `fetch` API. All HTTP calls inside Code nodes must use:
```javascript
await this.helpers.httpRequest({
  method: 'GET',
  url: '...',
  headers: { ... }
});
```
Not `fetch()`. Any Code node using a custom `httpRequest` helper built on `fetch` will fail with `ReferenceError: fetch is not defined`.

### 5. AWS Lambda Auth
The web-push-sender Lambda was set to `AWS_IAM` auth, blocking calls from n8n. Changed to `NONE` for the trial. CORS left unchecked (server-to-server calls, not browser calls).

### 6. Code Node Return Format
n8n Code nodes have two modes with different return requirements:

**Run Once for All Items:**
```javascript
return [{ json: { key: value } }];
```

**Run Once for Each Item:**
```javascript
return { key: value };  // plain object, no array, no json wrapper
```

Mixing these formats causes: `A 'json' property isn't an object`.

All Code nodes in this workflow are set to **Run Once for Each Item** and return plain objects.

### 7. IF Node Removed
The Session Found? IF node was unreliable — both true and false items were routing to the false branch due to boolean comparison issues in n8n Cloud. Replaced with:
- Early return in Fetch Session Data when no session found: `return { session_found: false, child };` 
- Guard at top of Build Claude Prompt:
```javascript
if (!$input.item.json.session_found) {
  return { skipped: true };
}
```
- "Continue on Error" enabled on Call Claude and Parse Save Notify nodes to handle the skipped item flowing through without crashing the workflow.

### 8. Date Window (UTC)
Original date window used local time which caused off-by-one errors. Fixed to use UTC consistently:
```javascript
const now = new Date();
const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
const yesterdayUTC = new Date(todayUTC.getTime() - 86400000);
```

### 9. Claude Model String
Correct model string for Anthropic API:
```
claude-sonnet-4-20250514
```
Not `claude-sonnet-4-6-20250514` (incorrect) or `claude-3-5-haiku-20241022` (wrong model).

### 10. morning_reactions Table — night_type Column
The `morning_reactions` table was missing a `night_type` column. Added via:
```sql
ALTER TABLE public.morning_reactions 
ADD COLUMN night_type text CHECK (night_type IN ('co_creation', 'playback'));
```
Required so the weekly brief can distinguish what kind of night each observation came from.

### 11. Code Node Mode — Build Claude Prompt
Build Claude Prompt was set to "Run Once for All Items" which caused it to process only one item and pick up the wrong child. Changed to "Run Once for Each Item".

---

## Validated Workflow Output

With seed data for Kate (child_id: 4c876540), a playback night session, 5 nights of history, and dynamic context including fear flags and current stressors, Claude returned:

```json
{
  "observations": [
    {
      "type": "THEME",
      "text": "Kate's been drawn to stories about characters who are scared of the dark and need help, which might connect to her own nighttime worries about being alone."
    },
    {
      "type": "PATTERN", 
      "text": "She keeps returning to the brave knight story, especially after creating stories about helping scared characters — it seems to offer her something steady during all these new school changes."
    },
    {
      "type": "LANGUAGE",
      "text": "Her choice to have the knight 'go back to find the star a friend' suggests she's thinking about loneliness and connection in a way worth gently exploring."
    }
  ]
}
```

Observations saved to `morning_reactions` table. Push notification fired successfully.

---

## What Still Needs to Be Done

### Frontend — Session Record on Story Creation (Phase 3)
When `sendToN8N` resolves successfully in the SEED phase, insert a `story_sessions` record:
```json
{
  "child_id": "<from AuthContext>",
  "user_id": "<from AuthContext>",
  "night_type": "co_creation",
  "is_comfort_story": false,
  "story_prompt": "<from seedInput>",
  "themes": "<populated post-generation>",
  "villain_appeared": "<populated post-generation>",
  "parent_note": "<from optional parent note field>"
}
```

### Frontend — Session Record on Playback (Phase 4)
When a parent initiates playback from the Library, insert a `story_sessions` record before audio begins:
```json
{
  "child_id": "<from AuthContext>",
  "user_id": "<from AuthContext>",
  "night_type": "playback",
  "is_comfort_story": true,
  "source_story_id": "<id of story being played>",
  "source_story_title": "<title of story being played>",
  "playback_count_14d": "<queried before insert>",
  "parent_note": "<from optional parent note field on playback screen>"
}
```

Until these two session inserts are wired up, the morning reflection workflow will find no sessions for real nightly usage and will not fire observations.

---

## Workflow Node Summary

| Node | Type | Mode | Notes |
|------|------|------|-------|
| 7am Daily | Schedule Trigger | — | Cron: `0 7 * * *` |
| Get Active Children | HTTP Request | — | Fetches `full_programme` + `onboarding_completed = true` |
| For Each Child | Split in Batches | — | Batch size 1 |
| Fetch Session Data | Code | Run Once for Each Item | Returns plain object. Early exit if no session. |
| Build Claude Prompt | Code | Run Once for Each Item | Guard at top for skipped items. Returns plain object. |
| Call Claude | HTTP Request | — | Model: `claude-sonnet-4-20250514`. Continue on Error: on. |
| Parse Save Notify | Code | Run Once for Each Item | Saves to morning_reactions, fires push. Continue on Error: on. |

---

## n8n Cloud Compatibility Rules (Apply to ALL workflows)

1. **No `$env`** — use `$vars` for n8n Cloud variables
2. **No `$vars` in Code nodes** — only works in HTTP Request expression fields
3. **No `fetch()`** — use `this.helpers.httpRequest()` in Code nodes
4. **Hardcode SUPABASE_URL** — `$vars.SUPABASE_URL` evaluates as undefined
5. **Hardcode service key in Code nodes** — `$vars` not accessible there
6. **Manual auth headers on Supabase HTTP Request nodes** — set Authentication: None, add apikey + Authorization headers manually
7. **Code nodes: Run Once for Each Item** — return plain objects, not `[{ json: {...} }]`
8. **No IF nodes for boolean routing** — use early return + guard + Continue on Error
9. **UTC dates explicitly** — use `Date.UTC()` to avoid timezone issues
10. **Claude model: `claude-sonnet-4-20250514`**

*Implementation notes for DreamStation Morning Reflection workflow — March 2026*
