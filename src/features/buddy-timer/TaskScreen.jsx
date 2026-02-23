/**
 * 🕐 TaskScreen — Timer + task display with animal buddy
 * Shows circular countdown, task illustration, and animal encouragement
 * Mobile-optimised: responsive sizing, comfortable touch targets
 */

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { SkipForward, CheckCircle } from 'lucide-react';
import useBuddyTimer from './useBuddyTimer';
import { TASKS } from './tasks';

export default function TaskScreen() {
  const {
    selectedAnimal,
    currentTaskIndex,
    timeLeft,
    completedTasks,
    startTimer,
    stopTimer,
    completeCurrentTask,
    skipTask,
  } = useBuddyTimer();

  const task = TASKS[currentTaskIndex];
  const started = useRef(false);

  // Start timer on mount / task change
  useEffect(() => {
    started.current = false;
    const timeout = setTimeout(() => {
      startTimer();
      started.current = true;
    }, 300);
    return () => {
      clearTimeout(timeout);
      stopTimer();
    };
  }, [currentTaskIndex, startTimer, stopTimer]);

  if (!task || !selectedAnimal) return null;

  const progress = 1 - timeLeft / task.duration;
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference * (1 - progress);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="min-h-screen bg-cream-100 px-4 py-5 sm:py-6 flex flex-col">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
        {TASKS.map((t, i) => (
          <div
            key={t.id}
            className={`h-2.5 sm:h-2 rounded-full transition-all duration-500 ${completedTasks.includes(t.id)
              ? 'w-8 bg-success'
              : i === currentTaskIndex
                ? 'w-8 bg-dream-glow'
                : 'w-2.5 sm:w-2 bg-cream-300'
              }`}
          />
        ))}
      </div>

      {/* Task header */}
      <motion.div
        key={task.id}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-3 sm:mb-4"
      >
        <h2 className="text-xl sm:text-2xl font-display font-bold text-sleep-900">
          {task.label}
        </h2>
        <p className="text-sleep-600 text-sm mt-1">{task.description}</p>
      </motion.div>

      {/* Timer circle — responsive size */}
      <motion.div
        key={`timer-${task.id}`}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="flex-1 flex flex-col items-center justify-center"
      >
        <div className="relative w-40 h-40 sm:w-48 sm:h-48 mb-5 sm:mb-6">
          {/* Background circle */}
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke="#E8D5BC"
              strokeWidth="8"
              opacity="0.4"
            />
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke={task.color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          {/* Center content — task icon only, no timer text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {task.image ? (
              <img
                src={task.image}
                alt={task.label}
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
              />
            ) : (
              <span className="text-4xl sm:text-5xl">{task.emoji}</span>
            )}
          </div>
        </div>

        {/* Animal buddy encouragement — bigger on mobile */}
        <motion.div
          className="flex flex-col items-center gap-2 sm:gap-3"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <img
            src={selectedAnimal.image}
            alt={selectedAnimal.name}
            className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-md"
          />
          <div className="bg-white/80 backdrop-blur-sm px-4 py-2.5 rounded-2xl border border-cream-300/50 shadow-sm max-w-[280px]">
            <p className="text-sm font-semibold text-sleep-800 text-center leading-snug">
              {timeLeft > 30
                ? `${selectedAnimal.name} is cheering you on!`
                : timeLeft > 10
                  ? `Almost done! ${selectedAnimal.name} is so proud!`
                  : `${selectedAnimal.name} is hungry... finish up!`}
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Action buttons — comfortable 48px+ touch targets */}
      <div className="flex gap-3 px-1 sm:px-2 mt-4 sticky bottom-4 sm:static">
        <button
          onClick={skipTask}
          className="flex-1 py-4 sm:py-3 rounded-2xl font-display font-semibold text-sm
            bg-white/80 text-sleep-600 border-2 border-cream-300
            hover:border-cream-400 active:scale-[0.98] transition-all
            flex items-center justify-center gap-2"
        >
          <SkipForward className="w-4 h-4 shrink-0" />
          Skip
        </button>
        <button
          onClick={completeCurrentTask}
          className={`flex-[2] py-4 sm:py-3 rounded-2xl font-display font-bold text-sm
            bg-dream-glow text-white shadow-glow-sm
            hover:bg-dream-aurora active:scale-[0.98] transition-all
            flex items-center justify-center gap-1.5
            ${timeLeft === 0 ? 'animate-pulse' : ''}`}
        >
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span className="truncate">Done! Feed {selectedAnimal.name}!</span>
          <span className="shrink-0">{selectedAnimal.emoji}</span>
        </button>
      </div>
    </div>
  );
}
