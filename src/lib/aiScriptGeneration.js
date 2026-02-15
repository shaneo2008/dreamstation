// AI Script Generation Helper Functions
// Handles communication with n8n AI script generation workflow

import { db } from './supabase'

/**
 * Trigger AI-assisted script creation from concept
 * @param {Object} params - Creation parameters
 * @param {string} params.userId - User ID
 * @param {string} params.storyId - Story ID
 * @param {Object} params.concept - Story concept details
 * @param {Array} params.characters - Character definitions
 * @param {Object} params.preferences - User preferences
 * @returns {Promise<Object>} Creation job details
 */
export const createAiAssistedScript = async ({
  userId,
  storyId,
  concept,
  characters = [],
  preferences = {}
}) => {
  try {
    const webhookUrl = import.meta.env.VITE_N8N_AI_ASSISTED_CREATION_WEBHOOK;

    if (!webhookUrl) {
      throw new Error('AI-assisted creation webhook URL not configured');
    }

    const payload = {
      userId,
      storyId,
      concept: {
        initialConcept: concept.initialConcept,
        genre: concept.genre || 'drama',
        targetAudience: concept.targetAudience || 'general',
        toneStyle: concept.toneStyle || 'balanced',
        contentGuidelines: concept.contentGuidelines || 'family-friendly',
        targetEpisodes: concept.targetEpisodes || 1,
        episodeLengthMinutes: concept.episodeLengthMinutes || 10,
        storyArcOutline: concept.storyArcOutline || '',
        keyPlotPoints: concept.keyPlotPoints || []
      },
      characters: characters.map(char => ({
        name: char.name,
        role: char.role,
        description: char.description || '',
        personalityTraits: char.personalityTraits || [],
        relationships: char.relationships || {}
      })),
      preferences: {
        dialogueStyle: preferences.dialogueStyle || 'natural',
        narrationLevel: preferences.narrationLevel || 'moderate',
        pacingPreference: preferences.pacingPreference || 'balanced',
        emotionalIntensity: preferences.emotionalIntensity || 'medium',
        ...preferences
      }
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      success: true,
      jobId: result.data.jobId,
      scriptId: result.data.scriptId,
      totalLines: result.data.totalLines,
      title: result.data.title,
      editUrl: result.data.editUrl,
      message: result.message
    };

  } catch (error) {
    console.error('AI-assisted creation failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const aiScriptGeneration = {
  /**
   * Generate script from story URL using AI
   * @param {Object} params - Generation parameters
   * @param {string} params.sourceUrl - AO3, Wattpad, etc. URL
   * @param {string} params.storyId - Supabase story ID
   * @param {string} params.userId - User ID
   * @param {Object} params.preferences - User preferences for generation
   * @param {Object} params.aiPrompts - Dynamic AI prompts based on user config
   * @param {Object} params.generationMetadata - Metadata for tracking
   * @returns {Promise<Object>} Generation result
   */
  async generateScriptFromUrl({
    sourceUrl,
    storyId,
    userId,
    preferences = {},
    aiPrompts = {},
    generationMetadata = {}
  }) {
    try {
      const webhookUrl = import.meta.env.VITE_N8N_AI_SCRIPT_GENERATION_WEBHOOK
      if (!webhookUrl) {
        throw new Error('AI script generation webhook not configured')
      }

      // Build comprehensive payload for n8n workflow
      const payload = {
        source_url: sourceUrl,
        story_id: storyId,
        user_id: userId,

        // Dynamic AI Prompts (replaces hardcoded prompts in n8n)
        ai_prompts: {
          system_prompt: aiPrompts.systemPrompt || 'You are an expert script writer for audio drama content.',
          conversion_instructions: aiPrompts.conversionInstructions || 'Convert this story into a professional audio drama script.',
          character_analysis: aiPrompts.characterAnalysis || 'Analyze characters for voice acting and emotional delivery.',
          ...aiPrompts
        },

        // Enhanced User Preferences
        preferences: {
          // Episode Structure
          episode_count: preferences.episode_count || preferences.episodeCount || 6,
          episode_duration: preferences.episode_duration || preferences.episodeDuration || 20,
          episode_structure: preferences.episode_structure || preferences.episodeStructure || 'serial',

          // Story Style
          genre: preferences.genre || 'drama',
          story_tone: preferences.story_tone || preferences.storyTone || 'balanced',
          narrative_perspective: preferences.narrative_perspective || preferences.narrativePerspective || 'third_person_limited',
          character_focus: preferences.character_focus || preferences.characterFocus || 'protagonist',

          // Content Settings
          content_guidelines: preferences.content_guidelines || preferences.contentGuidelines || 'teen_plus',
          include_cliffhangers: preferences.include_cliffhangers ?? preferences.includeCliffhangers ?? true,
          include_twist: preferences.include_twist ?? preferences.includeTwist ?? false,
          resolve_plotlines: preferences.resolve_plotlines ?? preferences.resolvePlotlines ?? true,

          // Style Settings
          pacing: preferences.pacing || 'measured',
          dialogue_style: preferences.dialogue_style || preferences.dialogueStyle || 'realistic',
          narration_level: preferences.narration_level || preferences.narrationLevel || 'moderate',
          emotional_intensity: preferences.emotional_intensity || preferences.emotionalIntensity || 'medium',

          // Production Settings
          production_style: preferences.production_style || preferences.productionStyle || 'cinematic',
          include_stage_directions: preferences.include_stage_directions ?? preferences.includeStageDirections ?? true,
          include_emotion_cues: preferences.include_emotion_cues ?? preferences.includeEmotionCues ?? true,
          include_pacing_notes: preferences.include_pacing_notes ?? preferences.includePacingNotes ?? true,
          scene_transition_style: preferences.scene_transition_style || preferences.sceneTransitionStyle || 'smooth',

          // Custom Settings
          special_instructions: preferences.special_instructions || preferences.specialInstructions || '',
          character_voice_notes: preferences.character_voice_notes || preferences.characterVoiceNotes || '',

          // Legacy support
          ...preferences
        },

        // Generation Metadata
        generation_metadata: {
          config_version: '2.0',
          generated_at: new Date().toISOString(),
          has_custom_prompts: Boolean(aiPrompts.systemPrompt),
          ...generationMetadata
        }
      }

      // Trigger n8n AI script generation workflow with enhanced payload
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error('n8n Response Error:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorText
        })
        throw new Error(`AI script generation failed: ${response.status} ${response.statusText} - ${errorText}`)
      }

      // Get response as text first to debug
      const responseText = await response.text()
      console.log('n8n Response:', {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText
      })

      // Handle empty response from n8n workflow
      if (!responseText || responseText.trim() === '') {
        console.log('n8n workflow processed successfully but returned empty response. This is normal during setup.')
        return {
          success: true,
          message: 'AI script generation request sent successfully to n8n workflow',
          status: 'processing',
          workflow_response: 'empty_response_during_setup',
          generation_config: {
            prompts_used: payload.ai_prompts || {},
            preferences_applied: payload.preferences || {},
            metadata: payload.generation_metadata || {}
          }
        }
      }

      // Try to parse as JSON
      let result
      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError)
        console.error('Raw response:', responseText)
        throw new Error(`Invalid JSON response from n8n workflow: ${parseError.message}. Raw response: ${responseText.substring(0, 200)}...`)
      }

      // Enhanced result with generation metadata
      return {
        ...result,
        generation_config: {
          prompts_used: payload.ai_prompts,
          preferences_applied: payload.preferences,
          metadata: payload.generation_metadata
        }
      }
    } catch (error) {
      console.error('Error generating AI script:', error)
      throw error
    }
  },

  /**
   * Check the status of an AI script generation job
   * @param {string} jobId - Generation job ID
   * @returns {Promise<Object>} Job status
   */
  async checkGenerationStatus(jobId) {
    try {
      // Check script status in database
      const script = await db.getScript(jobId)
      return {
        status: script.status,
        progress: script.generation_progress || 0,
        estimated_completion: script.estimated_completion,
        error: script.generation_error
      }
    } catch (error) {
      console.error('Error checking generation status:', error)
      throw error
    }
  },

  /**
   * Get AI-generated script lines for review
   * @param {string} scriptId - Script ID
   * @returns {Promise<Array>} Script lines with AI suggestions
   */
  async getGeneratedScript(scriptId) {
    try {
      const lines = await db.getScriptLines(scriptId)

      // Add AI generation metadata to each line
      return lines.map(line => ({
        ...line,
        ai_generated: true,
        ai_confidence: line.ai_metadata?.confidence || 0.8,
        ai_suggestions: line.ai_metadata?.suggestions || [],
        needs_review: line.ai_metadata?.needs_review || false
      }))
    } catch (error) {
      console.error('Error getting generated script:', error)
      throw error
    }
  },

  /**
   * Update AI-generated line after human review
   * @param {string} lineId - Script line ID
   * @param {Object} updates - Human edits
   * @returns {Promise<Object>} Updated line
   */
  async reviewAndUpdateLine(lineId, updates) {
    try {
      // Mark line as human-reviewed and apply updates
      const updatedLine = await db.updateScriptLine(lineId, {
        ...updates,
        human_reviewed: true,
        reviewed_at: new Date().toISOString(),
        ai_metadata: {
          ...updates.ai_metadata,
          human_modified: true,
          original_ai_text: updates.original_ai_text || updates.text_content
        }
      })

      return updatedLine
    } catch (error) {
      console.error('Error updating reviewed line:', error)
      throw error
    }
  },

  /**
   * Batch update multiple lines after review
   * @param {Array} lineUpdates - Array of {lineId, updates} objects
   * @returns {Promise<Array>} Updated lines
   */
  async batchReviewLines(lineUpdates) {
    try {
      const promises = lineUpdates.map(({ lineId, updates }) =>
        this.reviewAndUpdateLine(lineId, updates)
      )

      return await Promise.all(promises)
    } catch (error) {
      console.error('Error batch updating lines:', error)
      throw error
    }
  }
}

// Generation status constants
export const GENERATION_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  READY: 'ready',
  FAILED: 'failed',
  REVIEWING: 'reviewing'
}

// AI confidence thresholds
export const AI_CONFIDENCE = {
  HIGH: 0.9,
  MEDIUM: 0.7,
  LOW: 0.5
}
