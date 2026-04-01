import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/supabase';
import { Zap, Users, Sparkles, Plus, X, ArrowLeft, Wand2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

// Static fallback templates
const QUICKSTART_TEMPLATES = {
  ADVENTURE: {
    name: 'Adventure Quest',
    concept: 'A brave young hero discovers a magical artifact and must journey through enchanted lands to save their village from an ancient curse.',
    characters: [
      { name: 'Alex', description: 'Brave young hero with a kind heart' },
      { name: 'Luna', description: 'Wise magical guide' },
      { name: 'Shadow King', description: 'Ancient villain who cast the curse' }
    ]
  },
  FRIENDSHIP: {
    name: 'Friendship Story',
    concept: 'Two unlikely friends from different worlds must work together to solve a mystery that threatens both their communities.',
    characters: [
      { name: 'Maya', description: 'Curious city kid who loves puzzles' },
      { name: 'Forest', description: 'Nature-loving country kid with animal friends' },
      { name: 'Mrs. Willow', description: 'Mysterious librarian with secrets' }
    ]
  },
  MAGIC_SCHOOL: {
    name: 'Magic School',
    concept: 'A new student at a magical academy discovers they have a unique power that could save the school from a growing darkness.',
    characters: [
      { name: 'Riley', description: 'New student with mysterious powers' },
      { name: 'Professor Sage', description: 'Kind but worried headmaster' },
      { name: 'Zara', description: 'Talented student who becomes a friend' },
      { name: 'The Shadow', description: 'Dark force threatening the school' }
    ]
  },
  SPACE_ADVENTURE: {
    name: 'Space Adventure',
    concept: 'Young space explorers discover a lost planet with friendly aliens who need help defending their home from space pirates.',
    characters: [
      { name: 'Captain Nova', description: 'Brave young space explorer' },
      { name: 'Zyx', description: 'Friendly alien with special abilities' },
      { name: 'Commander Steel', description: 'Ruthless space pirate leader' },
      { name: 'ARIA', description: 'Helpful AI companion' }
    ]
  },
  ANIMAL_KINGDOM: {
    name: 'Animal Kingdom',
    concept: 'When the forest animals lose their voices, a young rabbit must find the magical Song Stone to restore harmony to the woodland.',
    characters: [
      { name: 'Pip', description: 'Brave little rabbit with big dreams' },
      { name: 'Oakley', description: 'Wise old owl who guides Pip' },
      { name: 'Whiskers', description: 'Mischievous cat who caused the trouble' },
      { name: 'Melody', description: 'Magical songbird guardian' }
    ]
  },
  UNDERWATER: {
    name: 'Underwater Adventure',
    concept: 'A young mermaid discovers that the ocean\'s coral reefs are losing their colors and must find the Rainbow Pearl to save her underwater world.',
    characters: [
      { name: 'Marina', description: 'Curious young mermaid' },
      { name: 'Finn', description: 'Loyal dolphin best friend' },
      { name: 'King Triton', description: 'Wise ruler of the sea' },
      { name: 'Coral', description: 'Ancient sea witch with the answers' }
    ]
  }
};

const TAG_COLORS = [
  'bg-dream-stardust/40 text-dream-aurora',
  'bg-pastel-peach/30 text-pastel-peach',
  'bg-success/10 text-success',
  'bg-pastel-lavender/30 text-pastel-lavender',
];

const OptimizedCreateScreen = ({ onBack, onGenerate, isGenerating = false, activeChildId }) => {
  const { user } = useAuth();
  const [storyContent, setStoryContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [characters, setCharacters] = useState([{ name: '', description: '' }]);
  const [parentNote, setParentNote] = useState('');
  const [showClassicTemplates, setShowClassicTemplates] = useState(false);

  // AI suggestions state
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [childName, setChildName] = useState('');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [classicIndex, setClassicIndex] = useState(0);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

  const loadingMessages = [
    `Thinking about what ${childName || 'they'} love${childName ? 's' : ''}…`,
    'Checking in with their world this week…',
    'Weaving in a little magic…',
    'Almost ready — something good is coming…',
    'Pulling the threads together…',
    'Listening for tonight\'s story…',
    'Finding just the right adventure…',
    'Nearly there…',
  ];

  useEffect(() => {
    if (!suggestionsLoading) { setLoadingMsgIndex(0); return; }
    const timer = setInterval(() => {
      setLoadingMsgIndex(prev => (prev + 1) % 8);
    }, 2500);
    return () => clearInterval(timer);
  }, [suggestionsLoading]);

  const fetchSuggestions = useCallback(async () => {
    if (!activeChildId) return;
    setSuggestionsLoading(true);
    try {
      const profile = await db.getChildProfile(activeChildId);
      if (profile?.name) setChildName(profile.name);
      let dynamicContext = {};
      try {
        dynamicContext = await db.getChildDynamicContext(activeChildId) || {};
      } catch { /* no dynamic context yet */ }

      const res = await fetch('/api/generate-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childProfile: profile,
          dynamicContext,
          parentNote: null,
        }),
      });
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch (e) {
      console.error('Suggestions failed:', e);
      setSuggestions([]);
    } finally {
      setSuggestionsLoading(false);
    }
  }, [activeChildId]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const handleTemplateSelect = (templateKey) => {
    if (templateKey && QUICKSTART_TEMPLATES[templateKey]) {
      const template = QUICKSTART_TEMPLATES[templateKey];
      setSelectedTemplate(templateKey);
      setStoryContent(template.concept);
      setCharacters(template.characters);
    } else {
      setSelectedTemplate('');
    }
  };

  const handleSuggestionSelect = (suggestion) => {
    setStoryContent(suggestion.concept);
    setSelectedTemplate('');
  };

  const addCharacter = () => {
    if (characters.length < 6) {
      setCharacters([...characters, { name: '', description: '' }]);
    }
  };

  const removeCharacter = (index) => {
    if (characters.length > 1) {
      setCharacters(characters.filter((_, i) => i !== index));
    }
  };

  const updateCharacter = (index, field, value) => {
    const updated = [...characters];
    updated[index][field] = value;
    setCharacters(updated);
  };

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleGenerate = () => {
    // Validate user is authenticated
    if (!user || !user.id) {
      console.error('❌ User not authenticated or missing ID:', user);
      alert('Authentication error: Please sign out and sign in again.');
      return;
    }

    console.log('✅ Generating script for user:', user.id);

    const payload = {
      userId: user.id,
      storyId: generateUUID(),
      concept: {
        initialConcept: storyContent,
        genre: 'Adventure',
        targetEpisodes: 1,
        episodeLengthMinutes: 10
      },
      characters: characters.filter(char => char.name.trim()),
      preferences: {
        specialInstructions: parentNote.trim() || '',
        scriptLengthRequirement: "Generate exactly 130-140 script lines for a 10-minute audio drama. Mix of 75-85 dialogue lines (5-12 words each) and 55-60 narration lines (12-20 words each) for proper pacing and timing."
      },
      parentNote: parentNote.trim() || null
    };
    onGenerate?.(payload);
  };

  const isReadyToGenerate = storyContent.trim() && characters.some(char => char.name.trim());

  return (
    <div className="min-h-full p-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center px-3 py-2 text-sleep-500 hover:text-sleep-800 rounded-xl transition-all duration-200 font-display font-semibold text-sm"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>
        <h1 className="text-2xl font-display font-bold gradient-text">
          Create New Story
        </h1>
        <div className="w-20"></div>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* AI Suggestions — Carousel */}
        {activeChildId && (
          <div className="bg-white/80 backdrop-blur-sm border-2 border-cream-300/50 rounded-3xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-lg font-display font-bold text-sleep-900">
                <Sparkles className="h-5 w-5 text-dream-glow" />
                {childName ? `For ${childName} tonight` : 'Story ideas'}
              </h2>
              <button
                onClick={() => { setCarouselIndex(0); fetchSuggestions(); }}
                disabled={suggestionsLoading}
                className="p-2 text-sleep-400 hover:text-dream-glow transition-colors disabled:opacity-40"
                title="Get new suggestions"
              >
                <RefreshCw className={`w-4 h-4 ${suggestionsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {suggestionsLoading ? (
              <div className="p-6 border-2 border-dream-glow/20 rounded-2xl bg-dream-stardust/10 text-center">
                <div className="w-10 h-10 mx-auto mb-4 rounded-full bg-dream-glow/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-dream-glow animate-pulse" />
                </div>
                <p className="text-sm font-display font-semibold text-sleep-700 transition-opacity duration-500" key={loadingMsgIndex}>
                  {loadingMessages[loadingMsgIndex]}
                </p>
                <div className="flex justify-center gap-1 mt-4">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-dream-glow/60 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            ) : suggestions.length > 0 ? (
              <div>
                {/* Card */}
                <div className="overflow-hidden rounded-2xl border-2 border-cream-300/60">
                  <div
                    className="flex transition-transform duration-300 ease-out"
                    style={{ transform: `translateX(-${carouselIndex * 100}%)` }}
                  >
                    {suggestions.map((s, i) => (
                      <div key={i} className="w-full shrink-0 p-5">
                        <div className="font-display font-bold text-base text-sleep-900 mb-2">{s.title}</div>
                        <p className="text-sm text-sleep-600 font-body leading-relaxed mb-3">{s.concept}</p>
                        {s.hook && (
                          <p className="text-xs text-dream-aurora font-body italic leading-relaxed mb-3 pl-3 border-l-2 border-dream-glow/30">
                            "{s.hook}"
                          </p>
                        )}
                        {s.tags && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {s.tags.map((tag, ti) => (
                              <span key={ti} className={`px-2 py-0.5 rounded-full text-[10px] font-display font-semibold ${TAG_COLORS[ti % TAG_COLORS.length]}`}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={() => handleSuggestionSelect(s)}
                          className="w-full py-2.5 bg-dream-glow hover:bg-dream-aurora text-white rounded-xl font-display font-semibold text-sm transition-all active:scale-[0.98] shadow-glow-sm"
                        >
                          Use this story
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-3 px-1">
                  <button
                    onClick={() => setCarouselIndex(Math.max(0, carouselIndex - 1))}
                    disabled={carouselIndex === 0}
                    className="px-3 py-1.5 text-xs font-display font-semibold text-sleep-500 hover:text-sleep-800 disabled:opacity-30 transition-colors"
                  >
                    ← Prev
                  </button>
                  <div className="flex gap-1.5">
                    {suggestions.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCarouselIndex(i)}
                        className={`w-2 h-2 rounded-full transition-all duration-200 ${i === carouselIndex ? 'bg-dream-glow scale-125' : 'bg-cream-300/60 hover:bg-cream-400'}`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => setCarouselIndex(Math.min(suggestions.length - 1, carouselIndex + 1))}
                    disabled={carouselIndex >= suggestions.length - 1}
                    className="px-3 py-1.5 text-xs font-display font-semibold text-sleep-500 hover:text-sleep-800 disabled:opacity-30 transition-colors"
                  >
                    Next →
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Classic Stories — collapsed by default, carousel inside */}
        <div className="bg-white/80 backdrop-blur-sm border-2 border-cream-300/50 rounded-3xl shadow-card overflow-hidden">
          <button
            onClick={() => setShowClassicTemplates(!showClassicTemplates)}
            className="w-full flex items-center justify-between p-5 text-left"
          >
            <h2 className="flex items-center gap-2 text-sm font-display font-semibold text-sleep-600">
              Classic Stories
            </h2>
            {showClassicTemplates ? (
              <ChevronUp className="w-4 h-4 text-sleep-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-sleep-400" />
            )}
          </button>
          {showClassicTemplates && (() => {
            const templates = Object.entries(QUICKSTART_TEMPLATES);
            return (
              <div className="px-5 pb-5 -mt-2">
                <div className="overflow-hidden rounded-2xl border-2 border-cream-300/60">
                  <div
                    className="flex transition-transform duration-300 ease-out"
                    style={{ transform: `translateX(-${classicIndex * 100}%)` }}
                  >
                    {templates.map(([key, template]) => (
                      <div key={key} className="w-full shrink-0 p-5">
                        <div className="font-display font-bold text-base text-sleep-900 mb-2">{template.name}</div>
                        <p className="text-sm text-sleep-600 font-body leading-relaxed mb-3">{template.concept}</p>
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {template.characters.map((c, ci) => (
                            <span key={ci} className="px-2 py-0.5 rounded-full text-[10px] font-display font-semibold bg-cream-200/80 text-sleep-500">
                              {c.name}
                            </span>
                          ))}
                        </div>
                        <button
                          onClick={() => handleTemplateSelect(key)}
                          className={`w-full py-2.5 rounded-xl font-display font-semibold text-sm transition-all active:scale-[0.98] ${selectedTemplate === key
                            ? 'bg-dream-aurora text-white shadow-glow-sm'
                            : 'bg-dream-glow hover:bg-dream-aurora text-white shadow-glow-sm'
                          }`}
                        >
                          {selectedTemplate === key ? 'Selected ✓' : 'Use this story'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-3 px-1">
                  <button
                    onClick={() => setClassicIndex(Math.max(0, classicIndex - 1))}
                    disabled={classicIndex === 0}
                    className="px-3 py-1.5 text-xs font-display font-semibold text-sleep-500 hover:text-sleep-800 disabled:opacity-30 transition-colors"
                  >
                    ← Prev
                  </button>
                  <div className="flex gap-1.5">
                    {templates.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setClassicIndex(i)}
                        className={`w-2 h-2 rounded-full transition-all duration-200 ${i === classicIndex ? 'bg-dream-glow scale-125' : 'bg-cream-300/60 hover:bg-cream-400'}`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => setClassicIndex(Math.min(templates.length - 1, classicIndex + 1))}
                    disabled={classicIndex >= templates.length - 1}
                    className="px-3 py-1.5 text-xs font-display font-semibold text-sleep-500 hover:text-sleep-800 disabled:opacity-30 transition-colors"
                  >
                    Next →
                  </button>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Generate Script Section */}
        <div className="bg-white/80 backdrop-blur-sm border-2 border-cream-300/50 rounded-3xl p-5 shadow-card space-y-5">
          <h2 className="flex items-center gap-2 text-lg font-display font-bold text-sleep-900">
            <Zap className="h-5 w-5 text-dream-glow" />
            Generate Script
          </h2>

          {/* Story Input */}
          <div>
            <label htmlFor="story-content" className="block text-sm font-display font-semibold text-sleep-600 mb-2">Story Concept</label>
            <textarea
              id="story-content"
              placeholder="Describe your story concept, plot, and key events..."
              value={storyContent}
              onChange={(e) => setStoryContent(e.target.value)}
              className="w-full min-h-[120px] p-3 bg-cream-100/80 border-2 border-cream-300/60 rounded-2xl resize-none text-sleep-900 placeholder-sleep-400 text-sm font-body focus:border-dream-glow/50 focus:outline-none transition-all"
            />
          </div>

          {/* Characters */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-sm font-display font-semibold text-sleep-600">
                <Users className="w-4 h-4 text-dream-glow" />
                Characters (up to 10)
              </label>
              <button
                type="button"
                onClick={addCharacter}
                disabled={characters.length >= 10}
                className="flex items-center gap-1 px-3 py-1.5 bg-cream-100/80 border-2 border-cream-300/60 rounded-xl text-xs font-display font-semibold text-sleep-600 hover:border-dream-glow/30 disabled:opacity-40 transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            </div>

            <div className="space-y-3">
              {characters.map((character, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      placeholder="Character name"
                      value={character.name}
                      onChange={(e) => updateCharacter(index, 'name', e.target.value)}
                      className="w-full p-2.5 bg-cream-100/80 border-2 border-cream-300/60 rounded-xl text-sleep-900 placeholder-sleep-400 text-sm font-body focus:border-dream-glow/50 focus:outline-none transition-all"
                    />
                    <input
                      placeholder="Character description"
                      value={character.description}
                      onChange={(e) => updateCharacter(index, 'description', e.target.value)}
                      className="w-full p-2.5 bg-cream-100/80 border-2 border-cream-300/60 rounded-xl text-sleep-900 placeholder-sleep-400 text-sm font-body focus:border-dream-glow/50 focus:outline-none transition-all"
                    />
                  </div>
                  {characters.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCharacter(index)}
                      className="p-2 bg-danger/10 border-2 border-danger/20 text-danger rounded-xl hover:bg-danger/20 transition-all"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Anything to weave in? — consolidated field */}
          <div>
            <label htmlFor="parent-note" className="block text-sm font-display font-semibold text-sleep-600 mb-2">
              Anything to weave into tonight's story?
            </label>
            <textarea
              id="parent-note"
              value={parentNote}
              onChange={(e) => setParentNote(e.target.value)}
              placeholder="Optional — mood, big day, specific requests, anything on their mind…"
              rows={2}
              className="w-full p-3 bg-cream-100/80 border-2 border-cream-300/60 rounded-2xl resize-none text-sleep-900 placeholder-sleep-400 text-sm font-body focus:border-dream-glow/50 focus:outline-none transition-all"
            />
          </div>

          {/* Ready to Generate */}
          <div className="text-center bg-cream-100/60 p-4 rounded-2xl border-2 border-cream-300/40">
            <div className="text-sm text-sleep-600 font-body">
              Ready to generate a ~10 minute audio story
            </div>
            <div className="text-xs text-sleep-400 mt-1">
              Cost: 1 credit per generation
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!isReadyToGenerate || isGenerating}
            className={`w-full py-3.5 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2 transition-all ${!isReadyToGenerate || isGenerating
                ? 'bg-cream-300/50 text-sleep-400 cursor-not-allowed'
                : 'bg-dream-glow text-white shadow-glow-sm hover:bg-dream-aurora active:scale-[0.98]'
              }`}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-cream-300 border-t-white"></div>
                Generating Script…
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Generate 10-Minute Script ✨
              </>
            )}
          </button>

          {!isReadyToGenerate && (
            <div className="text-xs text-sleep-400 text-center font-body bg-cream-100/40 p-3 rounded-xl">
              Please add a story concept and at least one character to continue.
            </div>
          )}

          <div className="text-center">
            <span className="inline-block px-3 py-1 bg-dream-stardust/30 text-dream-aurora rounded-full text-xs font-display font-semibold border border-dream-glow/20">
              Fixed Cost: 1 Credit per Generation
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptimizedCreateScreen;
