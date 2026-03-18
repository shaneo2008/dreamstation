# DreamStation — Morning Reflection Loop & Weekly Brief Specification
**Full Programme | 10-Family Trial | Version 1.0 | March 2026**

---

## Overview

This document specifies the parent-facing reflection layer of DreamStation Full Programme. It covers two distinct but connected outputs: the Morning Reflection Popup and the Weekly Brief. Together these form the parental attunement mechanism — the layer that transforms nightly story data into insight a parent can actually use.

Both outputs are **parent-only**. Neither is visible to the child. Both live inside the app under **Settings > My Reflections**. Neither introduces a new tab or primary navigation item.

| Output | Timing | Purpose |
|--------|--------|---------|
| Morning Popup | Morning after a story night | Surface 3 observations from the previous night. Parent reacts with one tap per observation. Takes 30 seconds. |
| Weekly Brief | Sunday evening (parent-configurable) | Synthesise the week's story data and parent reactions. Identify patterns. Point forward to the week ahead. |

---

## Part 1 — The Morning Reflection Popup

### What It Does

The morning popup fires the morning after any story night — whether co-creation or playback. It presents three LLM-generated observations drawn from the previous night's session data. The parent reacts to each observation with a single tap. The entire interaction takes under 30 seconds.

The popup is the primary attunement mechanism. It models the kind of noticing the app wants parents to develop — specific, interpretive, connected to context — and asks parents to confirm or question what it sees. Over time parents begin noticing these things themselves without the prompt. That's the outcome.

---

### Trigger Logic

- Fires once per story night, the following morning, at parent-configurable time. Default: 8:00am.
- Delivered as a push notification. Tapping the notification opens the popup directly — not the app home screen.
- If parent does not engage by midday, mark as `skipped` in Supabase. Do not re-send.
- Missing a popup is never penalised or guilt-framed. Data from that night still feeds the weekly brief.
- If no story session occurred the previous evening, no popup fires. The n8n workflow checks for a session record before triggering.

---

### The Three Observations — Generation Logic

Three observations are generated per night via a Claude API call in the n8n morning workflow. The quality of these observations is the product.

**The bar:** would this parent have noticed and named this themselves without the app pointing it out? If yes, do not surface it.

---

### Observation Types

Each of the three observations should be a different type where possible:

| Type | What It Does | Example |
|------|-------------|---------|
| Story observation | Names something specific from last night's prompt or story content and interprets it | *She built a villain who made everything bland — the night after she didn't get a party bag. She may still be processing that.* |
| Behaviour observation | Connects the mode choice or engagement pattern to emotional state | *She chose a familiar story rather than a new one. She tends to do this when the day has been heavy. Worth noticing how today goes.* |
| Pattern observation | Available from Night 4 onward. References a theme appearing across multiple nights. | *This is the third time this week she's brought a school character into the story. It might be worth a gentle conversation about how things are going there.* |

---

### Observation Quality Standard

Every generated observation must pass this test before being surfaced: **would the parent have noticed and named this themselves without the app?** If yes, replace it.

| | Example | Why |
|-|---------|-----|
| ✗ Weak | *She seemed to enjoy last night's story* | Parent already knows this. Tells them nothing new. |
| ✗ Weak | *Bedtime took a while last night* | Parent was there. Observation adds no interpretation. |
| ✗ Weak | *She chose a playback story* | True but incomplete. Missing the so what. |
| ✓ Strong | *She built a villain who takes things away — on the night after she missed out on a party bag. She may still be sitting with that disappointment.* | Specific. Connects story content to real-world event. Parent may not have made this connection. |
| ✓ Strong | *She chose a familiar story rather than a new one. She tends to do this on harder days. If today feels heavy, comfort is probably what she'll reach for tonight too.* | Interprets mode choice. Gives parent something actionable for tonight. |
| ✓ Strong | *School themes have come up in her stories three nights running. It might be worth asking her something specific about school this week rather than "how was your day."* | Pattern across nights. Specific suggested action. Parent would not have counted this themselves. |

---

### Claude API Prompt — Morning Observation Generation

Sent to `claude-sonnet-4-6` by the n8n morning workflow.

