# Phase 8 — Trial Readiness & QA Checklist

## 8.1 — End-to-End Flow Test (Full Programme)

Complete the full onboarding intake as a test parent. Generate 3 stories across 3 simulated nights.

- [ ] New user gets one free story without intake
- [ ] Second story attempt shows Mode Selection screen
- [ ] Full Programme → full 8-screen intake flow completes
- [ ] Data saved correctly to `child_profiles`, `child_dynamic_context`, `clinical_baselines`
- [ ] Push permission prompt appears after onboarding
- [ ] Story generation includes child profile in webhook payload (check n8n execution logs)
- [ ] Gemini prompt includes CHILD PROFILE block (check Build Prompt output in n8n)
- [ ] Story_session record created in Supabase after generation
- [ ] Parent note field available on Create screen, saves to `story_sessions.parent_note`
- [ ] Morning reflection popup fires correctly on night 2 and 3 (requires n8n workflow)
- [ ] Observations are specific and pass the quality standard
- [ ] Evening reminders fire with callback on nights 2+ (requires n8n workflow)
- [ ] Weekly brief generates after minimum 3 sessions (requires n8n workflow)
- [ ] Brief sections are correctly structured
- [ ] All reaction data saves and is weighted in brief

## 8.2 — Just Stories Flow Test

Complete mode selection as Just Stories. Generate 3 stories.

- [ ] No intake screens shown (just name + age mini form)
- [ ] No morning reflection popups
- [ ] No weekly brief
- [ ] Evening reminder fires without therapeutic callback
- [ ] Story generation uses name/age only prompt, no therapeutic framing
- [ ] Settings shows "Upgrade to Full Programme" option
- [ ] Upgrade launches full onboarding flow

## 8.3 — Settings Screen Test

- [ ] Account tab shows new Settings screen (not old Account screen)
- [ ] Child profile displays with correct mode label
- [ ] Edit Profile → all intake fields editable and save correctly
- [ ] Stressor freshness date displays correctly
- [ ] Stressor refresh prompt shows when >14 days old
- [ ] Notification Preferences → all times save correctly
- [ ] Push toggle enables/disables push subscription
- [ ] Weekly Briefs screen loads (empty state if no briefs yet)
- [ ] Morning Reflections history loads (empty state if none yet)
- [ ] Week 3 Check-in appears when baseline is ≥21 days old
- [ ] Week 3 baseline saves with `week_number = 3` (does not overwrite Week 0)
- [ ] Sign Out works correctly

## 8.4 — Push Notification Testing

- [ ] Web Push fires on Android (primary trial device)
- [ ] Web Push fires on iOS with app added to home screen
- [ ] Deep-link from evening reminder opens Create tab
- [ ] Deep-link from morning reflection opens morning popup
- [ ] Deep-link from weekly brief opens Settings > Briefs
- [ ] Notification does not re-fire if already dismissed

## 8.5 — Edge Case Handling

- [ ] No story generated last night — morning popup does not fire
- [ ] Fewer than 3 sessions in week — weekly brief skipped gracefully
- [ ] Parent skips morning popup — `skipped = true`, no re-send, data still used in brief
- [ ] Parent exits morning popup mid-flow — `partially_complete = true`, partial reactions saved
- [ ] Parent switches from Full Programme to Just Stories — historical data persists, reflection features pause
- [ ] Week 1 brief — no prior brief, no reaction data — generates from story data only
- [ ] Section 4 skipped entirely at onboarding — story generation falls back to profile-only context, no error
- [ ] Multiple children per account — each child has separate profiles, notifications, briefs

## 8.6 — Supabase Research Access

Before trial begins:

- [ ] Confirm read access for researcher role on `morning_reactions` and `weekly_briefs` tables
- [ ] Confirm `story_sessions` accessible for session count analysis
- [ ] Confirm `clinical_baselines` accessible for before/after comparison (Week 0 vs Week 3)
- [ ] Anonymisation approach confirmed for data handling

## 8.7 — Data Integrity

