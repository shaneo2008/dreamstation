/**
 * 🎉 CelebrationScreen — Post-task celebration with animal feeding
 * Shows bouncing animal, hearts, and "Yummy!" animation
 * Mobile-optimised: bigger animal, larger tap target
 */

import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import useBuddyTimer from './useBuddyTimer';
import { TASKS } from './tasks';

const hearts = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  x: Math.random() * 200 - 100,
  delay: Math.random() * 0.5,
  size: 16 + Math.random() * 12,
}));

export default function CelebrationScreen() {
  const { selectedAnimal, currentTaskIndex, completedTasks, nextTask } = useBuddyTimer();
  const justCompleted = TASKS[currentTaskIndex];

  if (!selectedAnimal || !justCompleted) return null;

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Floating hearts */}
      {hearts.map((heart) => (
        <motion.div
          key={heart.id}
          className="absolute text-pastel-pink"
          initial={{ opacity: 0, y: 50, x: heart.x, scale: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: [50, -150],
            scale: [0, 1, 1, 0.5],
          }}
          transition={{
            duration: 2,
            delay: heart.delay,
            ease: 'easeOut',
          }}
          style={{ left: '50%' }}
        >
          <Heart className="fill-current" style={{ width: heart.size, height: heart.size }} />
        </motion.div>
      ))}

      {/* Animal bouncing — bigger on mobile */}
      <motion.div
        className="relative mb-5 sm:mb-6"
        animate={{
          y: [0, -30, 0, -15, 0],
          rotate: [0, -5, 5, -3, 0],
        }}
        transition={{
          duration: 1.2,
          ease: 'easeInOut',
        }}
      >
        <img
          src={selectedAnimal.image}
          alt={selectedAnimal.name}
          className="w-36 h-36 sm:w-40 sm:h-40 object-contain drop-shadow-lg"
        />
        {/* Yummy bubble */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
          className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 bg-white rounded-2xl px-3 py-1.5 shadow-md border border-cream-300/50"
        >
          <span className="text-sm font-display font-bold text-dream-glow">Yummy!</span>
        </motion.div>
      </motion.div>

      {/* Celebration text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center px-2"
      >
        <h2 className="text-xl sm:text-2xl font-display font-bold text-sleep-900 mb-2">
          {justCompleted.encouragement}
        </h2>
        <p className="text-sleep-600 text-sm mb-4">
          {selectedAnimal.name} loved that treat! {selectedAnimal.emoji}
        </p>

        {/* Progress indicator — bigger dots on mobile */}
        <div className="flex items-center justify-center gap-2.5 sm:gap-2">
          {TASKS.map((t) => (
            <motion.div
              key={t.id}
              className={`w-4 h-4 sm:w-3 sm:h-3 rounded-full ${completedTasks.includes(t.id)
                  ? 'bg-success'
                  : 'bg-cream-300'
                }`}
              animate={
                completedTasks.includes(t.id) && t.id === justCompleted.id
                  ? { scale: [1, 1.5, 1] }
                  : {}
              }
              transition={{ duration: 0.4 }}
            />
          ))}
        </div>
      </motion.div>

      {/* Next task button — must be tapped to continue */}
      <motion.button
        onClick={nextTask}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, type: 'spring', stiffness: 200 }}
        className="mt-8 px-8 py-4 sm:py-3 bg-dream-glow text-white rounded-2xl font-display font-bold text-base shadow-glow-sm hover:bg-dream-aurora active:scale-[0.97] transition-all"
      >
        Next Task →
      </motion.button>
    </div>
  );
}
