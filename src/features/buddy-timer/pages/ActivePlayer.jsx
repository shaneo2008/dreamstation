import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PixelRexCharacter from '../rex/PixelRexCharacter';
import ProgressRing from '../rex/ProgressRing';
import TaskItemSVG from '../rex/TaskItemSVG';
import ParticleBurst from '../rex/ParticleBurst';
import { useRoutineStore } from '../useRoutineStore';

export default function ActivePlayer() {
  const {
    tasks, currentTaskIndex, timeLeft, totalTime, rexState,
    feedRex, doneEarly, onEatComplete, skipTask,
    pauseRoutine, resumeRoutine, isRunning, selectedCharacter,
  } = useRoutineStore();

  const currentTask = tasks[currentTaskIndex];
  const isHungry = rexState === 'hungry';
  const isBored = rexState === 'bored';
  const isIdle = rexState === 'idle';
  const isWaiting = isIdle || isBored;

  const characterName = selectedCharacter
    ? selectedCharacter.charAt(0).toUpperCase() + selectedCharacter.slice(1)
    : 'Rex';

  const [eatPhase, setEatPhase] = useState('none');
  const [isItemFlying, setIsItemFlying] = useState(false);
  const [isItemHidden, setIsItemHidden] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [isEatingSequence, setIsEatingSequence] = useState(false);
  const [postChompCelebrating, setPostChompCelebrating] = useState(false);
  const timeoutsRef = useRef([]);

  useEffect(() => {
    return () => { timeoutsRef.current.forEach(clearTimeout); };
  }, []);

  useEffect(() => {
    setEatPhase('none');
    setIsItemFlying(false);
    setIsItemHidden(false);
    setShowParticles(false);
    setIsEatingSequence(false);
    setPostChompCelebrating(false);
  }, [currentTaskIndex]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const startEatingSequence = useCallback(() => {
    let wasAlreadyRunning = false;
    setIsEatingSequence((prev) => { wasAlreadyRunning = prev; return true; });
    if (wasAlreadyRunning) return;

    feedRex();
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    setIsItemFlying(true);
    timeoutsRef.current.push(setTimeout(() => setEatPhase('jaw-open'), 400));
    timeoutsRef.current.push(setTimeout(() => {
      setIsItemHidden(true);
      setEatPhase('chomp');
      setShowParticles(true);
    }, 600));
    timeoutsRef.current.push(setTimeout(() => {
      setShowParticles(false);
      setPostChompCelebrating(true);
    }, 1200));
    timeoutsRef.current.push(setTimeout(() => {
      setEatPhase('none');
      setIsItemFlying(false);
      setIsItemHidden(false);
      setIsEatingSequence(false);
      setPostChompCelebrating(false);
      onEatComplete();
    }, 3000));
  }, [feedRex, onEatComplete]);

  const handleFeed = useCallback(() => {
    if (!isHungry || isEatingSequence) return;
    startEatingSequence();
  }, [isHungry, isEatingSequence, startEatingSequence]);

  const handleDoneEarly = useCallback(() => {
    if (!isWaiting || isEatingSequence) return;
    doneEarly();
  }, [isWaiting, isEatingSequence, doneEarly]);

  const instructionText = `${currentTask?.title || ''}! ${characterName} is waiting...`;

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pt-3 pb-4 relative overflow-x-hidden">
      {/* Task Progress Dots */}
      <div className="flex gap-2 mb-2 z-10">
        {tasks.map((task, i) => (
          <motion.div
            key={task.id}
            className="w-3 h-3 rounded-full"
            style={{ background: i < currentTaskIndex ? '#7BC74D' : i === currentTaskIndex ? currentTask?.themeColor || '#7BC74D' : 'rgba(232, 220, 200, 0.4)' }}
            animate={i === currentTaskIndex ? { scale: [1, 1.3, 1], transition: { duration: 1.5, repeat: Infinity } } : {}}
          />
        ))}
      </div>

      {/* Task Counter */}
      <motion.p
        className="text-sm font-semibold text-muted-foreground mb-1 z-10"
        key={currentTaskIndex}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Task {currentTaskIndex + 1} of {tasks.length}
      </motion.p>

      {/* Task Title */}
      <AnimatePresence mode="wait">
        <motion.h2
          key={currentTask?.id}
          className="font-display text-xl font-bold text-center mb-2 z-10 w-full px-6 leading-tight"
          style={{ color: currentTask?.themeColor }}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {currentTask?.title}
        </motion.h2>
      </AnimatePresence>

      {/* Progress Ring with character inside */}
      <div className="relative z-10 mb-4">
        {/* Floating task item */}
        <div className="absolute -top-2 -right-4 z-20">
          <AnimatePresence mode="wait">
            {!isItemHidden && (
              <motion.div
                key={currentTask?.id}
                initial={{ opacity: 0, scale: 0, rotate: -20 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.4, type: 'spring' }}
              >
                <TaskItemSVG
                  itemId={currentTask?.id || ''}
                  isFlying={isItemFlying}
                  isHidden={isItemHidden}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Particle Burst */}
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <ParticleBurst active={showParticles} themeColor={currentTask?.themeColor} />
        </div>

        {/* Speech bubble */}
        <AnimatePresence>
          {isHungry && !isEatingSequence && (
            <motion.div
              className="absolute -top-10 left-1/2 -translate-x-1/2 glass-card px-4 py-2 text-center z-20"
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.8 }}
            >
              <p className="font-display text-sm font-semibold text-foreground whitespace-nowrap">Feed me!</p>
            </motion.div>
          )}
        </AnimatePresence>

        <ProgressRing
          timeLeft={timeLeft}
          totalTime={totalTime}
          themeColor={currentTask?.themeColor || '#7BC74D'}
          size={200}
          strokeWidth={10}
        >
          <PixelRexCharacter
            state={postChompCelebrating ? 'celebrating' : rexState}
            eatPhase={eatPhase}
            themeColor={currentTask?.themeColor}
            size={140}
            characterId={selectedCharacter}
          />
        </ProgressRing>
      </div>

      {/* Feed Button (when hungry) */}
      <AnimatePresence>
        {isHungry && !isEatingSequence && (
          <motion.button
            className="btn-coral w-full max-w-xs text-xl z-10"
            onClick={handleFeed}
            initial={{ opacity: 0, y: 30, scale: 0.8 }}
            animate={{
              opacity: 1, y: 0, scale: 1,
              boxShadow: ['0 4px 14px rgba(255, 107, 107, 0.35)', '0 4px 30px rgba(255, 107, 107, 0.6)', '0 4px 14px rgba(255, 107, 107, 0.35)'],
            }}
            exit={{ opacity: 0, y: 30, scale: 0.8 }}
            transition={{ boxShadow: { duration: 1.5, repeat: Infinity }, default: { duration: 0.3, type: 'spring' } }}
            whileTap={{ scale: 0.92 }}
          >
            Feed {characterName}! {currentTask?.itemEmoji}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Done Early Button */}
      <AnimatePresence>
        {isWaiting && isRunning && !isEatingSequence && (
          <motion.div
            className="flex flex-col items-center gap-2 z-10 w-full max-w-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.p className="text-center text-muted-foreground font-semibold text-sm max-w-xs">
              {instructionText}
            </motion.p>
            <motion.button
              className="btn-done-early w-full text-lg"
              onClick={handleDoneEarly}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
            >
              I did it! 🎉 Feed {characterName}!
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Paused instruction */}
      {isWaiting && !isRunning && !isEatingSequence && (
        <motion.p
          className="text-center text-muted-foreground font-semibold text-sm z-10 max-w-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {instructionText}
        </motion.p>
      )}

      {/* Bottom Controls */}
      <div className="mt-auto flex gap-3 z-10 w-full max-w-xs pt-4">
        {!isEatingSequence && isWaiting && (
          <button
            onClick={isRunning ? pauseRoutine : resumeRoutine}
            className="flex-1 glass-card py-3 font-display font-semibold text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isRunning ? 'Pause' : 'Resume'}
          </button>
        )}
        {!isEatingSequence && (
          <button
            onClick={skipTask}
            className="flex-1 glass-card py-3 font-display font-semibold text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
}
