import React, { useState, useEffect } from 'react';
import { X, Music, ArrowLeft, Save } from 'lucide-react';
import { saveScriptToDatabase } from '../services/scriptSaveService';
import { generateAndPlayPreview } from '../services/linePreviewService';
import { generateFullScriptTTS, isFullScriptTTSAvailable } from '../services/fullScriptTTSService';
import { createDemoAudioProduction } from '../services/demoAudioService';
import VoiceAssignmentPanel from './VoiceAssignmentPanel';

const CHARACTER_TINTS = [
  'bg-[#3c281b]/90 border-[#7f5138]/45 text-[#ffd9c2]',
  'bg-[#2f2620]/90 border-[#5d5750]/45 text-[#f3dfcf]',
  'bg-[#2a2430]/90 border-[#6f5d86]/45 text-[#eadfff]',
  'bg-[#25312c]/90 border-[#4d7b68]/45 text-[#d9f0e5]',
  'bg-[#30241d]/90 border-[#8a6750]/45 text-[#f4dfd0]',
];

const getSpeakerTint = (speaker = 'Narrator') => {
  const hash = speaker.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
  return CHARACTER_TINTS[hash % CHARACTER_TINTS.length];
};

const ScriptEditorScreen = ({ script, onBack, user, onSave, onScriptUpdate, onPlayAudio }) => {
  const [scriptLines, setScriptLines] = useState([]);
  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [selectedLineId, setSelectedLineId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [previewingLineId, setPreviewingLineId] = useState(null);
  const [voiceAssignments, setVoiceAssignments] = useState({});

  // Full audio generation state (playback is handled by global MiniPlayer)
  const [isGeneratingFullAudio, setIsGeneratingFullAudio] = useState(false);

  // Initialize script lines when script prop changes
  useEffect(() => {
    if (script && script.lines) {
      // Normalize field names to match Script Editor expectations
      const normalizedLines = script.lines.map(line => ({
        id: line.id,
        lineNumber: line.lineNumber || line.line_number || (line.line_index != null ? Number(line.line_index) + 1 : undefined),
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
    if (script && script.autoPlayAudio && script.audioUrl) {
      console.log('🎵 Auto-playing audio via global player:', script.title);
      onPlayAudio?.({
        audioUrl: script.audioUrl,
        title: script.title,
        scriptLines: scriptLines,
        timingMetadata: null
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [script?.autoPlayAudio, script?.audioUrl]);

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
        alert('Story saved successfully!');
        // Trigger library refresh callback
        if (onSave) {
          onSave();
        }
      } else {
        throw new Error(result.error || 'Failed to save story');
      }
    } catch (error) {
      console.error('Error saving script:', error);
      alert(`Error saving story: ${error.message}`);
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
        throw new Error('No story lines to generate audio for');
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
          title: script?.title || 'Untitled Story',
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
          throw new Error(result.error || 'Failed to auto-save story before audio generation');
        }
      }

      const scriptData = {
        id: scriptId, // Use the script ID (either existing or newly saved)
        title: script?.title || 'Untitled Story',
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
          console.log('✅ Real Full Script TTS completed:', {
            production_id: production.production_id,
            duration: production.totalDuration,
            audioUrl: production.audioUrl
          });

          onPlayAudio?.({
            audioUrl: production.audioUrl || production.individual_lines?.[0]?.audio_url,
            title: script?.title || 'Untitled',
            scriptLines: scriptLines,
            timingMetadata: production.timingMetadata
          });

          if (onScriptUpdate) onScriptUpdate();
        } else if (production.processing) {
          console.log('🔄 TTS processing completed in background - audio available in S3');
          alert(`✅ Audio generation completed successfully!\n\nThe workflow processed in the background and generated a ${production.estimated_duration || '5+ minute'} audio file.\n\nCheck your S3 bucket or refresh the page to access the completed audio.`);
          if (onScriptUpdate) onScriptUpdate();
        } else if (production.fallback_to_demo) {
          console.log('⚠️ Full Script TTS failed, falling back to demo...');
          const demoProduction = createDemoAudioProduction(scriptLines);
          onPlayAudio?.({
            audioUrl: demoProduction.audioUrl,
            title: script?.title || 'Untitled',
            scriptLines: scriptLines,
            timingMetadata: demoProduction.timingMetadata
          });
        } else {
          throw new Error(production.error || 'Full Script TTS generation failed');
        }
      } else {
        console.log('⚠️ Full Script TTS webhook not configured, using demo...');
        const demoProduction = createDemoAudioProduction(scriptLines);
        onPlayAudio?.({
          audioUrl: demoProduction.audioUrl,
          title: script?.title || 'Untitled',
          scriptLines: scriptLines,
          timingMetadata: demoProduction.timingMetadata
        });
      }

    } catch (error) {
      console.error('❌ Error generating full audio:', error);
      alert(`Error generating audio: ${error.message}`);
    } finally {
      setIsGeneratingFullAudio(false);
    }
  };

  /* ─────────────────────────────────────────────
     Empty state
     ───────────────────────────────────────────── */
  if (!script) {
    return (
      <div className="min-h-full animate-fade-in flex items-center justify-center p-6">
        <div className="text-center bg-[#24170f]/80 backdrop-blur-md border border-white/10 rounded-[24px] p-8 shadow-card max-w-sm text-cream-100">
          <h2 className="text-xl font-display font-bold text-cream-100 mb-3">No Story Loaded</h2>
          <p className="text-cream-300/75 mb-6 font-body text-sm">Generate a story first to use the editor.</p>
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
    <div className="min-h-full animate-fade-in text-cream-100">
      {/* Header */}
      <div className="px-4 py-3 bg-[#1b120c]/82 backdrop-blur-md border-b border-white/10">
        {/* Row 1: Back + title + close */}
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl font-display font-semibold text-sm text-cream-300/75 hover:text-cream-100 transition-all shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex-1 min-w-0 text-center">
            <h1 className="text-base font-display font-bold text-cream-100 truncate leading-tight">{script.title || 'Generated Story'}</h1>
            {hasUnsavedChanges && (
              <span className="text-xs text-dream-glow font-display font-semibold">• Unsaved changes</span>
            )}
            {lastSaved && !hasUnsavedChanges && (
              <span className="text-xs text-success font-display font-semibold">Saved {lastSaved.toLocaleTimeString()}</span>
            )}
          </div>
          <button
            onClick={onBack}
            className="p-1.5 text-cream-400/65 hover:text-cream-100 transition-colors rounded-xl shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Row 2: Action buttons */}
        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:justify-end">
          <button
            onClick={saveScript}
            disabled={isSaving || !hasUnsavedChanges}
            className={`px-3 py-2 rounded-xl font-display font-semibold text-xs flex items-center gap-1.5 transition-all ${hasUnsavedChanges
                ? 'bg-sleep-700/70 hover:bg-sleep-650/80 text-white active:scale-[0.97]'
                : 'bg-white/10 text-cream-400/60 cursor-not-allowed'
              }`}
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'Saving…' : 'Save'}
          </button>

          <button
            onClick={generateFullAudio}
            disabled={isGeneratingFullAudio || scriptLines.length === 0}
            data-audio-generation
            className={`px-4 py-2.5 rounded-2xl font-display font-semibold text-xs flex items-center gap-1.5 transition-all shadow-glow-sm ${isGeneratingFullAudio || scriptLines.length === 0
                ? 'bg-white/10 text-cream-400/60 cursor-not-allowed shadow-none'
                : 'bg-dream-glow text-white hover:bg-dream-aurora active:scale-[0.97]'
              }`}
          >
            <Music className="w-3.5 h-3.5" />
            {isGeneratingFullAudio ? 'Generating…' : 'Generate Full Story Audio'}
          </button>
        </div>
        <div className="flex justify-end mt-2">
          <span className="text-[11px] text-cream-400/65 font-body">Usually ready in about 90 seconds</span>
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
                    ? 'bg-[#1f1510]/80 border-white/8 hover:border-white/15'
                    : 'bg-[#24170f]/82 border-white/10 hover:border-dream-glow/30 shadow-card'
                  }`}
              >
                {/* Line Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1.5 border rounded-xl text-sm font-display font-semibold ${getSpeakerTint(line.speaker || 'Narrator')}`}>
                      {line.speaker || 'Narrator'}
                    </span>
                    {line.type === 'narration' && (
                      <span className="text-xs bg-pastel-mint/30 text-pastel-mint px-2 py-1 rounded-lg font-display font-semibold border border-pastel-mint/20">NARRATION</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openAnnotationModal(line.id)}
                      className="p-1.5 text-cream-400/65 hover:text-dream-glow transition-colors rounded-lg"
                      title="Add TTS Annotation"
                    >
                      🎭
                    </button>
                    <button
                      onClick={() => handleLinePreview(line)}
                      disabled={previewingLineId === line.id}
                      className={`p-1.5 transition-colors rounded-lg ${previewingLineId === line.id
                          ? 'text-dream-glow animate-pulse cursor-not-allowed'
                          : 'text-cream-400/65 hover:text-dream-glow'
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

                {/* Line Text — read-only */}
                <p className="w-full bg-black/10 rounded-xl p-3 text-cream-100 text-sm font-body leading-relaxed select-text border border-white/5">
                  {line.text || ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* Annotation Modal */}
      {showAnnotationModal && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-[#1b120c]/95 backdrop-blur-lg border border-white/10 rounded-[28px] p-6 w-full max-w-md shadow-dream text-cream-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-display font-bold text-cream-100">Add TTS Annotation</h3>
              <button
                onClick={() => setShowAnnotationModal(false)}
                className="text-cream-400/65 hover:text-cream-100 transition-colors p-1.5 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {annotationOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => addAnnotationToLine(selectedLineId, option.name)}
                  className="flex items-center gap-3 p-3.5 bg-[#24170f]/85 border border-white/10 rounded-2xl hover:border-dream-glow/30 hover:bg-[#2c1d13] transition-all active:scale-[0.97]"
                >
                  <span className="text-xl">{option.icon}</span>
                  <span className="text-cream-100 font-display font-semibold text-sm">{option.label}</span>
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
