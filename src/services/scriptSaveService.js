// Script Save Service - Supabase Implementation
// Handles saving and loading scripts using Supabase with proper RLS policies
// Scripts are stored with direct user ownership (user_id)

import { supabase } from '../lib/supabase.js';

// Generate a proper UUID v4
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Deduplication cache to prevent React Strict Mode double-saves
const saveCache = new Map();
const CACHE_TTL = 2000; // 2 seconds

function getCacheKey(scriptData, userId) {
  const title = scriptData.title || 'Untitled Story';
  const linesCount = scriptData.lines?.length || 0;
  const firstLine = scriptData.lines?.[0]?.text || '';
  return `${userId}-${title}-${linesCount}-${firstLine.slice(0, 50)}`;
}

// Safely parse metadata whether it arrives as an object, a JSON string,
// or the double-encoded "=\"{...}\"" format produced by an older n8n expression bug.
function parseMetadata(raw) {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;

  try {
    let str = raw;

    // Strip the leading =" and trailing " if present (double-encoded artifact)
    if (typeof str === 'string' && str.startsWith('="')) {
      str = str.slice(2);
      if (str.endsWith('"')) str = str.slice(0, -1);
      // Unescape the inner string
      str = str.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }

    return JSON.parse(str);
  } catch (e) {
    console.warn('⚠️ Could not parse script metadata:', e.message);
    return {};
  }
}

export const saveScriptToDatabase = async (scriptData, userId) => {
  try {
    console.log('💾 Saving script to Supabase:', { scriptData, userId });
    
    if (!userId) {
      throw new Error('User ID is required to save story');
    }
    
    // Check cache to prevent React Strict Mode double-saves
    const cacheKey = getCacheKey(scriptData, userId);
    const now = Date.now();
    const cached = saveCache.get(cacheKey);
    
    if (cached && (now - cached) < CACHE_TTL) {
      console.log('⚠️ Duplicate save detected, skipping (React Strict Mode protection)');
      return { success: false, reason: 'duplicate_save', cached: true };
    }
    
    // Mark this save attempt in cache
    saveCache.set(cacheKey, now);
    
    // Clean up old cache entries
    for (const [key, timestamp] of saveCache.entries()) {
      if (now - timestamp > CACHE_TTL) {
        saveCache.delete(key);
      }
    }
    
    const scriptId = scriptData.id || generateUUID();
    
    // Prepare script data for Supabase
    const scriptToSave = {
      id: scriptId,
      user_id: userId,
      title: scriptData.title || 'Untitled Story',
      status: 'draft',
      total_lines: scriptData.lines?.length || 0,
      estimated_duration: Math.ceil((scriptData.lines?.length || 0) * 0.5), // rough estimate
      metadata: scriptData.metadata || null,
      updated_at: new Date().toISOString()
    };
    
    // Upsert script record
    const { data: script, error: scriptError } = await supabase
      .from('scripts')
      .upsert(scriptToSave, { onConflict: 'id' })
      .select()
      .single();
    
    if (scriptError) {
      console.error('❌ Script upsert error:', scriptError);
      throw new Error(`Failed to save story: ${scriptError.message}`);
    }
    
    console.log('✅ Script saved to Supabase:', script.id);
    
    // Save script lines if provided
    if (scriptData.lines && scriptData.lines.length > 0) {
      // Delete existing lines for this script
      await supabase
        .from('script_lines')
        .delete()
        .eq('script_id', scriptId);
      
      // Prepare lines for insertion
      const linesToSave = scriptData.lines.map((line, index) => ({
        script_id: scriptId,
        line_number: index + 1,
        speaker_name: line.speaker || 'Narrator',
        line_type: line.type === 'narration' ? 'narration' : 'dialogue',
        text_content: line.text || '',
        emotion_type: (line.emotion || 'neutral').toLowerCase(),
        emotion_intensity: line.intensity || 'medium',
        is_generated: line.isGenerated || false
      }));
      
      // Insert new lines
      const { error: linesError } = await supabase
        .from('script_lines')
        .insert(linesToSave);
      
      if (linesError) {
        console.error('❌ Script lines error:', linesError);
        throw new Error(`Failed to save story lines: ${linesError.message}`);
      }
      
      console.log('✅ Script lines saved:', linesToSave.length);
    }
    
    return {
      success: true,
      scriptId: scriptId,
      message: 'Script saved successfully to Supabase'
    };

  } catch (error) {
    console.error('❌ Error saving script to Supabase:', error);
    return { success: false, error: error.message };
  }
};

