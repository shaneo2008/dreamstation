/**
 * 🐾 BuddyTimerApp — Main orchestrator for the standalone buddy timer
 *
 * Renders the correct screen based on useBuddyTimer store state.
 * Fully independent of useSleepFlow — can run standalone.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import useBuddyTimer from './useBuddyTimer';
import AnimalSelection from './AnimalSelection';
import TaskScreen from './TaskScreen';
import CelebrationScreen from './CelebrationScreen';
import CompletionScreen from './CompletionScreen';

const pageTransition = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
  transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
};

/**
 * @param {Object} props
 * @param {() => void} [props.onExit] — Called when user wants to leave buddy timer
 * @param {() => void} [props.onStoryTime] — Called when routine is complete and user taps "Story Time"
 */
export default function BuddyTimerApp({ onExit, onStoryTime }) {
  const phase = useBuddyTimer((s) => s.phase);
  const reset = useBuddyTimer((s) => s.reset);

  const handleExit = () => {
    reset();
    onExit?.();
  };

  const handleStoryTime = () => {
    onStoryTime?.();
  };

  const handleReset = () => {
    // Already handled by CompletionScreen calling reset()
  };

  return (
    <div className="relative min-h-screen bg-cream-100">
      {/* Back button (only on selection screen) */}
      {phase === 'selecting' && onExit && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handleExit}
          className="absolute top-4 left-4 z-50 flex items-center gap-1.5
            bg-white/80 backdrop-blur-sm px-3 py-2 rounded-xl
            border border-cream-300/50 text-sleep-600
            hover:text-sleep-900 hover:border-cream-400
            transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-semibold font-display">Back</span>
        </motion.button>
      )}

      {/* Phase screens */}
      <AnimatePresence mode="wait">
        {phase === 'selecting' && (
          <motion.div key="selecting" {...pageTransition}>
            <AnimalSelection />
          </motion.div>
        )}

        {phase === 'task' && (
          <motion.div key="task" {...pageTransition}>
            <TaskScreen />
          </motion.div>
        )}

        {phase === 'celebrating' && (
          <motion.div key="celebrating" {...pageTransition}>
            <CelebrationScreen />
          </motion.div>
        )}

        {phase === 'complete' && (
          <motion.div key="complete" {...pageTransition}>
            <CompletionScreen
              onStoryTime={handleStoryTime}
              onReset={handleReset}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
