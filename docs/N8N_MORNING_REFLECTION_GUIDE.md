# n8n Morning Reflection Workflow Guide

## Overview

A scheduled workflow that generates 3 morning observations via Claude API after each story night, stores them in Supabase, and sends a push notification to the parent.

**Trigger:** Schedule node — runs at 8:00 AM daily via cron: `0 8 * * *`
**AI:** Claude API (`claude-sonnet-4-6`)
**Output:** `morning_reactions` record with 3 observations

---

## Workflow: "DreamStation Morning Reflection"

### Node 1: Schedule Trigger
- **Type:** Schedule Trigger
- **Mode:** Cron
- **Cron Expression:** `0 8 * * *` (8:00 AM daily)

### Node 2: Query Matching Preferences (HTTP Request)

Query notification_preferences where `morning_reflection_time` matches now and push_subscription exists.

- **Method:** GET
- **URL:** `https://YOUR_SUPABASE_URL/rest/v1/notification_preferences?morning_reflection_time=eq.HH:MM:00&push_subscription=not.is.null&select=*,child_profiles!inner(id,name,mode,user_id)`
- **Auth:** Supabase API (service role)

Filter out `just_stories` mode children — only Full Programme gets reflections.

### Node 3: Split Into Items + Filter
- Split results into individual items
- **IF node:** Skip if `child_profiles.mode` !== `full_programme`

### Node 4: Check For Last Night's Session (HTTP Request)

- **Method:** GET
- **URL:** `https://YOUR_SUPABASE_URL/rest/v1/story_sessions?child_id=eq.CHILD_ID&created_at=gte.YESTERDAY_5PM&created_at=lte.TODAY_MIDNIGHT&order=created_at.desc&limit=1`
- **Auth:** Supabase API

**IF no session found → skip this child entirely. No notification fires.**

### Node 5: Fetch Session History + Profile (Code node)

```javascript
const childId = $('Query Matching Preferences').item.json.child_id;
const supabaseUrl = 'https://YOUR_SUPABASE_URL';

// Fetch last 6 sessions for pattern context
const sessionsResp = await fetch(
  `${supabaseUrl}/rest/v1/story_sessions?child_id=eq.${childId}&order=created_at.desc&limit=6`,
  { headers: { 'apikey': 'SERVICE_ROLE_KEY', 'Authorization': 'Bearer SERVICE_ROLE_KEY' } }
);
const sessions = await sessionsResp.json();

// Fetch child profile + dynamic context
const profileResp = await fetch(
  `${supabaseUrl}/rest/v1/child_profiles?id=eq.${childId}&select=*,child_dynamic_context(*)`,
  { headers: { 'apikey': 'SERVICE_ROLE_KEY', 'Authorization': 'Bearer SERVICE_ROLE_KEY' } }
);
const profiles = await profileResp.json();
const profile = profiles[0];

return [{
  json: {
    lastSession: $('Check For Last Night Session').first().json,
    sessionHistory: sessions,
    childProfile: profile,
    dynamicContext: profile?.child_dynamic_context?.[0] || {}
  }
}];
```

### Node 6: Call Claude API — Morning Observations

Use an HTTP Request node to call the Claude API directly.

- **Method:** POST
- **URL:** `https://api.anthropic.com/v1/messages`
- **Headers:**
  - `x-api-key`: YOUR_CLAUDE_API_KEY
  - `anthropic-version`: `2023-06-01`
  - `Content-Type`: `application/json`

**Body (Code node to build it first):**

```javascript
const data = $('Fetch Session History + Profile').first().json;
const session = data.lastSession;
const history = data.sessionHistory;
const profile = data.childProfile;
const ctx = data.dynamicContext;

const systemPrompt = `You are a warm, perceptive child development observer helping a parent notice what is happening in their child's emotional world through bedtime stories. You have access to the child's profile and their recent story sessions. Your job is to generate exactly three observations the parent can react to the following morning.

OBSERVATION RULES:
- Each observation must be specific to this child — never generic
- Each observation must interpret, not just describe
- Each observation must pass this test: would the parent have noticed and named this themselves? If yes, replace it
- Use warm, plain language — not clinical terms
- Maximum 2 sentences per observation
- Three types: story observation, behaviour observation, pattern observation. Use all three where possible.
- Pattern observations only if 4+ nights of data exist
- Never mention the app, the study, or therapeutic frameworks
- Never diagnose. Observe and reflect only.
- End each observation with something the parent can notice or do today