export const loadSavedScripts = async (userId) => {
  try {
    console.log('📚 Loading scripts from Supabase for user:', userId);
    
    // Load scripts with their audio productions and line counts
    const { data: scripts, error } = await supabase
      .from('scripts')
      .select(`
        *,
        audio_productions (
          id,
          audio_url,
          audio_duration,
          status,
          created_at
        ),
        script_lines (
          id,
          speaker_name,
          text_content,
          line_type,
          emotion_type,
          emotion_intensity,
          line_number
        )
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error loading scripts:', error);
      throw new Error(`Failed to load scripts: ${error.message}`);
    }
    
    console.log('✅ Scripts loaded from Supabase:', scripts?.length || 0);
    
    // Debug: Log audio productions for each script
    scripts?.forEach((script, index) => {
      const meta = parseMetadata(script.metadata);
      console.log(`🎵 Script ${index + 1} (${script.title}):`, {
        id: script.id,
        hasAudioProductions: script.audio_productions && script.audio_productions.length > 0,
        audioUrl: script.audio_productions?.[0]?.audio_url,
        summary: meta.summary || '(none)',
        characters: meta.characters?.length || 0
      });
    });
    
    // Transform scripts to match expected format
    const transformedScripts = (scripts || []).map(script => {
      const lines = script.script_lines || [];
      const speakers = [...new Set(lines.map(line => line.speaker_name))].filter(Boolean);

      // Parse metadata defensively — handles object, JSON string, and double-encoded string
      const parsedMetadata = parseMetadata(script.metadata);

      return {
        id: script.id,
        story_id: script.story_id || null,
        title: script.title,
        user_id: script.user_id,
        status: script.status,
        lines: lines,
        hasAudio: script.audio_productions && script.audio_productions.length > 0,
        audioUrl: script.audio_productions?.[0]?.audio_url || null,
        audioDuration: script.audio_productions?.[0]?.audio_duration || null,
        audioStatus: script.audio_productions?.[0]?.status || null,
        // Spread parsed metadata (preserving summary, characters, etc.)
        // then layer computed counts on top
        metadata: {
          ...parsedMetadata,
          totalLines: lines.length,
          charactersCount: speakers.length,
          dialogueCount: lines.filter(line => line.line_type === 'dialogue').length,
          narrationCount: lines.filter(line => line.line_type === 'narration').length
        },
        createdAt: script.created_at,
        lastModified: script.updated_at
      };
    });
    
    return {
      success: true,
      scripts: transformedScripts
    };

  } catch (error) {
    console.error('❌ Error loading scripts from Supabase:', error);
    return {
      success: false,
      error: error.message,
      scripts: []
    };
  }
};

// Load a single script by ID
export const loadScript = async (scriptId, userId) => {
  try {
    console.log('📖 Loading script from Supabase:', { scriptId, userId });
    
    // Load script with lines and audio productions
    const { data: script, error } = await supabase
      .from('scripts')
      .select(`
        *,
        script_lines (
          *
        ),
        audio_productions (
          id,
          audio_url,
          audio_duration,
          status,
          created_at
        )
      `)
      .eq('id', scriptId)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('❌ Error loading script:', error);
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Story not found' };
      }
      throw new Error(`Failed to load story: ${error.message}`);
    }
    
    if (!script) {
      console.log('Script not found in Supabase');
      return { success: false, error: 'Story not found' };
    }
    
    console.log('✅ Script loaded from Supabase:', script.title);
    
    const transformedLines = (script.script_lines || []).map(line => ({
      id: line.id,
      speaker: line.speaker_name,
      type: line.line_type,
      text: line.text_content,
      emotion: line.emotion_type,
      intensity: line.emotion_intensity,
      isGenerated: line.is_generated
    }));

    // Parse metadata defensively — same logic as loadSavedScripts
    const parsedMetadata = parseMetadata(script.metadata);

    const transformedScript = {
      id: script.id,
      title: script.title,
      user_id: script.user_id,
      status: script.status,
      lines: transformedLines,
      hasAudio: script.audio_productions && script.audio_productions.length > 0,
      audioUrl: script.audio_productions?.[0]?.audio_url || null,
      audioDuration: script.audio_productions?.[0]?.audio_duration || null,
      audioStatus: script.audio_productions?.[0]?.status || null,
      metadata: {
        ...parsedMetadata,
        totalLines: transformedLines.length,
        charactersCount: [...new Set(transformedLines.map(line => line.speaker))].filter(Boolean).length,
        dialogueCount: transformedLines.filter(line => line.type === 'dialogue').length,
        narrationCount: transformedLines.filter(line => line.type === 'narration').length
      },
      createdAt: script.created_at,
      lastModified: script.updated_at
    };

    console.log('✅ Script loaded successfully from Supabase');

    return {
      success: true,
      script: transformedScript
    };

  } catch (error) {
    console.error('❌ Error loading script from Supabase:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Delete a script by ID
export const deleteScript = async (scriptId, userId) => {
  try {
    console.log('🗑️ Deleting script from Supabase:', { scriptId, userId });
    
    // Delete script (script_lines will be cascade deleted)
    const { error } = await supabase
      .from('scripts')
      .delete()
      .eq('id', scriptId)
      .eq('user_id', userId);
    
    if (error) {
      console.error('❌ Error deleting script:', error);
      throw new Error(`Failed to delete story: ${error.message}`);
    }

    console.log('✅ Script deleted successfully from Supabase');
    return { success: true };

  } catch (error) {
    console.error('❌ Error deleting script from Supabase:', error);
    return { success: false, error: error.message };
  }
};
