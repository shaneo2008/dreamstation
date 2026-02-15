// Token-Optimized AI Generation Configuration
// Designed for ChatGPT API 4159 token limit

// Generate UUID v4
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const OPTIMIZED_PRESETS = {
  THRILLER: {
    name: 'Thriller',
    prompt: 'Write a suspenseful audio script with tension and cliffhangers.',
    style: 'tense dialogue, atmospheric descriptions'
  },
  COMEDY: {
    name: 'Comedy',
    prompt: 'Write a comedic audio script with witty dialogue and humor.',
    style: 'funny dialogue, comedic timing'
  },
  DRAMA: {
    name: 'Drama',
    prompt: 'Write an emotional audio script with character development.',
    style: 'emotional dialogue, character depth'
  },
  ROMANCE: {
    name: 'Romance',
    prompt: 'Write a romantic audio script with emotional connection.',
    style: 'intimate dialogue, emotional moments'
  },
  FANTASY: {
    name: 'Fantasy',
    prompt: 'Write a fantasy audio script with magical elements.',
    style: 'descriptive dialogue, world-building'
  }
};

// Simplified user options that provide maximum impact
export const ESSENTIAL_OPTIONS = {
  episodeDuration: {
    short: { name: '5-8 minutes', value: 5, tokens: '~800-1200 words' },
    medium: { name: '10-12 minutes', value: 10, tokens: '~1500-2000 words' },
    long: { name: '15 minutes', value: 15, tokens: '~2500-3000 words' }
  },
  
  focus: {
    dialogue: { name: 'Dialogue Heavy', description: 'Focus on character conversations' },
    action: { name: 'Action Heavy', description: 'Focus on events and scenes' },
    balanced: { name: 'Balanced', description: 'Mix of dialogue and narration' }
  },
  
  intensity: {
    light: { name: 'Light', description: 'Gentle, easy-going tone' },
    medium: { name: 'Medium', description: 'Balanced emotional range' },
    high: { name: 'High', description: 'Intense, dramatic moments' }
  }
};

// Ultra-compact prompt builder
export const buildOptimizedPrompt = (config) => {
  const preset = OPTIMIZED_PRESETS[config.preset] || OPTIMIZED_PRESETS.DRAMA;
  const duration = ESSENTIAL_OPTIONS.episodeDuration[config.duration] || ESSENTIAL_OPTIONS.episodeDuration.medium;
  
  // Keep prompt under 800 tokens
  return `${preset.prompt}

Story: ${config.storyContent}
Genre: ${config.genre || preset.name}
Length: ${duration.value} minutes (~${duration.tokens})
Focus: ${config.focus || 'balanced'}
Intensity: ${config.intensity || 'medium'}

Return ONLY valid JSON in this exact format:
{
  "expandedConcept": "detailed story expansion",
  "characters": [{"name": "Character Name", "personality": "traits", "voice": "description"}],
  "script": {
    "title": "Story Title",
    "lines": [
      {"type": "dialogue", "speaker": "Character Name", "text": "dialogue text", "emotion": "Happy"},
      {"type": "narration", "speaker": "Narrator", "text": "scene description", "emotion": "Neutral"}
    ]
  }
}

Available emotions: Whisper, Shout, Happy, Sad, Angry, Scared, Excited, Neutral
Keep within ${duration.tokens} for audio production.`;
};

// Optimized payload for n8n
export const buildOptimizedPayload = (userConfig) => {
  return {
    source_url: userConfig.sourceUrl || '',
    story_id: generateUUID(), // Generate proper UUID instead of timestamp
    user_id: userConfig.userId,
    
    // Concept structure expected by n8n workflow
    concept: {
      initialConcept: userConfig.storyContent || '',
      genre: userConfig.genre || 'drama',
      targetAudience: 'general',
      toneStyle: userConfig.focus || 'balanced',
      contentGuidelines: 'family-friendly',
      targetEpisodes: 1,
      episodeLengthMinutes: userConfig.duration === 'short' ? 5 : userConfig.duration === 'long' ? 15 : 10,
      characters: userConfig.characters || []
    },
    
    // Single optimized prompt instead of multiple prompts
    optimized_prompt: buildOptimizedPrompt(userConfig),
    
    // Essential preferences only
    preferences: {
      preset: userConfig.preset,
      episode_duration: userConfig.duration,
      focus_type: userConfig.focus,
      intensity_level: userConfig.intensity,
      genre: userConfig.genre,
      
      // Keep these for compatibility
      episode_count: 1, // Force single episode for token limits
      include_stage_directions: true,
      production_ready: true
    },
    
    // Minimal metadata
    generation_metadata: {
      config_version: '2.0-optimized',
      token_optimized: true,
      max_tokens: 4159,
      generated_at: new Date().toISOString()
    }
  };
};

// Token estimation (rough)
export const estimateTokens = (text) => {
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4);
};

// Validate token limits
export const validateTokenLimits = (config) => {
  const prompt = buildOptimizedPrompt(config);
  const promptTokens = estimateTokens(prompt);
  const maxOutputTokens = 4159 - promptTokens - 200; // 200 token buffer
  
  return {
    promptTokens,
    maxOutputTokens,
    withinLimits: promptTokens < 1000 && maxOutputTokens > 2000,
    warnings: promptTokens >= 1000 ? ['Prompt too long, may exceed limits'] : []
  };
};

// Simplified frontend options
export const FRONTEND_OPTIONS = {
  presets: Object.keys(OPTIMIZED_PRESETS),
  durations: Object.keys(ESSENTIAL_OPTIONS.episodeDuration),
  focuses: Object.keys(ESSENTIAL_OPTIONS.focus),
  intensities: Object.keys(ESSENTIAL_OPTIONS.intensity)
};
