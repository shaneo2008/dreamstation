-- DreamStation Full Programme Schema Migration
-- Run this in your Supabase SQL Editor
-- Version: 1.0 | March 2026
-- Prerequisites: existing schema (users, stories, scripts, etc.) must already exist
-- This adds 7 new tables for the Full Programme trial

-- ============================================================
-- 1.1 — child_profiles
-- Core child identity. One per child, multiple children per parent account.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.child_profiles (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  age integer NOT NULL CHECK (age >= 3 AND age <= 12),
  gender_pronoun text, -- 'Girl' | 'Boy' | 'We use they/them' | 'Skip this'
  personality_description text, -- most valuable intake field, never truncate
  neuro_profile text, -- free text notes
  neuro_flags text[] DEFAULT '{}', -- array of selected neuro checklist items
  interests text[] DEFAULT '{}',
  family_structure text,
  parent_context text,
  mode text NOT NULL DEFAULT 'just_stories' CHECK (mode IN ('just_stories', 'full_programme')),
  onboarding_completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_child_profiles_user_id ON public.child_profiles(user_id);

-- ============================================================
-- 1.2 — child_dynamic_context
-- Editable context that changes over time. One per child.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.child_dynamic_context (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  child_id uuid REFERENCES public.child_profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  allies jsonb DEFAULT '[]', -- array of { name, relationship }
  pets jsonb DEFAULT '[]', -- array of { name, type }
  current_stressors text, -- dynamic, editable in Settings
  fear_flags text[] DEFAULT '{}', -- array of selected fear categories
  standing_fears text, -- free text
  social_difficulty text, -- dynamic, editable in Settings
  bedtime_description text, -- qualitative baseline, captured at onboarding
  night_waking_frequency text, -- 'Almost every night' | 'A few times a week' | etc.
  stressors_updated_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_child_dynamic_context_child_id ON public.child_dynamic_context(child_id);

-- ============================================================
-- 1.3 — story_sessions
-- One record per story generation. Links to existing stories table.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.story_sessions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  child_id uuid REFERENCES public.child_profiles(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  parent_note text, -- optional nightly parent context
  story_prompt text, -- child's story input
  is_comfort_story boolean DEFAULT false,
  source_story_id uuid, -- nullable, for comfort story replays
  story_id uuid, -- nullable, FK to stories table once generated
  mode text DEFAULT 'co-creation' CHECK (mode IN ('co-creation', 'playback')),
  villain_appeared boolean, -- populated post-generation
  superpower_used boolean, -- populated post-generation
  themes text[] DEFAULT '{}', -- populated post-generation
  story_resolved_positively boolean, -- populated post-generation
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_story_sessions_child_id ON public.story_sessions(child_id);
CREATE INDEX IF NOT EXISTS idx_story_sessions_user_id ON public.story_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_story_sessions_created_at ON public.story_sessions(created_at DESC);

-- ============================================================
-- 1.4 — clinical_baselines
-- Baseline + Week 3 re-capture. Multiple records per child.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clinical_baselines (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  child_id uuid REFERENCES public.child_profiles(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bedtime_resistance integer NOT NULL CHECK (bedtime_resistance >= 1 AND bedtime_resistance <= 10),
  sleep_onset_latency integer NOT NULL CHECK (sleep_onset_latency >= 1 AND sleep_onset_latency <= 10),
  night_waking_frequency integer NOT NULL CHECK (night_waking_frequency >= 1 AND night_waking_frequency <= 10),
  parental_stress integer NOT NULL CHECK (parental_stress >= 1 AND parental_stress <= 10),
  morning_mood integer NOT NULL CHECK (morning_mood >= 1 AND morning_mood <= 10),
  week_number integer NOT NULL DEFAULT 0, -- 0 = onboarding baseline, 3 = Week 3 re-capture
  captured_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clinical_baselines_child_id ON public.clinical_baselines(child_id);

-- ============================================================
-- 1.5 — morning_reactions
-- 3 observations + 3 reactions per story night. One record per session.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.morning_reactions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  child_id uuid REFERENCES public.child_profiles(id) ON DELETE CASCADE NOT NULL,
  session_id uuid REFERENCES public.story_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  observations jsonb NOT NULL DEFAULT '[]', -- array of 3: { type, text }
  reactions jsonb DEFAULT '[]', -- array of 3: 'noticed' | 'not_sure' | 'didnt_see'
  parent_note text, -- optional post-reaction note, max 300 chars
  skipped boolean DEFAULT false,
  partially_complete boolean DEFAULT false,
  generated_at timestamp with time zone DEFAULT now(),
  reacted_at timestamp with time zone -- set when parent completes reactions
);

CREATE INDEX IF NOT EXISTS idx_morning_reactions_child_id ON public.morning_reactions(child_id);
CREATE INDEX IF NOT EXISTS idx_morning_reactions_session_id ON public.morning_reactions(session_id);
CREATE INDEX IF NOT EXISTS idx_morning_reactions_generated_at ON public.morning_reactions(generated_at DESC);

-- ============================================================
-- 1.6 — weekly_briefs
-- One per child per week. Reverse chronological retrieval.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.weekly_briefs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  child_id uuid REFERENCES public.child_profiles(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_start_date date NOT NULL,
  week_end_date date NOT NULL,
  brief_content jsonb NOT NULL DEFAULT '{}', -- { summary, patterns (nullable), week_ahead, generated_at }
  session_count integer DEFAULT 0,
  delivered_at timestamp with time zone, -- when push notification sent
  read_at timestamp with time zone, -- when parent opened brief
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weekly_briefs_child_id ON public.weekly_briefs(child_id);
CREATE INDEX IF NOT EXISTS idx_weekly_briefs_week_start ON public.weekly_briefs(week_start_date DESC);

-- ============================================================
-- 1.7 — notification_preferences
-- One record per child per user. Stores push subscription + timing prefs.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  child_id uuid REFERENCES public.child_profiles(id) ON DELETE CASCADE NOT NULL,
  evening_reminder_time time DEFAULT '18:30',
  morning_reflection_time time DEFAULT '08:00',
  weekly_brief_day text DEFAULT 'sunday' CHECK (weekly_brief_day IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  weekly_brief_time time DEFAULT '19:30',
  push_subscription jsonb, -- Web Push subscription object
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, child_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_prefs_user_id ON public.notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_prefs_child_id ON public.notification_preferences(child_id);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE public.child_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_dynamic_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.morning_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- child_profiles: users can CRUD their own children
CREATE POLICY "Users can view own child profiles" ON public.child_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own child profiles" ON public.child_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own child profiles" ON public.child_profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own child profiles" ON public.child_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- child_dynamic_context: access via child ownership
CREATE POLICY "Users can manage dynamic context for own children" ON public.child_dynamic_context
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.child_profiles
      WHERE child_profiles.id = child_dynamic_context.child_id
      AND child_profiles.user_id = auth.uid()
    )
  );

-- story_sessions: users can CRUD their own sessions
CREATE POLICY "Users can view own story sessions" ON public.story_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own story sessions" ON public.story_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own story sessions" ON public.story_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- clinical_baselines: users can CRUD their own baselines
CREATE POLICY "Users can view own clinical baselines" ON public.clinical_baselines
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own clinical baselines" ON public.clinical_baselines
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- morning_reactions: users can view/update their own reactions
CREATE POLICY "Users can view own morning reactions" ON public.morning_reactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own morning reactions" ON public.morning_reactions
  FOR UPDATE USING (auth.uid() = user_id);
-- n8n inserts reactions via service role, but allow user insert too for flexibility
CREATE POLICY "Users can create own morning reactions" ON public.morning_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- weekly_briefs: users can view/update their own briefs
CREATE POLICY "Users can view own weekly briefs" ON public.weekly_briefs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own weekly briefs" ON public.weekly_briefs
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can create own weekly briefs" ON public.weekly_briefs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- notification_preferences: users can CRUD their own preferences
CREATE POLICY "Users can view own notification preferences" ON public.notification_preferences
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own notification preferences" ON public.notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notification preferences" ON public.notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notification preferences" ON public.notification_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- Triggers for updated_at (reuses existing function)
-- ============================================================
CREATE TRIGGER update_child_profiles_updated_at
  BEFORE UPDATE ON public.child_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_child_dynamic_context_updated_at
  BEFORE UPDATE ON public.child_dynamic_context
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Auto-update stressors_updated_at when current_stressors changes
-- ============================================================
CREATE OR REPLACE FUNCTION update_stressors_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.current_stressors IS DISTINCT FROM NEW.current_stressors THEN
    NEW.stressors_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stressors_updated_at
  BEFORE UPDATE ON public.child_dynamic_context
  FOR EACH ROW EXECUTE FUNCTION update_stressors_timestamp();

-- ============================================================
-- Helper: auto-create dynamic context when child profile is created
-- ============================================================
CREATE OR REPLACE FUNCTION create_child_dynamic_context()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.child_dynamic_context (child_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER auto_create_dynamic_context
  AFTER INSERT ON public.child_profiles
  FOR EACH ROW EXECUTE FUNCTION create_child_dynamic_context();

-- ============================================================
-- Helper: auto-create notification preferences when child profile is created
-- ============================================================
CREATE OR REPLACE FUNCTION create_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id, child_id)
  VALUES (NEW.user_id, NEW.id);
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER auto_create_notification_preferences
  AFTER INSERT ON public.child_profiles
  FOR EACH ROW EXECUTE FUNCTION create_notification_preferences();
