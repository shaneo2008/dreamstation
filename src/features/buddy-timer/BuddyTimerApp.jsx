/**
 * 🐾 BuddyTimerApp — Orchestrator for the buddy timer feature
 * Uses the new useRoutineStore with pixel art characters and routine builder.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { useRoutineStore } from './useRoutineStore';
import CharacterSelection from './pages/CharacterSelection';
import RoutinePicker from './pages/RoutinePicker';
import RoutineSetup from './pages/RoutineSetup';
import ActivePlayer from './pages/ActivePlayer';
import RoutineComplete from './pages/RoutineComplete';

const pageTransition = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
  transition: { duration: 0.3, ease: 'easeOut' },
};

/**
 * @param {Object} props
 * @param {() => void} [props.onExit] — Called when user wants to leave buddy timer
 * @param {() => void} [props.onStoryTime] — Called when routine is complete and user taps "Story Time"
 */
export default function BuddyTimerApp({ onExit, onStoryTime }) {
  const screen = useRoutineStore((s) => s.screen);
  const resetRoutine = useRoutineStore((s) => s.resetRoutine);

  const handleExit = () => {
    resetRoutine();
    onExit?.();
  };

  return (
    <div className="relative min-h-screen max-w-md mx-auto" style={{ background: '#FFF9EE' }}>
      <AnimatePresence mode="wait">
        {screen === 'selection' && (
          <motion.div key="selection" {...pageTransition}>
            <CharacterSelection onExit={onExit ? handleExit : undefined} />
          </motion.div>
        )}
        {screen === 'picker' && (
          <motion.div key="picker" {...pageTransition}>
            <RoutinePicker />
          </motion.div>
        )}
        {screen === 'setup' && (
          <motion.div key="setup" {...pageTransition}>
            <RoutineSetup />
          </motion.div>
        )}
        {screen === 'player' && (
          <motion.div key="player" {...pageTransition}>
            <ActivePlayer />
          </motion.div>
        )}
        {screen === 'complete' && (
          <motion.div key="complete" {...pageTransition}>
            <RoutineComplete onStoryTime={onStoryTime} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
