-- Voice Assignments Table for Character Voice Selection
-- Run this in your Supabase SQL editor

CREATE TABLE voice_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID REFERENCES scripts(id) ON DELETE CASCADE,
  production_id UUID REFERENCES audio_productions(id) ON DELETE CASCADE,
  character_name VARCHAR(100) NOT NULL,
  cartesia_voice_id VARCHAR(100) NOT NULL,
  voice_name VARCHAR(100),
  voice_settings JSONB DEFAULT '{}',
  emotion_mappings JSONB DEFAULT '{}',
  default_emotion VARCHAR(50) DEFAULT 'neutral',
  lines_count INTEGER DEFAULT 0,
  total_duration DECIMAL(8,2) DEFAULT 0,
  is_locked BOOLEAN DEFAULT false,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(production_id, character_name)
);

-- Indexes for performance
CREATE INDEX idx_voice_assignments_script ON voice_assignments(script_id);
CREATE INDEX idx_voice_assignments_production ON voice_assignments(production_id);
CREATE INDEX idx_voice_assignments_voice ON voice_assignments(cartesia_voice_id);
CREATE INDEX idx_voice_assignments_user ON voice_assignments(assigned_by);

-- Preview history table for caching voice previews
CREATE TABLE preview_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  script_id UUID REFERENCES scripts(id),
  cartesia_voice_id VARCHAR(100) NOT NULL,
  character_name VARCHAR(100),
  preview_url TEXT,
  duration DECIMAL(8,2),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX idx_preview_history_expires ON preview_history(expires_at);

-- Update scripts table to track voice assignment status
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS voices_assigned BOOLEAN DEFAULT false;
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS voices_assigned_at TIMESTAMP;
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS ready_for_production BOOLEAN DEFAULT false;

-- RLS Policies for voice_assignments
ALTER TABLE voice_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage voice assignments for their scripts" ON voice_assignments
FOR ALL USING (
  script_id IN (
    SELECT id FROM scripts WHERE user_id = auth.uid()
  )
);

-- RLS Policies for preview_history
ALTER TABLE preview_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own preview history" ON preview_history
FOR ALL USING (user_id = auth.uid());
