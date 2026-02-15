import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Zap, Users, Sparkles, Plus, X, ArrowLeft, Wand2 } from 'lucide-react';

// Enhanced quickstart templates
const QUICKSTART_TEMPLATES = {
  ADVENTURE: {
    name: 'Adventure Quest',
    concept: 'A brave young hero discovers a magical artifact and must journey through enchanted lands to save their village from an ancient curse.',
    characters: [
      { name: 'Alex', description: 'Brave young hero with a kind heart' },
      { name: 'Luna', description: 'Wise magical guide' },
      { name: 'Shadow King', description: 'Ancient villain who cast the curse' }
    ],
    genre: 'Fantasy Adventure'
  },
  FRIENDSHIP: {
    name: 'Friendship Story',
    concept: 'Two unlikely friends from different worlds must work together to solve a mystery that threatens both their communities.',
    characters: [
      { name: 'Maya', description: 'Curious city kid who loves puzzles' },
      { name: 'Forest', description: 'Nature-loving country kid with animal friends' },
      { name: 'Mrs. Willow', description: 'Mysterious librarian with secrets' }
    ],
    genre: 'Friendship Mystery'
  },
  MAGIC_SCHOOL: {
    name: 'Magic School',
    concept: 'A new student at a magical academy discovers they have a unique power that could save the school from a growing darkness.',
    characters: [
      { name: 'Riley', description: 'New student with mysterious powers' },
      { name: 'Professor Sage', description: 'Kind but worried headmaster' },
      { name: 'Zara', description: 'Talented student who becomes a friend' },
      { name: 'The Shadow', description: 'Dark force threatening the school' }
    ],
    genre: 'Magical School'
  },
  SPACE_ADVENTURE: {
    name: 'Space Adventure',
    concept: 'Young space explorers discover a lost planet with friendly aliens who need help defending their home from space pirates.',
    characters: [
      { name: 'Captain Nova', description: 'Brave young space explorer' },
      { name: 'Zyx', description: 'Friendly alien with special abilities' },
      { name: 'Commander Steel', description: 'Ruthless space pirate leader' },
      { name: 'ARIA', description: 'Helpful AI companion' }
    ],
    genre: 'Science Fiction'
  },
  ANIMAL_KINGDOM: {
    name: 'Animal Kingdom',
    concept: 'When the forest animals lose their voices, a young rabbit must find the magical Song Stone to restore harmony to the woodland.',
    characters: [
      { name: 'Pip', description: 'Brave little rabbit with big dreams' },
      { name: 'Oakley', description: 'Wise old owl who guides Pip' },
      { name: 'Whiskers', description: 'Mischievous cat who caused the trouble' },
      { name: 'Melody', description: 'Magical songbird guardian' }
    ],
    genre: 'Animal Fantasy'
  },
  UNDERWATER: {
    name: 'Underwater Adventure',
    concept: 'A young mermaid discovers that the ocean\'s coral reefs are losing their colors and must find the Rainbow Pearl to save her underwater world.',
    characters: [
      { name: 'Marina', description: 'Curious young mermaid' },
      { name: 'Finn', description: 'Loyal dolphin best friend' },
      { name: 'King Triton', description: 'Wise ruler of the sea' },
      { name: 'Coral', description: 'Ancient sea witch with the answers' }
    ],
    genre: 'Underwater Fantasy'
  }
};

const OptimizedCreateScreen = ({ onBack, onGenerate, isGenerating = false }) => {
  const { user } = useAuth();
  const [storyContent, setStoryContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [characters, setCharacters] = useState([{ name: '', description: '' }]);
  const [genre, setGenre] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  const handleTemplateSelect = (templateKey) => {
    if (templateKey && QUICKSTART_TEMPLATES[templateKey]) {
      const template = QUICKSTART_TEMPLATES[templateKey];
      setSelectedTemplate(templateKey);
      setStoryContent(template.concept);
      setCharacters(template.characters);
      setGenre(template.genre);
    } else {
      setSelectedTemplate('');
    }
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
        genre: genre || 'Adventure',
        targetEpisodes: 1,
        episodeLengthMinutes: 10
      },
      characters: characters.filter(char => char.name.trim()),
      preferences: {
        specialInstructions: specialInstructions,
        scriptLengthRequirement: "Generate exactly 130-140 script lines for a 10-minute audio drama. Mix of 75-85 dialogue lines (5-12 words each) and 55-60 narration lines (12-20 words each) for proper pacing and timing."
      }
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
        {/* Quickstart Templates */}
        <div className="bg-white/80 backdrop-blur-sm border-2 border-cream-300/50 rounded-3xl p-5 shadow-card">
          <h2 className="flex items-center gap-2 text-lg font-display font-bold text-sleep-900 mb-4">
            <Sparkles className="h-5 w-5 text-dream-glow" />
            Quickstart Templates
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(QUICKSTART_TEMPLATES).map(([key, template]) => (
              <button
                key={key}
                className={`p-3 text-left border-2 rounded-2xl transition-all duration-200 ${selectedTemplate === key
                    ? 'bg-dream-stardust/40 border-dream-glow text-sleep-900'
                    : 'bg-cream-100/60 border-cream-300/60 text-sleep-600 hover:border-dream-glow/30'
                  }`}
                onClick={() => handleTemplateSelect(key)}
              >
                <div className="font-display font-semibold text-sm mb-1">{template.name}</div>
                <div className="text-xs text-sleep-400 leading-relaxed line-clamp-2">
                  {template.concept.substring(0, 70)}…
                </div>
              </button>
            ))}
            <button
              className={`p-3 text-left border-2 rounded-2xl transition-all duration-200 ${selectedTemplate === ''
                  ? 'bg-dream-stardust/40 border-dream-glow text-sleep-900'
                  : 'bg-cream-100/60 border-cream-300/60 text-sleep-600 hover:border-dream-glow/30'
                }`}
              onClick={() => handleTemplateSelect('')}
            >
              <div className="font-display font-semibold text-sm">Custom Story</div>
              <div className="text-xs text-sleep-400 mt-1">Start from scratch</div>
            </button>
          </div>
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
                Characters (up to 6)
              </label>
              <button
                type="button"
                onClick={addCharacter}
                disabled={characters.length >= 6}
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

          {/* Genre & Special Instructions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="genre" className="block text-sm font-display font-semibold text-sleep-600 mb-2">Genre</label>
              <input
                id="genre"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="e.g., Fantasy Adventure"
                className="w-full p-2.5 bg-cream-100/80 border-2 border-cream-300/60 rounded-xl text-sleep-900 placeholder-sleep-400 text-sm font-body focus:border-dream-glow/50 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label htmlFor="instructions" className="block text-sm font-display font-semibold text-sleep-600 mb-2">Special Instructions</label>
              <input
                id="instructions"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Any specific requests"
                className="w-full p-2.5 bg-cream-100/80 border-2 border-cream-300/60 rounded-xl text-sleep-900 placeholder-sleep-400 text-sm font-body focus:border-dream-glow/50 focus:outline-none transition-all"
              />
            </div>
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