- [ ] `clinical_baselines` has both Week 0 and Week 3 records (separate rows, not overwritten)
- [ ] `morning_reactions` records are immutable (no edit/delete in UI)
- [ ] `weekly_briefs` records are immutable (no delete in UI)
- [ ] `story_sessions` created for every generation, linked to correct child
- [ ] `child_dynamic_context` auto-created when child profile created (trigger working)
- [ ] `notification_preferences` auto-created when child profile created (trigger working)

---

## Deferred Items (Complete Before Trial Launch)

These items have n8n workflow guides written but the actual workflows need building:

1. **VAPID Keys** — Run `npx web-push generate-vapid-keys`, add public key to `.env` as `VITE_VAPID_PUBLIC_KEY`, store private key in Lambda env vars
2. **Web Push Lambda** — Deploy Node 22 Lambda with `web-push` npm package. Spec in `docs/N8N_EVENING_REMINDER_GUIDE.md`
3. **n8n Evening Reminder Workflow** — Build in n8n Cloud per `docs/N8N_EVENING_REMINDER_GUIDE.md`
4. **n8n Morning Reflection Workflow** — Build in n8n Cloud per `docs/N8N_MORNING_REFLECTION_GUIDE.md`
5. **n8n Midday Skip Check** — Small workflow that marks unreacted morning_reactions as skipped at noon
6. **n8n Weekly Brief Workflow** — Build in n8n Cloud per `docs/N8N_WEEKLY_BRIEF_GUIDE.md`
7. **n8n 48-Hour Brief Follow-Up** — Small workflow that re-sends unread brief notification once
8. **Claude API Key** — Store in n8n credentials for morning reflection + weekly brief workflows

---

## Files Modified in This Build

### New Files
| File | Purpose |
|------|---------|
| `supabase-full-programme-schema.sql` | 7 new tables + RLS + triggers |
| `src/hooks/useOnboardingStore.js` | Zustand store for intake flow |
| `src/components/onboarding/OnboardingFlow.jsx` | 8-screen intake flow |
| `src/components/onboarding/ModeSelectionScreen.jsx` | Just Stories / Full Programme choice |
| `src/components/onboarding/PushPermissionPrompt.jsx` | Push notification permission modal |
| `src/components/MorningReflectionPopup.jsx` | 3-card morning observation reaction UI |
| `src/components/WeeklyBriefScreen.jsx` | Weekly brief display (current + historical) |
| `src/components/settings/SettingsScreen.jsx` | Full settings shell with sub-screen routing |
| `src/components/settings/ChildProfileEdit.jsx` | Editable profile with all intake fields |
| `src/components/settings/NotificationPreferences.jsx` | Notification timing + push toggle |
| `src/components/settings/MorningReactionHistory.jsx` | Read-only reaction history |
| `src/components/settings/BaselineReCapture.jsx` | Week 3 baseline re-capture (5 sliders) |
| `src/services/pushNotificationService.js` | Web Push subscribe/unsubscribe |
| `docs/N8N_PROFILE_INJECTION_GUIDE.md` | n8n Build Prompt node + Validate Input changes |
| `docs/N8N_EVENING_REMINDER_GUIDE.md` | n8n evening reminder workflow spec |
| `docs/N8N_MORNING_REFLECTION_GUIDE.md` | n8n morning reflection workflow spec |
| `docs/N8N_WEEKLY_BRIEF_GUIDE.md` | n8n weekly brief workflow spec |
| `docs/PHASE_8_QA_CHECKLIST.md` | This file |

### Modified Files
| File | Changes |
|------|---------|
| `src/lib/supabase.js` | 7 new table refs + 18 CRUD helpers |
| `src/components/AuthenticatedApp.jsx` | Onboarding gate, profile injection, session tracking, push prompt, morning popup, settings screen |
| `src/components/OptimizedCreateScreen.jsx` | Parent note field added |
| `src/index.css` | `.input-field` utility class |
| `public/sw.js` | Push + notification click handlers |
| `.env.example` | `VITE_VAPID_PUBLIC_KEY` added |
