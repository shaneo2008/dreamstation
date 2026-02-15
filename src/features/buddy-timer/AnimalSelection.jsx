/**
 * 🐾 AnimalSelection — Choose your bedtime buddy
 * 12-animal grid with tap to select, Finch-style cards
 * Mobile-optimised: 2-col grid on small phones, 3-col on larger screens
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Sparkles } from 'lucide-react';
import { ANIMALS } from './animals';
import useBuddyTimer from './useBuddyTimer';

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.06,
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  }),
};

export default function AnimalSelection() {
  const [selected, setSelected] = useState(null);
  const selectAnimal = useBuddyTimer((s) => s.selectAnimal);

  const handleContinue = () => {
    if (selected) {
      selectAnimal(selected);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 px-3 sm:px-4 py-5 sm:py-6 flex flex-col">
      {/* Header */}
      <motion.div
        className="text-center mb-4 sm:mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full border border-cream-300/50 mb-2 sm:mb-3">
          <Sparkles className="w-4 h-4 text-dream-glow" />
          <span className="text-sm font-semibold text-sleep-700 font-display">Bedtime Buddy</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-display font-bold text-sleep-900 mb-1">
          Choose Your Buddy
        </h1>
        <p className="text-sleep-600 text-sm">
          Pick a friend to help with your bedtime routine!
        </p>
      </motion.div>

      {/* Animal Grid — 2 cols on phone, 3 cols on larger screens */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-6 flex-1">
        {ANIMALS.map((animal, i) => (
          <motion.button
            key={animal.id}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelected(animal)}
            className={`
              relative flex flex-col items-center justify-center
              p-3 sm:p-3 rounded-3xl
              transition-all duration-300 cursor-pointer
              min-h-[120px] sm:min-h-0
              ${selected?.id === animal.id
                ? 'bg-white border-3 border-dream-glow shadow-lg scale-[1.02]'
                : 'bg-white/80 border-2 border-cream-300/50 hover:border-cream-400 active:bg-white'
              }
            `}
          >
            {/* Selection indicator */}
            <AnimatePresence>
              {selected?.id === animal.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1.5 -right-1.5 w-7 h-7 bg-dream-glow rounded-full flex items-center justify-center shadow-md z-10"
                >
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Animal image — bigger touch target on mobile */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 mb-1.5 sm:mb-2 flex items-center justify-center">
              <img
                src={animal.image}
                alt={animal.name}
                className="w-full h-full object-contain drop-shadow-sm"
                loading="lazy"
              />
            </div>

            {/* Name — larger on mobile for readability */}
            <span className="text-sm sm:text-sm font-display font-bold text-sleep-900 leading-tight">
              {animal.name}
            </span>

            {/* Trait — hidden on very small screens to avoid crowding */}
            <span className="text-[10px] sm:text-[11px] text-sleep-500 text-center leading-tight mt-0.5 line-clamp-1">
              {animal.trait}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Continue Button — sticky on mobile for easy reach */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="px-1 sm:px-2 sticky bottom-4 sm:static"
      >
        <button
          onClick={handleContinue}
          disabled={!selected}
          className={`
            w-full py-4 rounded-2xl font-display font-bold text-base sm:text-lg
            flex items-center justify-center gap-2
            transition-all duration-300
            ${selected
              ? 'bg-dream-glow text-white shadow-glow-sm hover:bg-dream-aurora active:scale-[0.98]'
              : 'bg-cream-300/50 text-sleep-400 cursor-not-allowed'
            }
          `}
        >
          {selected ? (
            <>
              <span className="truncate">Start with {selected.name}</span>
              <ChevronRight className="w-5 h-5 shrink-0" />
            </>
          ) : (
            'Pick a buddy to start!'
          )}
        </button>
      </motion.div>
    </div>
  );
}
