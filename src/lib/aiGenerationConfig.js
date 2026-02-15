// Enhanced AI Script Generation Configuration
// Comprehensive user options for n8n workflow customization

export const AI_GENERATION_PRESETS = {
  // Genre-based presets
  DRAMA: {
    name: 'Drama',
    description: 'Character-driven emotional storytelling',
    promptStyle: 'dramatic',
    pacing: 'measured',
    emotionalIntensity: 'high',
    dialogueStyle: 'realistic',
    narrationLevel: 'moderate'
  },
  COMEDY: {
    name: 'Comedy',
    description: 'Light-hearted and humorous',
    promptStyle: 'comedic',
    pacing: 'quick',
    emotionalIntensity: 'light',
    dialogueStyle: 'witty',
    narrationLevel: 'minimal'
  },
  THRILLER: {
    name: 'Thriller',
    description: 'Suspenseful and intense',
    promptStyle: 'suspenseful',
    pacing: 'fast',
    emotionalIntensity: 'very_high',
    dialogueStyle: 'tense',
    narrationLevel: 'atmospheric'
  },
  ROMANCE: {
    name: 'Romance',
    description: 'Emotional and intimate',
    promptStyle: 'romantic',
    pacing: 'gentle',
    emotionalIntensity: 'high',
    dialogueStyle: 'intimate',
    narrationLevel: 'descriptive'
  },
  FANTASY: {
    name: 'Fantasy',
    description: 'Magical and world-building focused',
    promptStyle: 'fantastical',
    pacing: 'epic',
    emotionalIntensity: 'medium',
    dialogueStyle: 'formal',
    narrationLevel: 'rich'
  },
  CUSTOM: {
    name: 'Custom',
    description: 'User-defined settings',
    promptStyle: 'custom',
    pacing: 'balanced',
    emotionalIntensity: 'medium',
    dialogueStyle: 'natural',
    narrationLevel: 'moderate'
  }
};

export const PROMPT_TEMPLATES = {
  dramatic: {
    systemPrompt: `You are an expert script writer specializing in dramatic audio content. Focus on:
- Deep character development and emotional arcs
- Meaningful dialogue that reveals character
- Paced dramatic tension and conflict resolution
- Rich emotional subtext in every interaction`,
    
    conversionInstructions: `Convert this story into a professional audio drama script with:
- Clear character voice distinctions
- Emotional depth in dialogue delivery
- Dramatic pauses and pacing cues
- Stage directions for audio production`,
    
    characterAnalysis: `Analyze characters for:
- Core motivations and internal conflicts
- Unique speech patterns and vocabulary
- Emotional range and expression styles
- Relationship dynamics and tensions`
  },

  comedic: {
    systemPrompt: `You are an expert comedy writer for audio content. Focus on:
- Timing and rhythm for comedic effect
- Character-based humor and witty dialogue
- Light-hearted tone with emotional moments
- Audio-friendly physical comedy descriptions`,
    
    conversionInstructions: `Convert this story into a comedic audio script with:
- Punchy, well-timed dialogue
- Clear setup and payoff structures
- Character quirks that translate to audio
- Comedic pacing and beat instructions`,
    
    characterAnalysis: `Analyze characters for:
- Comedic traits and speech patterns
- Timing preferences (fast/slow delivery)
- Relationship-based humor opportunities
- Voice acting direction for comedy`
  },

  suspenseful: {
    systemPrompt: `You are a thriller/suspense script writer for audio drama. Focus on:
- Building and maintaining tension
- Cliffhangers and dramatic reveals
- Atmospheric audio cues and pacing
- Character psychology under pressure`,
    
    conversionInstructions: `Convert this story into a suspenseful audio script with:
- Tension-building dialogue and pacing
- Strategic information reveals
- Audio atmosphere and mood cues
- Character stress and urgency indicators`,
    
    characterAnalysis: `Analyze characters for:
- Stress responses and fear patterns
- Information they're hiding/revealing
- Trust dynamics and suspicions
- Voice changes under pressure`
  },

  romantic: {
    systemPrompt: `You are a romance writer specializing in intimate audio content. Focus on:
- Emotional vulnerability and connection
- Intimate dialogue and tender moments
- Character chemistry and attraction
- Sensual audio descriptions (appropriate)`,
    
    conversionInstructions: `Convert this story into a romantic audio script with:
- Intimate, emotionally charged dialogue
- Chemistry-building conversations
- Tender moments and emotional beats
- Voice direction for romantic scenes`,
    
    characterAnalysis: `Analyze characters for:
- Romantic attraction and chemistry
- Vulnerability and emotional walls
- Love language and affection styles
- Intimate communication patterns`
  },

  fantastical: {
    systemPrompt: `You are a fantasy script writer for audio drama. Focus on:
- World-building through dialogue and narration
- Magical elements and fantastical concepts
- Epic scope and adventure elements
- Audio-friendly magical descriptions`,
    
    conversionInstructions: `Convert this story into a fantasy audio script with:
- World-building exposition in natural dialogue
- Magical action sequences for audio
- Character wonder and discovery moments
- Fantasy terminology and language styles`,
    
    characterAnalysis: `Analyze characters for:
- Relationship to magical elements
- Cultural background and speech patterns
- Power dynamics and abilities
- Character growth through adventure`
  },

  custom: {
    systemPrompt: `You are a versatile script writer adapting to user specifications. Focus on the user's defined style preferences and maintain consistency with their creative vision.`,
    
    conversionInstructions: `Convert this story according to the user's specific requirements and style preferences provided in the generation parameters.`,
    
    characterAnalysis: `Analyze characters according to the user's specified focus areas and style requirements.`
  }
};

