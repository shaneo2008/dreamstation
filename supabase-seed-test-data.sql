-- DreamStation — Seed test data for workflow testing
-- Run this in Supabase SQL Editor.
-- Creates story_sessions + child_dynamic_context for your first full_programme child.
-- After running, manually trigger both workflows in n8n to verify.
--
-- SAFE TO RE-RUN: deletes previous seed data first (tagged with 'seed-test' in parent_note).

-- Step 1: Find your first full_programme child
DO $$
DECLARE
  v_child_id uuid;
  v_user_id uuid;
  v_child_name text;
BEGIN
  SELECT id, user_id, name INTO v_child_id, v_user_id, v_child_name
  FROM public.child_profiles
  WHERE mode = 'full_programme' AND onboarding_completed = true
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_child_id IS NULL THEN
    -- Fall back to any child profile
    SELECT id, user_id, name INTO v_child_id, v_user_id, v_child_name
    FROM public.child_profiles
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  IF v_child_id IS NULL THEN
    RAISE EXCEPTION 'No child_profiles found. Create at least one child profile first.';
  END IF;

  RAISE NOTICE 'Seeding data for child: % (id: %)', v_child_name, v_child_id;

  -- Step 2: Clean previous seed data
  DELETE FROM public.story_sessions WHERE parent_note = '[seed-test]' AND child_id = v_child_id;
  DELETE FROM public.child_dynamic_context WHERE child_id = v_child_id;

  -- Step 3: Insert child_dynamic_context
  INSERT INTO public.child_dynamic_context (child_id, fear_flags, standing_fears, current_stressors, characters)
  VALUES (
    v_child_id,
    ARRAY['darkness', 'separation'],
    'Worried about being left alone at night. Occasionally mentions monsters.',
    'Started new school two weeks ago. Adjusting to new classroom and teacher.',
    '[{"name": "Captain Brave", "role": "ally"}, {"name": "Shadow King", "role": "villain"}, {"name": "Spark", "role": "pet companion"}]'::jsonb
  );

  -- Step 4: Insert 7 story_sessions across the past week
  -- Night 1 (6 days ago) — co-creation
  INSERT INTO public.story_sessions (child_id, user_id, night_type, is_comfort_story, story_prompt, themes, villain_appeared, parent_note, created_at)
  VALUES (v_child_id, v_user_id, 'co_creation', false,
    'A story about a brave knight who finds a lost star',
    ARRAY['bravery', 'exploration', 'loneliness'],
    true, '[seed-test]',
    (now()::date - interval '6 days') + interval '19 hours');

  -- Night 2 (5 days ago) — co-creation
  INSERT INTO public.story_sessions (child_id, user_id, night_type, is_comfort_story, story_prompt, themes, villain_appeared, parent_note, created_at)
  VALUES (v_child_id, v_user_id, 'co_creation', false,
    'The knight goes back to find the star a friend',
    ARRAY['friendship', 'returning', 'helping'],
    false, '[seed-test]',
    (now()::date - interval '5 days') + interval '19 hours');

  -- Night 3 (4 days ago) — playback (replayed night 1's story)
  INSERT INTO public.story_sessions (child_id, user_id, night_type, is_comfort_story, source_story_title, playback_count_14d, parent_note, created_at)
  VALUES (v_child_id, v_user_id, 'playback', true,
    'The Brave Knight and the Lost Star',
    1, '[seed-test]',
    (now()::date - interval '4 days') + interval '19 hours');

  -- Night 4 (3 days ago) — playback again (same story)
  INSERT INTO public.story_sessions (child_id, user_id, night_type, is_comfort_story, source_story_title, playback_count_14d, parent_note, created_at)
  VALUES (v_child_id, v_user_id, 'playback', true,
    'The Brave Knight and the Lost Star',
    2, '[seed-test]',
    (now()::date - interval '3 days') + interval '19 hours');

  -- Night 5 (2 days ago) — co-creation
  INSERT INTO public.story_sessions (child_id, user_id, night_type, is_comfort_story, story_prompt, themes, villain_appeared, parent_note, created_at)
  VALUES (v_child_id, v_user_id, 'co_creation', false,
    'A dragon who is scared of the dark and needs help',
    ARRAY['fear', 'darkness', 'empathy', 'helping'],
    false, '[seed-test]',
    (now()::date - interval '2 days') + interval '19 hours');

  -- Night 6 (yesterday!) — playback (this is the one morning reflection will pick up)
  INSERT INTO public.story_sessions (child_id, user_id, night_type, is_comfort_story, source_story_title, playback_count_14d, parent_note, created_at)
  VALUES (v_child_id, v_user_id, 'playback', true,
    'The Brave Knight and the Lost Star',
    3, '[seed-test]',
    (now()::date - interval '1 day') + interval '20 hours');

  -- Night 7 (also yesterday, co-creation — gives morning reflection a choice, it picks the latest)
  -- Commented out — uncomment if you want to test co-creation morning reflection instead
  /*
  INSERT INTO public.story_sessions (child_id, user_id, night_type, is_comfort_story, story_prompt, themes, villain_appeared, parent_note, created_at)
  VALUES (v_child_id, v_user_id, 'co_creation', false,
    'Spark the pet takes the knight on a secret mission',
    ARRAY['adventure', 'trust', 'secrets'],
    true, '[seed-test]',
    (now()::date - interval '1 day') + interval '20 hours 30 minutes');
  */

  RAISE NOTICE 'Seed complete: 6 sessions (3 co-creation, 3 playback), 1 dynamic context record.';
  RAISE NOTICE 'Last night session: PLAYBACK of "The Brave Knight and the Lost Star" (3rd replay in 14 days).';
  RAISE NOTICE 'Trigger morning reflection workflow manually in n8n to test.';

END $$;
