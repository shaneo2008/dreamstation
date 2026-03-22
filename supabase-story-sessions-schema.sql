-- DreamStation — story_sessions table
-- Tracks every bedtime night: both co-creation and playback sessions.
-- Run this in Supabase SQL Editor.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.story_sessions (
  id                  uuid DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Who
  child_id            uuid REFERENCES public.child_profiles(id) ON DELETE CASCADE NOT NULL,
  user_id             uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,

  -- Night type
  night_type          text NOT NULL CHECK (night_type IN ('co_creation', 'playback')),
  is_comfort_story    boolean DEFAULT false,

  -- Playback fields (null on co_creation nights)
  source_story_id     uuid REFERENCES public.stories(id) ON DELETE SET NULL,
  source_story_title  text,
  playback_count_14d  integer,

  -- Co-creation fields (null on playback nights)
  story_prompt        text,
  themes              text[],
  villain_appeared    boolean,

  -- Shared
  parent_note         text,

  created_at          timestamp with time zone DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_story_sessions_child_id
  ON public.story_sessions(child_id);

CREATE INDEX IF NOT EXISTS idx_story_sessions_user_id
  ON public.story_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_story_sessions_created_at
  ON public.story_sessions(created_at DESC);

-- Composite index used by the 14-day playback count query
CREATE INDEX IF NOT EXISTS idx_story_sessions_source_story_created
  ON public.story_sessions(source_story_id, created_at DESC)
  WHERE source_story_id IS NOT NULL;

-- RLS
ALTER TABLE public.story_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents can view their own sessions" ON public.story_sessions;
CREATE POLICY "Parents can view their own sessions"
  ON public.story_sessions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Parents can insert their own sessions" ON public.story_sessions;
CREATE POLICY "Parents can insert their own sessions"
  ON public.story_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Parents can update their own sessions" ON public.story_sessions;
CREATE POLICY "Parents can update their own sessions"
  ON public.story_sessions FOR UPDATE
  USING (auth.uid() = user_id);
