-- FanCast AI v2 - AI-Assisted Creation Schema Additions
-- Run this AFTER supabase-ai-generation-schema.sql

-- Update generation_method to include ai_assisted
ALTER TABLE public.scripts DROP CONSTRAINT IF EXISTS scripts_generation_method_check;
ALTER TABLE public.scripts ADD CONSTRAINT scripts_generation_method_check 
  CHECK (generation_method IN ('manual', 'ai_generated', 'ai_assisted', 'hybrid'));

-- Add AI-assisted creation specific fields to scripts
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS creation_complexity text DEFAULT 'simple' 
  CHECK (creation_complexity IN ('simple', 'ai_assisted', 'hybrid'));
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS ai_assistance_level integer DEFAULT 1 
  CHECK (ai_assistance_level BETWEEN 1 AND 5);
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS creation_preferences jsonb DEFAULT '{}';

-- Story concepts table for AI-assisted creation
CREATE TABLE IF NOT EXISTS public.story_concepts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  story_id uuid REFERENCES public.stories(id) ON DELETE CASCADE,
  
  -- User input
  initial_concept text NOT NULL,
  genre text,
  target_audience text,
  tone_style text,
  content_guidelines text,
  
  -- Structure preferences
  target_episodes integer DEFAULT 1,
  episode_length_minutes integer DEFAULT 10,
  story_arc_outline text,
  key_plot_points text[],
  
  -- AI processing results
  expanded_concept text,
  character_suggestions jsonb DEFAULT '[]',
  plot_structure jsonb DEFAULT '{}',
  ai_development_notes text,
  
  -- Metadata
  development_stage text DEFAULT 'concept' CHECK (development_stage IN ('concept', 'developing', 'structured', 'scripting', 'completed')),
  ai_processing_time_seconds integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Character development table for AI-assisted creation