```
// SYSTEM PROMPT

You are a warm, perceptive child development observer helping a parent
notice what is happening in their child's emotional world through bedtime
stories. You have access to the child's profile and their recent story
sessions. Your job is to generate exactly three observations the parent
can react to the following morning.

OBSERVATION RULES:
- Each observation must be specific to this child — never generic
- Each observation must interpret, not just describe
- Each observation must pass this test: would the parent have noticed
  and named this themselves? If yes, replace it
- Use warm, plain language — not clinical terms
- Maximum 2 sentences per observation
- Three types: story observation, behaviour observation, pattern
  observation. Use all three where possible.
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
}

// USER PROMPT

CHILD PROFILE: {child_profile_json}

LAST NIGHT:
Date: {session_date}
Mode: {co-creation | playback}
Story prompt (child's words): {story_prompt}
Parent note: {parent_note}
Playback story chosen: {playback_story_title | null}
Story themes generated: {themes_array}
Villain appeared: {boolean}
Story resolved positively: {boolean}

RECENT HISTORY (last 6 nights, oldest first):
{session_history_array}

Generate three observations now.
```

---

### The Three-Tap Reaction UI

Each observation is presented as a card. The parent reacts with one tap. Three options per card. Should feel closer to a notification interaction than a form.

### SCREEN: Morning Reflection — [Child name]'s night

**UI Copy:**
> Here's what we noticed from last night.

---

**Element: Observation card (repeated x3)**
- One observation per card, presented sequentially
- Parent completes one before seeing the next
- Type: Card with observation text + 3 reaction buttons
- Options: `👀 Noticed this` / `🤔 Not sure` / `✗ Didn't see that` 
- Saves to: `morning_reactions {session_id, observation_type, observation_text, reaction, timestamp}` 

---

**Element: Optional parent note (shown after all 3 reactions)**
- Hint: *Anything else on your mind about last night? (optional)*
- Type: Free text, multiline, optional. Max 300 chars.
- Saves to: `morning_reactions.parent_note` 

---

**Dev notes:**
- Cards presented one at a time — do not show all three simultaneously
- Swipe left = Didn't see that. Swipe right = Noticed this. Tap middle = Not sure. Also show buttons for clarity.
- Progress indicator: dot 1 of 3, 2 of 3, 3 of 3
- After all 3 reactions: completion message — *"Thanks. We'll include this in your weekly reflection."* Then close.
- Do not show a summary of their reactions back to them at this point
- Optional note appears only after all 3 cards — never interrupt the reaction flow
- If parent exits mid-popup, save completed reactions and mark session as `partially_complete` 
- Popup is not re-openable after closing — reactions are final
- Parents can view their reaction history in Settings > My Reflections but cannot change reactions

---

### Notification Copy

Push notification that triggers the morning popup. Fires at parent-configured time, default 8:00am.

```
With story prompt available:
"[Name] wanted [theme] last night — we noticed something. Tap to see."

With playback:
"[Name] went back to [story title] last night. We noticed something. Tap to see."

With parent note but no prompt detail:
"We have three things to share from [Name]'s night. Tap to see."
```

**Dev notes:**
- Notification copy pulls from last session in Supabase
- Deep links directly to morning popup screen — not app home
- If notification is not tapped by midday, mark as skipped — do not re-send
- No popup fires if no session record exists for previous evening

---

### Supabase Schema — Morning Reactions

| Field | Table | Type | Notes |
|-------|-------|------|-------|
| session_id | morning_reactions | uuid | FK to story session |
| child_id | morning_reactions | uuid | FK to child_profile |
| observation_type | morning_reactions | string | story \| behaviour \| pattern |
| observation_text | morning_reactions | text | Full text of observation shown |
| reaction | morning_reactions | string | noticed \| not_sure \| didnt_see |
| parent_note | morning_reactions | text | Optional, nullable |
| timestamp | morning_reactions | timestamptz | When parent reacted |
| skipped | morning_reactions | boolean | True if notification not tapped by midday |
| partially_complete | morning_reactions | boolean | True if parent exited mid-popup |

---

## Part 2 — The Weekly Brief

### What It Does

The weekly brief synthesises seven nights of story data plus the parent's morning reactions into a plain-language summary delivered once a week. Three parts: what we noticed this week, any patterns worth naming, and what to pay attention to in the week ahead.

The brief is retrospective and forward-pointing. It does not re-surface individual night observations. Its most valuable function is the forward-looking section — giving parents a specific lens for the week ahead rather than just a report card on the week just passed.

---

### Delivery

- Default: Sunday evening at 7:30pm
- Parent-configurable day and time in Settings > Notification Preferences
- Delivered as push notification. Tapping deep-links to **Settings > My Reflections > Weekly Briefs**
- Current brief displayed at top. All previous briefs stored and accessible below in reverse chronological order
- Never shown on the child-facing side of the app
- Does not appear in any primary navigation

---

### Weekly Brief — Generation Logic

Generated by n8n weekly workflow via Claude API call. Runs two hours before the parent's configured delivery time.

The brief receives: full week of session data, all morning reaction records for the week, the child's current profile, and the previous week's brief summary (to avoid repetition and allow cross-week progress references).

