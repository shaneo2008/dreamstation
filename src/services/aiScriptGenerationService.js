// AI Script Generation Service - Async polling pattern
import { supabase } from '../lib/supabase.js';

const AI_SCRIPT_WEBHOOK = import.meta.env.VITE_N8N_AI_SCRIPT_GENERATION_WEBHOOK;
const POLLING_INTERVAL = 3000; // 3 seconds
const MAX_POLLING_TIME = 300000; // 5 minutes

// Helper function to poll Supabase for script generation status
const pollScriptStatus = async (scriptId, startTime = Date.now()) => {
  const elapsed = Date.now() - startTime;

  if (elapsed > MAX_POLLING_TIME) {
    throw new Error('Script generation polling timed out after 5 minutes');
  }

  const { data, error } = await supabase
    .from('scripts')
    .select('*, lines:script_lines(*)')
    .eq('id', scriptId)
    .single();

  if (error) {
    console.error('❌ Error polling script status:', error);
    throw error;
  }

  console.log(`🔄 Polling script ${scriptId}: status=${data.status || 'unknown'}`);

  // Check if completed (status is 'ready' AND script has lines)
  // We check for 'ready' status to ensure the title has been updated by n8n
  if (data.status === 'ready' && data.lines && data.lines.length > 0) {
    console.log('✅ Script generation completed!', data);

    // Map Supabase column names to the format the UI expects
    const mappedLines = data.lines.map((line) => ({
      ...line,
      type: line.line_type || line.type || 'dialogue',
      speaker: line.speaker_name || line.speaker || 'Narrator',
      text: line.text_content || line.text || '',
      emotion: line.emotion_type || line.emotion || 'neutral',
      pause_after: line.pause_after ?? (line.line_type === 'narration' ? 1.0 : 0.5),
    }));

    return {
      success: true,
      script_id: data.id,
      script: {
        title: data.title,
        lines: mappedLines,
        metadata: data.metadata || {}
      }
    };
  }

  // Check if failed
  if (data.status === 'failed' || data.status === 'error') {
    throw new Error(`Script generation failed: ${data.error_message || 'Unknown error'}`);
  }

  // Still processing, wait and poll again
  await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
  return pollScriptStatus(scriptId, startTime);
};

export const generateAIScript = async (payload) => {
  console.log('🎬 Starting AI script generation...');

  if (!AI_SCRIPT_WEBHOOK) {
    throw new Error('AI Script Generation webhook URL not configured');
  }

  try {
    console.log('📡 Calling n8n AI Script Generation workflow (async mode)...', {
      webhook: AI_SCRIPT_WEBHOOK,
      story_id: payload.storyId,
      user_id: payload.userId
    });

    // Call webhook - synchronous workflow that processes AI generation before responding
    // Increased timeout to 180 seconds (3 minutes) for AI processing
    const response = await fetch(AI_SCRIPT_WEBHOOK, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(180000) // 180 second timeout for AI generation
    });

    console.log('📡 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ n8n workflow error response:', errorText);
      throw new Error(`n8n workflow failed: ${response.status} ${response.statusText}`);
    }

    // Get response text first to handle empty/malformed responses
    const responseText = await response.text();
    console.log('📨 Raw response from n8n (length:', responseText.length, '):', responseText.substring(0, 500));

    if (!responseText || responseText.trim() === '') {
      throw new Error('Empty response from n8n workflow');
    }

    let result;
    try {
      result = JSON.parse(responseText);
      console.log('✅ Successfully parsed JSON response:', result);
    } catch (parseError) {
      console.error('❌ Failed to parse JSON response:', parseError);
      console.error('Full response text:', responseText);
      throw new Error(`Invalid JSON response from n8n: ${parseError.message}`);
    }

    // Check if we got an immediate script response (old workflow behavior)
    if (result.success && result.data?.script?.lines) {
      console.log('✅ Script generated immediately (old workflow)');
      return result;
    }

    // Check if we got a script_id for polling (new async workflow)
    if (result.success && result.script_id) {
      const scriptId = result.script_id;
      console.log(`🔄 Starting to poll script ${scriptId} every ${POLLING_INTERVAL / 1000}s...`);

      // Start polling Supabase for completion
      const finalResult = await pollScriptStatus(scriptId);

      console.log('✅ AI Script generation completed:', finalResult);
      return {
        success: true,
        data: {
          script: finalResult.script,
          characters: finalResult.script?.metadata?.characters || []
        }
      };
    }

    throw new Error('Invalid response from n8n workflow - no script or script_id');

  } catch (error) {
    console.error('❌ AI Script generation failed:', error);
    throw error;
  }
};

export const isAIScriptGenerationAvailable = () => {
  return !!AI_SCRIPT_WEBHOOK;
};
