-- DreamStation — morning_reactions table
-- Stores AI-generated morning observations and parent reactions.
-- Schema matches the v2 morning reflection workflow (3 structured observations).
-- Run this in Supabase SQL Editor.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.morning_reactions (
  id              uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  child_id        uuid REFERENCES public.child_profiles(id) ON DELETE CASCADE NOT NULL,
  user_id         uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  session_id      uuid REFERENCES public.story_sessions(id) ON DELETE SET NULL,
  night_type      text CHECK (night_type IN ('co_creation', 'playback')),

  -- AI-generated observations: [{type: "THEME"|"PATTERN"|"LANGUAGE", text: "..."}]
  observations    jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Parent reactions (parallel array): ["noticed"|"unsure"|"didnt_see"|null]
  reactions       jsonb NOT NULL DEFAULT '[]'::jsonb,

  skipped         boolean DEFAULT false,
  generated_at    timestamp with time zone DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_morning_reactions_child_id
  ON public.morning_reactions(child_id);
CREATE INDEX IF NOT EXISTS idx_morning_reactions_user_id
  ON public.morning_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_morning_reactions_generated_at
  ON public.morning_reactions(generated_at DESC);

-- RLS
ALTER TABLE public.morning_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents can view their own morning reactions" ON public.morning_reactions;
CREATE POLICY "Parents can view their own morning reactions"
  ON public.morning_reactions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Parents can update their own morning reactions" ON public.morning_reactions;
CREATE POLICY "Parents can update their own morning reactions"
  ON public.morning_reactions FOR UPDATE
  USING (auth.uid() = user_id);

-- n8n inserts via service role key (bypasses RLS), but adding for completeness
DROP POLICY IF EXISTS "Parents can insert their own morning reactions" ON public.morning_reactions;
CREATE POLICY "Parents can insert their own morning reactions"
  ON public.morning_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
