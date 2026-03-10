import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoutineStore } from '../useRoutineStore';

const ROUTINES = [
  { type: 'bedtime',  emoji: '🌙', label: 'Bedtime',  description: 'Wind down & get ready for sleep', color: '#9B8FE8', bg: '#F0EEFF' },
  { type: 'morning',  emoji: '🌅', label: 'Morning',  description: 'Start the day the right way',     color: '#FFB347', bg: '#FFF6E8' },
  { type: 'homework', emoji: '📚', label: 'Homework', description: 'Focus up & get it done',          color: '#5BC0EB', bg: '#E8F7FF' },
  { type: 'custom',   emoji: '✏️', label: 'Custom',   description: 'Create your own routine',          color: '#7BC74D', bg: '#EDFCE0' },
];

export default function RoutinePicker() {
  const { setRoutine, setScreen } = useRoutineStore();
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState('');

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
    <div className="min-h-screen bg-[#FFFBF5] px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setScreen('selection')}
          className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center hover:bg-amber-200 transition-colors"
        >
          <span className="text-sm">←</span>
        </button>
        <span className="font-semibold text-amber-800 text-sm">Task Buddy</span>
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Choose a Routine</h1>
        <p className="text-slate-500 text-sm">What are we doing today?</p>
      </div>

      {/* Routine Tiles */}
      <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
        {ROUTINES.map((routine, i) => (
          <motion.button
            key={routine.type}
            onClick={() => handleSelect(routine.type)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="flex flex-col items-center p-5 rounded-3xl shadow-sm border-2 transition-shadow hover:shadow-md"
            style={{ backgroundColor: routine.bg, borderColor: routine.color + '40' }}
          >
            <span className="text-4xl mb-3">{routine.emoji}</span>
            <span className="font-bold text-slate-700 text-base mb-1">{routine.label}</span>
            <span className="text-xs text-slate-400 text-center leading-tight">{routine.description}</span>
          </motion.button>
        ))}
      </div>

      {/* Custom name input modal */}
      <AnimatePresence>
        {showCustomInput && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCustomInput(false)}
          >
            <motion.div
              className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-xl"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-bold text-slate-800 text-lg mb-1 text-center">Name your routine</h2>
              <p className="text-slate-400 text-sm text-center mb-4">e.g. "Sports Night", "After School"</p>
              <input
                autoFocus
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCustomConfirm()}
                placeholder="My Routine"
                maxLength={24}
                className="w-full border-2 border-amber-200 rounded-xl px-4 py-3 text-slate-700 font-semibold text-base outline-none focus:border-amber-400 mb-4"
              />
              <button onClick={handleCustomConfirm} className="btn-primary w-full">
                Let's go! 🎉
              </button>
              <button
                onClick={() => setShowCustomInput(false)}
                className="w-full mt-2 text-sm text-slate-400 hover:text-slate-600 py-2"
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
