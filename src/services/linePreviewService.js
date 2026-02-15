// Line Preview Service for Cartesia TTS Integration
// Handles generating audio previews for individual script lines

/**
 * Generate an audio preview for a single script line
 * @param {Object} lineData - The script line data
 * @param {string} lineData.text - The text content of the line
 * @param {string} lineData.speaker - The character speaking the line
 * @param {string} lineData.type - The type of line (dialogue, narration)
 * @param {Array} lineData.annotations - Array of emotions/annotations
 * @param {string} userId - The user ID
 * @param {string} scriptId - The script ID (optional)
 * @param {string} lineId - The line ID (optional)
 * @param {Object} voiceSettings - Voice settings (optional)
 * @param {Object} voiceAssignments - Pre-loaded voice assignments (optional)
 * @returns {Promise<Object>} Preview result with audio URL or error
 */
export const generateLinePreview = async (lineData, userId, scriptId = null, lineId = null, voiceSettings = {}, voiceAssignments = null) => {
  try {
    console.log('🎵 Generating line preview:', {
      text: lineData.text?.substring(0, 50) + '...',
      speaker: lineData.speaker,
      emotion: lineData.annotations?.[0] || 'neutral',
      userId,
      hasVoiceAssignments: !!voiceAssignments
    });

    // Validate required fields
    if (!lineData.text || !lineData.speaker) {
      throw new Error('Missing required fields: text and speaker are required');
    }

    if (!userId) {
      throw new Error('User ID is required for line preview');
    }

    // Get the voice ID for this speaker (from assignments or default)
    const voiceId = voiceSettings.voice_id || await getVoiceForSpeaker(lineData.speaker, scriptId, userId, voiceAssignments);
    
    console.log(`🎵 Using voice for ${lineData.speaker}:`, voiceId);

    // Prepare the payload for n8n webhook
    const payload = {
      user_id: userId,
      script_id: scriptId || `preview_${Date.now()}`,
      line_id: lineId || `line_${Date.now()}`,
      line_data: {
        text: lineData.text,
        speaker: lineData.speaker,
        type: lineData.type || 'dialogue',
        annotations: lineData.annotations || ['neutral']
      },
      voice_settings: {
        voice_id: voiceId,
        speed: voiceSettings.speed || 1.0,
        pitch: voiceSettings.pitch || 0.0,
        emotion_intensity: voiceSettings.emotion_intensity || 0.7
      }
    };

    console.log('📤 Sending line preview request to n8n:', payload);

    // Call the n8n webhook
    const response = await fetch(import.meta.env.VITE_N8N_LINE_PREVIEW_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('📥 Line preview response:', result);
    console.log('📥 Response type:', typeof result);
    console.log('📥 Response keys:', Object.keys(result));
    console.log('📥 Has success property:', 'success' in result);
    console.log('📥 First key value:', result[Object.keys(result)[0]]);

    // Handle different response structures
    let actualResult = result;
    if (Object.keys(result).length === 1 && typeof result[Object.keys(result)[0]] === 'object') {
      // Response might be wrapped in an extra object
      actualResult = result[Object.keys(result)[0]];
      console.log('📥 Unwrapped result:', actualResult);
    }

    if (actualResult.success) {
      return {
        success: true,
        preview_url: actualResult.data.preview_url,
        filename: actualResult.data.key || actualResult.data.filename,
        duration_estimate: actualResult.data.audio_duration_estimate || 5,
        metadata: actualResult.data.metadata || {},
        expires_in_minutes: actualResult.data.processing_info?.expires_in_minutes || 60
      };
    } else {
      throw new Error(result.error?.message || 'Failed to generate line preview');
    }

  } catch (error) {
    console.error('❌ Error generating line preview:', error);
    return {
      success: false,
      error: error.message,
      preview_url: null
    };
  }
};

/**
 * Get voice for a character/speaker from voice assignments or default
 * @param {string} speaker - The character name
 * @param {string} scriptId - The script ID
 * @param {string} userId - The user ID
 * @param {Object} voiceAssignments - Pre-loaded voice assignments (optional)
 * @returns {Promise<string>} Voice ID
 */
const getVoiceForSpeaker = async (speaker, scriptId, userId, voiceAssignments = null) => {
  try {
    // If voice assignments are provided, use them
    if (voiceAssignments && voiceAssignments[speaker]) {
      console.log(`🎵 Using assigned voice for ${speaker}:`, voiceAssignments[speaker]);
      return voiceAssignments[speaker];
    }
    
    // If we have a real script ID (not preview), try to fetch voice assignments
    if (scriptId && !scriptId.startsWith('preview_') && userId) {
      try {
        const { getVoiceAssignments } = await import('./cartesiaVoiceService.js');
        const assignments = await getVoiceAssignments(scriptId, userId);
        if (assignments && assignments[speaker]) {
          console.log(`🎵 Fetched assigned voice for ${speaker}:`, assignments[speaker]);
          return assignments[speaker];
        }
      } catch (error) {
        console.warn('⚠️ Could not fetch voice assignments, using default:', error.message);
      }
    }
    
    // Fall back to default voice mapping using Cartesia voice library
    return getDefaultVoiceForSpeaker(speaker);
  } catch (error) {
    console.warn('⚠️ Error getting voice for speaker, using default:', error.message);
    return getDefaultVoiceForSpeaker(speaker);
  }
};

/**
 * Get default voice for a character/speaker using Cartesia voice library
 * @param {string} speaker - The character name
 * @returns {string} Voice ID
 */
const getDefaultVoiceForSpeaker = (speaker) => {
  const speakerLower = speaker.toLowerCase();
  
  // Narrator gets premium narrator voice
  if (speakerLower.includes('narrator') || speakerLower.includes('narration')) {
    return 'female_warm_sarah'; // Use Cartesia voice ID
  }
  
  // Female-sounding names get female voices
  if (speakerLower.includes('emma') || speakerLower.includes('sarah') || 
      speakerLower.includes('anna') || speakerLower.includes('lily') ||
      speakerLower.includes('kate') || speakerLower.includes('mary') ||
      speakerLower.includes('elena') || speakerLower.includes('sophia')) {
    return 'female_warm_sarah';
  }
  
  // Male-sounding names get male voices
  if (speakerLower.includes('david') || speakerLower.includes('marcus') || 
      speakerLower.includes('john') || speakerLower.includes('mike') ||
      speakerLower.includes('alex') || speakerLower.includes('tom') ||
      speakerLower.includes('alaric') || speakerLower.includes('merlin')) {
    return 'male_deep_marcus';
  }
  
  // Default fallback
  return 'female_warm_sarah';
};

/**
 * Play audio preview in the browser
 * @param {string} audioUrl - The URL of the audio file
 * @returns {Promise<void>}
 */
export const playAudioPreview = async (audioUrl) => {
  try {
    console.log('🔊 Playing audio preview:', audioUrl);
    
    // Create audio element
    const audio = new Audio(audioUrl);
    
    // Set up event listeners
    audio.addEventListener('loadstart', () => {
      console.log('📥 Loading audio preview...');
    });
    
    audio.addEventListener('canplay', () => {
      console.log('✅ Audio preview ready to play');
    });
    
    audio.addEventListener('error', (e) => {
      console.error('❌ Audio preview error:', e);
      throw new Error('Failed to load audio preview');
    });
    
    audio.addEventListener('ended', () => {
      console.log('🎵 Audio preview finished');
    });
    
    // Play the audio
    await audio.play();
    
  } catch (error) {
    console.error('❌ Error playing audio preview:', error);
    throw error;
  }
};

/**
 * Generate and play a line preview in one action
 * @param {Object} lineData - The script line data
 * @param {string} userId - The user ID
 * @param {string} scriptId - The script ID (optional)
 * @param {string} lineId - The line ID (optional)
 * @param {Object} voiceSettings - Voice settings (optional)
 * @param {Object} voiceAssignments - Pre-loaded voice assignments (optional)
 * @returns {Promise<Object>} Preview result
 */
export const generateAndPlayPreview = async (lineData, userId, scriptId = null, lineId = null, voiceSettings = {}, voiceAssignments = null) => {
  try {
    // Generate the preview
    const previewResult = await generateLinePreview(lineData, userId, scriptId, lineId, voiceSettings, voiceAssignments);
    
    if (previewResult.success) {
      // Play the preview
      await playAudioPreview(previewResult.preview_url);
      return previewResult;
    } else {
      throw new Error(previewResult.error);
    }
    
  } catch (error) {
    console.error('❌ Error in generate and play preview:', error);
    return {
      success: false,
      error: error.message,
      preview_url: null
    };
  }
};

/**
 * Voice mapping for display purposes
 */
export const VOICE_OPTIONS = [
  { id: 'standard-female-1', name: 'Sarah (Warm)', gender: 'female' },
  { id: 'standard-male-1', name: 'David (Strong)', gender: 'male' },
  { id: 'standard-female-2', name: 'Emma (Soft)', gender: 'female' },
  { id: 'standard-male-2', name: 'Marcus (Deep)', gender: 'male' },
  { id: 'premium-narrator', name: 'Premium Narrator', gender: 'neutral', premium: true }
];

/**
 * Get voice display name by ID
 * @param {string} voiceId - The voice ID
 * @returns {string} Display name
 */
export const getVoiceDisplayName = (voiceId) => {
  const voice = VOICE_OPTIONS.find(v => v.id === voiceId);
  return voice ? voice.name : voiceId;
};
