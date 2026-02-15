-- FanCast AI v2 Enhanced Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid REFERENCES auth.users(id) PRIMARY KEY,
  email text,
  full_name text,
  tier text DEFAULT 'listener' CHECK (tier IN ('listener', 'creator')),
  credits integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Stories table
CREATE TABLE IF NOT EXISTS public.stories (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  source_url text, -- AO3, Wattpad, etc.
  source_type text, -- 'ao3', 'wattpad', 'original'
  genres text[], -- Array of genres
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'ready', 'published')),
  episode_count integer DEFAULT 6,
  episode_duration integer DEFAULT 20, -- minutes
  story_tone text DEFAULT 'Suspenseful',
  narrative_perspective text DEFAULT 'Third-Person Limited',
  include_cliffhangers boolean DEFAULT true,
  include_twist boolean DEFAULT false,
  resolve_plotlines boolean DEFAULT true,
  future_seasons boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Characters table with voice management
CREATE TABLE IF NOT EXISTS public.characters (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  story_id uuid REFERENCES public.stories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  voice_id text, -- Cartesia voice selection
  voice_settings jsonb DEFAULT '{}', -- pitch, speed, accent
  default_emotion text DEFAULT 'neutral',
  line_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Scripts table
CREATE TABLE IF NOT EXISTS public.scripts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  story_id uuid REFERENCES public.stories(id) ON DELETE CASCADE,
  title text NOT NULL,
  episode_number integer DEFAULT 1,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'editing', 'ready', 'generated')),
  total_lines integer DEFAULT 0,
  estimated_duration integer, -- minutes
  credits_required integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Script lines table - Core of the script editor
CREATE TABLE IF NOT EXISTS public.script_lines (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  script_id uuid REFERENCES public.scripts(id) ON DELETE CASCADE,
  line_number integer NOT NULL,
  character_id uuid REFERENCES public.characters(id),
  speaker_name text, -- For narrator or unnamed characters
  line_type text DEFAULT 'dialogue' CHECK (line_type IN ('dialogue', 'narration', 'stage_direction')),
  text_content text NOT NULL,
  emotion_type text DEFAULT 'neutral' CHECK (emotion_type IN ('whisper', 'shout', 'happy', 'sad', 'angry', 'scared', 'excited', 'neutral')),
  emotion_intensity text DEFAULT 'medium' CHECK (emotion_intensity IN ('low', 'medium', 'high')),
  voice_settings jsonb DEFAULT '{}', -- custom parameters for this line
  tts_annotations jsonb DEFAULT '{}', -- pace, emphasis, pauses
  audio_preview_url text, -- individual line preview
  is_generated boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(script_id, line_number)
);

-- Episodes table for generated audio
CREATE TABLE IF NOT EXISTS public.episodes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  script_id uuid REFERENCES public.scripts(id) ON DELETE CASCADE,
  episode_number integer NOT NULL,
  title text,
  audio_url text, -- S3 URL for final episode
  duration_seconds integer,
  file_size_bytes bigint,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'ready', 'failed')),
  generation_started_at timestamp with time zone,
  generation_completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Credit transactions table
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  amount integer NOT NULL, -- positive for purchases, negative for usage
  transaction_type text NOT NULL CHECK (transaction_type IN ('purchase', 'line_preview', 'episode_generation', 'refund')),
  story_id uuid REFERENCES public.stories(id),
  script_id uuid REFERENCES public.scripts(id),
  episode_count integer,
  stripe_payment_intent_id text, -- For purchase tracking
  description text,
  created_at timestamp with time zone DEFAULT now()
);