export const GENERATION_OPTIONS = {
  // Story Structure Options
  episodeStructure: {
    single: { name: 'Single Episode', description: 'Complete story in one episode' },
    serial: { name: 'Serial', description: 'Multi-episode series with cliffhangers' },
    anthology: { name: 'Anthology', description: 'Connected episodes, standalone stories' },
    miniseries: { name: 'Mini-Series', description: 'Limited series with defined arc' }
  },

  // Pacing Options
  pacing: {
    slow: { name: 'Slow Burn', description: 'Deliberate, contemplative pacing' },
    measured: { name: 'Measured', description: 'Balanced pacing with natural rhythm' },
    quick: { name: 'Quick', description: 'Fast-paced with rapid developments' },
    variable: { name: 'Variable', description: 'Dynamic pacing based on content' }
  },

  // Dialogue Style Options
  dialogueStyle: {
    realistic: { name: 'Realistic', description: 'Natural, everyday speech patterns' },
    theatrical: { name: 'Theatrical', description: 'Heightened, dramatic dialogue' },
    witty: { name: 'Witty', description: 'Clever, humorous exchanges' },
    formal: { name: 'Formal', description: 'Elevated, literary language' },
    intimate: { name: 'Intimate', description: 'Personal, emotional conversations' },
    tense: { name: 'Tense', description: 'High-stakes, urgent dialogue' }
  },

  // Narration Level Options
  narrationLevel: {
    minimal: { name: 'Minimal', description: 'Dialogue-focused with little narration' },
    moderate: { name: 'Moderate', description: 'Balanced dialogue and narration' },
    rich: { name: 'Rich', description: 'Detailed narrative descriptions' },
    atmospheric: { name: 'Atmospheric', description: 'Mood and setting focused' },
    descriptive: { name: 'Descriptive', description: 'Detailed character and scene work' }
  },

  // Emotional Intensity Options
  emotionalIntensity: {
    light: { name: 'Light', description: 'Gentle emotional content' },
    medium: { name: 'Medium', description: 'Balanced emotional range' },
    high: { name: 'High', description: 'Strong emotional moments' },
    very_high: { name: 'Very High', description: 'Intense emotional content' },
    variable: { name: 'Variable', description: 'Emotional intensity matches content' }
  },

  // Content Guidelines
  contentGuidelines: {
    family_friendly: { name: 'Family Friendly', description: 'Suitable for all ages' },
    teen_plus: { name: 'Teen+', description: 'Suitable for teenagers and adults' },
    mature: { name: 'Mature', description: 'Adult themes and content' },
    explicit: { name: 'Explicit', description: 'Mature content with explicit themes' }
  },

  // Character Focus Options
  characterFocus: {
    ensemble: { name: 'Ensemble', description: 'Equal focus on multiple characters' },
    protagonist: { name: 'Protagonist', description: 'Single main character focus' },
    dual_lead: { name: 'Dual Lead', description: 'Two main characters' },
    rotating: { name: 'Rotating', description: 'Shifting character perspectives' }
  },

  // Audio Production Style
  productionStyle: {
    intimate: { name: 'Intimate', description: 'Close, personal audio style' },
    cinematic: { name: 'Cinematic', description: 'Movie-like production values' },
    radio_drama: { name: 'Radio Drama', description: 'Classic radio show style' },
    podcast: { name: 'Podcast', description: 'Modern podcast storytelling' },
    audiobook: { name: 'Audiobook+', description: 'Enhanced audiobook style' }
  }
};

// Default generation configuration
export const DEFAULT_GENERATION_CONFIG = {
  // Basic Settings
  preset: 'CUSTOM',
  episodeCount: 6,
  episodeDuration: 20, // minutes
  
  // Style Settings
  genre: 'drama',
  tone: 'balanced',
  pacing: 'measured',
  dialogueStyle: 'realistic',
  narrationLevel: 'moderate',
  emotionalIntensity: 'medium',
  
  // Story Structure
  episodeStructure: 'serial',
  narrativePerspective: 'third_person_limited',
  characterFocus: 'protagonist',
  
  // Content Settings
  contentGuidelines: 'teen_plus',
  includeCliffhangers: true,
  includeTwist: false,
  resolvePlotlines: true,
  
  // Production Settings
  productionStyle: 'cinematic',
  includeStageDirections: true,
  includeEmotionCues: true,
  includePacingNotes: true,
  
  // Advanced Options
  customPromptAdditions: '',
  specialInstructions: '',
  characterVoiceNotes: '',
  sceneTransitionStyle: 'smooth'
};

