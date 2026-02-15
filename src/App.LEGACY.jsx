import React, { useState } from 'react';
import { Search, BookOpen, Library, User, Play, Pause, SkipBack, SkipForward, Volume2, X, ChevronDown, ChevronUp, Plus, Trash2, PawPrint } from 'lucide-react';
import StreamlinedCreateScreen from './components/StreamlinedCreateScreen';
import BuddyTimerApp from './features/buddy-timer/BuddyTimerApp';
import { aiScriptGeneration } from './lib/aiScriptGeneration';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('discover');
  const [userTier, setUserTier] = useState('listener'); // 'listener' or 'creator'
  const [showTierModal, setShowTierModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [showScriptEditor, setShowScriptEditor] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Sample script data for Script Editor
  const [scriptLines, setScriptLines] = useState([
    { id: 1, type: 'narration', speaker: 'Narrator', text: 'Detective Sarah Chen stood at the edge of the quantum laboratory, her enhanced vision flickering between multiple realities.', annotations: [] },
    { id: 2, type: 'dialogue', speaker: 'Sarah', text: 'I can see it... the moment everything changed. But which timeline is real?', annotations: ['questioning'] },
    { id: 3, type: 'narration', speaker: 'Narrator', text: 'The quantum field around her shimmered, revealing traces of the impossible crime.', annotations: [] },
    { id: 4, type: 'dialogue', speaker: 'Dr. Martinez', text: 'Sarah, you need to focus on this reality. The killer is still here, in this timeline.', annotations: ['urgent'] },
    { id: 5, type: 'dialogue', speaker: 'Sarah', text: 'But I can see them in the other timelines too. They\'re jumping between realities!', annotations: ['excited'] },
    { id: 6, type: 'narration', speaker: 'Narrator', text: 'As Sarah concentrated, the quantum signatures became clearer, painting a picture of interdimensional murder.', annotations: [] }
  ]);

  const voices = [
    { name: 'Standard Female 1', description: 'Clear, warm female voice', premium: false },
    { name: 'Standard Male 1', description: 'Deep, confident male voice', premium: false },
    { name: 'Standard Female 2', description: 'Soft, gentle female voice', premium: false },
    { name: 'Premium Female 1', description: 'Professional actress voice', premium: true },
    { name: 'Premium Male 1', description: 'Professional actor voice', premium: true },
    { name: 'Character Voice 1', description: 'Unique character voice', premium: true },
    { name: 'Narrator Voice', description: 'Professional narrator', premium: true }
  ];

  const annotationOptions = [
    { name: 'whisper', label: 'Whisper', icon: '🤫' },
    { name: 'shout', label: 'Shout', icon: '📢' },
    { name: 'happy', label: 'Happy', icon: '😊' },
    { name: 'sad', label: 'Sad', icon: '😢' },
    { name: 'angry', label: 'Angry', icon: '😠' },
    { name: 'emphatic', label: 'Emphatic', icon: '💪' },
    { name: 'questioning', label: 'Questioning', icon: '❓' },
    { name: 'neutral', label: 'Neutral', icon: '😐' }
  ];

  // Script Editor state
  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [selectedLineId, setSelectedLineId] = useState(null);

  const featuredSeries = [
    {
      title: 'The Quantum Detective',
      author: 'Sarah Chen',
      plays: '12.5K plays',
      rating: '4.8',
      cover: 'The Quantum Detective'
    },
    {
      title: 'Echoes of Tomorrow',
      author: 'Alex Rivera',
      plays: '8.3K plays',
      rating: '4.9',
      cover: 'Echoes of Tomorrow'
    },
    {
      title: 'Shadows of the Academy',
      author: 'Morgan Blake',
      plays: '6.7K plays',
      rating: '4.7',
      cover: 'Shadows of the Academy'
    }
  ];

  const trendingFandoms = [
    { name: 'Harry Potter', series: '2.1K series' },
    { name: 'Marvel', series: '1.8K series' },
    { name: 'Anime', series: '1.5K series' },
    { name: 'Star Wars', series: '1.2K series' }
  ];

  const selectVoice = () => {
    setShowVoiceModal(false);
  };

  const calculateCredits = () => {
    return 15;
  };

  const switchTier = (tier) => {
    setUserTier(tier);
    setShowTierModal(false);
  };

  const updateScriptLine = (lineId, field, value) => {
    setScriptLines(lines =>
      lines.map(line =>
        line.id === lineId ? { ...line, [field]: value } : line
      )
    );
  };

  const addAnnotationToLine = (lineId, annotation) => {
    setScriptLines(lines =>
      lines.map(line =>
        line.id === lineId
          ? { ...line, annotations: [...line.annotations.filter(a => a !== annotation), annotation] }
          : line
      )
    );
    setShowAnnotationModal(false);
    setSelectedLineId(null);
  };

  const removeAnnotationFromLine = (lineId, annotation) => {
    setScriptLines(lines =>
      lines.map(line =>
        line.id === lineId
          ? { ...line, annotations: line.annotations.filter(a => a !== annotation) }
          : line
      )
    );
  };

  const openAnnotationModal = (lineId) => {
    setSelectedLineId(lineId);
    setShowAnnotationModal(true);
  };

  /* ─────────────────────────────────────────────
     Script Editor — Finch-styled
     ───────────────────────────────────────────── */
  const renderScriptEditor = () => (
    <div className="min-h-full animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-cream-300/50">
        <button
          onClick={() => {
            setShowScriptEditor(false);
            setShowCreateStory(true);
          }}
          className="px-4 py-2 rounded-2xl font-display font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 bg-white/80 text-sleep-700 border-2 border-cream-300/60 hover:border-dream-glow/30 hover:transform hover:-translate-y-0.5"
        >
          ← Back
        </button>
        <h1 className="text-lg font-display font-bold text-sleep-900">The Quantum Detective — Ep 1</h1>
        <div className="flex items-center gap-2">
          <button className="p-2 text-sleep-400 hover:text-dream-glow transition-colors">
            💾
          </button>
          <button className="p-2 text-sleep-400 hover:text-dream-glow transition-colors">
            ⋯
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-200px)]">
        {/* Side Panel */}
        <div className="w-80 bg-white/60 backdrop-blur-sm border-r border-cream-300/50 p-6 overflow-y-auto">
          <h3 className="text-lg font-display font-semibold text-sleep-900 mb-4">Characters & Voices</h3>
          <div className="space-y-3">
            {[...new Set(scriptLines.map(line => line.speaker))].map((speaker, index) => (
              <div key={index} className="bg-white/80 border-2 border-cream-300/50 rounded-2xl p-3">
                <div className="font-display font-semibold text-sleep-900 mb-1">{speaker}</div>
                <div className="text-sm text-sleep-500 mb-2">Standard Voice</div>
                <button className="text-xs text-dream-glow hover:text-dream-aurora transition-colors font-semibold">
                  Change Voice
                </button>
              </div>
            ))}
            <div className="bg-white/80 border-2 border-cream-300/50 rounded-2xl p-3">
              <div className="font-display font-semibold text-sleep-900 mb-1">Narrator</div>
              <div className="text-sm text-sleep-500 mb-2">Professional Narrator</div>
              <button className="text-xs text-dream-glow hover:text-dream-aurora transition-colors font-semibold">
                🔊 Preview
              </button>
            </div>
          </div>
        </div>

        {/* Main Script Editor */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-4">
            {scriptLines.map((line) => (
              <div
                key={line.id}
                className={`border-2 rounded-2xl p-4 transition-all duration-200 hover:border-dream-glow/30 ${line.type === 'narration'
                  ? 'bg-white/60 border-cream-300/40'
                  : 'bg-white/80 border-cream-300/50'
                  }`}
              >
                {/* Line Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <select
                      value={line.speaker}
                      onChange={(e) => updateScriptLine(line.id, 'speaker', e.target.value)}
                      className="px-3 py-1 bg-cream-100/80 border-2 border-cream-300/60 rounded-xl text-sleep-900 text-sm font-display focus:outline-none focus:border-dream-glow/50"
                    >
                      <option value="Narrator">Narrator</option>
                      {[...new Set(scriptLines.map(line => line.speaker))].filter(speaker => speaker !== 'Narrator').map((speaker, index) => (
                        <option key={index} value={speaker}>{speaker}</option>
                      ))}
                    </select>
                    {line.type === 'narration' && (
                      <span className="text-xs bg-cream-200 text-sleep-600 px-2 py-1 rounded-full font-display font-semibold">NARRATION</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openAnnotationModal(line.id)}
                      className="p-1 text-sleep-400 hover:text-dream-glow transition-colors"
                      title="Add TTS Annotation"
                    >
                      🎭
                    </button>
                    <button className="p-1 text-sleep-400 hover:text-dream-glow transition-colors" title="Play Line">
                      ▶️
                    </button>
                  </div>
                </div>

                {/* Annotations */}
                {line.annotations.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {line.annotations.map((annotation, index) => {
                      const annotationOption = annotationOptions.find(opt => opt.name === annotation);
                      return (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 bg-dream-stardust/60 text-dream-aurora text-xs px-2 py-1 rounded-full border border-dream-glow/20 font-semibold"
                        >
                          {annotationOption?.icon} {annotationOption?.label}
                          <button
                            onClick={() => removeAnnotationFromLine(line.id, annotation)}
                            className="ml-1 text-dream-glow hover:text-danger transition-colors"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Editable Text */}
                <textarea
                  value={line.text}
                  onChange={(e) => updateScriptLine(line.id, 'text', e.target.value)}
                  className="w-full bg-transparent text-sleep-900 resize-none focus:outline-none min-h-[60px] font-body text-sm"
                  placeholder="Enter script text..."
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-20 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-cream-300/50 px-6 py-4 flex items-center justify-between z-40">
        <div className="text-sleep-700">
          <span className="text-lg font-display font-bold text-dream-glow">Cost: {calculateCredits()} Credits</span>
          <p className="text-sm text-sleep-500">Estimated 25 minutes • Ready for generation</p>
        </div>
        <button className="px-6 py-3 rounded-2xl font-display font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 bg-dream-glow text-white shadow-glow-sm hover:bg-dream-aurora hover:transform hover:-translate-y-0.5 active:scale-[0.98]">
          Generate Audio ✨
        </button>
      </div>
    </div>
  );

  /* ─────────────────────────────────────────────
     Loading State — Finch-styled
     ───────────────────────────────────────────── */
  const renderLoadingState = () => (
    <div className="min-h-full px-6 py-8 animate-fade-in flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-dream-glow/30 border-t-dream-glow rounded-full animate-spin mx-auto mb-6"></div>
        <h2 className="text-2xl font-display font-bold text-sleep-900 mb-3">AI Crafting Your Script…</h2>
        <p className="text-sleep-500 mb-6">Analysing your story concept and generating professional script</p>
        <div className="bg-white/80 backdrop-blur-sm border-2 border-cream-300/50 rounded-3xl p-6 max-w-md mx-auto shadow-card">
          <div className="space-y-3 text-left">
            <div className="flex items-center gap-3 text-sleep-700">
              <span className="text-success">✓</span>
              <span className="text-sm font-semibold">Processing story concept</span>
            </div>
            <div className="flex items-center gap-3 text-sleep-700">
              <span className="text-success">✓</span>
              <span className="text-sm font-semibold">Generating character dialogue</span>
            </div>
            <div className="flex items-center gap-3 text-sleep-600">
              <div className="w-4 h-4 border-2 border-dream-glow/30 border-t-dream-glow rounded-full animate-spin"></div>
              <span className="text-sm font-semibold">Creating narrative structure</span>
            </div>
            <div className="flex items-center gap-3 text-sleep-400">
              <span>○</span>
              <span className="text-sm">Optimising for voice synthesis</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /* ─────────────────────────────────────────────
     Discover Screen — Finch-styled
     ───────────────────────────────────────────── */
  const renderDiscoverScreen = () => (
    <div className="min-h-full px-6 py-8 animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-3 gradient-text">Discover Fanfiction</h1>
        <p className="text-sleep-500 text-lg">Transform your favourite stories into immersive audio drama</p>
      </div>

      {/* Featured Series */}
      <div className="bg-white/80 backdrop-blur-sm border-2 border-cream-300/50 rounded-3xl p-6 mb-6 shadow-card">
        <h2 className="text-xl font-display font-semibold mb-4 text-sleep-900">Featured Series</h2>
        {featuredSeries.map((series, index) => (
          <div key={index} className="bg-white/70 backdrop-blur-sm border-2 border-cream-300/40 rounded-2xl overflow-hidden mb-4 hover:transform hover:-translate-y-1 hover:border-dream-glow/30 transition-all duration-200 shadow-card">
            <div className="w-full h-48 flex items-center justify-center text-white font-display font-bold text-xl gradient-teal-orange">
              {series.cover}
            </div>
            <div className="p-5">
              <h3 className="text-xl font-display font-semibold mb-1 text-sleep-900">{series.title}</h3>
              <p className="text-sleep-500 mb-3 text-sm">by {series.author}</p>
              <div className="flex items-center gap-4 text-sleep-400 text-sm">
                <span>👥 {series.plays}</span>
                <span>⭐ {series.rating}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Trending Fandoms */}
      <div className="bg-white/80 backdrop-blur-sm border-2 border-cream-300/50 rounded-3xl p-6 mb-6 shadow-card">
        <h2 className="text-xl font-display font-semibold mb-4 text-sleep-900">Trending Fandoms</h2>
        {trendingFandoms.map((fandom, index) => (
          <div key={index} className="flex items-center justify-between py-3 border-b border-cream-300/40 last:border-b-0">
            <div>
              <h3 className="font-display font-semibold text-sleep-900">{fandom.name}</h3>
              <p className="text-sm text-sleep-400">{fandom.series}</p>
            </div>
            <span className="text-2xl">⚡</span>
          </div>
        ))}
      </div>
    </div>
  );

  // Handle streamlined AI generation
  const handleStreamlinedGenerate = async (payload) => {
    try {
      setIsGenerating(true);
      console.log('Generating story with payload:', payload);

      const result = await aiScriptGeneration.generateScriptFromUrl({
        sourceUrl: null,
        storyId: `story_${Date.now()}`,
        userId: '04fd596d-f8ec-4a6a-bc1a-fd36dfbb236c',
        preferences: payload.preferences,
        ai_prompts: payload.ai_prompts
      });

      console.log('Generation result:', result);

      setShowCreateStory(false);
      setShowScriptEditor(true);

    } catch (error) {
      console.error('Error generating story:', error);
      alert('Error generating story. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  /* ─────────────────────────────────────────────
     Create Screen — Finch-styled
     ───────────────────────────────────────────── */
  const renderCreateScreen = () => {
    if (showCreateStory) {
      return (
        <StreamlinedCreateScreen
          onBack={() => setShowCreateStory(false)}
          onGenerate={handleStreamlinedGenerate}
          user={{ id: '04fd596d-f8ec-4a6a-bc1a-fd36dfbb236c' }}
        />
      );
    }

    return (
      <div className="min-h-full px-6 py-8 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-3 gradient-text">Create Stories</h1>
          <p className="text-sleep-500 text-lg">Transform your ideas into immersive audio drama</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm border-2 border-cream-300/50 rounded-3xl p-6 mb-6 shadow-card">
          <h2 className="text-xl font-display font-semibold mb-3 text-sleep-900">Create New Story</h2>
          <p className="text-sleep-500 mb-4 text-sm">Use AI assistance to craft original fanfiction audio series</p>
          <button
            onClick={() => setShowCreateStory(true)}
            className="px-6 py-3.5 rounded-2xl font-display font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 bg-dream-glow text-white shadow-glow-sm hover:bg-dream-aurora hover:transform hover:-translate-y-0.5 active:scale-[0.98] w-full"
          >
            Start Creating ✨
          </button>
        </div>

        {/* Creator Pricing card */}
        <div className="bg-white/90 backdrop-blur-sm border-2 border-dream-glow/20 rounded-3xl p-6 mb-6 shadow-card relative overflow-hidden">
          {/* Subtle glow accent */}
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-dream-glow/10 blur-2xl pointer-events-none" />
          <h3 className="text-lg font-display font-bold text-sleep-900 mb-2 relative z-10">Creator Pricing</h3>
          <div className="text-2xl font-display font-bold text-dream-glow mb-4 relative z-10">$5 per 30 minutes</div>
          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-2 text-sleep-600 text-sm">
              <span className="text-success">✓</span>
              <span className="font-semibold">Professional multi-character voices</span>
            </div>
            <div className="flex items-center gap-2 text-sleep-600 text-sm">
              <span className="text-success">✓</span>
              <span className="font-semibold">Advanced emotion and pacing controls</span>
            </div>
            <div className="flex items-center gap-2 text-sleep-600 text-sm">
              <span className="text-success">✓</span>
              <span className="font-semibold">Commercial usage rights</span>
            </div>
            <div className="flex items-center gap-2 text-sleep-600 text-sm">
              <span className="text-success">✓</span>
              <span className="font-semibold">Priority generation queue</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ─────────────────────────────────────────────
     Library Screen — Finch-styled
     ───────────────────────────────────────────── */
  const renderLibraryScreen = () => (
    <div className="min-h-full px-6 py-8 animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-3 gradient-text">My Library</h1>
        <p className="text-sleep-500 text-lg">Your fanfiction audio collection</p>
      </div>

      {userTier === 'listener' ? (
        <div className="bg-white/80 backdrop-blur-sm border-2 border-cream-300/50 rounded-3xl p-6 mb-6 text-center shadow-card">
          <h2 className="text-xl font-display font-semibold mb-4 text-sleep-900">Upgrade to Creator</h2>
          <p className="text-sleep-500 mb-6 text-sm">Generate your own fanfiction audio series and build your library</p>
          <button
            onClick={() => setShowTierModal(true)}
            className="px-6 py-3.5 rounded-2xl font-display font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 bg-dream-glow text-white shadow-glow-sm hover:bg-dream-aurora hover:transform hover:-translate-y-0.5 active:scale-[0.98] mx-auto"
          >
            Become a Creator ✨
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-sm border-2 border-cream-300/50 rounded-3xl p-6 shadow-card">
            <h2 className="text-xl font-display font-semibold mb-4 text-sleep-900">Generated Series</h2>
            <div className="bg-white/70 backdrop-blur-sm border-2 border-cream-300/40 rounded-2xl overflow-hidden hover:transform hover:-translate-y-1 hover:border-dream-glow/30 transition-all duration-200 shadow-card">
              <div className="w-full h-48 flex items-center justify-center text-white font-display font-bold text-xl gradient-teal-orange">My Harry Potter Series</div>
              <div className="p-5">
                <h3 className="text-xl font-display font-semibold mb-1 text-sleep-900">The Marauders' Legacy</h3>
                <p className="text-sleep-500 mb-3 text-sm">by You</p>
                <div className="flex items-center gap-4 text-sleep-400 text-sm">
                  <span>📺 Episode 3 of 8 • 38% complete</span>
                  <span>⏱️ 2h 15m total</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border-2 border-cream-300/50 rounded-3xl p-6 shadow-card">
            <h2 className="text-xl font-display font-semibold mb-4 text-sleep-900">Saved Series</h2>
            <p className="text-sleep-400 text-center py-8 font-display">No saved series yet</p>
          </div>
        </div>
      )}
    </div>
  );

  /* ─────────────────────────────────────────────
     Account Screen — Finch-styled
     ───────────────────────────────────────────── */
  const renderAccountScreen = () => (
    <div className="min-h-full px-6 py-8 animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-3 gradient-text">Account</h1>
        <p className="text-sleep-500 text-lg">Manage your DreamStation experience</p>
      </div>

      {/* Subscription Card */}
      <div className="bg-white/80 backdrop-blur-sm border-2 border-cream-300/50 rounded-3xl p-6 mb-6 shadow-card">
        <h2 className="text-xl font-display font-semibold mb-4 text-sleep-900">Subscription</h2>
        {userTier === 'listener' ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-display font-bold text-sleep-900">Listener Tier</h3>
                <p className="text-sleep-500 text-sm">$9.99/month</p>
              </div>
              <span className="bg-pastel-mint text-sleep-900 px-3 py-1 rounded-full text-xs font-display font-bold">Active</span>
            </div>
            <button
              onClick={() => setShowTierModal(true)}
              className="px-6 py-3.5 rounded-2xl font-display font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 bg-dream-glow text-white shadow-glow-sm hover:bg-dream-aurora hover:transform hover:-translate-y-0.5 active:scale-[0.98] w-full"
            >
              Manage Subscription
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-display font-bold text-sleep-900">Creator Tier</h3>
                <p className="text-sleep-500 text-sm">Pay-per-creation</p>
              </div>
              <span className="bg-dream-stardust text-dream-aurora px-3 py-1 rounded-full text-xs font-display font-bold">Active</span>
            </div>
            <button
              onClick={() => setActiveTab('create')}
              className="px-6 py-3.5 rounded-2xl font-display font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 bg-dream-glow text-white shadow-glow-sm hover:bg-dream-aurora hover:transform hover:-translate-y-0.5 active:scale-[0.98] w-full mb-3"
            >
              Go to Creator Studio
            </button>
            <button
              onClick={() => setShowTierModal(true)}
              className="px-6 py-3 rounded-2xl font-display font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 bg-white/80 text-sleep-700 border-2 border-cream-300 hover:border-dream-glow/30 hover:transform hover:-translate-y-0.5 w-full"
            >
              Manage Subscription
            </button>
          </div>
        )}
      </div>

      {/* Creator Tools (listener only) */}
      {userTier === 'listener' && (
        <div className="bg-white/80 backdrop-blur-sm border-2 border-cream-300/50 rounded-3xl p-6 mb-6 shadow-card">
          <h2 className="text-xl font-display font-semibold mb-4 text-sleep-900">Creator Tools</h2>
          <p className="text-sleep-500 mb-4 text-sm">Upgrade to create your own fanfiction audio series</p>
          <div className="bg-white/90 border-2 border-dream-glow/20 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-dream-glow/10 blur-2xl pointer-events-none" />
            <div className="text-lg font-display font-bold text-sleep-900 mb-1 relative z-10">Creator Tier Preview</div>
            <div className="text-xl font-display font-bold text-dream-glow mb-3 relative z-10">$5 per 30 minutes</div>
            <div className="space-y-2 relative z-10">
              <div className="flex items-center gap-2 text-sleep-600 text-sm">
                <span className="text-success">✓</span>
                <span className="font-semibold">AI-powered story generation</span>
              </div>
              <div className="flex items-center gap-2 text-sleep-600 text-sm">
                <span className="text-success">✓</span>
                <span className="font-semibold">Multi-character voice synthesis</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Creator Dashboard (creator only) */}
      {userTier === 'creator' && (
        <div className="bg-white/80 backdrop-blur-sm border-2 border-cream-300/50 rounded-3xl p-6 mb-6 shadow-card">
          <h2 className="text-xl font-display font-semibold mb-4 text-sleep-900">Creator Dashboard</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center bg-white/60 rounded-2xl p-3 border border-cream-300/40">
              <div className="text-2xl font-display font-bold text-dream-glow">3</div>
              <div className="text-xs text-sleep-500 font-semibold">Series Created</div>
            </div>
            <div className="text-center bg-white/60 rounded-2xl p-3 border border-cream-300/40">
              <div className="text-2xl font-display font-bold text-pastel-peach">24.5K</div>
              <div className="text-xs text-sleep-500 font-semibold">Total Plays</div>
            </div>
            <div className="text-center bg-white/60 rounded-2xl p-3 border border-cream-300/40">
              <div className="text-2xl font-display font-bold text-success">$127</div>
              <div className="text-xs text-sleep-500 font-semibold">Credits Used</div>
            </div>
          </div>
        </div>
      )}

      {/* Listening Stats */}
      <div className="bg-white/80 backdrop-blur-sm border-2 border-cream-300/50 rounded-3xl p-6 mb-6 shadow-card">
        <h2 className="text-xl font-display font-semibold mb-4 text-sleep-900">Listening Stats</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sleep-500 text-sm">Hours listened this month</span>
            <span className="text-sleep-900 font-display font-bold">24.5h</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sleep-500 text-sm">Favourite genre</span>
            <span className="text-sleep-900 font-display font-bold">Romance</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sleep-500 text-sm">Series completed</span>
            <span className="text-sleep-900 font-display font-bold">12</span>
          </div>
        </div>
      </div>
    </div>
  );

  /* ─────────────────────────────────────────────
     Screen Router
     ───────────────────────────────────────────── */
  const renderScreen = () => {
    if (isGenerating) {
      return renderLoadingState();
    }
    if (showScriptEditor) {
      return renderScriptEditor();
    }

    switch (activeTab) {
      case 'discover': return renderDiscoverScreen();
      case 'create': return renderCreateScreen();
      case 'buddy': return (
        <BuddyTimerApp
          onExit={() => setActiveTab('discover')}
          onStoryTime={() => setActiveTab('create')}
        />
      );
      case 'library': return renderLibraryScreen();
      case 'account': return renderAccountScreen();
      default: return renderDiscoverScreen();
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 text-sleep-900 flex flex-col relative overflow-hidden font-body">
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-sleep-glow pointer-events-none" />

      {/* Credits Display (only for creator tier) */}
      {userTier === 'creator' && (
        <div className="fixed top-6 right-6 bg-white/80 backdrop-blur-sm border-2 border-dream-glow/20 rounded-full px-4 py-2 text-sm font-display font-bold text-dream-glow z-30 shadow-glow-sm">
          5 Credits
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 pb-32 min-h-[calc(100vh-128px)] relative z-10">
        {renderScreen()}
      </main>

      {/* ── Mini Player ── */}
      <div className="fixed bottom-20 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-cream-300/50 px-6 py-4 flex items-center gap-4 z-40 shadow-card">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-display font-bold text-sm gradient-teal-orange shadow-sm">🎭</div>
        <div className="flex-1 min-w-0">
          <div className="text-sleep-900 font-display font-bold text-sm truncate">The Quantum Detective</div>
          <div className="text-sleep-500 text-xs truncate">Episode 3: The Missing Variable</div>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-sleep-600 hover:text-dream-glow transition-colors p-1">
            <SkipBack className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 rounded-full bg-dream-glow flex items-center justify-center shadow-glow-sm hover:bg-dream-aurora transition-colors">
            <Play className="w-5 h-5 text-white ml-0.5" />
          </button>
          <button className="text-sleep-600 hover:text-dream-glow transition-colors p-1">
            <SkipForward className="w-5 h-5" />
          </button>
          <button className="text-sleep-600 hover:text-dream-glow transition-colors p-1">
            <Volume2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Bottom Navigation ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-cream-300/50 px-4 py-3 z-50">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('discover')}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-200 ${activeTab === 'discover' ? 'text-dream-glow bg-dream-stardust/50' : 'text-sleep-400 hover:text-sleep-700'
              }`}
          >
            <Search className="text-xl" />
            <span className="text-xs font-display font-semibold">Discover</span>
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-200 ${activeTab === 'create' ? 'text-dream-glow bg-dream-stardust/50' : 'text-sleep-400 hover:text-sleep-700'
              }`}
          >
            <BookOpen className="text-xl" />
            <span className="text-xs font-display font-semibold">Create</span>
          </button>
          <button
            onClick={() => setActiveTab('buddy')}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-200 ${activeTab === 'buddy' ? 'text-dream-glow bg-dream-stardust/50' : 'text-sleep-400 hover:text-sleep-700'
              }`}
          >
            <PawPrint className="text-xl" />
            <span className="text-xs font-display font-semibold">Buddy</span>
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-200 ${activeTab === 'library' ? 'text-dream-glow bg-dream-stardust/50' : 'text-sleep-400 hover:text-sleep-700'
              }`}
          >
            <Library className="text-xl" />
            <span className="text-xs font-display font-semibold">Library</span>
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-200 ${activeTab === 'account' ? 'text-dream-glow bg-dream-stardust/50' : 'text-sleep-400 hover:text-sleep-700'
              }`}
          >
            <User className="text-xl" />
            <span className="text-xs font-display font-semibold">Account</span>
          </button>
        </div>
      </nav>

      {/* ── Voice Selection Modal ── */}
      {showVoiceModal && (
        <div className="fixed inset-0 bg-sleep-950/30 backdrop-blur-sm flex items-center justify-center p-6 z-[100]" onClick={() => setShowVoiceModal(false)}>
          <div className="bg-white/95 backdrop-blur-lg border-2 border-cream-300/50 rounded-3xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto shadow-dream" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-display font-bold text-sleep-900">Select Voice</h3>
              <button
                onClick={() => setShowVoiceModal(false)}
                className="text-sleep-400 hover:text-sleep-700 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {voices.map((voice, index) => (
                <button
                  key={index}
                  onClick={() => selectVoice(voice.name)}
                  className="flex items-center justify-between p-3 bg-white/80 border-2 border-cream-300/50 rounded-2xl hover:border-dream-glow/30 transition-all"
                >
                  <div className="flex-1">
                    <div className="font-display font-semibold text-sleep-900">{voice.name}</div>
                    <div className="text-sm text-sleep-500">{voice.description}</div>
                  </div>
                  {voice.premium && (
                    <span className="bg-dream-glow text-white text-xs px-2 py-1 rounded-full font-display font-bold">Premium</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TTS Annotation Modal ── */}
      {showAnnotationModal && (
        <div className="fixed inset-0 bg-sleep-950/30 backdrop-blur-sm flex items-center justify-center p-6 z-[100]" onClick={() => setShowAnnotationModal(false)}>
          <div className="bg-white/95 backdrop-blur-lg border-2 border-cream-300/50 rounded-3xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto shadow-dream" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-display font-bold text-sleep-900">Add TTS Annotation</h3>
              <button
                onClick={() => setShowAnnotationModal(false)}
                className="text-sleep-400 hover:text-sleep-700 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {annotationOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => addAnnotationToLine(selectedLineId, option.name)}
                  className="flex items-center gap-3 p-3 bg-white/80 border-2 border-cream-300/50 rounded-2xl hover:border-dream-glow/30 hover:bg-dream-stardust/20 transition-all"
                >
                  <span className="text-xl">{option.icon}</span>
                  <span className="text-sleep-900 font-display font-semibold text-sm">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tier Selection Modal ── */}
      {showTierModal && (
        <div className="fixed inset-0 bg-sleep-950/30 backdrop-blur-sm flex items-center justify-center p-6 z-[100]" onClick={() => setShowTierModal(false)}>
          <div className="bg-white/95 backdrop-blur-lg border-2 border-cream-300/50 rounded-3xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto shadow-dream" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-display font-bold text-sleep-900">Choose Your Tier</h3>
              <button
                onClick={() => setShowTierModal(false)}
                className="text-sleep-400 hover:text-sleep-700 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {/* Listener Tier */}
              <div
                onClick={() => switchTier('listener')}
                className={`bg-white/80 border-2 rounded-2xl p-5 cursor-pointer transition-all duration-200 ${userTier === 'listener'
                  ? 'border-dream-glow ring-2 ring-dream-glow/15 shadow-glow-sm'
                  : 'border-cream-300/60 hover:border-dream-glow/30'
                  }`}
              >
                <div className="text-lg font-display font-bold text-sleep-900 mb-1">Listener Tier</div>
                <div className="text-xl font-display font-bold text-dream-glow mb-3">$9.99/month</div>
                <div className="space-y-1">
                  <div className="text-sm text-sleep-600 font-semibold"><span className="text-success">✓</span> Unlimited listening</div>
                  <div className="text-sm text-sleep-600 font-semibold"><span className="text-success">✓</span> Access to all series</div>
                  <div className="text-sm text-sleep-600 font-semibold"><span className="text-success">✓</span> Offline downloads</div>
                </div>
              </div>
              {/* Creator Tier */}
              <div
                onClick={() => switchTier('creator')}
                className={`bg-white/80 border-2 rounded-2xl p-5 cursor-pointer transition-all duration-200 ${userTier === 'creator'
                  ? 'border-dream-glow ring-2 ring-dream-glow/15 shadow-glow-sm'
                  : 'border-cream-300/60 hover:border-dream-glow/30'
                  }`}
              >
                <div className="text-lg font-display font-bold text-sleep-900 mb-1">Creator Tier</div>
                <div className="text-xl font-display font-bold text-dream-glow mb-3">$5 per 30 minutes</div>
                <div className="space-y-1">
                  <div className="text-sm text-sleep-600 font-semibold"><span className="text-success">✓</span> Everything in Listener</div>
                  <div className="text-sm text-sleep-600 font-semibold"><span className="text-success">✓</span> Create audio series</div>
                  <div className="text-sm text-sleep-600 font-semibold"><span className="text-success">✓</span> Advanced voice controls</div>
                  <div className="text-sm text-sleep-600 font-semibold"><span className="text-success">✓</span> Commercial usage rights</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
