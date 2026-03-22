# DreamStation — Full Programme Implementation Plan
**Version:** 1.0  
**Trial Target:** 10 families, March 2026  
**IDE Context:** Claude Opus, full codebase in context  
**Stack:** PWA (Vercel), Supabase, n8n, Gemini API, Claude API (claude-sonnet-4-6), Cartesia TTS, AWS Lambda (Node 22), Web Push

---

## How to Use This Document

Work through phases sequentially. Do not begin a phase until all steps in the previous phase are marked complete. Each step has a clear definition of done. Where a step produces a Supabase schema, n8n workflow, or prompt — build and test it before moving on. No phase should require decisions to be made mid-build.

The two companion documents that provide full product detail for this build are:
- `DreamStation_Intake_Spec.docx` — onboarding intake flow, all copy, field types, design principles
- `DreamStation_Reflection_Spec.docx` — morning reflection popup, weekly brief, n8n workflow architecture

This implementation plan defines the build order, dependencies, and acceptance criteria. The spec documents define what each screen, prompt, and workflow should contain.

---

## Phase Dependencies Overview

```
Phase 1 — Supabase Schema
        ↓
Phase 2 — Mode Selection & Onboarding Intake
        ↓
Phase 3 — Story Generation with Profile Injection
        ↓
Phase 4 — Nightly Notification Workflow
        ↓
Phase 5 — Morning Reflection Popup
        ↓
Phase 6 — Weekly Brief
        ↓
Phase 7 — Settings & Preferences
        ↓
Phase 8 — Trial Readiness & QA
```

---

## Phase 1 — Supabase Schema

All data infrastructure before any frontend or workflow work begins. Every subsequent phase depends on this being correct.

### 1.1 — Child Profile Table
**Table:** `child_profiles` 

Fields required:
- `id` uuid primary key
- `user_id` uuid (foreign key → auth.users)
- `name` text
- `age` integer
- `personality_description` text (free text, most valuable intake field)
- `neuro_profile` text
- `interests` text[] (array)
- `family_structure` text
- `parent_context` text
- `mode` text (enum: `just_stories` | `full_programme`)
- `created_at` timestamp
- `updated_at` timestamp

**Done when:** Table exists in Supabase, RLS policies allow authenticated user to read/write their own records only.

---

### 1.2 — Dynamic Context Table
**Table:** `child_dynamic_context` 

Fields required:
- `id` uuid primary key
- `child_id` uuid (foreign key → child_profiles)
- `characters` jsonb (array of `{ name, role, notes }`)
- `current_stressors` text
- `fear_flags` text[] (array of selected fear categories)
- `standing_fears` text (free text)
- `stressors_updated_at` timestamp
- `updated_at` timestamp

**Done when:** Table exists, linked to child_profiles via foreign key, RLS in place.

---

### 1.3 — Sessions Table
**Table:** `story_sessions` 

Fields required:
- `id` uuid primary key
- `child_id` uuid (foreign key → child_profiles)
- `user_id` uuid (foreign key → auth.users)
- `parent_note` text (nullable)
- `story_prompt` text
- `is_comfort_story` boolean default false
- `source_story_id` uuid (nullable, for comfort story replays)
- `story_id` uuid (nullable, foreign key → stories table once generated)
- `villain_appeared` boolean (nullable, populated post-generation)
- `superpower_used` boolean (nullable, populated post-generation)
- `themes` text[] (nullable, populated post-generation)
- `created_at` timestamp

**Done when:** Table exists, linked correctly, RLS in place.

---

### 1.4 — Clinical Baseline Table
**Table:** `clinical_baselines` 

Fields required:
- `id` uuid primary key
- `child_id` uuid (foreign key → child_profiles)
- `user_id` uuid (foreign key → auth.users)
- `bedtime_resistance` integer (1–10)
- `sleep_onset_latency` integer (1–10)
- `night_waking_frequency` integer (1–10)
- `parental_stress` integer (1–10)
- `morning_mood` integer (1–10)
- `captured_at` timestamp
- `week_number` integer (0 = onboarding baseline, 3 = Week 3 re-capture)

**Done when:** Table exists, supports multiple records per child (for baseline re-capture at Week 3).

---

### 1.5 — Morning Reactions Table
**Table:** `morning_reactions` 