---

### Claude API Prompt — Weekly Brief Generation

Sent to `claude-sonnet-4-6` by the n8n weekly workflow.

```
// SYSTEM PROMPT

You are a warm, perceptive child development observer helping a parent
understand what has been happening in their child's emotional world this
week through their bedtime stories. You have access to seven nights of
story sessions and the parent's reactions to daily observations.

BRIEF STRUCTURE — three sections, plain language, warm tone:

1. WHAT WE NOTICED THIS WEEK (2-3 sentences)
   Summary of the dominant emotional themes across the week.
   Reference specific story moments where powerful. Not a list of nights.

2. PATTERNS (1-2 sentences, only if a genuine pattern exists)
   Something that appeared across multiple nights that is worth naming.
   If no clear pattern exists, omit this section entirely.
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
- If parent reactions show 'Didn't see that' on an observation,
  weight that theme lower in the brief.
- If parent reactions show consistent 'Noticed this', validate and
  build on those themes.
- Reference previous week's brief only to note progress, not to repeat.
- Maximum 200 words total across all three sections.
- Plain language a tired parent can read in 90 seconds.

OUTPUT FORMAT — return valid JSON only:
{
  "week_summary": "...",
  "pattern": "..." | null,
  "week_ahead": "..."
}

// USER PROMPT

CHILD PROFILE: {child_profile_json}

THIS WEEK'S SESSIONS (oldest first):
{sessions_array — date, mode, prompt, themes, villain, resolved}

THIS WEEK'S MORNING REACTIONS:
{reactions_array — observation_text, observation_type, reaction, parent_note}

PREVIOUS WEEK'S BRIEF SUMMARY: {previous_brief_week_summary | "First week"}

Generate the weekly brief now.
```

---

### Weekly Brief — UI

**Location:** Settings > My Reflections > Weekly Briefs

---

**Element: Week of [date range]**
- Type: Section header — date range auto-populated
- Saves to: `weekly_briefs.week_start_date` 

---

**Element: What we noticed this week**
- Type: Text display — `week_summary` from API response
- Saves to: `weekly_briefs.week_summary` 

---

**Element: A pattern worth noting (conditional)**
- Hint: *Only shown if `pattern` field is not null*
- Type: Text display — `pattern` from API response
- Saves to: `weekly_briefs.pattern` 

---

**Element: What to notice this week**
- Type: Text display — `week_ahead` from API response
- Saves to: `weekly_briefs.week_ahead` 

---

**Element: Story nights this week**
- Type: Simple count display — e.g. *"5 story nights this week"*
- Calculated from session count, not stored separately

---

**Dev notes:**
- No charts, no graphs, no scores — prose only
- Previous briefs listed below current brief in reverse chronological order
- Each previous brief is collapsible — shows date and first sentence only when collapsed
- No delete option — brief history is permanent for trial data integrity
- Brief marked as read when parent opens it — tracked in `weekly_briefs.read_at` 
- If parent has not opened brief within 48 hours of delivery, send one follow-up push notification only

---

### Weekly Brief Notification Copy

```
Standard:
"Your weekly reflection for [Name] is ready."

With a strong pattern week:
"It's been an interesting week for [Name]. Your reflection is ready."

Follow-up (48hr, unseen brief):
"Your weekly reflection for [Name] is waiting in Settings."
```

---

### Supabase Schema — Weekly Briefs

| Field | Table | Type | Notes |
|-------|-------|------|-------|
| child_id | weekly_briefs | uuid | FK to child_profile |
| week_start_date | weekly_briefs | date | Monday of the week covered |
| week_summary | weekly_briefs | text | Section 1 from API |
| pattern | weekly_briefs | text | Section 2, nullable |
| week_ahead | weekly_briefs | text | Section 3 from API |
| session_count | weekly_briefs | integer | Story nights that week |
| generated_at | weekly_briefs | timestamptz | When API call completed |
| delivered_at | weekly_briefs | timestamptz | When push notification sent |
| read_at | weekly_briefs | timestamptz | When parent opened brief, nullable |

---

## n8n Workflow Architecture

### Workflow 1 — Morning Reflection

| Step | Node | Action |
|------|------|--------|
| 1 | Schedule Trigger | Fires every morning at 7:00am. Runs ahead of earliest possible parent notification time. |
| 2 | Supabase Query | Find all sessions from previous evening (between 5pm and midnight). Join to child_profile. Filter: Full Programme mode only. |
| 3 | IF Node | If no session found for a child — skip that child. No notification fires. |
| 4 | Supabase Query | Pull last 6 sessions for each child (for pattern context). Pull child_profile. |
| 5 | Claude API Call | Send morning observation prompt with session data + history + child profile. Parse JSON response. |
| 6 | Supabase Insert | Write three observations to `morning_reactions` table with `reaction = null` (pending parent response). |
| 7 | Push Notification | Send notification at parent's configured time. Deep link to morning popup screen. Payload includes `session_id`. |
| 8 | Schedule Check | At midday: query for `morning_reactions` where `reaction` is still null and timestamp < midday. Mark `skipped = true`. |

