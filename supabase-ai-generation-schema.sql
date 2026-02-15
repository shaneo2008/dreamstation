-- FanCast AI v2 - AI Script Generation Schema Additions
-- Run this AFTER the main supabase-schema.sql

-- Add AI generation fields to scripts table
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS generation_method text DEFAULT 'manual' CHECK (generation_method IN ('manual', 'ai_generated', 'hybrid'));
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS source_url text;
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS ai_generation_job_id text;
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS generation_progress integer DEFAULT 0;
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS generation_error text;
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS estimated_completion timestamp with time zone;

-- Add AI metadata to script_lines table
ALTER TABLE public.script_lines ADD COLUMN IF NOT EXISTS ai_generated boolean DEFAULT false;
ALTER TABLE public.script_lines ADD COLUMN IF NOT EXISTS human_reviewed boolean DEFAULT false;
ALTER TABLE public.script_lines ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone;
ALTER TABLE public.script_lines ADD COLUMN IF NOT EXISTS ai_metadata jsonb DEFAULT '{}';
ALTER TABLE public.script_lines ADD COLUMN IF NOT EXISTS ai_confidence decimal(3,2) DEFAULT 0.8;
ALTER TABLE public.script_lines ADD COLUMN IF NOT EXISTS needs_review boolean DEFAULT false;

-- AI generation jobs table for tracking long-running processes
CREATE TABLE IF NOT EXISTS public.ai_generation_jobs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  story_id uuid REFERENCES public.stories(id) ON DELETE CASCADE,
  script_id uuid REFERENCES public.scripts(id) ON DELETE CASCADE,
  source_url text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  progress integer DEFAULT 0,
  total_steps integer DEFAULT 100,
  current_step text,
  error_message text,
  generation_params jsonb DEFAULT '{}',
  result_metadata jsonb DEFAULT '{}',
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- AI suggestions table for storing alternative options
CREATE TABLE IF NOT EXISTS public.ai_suggestions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  script_line_id uuid REFERENCES public.script_lines(id) ON DELETE CASCADE,
  suggestion_type text NOT NULL CHECK (suggestion_type IN ('emotion', 'character', 'text_alternative', 'voice_direction')),
  original_value text,
  suggested_value text NOT NULL,
  confidence decimal(3,2) DEFAULT 0.8,
  reasoning text,
  applied boolean DEFAULT false,
  applied_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Indexes for AI generation performance
CREATE INDEX IF NOT EXISTS idx_scripts_generation_method ON public.scripts(generation_method);
CREATE INDEX IF NOT EXISTS idx_scripts_ai_job_id ON public.scripts(ai_generation_job_id);
CREATE INDEX IF NOT EXISTS idx_script_lines_ai_generated ON public.script_lines(ai_generated);
CREATE INDEX IF NOT EXISTS idx_script_lines_needs_review ON public.script_lines(needs_review);
CREATE INDEX IF NOT EXISTS idx_script_lines_human_reviewed ON public.script_lines(human_reviewed);
CREATE INDEX IF NOT EXISTS idx_ai_generation_jobs_status ON public.ai_generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ai_generation_jobs_user_id ON public.ai_generation_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_script_line_id ON public.ai_suggestions(script_line_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_type ON public.ai_suggestions(suggestion_type);

-- RLS Policies for AI generation tables
ALTER TABLE public.ai_generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_generation_jobs
CREATE POLICY "Users can view own AI generation jobs" ON public.ai_generation_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own AI generation jobs" ON public.ai_generation_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI generation jobs" ON public.ai_generation_jobs
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for ai_suggestions
CREATE POLICY "Users can manage AI suggestions for own script lines" ON public.ai_suggestions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.script_lines 
      JOIN public.scripts ON scripts.id = script_lines.script_id
      JOIN public.stories ON stories.id = scripts.story_id
      WHERE script_lines.id = ai_suggestions.script_line_id 
      AND stories.user_id = auth.uid()
    )
  );

-- Triggers for AI generation timestamps
CREATE TRIGGER update_ai_generation_jobs_updated_at 
  BEFORE UPDATE ON public.ai_generation_jobs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update script status when AI generation completes
CREATE OR REPLACE FUNCTION update_script_on_ai_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.scripts 
    SET 
      status = 'ready',
      generation_progress = 100,
      estimated_completion = now()
    WHERE id = NEW.script_id;
  ELSIF NEW.status = 'failed' AND OLD.status != 'failed' THEN
    UPDATE public.scripts 
    SET 
      status = 'draft',
      generation_error = NEW.error_message
    WHERE id = NEW.script_id;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update script status based on AI job completion
CREATE TRIGGER update_script_on_ai_completion_trigger
  AFTER UPDATE ON public.ai_generation_jobs
  FOR EACH ROW EXECUTE FUNCTION update_script_on_ai_completion();

-- Function to calculate review progress
CREATE OR REPLACE FUNCTION calculate_review_progress(script_id_param uuid)
RETURNS decimal AS $$
DECLARE
  total_lines integer;
  reviewed_lines integer;
BEGIN
  SELECT COUNT(*) INTO total_lines 
  FROM public.script_lines 
  WHERE script_id = script_id_param AND ai_generated = true;
  
  SELECT COUNT(*) INTO reviewed_lines 
  FROM public.script_lines 
  WHERE script_id = script_id_param AND ai_generated = true AND human_reviewed = true;
  
  IF total_lines = 0 THEN
    RETURN 1.0;
  END IF;
  
  RETURN ROUND(reviewed_lines::decimal / total_lines::decimal, 2);
END;
$$ language 'plpgsql';

-- View for AI generation dashboard
CREATE OR REPLACE VIEW public.ai_generation_dashboard AS
SELECT 
  j.id as job_id,
  j.user_id,
  s.title as story_title,
  sc.title as script_title,
  j.source_url,
  j.status,
  j.progress,
  j.current_step,
  j.error_message,
  j.started_at,
  j.completed_at,
  calculate_review_progress(j.script_id) as review_progress,
  COUNT(sl.id) as total_lines,
  COUNT(CASE WHEN sl.human_reviewed THEN 1 END) as reviewed_lines,
  COUNT(CASE WHEN sl.needs_review THEN 1 END) as lines_needing_review
FROM public.ai_generation_jobs j
JOIN public.stories s ON s.id = j.story_id
JOIN public.scripts sc ON sc.id = j.script_id
LEFT JOIN public.script_lines sl ON sl.script_id = j.script_id AND sl.ai_generated = true
GROUP BY j.id, j.user_id, s.title, sc.title, j.source_url, j.status, j.progress, 
         j.current_step, j.error_message, j.started_at, j.completed_at, j.script_id;