Fields required:
- `id` uuid primary key
- `child_id` uuid (foreign key → child_profiles)
- `session_id` uuid (foreign key → story_sessions)
- `user_id` uuid (foreign key → auth.users)
- `observations` jsonb (array of 3 generated observations — text + type)
- `reactions` jsonb (array of 3 reactions — `noticed` | `unsure` | `didnt_see`)
- `skipped` boolean default false
- `generated_at` timestamp
- `reacted_at` timestamp (nullable)

**Done when:** Table exists, linked to sessions, RLS in place.

---

### 1.6 — Weekly Briefs Table
**Table:** `weekly_briefs` 

Fields required:
- `id` uuid primary key
- `child_id` uuid (foreign key → child_profiles)
- `user_id` uuid (foreign key → auth.users)
- `week_start_date` date
- `week_end_date` date
- `brief_content` jsonb (structured: `{ summary, patterns, week_ahead, generated_at }`)
- `session_count` integer
- `delivered_at` timestamp (nullable)
- `created_at` timestamp

**Done when:** Table exists, supports historical brief retrieval in reverse chronological order.

---

### 1.7 — Notification Preferences Table
**Table:** `notification_preferences` 

Fields required:
- `id` uuid primary key
- `user_id` uuid (foreign key → auth.users)
- `child_id` uuid (foreign key → child_profiles)
- `evening_reminder_time` time (default 18:30)
- `morning_reflection_time` time (default 08:00)
- `weekly_brief_day` text (default `sunday`)
- `weekly_brief_time` time (default 19:30)
- `push_subscription` jsonb (Web Push subscription object)
- `updated_at` timestamp

**Done when:** Table exists, one record per child per user, defaults set correctly.

---

## Phase 2 — Mode Selection & Onboarding Intake

Frontend build. Refer to `DreamStation_Intake_Spec.docx` for all screen copy, field labels, placeholder text, and UX principles. This plan defines build order and acceptance criteria only.

### 2.1 — First Story Gate
Add logic to existing story creation flow: if no child profile exists for the current user, allow exactly one story generation without a profile. Track this with a `has_had_free_story` flag in local state or user metadata in Supabase.

**Done when:** A new user can generate one story with no intake. On attempting a second story, mode selection screen is shown.

---

### 2.2 — Mode Selection Screen
Two options presented after the first free story:
- Just Stories
- Full Programme

Just Stories selection: creates a minimal child profile (name + age only), sets `mode = just_stories`, proceeds directly to story creation.

Full Programme selection: proceeds to intake Section 1.

**Done when:** Both paths route correctly. Just Stories creates a profile and returns to create screen. Full Programme enters the intake flow.

---

### 2.3 — Intake Section 1: Who Is Your Child
Fields: name, age, free-text personality description.

The free-text personality description field is the most load-bearing field in the entire intake. Placeholder copy and any helper text must be warm and specific — refer to spec for exact copy.

