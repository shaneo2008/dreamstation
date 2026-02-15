-- Fix RLS Policies for Direct Script Access
-- This allows users to create and manage scripts without requiring a story_id

-- First, make story_id optional in scripts table
ALTER TABLE public.scripts ALTER COLUMN story_id DROP NOT NULL;

-- Add user_id column to scripts table for direct user ownership
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_scripts_user_id ON public.scripts(user_id);

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can manage scripts in own stories" ON public.scripts;

-- Create new policy for direct user script access
CREATE POLICY "Users can manage own scripts directly" ON public.scripts
  FOR ALL USING (user_id = auth.uid());

-- Also update script_lines policy to work with direct user ownership
DROP POLICY IF EXISTS "Users can manage script lines in own scripts" ON public.script_lines;

CREATE POLICY "Users can manage script lines in own scripts" ON public.script_lines
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.scripts 
      WHERE scripts.id = script_lines.script_id 
      AND scripts.user_id = auth.uid()
    )
  );

-- Enable RLS on scripts table (if not already enabled)
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;

-- Enable RLS on script_lines table (if not already enabled)  
ALTER TABLE public.script_lines ENABLE ROW LEVEL SECURITY;

-- Add helpful comment
COMMENT ON COLUMN public.scripts.user_id IS 'Direct user ownership for scripts without requiring story_id';
COMMENT ON POLICY "Users can manage own scripts directly" ON public.scripts IS 'Allows users to create and manage scripts directly without story requirement';
