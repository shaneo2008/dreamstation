# n8n Weekly Brief Workflow Guide

## Overview

A scheduled workflow that generates a weekly brief via Claude API, summarising the week's story sessions and morning reactions into a 3-section parent-facing reflection.

**Trigger:** Schedule node — runs Sundays at 9:00 AM via cron: `0 9 * * 0`
**AI:** Claude API (`claude-sonnet-4-6`)
**Output:** `weekly_briefs` record with summary, patterns (nullable), week_ahead
**Minimum data:** 3 story sessions required — fewer than 3 skips generation

---

## Workflow: "DreamStation Weekly Brief"

### Node 1: Schedule Trigger
- **Type:** Schedule Trigger
- **Mode:** Cron
- **Cron Expression:** `0 9 * * 0` (9:00 AM every Sunday)

### Node 2: Query Matching Preferences (HTTP Request)

- **Method:** GET
- **URL:** `https://YOUR_SUPABASE_URL/rest/v1/notification_preferences?weekly_brief_day=eq.CURRENT_DAY&select=*,child_profiles!inner(id,name,mode,user_id,personality_description,neuro_flags)`
- **Auth:** Supabase API (service role)
- Filter for `child_profiles.mode = full_programme`
- Check if current time matches 2hrs before `weekly_brief_time`

### Node 3: For Each Child — Fetch Week's Data (Code node)

```javascript
const childId = $json.child_id;
const userId = $json.user_id;
const supabaseUrl = 'https://YOUR_SUPABASE_URL';
const headers = { 'apikey': 'SERVICE_ROLE_KEY', 'Authorization': 'Bearer SERVICE_ROLE_KEY' };

// Calculate week range (Monday to Sunday)
const now = new Date();
const dayOfWeek = now.getDay();
const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
const weekStart = new Date(now);
weekStart.setDate(now.getDate() + mondayOffset);
weekStart.setHours(0, 0, 0, 0);
const weekEnd = new Date(weekStart);
weekEnd.setDate(weekStart.getDate() + 6);
weekEnd.setHours(23, 59, 59, 999);

// Fetch this week's sessions
const sessionsResp = await fetch(
  `${supabaseUrl}/rest/v1/story_sessions?child_id=eq.${childId}&created_at=gte.${weekStart.toISOString()}&created_at=lte.${weekEnd.toISOString()}&order=created_at.asc`,
  { headers }
);
const sessions = await sessionsResp.json();

// Skip if fewer than 3 sessions
if (sessions.length < 3) {
  console.log(`Skipping brief for child ${childId}: only ${sessions.length} sessions (need 3+)`);
  return [];
}

// Fetch morning reactions for the week
const reactionsResp = await fetch(
  `${supabaseUrl}/rest/v1/morning_reactions?child_id=eq.${childId}&generated_at=gte.${weekStart.toISOString()}&generated_at=lte.${weekEnd.toISOString()}&order=generated_at.asc`,
  { headers }
);
const reactions = await reactionsResp.json();

// Fetch child profile + dynamic context
const profileResp = await fetch(
  `${supabaseUrl}/rest/v1/child_profiles?id=eq.${childId}&select=*,child_dynamic_context(*)`,
  { headers }
);
const profiles = await profileResp.json();
const profile = profiles[0];

// Fetch previous week's brief
const prevWeekStart = new Date(weekStart);
prevWeekStart.setDate(prevWeekStart.getDate() - 7);
const prevBriefResp = await fetch(
  `${supabaseUrl}/rest/v1/weekly_briefs?child_id=eq.${childId}&order=week_start_date.desc&limit=1`,
  { headers }
);
const prevBriefs = await prevBriefResp.json();

// Check stressor freshness for 14-day refresh prompt
const ctx = profile?.child_dynamic_context?.[0] || {};
const stressorsUpdated = ctx.stressors_updated_at ? new Date(ctx.stressors_updated_at) : null;
const stressorsStale = stressorsUpdated
  ? (Date.now() - stressorsUpdated.getTime()) > (14 * 24 * 60 * 60 * 1000)
  : false;

return [{
  json: {
    childId,
    userId,
    profile,
    dynamicContext: ctx,
    sessions,
    reactions,
    previousBrief: prevBriefs.length > 0 ? prevBriefs[0] : null,
    weekStartDate: weekStart.toISOString().split('T')[0],
    weekEndDate: weekEnd.toISOString().split('T')[0],
    sessionCount: sessions.length,
    stressorsStale
  }
}];
```

### Node 4: Build Claude Prompt (Code node)

```javascript
const data = $input.first().json;
const profile = data.profile;
const ctx = data.dynamicContext;
const sessions = data.sessions;
const reactions = data.reactions;
const prevBrief = data.previousBrief;

const systemPrompt = `You are a warm, perceptive child development observer helping a parent understand what has been happening in their child's emotional world this week through their bedtime stories. You have access to seven nights of story sessions and the parent's reactions to daily observations.

BRIEF STRUCTURE — three sections, plain language, warm tone:

1. WHAT WE NOTICED THIS WEEK (2-3 sentences)
   Summary of the dominant emotional themes across the week.
   Reference specific story moments where powerful. Not a list of nights.

2. PATTERNS (1-2 sentences, only if a genuine pattern exists)
   Something that appeared across multiple nights that is worth naming.
   If no clear pattern exists, return null for this field.
   Do not manufacture patterns from thin data.

3. WHAT TO NOTICE THIS WEEK (2-3 sentences)
   Forward-looking. Specific. Actionable.
   Based on what emerged this week, what should the parent pay
   attention to in the days ahead? Give them a specific lens,
   not a generic suggestion.

