// Full Script TTS Service - Real n8n workflow integration with async polling
// Replaces demoAudioService with actual Cartesia TTS generation

import { getVoiceAssignments } from './cartesiaVoiceService.js';
import { supabase } from '../lib/supabase.js';

const FULL_SCRIPT_TTS_WEBHOOK = "https://learncastai.app.n8n.cloud/webhook/full-script-tts-dev"; // ⚠️ DEV MODE: Using Lambda v2 workflow
// const FULL_SCRIPT_TTS_WEBHOOK = import.meta.env.VITE_N8N_FULL_SCRIPT_TTS_WEBHOOK;
const POLLING_INTERVAL = 5000; // 5 seconds
const MAX_POLLING_TIME = 1200000; // 20 minutes

// Poll Supabase for audio production completion
const pollProductionStatus = async (productionId, startTime = Date.now()) => {
  const elapsed = Date.now() - startTime;

  if (elapsed > MAX_POLLING_TIME) {
    throw new Error('Audio production polling timed out after 20 minutes');
  }

  const { data, error } = await supabase
    .from('audio_productions')
    .select('*')
    .eq('id', productionId)
    .single();

  if (error) {
    console.error('❌ Error polling production status:', error);
    throw error;
  }

  console.log(`🔄 Polling production ${productionId}: status=${data.status || 'unknown'}, progress=${data.progress || 0}%`);

  // Check if completed
  if (data.status === 'completed' || data.status === 'ready') {
    console.log('✅ Audio production completed!', data);
    const audioUrl = data.audio_url || '';
    return {
      success: true,
      production_id: data.id,
      audioUrl,
      audio_url: audioUrl,
      duration: data.audio_duration || data.duration || data.estimated_duration,
      status: data.status,
      lines_processed: data.total_lines
    };
  }

  // Check if failed
  if (data.status === 'failed' || data.status === 'error') {
    throw new Error(`Audio production failed: ${data.error_message || 'Unknown error'}`);
  }

  // Still processing, wait and poll again
  await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
  return pollProductionStatus(productionId, startTime);
};

export const generateFullScriptTTS = async (scriptData, user) => {
  console.log('🎵 Starting full script TTS generation for', scriptData.lines.length, 'lines');

  if (!FULL_SCRIPT_TTS_WEBHOOK) {
    throw new Error('Full Script TTS webhook URL not configured');
  }

  // Get saved voice assignments from database
  console.log('🎭 Fetching voice assignments for script:', scriptData.id);
  const voiceAssignments = await getVoiceAssignments(scriptData.id, user.id);
  console.log('🎭 Retrieved voice assignments:', voiceAssignments);

  // Prepare payload for n8n workflow
  const payload = {
    user_id: user.id,
    script_id: scriptData.id,
    title: scriptData.title || 'Untitled Production',

    // Script data in the format n8n expects
    script_data: {
      script_lines: scriptData.lines.map((line, index) => {
        const speaker = line.speaker || 'Narrator';
        const assignedVoiceId = voiceAssignments[speaker] || 'e00d0e4c-a5c8-443f-a8a3-473eb9a62355';

        return {
          line_id: line.id || crypto.randomUUID(),
          line_index: index,
          text: line.text,
          speaker: speaker,
          emotion: line.emotion || 'neutral',
          voice_id: assignedVoiceId,
          cartesia_voice_id: assignedVoiceId,
          line_type: line.type || 'dialogue',
          pause_after: line.pause_after // ✅ NEW: Pass pause data for Lambda v2
        };
      }),
      title: scriptData.title || 'Untitled Production',
      total_lines: scriptData.lines.length
    },

    production_settings: {
      audio_format: 'wav',
      sample_rate: 22050,
      pause_between_lines: 0.5
    },

    voice_assignments: voiceAssignments
  };

  try {
    console.log('📡 Calling n8n Full Script TTS workflow (async mode)...', {
      webhook: FULL_SCRIPT_TTS_WEBHOOK,
      script_id: payload.script_id,
      user_id: payload.user_id,
      lines: payload.script_data.script_lines.length
    });

    // Call webhook - it will respond immediately with production_id
    const response = await fetch(FULL_SCRIPT_TTS_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000) // 30 second timeout for initial response
    });

    if (!response.ok) {
      throw new Error(`n8n workflow failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('📨 Received immediate response from n8n:', result);

    if (!result.success || !result.production_id) {
      throw new Error('Invalid response from n8n workflow');
    }

    const productionId = result.production_id;
    console.log(`🔄 Starting to poll production ${productionId} every ${POLLING_INTERVAL / 1000}s...`);

    // Start polling Supabase for completion
    const finalResult = await pollProductionStatus(productionId);

    console.log('✅ Full Script TTS generation completed:', finalResult);
    return finalResult;

  } catch (error) {
    console.error('❌ Full Script TTS generation failed:', error);

    return {
      success: false,
      error: error.message,
      fallback_to_demo: true
    };
  }
};

// Note: Helper functions for voice assignments and duration estimation
// were removed as they're not currently used in the simplified payload structure.
// These can be re-added later when implementing advanced voice mapping features.

// Check if Full Script TTS is available
export const isFullScriptTTSAvailable = () => {
  return !!FULL_SCRIPT_TTS_WEBHOOK;
};

// Get webhook URL for debugging
export const getFullScriptTTSWebhook = () => {
  return FULL_SCRIPT_TTS_WEBHOOK;
};