OUTPUT FORMAT — return valid JSON only:
{
  "observations": [
    { "type": "story", "text": "..." },
    { "type": "behaviour", "text": "..." },
    { "type": "pattern", "text": "..." }
  ]
}`;

const userPrompt = `CHILD PROFILE:
Name: ${profile.name}, Age: ${profile.age}
Personality: ${profile.personality_description || 'Not provided'}
Neuro flags: ${(profile.neuro_flags || []).join(', ') || 'None'}
Fear flags: ${(ctx.fear_flags || []).join(', ') || 'None'}
Current stressors: ${ctx.current_stressors || 'None noted'}
Allies: ${(ctx.allies || []).map(a => a.name + (a.relationship ? ' (' + a.relationship + ')' : '')).join(', ') || 'None'}

LAST NIGHT:
Date: ${session.created_at}
Mode: ${session.mode || 'co-creation'}
Story prompt (child's words): ${session.story_prompt || 'None'}
Parent note: ${session.parent_note || 'None'}
Story themes: ${(session.themes || []).join(', ') || 'Not tagged'}
Villain appeared: ${session.villain_appeared ?? 'Unknown'}

RECENT HISTORY (last 6 nights, oldest first):
${history.length > 1
  ? history.slice().reverse().map((s, i) =>
    `Night ${i + 1}: prompt="${s.story_prompt || 'none'}", themes=${(s.themes || []).join(',') || 'none'}`
  ).join('\n')
  : 'First night — no history yet'
}

Generate three observations now.`;

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

### Node 7: Parse Claude Response (Code node)

```javascript
const response = $input.first().json;
let content;

// Extract text from Claude response
if (response.content && response.content[0]) {
  content = response.content[0].text;
} else if (response.choices && response.choices[0]) {
  content = response.choices[0].message.content;
} else {
  throw new Error('Unexpected Claude response format');
}

// Parse JSON
let parsed;
try {
  // Remove markdown code fences if present
  const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
  parsed = JSON.parse(cleaned);
} catch (e) {
  throw new Error(`Failed to parse Claude response as JSON: ${e.message}`);
}

if (!parsed.observations || parsed.observations.length !== 3) {
  throw new Error(`Expected 3 observations, got ${parsed.observations?.length || 0}`);
}

return [{
  json: {
    observations: parsed.observations
  }
}];
```

### Node 8: Insert Morning Reaction Record (HTTP Request)

- **Method:** POST
- **URL:** `https://YOUR_SUPABASE_URL/rest/v1/morning_reactions`
- **Auth:** Supabase API (service role)
- **Body:**

```json
{
  "child_id": "{{ CHILD_ID }}",
  "session_id": "{{ SESSION_ID }}",
  "user_id": "{{ USER_ID }}",
  "observations": {{ $('Parse Claude Response').first().json.observations }},
  "reactions": [],
  "skipped": false,
  "partially_complete": false,
  "generated_at": "{{ new Date().toISOString() }}"
}
```

### Node 9: Send Push Notification

Use your Lambda endpoint (same one from evening reminders) to send:

```json
{
  "subscription": "{{ PUSH_SUBSCRIPTION }}",
  "payload": {
    "title": "DreamStation",
    "body": "[Name] wanted [theme] last night — we noticed something. Tap to see.",
    "tag": "morning-reflection",
    "url": "/?morning=true"
  }
}
```

**Notification copy logic (Code node):**

```javascript
const session = $('Check For Last Night Session').first().json;
const childName = $('Query Matching Preferences').item.json.child_profiles.name;

let body;
if (session.story_prompt) {
  const summary = session.story_prompt.length > 40
    ? session.story_prompt.substring(0, 40) + '...'
    : session.story_prompt;
  body = `${childName} wanted "${summary}" last night — we noticed something. Tap to see.`;
} else {
  body = `We have three things to share from ${childName}'s night. Tap to see.`;
}

return [{
  json: {
    title: 'DreamStation',
    body: body,
    tag: 'morning-reflection',
    url: '/?morning=true'
  }
}];
```

---

## Midday Skip Check

Create a **separate small workflow** that runs once at 12:00 noon (cron: `0 12 * * *`):

1. Query `morning_reactions` where `reacted_at IS NULL` and `skipped = false` and `generated_at < today noon`
2. Update matching records: set `skipped = true`

---

## Wiring Summary

```
Schedule Trigger (8:00 AM daily)
  → Query notification_preferences where morning_reflection_time = 08:00:00
  → Filter: Full Programme mode only
  → For each child: check for last night's session
  → IF no session → skip
  → Fetch session history (6 nights) + child profile
  → Build Claude prompt → call Claude API
  → Parse 3 observations
  → Insert morning_reactions record
  → Send push notification
```

---

## How the Frontend Handles It

The frontend (`AuthenticatedApp.jsx`) already:
1. Checks for pending unreacted `morning_reactions` on app load
2. Listens for `NOTIFICATION_CLICK` messages from the service worker
3. Shows the `MorningReflectionPopup` component with the 3 observation cards
4. Saves reactions back to `morning_reactions` as the parent taps
5. Marks `partially_complete` if the parent exits mid-flow
