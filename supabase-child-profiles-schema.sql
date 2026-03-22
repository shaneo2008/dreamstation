-- DreamStation — child_profiles table
-- DOCUMENTATION ONLY — this table was created directly in Supabase.
-- Run only if recreating from scratch (all IF NOT EXISTS guards are safe).

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.child_profiles (
  id                      uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id                 uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name                    text NOT NULL,
  age                     integer NOT NULL,
  gender_pronoun          text,
  personality_description text,
  neuro_profile           text,
  neuro_flags             text[],
  interests               text[],
  family_structure        text,
  parent_context          text,
  mode                    text NOT NULL DEFAULT 'just_stories'
                          CHECK (mode IN ('just_stories', 'full_programme')),
  onboarding_completed    boolean DEFAULT false,
  created_at              timestamp with time zone DEFAULT now(),
  updated_at              timestamp with time zone DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_child_profiles_user_id ON public.child_profiles(user_id);

-- RLS
ALTER TABLE public.child_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents can view their own children" ON public.child_profiles;
CREATE POLICY "Parents can view their own children"
  ON public.child_profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Parents can insert their own children" ON public.child_profiles;
CREATE POLICY "Parents can insert their own children"
  ON public.child_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Parents can update their own children" ON public.child_profiles;
CREATE POLICY "Parents can update their own children"
  ON public.child_profiles FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Parents can delete their own children" ON public.child_profiles;
CREATE POLICY "Parents can delete their own children"
  ON public.child_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- updated_at trigger (assumes update_updated_at_column() function exists from other schemas)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_child_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_child_profiles_updated_at
      BEFORE UPDATE ON public.child_profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
