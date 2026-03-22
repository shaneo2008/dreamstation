-- DreamStation — weekly_briefs table
-- Stores AI-generated weekly parent briefs.
-- Run this in Supabase SQL Editor.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.weekly_briefs (
  id                  uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  child_id            uuid REFERENCES public.child_profiles(id) ON DELETE CASCADE NOT NULL,
  user_id             uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  brief_text          text NOT NULL,
  week_start          date NOT NULL,
  total_nights        integer,
  co_creation_nights  integer,
  playback_nights     integer,
  status              text DEFAULT 'delivered' CHECK (status IN ('pending', 'delivered', 'read')),
  created_at          timestamp with time zone DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_weekly_briefs_child_id
  ON public.weekly_briefs(child_id);
CREATE INDEX IF NOT EXISTS idx_weekly_briefs_user_id
  ON public.weekly_briefs(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_briefs_created_at
  ON public.weekly_briefs(created_at DESC);

-- RLS
ALTER TABLE public.weekly_briefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents can view their own weekly briefs" ON public.weekly_briefs;
CREATE POLICY "Parents can view their own weekly briefs"
  ON public.weekly_briefs FOR SELECT
  USING (auth.uid() = user_id);