BRIEF RULES:
- Never clinical. Never diagnostic. Observe and reflect only.
- Never mention the app, the study, or therapeutic frameworks.
- Reference specific story content and characters where it adds meaning.
- If parent reactions show 'didnt_see' on an observation, weight that theme lower.
- If parent reactions show consistent 'noticed', validate and build on those themes.
- Reference previous week's brief only to note progress, not to repeat.
- Maximum 200 words total across all three sections.
- Plain language a tired parent can read in 90 seconds.

OUTPUT FORMAT — return valid JSON only:
{
  "summary": "...",
  "patterns": "..." or null,
  "week_ahead": "..."
}`;

const sessionsText = sessions.map((s, i) =>
  `Night ${i + 1} (${new Date(s.created_at).toLocaleDateString()}): mode=${s.mode || 'co-creation'}, prompt="${s.story_prompt || 'none'}", themes=${(s.themes || []).join(',') || 'none'}, villain=${s.villain_appeared ?? 'unknown'}`
).join('\n');

const reactionsText = reactions.length > 0
  ? reactions.map(r => {
      const obs = r.observations || [];
      const reacts = r.reactions || [];
      return obs.map((o, i) =>
        `- [${o.type}] "${o.text}" → parent reaction: ${reacts[i]?.reaction || 'no reaction'}`
      ).join('\n');
    }).join('\n')
  : 'No morning reaction data yet (Week 1)';

const userPrompt = `CHILD PROFILE:
Name: ${profile.name}, Age: ${profile.age}
Personality: ${profile.personality_description || 'Not provided'}
Neuro flags: ${(profile.neuro_flags || []).join(', ') || 'None'}
Fear flags: ${(ctx.fear_flags || []).join(', ') || 'None'}
Current stressors: ${ctx.current_stressors || 'None noted'}

THIS WEEK'S SESSIONS (${sessions.length} nights):
${sessionsText}

THIS WEEK'S MORNING REACTIONS:
${reactionsText}

PREVIOUS WEEK'S BRIEF SUMMARY: ${prevBrief?.brief_content?.summary || 'First week'}

Generate the weekly brief now.`;

return [{
  json: {
    claudePayload: {
      model: 'claude-sonnet-4-6-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    }
  }
}];
```

### Node 5: Call Claude API (HTTP Request)

- **Method:** POST
- **URL:** `https://api.anthropic.com/v1/messages`
- **Headers:** `x-api-key`, `anthropic-version: 2023-06-01`, `Content-Type: application/json`
- **Body:** `={{ $json.claudePayload }}`

### Node 6: Parse Claude Response (Code node)

```javascript
const response = $input.first().json;
let content = response.content?.[0]?.text || '';
const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
const parsed = JSON.parse(cleaned);

if (!parsed.summary || !parsed.week_ahead) {
  throw new Error('Brief missing required sections');
}

return [{ json: { briefContent: parsed } }];
```

### Node 7: Insert Weekly Brief (HTTP Request)

- **Method:** POST
- **URL:** `https://YOUR_SUPABASE_URL/rest/v1/weekly_briefs`
- **Body:**

```json
{
  "child_id": "{{ CHILD_ID }}",
  "user_id": "{{ USER_ID }}",
  "week_start_date": "{{ WEEK_START }}",
  "week_end_date": "{{ WEEK_END }}",
  "brief_content": {
    "summary": "{{ parsed.summary }}",
    "patterns": "{{ parsed.patterns }}",
    "week_ahead": "{{ parsed.week_ahead }}",
    "generated_at": "{{ new Date().toISOString() }}"
  },
  "session_count": {{ SESSION_COUNT }}
}
```

### Node 8: Append Stressor Refresh Note (Code node — conditional)

```javascript
// If stressors are stale (>14 days), append a note to the brief
const data = $('For Each Child — Fetch Week Data').first().json;
const briefId = $('Insert Weekly Brief').first().json.id;

if (data.stressorsStale && briefId) {
  // Update the brief to include a stressor refresh note
  const existing = $('Parse Claude Response').first().json.briefContent;
  existing.stressor_refresh_note = "It's been a couple of weeks since you updated what's going on in their life. Worth a quick check in Settings if anything has changed.";

  // PATCH the brief
  // (Use HTTP Request node to update brief_content)
}

return [{ json: { stressorsStale: data.stressorsStale } }];
```

### Node 9: Send Push Notification (at configured delivery time)

Use a Wait node or schedule the push for `weekly_brief_time`.

**Notification payload:**
```json
{
  "title": "DreamStation",
  "body": "Your weekly reflection for [Name] is ready.",
  "tag": "weekly-brief",
  "url": "/?tab=account&section=briefs"
}
```

### Node 10: 48-Hour Follow-Up Check (separate workflow)

Runs 48 hours after delivery. If `read_at` is still null, send one follow-up:

```json
{
  "title": "DreamStation",
  "body": "Your weekly reflection for [Name] is waiting in Settings.",
  "tag": "weekly-brief-followup",
  "url": "/?tab=account&section=briefs"
}
```

Do NOT send a third notification.

---

## Wiring Summary

```
Schedule Trigger (Sundays 9:00 AM)
  → Query notification_preferences where weekly_brief_day = sunday
  → Filter: Full Programme mode, 3+ sessions this week
  → Fetch week's sessions + reactions + profile + prev brief
  → Build Claude prompt
  → Call Claude API
  → Parse 3-section brief
  → Insert to weekly_briefs
  → Check stressor freshness → append refresh note if >14 days
  → Send push at configured delivery time
```

---

## Deferred Actions

The following must be completed before the trial:
1. **Build this n8n workflow** in n8n Cloud
2. **Build the 48-hour follow-up** check workflow
3. **Store Claude API key** in n8n credentials (not in frontend)
4. **Test with 3+ simulated nights** to verify brief quality
