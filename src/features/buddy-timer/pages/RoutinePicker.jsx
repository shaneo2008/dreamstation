import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoutineStore } from '../useRoutineStore';

const ROUTINES = [
  { type: 'bedtime',  emoji: '🌙', label: 'Bedtime',  description: 'Wind down & get ready for sleep', color: '#A593F7', tint: 'rgba(165, 147, 247, 0.12)' },
  { type: 'morning',  emoji: '🌅', label: 'Morning',  description: 'Start the day the right way',     color: '#E8A26B', tint: 'rgba(232, 162, 107, 0.12)' },
  { type: 'homework', emoji: '📚', label: 'Homework', description: 'Focus up & get it done',          color: '#6FB9D8', tint: 'rgba(111, 185, 216, 0.12)' },
  { type: 'custom',   emoji: '✏️', label: 'Custom',   description: 'Create your own routine',          color: '#7FC56A', tint: 'rgba(127, 197, 106, 0.12)' },
];

export default function RoutinePicker() {
  const { setRoutine, setScreen } = useRoutineStore();
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState('');
  const routineCount = ROUTINES.length;

  const handleSelect = (type) => {
    if (type === 'custom') {
      setShowCustomInput(true);
    } else {
      setRoutine(type);
    }
  };

  const handleCustomConfirm = () => {
    setRoutine('custom', customName.trim() || 'My Routine');
  };

  return (
    <div className="min-h-full px-1 py-2 text-cream-100">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setScreen('selection')}
          className="w-10 h-10 rounded-2xl bg-[#1b120c]/85 border border-white/10 flex items-center justify-center text-cream-200 hover:text-cream-100 hover:bg-[#24170f] transition-colors"
        >
          <span className="text-sm">←</span>
        </button>
        <div className="w-10 h-10 rounded-2xl bg-dream-glow/15 border border-dream-glow/20 flex items-center justify-center">
          <span className="text-lg">✨</span>
        </div>
        <span className="font-display font-semibold text-cream-100 text-sm tracking-[0.02em]">Task Buddy</span>
      </div>

      {/* Title */}
      <div className="text-center mb-8 px-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#1b120c]/88 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-cream-400/65 font-body shadow-card backdrop-blur-md mb-4">
          <span>Routine Menu</span>
          <span className="text-cream-200">{routineCount} paths</span>
        </div>
        <h1 className="text-3xl font-display font-bold text-cream-100 mb-2">Choose a Routine</h1>
        <p className="text-cream-300/75 text-sm font-body">What are we doing today?</p>
      </div>

      {/* Routine Tiles */}
      <div className="relative max-w-sm mx-auto mb-5">
        <div className="absolute inset-8 rounded-full bg-dream-glow/10 blur-3xl pointer-events-none" />
        <div className="relative rounded-[32px] border border-white/10 bg-gradient-to-b from-[#221710]/76 to-[#140e0a]/92 px-4 py-5 shadow-dream backdrop-blur-md overflow-hidden">
          <div className="absolute inset-x-10 top-4 h-16 rounded-full bg-white/[0.04] blur-2xl pointer-events-none" />
          <div className="grid grid-cols-2 gap-4">
        {ROUTINES.map((routine, i) => (
          <motion.button
            key={routine.type}
            onClick={() => handleSelect(routine.type)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="flex flex-col items-center p-5 rounded-[28px] shadow-card border transition-all min-h-[170px] justify-center"
            style={{ backgroundColor: routine.tint, borderColor: `${routine.color}40`, boxShadow: `0 14px 30px -24px ${routine.color}55` }}
          >
            <div className="mb-2 text-[10px] uppercase tracking-[0.14em] text-cream-400/55 font-body">Guided flow</div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 border border-white/10 bg-[#1b120c]/55 text-3xl">
              <span>{routine.emoji}</span>
            </div>
            <span className="font-display font-semibold text-cream-100 text-xl mb-1">{routine.label}</span>
            <span className="text-sm text-cream-300/75 text-center leading-tight font-body">{routine.description}</span>
          </motion.button>
        ))}
          </div>
        </div>
      </div>

      <div className="max-w-sm mx-auto rounded-[24px] border border-white/10 bg-[#1b120c]/82 px-4 py-3 shadow-card backdrop-blur-md text-center">
        <p className="text-cream-300/80 text-sm font-body leading-relaxed">Choose a ready-made path or create your own if tonight needs something specific.</p>
      </div>

      {/* Custom name input modal */}
      <AnimatePresence>
        {showCustomInput && (
          <motion.div
            className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-50 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCustomInput(false)}
          >
            <motion.div
              className="bg-[#1b120c]/95 border border-white/10 rounded-[28px] p-6 w-full max-w-xs shadow-dream text-cream-100"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-dream-glow/20 bg-dream-glow/12 text-2xl">✨</div>
              <h2 className="font-display font-bold text-cream-100 text-lg mb-1 text-center">Name your routine</h2>
              <p className="text-cream-300/75 text-sm text-center mb-4 font-body">e.g. "Sports Night", "After School"</p>
              <input
                autoFocus
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCustomConfirm()}
                placeholder="My Routine"
                maxLength={24}
                className="w-full bg-[#140e0a]/90 border-2 border-white/10 rounded-2xl px-4 py-3 text-cream-100 font-body text-base outline-none focus:border-dream-glow/50 mb-4"
              />
              <button onClick={handleCustomConfirm} className="btn-primary w-full">
                Let's go! 🎉
              </button>
              <button
                onClick={() => setShowCustomInput(false)}
                className="w-full mt-2 text-sm text-cream-400/65 hover:text-cream-100 py-2 font-body"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
