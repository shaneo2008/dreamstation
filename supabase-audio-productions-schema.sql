-- FanCast AI v2 - Audio Productions Schema
-- Run this AFTER supabase-schema.sql and supabase-ai-generation-schema.sql

-- Audio productions table for storing complete TTS audio generations
CREATE TABLE IF NOT EXISTS public.audio_productions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  script_id uuid REFERENCES public.scripts(id) ON DELETE CASCADE,
  
  -- Production metadata
  title text NOT NULL,
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  
  -- Audio file information
  audio_url text, -- S3 URL to the final concatenated audio file
  audio_format text DEFAULT 'wav' CHECK (audio_format IN ('wav', 'mp3', 'ogg')),
  audio_duration decimal(10,2), -- Total duration in seconds
  file_size_bytes bigint,
  
  -- Generation settings
  voice_settings jsonb DEFAULT '{}', -- Voice assignments per character
  generation_settings jsonb DEFAULT '{}', -- Speed, quality, etc.
  cartesia_settings jsonb DEFAULT '{}', -- Cartesia-specific settings
  
  -- Progress tracking
  progress integer DEFAULT 0, -- 0-100 percentage
  total_lines integer,
  processed_lines integer DEFAULT 0,
  current_step text,
  error_message text,
  
  -- Timing and synchronization
  timing_metadata jsonb, -- Complete timing data for script sync
  has_timing_data boolean DEFAULT false,
  
  -- Generation job tracking
  n8n_execution_id text, -- n8n workflow execution ID
  generation_job_id uuid REFERENCES public.ai_generation_jobs(id) ON DELETE SET NULL,
  
  -- Timestamps
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Audio production lines table for individual line audio files and timing
CREATE TABLE IF NOT EXISTS public.audio_production_lines (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  production_id uuid REFERENCES public.audio_productions(id) ON DELETE CASCADE,
  script_line_id uuid REFERENCES public.script_lines(id) ON DELETE CASCADE,
  
  -- Line audio information
  line_audio_url text, -- S3 URL to individual line audio file
  line_duration decimal(6,3), -- Duration in seconds (up to 999.999 seconds)
  
  -- Timing in final production
  start_time decimal(10,3), -- Start time in final audio (seconds)
  end_time decimal(10,3), -- End time in final audio (seconds)
  
  -- Generation details
  voice_used text, -- Cartesia voice ID used
  emotion_applied text, -- Emotion/style applied
  generation_settings jsonb DEFAULT '{}', -- Line-specific settings
  
  -- Processing status
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  retry_count integer DEFAULT 0,
  
  -- Cartesia API details
  cartesia_request_id text, -- Cartesia API request ID for debugging
  cartesia_response_metadata jsonb DEFAULT '{}',
  
  -- Quality metrics
  audio_quality_score decimal(3,2), -- 0.00-1.00 quality score
  needs_regeneration boolean DEFAULT false,
  
  -- Timestamps
  processed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Voice assignments table for character-to-voice mappings
CREATE TABLE IF NOT EXISTS public.voice_assignments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  production_id uuid REFERENCES public.audio_productions(id) ON DELETE CASCADE,
  
  -- Character information
  character_name text NOT NULL,
  script_id uuid REFERENCES public.scripts(id) ON DELETE CASCADE,
  
  -- Voice settings
  cartesia_voice_id text NOT NULL, -- Cartesia voice identifier
  voice_name text, -- Human-readable voice name
  voice_settings jsonb DEFAULT '{}', -- Voice-specific settings (pitch, speed, etc.)
  
  -- Emotion mappings
  emotion_mappings jsonb DEFAULT '{}', -- Map script emotions to Cartesia emotions
  default_emotion text DEFAULT 'neutral',
  
  -- Usage statistics
  lines_count integer DEFAULT 0, -- Number of lines using this voice
  total_duration decimal(10,2) DEFAULT 0, -- Total audio duration for this voice
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Ensure unique character per production
  UNIQUE(production_id, character_name)
);

