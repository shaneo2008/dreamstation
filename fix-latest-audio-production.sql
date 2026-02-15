-- Fix Latest Audio Production Link
-- Connect the most recent audio production to the correct script

-- First, let's see what script_id the latest audio production has
SELECT 
  id as production_id,
  script_id,
  user_id,
  title,
  audio_url,
  status,
  audio_duration,
  created_at
FROM public.audio_productions 
WHERE user_id = '04fd596d-f8ec-4a6a-bc1a-fd36dfbb236c'
ORDER BY created_at DESC
LIMIT 5;

-- Update the latest audio production to link to "The Case of the Missing Diamond" script
-- (This appears to be the most recent script based on the logs)
UPDATE public.audio_productions 
SET script_id = '464ac43d-2ff4-4249-abac-a7b23ac960f7'
WHERE id = '44651e0c-fa55-47b3-b09a-8d42b3e8fcf9'
  AND user_id = '04fd596d-f8ec-4a6a-bc1a-fd36dfbb236c';

-- Verify the update worked
SELECT 
  ap.id as production_id,
  ap.script_id,
  s.title as script_title,
  ap.audio_url,
  ap.audio_duration,
  ap.status
FROM public.audio_productions ap
LEFT JOIN public.scripts s ON s.id = ap.script_id
WHERE ap.user_id = '04fd596d-f8ec-4a6a-bc1a-fd36dfbb236c'
ORDER BY ap.created_at DESC
LIMIT 3;
