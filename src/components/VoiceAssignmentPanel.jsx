import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, Wand2, Play, User, Mic, Check, Pause, ChevronRight, ArrowLeft } from 'lucide-react';
import {
  getVoiceById,
  getVoicesByFilter,
  getVoiceAssignments,
  saveVoiceAssignments,
  autoAssignVoices
} from '../services/cartesiaVoiceService';

const VoiceAssignmentPanel = ({ script, scriptLines, user, onVoiceAssignmentsChange }) => {
  const [voiceAssignments, setVoiceAssignments] = useState({});
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [voiceFilter, setVoiceFilter] = useState({ gender: '', style: '' });
  const [playingVoice, setPlayingVoice] = useState(null);
  // Mobile: which panel is showing — 'characters' or 'voices'
  const [mobilePanel, setMobilePanel] = useState('characters');

  // Load voice assignments from database
  const loadVoiceAssignments = useCallback(async () => {
    if (!script?.id || !user?.id) return;

    try {
      const assignments = await getVoiceAssignments(script.id, user.id);
      setVoiceAssignments(assignments);
      onVoiceAssignmentsChange?.(assignments);
    } catch (error) {
      console.error('Error loading voice assignments:', error);
    }
  }, [script?.id, user?.id, onVoiceAssignmentsChange]);

  // Load voice assignments when script changes
  useEffect(() => {
    if (script?.id && user?.id) {
      loadVoiceAssignments();
    }
  }, [script?.id, user?.id, loadVoiceAssignments]);

  // Save voice assignments to database
  const saveVoiceAssignmentsToDb = async (assignments) => {
    if (!script?.id || !user?.id) return;

    try {
      const result = await saveVoiceAssignments(script.id, assignments, user.id);
      if (result.success) {
        console.log('✅ Voice assignments saved successfully');
        onVoiceAssignmentsChange?.(assignments);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error saving voice assignments:', error);
      alert(`Error saving voice assignments: ${error.message}`);
    }
  };

  // Auto-assign voices based on character analysis
  const handleAutoAssignVoices = async () => {
    setIsAutoAssigning(true);
    try {
      const characters = getUniqueCharacters();
      console.log('🎭 Sending characters for auto-assign:', characters);

      const scriptId = script?.id;
      if (!scriptId) {
        throw new Error('Script must be saved before assigning voices');
      }

      console.log('🔍 Using script ID for auto-assign:', scriptId);
      const response = await autoAssignVoices(scriptId, user.id, characters);
      console.log('✅ Auto-assign response:', response);

      // Parse the n8n webhook response format
      const assignments = {};

      // autoAssignVoices already unwraps the response - handle clean format directly
      if (response && response.success && response.data && response.data.assignments) {
        response.data.assignments.forEach(assignment => {
          assignments[assignment.character_name] = assignment.cartesia_voice_id;
        });
        console.log('✅ Converted assignments:', assignments);
      }

      // Fallback: try array format
      else if (Array.isArray(response) && response.length > 0) {
        const first = response[0];
        if (first.success && first.data && first.data.assignments) {
          first.data.assignments.forEach(assignment => {
            assignments[assignment.character_name] = assignment.cartesia_voice_id;
          });
          console.log('✅ Converted assignments (array fallback):', assignments);
        }
      }

      if (Object.keys(assignments).length > 0) {
        setVoiceAssignments(assignments);
        onVoiceAssignmentsChange?.(assignments);
        console.log('✅ Voice assignments updated in UI');
      } else {
        console.warn('⚠️ No assignments found in response');
      }

    } catch (error) {
      console.error('❌ Error auto-assigning voices:', error);
    } finally {
      setIsAutoAssigning(false);
    }
  };

  // Assign voice to character
  const assignVoiceToCharacter = async (characterName, voiceId) => {
    const newAssignments = {
      ...voiceAssignments,
      [characterName]: voiceId
    };
    setVoiceAssignments(newAssignments);
    await saveVoiceAssignmentsToDb(newAssignments);
  };

  // Handle voice preview — plays pre-recorded S3 sample, no API cost
  const handleVoicePreview = (voiceId) => {
    const voice = getVoiceById(voiceId);
    if (!voice?.sample_url) {
      console.warn('No sample URL for voice:', voiceId);
      return;
    }
    // Stop any currently playing audio
    if (window._previewAudio) {
      window._previewAudio.pause();
      window._previewAudio = null;
    }
    if (playingVoice === voiceId) {
      setPlayingVoice(null);
      return;
    }
    const audio = new Audio(voice.sample_url);
    window._previewAudio = audio;
    setPlayingVoice(voiceId);
    audio.play().catch(err => console.error('Preview playback error:', err));
    audio.onended = () => {
      setPlayingVoice(null);
      window._previewAudio = null;
    };
    audio.onerror = () => {
      console.error('Failed to load preview for:', voice.name);
      setPlayingVoice(null);
      window._previewAudio = null;
    };
  };

  // Handle Save & Continue
  const handleSaveAndContinue = async () => {
    try {
      // Save current voice assignments to database
      await saveVoiceAssignmentsToDb(voiceAssignments);

      // Call parent callback to proceed to next step
      if (onVoiceAssignmentsChange) {
        onVoiceAssignmentsChange(voiceAssignments);
      }

      // Show success message and scroll to audio generation section
      console.log('✅ Voice assignments saved and continuing');

      // Scroll to the "Generate Full Audio" button
      const audioButton = document.querySelector('[data-audio-generation]');
      if (audioButton) {
        audioButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Briefly highlight the button
        audioButton.classList.add('ring-4', 'ring-dream-glow', 'ring-opacity-75');
        setTimeout(() => {
          audioButton.classList.remove('ring-4', 'ring-dream-glow', 'ring-opacity-75');
        }, 2000);
      }

    } catch (error) {
      console.error('❌ Error saving voice assignments:', error);
    }
  };

  // When user taps a character on mobile, switch to voices panel
  const handleCharacterTapMobile = (charName) => {
    setSelectedCharacter(charName);
    setMobilePanel('voices');
  };

  // Get unique characters from script WITH GENDER from Gemini if available
  const getUniqueCharacters = () => {
    // Extract unique speakers
    const uniqueSpeakers = [...new Set(scriptLines.map(line => line.speaker))];

    // Try to get character metadata from script (Gemini provides this)
    const charactersWithMetadata = script?.metadata?.characters || [];

    // If we have Gemini character metadata with gender, use it
    if (charactersWithMetadata.length > 0) {
      console.log('✅ Using Gemini character metadata with gender');
      return charactersWithMetadata;
    }

    // Fallback: return just character names (n8n will infer gender)
    console.log('⚠️ No character metadata found, returning names only');
    return uniqueSpeakers;
  };

  // Calculate progress
  const characters = getUniqueCharacters();
  // Handle both character objects (with .name) and simple strings
  const assignedCount = characters.filter(char => {
    const charName = typeof char === 'string' ? char : char.name;
    return voiceAssignments[charName];
  }).length;
  const allAssigned = characters.length > 0 && assignedCount === characters.length;
  const progressPercent = characters.length > 0 ? (assignedCount / characters.length) * 100 : 0;

  const getCharacterTint = (characterName = 'Narrator') => {
    const tints = [
      'bg-[#2f2118]/90 border-[#7f5138]/35',
      'bg-[#262027]/90 border-[#665b78]/35',
      'bg-[#213029]/90 border-[#4d7b68]/35',
      'bg-[#33241d]/90 border-[#8a6750]/35',
      'bg-[#27282f]/90 border-[#5b667c]/35',
    ];
    const hash = characterName.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
    return tints[hash % tints.length];
  };

  /* ─────────────────────────────────────────────
     Characters Panel — shared between mobile & desktop
     ───────────────────────────────────────────── */
  const CharactersPanel = ({ onCharacterTap }) => (
    <div className="bg-[#1b120c]/82 border border-white/10 rounded-[24px] p-4 sm:p-5 shadow-card">
      <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2 text-cream-100">
        <User size={16} className="text-dream-glow" />
        Characters
      </h3>
      <div className="space-y-2">
        {characters.map(character => {
          const charName = typeof character === 'string' ? character : character.name;
          const assignedVoice = getVoiceById(voiceAssignments[charName]);
          const lineCount = scriptLines.filter(line => line.speaker === charName).length;

          return (
            <button
              key={charName}
              onClick={() => onCharacterTap(charName)}
              className={`w-full text-left p-4 rounded-2xl transition-all active:scale-[0.98] border ${selectedCharacter === charName
                  ? 'bg-dream-stardust/10 border-dream-glow/35 shadow-glow-sm'
                  : `${getCharacterTint(charName)} hover:border-white/25`
                }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex-1 min-w-0">
                  <div className="font-display font-semibold text-base text-cream-100">{charName}</div>
                  <div className="text-xs text-cream-400/65 font-body mt-0.5">{lineCount} lines</div>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  {assignedVoice ? (
                    <>
                      <span className="text-xs font-display font-semibold text-success max-w-[100px] truncate">
                        {assignedVoice.name}
                      </span>
                      <Check size={16} className="text-success" />
                    </>
                  ) : (
                    <ChevronRight size={16} className="text-cream-400/65" />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  /* ─────────────────────────────────────────────
     Voices Panel — shared between mobile & desktop
     ───────────────────────────────────────────── */
  const VoicesPanel = () => (
    <div className="bg-[#1b120c]/82 border border-white/10 rounded-[24px] p-4 sm:p-5 shadow-card">
      {/* Mobile back button */}
      <div className="md:hidden mb-3">
        <button
          onClick={() => setMobilePanel('characters')}
          className="flex items-center gap-1.5 text-cream-300/75 font-display font-semibold text-sm active:scale-[0.97]"
        >
          <ArrowLeft size={16} />
          Back to Characters
        </button>
      </div>

      <h3 className="font-display font-bold text-sm mb-1 flex items-center gap-2 text-cream-100">
        <Mic size={16} className="text-dream-glow" />
        {selectedCharacter ? (
          <>Voices for <span className="text-dream-glow">{selectedCharacter}</span></>
        ) : (
          'Available Voices'
        )}
      </h3>
      {selectedCharacter && (
        <p className="text-xs text-cream-400/65 font-body mb-3">Tap a voice to assign it</p>
      )}

      {/* Filters — stacked on mobile for comfortable tapping */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <select
          value={voiceFilter.gender}
          onChange={(e) => setVoiceFilter(prev => ({ ...prev, gender: e.target.value }))}
          className="w-full sm:w-auto px-4 py-3 sm:py-1.5 bg-[#140e0a]/90 border-2 border-white/10 rounded-xl text-cream-100 text-sm font-display font-semibold focus:outline-none focus:border-dream-glow/50 transition-all"
        >
          <option value="">All Genders</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="neutral">Neutral</option>
        </select>
        <select
          value={voiceFilter.style}
          onChange={(e) => setVoiceFilter(prev => ({ ...prev, style: e.target.value }))}
          className="w-full sm:w-auto px-4 py-3 sm:py-1.5 bg-[#140e0a]/90 border-2 border-white/10 rounded-xl text-cream-100 text-sm font-display font-semibold focus:outline-none focus:border-dream-glow/50 transition-all"
        >
          <option value="">All Styles</option>
          <option value="narrator">Narrator</option>
          <option value="character">Character</option>
          <option value="warm">Warm</option>
          <option value="youthful">Youthful</option>
        </select>
      </div>

      {/* Voice List — larger touch targets on mobile */}
      {/* Legend */}
      <div className="flex items-center gap-3 mb-2 text-xs text-cream-400/65 font-body">
        <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-sleep-600/70"></span> Used by another character</span>
      </div>

      <div className="space-y-2 max-h-[60vh] md:max-h-96 overflow-y-auto -mx-1 px-1">
        {getVoicesByFilter(voiceFilter).map(voice => {
          const isCurrentAssignment = selectedCharacter && voiceAssignments[selectedCharacter] === voice.id;
          // Check if this voice is assigned to a different character
          const assignedToCharacter = Object.entries(voiceAssignments).find(
            ([charName, vId]) => vId === voice.id && charName !== selectedCharacter
          )?.[0];
          const isAssignedElsewhere = !!assignedToCharacter;

          return (
            <div
              key={voice.id}
              className={`p-4 rounded-2xl transition-all border ${isCurrentAssignment
                  ? 'bg-success/10 border-success/30'
                  : isAssignedElsewhere
                  ? 'bg-[#221710]/80 border-white/5 opacity-45'
                  : 'bg-[#24170f]/70 border-white/10 hover:border-white/20'
                }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Voice info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-display font-semibold text-base text-cream-100">{voice.name}</div>
                    {isCurrentAssignment && (
                      <span className="text-[10px] bg-success/20 text-success px-2 py-0.5 rounded-full font-display font-bold">ASSIGNED</span>
                    )}
                    {isAssignedElsewhere && (
                      <span className="text-[10px] bg-sleep-700/60 text-cream-300/75 px-2 py-0.5 rounded-full font-display font-bold">USED BY {assignedToCharacter.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="text-xs text-cream-400/65 font-body mt-0.5 line-clamp-1">{voice.description}</div>
                  <div className="flex gap-1.5 mt-2">
                    <span className="text-[11px] px-2.5 py-1 bg-[#140e0a]/90 text-cream-300/80 rounded-lg font-display font-semibold capitalize border border-white/10">
                      {voice.gender}
                    </span>
                    <span className="text-[11px] px-2.5 py-1 bg-[#140e0a]/90 text-cream-300/80 rounded-lg font-display font-semibold capitalize border border-white/10">
                      {voice.style}
                    </span>
                  </div>
                </div>

                {/* Action buttons — full width on mobile */}
                <div className="flex gap-2 sm:shrink-0">
                  <button
                    onClick={() => handleVoicePreview(voice.id)}
                    disabled={playingVoice === voice.id}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-3 sm:py-2 rounded-xl font-display font-semibold text-xs transition-all active:scale-[0.97] ${playingVoice === voice.id
                        ? 'bg-sleep-700 text-white'
                        : 'bg-sleep-700/70 hover:bg-sleep-650/80 text-white'
                      }`}
                  >
                    {playingVoice === voice.id ? (
                      <><Pause size={14} /> Playing…</>
                    ) : (
                      <><Play size={14} /> Preview</>
                    )}
                  </button>
                  {selectedCharacter && (
                    <button
                      onClick={() => !isAssignedElsewhere && assignVoiceToCharacter(selectedCharacter, voice.id)}
                      disabled={isAssignedElsewhere}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-3 sm:py-2 rounded-xl text-xs font-display font-bold transition-all active:scale-[0.97] ${isCurrentAssignment
                          ? 'bg-success text-white'
                          : isAssignedElsewhere
                          ? 'bg-white/10 text-cream-400/60 cursor-not-allowed'
                          : 'bg-dream-glow text-white hover:bg-dream-aurora shadow-glow-sm'
                        }`}
                    >
                      {isCurrentAssignment ? (
                        <><Check size={14} /> Assigned</>
                      ) : isAssignedElsewhere ? (
                        <>In Use</>
                      ) : (
                        <>Assign ✨</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ─────────────────────────────────────────────
     Preview Section
     ───────────────────────────────────────────── */
  const PreviewSection = () => {
    if (!selectedCharacter) return null;

    return (
      <div className="mt-4 p-4 bg-[#1b120c]/82 border border-white/10 rounded-[24px] shadow-card">
        <h4 className="font-display font-bold text-sm mb-3 text-cream-100">Preview: {selectedCharacter}</h4>
        {voiceAssignments[selectedCharacter] && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Volume2 size={16} className="text-cream-400/65" />
              <span className="text-sm text-cream-100 font-display font-semibold">
                {getVoiceById(voiceAssignments[selectedCharacter])?.name}
              </span>
            </div>
            <button
              onClick={() => handleVoicePreview(voiceAssignments[selectedCharacter])}
              disabled={playingVoice === voiceAssignments[selectedCharacter]}
              className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-sleep-700/70 text-white rounded-xl text-xs font-display font-bold hover:bg-sleep-650/80 transition-all disabled:opacity-50 active:scale-[0.97] flex items-center justify-center gap-1.5"
            >
              <Play size={14} />
              {playingVoice === voiceAssignments[selectedCharacter] ? 'Playing…' : 'Play Preview'}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-5 bg-[#24170f]/80 backdrop-blur-md border border-white/10 rounded-[24px] shadow-card text-cream-100">
      {/* Header */}
      <div className="mb-4 sm:mb-5">
        <h2 className="text-lg sm:text-xl font-display font-bold text-cream-100 mb-2">Voice Assignment</h2>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <p className="text-cream-300/75 text-sm font-body">Assign voices to your characters</p>
          <div className="flex gap-2">
            <button
              onClick={handleAutoAssignVoices}
              disabled={isAutoAssigning}
              className={`flex-1 sm:flex-none px-4 py-3 sm:py-2 rounded-xl font-display font-semibold text-sm sm:text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.97] ${isAutoAssigning
                  ? 'bg-white/10 text-cream-400/60 cursor-not-allowed'
                  : 'bg-sleep-700/70 text-white hover:bg-sleep-650/80'
                }`}
            >
              <Wand2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              {isAutoAssigning ? 'Assigning…' : 'Auto-Assign'}
            </button>
            <button
              onClick={handleSaveAndContinue}
              disabled={!allAssigned}
              className={`flex-1 sm:flex-none px-4 py-3 sm:py-2 rounded-xl font-display font-semibold text-sm sm:text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.97] ${allAssigned
                  ? 'bg-dream-glow text-white hover:bg-dream-aurora shadow-glow-sm'
                  : 'bg-white/10 text-cream-400/60 cursor-not-allowed'
                }`}
            >
              <Check className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              Save & Continue
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 bg-white/10 rounded-full h-2.5 sm:h-2 overflow-hidden">
          <div
            className="bg-success h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="text-xs text-cream-400/65 mt-1 font-body">{assignedCount}/{characters.length} characters assigned</div>
      </div>

      {/* ── MOBILE LAYOUT: Toggle between panels ── */}
      <div className="block md:hidden">
        {mobilePanel === 'characters' ? (
          <>
            <CharactersPanel onCharacterTap={handleCharacterTapMobile} />
            <PreviewSection />
          </>
        ) : (
          <>
            <VoicesPanel />
            <PreviewSection />
          </>
        )}
      </div>

      {/* ── DESKTOP / TABLET LAYOUT: Side-by-side grid ── */}
      <div className="hidden md:grid md:grid-cols-2 gap-5">
        <CharactersPanel onCharacterTap={(charName) => setSelectedCharacter(charName)} />
        <VoicesPanel />
      </div>
      <div className="hidden md:block">
        <PreviewSection />
      </div>
    </div>
  );
};

export default VoiceAssignmentPanel;
