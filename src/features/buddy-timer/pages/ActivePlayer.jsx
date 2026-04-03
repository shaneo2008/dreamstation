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
    pauseRoutine, resumeRoutine, isRunning, selectedCharacter, routineName,
  } = useRoutineStore();

  const currentTask = tasks[currentTaskIndex];
  const isHungry = rexState === 'hungry';
  const isBored = rexState === 'bored';
  const isIdle = rexState === 'idle';
  const isWaiting = isIdle || isBored;

  const characterName = selectedCharacter
    ? selectedCharacter.charAt(0).toUpperCase() + selectedCharacter.slice(1)
    : 'Rex';
  const tasksRemaining = Math.max(tasks.length - currentTaskIndex - 1, 0);
  const taskDurationLabel = currentTask?.durationMinutes ? `${currentTask.durationMinutes} min focus` : 'Quick step';
  const rewardLabel = currentTask?.itemLabel || 'treat';

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
  const statusTitle = isEatingSequence
    ? `${characterName} is enjoying the ${rewardLabel.toLowerCase()}`
    : isHungry
      ? `Time to reward ${characterName}`
      : isRunning
        ? `${characterName} is waiting with you`
        : `${characterName} is paused with you`;
  const statusDescription = isEatingSequence
    ? 'Nice work. A little celebration now, then the next step will begin.'
    : isHungry
      ? `Tap below to feed ${characterName} and unlock the next task.`
      : isRunning
        ? 'Finish the task any time, then tap the green button when you are ready.'
        : 'Take a breath. Resume whenever you want to keep the routine moving.';

  return (
    <div className="h-full flex flex-col items-center px-4 pt-2 pb-4 relative overflow-x-hidden text-cream-100">
      <div className="w-full max-w-sm flex-1 flex flex-col">
        <div className="flex justify-center mb-4 z-10">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-[#1b120c]/88 px-4 py-2 shadow-card backdrop-blur-md">
            <div className="flex gap-2">
              {tasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: i < currentTaskIndex ? '#7BC74D' : i === currentTaskIndex ? currentTask?.themeColor || '#7BC74D' : 'rgba(255, 249, 238, 0.14)' }}
                  animate={i === currentTaskIndex ? { scale: [1, 1.28, 1], transition: { duration: 1.5, repeat: Infinity } } : {}}
                />
              ))}
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="text-[11px] uppercase tracking-[0.18em] text-cream-400/65 font-body">{routineName}</div>
            <div className="text-xs font-display font-semibold text-cream-200">Task {currentTaskIndex + 1} of {tasks.length}</div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentTask?.id}
            className="text-center mb-4 z-10"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.96 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-body text-cream-300/75 mb-3">
              <span>{currentTask?.itemEmoji}</span>
              <span>{taskDurationLabel}</span>
              {tasksRemaining > 0 ? <span>· {tasksRemaining} left after this</span> : <span>· final step</span>}
            </div>
            <h2
              className="font-display text-[2rem] font-bold text-center mb-2 leading-tight"
              style={{ color: currentTask?.themeColor }}
            >
              {currentTask?.title}
            </h2>
            <p className="text-sm font-body text-cream-300/80 leading-relaxed px-5">
              {isEatingSequence ? `A little reward moment for ${characterName}, then we’ll gently move on.` : instructionText}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="relative z-10 mb-5 flex justify-center">
          <div className="absolute inset-8 rounded-full bg-dream-glow/10 blur-3xl pointer-events-none" />
          <div className="relative w-full rounded-[32px] border border-white/10 bg-gradient-to-b from-[#221710]/78 to-[#140e0a]/90 px-6 py-6 shadow-dream backdrop-blur-md flex items-center justify-center overflow-hidden">
            <div className="absolute inset-x-10 top-5 h-16 rounded-full bg-white/[0.04] blur-2xl pointer-events-none" />

            <div className="absolute top-4 left-4 rounded-full border border-white/10 bg-[#1b120c]/92 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-cream-400/65 font-body">
              {isHungry ? 'Reward time' : isEatingSequence ? 'Celebrating' : isRunning ? 'In progress' : 'Paused'}
            </div>

            <div className="absolute top-4 right-4 z-20 min-w-[68px] rounded-2xl border border-white/10 bg-[#1b120c]/94 px-3 py-2 text-center shadow-card">
              <div className="text-[10px] uppercase tracking-[0.14em] text-cream-400/55 font-body mb-0.5">Next treat</div>
              <AnimatePresence mode="wait">
                {!isItemHidden && (
                  <motion.div
                    key={currentTask?.id}
                    initial={{ opacity: 0, scale: 0.75, rotate: -16 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.35, type: 'spring' }}
                    className="flex justify-center"
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

            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <ParticleBurst active={showParticles} themeColor={currentTask?.themeColor} />
            </div>

            <AnimatePresence>
              {isHungry && !isEatingSequence && (
                <motion.div
                  className="absolute top-16 left-1/2 -translate-x-1/2 bg-[#1b120c]/94 border border-white/10 rounded-2xl px-4 py-2 text-center z-20 shadow-card"
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.8 }}
                >
                  <p className="font-display text-sm font-semibold text-cream-100 whitespace-nowrap">Feed me!</p>
                </motion.div>
              )}
            </AnimatePresence>

            <ProgressRing
              timeLeft={timeLeft}
              totalTime={totalTime}
              themeColor={currentTask?.themeColor || '#7BC74D'}
              size={214}
              strokeWidth={11}
            >
              <PixelRexCharacter
                state={postChompCelebrating ? 'celebrating' : rexState}
                eatPhase={eatPhase}
                themeColor={currentTask?.themeColor}
                size={146}
                characterId={selectedCharacter}
              />
            </ProgressRing>
          </div>
        </div>

        <motion.div
          key={`${currentTask?.id}-${rexState}-${isRunning}`}
          className="z-10 rounded-[28px] border border-white/10 bg-[#1b120c]/88 p-4 shadow-card backdrop-blur-md mb-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="flex items-start gap-3">
            <div
              className="h-11 w-11 rounded-2xl flex items-center justify-center text-xl border"
              style={{ backgroundColor: `${currentTask?.themeColor || '#E8956A'}20`, borderColor: `${currentTask?.themeColor || '#E8956A'}40` }}
            >
              <span>{currentTask?.itemEmoji}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] uppercase tracking-[0.16em] text-cream-400/55 font-body mb-1">Current moment</div>
              <h3 className="font-display font-semibold text-cream-100 text-base leading-snug">{statusTitle}</h3>
              <p className="text-sm font-body text-cream-300/75 leading-relaxed mt-1">{statusDescription}</p>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {isHungry && !isEatingSequence && (
            <motion.button
              className="btn-coral w-full text-xl z-10 mb-4"
              onClick={handleFeed}
              initial={{ opacity: 0, y: 30, scale: 0.8 }}
              animate={{
                opacity: 1, y: 0, scale: 1,
                boxShadow: ['0 6px 18px rgba(212, 118, 78, 0.28)', '0 10px 32px rgba(212, 118, 78, 0.42)', '0 6px 18px rgba(212, 118, 78, 0.28)'],
              }}
              exit={{ opacity: 0, y: 30, scale: 0.8 }}
              transition={{ boxShadow: { duration: 1.8, repeat: Infinity }, default: { duration: 0.3, type: 'spring' } }}
              whileTap={{ scale: 0.92 }}
            >
              Feed {characterName}! {currentTask?.itemEmoji}
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isWaiting && isRunning && !isEatingSequence && (
            <motion.button
              className="btn-done-early w-full text-lg z-10 mb-4"
              onClick={handleDoneEarly}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
            >
              I did it! 🎉 Feed {characterName}!
            </motion.button>
          )}
        </AnimatePresence>

        {!isEatingSequence && (
          <div className="mt-auto z-10 rounded-[28px] border border-white/10 bg-[#1b120c]/82 p-3 shadow-card backdrop-blur-md">
            <div className="grid grid-cols-2 gap-3">
              {isWaiting && (
                <button
                  onClick={isRunning ? pauseRoutine : resumeRoutine}
                  className="bg-[#24170f]/92 border border-white/10 rounded-2xl py-3 font-display font-semibold text-sm text-cream-200 hover:text-cream-100 hover:bg-[#2c1d13] transition-colors"
                >
                  {isRunning ? 'Pause' : 'Resume'}
                </button>
              )}
              <button
                onClick={skipTask}
                className={`${!isWaiting ? 'col-span-2' : ''} bg-[#24170f]/92 border border-white/10 rounded-2xl py-3 font-display font-semibold text-sm text-cream-200 hover:text-cream-100 hover:bg-[#2c1d13] transition-colors`}
              >
                Skip
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