-- Audio production templates for reusable settings
CREATE TABLE IF NOT EXISTS public.audio_production_templates (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Template metadata
  name text NOT NULL,
  description text,
  is_default boolean DEFAULT false,
  is_public boolean DEFAULT false, -- Allow sharing templates
  
  -- Template settings
  voice_settings jsonb DEFAULT '{}', -- Default voice assignments
  generation_settings jsonb DEFAULT '{}', -- Default generation settings
  cartesia_settings jsonb DEFAULT '{}', -- Default Cartesia settings
  
  -- Usage statistics
  usage_count integer DEFAULT 0,
  last_used_at timestamp with time zone,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_audio_productions_user_id ON public.audio_productions(user_id);
CREATE INDEX IF NOT EXISTS idx_audio_productions_script_id ON public.audio_productions(script_id);
CREATE INDEX IF NOT EXISTS idx_audio_productions_status ON public.audio_productions(status);
CREATE INDEX IF NOT EXISTS idx_audio_productions_created_at ON public.audio_productions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audio_production_lines_production_id ON public.audio_production_lines(production_id);
CREATE INDEX IF NOT EXISTS idx_audio_production_lines_script_line_id ON public.audio_production_lines(script_line_id);
CREATE INDEX IF NOT EXISTS idx_audio_production_lines_status ON public.audio_production_lines(status);
CREATE INDEX IF NOT EXISTS idx_audio_production_lines_timing ON public.audio_production_lines(start_time, end_time);

CREATE INDEX IF NOT EXISTS idx_voice_assignments_production_id ON public.voice_assignments(production_id);
CREATE INDEX IF NOT EXISTS idx_voice_assignments_character ON public.voice_assignments(character_name);

CREATE INDEX IF NOT EXISTS idx_audio_production_templates_user_id ON public.audio_production_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_audio_production_templates_public ON public.audio_production_templates(is_public) WHERE is_public = true;

-- Enable Row Level Security
ALTER TABLE public.audio_productions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_production_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_production_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audio_productions
CREATE POLICY "Users can view own audio productions" ON public.audio_productions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own audio productions" ON public.audio_productions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own audio productions" ON public.audio_productions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own audio productions" ON public.audio_productions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for audio_production_lines
CREATE POLICY "Users can manage audio production lines for own productions" ON public.audio_production_lines
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.audio_productions 
      WHERE audio_productions.id = audio_production_lines.production_id 
      AND audio_productions.user_id = auth.uid()
    )
  );

-- RLS Policies for voice_assignments
CREATE POLICY "Users can manage voice assignments for own productions" ON public.voice_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.audio_productions 
      WHERE audio_productions.id = voice_assignments.production_id 
      AND audio_productions.user_id = auth.uid()
    )
  );

-- RLS Policies for audio_production_templates
CREATE POLICY "Users can view own templates and public templates" ON public.audio_production_templates
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create own templates" ON public.audio_production_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON public.audio_production_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON public.audio_production_templates
  FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updated_at timestamps
CREATE TRIGGER update_audio_productions_updated_at 
  BEFORE UPDATE ON public.audio_productions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voice_assignments_updated_at 
  BEFORE UPDATE ON public.voice_assignments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audio_production_templates_updated_at 
  BEFORE UPDATE ON public.audio_production_templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate production progress
CREATE OR REPLACE FUNCTION calculate_production_progress(production_id_param uuid)
RETURNS integer AS $$
DECLARE
  total_lines integer;
  completed_lines integer;
BEGIN
  SELECT COUNT(*) INTO total_lines 
  FROM public.audio_production_lines 
  WHERE production_id = production_id_param;
  
  SELECT COUNT(*) INTO completed_lines 
  FROM public.audio_production_lines 
  WHERE production_id = production_id_param AND status = 'completed';
  
  IF total_lines = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND((completed_lines::decimal / total_lines::decimal) * 100);
END;
$$ language 'plpgsql';

-- Function to update production progress automatically
CREATE OR REPLACE FUNCTION update_production_progress()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.audio_productions 
  SET 
    progress = calculate_production_progress(NEW.production_id),
    processed_lines = (
      SELECT COUNT(*) 
      FROM public.audio_production_lines 
      WHERE production_id = NEW.production_id AND status = 'completed'
    ),
    updated_at = now()
  WHERE id = NEW.production_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update production progress when lines complete
CREATE TRIGGER update_production_progress_trigger
  AFTER UPDATE ON public.audio_production_lines
  FOR EACH ROW 
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_production_progress();

-- Function to generate timing metadata JSON
CREATE OR REPLACE FUNCTION generate_timing_metadata(production_id_param uuid)
RETURNS jsonb AS $$
DECLARE
  timing_data jsonb;
  total_duration decimal(10,3);
