# FanCast AI v2 - Dynamic n8n Workflow Integration Guide

## 🎯 **Overview**

This guide details how to update your n8n AI script generation workflow to use **dynamic user-configurable prompts** instead of hardcoded ones. The frontend now sends comprehensive configuration data that should replace static prompts in the workflow.

## 🔄 **Enhanced Payload Structure**

The frontend now sends this enhanced payload to your n8n webhook:

```json
{
  "source_url": "https://archiveofourown.org/works/12345",
  "story_id": "uuid-story-id",
  "user_id": "uuid-user-id",
  
  "ai_prompts": {
    "system_prompt": "You are an expert script writer specializing in dramatic audio content...",
    "conversion_instructions": "Convert this story into a professional audio drama script...",
    "character_analysis": "Analyze characters for core motivations and internal conflicts..."
  },
  
  "preferences": {
    "episode_count": 6,
    "episode_duration": 20,
    "episode_structure": "serial",
    "genre": "drama",
    "story_tone": "suspenseful",
    "narrative_perspective": "third_person_limited",
    "character_focus": "protagonist",
    "content_guidelines": "teen_plus",
    "include_cliffhangers": true,
    "include_twist": false,
    "resolve_plotlines": true,
    "pacing": "measured",
    "dialogue_style": "realistic",
    "narration_level": "moderate",
    "emotional_intensity": "high",
    "production_style": "cinematic",
    "include_stage_directions": true,
    "include_emotion_cues": true,
    "include_pacing_notes": true,
    "scene_transition_style": "smooth",
    "special_instructions": "Focus on character development",
    "character_voice_notes": "Main character has slight accent"
  },
  
  "generation_metadata": {
    "preset_used": "DRAMA",
    "prompt_style": "dramatic",
    "has_customizations": true,
    "config_version": "2.0",
    "generated_at": "2024-01-15T10:30:00Z"
  }
}
```

## 🛠️ **n8n Workflow Updates Required**

### **1. Replace Hardcoded System Prompt**

**Before (Hardcoded):**
```javascript
// In your AI node
const systemPrompt = "You are an expert script writer for audio drama...";
```

**After (Dynamic):**
```javascript
// In your AI node - use the dynamic prompt from payload
const systemPrompt = $json.ai_prompts.system_prompt;
```

### **2. Replace Hardcoded Conversion Instructions**

**Before (Hardcoded):**
```javascript
const instructions = "Convert this fanfiction into a script format...";
```

**After (Dynamic):**
```javascript
const instructions = $json.ai_prompts.conversion_instructions;
```

### **3. Replace Hardcoded Character Analysis**

**Before (Hardcoded):**
```javascript
const characterPrompt = "Analyze the characters in this story...";
```

**After (Dynamic):**
```javascript
const characterPrompt = $json.ai_prompts.character_analysis;
```

### **4. Use Enhanced Preferences**

**Before (Limited):**
```javascript
const preferences = {
  episodeCount: $json.preferences.episode_count || 6,
  tone: $json.preferences.story_tone || "balanced"
};
```

**After (Comprehensive):**
```javascript
const preferences = {
  // Episode Structure
  episodeCount: $json.preferences.episode_count,
  episodeDuration: $json.preferences.episode_duration,
  episodeStructure: $json.preferences.episode_structure,
  
  // Story Style
  genre: $json.preferences.genre,
  storyTone: $json.preferences.story_tone,
  narrativePerspective: $json.preferences.narrative_perspective,
  characterFocus: $json.preferences.character_focus,
  
  // Content & Style
  contentGuidelines: $json.preferences.content_guidelines,
  pacing: $json.preferences.pacing,
  dialogueStyle: $json.preferences.dialogue_style,
  narrationLevel: $json.preferences.narration_level,
  emotionalIntensity: $json.preferences.emotional_intensity,
  
  // Production
  productionStyle: $json.preferences.production_style,
  includeStageDirections: $json.preferences.include_stage_directions,
  includeEmotionCues: $json.preferences.include_emotion_cues,
  includePacingNotes: $json.preferences.include_pacing_notes,
  
  // Plot Elements
  includeCliffhangers: $json.preferences.include_cliffhangers,
  includeTwist: $json.preferences.include_twist,
  resolvePlotlines: $json.preferences.resolve_plotlines,
  
  // Custom Instructions
  specialInstructions: $json.preferences.special_instructions,
  characterVoiceNotes: $json.preferences.character_voice_notes
};
```

