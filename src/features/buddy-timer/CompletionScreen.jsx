/**
 * 🌟 CompletionScreen — All tasks done! Creature fully fed.
 * Shows celebration, all tasks completed, and story-ready CTA
 * Mobile-optimised: bigger buttons, responsive sizing
 */

import { motion } from 'framer-motion';
import { Star, Moon, RotateCcw } from 'lucide-react';
import useBuddyTimer from './useBuddyTimer';
import { TASKS } from './tasks';

const stars = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  x: Math.random() * 300 - 150,
  y: Math.random() * 300 - 150,
  delay: Math.random() * 1,
  size: 12 + Math.random() * 16,
  rotation: Math.random() * 360,
}));

export default function CompletionScreen({ onStoryTime, onReset }) {
  const { selectedAnimal, reset } = useBuddyTimer();

  const handleReset = () => {
    reset();
    onReset?.();
  };

  if (!selectedAnimal) return null;

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Floating stars */}
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute text-pastel-yellow"
          initial={{ opacity: 0, scale: 0, rotate: 0 }}
          animate={{
            opacity: [0, 1, 0.8],
            scale: [0, 1, 0.8],
            rotate: star.rotation,
          }}
          transition={{
            duration: 1.5,
            delay: star.delay,
            ease: 'easeOut',
          }}
          style={{
            left: `calc(50% + ${star.x}px)`,
            top: `calc(40% + ${star.y}px)`,
          }}
        >
          <Star
            className="fill-current"
            style={{ width: star.size, height: star.size }}
          />
        </motion.div>
      ))}

      {/* Animal celebration — responsive size */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="relative mb-5 sm:mb-6 z-10"
      >
        <motion.img
          src={selectedAnimal.image}
          alt={selectedAnimal.name}
          className="w-36 h-36 sm:w-44 sm:h-44 object-contain drop-shadow-lg"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Happy bubble */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
          className="absolute -top-2 -right-2 bg-white rounded-2xl px-3 py-1.5 shadow-md border border-cream-300/50"
        >
          <span className="text-lg">😊</span>
        </motion.div>
      </motion.div>

      {/* Completion text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center z-10 mb-5 sm:mb-6 px-2"
      >
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-sleep-900 mb-2">
          All Done!
        </h2>
        <p className="text-sleep-600 text-sm mb-4">
          {selectedAnimal.name} is so happy and full! Time for a story!
        </p>

        {/* Completed tasks — wrap nicely on mobile */}
        <div className="flex flex-wrap justify-center gap-2 mb-5 sm:mb-6">
          {TASKS.map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.15 }}
              className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-3 py-2 sm:py-1.5 rounded-full border border-success/30"
            >
              <div className="w-4 h-4 bg-success rounded-full flex items-center justify-center shrink-0">
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-sleep-700">{task.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Action buttons — comfortable touch targets */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="w-full max-w-sm space-y-3 z-10 px-2"
      >
        <button
          onClick={onStoryTime}
          className="w-full py-4 sm:py-4 rounded-2xl font-display font-bold text-base sm:text-lg
            bg-dream-glow text-white shadow-glow
            hover:bg-dream-aurora active:scale-[0.98] transition-all
            flex items-center justify-center gap-2"
        >
          <Moon className="w-5 h-5 shrink-0" />
          Story Time!
        </button>

        <button
          onClick={handleReset}
          className="w-full py-4 sm:py-3 rounded-2xl font-display font-semibold text-sm
            bg-white/80 text-sleep-600 border-2 border-cream-300
            hover:border-cream-400 active:scale-[0.98] transition-all
            flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4 shrink-0" />
          Start Over
        </button>
      </motion.div>
    </div>
  );
}