BEGIN
  -- Get total duration
  SELECT audio_duration INTO total_duration
  FROM public.audio_productions
  WHERE id = production_id_param;
  
  -- Build timing metadata JSON
  SELECT jsonb_build_object(
    'total_duration', COALESCE(total_duration, 0),
    'lines', jsonb_agg(
      jsonb_build_object(
        'line_id', apl.script_line_id,
        'start_time', apl.start_time,
        'end_time', apl.end_time,
        'duration', apl.line_duration,
        'speaker', sl.speaker_name,
        'text', sl.text_content,
        'type', sl.line_type,
        'voice_used', apl.voice_used,
        'emotion_applied', apl.emotion_applied
      ) ORDER BY apl.start_time
    ),
    'metadata', jsonb_build_object(
      'total_lines', COUNT(*),
      'speakers', jsonb_agg(DISTINCT sl.speaker_name),
      'generated_at', now()
    )
  ) INTO timing_data
  FROM public.audio_production_lines apl
  JOIN public.script_lines sl ON sl.id = apl.script_line_id
  WHERE apl.production_id = production_id_param
  AND apl.status = 'completed';
  
  RETURN timing_data;
END;
$$ language 'plpgsql';

-- View for production dashboard
CREATE OR REPLACE VIEW public.audio_productions_dashboard AS
SELECT 
  ap.id,
  ap.user_id,
  ap.title,
  ap.status,
  ap.progress,
  ap.audio_duration,
  ap.total_lines,
  ap.processed_lines,
  ap.created_at,
  ap.completed_at,
  s.title as script_title,
  st.title as story_title,
  COUNT(apl.id) as line_count,
  COUNT(CASE WHEN apl.status = 'completed' THEN 1 END) as completed_lines_count,
  COUNT(CASE WHEN apl.status = 'failed' THEN 1 END) as failed_lines_count,
  COUNT(DISTINCT va.character_name) as character_count
FROM public.audio_productions ap
JOIN public.scripts s ON s.id = ap.script_id
JOIN public.stories st ON st.id = s.story_id
LEFT JOIN public.audio_production_lines apl ON apl.production_id = ap.id
LEFT JOIN public.voice_assignments va ON va.production_id = ap.id
GROUP BY ap.id, ap.user_id, ap.title, ap.status, ap.progress, ap.audio_duration, 
         ap.total_lines, ap.processed_lines, ap.created_at, ap.completed_at,
         s.title, st.title;

-- Sample voice assignments for common characters
-- NOTE: Sample data removed to avoid foreign key constraint issues
-- Templates can be created via the application after users are authenticated

-- INSERT INTO public.audio_production_templates (user_id, name, description, is_default, is_public, voice_settings, generation_settings) 
-- VALUES 
--   (
--     'real-user-uuid-here', -- Replace with actual user UUID
--     'Default Fantasy Template',
--     'Standard voice assignments for fantasy stories',
--     true,
--     true,
--     '{
--       "narrator": {"voice_id": "narrator_default", "emotion_mappings": {"neutral": "calm", "excited": "enthusiastic"}},
--       "protagonist": {"voice_id": "hero_voice", "emotion_mappings": {"happy": "cheerful", "sad": "melancholy"}},
--       "antagonist": {"voice_id": "villain_voice", "emotion_mappings": {"angry": "menacing", "neutral": "cold"}}
--     }',
--     '{
--       "audio_format": "wav",
--       "sample_rate": 22050,
--       "quality": "high",
--       "speed_multiplier": 1.0,
--       "pause_between_lines": 0.5
--     }'
--   ) ON CONFLICT DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE public.audio_productions IS 'Complete TTS audio productions for scripts';
COMMENT ON TABLE public.audio_production_lines IS 'Individual line audio files and timing data';
COMMENT ON TABLE public.voice_assignments IS 'Character-to-voice mappings for productions';
COMMENT ON TABLE public.audio_production_templates IS 'Reusable voice and generation settings templates';

COMMENT ON COLUMN public.audio_productions.timing_metadata IS 'Complete timing data JSON for script synchronization in audio player';
COMMENT ON COLUMN public.audio_productions.voice_settings IS 'Character voice assignments and settings';
COMMENT ON COLUMN public.audio_productions.generation_settings IS 'Audio generation parameters (quality, format, etc.)';
COMMENT ON COLUMN public.audio_productions.cartesia_settings IS 'Cartesia TTS API specific settings';

COMMENT ON COLUMN public.audio_production_lines.start_time IS 'Start time in final concatenated audio (seconds)';
COMMENT ON COLUMN public.audio_production_lines.end_time IS 'End time in final concatenated audio (seconds)';
COMMENT ON COLUMN public.audio_production_lines.line_duration IS 'Duration of this individual line (seconds)';