---

### Workflow 2 — Weekly Brief

| Step | Node | Action |
|------|------|--------|
| 1 | Schedule Trigger | Fires Sunday at 5:30pm (2hrs before default delivery). Respects parent-configured day — check `preferred_brief_day` in `user_preferences`. |
| 2 | Supabase Query | Pull all sessions for the week (Mon–Sun) per child. Pull all `morning_reactions` for same period. Pull `child_profile`. Pull previous week's brief summary. |
| 3 | IF Node | If fewer than 2 sessions this week — skip brief generation. Insufficient data. No notification fires. |
| 4 | Claude API Call | Send weekly brief prompt with full week data + reactions + child profile + previous brief. Parse JSON response. |
| 5 | Supabase Insert | Write brief to `weekly_briefs` table. Set `generated_at` timestamp. |
| 6 | Push Notification | Send at parent's configured time. Deep links to Settings > My Reflections. Set `delivered_at` timestamp. |
| 7 | Follow-up Check | 48 hours after delivery: if `read_at` is null, send one follow-up notification. Do not send a third. |

---

## Settings — Parent Preferences

All reflection-related settings live in **Settings > Notification Preferences** and **Settings > My Reflections**. No reflection content is ever visible in the child-facing app flow.

### SCREEN: Settings > Notification Preferences

---

**Field: Morning reflection time**
- Hint: *When do you want to receive last night's observations?*
- Type: Time picker. Default: 8:00am. Constrained: 6:00am – 11:00am.
- Saves to: `user_preferences.morning_reflection_time` 

---

**Field: Weekly brief day**
- Hint: *Which day works best for your weekly summary?*
- Type: Single select: Monday / Tuesday / Wednesday / Thursday / Friday / Saturday / Sunday. Default: Sunday.
- Saves to: `user_preferences.preferred_brief_day` 

---

**Field: Weekly brief time**
- Type: Time picker. Default: 7:30pm. Constrained: 6:00pm – 9:00pm.
- Saves to: `user_preferences.preferred_brief_time` 

---

**Dev notes:**
- Notification preferences apply per child profile if multiple children
- Changes take effect from the next scheduled trigger — no retroactive changes

---

### SCREEN: Settings > My Reflections

---

**Element: Current weekly brief**
- Type: Text display — `week_summary` + `pattern` (if exists) + `week_ahead` 
- Shown at top, full text
- Updates `weekly_briefs.read_at` on open

---

**Element: Previous briefs**
- Type: Collapsible list. Each shows date + first sentence collapsed. Full text on expand.
- Read-only display

---

**Element: Morning reflection history**
- Type: List of past morning popups — date, observation text, parent reaction
- Read-only display from `morning_reactions` table

---

**Dev notes:**
- No editing of past reactions
- No delete functionality — trial data integrity
- Export option deferred to post-trial

---

## Open Questions for Trial Build

**1. Minimum sessions for weekly brief**
The spec skips brief generation if fewer than 2 sessions in the week. Should this threshold be higher — e.g. 3 sessions? With only 2 nights of data the pattern section will almost certainly be null and the brief may feel thin. Recommendation: 3 sessions minimum.

**2. Reaction labels**
The three reaction options are currently: `Noticed this` / `Not sure` / `Didn't see that`. These should be tested with real parents during trial setup. Alternative framing: `Yes, this` / `Maybe` / `Not quite`. Keep them short and non-judgmental in either direction.

**3. Multiple children**
If a family has two children in the trial, do they receive separate morning popups per child on the same morning? Recommendation: yes, separate popups with child name clearly in the notification. Parent configures notification times independently per child.

**4. Week 1 — no morning reaction data yet**
The weekly brief for Week 1 has no reaction data to weight observations against. The brief should acknowledge this implicitly by not referencing parent reactions — it works from story data alone. From Week 2 onward reactions inform the brief.

**5. Trial data access for researcher**
The `morning_reactions` and `weekly_briefs` tables are the primary research output for the LLM split group. Confirm Supabase read access for researcher role before trial begins. Consider anonymisation approach for the June PhD conversation.

---

*DreamStation — Reflection Loop Specification v1.0 | Companion document: Intake Specification v1.0*