// Function to build dynamic prompt based on user configuration
export const buildDynamicPrompt = (config) => {
  const preset = AI_GENERATION_PRESETS[config.preset] || AI_GENERATION_PRESETS.CUSTOM;
  const template = PROMPT_TEMPLATES[preset.promptStyle] || PROMPT_TEMPLATES.custom;
  
  let systemPrompt = template.systemPrompt;
  let conversionInstructions = template.conversionInstructions;
  let characterAnalysis = template.characterAnalysis;
  
  // Add user customizations
  if (config.customPromptAdditions) {
    systemPrompt += `\n\nAdditional Instructions: ${config.customPromptAdditions}`;
  }
  
  if (config.specialInstructions) {
    conversionInstructions += `\n\nSpecial Requirements: ${config.specialInstructions}`;
  }
  
  // Build style-specific instructions
  const styleInstructions = [];
  
  if (config.pacing !== 'measured') {
    const pacingOption = GENERATION_OPTIONS.pacing[config.pacing];
    styleInstructions.push(`Pacing: ${pacingOption.description}`);
  }
  
  if (config.dialogueStyle !== 'realistic') {
    const dialogueOption = GENERATION_OPTIONS.dialogueStyle[config.dialogueStyle];
    styleInstructions.push(`Dialogue Style: ${dialogueOption.description}`);
  }
  
  if (config.narrationLevel !== 'moderate') {
    const narrationOption = GENERATION_OPTIONS.narrationLevel[config.narrationLevel];
    styleInstructions.push(`Narration: ${narrationOption.description}`);
  }
  
  if (config.emotionalIntensity !== 'medium') {
    const emotionOption = GENERATION_OPTIONS.emotionalIntensity[config.emotionalIntensity];
    styleInstructions.push(`Emotional Intensity: ${emotionOption.description}`);
  }
  
  if (styleInstructions.length > 0) {
    conversionInstructions += `\n\nStyle Requirements:\n- ${styleInstructions.join('\n- ')}`;
  }
  
  return {
    systemPrompt,
    conversionInstructions,
    characterAnalysis,
    metadata: {
      preset: config.preset,
      style: preset.promptStyle,
      customizations: config.customPromptAdditions ? true : false
    }
  };
};

// Function to validate generation configuration
export const validateGenerationConfig = (config) => {
  const errors = [];
  
  if (!config.episodeCount || config.episodeCount < 1 || config.episodeCount > 20) {
    errors.push('Episode count must be between 1 and 20');
  }
  
  if (!config.episodeDuration || config.episodeDuration < 5 || config.episodeDuration > 60) {
    errors.push('Episode duration must be between 5 and 60 minutes');
  }
  
  if (!AI_GENERATION_PRESETS[config.preset]) {
    errors.push('Invalid preset selection');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Export configuration for n8n workflow
export const buildN8nPayload = (config, sourceUrl, storyId, userId) => {
  const dynamicPrompt = buildDynamicPrompt(config);
  
  return {
    source_url: sourceUrl,
    story_id: storyId,
    user_id: userId,
    
    // Dynamic AI Prompts
    ai_prompts: {
      system_prompt: dynamicPrompt.systemPrompt,
      conversion_instructions: dynamicPrompt.conversionInstructions,
      character_analysis: dynamicPrompt.characterAnalysis
    },
    
    // User Preferences
    preferences: {
      // Episode Structure
      episode_count: config.episodeCount,
      episode_duration: config.episodeDuration,
      episode_structure: config.episodeStructure,
      
      // Story Style
      genre: config.genre,
      story_tone: config.tone,
      narrative_perspective: config.narrativePerspective,
      character_focus: config.characterFocus,
      
      // Content Settings
      content_guidelines: config.contentGuidelines,
      include_cliffhangers: config.includeCliffhangers,
      include_twist: config.includeTwist,
      resolve_plotlines: config.resolvePlotlines,
      
      // Style Settings
      pacing: config.pacing,
      dialogue_style: config.dialogueStyle,
      narration_level: config.narrationLevel,
      emotional_intensity: config.emotionalIntensity,
      
      // Production Settings
      production_style: config.productionStyle,
      include_stage_directions: config.includeStageDirections,
      include_emotion_cues: config.includeEmotionCues,
      include_pacing_notes: config.includePacingNotes,
      scene_transition_style: config.sceneTransitionStyle,
      
      // Custom Settings
      special_instructions: config.specialInstructions,
      character_voice_notes: config.characterVoiceNotes
    },
    
    // Metadata for tracking
    generation_metadata: {
      preset_used: config.preset,
      prompt_style: dynamicPrompt.metadata.style,
      has_customizations: dynamicPrompt.metadata.customizations,
      config_version: '2.0',
      generated_at: new Date().toISOString()
    }
  };
};