## 🤖 **Updated AI Node Configuration**

### **Main AI Script Generation Node**

```javascript
// Build comprehensive prompt using user configuration
const buildFullPrompt = () => {
  const systemPrompt = $json.ai_prompts.system_prompt;
  const conversionInstructions = $json.ai_prompts.conversion_instructions;
  const prefs = $json.preferences;
  
  let fullPrompt = systemPrompt + "\n\n";
  fullPrompt += conversionInstructions + "\n\n";
  
  // Add style-specific instructions
  fullPrompt += `Style Requirements:\n`;
  fullPrompt += `- Genre: ${prefs.genre}\n`;
  fullPrompt += `- Tone: ${prefs.story_tone}\n`;
  fullPrompt += `- Pacing: ${prefs.pacing}\n`;
  fullPrompt += `- Dialogue Style: ${prefs.dialogue_style}\n`;
  fullPrompt += `- Narration Level: ${prefs.narration_level}\n`;
  fullPrompt += `- Emotional Intensity: ${prefs.emotional_intensity}\n\n`;
  
  // Add episode structure requirements
  fullPrompt += `Episode Structure:\n`;
  fullPrompt += `- Total Episodes: ${prefs.episode_count}\n`;
  fullPrompt += `- Episode Duration: ${prefs.episode_duration} minutes\n`;
  fullPrompt += `- Structure Type: ${prefs.episode_structure}\n`;
  fullPrompt += `- Include Cliffhangers: ${prefs.include_cliffhangers}\n`;
  fullPrompt += `- Include Twists: ${prefs.include_twist}\n`;
  fullPrompt += `- Resolve Plotlines: ${prefs.resolve_plotlines}\n\n`;
  
  // Add production requirements
  fullPrompt += `Production Requirements:\n`;
  fullPrompt += `- Production Style: ${prefs.production_style}\n`;
  fullPrompt += `- Include Stage Directions: ${prefs.include_stage_directions}\n`;
  fullPrompt += `- Include Emotion Cues: ${prefs.include_emotion_cues}\n`;
  fullPrompt += `- Include Pacing Notes: ${prefs.include_pacing_notes}\n\n`;
  
  // Add custom instructions if provided
  if (prefs.special_instructions) {
    fullPrompt += `Special Instructions:\n${prefs.special_instructions}\n\n`;
  }
  
  if (prefs.character_voice_notes) {
    fullPrompt += `Character Voice Notes:\n${prefs.character_voice_notes}\n\n`;
  }
  
  return fullPrompt;
};

// Use the dynamic prompt
const prompt = buildFullPrompt();
```

### **Character Analysis Node**

```javascript
// Use dynamic character analysis prompt
const characterAnalysisPrompt = $json.ai_prompts.character_analysis;
const prefs = $json.preferences;

let fullCharacterPrompt = characterAnalysisPrompt + "\n\n";

// Add character-specific preferences
fullCharacterPrompt += `Character Focus: ${prefs.character_focus}\n`;
fullCharacterPrompt += `Dialogue Style: ${prefs.dialogue_style}\n`;
fullCharacterPrompt += `Emotional Intensity: ${prefs.emotional_intensity}\n`;

if (prefs.character_voice_notes) {
  fullCharacterPrompt += `\nVoice Notes: ${prefs.character_voice_notes}`;
}
```

## 📊 **Metadata Tracking**