-- Audio previews table for line-by-line previews
CREATE TABLE IF NOT EXISTS public.audio_previews (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  script_line_id uuid REFERENCES public.script_lines(id) ON DELETE CASCADE,
  audio_url text NOT NULL, -- S3 URL for preview
  duration_seconds integer,
  file_size_bytes integer,
  expires_at timestamp with time zone DEFAULT (now() + interval '24 hours'), -- Temp previews expire
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS idx_characters_story_id ON public.characters(story_id);
CREATE INDEX IF NOT EXISTS idx_scripts_story_id ON public.scripts(story_id);
CREATE INDEX IF NOT EXISTS idx_script_lines_script_id ON public.script_lines(script_id);
CREATE INDEX IF NOT EXISTS idx_script_lines_line_number ON public.script_lines(script_id, line_number);
CREATE INDEX IF NOT EXISTS idx_episodes_script_id ON public.episodes(script_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_audio_previews_script_line_id ON public.audio_previews(script_line_id);

-- Row Level Security (RLS) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.script_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_previews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for stories
CREATE POLICY "Users can view own stories" ON public.stories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own stories" ON public.stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stories" ON public.stories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories" ON public.stories
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for characters
CREATE POLICY "Users can manage characters in own stories" ON public.characters
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.stories 
      WHERE stories.id = characters.story_id 
      AND stories.user_id = auth.uid()
    )
  );

-- RLS Policies for scripts
CREATE POLICY "Users can manage scripts in own stories" ON public.scripts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.stories 
      WHERE stories.id = scripts.story_id 
      AND stories.user_id = auth.uid()
    )
  );

-- RLS Policies for script_lines
CREATE POLICY "Users can manage script lines in own scripts" ON public.script_lines
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.scripts 
      JOIN public.stories ON stories.id = scripts.story_id
      WHERE scripts.id = script_lines.script_id 
      AND stories.user_id = auth.uid()
    )
  );

-- RLS Policies for episodes
CREATE POLICY "Users can manage episodes in own scripts" ON public.episodes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.scripts 
      JOIN public.stories ON stories.id = scripts.story_id
      WHERE scripts.id = episodes.script_id 
      AND stories.user_id = auth.uid()
    )
  );

-- RLS Policies for credit_transactions
CREATE POLICY "Users can view own credit transactions" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create credit transactions" ON public.credit_transactions
  FOR INSERT WITH CHECK (true); -- Allow system to create transactions

-- RLS Policies for audio_previews
CREATE POLICY "Users can manage audio previews for own script lines" ON public.audio_previews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.script_lines 
      JOIN public.scripts ON scripts.id = script_lines.script_id
      JOIN public.stories ON stories.id = scripts.story_id
      WHERE script_lines.id = audio_previews.script_line_id 
      AND stories.user_id = auth.uid()
    )
  );

-- Functions for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at timestamps
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON public.stories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON public.characters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scripts_updated_at BEFORE UPDATE ON public.scripts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_script_lines_updated_at BEFORE UPDATE ON public.script_lines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_episodes_updated_at BEFORE UPDATE ON public.episodes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update line count when script lines change
CREATE OR REPLACE FUNCTION update_script_line_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.scripts 
    SET total_lines = total_lines + 1 
    WHERE id = NEW.script_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.scripts 
    SET total_lines = total_lines - 1 
    WHERE id = OLD.script_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger to automatically update script line counts
CREATE TRIGGER update_script_line_count_trigger
  AFTER INSERT OR DELETE ON public.script_lines
  FOR EACH ROW EXECUTE FUNCTION update_script_line_count();

-- Function to update character line count
CREATE OR REPLACE FUNCTION update_character_line_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.character_id IS NOT NULL THEN
    UPDATE public.characters 
    SET line_count = line_count + 1 
    WHERE id = NEW.character_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.character_id IS NOT NULL THEN
    UPDATE public.characters 
    SET line_count = line_count - 1 
    WHERE id = OLD.character_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle character assignment changes
    IF OLD.character_id IS NOT NULL AND OLD.character_id != NEW.character_id THEN
      UPDATE public.characters 
      SET line_count = line_count - 1 
      WHERE id = OLD.character_id;
    END IF;
    IF NEW.character_id IS NOT NULL AND OLD.character_id != NEW.character_id THEN
      UPDATE public.characters 
      SET line_count = line_count + 1 
      WHERE id = NEW.character_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger to automatically update character line counts
CREATE TRIGGER update_character_line_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.script_lines
  FOR EACH ROW EXECUTE FUNCTION update_character_line_count();
