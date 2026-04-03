import { motion } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { useRoutineStore } from '../useRoutineStore';
import PixelRexCharacter from '../rex/PixelRexCharacter';

const characters = [
  { id: 'hoppy',   name: 'Hoppy',   trait: 'Energetic & Bouncy' },
  { id: 'snoozy',  name: 'Snoozy',  trait: 'Cuddly & Calm' },
  { id: 'sparky',  name: 'Sparky',  trait: 'Clever & Playful' },
  { id: 'luna',    name: 'Luna',    trait: 'Peaceful & Gentle' },
  { id: 'zen',     name: 'Zen',     trait: 'Calm & Wise' },
  { id: 'buddy',   name: 'Buddy',   trait: 'Loyal & Friendly' },
  { id: 'rex',     name: 'Rex',     trait: 'Brave & Mighty' },
  { id: 'snapper', name: 'Snapper', trait: 'Tough & Silly' },
  { id: 'finn',    name: 'Finn',    trait: 'Cool & Adventurous' },
  { id: 'masha',   name: 'Masha',   trait: 'Curious & Friendly' },
  { id: 'stella',  name: 'Stella',  trait: 'Tall & Kind' },
  { id: 'flutty',  name: 'Flutty',  trait: 'Gentle & Graceful' },
];

export default function CharacterSelection({ onExit }) {
  const setScreen = useRoutineStore((s) => s.setScreen);
  const setSelectedCharacter = useRoutineStore((s) => s.setSelectedCharacter);
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'center', loop: true });
  const companionCount = characters.length;

  const handleSelect = (charId) => {
    setSelectedCharacter(charId);
    setScreen('picker');
  };

  return (
    <div className="min-h-full px-1 py-2 text-cream-100">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        {onExit && (
          <button
            onClick={onExit}
            className="w-10 h-10 rounded-2xl bg-[#1b120c]/85 border border-white/10 flex items-center justify-center text-cream-200 hover:text-cream-100 hover:bg-[#24170f] transition-colors"
          >
            <span className="text-sm">←</span>
          </button>
        )}
        <div className="w-10 h-10 rounded-2xl bg-dream-glow/15 border border-dream-glow/20 flex items-center justify-center">
          <span className="text-lg">✨</span>
        </div>
        <span className="font-display font-semibold text-cream-100 text-sm tracking-[0.02em]">Task Buddy</span>
      </div>

      {/* Title */}
      <div className="text-center mb-8 px-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#1b120c]/88 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-cream-400/65 font-body shadow-card backdrop-blur-md mb-4">
          <span>Buddy Collection</span>
          <span className="text-cream-200">{companionCount} companions</span>
        </div>
        <h1 className="text-3xl font-display font-bold text-cream-100 mb-2">Choose Your Buddy</h1>
        <p className="text-cream-300/75 text-sm font-body">Swipe to find your perfect friend for tonight's routine.</p>
      </div>

      {/* Carousel with arrows */}
      <div className="relative w-full max-w-sm mx-auto mb-5">
        <div className="absolute inset-8 rounded-full bg-dream-glow/10 blur-3xl pointer-events-none" />
        <div className="relative rounded-[32px] border border-white/10 bg-gradient-to-b from-[#221710]/76 to-[#140e0a]/92 px-3 py-5 shadow-dream backdrop-blur-md overflow-hidden">
          <div className="absolute inset-x-10 top-4 h-16 rounded-full bg-white/[0.04] blur-2xl pointer-events-none" />
        <button
          onClick={() => emblaApi?.scrollPrev()}
          className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-2xl bg-[#1b120c]/92 border border-white/10 shadow-card flex items-center justify-center hover:bg-[#24170f] transition-colors"
        >
          <span className="text-dream-glow font-bold text-lg leading-none">‹</span>
        </button>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {characters.map((char) => (
              <div key={char.id} className="flex-[0_0_100%] min-w-0 px-2">
                <motion.button
                  onClick={() => handleSelect(char.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex flex-col items-center w-full p-6 bg-[#24170f]/84 backdrop-blur-md rounded-[28px] shadow-card border border-white/10 hover:border-dream-glow/25 transition-all"
                >
                  <div className="self-start mb-3 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-cream-400/65 font-body">
                    Tonight's guide
                  </div>
                  <div className="w-48 h-48 mb-4 flex items-center justify-center rounded-[24px] bg-[#1b120c]/70 border border-white/8">
                    <PixelRexCharacter state="celebrating" characterId={char.id} size={180} />
                  </div>
                  <span className="font-display font-semibold text-cream-100 text-2xl mb-1">{char.name}</span>
                  <span className="text-sm text-cream-300/75 text-center font-body">{char.trait}</span>
                  <div className="mt-5 w-full rounded-2xl border border-dream-glow/20 bg-dream-glow/10 px-4 py-3 flex items-center justify-between">
                    <span className="text-xs font-display font-semibold text-dream-glow">Choose {char.name}</span>
                    <span className="text-dream-glow text-sm">→</span>
                  </div>
                </motion.button>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => emblaApi?.scrollNext()}
          className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-2xl bg-[#1b120c]/92 border border-white/10 shadow-card flex items-center justify-center hover:bg-[#24170f] transition-colors"
        >
          <span className="text-dream-glow font-bold text-lg leading-none">›</span>
        </button>
        </div>
      </div>

      <div className="max-w-sm mx-auto rounded-[24px] border border-white/10 bg-[#1b120c]/82 px-4 py-3 shadow-card backdrop-blur-md text-center">
        <p className="text-cream-300/80 text-sm font-body leading-relaxed">Each buddy brings a slightly different energy. Pick the one that feels right tonight.</p>
        <p className="text-cream-400/60 text-xs font-body mt-2">Tap arrows or swipe to browse</p>
      </div>
    </div>
  );
}