Save to `child_profiles` on section completion (not on final submit — save progressively so drop-off doesn't lose data).

**Done when:** Fields save correctly to `child_profiles`. Progress indicator shows 1 of 5. Back navigation works without data loss.

---

### 2.4 — Intake Section 2: Their Nervous System
Fields: neuro_profile (structured multi-select + free text for 'other').

Options must include 'not sure / exploring' as a first-class option, not an afterthought. No option should feel like a diagnosis.

Save to `child_profiles.neuro_profile`.

**Done when:** All options selectable including 'not sure'. Multi-select works correctly. Data saves progressively.

---

### 2.5 — Intake Section 3: What Bedtime Looks Like
Two fields only: qualitative bedtime behaviour description (free text), night waking frequency (structured select).

This section primes parents to notice change. Copy must frame this as a starting point, not a problem statement. Refer to spec.

Save qualitative field to `child_dynamic_context.current_stressors` (it functions as the live bedtime context). Save frequency to session baseline prep.

**Done when:** Both fields save correctly. Section feels lighter than Sections 1–2.

---

### 2.6 — Intake Section 4: What They Worry About
Two parts:

**Part A — Fear flags:** Multi-select from defined categories (darkness, separation, social, transitions, body sensations, performance, other). These are relatively stable.

**Part B — Current stressors:** Single free-text field. Explicitly labelled as dynamic — "this changes, you can update it anytime." This is the field the app will prompt to refresh every 14 days.

Save fear flags to `child_dynamic_context.fear_flags`. Save stressors to `child_dynamic_context.current_stressors`. Set `stressors_updated_at` to now.

**Done when:** Both parts save correctly. 'None of these' option exists for Part A. Free text field has a low-friction placeholder.

---

### 2.7 — Intake Section 5: Their World
Three parts:

**Part A — Allies:** Add people, pets, transitional objects. Each entry has name + role (friend / pet / family / comfort object). Add/remove UI.

**Part B — Social difficulty:** Optional free text. "Is there anything tricky in their social world right now?" Low pressure, explicitly optional.

**Part C — Interests:** Tag-style multi-select with free text add option.

Save allies to `child_dynamic_context.characters`. Save interests to `child_profiles.interests`. Save social note to `child_dynamic_context.current_stressors` (append, don't overwrite).

**Done when:** All three parts save correctly. Add/remove works for allies. Interests save as an array.

---

### 2.8 — Completion Screen
Warm confirmation screen. Must not feel like a form submit confirmation. Refer to spec for copy.

Triggers baseline capture (Section 6) immediately after.

**Done when:** Completion screen displays correctly, triggers baseline flow.

---

### 2.9 — Clinical Baseline Capture
Separate screen, triggered after completion screen. Five sliders, 1–10, each labelled clearly. Should take under 90 seconds.

Sliders not numbered forms. Low friction. "You can come back to this later" reassurance present.

Save all five scores to `clinical_baselines` with `week_number = 0` and `captured_at = now()`.

**Done when:** All five scores save correctly to `clinical_baselines` with correct week number. Completes and routes to app home.

---

## Phase 3 — Story Generation with Profile Injection

Updates to existing story generation flow to inject Full Programme child profile into Gemini prompts.

### 3.1 — Profile Fetch on Story Creation
On opening the story creation screen, fetch the active child's profile from `child_profiles` and `child_dynamic_context`. Store in component state for use in prompt construction.

**Done when:** Profile data is available in story creation component state before generation is triggered.

---

### 3.2 — Gemini Prompt Construction
Build a prompt construction function that takes the child profile, dynamic context, nightly input (parent note + child story prompt), and assembles the structured Gemini system prompt.

Prompt structure:
```
CHILD PROFILE:
Name: [name], Age: [age]
Personality: [personality_description]
Interests: [interests array joined as comma-separated string]
Nervous system: [neuro_profile]
Family context: [family_structure]

CURRENT CONTEXT:
Active stressors: [current_stressors]
Fear landscape: [fear_flags joined] — [standing_fears]

ALLIES AND CHARACTERS:
[characters array formatted as: Name — Role — Notes]

TONIGHT:
Parent note: [parent_note or 'none provided']
Story prompt from child: [story_prompt]

STORY RULES:
- The child is always the hero. The problem is never the child.
- If a fear or stressor is identifiable in tonight's prompt, externalise it as the story antagonist.
- Allies may appear as supporting characters but never solve the problem for the hero.
- The hero resolves the story using a strength or quality they already possess.
- Final section: energy drops, language becomes slower and repetitive, limbs are heavy, breathing slows.
- Final line: "And then, [name] was fast asleep."
```

For `just_stories` mode: use name and age only, no therapeutic framing.

**Done when:** Prompt construction function returns correct structured string for both modes. Full Programme prompt is meaningfully richer than Just Stories prompt.

---

### 3.3 — Nightly Input UI
Add optional secondary text box to story creation screen below the main story prompt.

Placeholder: *"Anything on their mind tonight?"*

Field is never required. Never blocks story generation. Saves to `story_sessions.parent_note` when populated.

**Done when:** Field appears on create screen, saves correctly, empty string handled gracefully (saves as null not empty string).

---

### 3.4 — Session Record Creation
On story generation trigger, create a `story_sessions` record before the Gemini call with the session metadata. Update the record with `story_id`, `villain_appeared`, `superpower_used`, and `themes` once generation completes.

**Done when:** Every story generation creates a corresponding session record. Session record is updated correctly post-generation.

---

## Phase 4 — Nightly Notification Workflow

n8n workflow that fires the evening reminder notification with session callback.

### 4.1 — Web Push Subscription
On first app open post-onboarding, prompt user to enable push notifications. Store the Web Push subscription object to `notification_preferences.push_subscription`.

Handle permission denied gracefully — app works without notifications, user can enable later in Settings.

**Done when:** Push subscription stored correctly in Supabase. Notification fires correctly on test trigger.

---

### 4.2 — n8n Evening Reminder Workflow

**Trigger:** Schedule node — runs every minute, filters to users whose `evening_reminder_time` matches current time (within 1-minute window).

**Steps:**
1. Query `notification_preferences` for all records where reminder time matches now
2. For each record, query `story_sessions` for the most recent session for that child
3. If session exists and `created_at` is within last 48 hours: build callback notification string using session `story_prompt` or `themes` 
4. If no recent session: use default notification string
5. Send Web Push notification to `push_subscription` endpoint

**Notification strings:**
- With callback: `"Time for tonight's story — last night [Name] wanted [theme/prompt summary]. What's on their mind tonight?"` 
- Default: `"Time to create tonight's story for [Name] ✨"` 

**Done when:** Workflow fires correctly at configured time. Callback string populates when prior session data exists. Default fires when no prior session. Notification deep-links to story creation screen.

---

## Phase 5 — Morning Reflection Popup

The primary attunement mechanism. Refer to `DreamStation_Reflection_Spec.docx` for full observation type definitions, quality standards, and UI specification.

### 5.1 — n8n Morning Observation Generation Workflow

**Trigger:** Schedule node — runs every minute, filters to users whose `morning_reflection_time` matches current time.

**Steps:**
1. Query `notification_preferences` for matching records
2. For each, check `story_sessions` — was there a session last night? If no session: do not fire, exit.
3. Fetch last night's session data: parent note, story prompt, themes, villain/superpower flags
4. Fetch last 6 nights of session history for the child (for pattern detection from Night 4 onward)
5. Fetch child profile and dynamic context
6. Call Claude API (`claude-sonnet-4-6`) with morning observation prompt (see 5.2)
7. Parse three observations from response
8. Insert record to `morning_reactions` with observations, `skipped = false`, `reacted_at = null` 
9. Send push notification to parent

**Done when:** Workflow fires only when a prior night session exists. Three observations generated and stored. Push notification fires with correct copy.

---

### 5.2 — Claude API Prompt — Morning Observations

```
You are generating three observations for a parent about their child's bedtime story session last night.

CHILD PROFILE:
[full profile injection]

LAST NIGHT'S SESSION:
Story prompt from child: [story_prompt]
Parent note: [parent_note or 'none']
Themes that appeared: [themes array]
Villain appeared in story: [true/false]
Child's known fears: [fear_flags]
Active stressors: [current_stressors]

RECENT HISTORY (last 6 nights):
[array of prior session prompts and themes, oldest first]

YOUR TASK:
Generate exactly three observations. Each observation must be a different type:
- Type 1 THEME: A theme or topic the child returned to last night, especially if it connects to their fear or stressor profile
- Type 2 PATTERN: Something that has appeared across multiple nights in the recent history (only available from Night 4 onward — if insufficient history, generate a second THEME observation instead)
- Type 3 LANGUAGE: A specific word, phrase, or image the child used that is worth a parent noticing

QUALITY STANDARD — before including any observation ask: would this parent have noticed and named this themselves without the app pointing it out? If yes, replace it with something more specific. Generic observations (she chose an adventure story, he seems to enjoy fantasy themes) must not be surfaced.

FORMAT — respond in JSON only:
{
  "observations": [
    { "type": "THEME", "text": "observation text — one sentence, specific, parent-readable" },
    { "type": "PATTERN", "text": "observation text — one sentence, specific, parent-readable" },
    { "type": "LANGUAGE", "text": "observation text — one sentence, specific, parent-readable" }
  ]
}

TONE:
- Observational not diagnostic
- Curious not alarming
- Specific not generic
- Never use clinical language
- Never suggest the child has a condition or problem
- The parent is the expert on their child — the app is just pointing at something worth noticing
```

**Done when:** Claude API returns valid JSON with three typed observations. Prompt handles null parent_note gracefully. Pattern type falls back to second THEME when history is insufficient.

---

### 5.3 — Morning Popup UI

Displayed when parent taps morning push notification. Deep-links directly to popup, not app home screen.

Three observation cards displayed sequentially or as a stack (refer to spec for UI preference). Each card has:
- Observation text
- Three reaction buttons: **Noticed this** / **Not sure** / **Didn't see that**

Tapping a reaction saves to `morning_reactions.reactions` array and advances to next card. After third reaction, popup closes with brief warm confirmation and routes to app home.

If parent dismisses without reacting: `morning_reactions.skipped = true`. No guilt framing. No re-send.

Midday check: if `reacted_at` is still null at midday, mark `skipped = true` via n8n scheduled check.

**Done when:** Popup opens correctly from notification. All three reactions save correctly to Supabase. Skipped records marked correctly. No popup fires on days with no prior session.

---

## Phase 6 — Weekly Brief

### 6.1 — n8n Weekly Brief Generation Workflow

**Trigger:** Schedule node — runs at 2 hours before each user's configured `weekly_brief_time` on their configured `weekly_brief_day`.

**Steps:**
1. Query `notification_preferences` for records matching today's day and upcoming brief time
2. For each child, fetch all `story_sessions` from the past 7 days
3. If fewer than 3 sessions: skip generation, do not send brief this week
4. Fetch all `morning_reactions` records for those sessions
5. Fetch child profile and dynamic context
6. Fetch previous week's brief from `weekly_briefs` (for continuity and to avoid repetition)
7. Call Claude API (`claude-sonnet-4-6`) with weekly brief prompt (see 6.2)
8. Parse response and insert to `weekly_briefs` 
9. At configured delivery time: send push notification

**Done when:** Workflow skips correctly when fewer than 3 sessions. Brief generated and stored. Notification fires at correct time.

---

### 6.2 — Claude API Prompt — Weekly Brief

```
You are generating a weekly brief for a parent using DreamStation, a bedtime story app with a structured reflective framework.

CHILD PROFILE:
[full profile injection]

THIS WEEK'S SESSIONS ([count] nights):
[array of sessions: date, story_prompt, parent_note, themes, villain_appeared, superpower_used]

PARENT REACTIONS THIS WEEK:
[array of morning_reactions: observation text, type, reaction for each]

PREVIOUS WEEK'S BRIEF SUMMARY:
[brief_content.summary from last week, or 'This is the first week' if none]

YOUR TASK:
Generate a weekly brief with exactly three sections:

1. WHAT WE NOTICED THIS WEEK
Two to three sentences. Identify the most significant theme or pattern across the week's sessions. Must be specific to this child and this week — not generic. Weight observations that received 'Noticed this' reactions from the parent more heavily than those marked 'Didn't see that'.

2. PATTERNS WORTH NAMING
One to two sentences or null if no genuine pattern exists. A pattern requires at least two separate nights pointing in the same direction. Do not manufacture patterns from insufficient data. It is better to return null here than to surface a weak observation.

3. WHAT TO PAY ATTENTION TO THIS WEEK
One specific, forward-looking suggestion for the parent. Not a task. A lens. Something to notice or gently explore in the week ahead based on what this week's data suggests.

FORMAT — respond in JSON only:
{
  "summary": "text",
  "patterns": "text or null",
  "week_ahead": "text",
  "generated_at": "ISO timestamp"
}

TONE:
- Warm, plain language
- Never clinical or diagnostic
- Never alarming
- The brief is a parenting support tool, not a clinical instrument
- The parent knows their child — the brief points at things worth noticing, it does not interpret them
```

**Done when:** Brief generates with correct structure. Null handled correctly for patterns section. Previous week's brief prevents repetition. Week 1 brief (no prior brief, no reaction data) generates gracefully from story data alone.

---

### 6.3 — Weekly Brief UI

Located at: Settings > My Reflections > Weekly Briefs

Current week's brief displayed at top. Previous briefs below in reverse chronological order.

Each brief displays:
- Week date range
- Three sections with clear labels
- Session count for the week ("Based on 5 nights")

Brief is never shown on child-facing screens. No primary navigation item. Parent-only, accessible but not prominent.

Push notification copy: `"[Name]'s weekly reflection is ready"` — deep-links to brief.

**Done when:** Brief displays correctly with all three sections. Historical briefs accessible. Notification deep-links correctly. Child-facing screens have no access to brief content.

---

## Phase 7 — Settings & Preferences

### 7.1 — Notification Preferences Screen
Location: Settings > Notification Preferences

Controls:
- Evening reminder time (time picker, constrained to after 18:00)
- Morning reflection time (time picker)
- Weekly brief day (day picker)
- Weekly brief time (time picker)

Save all to `notification_preferences`. Changes take effect on next workflow run.

**Done when:** All four preferences save correctly. Time picker enforces 18:00 minimum for evening reminder.

---

### 7.2 — Child Profile Edit Screen
Location: Settings > [Child Name]'s Profile

Editable fields: all intake fields. Presented in the same section structure as onboarding but without progress indicator.

`current_stressors` field displays `stressors_updated_at` date and copy: *"Last updated [date] — worth refreshing if things have changed."*

**Done when:** All fields editable. Changes save to correct tables. `stressors_updated_at` updates on stressor field save.

---

### 7.3 — 14-Day Stressor Refresh Prompt
If `stressors_updated_at` is more than 14 days ago: surface a prompt in the weekly brief copy reminding parent to review current stressors. Do not use a push notification for this — include it as a one-line note at the bottom of the weekly brief.

**Done when:** Weekly brief generation workflow checks `stressors_updated_at` and appends refresh prompt when stale.

---

### 7.4 — Week 3 Baseline Re-Capture
At Week 3, send a push notification prompting parent to re-complete the clinical baseline. Notification fires 3 weeks after `clinical_baselines` record with `week_number = 0` was created.

If not completed within 3 days: flag as incomplete in Supabase, do not block app usage, note in weekly brief data for researcher access.

Baseline re-capture UI is identical to onboarding baseline screen. Saves new record with `week_number = 3`.

**Done when:** Push fires at correct time. Re-capture saves new record (does not overwrite Week 0 baseline). Both records accessible for trial comparison.

---

## Phase 8 — Trial Readiness & QA

### 8.1 — End-to-End Flow Test
Complete the full onboarding intake as a test parent. Generate 3 stories across 3 simulated nights. Verify:
- [ ] Morning reflection popup fires correctly on night 2 and 3
- [ ] Observations are specific and pass the quality standard
- [ ] Session records created correctly in Supabase
- [ ] Evening reminders fire with callback on nights 2+
- [ ] Weekly brief generates after minimum 3 sessions
- [ ] Brief sections are correctly structured
- [ ] All reaction data saves and is weighted in brief

---

### 8.2 — Just Stories Flow Test
Complete mode selection as Just Stories. Generate 3 stories. Verify:
- [ ] No intake screens shown
- [ ] No morning reflection popups
- [ ] No weekly brief
- [ ] Evening reminder fires without therapeutic callback
- [ ] Story generation uses name/age only prompt, no therapeutic framing

---

### 8.3 — Supabase Research Access
Before trial begins:
- [ ] Confirm read access for researcher role on `morning_reactions` and `weekly_briefs` tables
- [ ] Confirm `story_sessions` accessible for session count analysis
- [ ] Confirm `clinical_baselines` accessible for before/after comparison
- [ ] Anonymisation approach confirmed for data handling

---

### 8.4 — Push Notification Testing
- [ ] Web Push fires on Android (primary trial device)
- [ ] Web Push fires on iOS with app added to home screen
- [ ] Deep-link from notification opens correct screen
- [ ] Notification does not re-fire if already dismissed

---

### 8.5 — Edge Case Handling
- [ ] No story generated last night — morning popup does not fire
- [ ] Fewer than 3 sessions in week — weekly brief skipped gracefully
- [ ] Parent skips morning popup — `skipped = true`, no re-send, data still used in brief
- [ ] Parent switches from Full Programme to Just Stories — historical data persists, reflection features pause
- [ ] Week 1 brief — no prior brief, no reaction data — generates from story data only
- [ ] Section 4 skipped entirely at onboarding — story generation falls back to profile-only context, no error

---

## Open Decisions (Resolve Before Build)

These must be answered before Phase 2 begins. They affect schema design and routing logic.

1. **Multiple children per account** — does one parent account support multiple child profiles? Affects notification logic, brief routing, and allies cross-referencing between sibling profiles. Recommendation: yes, implement from the start. Adds complexity but trial families may have two children.

2. **Just Stories → Full Programme upgrade path** — if a parent starts on Just Stories and wants to switch to Full Programme, does the app take them through the full intake? Recommendation: yes, full intake on upgrade.

3. **Ally injection — automatic or child-selected** — does Gemini auto-inject allies into every story, or does the child choose to include them during co-creation? Recommendation: surfaced as options during co-creation, not auto-injected. Child choice produces more authentic engagement.

4. **Villain emergence — intake-set or child-generated** — the intake spec notes that villain name and superpower emerge better through usage than parent prediction. Decision needed: does the intake attempt to capture villain name, or is it left entirely to story generation? Recommendation: intake captures the struggle category and the tactics, Gemini names the villain in the first story, parent can edit in Settings if the name doesn't land with the child.

5. **Week 3 baseline notification** — push notification or in-app banner? Recommendation: push notification with in-app fallback if not completed within 3 days.

---

*Last updated: March 2026*  
*Companion documents: DreamStation_Intake_Spec.docx, DreamStation_Reflection_Spec.docx*
