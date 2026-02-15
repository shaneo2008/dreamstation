-- Fix Audio Production Script Linking
-- This updates the existing audio production to link to the correct script

-- Update the audio production record to use the correct script_id
UPDATE public.audio_productions 
SET script_id = 'a24361cd-ea47-4abb-8c13-80e73efe2e50'
WHERE id = '4b20a195-d095-4f37-aabd-ea8c67b1dc99'
  AND user_id = '04fd596d-f8ec-4a6a-bc1a-fd36dfbb236c';

-- Verify the update worked
SELECT 
  id as production_id,
  script_id,
  user_id,
  title,
  audio_url,
  status,
  audio_duration
FROM public.audio_productions 
WHERE user_id = '04fd596d-f8ec-4a6a-bc1a-fd36dfbb236c'
ORDER BY created_at DESC;
