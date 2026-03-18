import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, BookOpen, Library, User, Plus, Edit, Play, Trash2, PawPrint, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ScriptEditorScreen from './ScriptEditorScreen';
import OptimizedCreateScreen from './OptimizedCreateScreen';
import BuddyTimerApp from '../features/buddy-timer/BuddyTimerApp';
import ModeSelectionScreen from './onboarding/ModeSelectionScreen';
import OnboardingFlow from './onboarding/OnboardingFlow';
import PushPermissionPrompt from './onboarding/PushPermissionPrompt';
import MorningReflectionPopup from './MorningReflectionPopup';
import SettingsScreen from './settings/SettingsScreen';
import MiniPlayer from './AudioPlayer/MiniPlayer';
import ExpandedPlayer from './AudioPlayer/ExpandedPlayer';
import { loadSavedScripts, loadScript, deleteScript } from '../services/scriptSaveService';
import { generateAIScript } from '../services/aiScriptGenerationService';
import { autoAssignVoices } from '../services/cartesiaVoiceService';
import { db } from '../lib/supabase';

const AuthenticatedApp = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('library');
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [showScriptEditor, setShowScriptEditor] = useState(false);
  const [generatedScript, setGeneratedScript] = useState(null);
  const [savedScripts, setSavedScripts] = useState([]);
  const [isLoadingScripts, setIsLoadingScripts] = useState(false);
  const [shouldRefreshLibrary, setShouldRefreshLibrary] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [pendingChildName, setPendingChildName] = useState('');
  const [morningReaction, setMorningReaction] = useState(null);
  const [showMorningPopup, setShowMorningPopup] = useState(false);

  // Onboarding state
  const [childProfiles, setChildProfiles] = useState(null); // null = loading, [] = none
  const [activeChildId, setActiveChildId] = useState(null);
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasHadFreeStory, setHasHadFreeStory] = useState(false);

  // Global audio player state — single shared <audio> element
  const globalAudioRef = useRef(null);
  const [globalAudio, setGlobalAudio] = useState(null); // { audioUrl, title, scriptLines, timingMetadata }
  const [showExpandedPlayer, setShowExpandedPlayer] = useState(false);

  const handlePlayAudio = useCallback((audioData) => {
    setGlobalAudio(audioData);
    // Load the new audio source into the shared element
    const audio = globalAudioRef.current;
    if (audio && audioData?.audioUrl) {
      audio.src = audioData.audioUrl;
      audio.load();
      audio.play().catch(err => console.warn('Auto-play blocked:', err));
    }
  }, []);

  const handleCloseAudio = useCallback(() => {
    const audio = globalAudioRef.current;
    if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load(); }
    setGlobalAudio(null);
    setShowExpandedPlayer(false);
  }, []);

  // Load child profiles on mount
  useEffect(() => {
    const loadProfiles = async () => {
      if (!user?.id) return;
      try {
        const profiles = await db.getChildProfiles(user.id);
        setChildProfiles(profiles || []);
        if (profiles && profiles.length > 0) {
          setActiveChildId(profiles[0].id);
          setPendingChildName(profiles[0].name);
          // Check for pending morning reaction (unreacted, from today)
          try {
            const reactions = await db.getRecentMorningReactions(profiles[0].id, 1);
            if (reactions && reactions.length > 0) {
              const latest = reactions[0];
              if (!latest.reacted_at && !latest.skipped) {
                setMorningReaction(latest);
              }
            }
          } catch (reactErr) {
            console.warn('Could not check morning reactions:', reactErr.message);
          }
        }
        // Check if user has had a free story (any scripts exist)
        const freeStoryFlag = localStorage.getItem(`ds_free_story_${user.id}`);
        if (freeStoryFlag) setHasHadFreeStory(true);
      } catch (err) {
        console.error('Error loading child profiles:', err);
        setChildProfiles([]);
      }
    };
    loadProfiles();
  }, [user?.id]);

  // Listen for notification deep-links from service worker
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'NOTIFICATION_CLICK') {
        const tag = event.data.tag;
        if (tag === 'morning-reflection' && morningReaction) {
          setShowMorningPopup(true);
        } else if (tag === 'evening-reminder') {
          setActiveTab('create');
        }
      }
    };
    navigator.serviceWorker?.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker?.removeEventListener('message', handleMessage);
  }, [morningReaction]);

  // Define loadUserScripts function before useEffect
  const loadUserScripts = useCallback(async () => {
    if (!user?.id) return;

    setIsLoadingScripts(true);
    try {
      const result = await loadSavedScripts(user.id);
      if (result.success) {
        setSavedScripts(result.scripts);
      } else {
        console.error('Failed to load scripts:', result.error);
        setSavedScripts([]);
      }
    } catch (error) {
      console.error('Error loading scripts:', error);
      setSavedScripts([]);
    } finally {
      setIsLoadingScripts(false);
    }
  }, [user?.id]);

  // Load saved scripts when component mounts or user changes
  useEffect(() => {
    loadUserScripts();
  }, [user?.id, loadUserScripts]);

  // Refresh library when switching to library tab or when shouldRefreshLibrary changes
  useEffect(() => {
    if (activeTab === 'library' || shouldRefreshLibrary) {
      loadUserScripts();
      setShouldRefreshLibrary(false);
    }
  }, [activeTab, shouldRefreshLibrary, loadUserScripts]);

  const handleLoadScript = async (scriptId) => {
    try {
      const result = await loadScript(scriptId, user?.id);
      if (result.success) {
        setGeneratedScript({
          id: result.script.id,
          title: result.script.title,
          lines: result.script.lines,
          metadata: result.script.metadata
        });
        setShowScriptEditor(true);
        setActiveTab('create'); // Switch to create tab to show script editor
      } else {
        alert('Error loading script: ' + result.error);
      }
    } catch (error) {
      console.error('Error loading script:', error);
      alert('Error loading script. Please try again.');
    }
  };

  const handleDeleteScript = (scriptId) => {
    console.log('🗑️ Delete button clicked for script:', scriptId);
    setDeleteConfirmation(scriptId);
  };

  const confirmDelete = async (scriptId) => {
    setDeleteConfirmation(null);

    try {
      console.log('🗑️ Calling deleteScript service...');
      const result = await deleteScript(scriptId, user?.id);
      console.log('🗑️ Delete result:', result);

      if (result.success) {
        setSavedScripts(prev => prev.filter(s => s.id !== scriptId));
        console.log('✅ Script deleted successfully from UI');
        alert('Script deleted successfully.');
      } else {
        console.error('❌ Delete failed:', result.error);
        alert('Error deleting script: ' + result.error);
      }
    } catch (error) {
      console.error('❌ Error deleting script:', error);
      alert('Error deleting script. Please try again.');
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation(null);
  };

  // Mark free story as used (called after first generation)
  const markFreeStoryUsed = () => {
    localStorage.setItem(`ds_free_story_${user.id}`, 'true');
    setHasHadFreeStory(true);
  };

  // Handle mode selection callbacks
  const handleJustStoriesComplete = (profileId) => {
    setActiveChildId(profileId);
    setShowModeSelection(false);
    setChildProfiles(prev => prev ? [...prev] : []);
    // Reload profiles
    db.getChildProfiles(user.id).then(p => {
      setChildProfiles(p || []);
      if (p && p.length > 0) setActiveChildId(p[0].id);
    });
  };

  const handleFullProgrammeSelect = () => {
    setShowModeSelection(false);
    setShowOnboarding(true);
  };

  const handleOnboardingComplete = (profileId) => {
    setActiveChildId(profileId);
    setShowOnboarding(false);
    // Reload profiles and show push prompt
    db.getChildProfiles(user.id).then(p => {
      setChildProfiles(p || []);
      if (p && p.length > 0) {
        setActiveChildId(p[0].id);
        setPendingChildName(p[0].name);
      }
      // Show push permission prompt after onboarding
      setShowPushPrompt(true);
    });
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
    setShowModeSelection(false);
  };

  /* ─────────────────────────────────────────────
     Create Screen — with n8n + Supabase integration
     ───────────────────────────────────────────── */
  const renderCreateScreen = () => {
    // Gate: Show onboarding flow if active
    if (showOnboarding) {
      return (
        <OnboardingFlow
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      );
    }

    // Gate: Show mode selection if needed
    if (showModeSelection) {
      return (
        <ModeSelectionScreen
          onSelectJustStories={handleJustStoriesComplete}
          onSelectFullProgramme={handleFullProgrammeSelect}
        />
      );
    }

    // Show Script Editor when showScriptEditor is true
    if (showScriptEditor) {
      return (
        <ScriptEditorScreen
          script={generatedScript}
          user={user}
          onBack={() => {
            setShowScriptEditor(false);
            setShowCreateStory(true);
            // Refresh library when returning from script editor
            setShouldRefreshLibrary(true);
          }}
          onSave={() => {
            // Trigger library refresh after saving
            setShouldRefreshLibrary(true);
          }}
          onScriptUpdate={() => {
            // Trigger library refresh after TTS completion
            setShouldRefreshLibrary(true);
          }}
          onPlayAudio={handlePlayAudio}
        />
      );
    }

    // Show OptimizedCreateScreen when showCreateStory is true
    if (showCreateStory) {
      return (
        <OptimizedCreateScreen
          onBack={() => setShowCreateStory(false)}
          isGenerating={isGenerating}
          onGenerate={async (payload) => {
            console.log('Story generation payload:', payload);
            setIsGenerating(true);

            try {
              // Enrich payload with child profile if available
              if (activeChildId) {
                try {
                  const fullProfile = await db.getFullChildProfile(activeChildId);
                  if (fullProfile) {
                    const ctx = fullProfile.child_dynamic_context;
                    payload.childProfile = {
                      childId: fullProfile.id,
                      name: fullProfile.name,
                      age: fullProfile.age,
                      genderPronoun: fullProfile.gender_pronoun,
                      personalityDescription: fullProfile.personality_description,
                      neuroFlags: fullProfile.neuro_flags || [],
                      neuroProfile: fullProfile.neuro_profile,
                      interests: fullProfile.interests || [],
                      mode: fullProfile.mode,
                      // Dynamic context
                      allies: ctx?.allies || [],
                      pets: ctx?.pets || [],
                      currentStressors: ctx?.current_stressors,
                      fearFlags: ctx?.fear_flags || [],
                      socialDifficulty: ctx?.social_difficulty,
                      bedtimeDescription: ctx?.bedtime_description,
                    };
                    console.log('🧒 Child profile injected into payload:', fullProfile.name);
                  }
                } catch (profileErr) {
                  console.warn('⚠️ Could not load child profile, generating without:', profileErr.message);
                }
              }

              // Add loading state
              console.log('Calling n8n webhook with async polling...');

              // Use the new async polling service
              const result = await generateAIScript(payload);
              console.log('n8n webhook response:', result);

              // Handle the generated script data
              if (result.success && result.data?.script) {
                console.log('Generated script:', result.data.script);
                console.log('Script lines:', result.data.script.lines);

                // Transform AI-generated script to match script editor format
                const transformedScript = {
                  id: result.script_id,  // Use existing n8n-created record ID to avoid duplicate
                  title: result.data.script.title,
                  lines: result.data.script.lines.map((line, index) => ({
                    id: index + 1,
                    type: line.type || 'dialogue',
                    speaker: line.speaker || 'Unknown',
                    text: line.text || '',
                    annotations: line.emotion ? [line.emotion.toLowerCase()] : []
                  })),
                  metadata: {
                    ...(result.data.script.metadata || result.data.metadata || {}),
                    characters: result.data.characters || result.data.script.metadata?.characters || []
                  }
                };

                // n8n already saved the script to Supabase - just refresh the library
                // and auto-assign voices using the existing script_id
                console.log('✅ AI script already saved by n8n with ID:', result.script_id);
                setShouldRefreshLibrary(true);

                // AUTO-ASSIGN VOICES: Automatically assign voices if characters were provided by Gemini
                if (result.script_id && result.data.characters && result.data.characters.length > 0) {
                  console.log('🎭 Auto-assigning voices for', result.data.characters.length, 'characters');
                  try {
                    await autoAssignVoices(
                      result.script_id,
                      user?.id,
                      result.data.characters
                    );
                    console.log('✅ Voice auto-assignment completed successfully');
                  } catch (autoAssignError) {
                    console.error('❌ Voice auto-assignment failed:', autoAssignError.message);
                  }
                } else {
                  console.log('ℹ️ No characters data from Gemini, skipping auto-assign');
                }

                // Create story_session record if child profile exists
                if (activeChildId && result.script_id) {
                  try {
                    await db.createStorySession({
                      child_id: activeChildId,
                      user_id: user.id,
                      story_prompt: payload.concept?.initialConcept || '',
                      parent_note: payload.parentNote || null,
                      story_id: payload.storyId,
                      mode: 'co-creation',
                    });
                    console.log('📝 Story session recorded for child:', activeChildId);
                  } catch (sessionErr) {
                    console.warn('⚠️ Could not create story session:', sessionErr.message);
                  }
                }

                // Store the script data in component state
                setGeneratedScript(transformedScript);

                // Show success message and navigate to script editor
                alert(`Script generated successfully!\n\nTitle: ${transformedScript.title}\n\n${transformedScript.lines.length} lines generated.\n\n✅ Automatically saved to your library!\n\nOpening script editor...`);

                // Navigate to script editor
                setShowCreateStory(false);
                setShowScriptEditor(true);

              } else {
                alert('Story generated but no script data received. Check console for details.');
              }

            } catch (error) {
              console.error('Error calling n8n webhook:', error);
              alert(`Error generating story: ${error.message}`);
            } finally {
              setIsGenerating(false);
            }
          }}
          user={user}
        />
      );
    }

    // Default create screen when showCreateStory is false
    return (
      <div className="min-h-full px-6 py-8 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-3 gradient-text">Create Your Story</h1>
          <p className="text-sleep-500 text-lg font-body">Where your child's imagination becomes a bedtime story ✨</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm border-2 border-cream-300/50 rounded-3xl p-6 mb-6 shadow-card">
          <h2 className="text-xl font-display font-semibold mb-4 text-sleep-900">Ready to Create?</h2>
          <p className="text-sleep-500 mb-6 font-body">Use our advanced AI-powered story generator to bring your stories to life.</p>
          <button
            onClick={() => {
              // Gate: if no child profile exists and user has had their free story, show mode selection
              if (childProfiles && childProfiles.length === 0 && hasHadFreeStory) {
                setShowModeSelection(true);
                return;
              }
              // If no profile and no free story yet, allow one free creation
              if (childProfiles && childProfiles.length === 0 && !hasHadFreeStory) {
                markFreeStoryUsed();
              }
              setShowCreateStory(true);
            }}
            className="w-full bg-dream-glow hover:bg-dream-aurora text-white font-display font-bold py-3.5 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-glow-sm active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            Start Creating
          </button>
        </div>
      </div>
    );
  };

  /* ─────────────────────────────────────────────
     Library Screen — with Supabase load/delete
     ───────────────────────────────────────────── */
  const renderLibraryScreen = () => (
    <div className="min-h-full px-4 sm:px-6 py-5 sm:py-8 animate-fade-in">
      <div className="text-center mb-5 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold mb-2 sm:mb-3 gradient-text">Your Library</h1>
        <p className="text-sleep-500 text-sm sm:text-lg font-body">Manage your saved story creations</p>
      </div>

      {isLoadingScripts ? (
        <div className="bg-white/80 backdrop-blur-sm border-2 border-cream-300/50 rounded-3xl p-6 text-center shadow-card">
          <div className="animate-spin text-2xl mb-4">⏳</div>
          <p className="text-sleep-500 font-body">Loading your stories...</p>
        </div>
      ) : savedScripts.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm border-2 border-cream-300/50 rounded-3xl p-6 text-center shadow-card">
          <h2 className="text-lg sm:text-xl font-display font-semibold mb-4 text-sleep-900">No Saved Stories</h2>
          <p className="text-sleep-500 mb-6 font-body text-sm sm:text-base">You haven't saved any stories yet. Create and save your first story to see it here.</p>
          <button
            onClick={() => setActiveTab('create')}
            className="w-full sm:w-auto bg-dream-glow hover:bg-dream-aurora text-white font-display font-bold py-3.5 sm:py-3 px-6 rounded-2xl transition-all duration-200 shadow-glow-sm active:scale-[0.98] text-sm sm:text-base"
          >
            Create Your First Story
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-display font-semibold text-sleep-900">Saved Stories ({savedScripts.length})</h2>
            <button
              onClick={loadUserScripts}
              className="px-3 sm:px-4 py-2 bg-white/80 hover:bg-white border-2 border-cream-300/50 text-sleep-600 hover:text-sleep-900 rounded-xl transition-all font-display font-semibold text-xs sm:text-sm"
            >
              🔄 Refresh
            </button>
          </div>

          <div className="grid gap-3 sm:gap-4">
            {savedScripts.map((script) => (
              <div key={script.id} className="bg-white/80 backdrop-blur-sm border-2 border-cream-300/50 rounded-3xl p-4 sm:p-6 shadow-card">
                {/* Title & Metadata — always full width */}
                <div className="mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-display font-bold text-sleep-900 mb-2 line-clamp-2">{script.title}</h3>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs sm:text-sm text-sleep-500 mb-2 font-body">
                    <span>📝 {script.metadata?.totalLines || script.lines?.length || 0} lines</span>
                    <span>👥 {script.metadata?.charactersCount || 0} chars</span>
                    <span>💬 {script.metadata?.dialogueCount || 0} dialogue</span>
                    <span>📖 {script.metadata?.narrationCount || 0} narration</span>
                  </div>
                  <div className="text-xs text-sleep-400 font-body">
                    {script.lastModified ? (
                      <>Last modified: {new Date(script.lastModified).toLocaleDateString()} at {new Date(script.lastModified).toLocaleTimeString()}</>
                    ) : script.createdAt ? (
                      <>Created: {new Date(script.createdAt).toLocaleDateString()}</>
                    ) : (
                      'No date available'
                    )}
                  </div>
                </div>

                {/* Action buttons — full-width row on mobile */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleLoadScript(script.id)}
                    className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 bg-dream-glow hover:bg-dream-aurora text-white rounded-xl transition-all flex items-center justify-center gap-2 font-display font-semibold text-sm active:scale-[0.97]"
                    title="Edit Script"
                  >
                    <Edit className="w-4 h-4 shrink-0" />
                    <span className="truncate">Edit</span>
                  </button>

                  {/* Show Play Audio button if script has audio, otherwise show TTS button */}
                  {script.hasAudio && script.audioUrl ? (
                    <button
                      onClick={() => {
                        console.log('🎵 Playing audio via global mini-player:', script.title);
                        // Normalize field names from Supabase (speaker_name → speaker, text_content → text)
                        const normalizedLines = (script.lines || []).map(line => ({
                          id: line.id,
                          speaker: line.speaker || line.speaker_name || 'Narrator',
                          text: line.text || line.text_content || '',
                          type: line.type || line.line_type || 'dialogue'
                        }));
                        handlePlayAudio({
                          audioUrl: script.audioUrl,
                          title: script.title,
                          scriptLines: normalizedLines,
                          timingMetadata: null
                        });
                      }}
                      className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 bg-success hover:bg-success/80 text-white rounded-xl transition-all flex items-center justify-center gap-2 font-display font-semibold text-sm active:scale-[0.97]"
                      title={`Play Audio (${script.audioDuration ? Math.round(script.audioDuration) + 's' : 'duration unknown'})`}
                    >
                      <Play className="w-4 h-4 shrink-0" />
                      <span className="truncate">Play</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => alert('TTS generation coming soon!')}
                      className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 bg-pastel-lavender hover:bg-pastel-lavender/80 text-white rounded-xl transition-all flex items-center justify-center gap-2 font-display font-semibold text-sm active:scale-[0.97]"
                      title="Generate Audio"
                    >
                      <Play className="w-4 h-4 shrink-0" />
                      <span className="truncate">TTS</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteScript(script.id)}
                    className="px-3 py-2.5 sm:py-2 bg-danger hover:bg-danger/80 text-white rounded-xl transition-all font-display font-semibold text-sm active:scale-[0.97]"
                    title="Delete Script"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-sleep-950/30 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white/95 backdrop-blur-lg border-2 border-cream-300/50 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-dream">
            <h3 className="text-lg sm:text-xl font-display font-bold text-sleep-900 mb-3 sm:mb-4">Delete Script</h3>
            <p className="text-sleep-500 mb-5 sm:mb-6 font-body text-sm sm:text-base">
              Are you sure you want to delete this script? This will also delete any saved audio.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDelete}
                className="flex-1 sm:flex-none px-4 py-3 sm:py-2.5 bg-cream-200 hover:bg-cream-300 text-sleep-700 rounded-xl transition-colors font-display font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(deleteConfirmation)}
                className="flex-1 sm:flex-none px-4 py-3 sm:py-2.5 bg-danger hover:bg-danger/80 text-white rounded-xl transition-colors font-display font-semibold text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  /* ─────────────────────────────────────────────
     Account / Settings Screen
     ───────────────────────────────────────────── */
  const renderAccountScreen = () => <SettingsScreen />;

  /* ─────────────────────────────────────────────
     Main Layout
     ───────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-cream-100 flex flex-col relative overflow-hidden font-body">
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-sleep-glow pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-20 bg-white/80 backdrop-blur-sm border-b border-cream-300/50 px-5 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-dream-glow" />
            <h1 className="text-xl font-display font-bold text-sleep-900">Dreamstation</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-sleep-400 font-body hidden sm:inline">
              {user?.email}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 relative z-10 ${globalAudio ? 'pb-40' : 'pb-24'}`}>
        {activeTab === 'create' && renderCreateScreen()}
        {activeTab === 'buddy' && (
          <div className="h-[calc(100vh-56px-80px)] overflow-y-auto">
            <BuddyTimerApp
              onExit={() => setActiveTab('library')}
              onStoryTime={() => setActiveTab('create')}
            />
          </div>
        )}
        {activeTab === 'library' && renderLibraryScreen()}
        {activeTab === 'account' && renderAccountScreen()}
      </main>

      {/* Morning Reflection Popup */}
      {showMorningPopup && morningReaction && (
        <MorningReflectionPopup
          reactionRecord={morningReaction}
          childName={pendingChildName}
          onComplete={() => {
            setShowMorningPopup(false);
            setMorningReaction(null);
          }}
        />
      )}

      {/* Push Permission Prompt — shown after onboarding */}
      {showPushPrompt && activeChildId && (
        <PushPermissionPrompt
          userId={user?.id}
          childId={activeChildId}
          childName={pendingChildName}
          onComplete={() => setShowPushPrompt(false)}
        />
      )}

      {/* Shared audio element — lives here so it persists across expand/collapse */}
      <audio ref={globalAudioRef} preload="metadata" style={{ display: 'none' }} />

      {/* ── Global Mini Player (Spotify-style) ── */}
      {globalAudio && !showExpandedPlayer && (
        <div className="fixed left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-cream-300/50 z-50" style={{ bottom: '68px' }}>
          <MiniPlayer
            audioRef={globalAudioRef}
            title={globalAudio.title}
            onClose={handleCloseAudio}
            onExpand={() => setShowExpandedPlayer(true)}
          />
        </div>
      )}

      {/* ── Expanded Player Modal ── */}
      {showExpandedPlayer && globalAudio && (
        <ExpandedPlayer
          audioRef={globalAudioRef}
          title={globalAudio.title}
          scriptLines={globalAudio.scriptLines || []}
          timingMetadata={globalAudio.timingMetadata || null}
          onCollapse={() => setShowExpandedPlayer(false)}
        />
      )}

      {/* ── Bottom Navigation ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-cream-300/50 px-4 py-3 z-50">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-200 ${activeTab === 'create'
              ? 'text-dream-glow bg-dream-stardust/50'
              : 'text-sleep-400 hover:text-sleep-700'
              }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-xs font-display font-semibold">Create</span>
          </button>
          <button
            onClick={() => setActiveTab('buddy')}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-200 ${activeTab === 'buddy'
              ? 'text-dream-glow bg-dream-stardust/50'
              : 'text-sleep-400 hover:text-sleep-700'
              }`}
          >
            <PawPrint className="w-5 h-5" />
            <span className="text-xs font-display font-semibold">Buddy</span>
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-200 ${activeTab === 'library'
              ? 'text-dream-glow bg-dream-stardust/50'
              : 'text-sleep-400 hover:text-sleep-700'
              }`}
          >
            <Library className="w-5 h-5" />
            <span className="text-xs font-display font-semibold">Library</span>
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-200 ${activeTab === 'account'
              ? 'text-dream-glow bg-dream-stardust/50'
              : 'text-sleep-400 hover:text-sleep-700'
              }`}
          >
            <User className="w-5 h-5" />
            <span className="text-xs font-display font-semibold">Account</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default AuthenticatedApp;
