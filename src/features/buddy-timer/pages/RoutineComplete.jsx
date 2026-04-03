import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import PixelRexCharacter from '../rex/PixelRexCharacter';
import { useRoutineStore } from '../useRoutineStore';

const CONFETTI_COLORS = ['#FF6B6B', '#FFB347', '#7BC74D', '#5BC0EB', '#9B8FE8', '#FFD93D', '#FF9FF3', '#54A0FF'];
const CONFETTI_SHAPES = ['●', '■', '▲', '★', '♦', '❤'];

function generateConfetti(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    shape: CONFETTI_SHAPES[Math.floor(Math.random() * CONFETTI_SHAPES.length)],
    delay: Math.random() * 0.8,
    duration: 2 + Math.random() * 2,
    rotation: Math.random() * 720 - 360,
    size: 10 + Math.random() * 14,
  }));
}

export default function RoutineComplete({ onStoryTime }) {
  const { tasks, resetRoutine, selectedCharacter, routineName } = useRoutineStore();
  const [confetti, setConfetti] = useState([]);
  const [showContent, setShowContent] = useState(false);

  const characterName = selectedCharacter.charAt(0).toUpperCase() + selectedCharacter.slice(1);
  const totalMinutes = tasks.reduce((sum, t) => sum + t.durationMinutes, 0);

  useEffect(() => {
    setConfetti(generateConfetti(40));
    const timer = setTimeout(() => setShowContent(true), 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-4 relative overflow-hidden text-cream-100">
      {/* Confetti Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {confetti.map((piece) => (
          <motion.div
            key={piece.id}
            className="absolute"
            style={{ left: `${piece.x}%`, top: -20, fontSize: piece.size, color: piece.color }}
            initial={{ y: -30, opacity: 1, rotate: 0 }}
            animate={{ y: window.innerHeight + 50, opacity: [1, 1, 0.8, 0], rotate: piece.rotation }}
            transition={{ duration: piece.duration, delay: piece.delay, ease: 'easeOut', repeat: Infinity, repeatDelay: 1 }}
          >
            {piece.shape}
          </motion.div>
        ))}
      </div>

      {showContent && (
        <motion.div
          className="flex flex-col items-center z-10"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#1b120c]/88 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-cream-400/65 font-body shadow-card backdrop-blur-md mb-4">
            <span>Routine Complete</span>
            <span className="text-cream-200">{routineName}</span>
          </div>
          <motion.h1
            className="font-display text-4xl font-bold text-cream-100 text-center mb-2"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            🎉 All Done! 🎉
          </motion.h1>

          <motion.p
            className="text-cream-300/80 font-body font-semibold text-center mb-6 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {characterName} is so happy! You completed all {tasks.length} tasks!
          </motion.p>

          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          >
            <div className="absolute inset-4 rounded-full bg-dream-glow/10 blur-3xl pointer-events-none" />
            <div className="relative rounded-[32px] border border-white/10 bg-gradient-to-b from-[#221710]/76 to-[#140e0a]/92 px-8 py-7 shadow-dream backdrop-blur-md overflow-hidden">
              <div className="absolute inset-x-10 top-4 h-16 rounded-full bg-white/[0.04] blur-2xl pointer-events-none" />
            <PixelRexCharacter state="celebrating" size={180} characterId={selectedCharacter} />
            </div>
          </motion.div>

          <motion.div
            className="grid grid-cols-3 gap-2 w-full max-w-xs mt-5 mb-1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <div className="rounded-2xl border border-white/10 bg-[#1b120c]/82 px-3 py-2 text-center">
              <div className="text-[10px] uppercase tracking-[0.14em] text-cream-400/55 font-body">Tasks</div>
              <div className="text-sm font-display font-semibold text-cream-100 mt-1">{tasks.length}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#1b120c]/82 px-3 py-2 text-center">
              <div className="text-[10px] uppercase tracking-[0.14em] text-cream-400/55 font-body">Time</div>
              <div className="text-sm font-display font-semibold text-cream-100 mt-1">{totalMinutes} min</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#1b120c]/82 px-3 py-2 text-center">
              <div className="text-[10px] uppercase tracking-[0.14em] text-cream-400/55 font-body">Buddy</div>
              <div className="text-sm font-display font-semibold text-cream-100 mt-1">{characterName}</div>
            </div>
          </motion.div>

          <motion.div
            className="glass-card-solid w-full max-w-xs p-4 mt-6 mb-6 text-cream-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h3 className="font-display text-sm font-bold text-cream-300/80 mb-3 text-center">Completed Tasks</h3>
            <div className="space-y-2">
              {tasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  className="flex items-center gap-2 py-2 px-3 rounded-2xl bg-[#24170f]/78 border border-white/8"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                >
                  <motion.span className="text-lg" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8 + i * 0.1, type: 'spring' }}>
                    ✅
                  </motion.span>
                  <span className="font-display font-semibold text-sm flex-1 text-cream-100">{task.title}</span>
                  <span className="text-xs text-cream-400/65 font-body">{task.durationMinutes}m</span>
                </motion.div>
              ))}
            </div>
            <div className="mt-3 text-center">
              <span className="font-display font-bold text-sm" style={{ color: '#7BC74D' }}>
                Total: {totalMinutes} minutes
              </span>
            </div>
          </motion.div>

          <motion.div
            className="flex flex-col gap-3 w-full max-w-xs"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            {onStoryTime && (
              <button onClick={onStoryTime} className="btn-primary w-full">
                📖 Story Time!
              </button>
            )}
            <button onClick={resetRoutine} className={onStoryTime ? 'w-full py-3 text-sm font-display font-semibold text-cream-300/80 hover:text-cream-100 rounded-2xl border border-white/10 bg-[#1b120c]/92 hover:bg-[#24170f] transition-colors' : 'btn-primary w-full'}>
              🔄 Start Over
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
