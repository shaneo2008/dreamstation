-- Verify Audio Production Connections
-- Check if the UPDATE commands worked properly

-- 1. Check current state of audio productions
SELECT 
  id as production_id,
  script_id,
  user_id,
  audio_url,
  audio_duration,
  status,
  created_at
FROM public.audio_productions 
WHERE user_id = '04fd596d-f8ec-4a6a-bc1a-fd36dfbb236c'
ORDER BY created_at DESC;

-- 2. Check current state of scripts
SELECT 
  id as script_id,
  title,
  user_id,
  created_at,
  updated_at
FROM public.scripts 
WHERE user_id = '04fd596d-f8ec-4a6a-bc1a-fd36dfbb236c'
ORDER BY updated_at DESC;

-- 3. Test the JOIN that the frontend is using
SELECT 
  s.id as script_id,
  s.title,
  ap.id as production_id,
  ap.audio_url,
  ap.audio_duration,
  ap.status
FROM public.scripts s
LEFT JOIN public.audio_productions ap ON ap.script_id = s.id
WHERE s.user_id = '04fd596d-f8ec-4a6a-bc1a-fd36dfbb236c'
ORDER BY s.updated_at DESC;

-- 4. If no connections, manually connect the latest audio to latest script
UPDATE public.audio_productions 
SET script_id = '464ac43d-2ff4-4249-abac-a7b23ac960f7'
WHERE id = '44651e0c-fa55-47b3-b09a-8d42b3e8fcf9'
  AND user_id = '04fd596d-f8ec-4a6a-bc1a-fd36dfbb236c'
  AND script_id IS NULL;

-- 5. Verify the connection worked
SELECT 
  s.id as script_id,
  s.title,
  ap.id as production_id,
  ap.audio_url,
  ap.audio_duration
FROM public.scripts s
INNER JOIN public.audio_productions ap ON ap.script_id = s.id
WHERE s.user_id = '04fd596d-f8ec-4a6a-bc1a-fd36dfbb236c';
