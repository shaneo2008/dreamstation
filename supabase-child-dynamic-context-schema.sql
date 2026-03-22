-- DreamStation — child_dynamic_context table
-- Stores evolving context about a child (fears, stressors, characters/allies).
-- Updated by n8n workflows or parent input over time.
-- Run this in Supabase SQL Editor.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.child_dynamic_context (
  id                uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  child_id          uuid REFERENCES public.child_profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  fear_flags        text[],
  standing_fears    text,
  current_stressors text,
  characters        jsonb DEFAULT '[]'::jsonb,
  updated_at        timestamp with time zone DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_child_dynamic_context_child_id
  ON public.child_dynamic_context(child_id);

-- RLS
ALTER TABLE public.child_dynamic_context ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents can view their child context" ON public.child_dynamic_context;
CREATE POLICY "Parents can view their child context"
  ON public.child_dynamic_context FOR SELECT
  USING (child_id IN (SELECT id FROM public.child_profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Parents can update their child context" ON public.child_dynamic_context;
CREATE POLICY "Parents can update their child context"
  ON public.child_dynamic_context FOR UPDATE
  USING (child_id IN (SELECT id FROM public.child_profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Parents can insert their child context" ON public.child_dynamic_context;
CREATE POLICY "Parents can insert their child context"
  ON public.child_dynamic_context FOR INSERT
  WITH CHECK (child_id IN (SELECT id FROM public.child_profiles WHERE user_id = auth.uid()));