CREATE TABLE IF NOT EXISTS public.character_development (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  story_concept_id uuid REFERENCES public.story_concepts(id) ON DELETE CASCADE,
  character_id uuid REFERENCES public.characters(id) ON DELETE SET NULL,
  
  -- User input
  character_name text NOT NULL,
  character_role text, -- 'protagonist', 'antagonist', 'supporting', etc.
  basic_description text,
  personality_traits text[],
  relationships jsonb DEFAULT '{}',
  
  -- AI development
  ai_backstory text,
  ai_personality_analysis text,
  ai_speaking_patterns text,
  ai_character_arc text,
  suggested_voice_characteristics jsonb DEFAULT '{}',
  
  -- Voice assignment
  assigned_voice_id text,
  default_emotion text DEFAULT 'Neutral',
  emotion_range text[] DEFAULT ARRAY['Neutral'],
  
  -- Metadata
  development_confidence decimal(3,2) DEFAULT 0.8,
  user_approved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Episode structure for AI-assisted creation
CREATE TABLE IF NOT EXISTS public.episode_structure (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  story_concept_id uuid REFERENCES public.story_concepts(id) ON DELETE CASCADE,
  script_id uuid REFERENCES public.scripts(id) ON DELETE SET NULL,
  
  episode_number integer NOT NULL,
  episode_title text,
  episode_summary text,
  target_length_minutes integer DEFAULT 10,
  
  -- AI-generated structure
  scene_breakdown jsonb DEFAULT '[]',
  character_focus jsonb DEFAULT '{}',
  plot_points text[],
  emotional_arc text,
  cliffhanger_setup text,
  
  -- Generation metadata
  ai_structure_confidence decimal(3,2) DEFAULT 0.8,
  generated_at timestamp with time zone,
  user_reviewed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- AI creation stages tracking (for complex multi-step workflows)
CREATE TABLE IF NOT EXISTS public.ai_creation_stages (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  ai_generation_job_id uuid REFERENCES public.ai_generation_jobs(id) ON DELETE CASCADE,
  story_concept_id uuid REFERENCES public.story_concepts(id) ON DELETE CASCADE,
  
  stage_name text NOT NULL, -- 'concept_expansion', 'character_development', 'plot_structuring', 'script_generation'
  stage_order integer NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
  
  -- Stage input/output
  input_data jsonb DEFAULT '{}',
  output_data jsonb DEFAULT '{}',
  ai_prompts_used text[],
  processing_notes text,
  
  -- Timing and quality
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  processing_time_seconds integer DEFAULT 0,
  quality_score decimal(3,2) DEFAULT 0.8,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Update ai_generation_jobs to support AI-assisted creation
ALTER TABLE public.ai_generation_jobs DROP CONSTRAINT IF EXISTS ai_generation_jobs_source_url_check;
ALTER TABLE public.ai_generation_jobs ALTER COLUMN source_url DROP NOT NULL;
ALTER TABLE public.ai_generation_jobs ADD COLUMN IF NOT EXISTS creation_type text DEFAULT 'url_import' 
  CHECK (creation_type IN ('url_import', 'ai_assisted_creation'));
ALTER TABLE public.ai_generation_jobs ADD COLUMN IF NOT EXISTS story_concept_id uuid REFERENCES public.story_concepts(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_story_concepts_user_id ON public.story_concepts(user_id);
CREATE INDEX IF NOT EXISTS idx_story_concepts_development_stage ON public.story_concepts(development_stage);
CREATE INDEX IF NOT EXISTS idx_character_development_story_concept ON public.character_development(story_concept_id);
CREATE INDEX IF NOT EXISTS idx_character_development_approved ON public.character_development(user_approved);
CREATE INDEX IF NOT EXISTS idx_episode_structure_story_concept ON public.episode_structure(story_concept_id);
CREATE INDEX IF NOT EXISTS idx_episode_structure_episode_number ON public.episode_structure(story_concept_id, episode_number);
CREATE INDEX IF NOT EXISTS idx_ai_creation_stages_job_id ON public.ai_creation_stages(ai_generation_job_id);
CREATE INDEX IF NOT EXISTS idx_ai_creation_stages_stage_order ON public.ai_creation_stages(ai_generation_job_id, stage_order);

-- RLS Policies for AI-assisted creation tables
ALTER TABLE public.story_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_development ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episode_structure ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_creation_stages ENABLE ROW LEVEL SECURITY;

-- Story concepts policies
CREATE POLICY "Users can view their own story concepts" ON public.story_concepts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own story concepts" ON public.story_concepts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own story concepts" ON public.story_concepts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own story concepts" ON public.story_concepts
  FOR DELETE USING (auth.uid() = user_id);

-- Character development policies
CREATE POLICY "Users can view character development for their stories" ON public.character_development
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.story_concepts sc 
      WHERE sc.id = story_concept_id AND sc.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert character development for their stories" ON public.character_development
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.story_concepts sc 
      WHERE sc.id = story_concept_id AND sc.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update character development for their stories" ON public.character_development
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.story_concepts sc 
      WHERE sc.id = story_concept_id AND sc.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete character development for their stories" ON public.character_development
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.story_concepts sc 
      WHERE sc.id = story_concept_id AND sc.user_id = auth.uid()
    )
  );

-- Episode structure policies (similar pattern)
CREATE POLICY "Users can view episode structure for their stories" ON public.episode_structure
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.story_concepts sc 
      WHERE sc.id = story_concept_id AND sc.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert episode structure for their stories" ON public.episode_structure
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.story_concepts sc 
      WHERE sc.id = story_concept_id AND sc.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update episode structure for their stories" ON public.episode_structure
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.story_concepts sc 
      WHERE sc.id = story_concept_id AND sc.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete episode structure for their stories" ON public.episode_structure
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.story_concepts sc 
      WHERE sc.id = story_concept_id AND sc.user_id = auth.uid()
    )
  );

-- AI creation stages policies
CREATE POLICY "Users can view AI creation stages for their jobs" ON public.ai_creation_stages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ai_generation_jobs agj 
      JOIN public.story_concepts sc ON sc.id = agj.story_concept_id
      WHERE agj.id = ai_generation_job_id AND sc.user_id = auth.uid()
    )
  );

-- Triggers for updated_at timestamps
CREATE TRIGGER update_story_concepts_updated_at 
  BEFORE UPDATE ON public.story_concepts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_character_development_updated_at 
  BEFORE UPDATE ON public.character_development 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_episode_structure_updated_at 
  BEFORE UPDATE ON public.episode_structure 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_creation_stages_updated_at 
  BEFORE UPDATE ON public.ai_creation_stages 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create default episode structure when story concept is created
CREATE OR REPLACE FUNCTION create_default_episode_structure()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default episode structure based on target_episodes
  INSERT INTO public.episode_structure (
    story_concept_id,
    episode_number,
    episode_title,
    target_length_minutes
  )
  SELECT 
    NEW.id,
    generate_series(1, COALESCE(NEW.target_episodes, 1)),
    'Episode ' || generate_series(1, COALESCE(NEW.target_episodes, 1)),
    COALESCE(NEW.episode_length_minutes, 10);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_episode_structure_on_concept
  AFTER INSERT ON public.story_concepts
  FOR EACH ROW EXECUTE FUNCTION create_default_episode_structure();
