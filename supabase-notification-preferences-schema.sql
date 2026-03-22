-- DreamStation — notification_preferences table
-- Stores push subscription per user+child for web-push delivery.
-- Run this in Supabase SQL Editor.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id                uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id           uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  child_id          uuid REFERENCES public.child_profiles(id) ON DELETE CASCADE NOT NULL,
  push_subscription jsonb,
  push_enabled      boolean DEFAULT true,
  created_at        timestamp with time zone DEFAULT now(),
  updated_at        timestamp with time zone DEFAULT now(),

  UNIQUE(user_id, child_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id
  ON public.notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_child_id
  ON public.notification_preferences(child_id);

-- RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents can view their own notification prefs" ON public.notification_preferences;
CREATE POLICY "Parents can view their own notification prefs"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Parents can insert their own notification prefs" ON public.notification_preferences;
CREATE POLICY "Parents can insert their own notification prefs"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Parents can update their own notification prefs" ON public.notification_preferences;
CREATE POLICY "Parents can update their own notification prefs"
  ON public.notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);
