import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, Plus, Trash2, Play, Music, ArrowLeft, Save } from 'lucide-react';
import { saveScriptToDatabase } from '../services/scriptSaveService';
import { generateAndPlayPreview, VOICE_OPTIONS } from '../services/linePreviewService';
import SimpleAudioPlayer from './AudioPlayer/SimpleAudioPlayer';
import { generateFullScriptTTS, isFullScriptTTSAvailable } from '../services/fullScriptTTSService';
import { createDemoAudioProduction } from '../services/demoAudioService';
import VoiceAssignmentPanel from './VoiceAssignmentPanel';

const ScriptEditorScreen = ({ script, onBack, user, onSave, onScriptUpdate }) => {
  const [scriptLines, setScriptLines] = useState([]);
  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [selectedLineId, setSelectedLineId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [previewingLineId, setPreviewingLineId] = useState(null);
  const [voiceAssignments, setVoiceAssignments] = useState({});

  // Full audio player state
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [timingMetadata, setTimingMetadata] = useState(null);
  const [isGeneratingFullAudio, setIsGeneratingFullAudio] = useState(false);

  // Initialize script lines when script prop changes
  useEffect(() => {
    if (script && script.lines) {
      // Normalize field names to match Script Editor expectations
      const normalizedLines = script.lines.map(line => ({
        id: line.id,
        speaker: line.speaker || line.speaker_name || 'Narrator',
        text: line.text || line.text_content || '',
        type: line.type || line.line_type || 'dialogue',
        emotion: line.emotion || line.emotion_type || 'neutral',
        voice: line.voice || 'default'
      }));

      console.log('🔍 Normalized script lines:', {
        originalCount: script.lines.length,
        normalizedCount: normalizedLines.length,
        firstOriginal: script.lines[0],
        firstNormalized: normalizedLines[0]
      });

      setScriptLines(normalizedLines);
    }
  }, [script]);

  // Auto-play audio if the script has audio and autoPlayAudio flag is set
  useEffect(() => {
    console.log('🔍 Script object for audio:', {
      hasScript: !!script,
      title: script?.title,
      autoPlayAudio: script?.autoPlayAudio,
      audioUrl: script?.audioUrl,
      hasAudio: script?.hasAudio,
      audioDuration: script?.audioDuration,
      scriptKeys: script ? Object.keys(script) : 'no script'
    });

    if (script && script.autoPlayAudio && script.audioUrl) {
      console.log('🎵 Auto-playing audio for script:', script.title);
      console.log('🎵 Audio URL:', script.audioUrl);
      setAudioUrl(script.audioUrl);
      setShowAudioPlayer(true);
    } else if (script && script.autoPlayAudio) {
      console.warn('⚠️ Auto-play requested but no audioUrl found:', {
        audioUrl: script.audioUrl,
        hasAudio: script.hasAudio
      });
    }
  }, [script]);

  const annotationOptions = [
    { name: 'whisper', label: 'Whisper', icon: '🤫' },
    { name: 'shout', label: 'Shout', icon: '📢' },
    { name: 'happy', label: 'Happy', icon: '😊' },
    { name: 'sad', label: 'Sad', icon: '😢' },
    { name: 'angry', label: 'Angry', icon: '😠' },
    { name: 'scared', label: 'Scared', icon: '😨' },
    { name: 'excited', label: 'Excited', icon: '🤩' },
    { name: 'neutral', label: 'Neutral', icon: '😐' }
  ];

  const updateScriptLine = (lineId, field, value) => {
    setScriptLines(prevLines =>
      prevLines.map(line =>
        line.id === lineId ? { ...line, [field]: value } : line
      )
    );
    setHasUnsavedChanges(true);
  };

  const saveScript = async () => {
    setIsSaving(true);
    try {
      console.log('Save script - user object:', user);
      console.log('Save script - user.id:', user?.id);
      console.log('Save script - user keys:', user ? Object.keys(user) : 'user is null/undefined');

      // Try different possible user ID properties
      const userId = user?.id || user?.user_id || user?.sub || user?.uid;
      console.log('Save script - detected userId:', userId);

      if (!userId) {
        alert('Authentication error: User ID not found. Please sign out and sign in again.');
        return;
      }

      const scriptData = {
        id: script.id || crypto.randomUUID(),
        title: script.title,
        lines: scriptLines,
        metadata: {
          ...script.metadata,
          charactersCount: [...new Set(scriptLines.map(line => line.speaker))].length,
          dialogueCount: scriptLines.filter(line => line.type === 'dialogue').length,
          narrationCount: scriptLines.filter(line => line.type === 'narration').length,
        }
      };

      const result = await saveScriptToDatabase(scriptData, userId);

      if (result.success) {
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        alert('Script saved successfully!');
        // Trigger library refresh callback
        if (onSave) {
          onSave();
        }
      } else {
        throw new Error(result.error || 'Failed to save script');
      }
    } catch (error) {
      console.error('Error saving script:', error);
      alert(`Error saving script: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const addAnnotationToLine = (lineId, annotation) => {
    setScriptLines(prevLines =>
      prevLines.map(line =>
        line.id === lineId
          ? { ...line, annotations: [...(line.annotations || []), annotation] }
          : line
      )
    );
    setHasUnsavedChanges(true);
    setShowAnnotationModal(false);
  };

  const removeAnnotationFromLine = (lineId, annotation) => {
    setScriptLines(prevLines =>
      prevLines.map(line =>
        line.id === lineId
          ? { ...line, annotations: (line.annotations || []).filter(a => a !== annotation) }
          : line
      )
    );
    setHasUnsavedChanges(true);
  };

  const openAnnotationModal = (lineId) => {
    setSelectedLineId(lineId);
    setShowAnnotationModal(true);
  };

  // Handle line preview generation and playback
  const handleLinePreview = async (line) => {
    try {
      setPreviewingLineId(line.id);

      console.log('🎵 Generating preview for line:', line);

      // Get user ID
      const userId = user?.id || user?.user_id || user?.sub || user?.uid;
      if (!userId) {
        throw new Error('User authentication required for preview');
      }

      // Generate and play the preview with voice assignments
      const result = await generateAndPlayPreview(
        line,
        userId,
        script?.id,
        line.id,
        {}, // voiceSettings
        voiceAssignments // Pass current voice assignments
      );

      if (result.success) {
        console.log('✅ Preview generated and playing:', result.preview_url);
      } else {
        throw new Error(result.error || 'Failed to generate preview');
      }

    } catch (error) {
      console.error('❌ Preview error:', error);
      alert(`Preview error: ${error.message}`);
    } finally {
      setPreviewingLineId(null);
    }
  };

  // Generate full audio production
  const generateFullAudio = async () => {
    setIsGeneratingFullAudio(true);
    try {
      console.log('🎵 Generating full audio production for script...');

      if (scriptLines.length === 0) {
        throw new Error('No script lines to generate audio for');
      }

      // Get user ID for authentication
      const userId = user?.id || user?.user_id || user?.sub || user?.uid;
      if (!userId) {
        throw new Error('User authentication required for audio generation');
      }

      // Prepare script data for Full Script TTS
      // CRITICAL: Always use the script.id from the loaded script to ensure proper database linking
      console.log('🔍 Debug script object:', {
        script: script,
        scriptId: script?.id,
        scriptKeys: script ? Object.keys(script) : 'script is null/undefined',
        scriptType: typeof script
      });

      // Auto-save script if it doesn't have an ID
      let scriptId = script?.id;
      if (!scriptId) {
        console.log('💾 Script not saved yet, auto-saving before audio generation...');

        // Use the existing saveScript function logic
        const scriptData = {
          id: crypto.randomUUID(),
          title: script?.title || 'Untitled Script',
          lines: scriptLines,
          metadata: {
            ...script?.metadata,
            charactersCount: [...new Set(scriptLines.map(line => line.speaker))].length,
            dialogueCount: scriptLines.filter(line => line.type === 'dialogue').length,
            narrationCount: scriptLines.filter(line => line.type === 'narration').length,
            totalLines: scriptLines.length,
            generatedAt: script?.metadata?.generatedAt || new Date().toISOString()
          }
        };

        const result = await saveScriptToDatabase(scriptData, userId);

        if (result.success) {
          console.log('✅ Script auto-saved with ID:', scriptData.id);
          scriptId = scriptData.id;
          // Update the script object for future use
          script.id = scriptData.id;
        } else {
          throw new Error(result.error || 'Failed to auto-save script before audio generation');
        }
      }

      const scriptData = {
        id: scriptId, // Use the script ID (either existing or newly saved)
        title: script?.title || 'Untitled Script',
        lines: scriptLines
      };

      console.log('🔍 Script ID for audio generation:', {
        scriptId: scriptData.id,
        scriptTitle: script.title,
        linesCount: scriptLines.length
      });

      // Check if real Full Script TTS is available
      if (isFullScriptTTSAvailable()) {
        console.log('🚀 Using real Full Script TTS workflow...');

        // Call the real n8n Full Script TTS workflow
        const production = await generateFullScriptTTS(scriptData, { id: userId });

        if (production.success) {
          // Use real production data
          console.log('🎵 Setting audio URL:', production.audioUrl);
          console.log('📊 Setting timing metadata:', production.timingMetadata);

          setTimingMetadata(production.timingMetadata);
          setAudioUrl(production.audioUrl || production.individual_lines?.[0]?.audio_url);
          setShowAudioPlayer(true);

          console.log('✅ Real Full Script TTS completed:', {
            production_id: production.production_id,
            duration: production.totalDuration,
            audioUrl: production.audioUrl,
            lines: production.timingMetadata?.lines?.length || scriptLines.length,
            status: production.status,
            showAudioPlayer: true
          });

          // Refresh script list to show new audio production in library
          if (onScriptUpdate) {
            console.log('🔄 Refreshing script library after TTS completion...');
            onScriptUpdate();
          }
        } else if (production.processing) {
          // Handle successful background processing (CORS/timeout but S3 success)
          console.log('🔄 TTS processing completed in background - audio available in S3');
          alert(`✅ Audio generation completed successfully! 
          
The workflow processed in the background and generated a ${production.estimated_duration || '5+ minute'} audio file.
          
Check your S3 bucket or refresh the page to access the completed audio.`);

          // Refresh script list to show new audio production
          if (onScriptUpdate) {
            console.log('🔄 Refreshing script library after background TTS completion...');
            onScriptUpdate();
          }
        } else if (production.fallback_to_demo) {
          // Fallback to demo if real TTS fails
          console.log('⚠️ Full Script TTS failed, falling back to demo...');
          const demoProduction = createDemoAudioProduction(scriptLines);
          setTimingMetadata(demoProduction.timingMetadata);
          setAudioUrl(demoProduction.audioUrl);
          setShowAudioPlayer(true);
        } else {
          throw new Error(production.error || 'Full Script TTS generation failed');
        }
      } else {
        // Fallback to demo if webhook not configured
        console.log('⚠️ Full Script TTS webhook not configured, using demo...');
        const demoProduction = createDemoAudioProduction(scriptLines);
        setTimingMetadata(demoProduction.timingMetadata);
        setAudioUrl(demoProduction.audioUrl);
        setShowAudioPlayer(true);

        console.log('✅ Demo audio player ready with realistic timing metadata:', {
          duration: demoProduction.timingMetadata.total_duration,
          lines: demoProduction.timingMetadata.lines.length
        });
      }

    } catch (error) {
      console.error('❌ Error generating full audio:', error);
      alert(`Error generating audio: ${error.message}`);
    } finally {
      setIsGeneratingFullAudio(false);
    }
  };

  // Toggle audio player visibility
  const toggleAudioPlayer = () => {
    setShowAudioPlayer(!showAudioPlayer);
  };

  /* ─────────────────────────────────────────────
     Empty state
     ───────────────────────────────────────────── */
  if (!script) {
    return (
      <div className="min-h-full animate-fade-in flex items-center justify-center p-6">
        <div className="text-center bg-white/80 backdrop-blur-sm border-2 border-cream-300/50 rounded-3xl p-8 shadow-card max-w-sm">
          <h2 className="text-xl font-display font-bold text-sleep-900 mb-3">No Script Loaded</h2>
          <p className="text-sleep-500 mb-6 font-body text-sm">Generate a script first to use the editor.</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-dream-glow hover:bg-dream-aurora text-white font-display font-bold rounded-2xl transition-all duration-200 shadow-glow-sm active:scale-[0.98] text-sm"
          >
            Back to Create
          </button>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────
     Main editor
     ───────────────────────────────────────────── */
  return (
    <div className="min-h-full animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-white/80 backdrop-blur-sm border-b border-cream-300/50">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 rounded-xl font-display font-semibold text-sm text-sleep-500 hover:text-sleep-800 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-lg font-display font-bold text-sleep-900">{script.title || 'Generated Script'}</h1>
          {hasUnsavedChanges && (
            <span className="text-xs text-dream-glow font-display font-semibold mt-0.5">• Unsaved changes</span>
          )}
          {lastSaved && !hasUnsavedChanges && (
            <span className="text-xs text-success font-display font-semibold mt-0.5">Saved {lastSaved.toLocaleTimeString()}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Full Audio Controls */}
          <button
            onClick={generateFullAudio}
            disabled={isGeneratingFullAudio || scriptLines.length === 0}
            data-audio-generation
            className={`px-3 py-2 rounded-xl font-display font-semibold text-xs flex items-center gap-1.5 transition-all ${isGeneratingFullAudio || scriptLines.length === 0
                ? 'bg-cream-300/50 text-sleep-400 cursor-not-allowed'
                : 'bg-pastel-lavender text-white hover:bg-pastel-lavender/80 active:scale-[0.97]'
              }`}
          >
            <Music className="w-3.5 h-3.5" />
            {isGeneratingFullAudio ? 'Generating…' : 'Full Audio'}
          </button>

          {audioUrl && (
            <button
              onClick={toggleAudioPlayer}
              className="px-3 py-2 rounded-xl font-display font-semibold text-xs bg-cream-200 hover:bg-cream-300 text-sleep-700 flex items-center gap-1.5 transition-all"
            >
              <Play className="w-3.5 h-3.5" />
              {showAudioPlayer ? 'Hide' : 'Player'}
            </button>
          )}

          <button
            onClick={saveScript}
            disabled={isSaving || !hasUnsavedChanges}
            className={`px-3 py-2 rounded-xl font-display font-semibold text-xs flex items-center gap-1.5 transition-all ${hasUnsavedChanges
                ? 'bg-dream-glow hover:bg-dream-aurora text-white active:scale-[0.97]'
                : 'bg-cream-200 text-sleep-400 cursor-not-allowed'
              }`}
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={onBack}
            className="p-2 text-sleep-400 hover:text-sleep-800 transition-colors rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Voice Assignment View */}
      <div className="mb-4 px-5 pt-4">
        <VoiceAssignmentPanel
          script={script}
          user={user}
          scriptLines={scriptLines}
          voiceAssignments={voiceAssignments}
          onVoiceAssignmentsChange={setVoiceAssignments}
        />
      </div>

      <div className="flex h-[calc(100vh-400px)]">
        {/* Main Script Editor */}
        <div className="flex-1 px-5 pb-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-3">
            {scriptLines.map((line) => (
              <div
                key={line.id}
                className={`border-2 rounded-2xl p-4 transition-all duration-200 ${(line.type || line.line_type) === 'narration'
                    ? 'bg-cream-100/60 border-cream-300/40 hover:border-cream-400'
                    : 'bg-white/80 border-cream-300/50 hover:border-dream-glow/30 shadow-card'
                  }`}
              >
                {/* Line Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <select
                      value={line.speaker || 'Narrator'}
                      onChange={(e) => updateScriptLine(line.id, 'speaker', e.target.value)}
                      className="px-3 py-1.5 bg-cream-100/80 border-2 border-cream-300/60 rounded-xl text-sleep-900 text-sm font-display font-semibold focus:outline-none focus:border-dream-glow/50 transition-all"
                    >
                      <option value="Narrator">Narrator</option>
                      {[...new Set(scriptLines.map(line => line.speaker || 'Narrator'))].filter(speaker => speaker !== 'Narrator').map((speaker, index) => (
                        <option key={index} value={speaker}>{speaker}</option>
                      ))}
                    </select>
                    {line.type === 'narration' && (
                      <span className="text-xs bg-pastel-mint/30 text-pastel-mint px-2 py-1 rounded-lg font-display font-semibold border border-pastel-mint/20">NARRATION</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openAnnotationModal(line.id)}
                      className="p-1.5 text-sleep-400 hover:text-dream-glow transition-colors rounded-lg"
                      title="Add TTS Annotation"
                    >
                      🎭
                    </button>
                    <button
                      onClick={() => handleLinePreview(line)}
                      disabled={previewingLineId === line.id}
                      className={`p-1.5 transition-colors rounded-lg ${previewingLineId === line.id
                          ? 'text-dream-glow animate-pulse cursor-not-allowed'
                          : 'text-sleep-400 hover:text-dream-glow'
                        }`}
                      title={previewingLineId === line.id ? 'Generating preview...' : 'Preview with Cartesia TTS'}
                    >
                      {previewingLineId === line.id ? '🎵' : '▶️'}
                    </button>
                  </div>
                </div>

                {/* Annotations */}
                {line.annotations && line.annotations.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {line.annotations.map((annotation, index) => {
                      const annotationOption = annotationOptions.find(opt => opt.name === annotation);
                      return (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 bg-dream-stardust/30 text-dream-aurora text-xs px-2.5 py-1 rounded-full border border-dream-glow/20 font-display font-semibold"
                        >
                          <span>{annotationOption?.icon || '🎭'}</span>
                          <span>{annotationOption?.label || annotation}</span>
                          <button
                            onClick={() => removeAnnotationFromLine(line.id, annotation)}
                            className="ml-1 text-dream-aurora hover:text-danger transition-colors"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Line Text */}
                <textarea
                  value={line.text || ''}
                  onChange={(e) => updateScriptLine(line.id, 'text', e.target.value)}
                  className="w-full bg-cream-100/60 border-2 border-cream-300/40 rounded-xl p-3 text-sleep-900 placeholder-sleep-400 focus:outline-none focus:border-dream-glow/40 resize-none text-sm font-body transition-all"
                  rows={Math.max(2, Math.ceil((line.text || '').length / 80))}
                  placeholder="Enter dialogue or narration..."
                />
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* Audio Player */}
      {showAudioPlayer && audioUrl && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t-2 border-cream-300/50 p-4 z-40 max-h-[60vh] overflow-y-auto shadow-dream">
          <SimpleAudioPlayer
            audioUrl={audioUrl}
            timingMetadata={timingMetadata || null}
          />
        </div>
      )}

      {/* Annotation Modal */}
      {showAnnotationModal && (
        <div className="fixed inset-0 bg-sleep-950/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-lg border-2 border-cream-300/50 rounded-3xl p-6 w-full max-w-md shadow-dream">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-display font-bold text-sleep-900">Add TTS Annotation</h3>
              <button
                onClick={() => setShowAnnotationModal(false)}
                className="text-sleep-400 hover:text-sleep-800 transition-colors p-1.5 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {annotationOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => addAnnotationToLine(selectedLineId, option.name)}
                  className="flex items-center gap-3 p-3.5 bg-cream-100/80 border-2 border-cream-300/50 rounded-2xl hover:border-dream-glow/30 hover:bg-dream-stardust/20 transition-all active:scale-[0.97]"
                >
                  <span className="text-xl">{option.icon}</span>
                  <span className="text-sleep-900 font-display font-semibold text-sm">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScriptEditorScreen;