Store the generation metadata for debugging and analytics:

```javascript
// In your database storage node
const generationRecord = {
  user_id: $json.user_id,
  story_id: $json.story_id,
  source_url: $json.source_url,
  
  // Store the configuration used
  generation_config: {
    preset_used: $json.generation_metadata.preset_used,
    prompt_style: $json.generation_metadata.prompt_style,
    has_customizations: $json.generation_metadata.has_customizations,
    config_version: $json.generation_metadata.config_version,
    preferences_applied: $json.preferences
  },
  
  // Store the actual prompts used
  prompts_used: {
    system_prompt: $json.ai_prompts.system_prompt,
    conversion_instructions: $json.ai_prompts.conversion_instructions,
    character_analysis: $json.ai_prompts.character_analysis
  },
  
  status: 'processing',
  created_at: new Date().toISOString()
};
```

## 🔍 **Testing the Integration**

### **1. Test Different Presets**

Send requests with different presets to ensure prompts change:

```bash
# Drama preset
curl -X POST your-webhook-url \
  -H "Content-Type: application/json" \
  -d '{"preferences": {"preset": "DRAMA"}, ...}'

# Comedy preset  
curl -X POST your-webhook-url \
  -H "Content-Type: application/json" \
  -d '{"preferences": {"preset": "COMEDY"}, ...}'
```

### **2. Test Custom Instructions**

```bash
curl -X POST your-webhook-url \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "special_instructions": "Focus on environmental descriptions",
      "character_voice_notes": "Main character speaks in short sentences"
    },
    ...
  }'
```

### **3. Verify Prompt Building**

Add logging to your n8n workflow to verify prompts are being built correctly:

```javascript
// Add this in your workflow for debugging
console.log("System Prompt:", $json.ai_prompts.system_prompt);
console.log("Preferences:", JSON.stringify($json.preferences, null, 2));
```

## 🚀 **Migration Checklist**

- [ ] **Update webhook endpoint** to handle new payload structure
- [ ] **Replace hardcoded system prompts** with `$json.ai_prompts.system_prompt`
- [ ] **Replace hardcoded instructions** with `$json.ai_prompts.conversion_instructions`
- [ ] **Update character analysis** to use `$json.ai_prompts.character_analysis`
- [ ] **Expand preferences handling** to use all new preference fields
- [ ] **Add metadata storage** for tracking generation configurations
- [ ] **Test with different presets** (Drama, Comedy, Thriller, etc.)
- [ ] **Test custom instructions** and special requirements
- [ ] **Verify backward compatibility** with existing API calls
- [ ] **Update error handling** for new payload structure
- [ ] **Add logging** for debugging prompt generation

## 🎨 **Frontend Integration**

The frontend `AIGenerationForm` component now provides:

1. **Preset Selection** - Genre-based prompt templates
2. **Style Configuration** - Pacing, dialogue, narration preferences  
3. **Structure Options** - Episode count, duration, cliffhangers
4. **Custom Instructions** - User-defined prompt additions
5. **Production Settings** - Stage directions, emotion cues, pacing notes

All these options are automatically converted into the dynamic prompts sent to your n8n workflow.

## 📈 **Benefits of Dynamic Configuration**

1. **User Control** - Users can fine-tune AI generation to their preferences
2. **Quality Improvement** - Genre-specific prompts produce better results
3. **Flexibility** - Easy to add new presets and options
4. **Consistency** - Standardized prompt structure across all generations
5. **Debugging** - Clear tracking of what configuration was used
6. **Scalability** - No need to modify n8n workflow for new options

## 🔧 **Next Steps**

1. **Update your n8n workflow** using the examples above
2. **Test the integration** with the provided test cases
3. **Monitor generation quality** with different presets
4. **Collect user feedback** on the new configuration options
5. **Iterate on prompts** based on generation results

The enhanced system provides comprehensive user control over AI script generation while maintaining the robust n8n workflow architecture.
