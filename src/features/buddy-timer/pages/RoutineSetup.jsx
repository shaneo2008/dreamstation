import { useState, useCallback } from 'react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { GripVertical, Minus, Plus, Play, Settings2, Trash2, PlusCircle } from 'lucide-react';
import { nanoid } from 'nanoid';
import PixelRexCharacter from '../rex/PixelRexCharacter';
import { useRoutineStore } from '../useRoutineStore';

const TASK_COLORS = ['#9B8FE8', '#5BC0EB', '#FFB347', '#FF6B6B', '#7BC74D', '#FF9FF3'];

export default function RoutineSetup() {
  const { tasks, setTasks, startRoutine, routineName, selectedCharacter } = useRoutineStore();
  const characterName = selectedCharacter.charAt(0).toUpperCase() + selectedCharacter.slice(1);
  const [showBuilder, setShowBuilder] = useState(false);
  const totalMinutes = tasks.reduce((sum, t) => sum + t.durationMinutes, 0);
  const averageMinutes = tasks.length > 0 ? Math.round(totalMinutes / tasks.length) : 0;

  const updateTaskDuration = useCallback((taskId, delta) => {
    setTasks(tasks.map((t) => t.id === taskId ? { ...t, durationMinutes: Math.max(1, Math.min(60, t.durationMinutes + delta)) } : t));
  }, [tasks, setTasks]);

  const deleteTask = useCallback((taskId) => {
    setTasks(tasks.filter((t) => t.id !== taskId));
  }, [tasks, setTasks]);

  const addTask = useCallback(() => {
    const color = TASK_COLORS[tasks.length % TASK_COLORS.length];
    setTasks([...tasks, { id: nanoid(), title: '', durationMinutes: 5, itemEmoji: '⭐', itemLabel: 'Task', themeColor: color }]);
  }, [tasks, setTasks]);

  const updateTaskTitle = useCallback((taskId, title) => {
    setTasks(tasks.map((t) => t.id === taskId ? { ...t, title } : t));
  }, [tasks, setTasks]);

  return (
    <div className="min-h-full flex flex-col items-center px-1 pt-2 pb-6 text-cream-100">
      <motion.div className="text-center mb-6" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-[11px] uppercase tracking-[0.18em] text-cream-400/60 font-body mb-2">Task Buddy</div>
        <h1 className="font-display text-3xl font-bold text-cream-100 mb-1">{characterName}'s {routineName}</h1>
        <p className="text-cream-300/75 font-body text-sm">Complete tasks to feed {characterName}.</p>
      </motion.div>

      <motion.div className="relative w-full max-w-sm mb-6" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
        <div className="absolute inset-6 rounded-full bg-dream-glow/10 blur-3xl pointer-events-none" />
        <div className="relative rounded-[32px] border border-white/10 bg-gradient-to-b from-[#221710]/76 to-[#140e0a]/92 px-6 py-6 shadow-dream backdrop-blur-md overflow-hidden text-center">
          <div className="absolute inset-x-10 top-4 h-16 rounded-full bg-white/[0.04] blur-2xl pointer-events-none" />
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#1b120c]/88 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-cream-400/65 font-body shadow-card backdrop-blur-md mb-4">
            <span>Routine Preview</span>
            <span className="text-cream-200">{tasks.length} tasks</span>
          </div>
          <PixelRexCharacter state="idle" size={180} className="mx-auto" characterId={selectedCharacter} />
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-white/10 bg-[#1b120c]/82 px-3 py-2">
              <div className="text-[10px] uppercase tracking-[0.14em] text-cream-400/55 font-body">Total</div>
              <div className="text-sm font-display font-semibold text-cream-100 mt-1">{totalMinutes} min</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#1b120c]/82 px-3 py-2">
              <div className="text-[10px] uppercase tracking-[0.14em] text-cream-400/55 font-body">Average</div>
              <div className="text-sm font-display font-semibold text-cream-100 mt-1">{averageMinutes || 0} min</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#1b120c]/82 px-3 py-2">
              <div className="text-[10px] uppercase tracking-[0.14em] text-cream-400/55 font-body">Buddy</div>
              <div className="text-sm font-display font-semibold text-cream-100 mt-1">{characterName}</div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="glass-card-solid w-full max-w-sm p-5 mb-4 text-cream-100"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-xl font-bold text-cream-100">{routineName} Routine</h3>
            <p className="text-sm text-cream-300/75 font-body">{tasks.length} tasks · {totalMinutes} min total</p>
          </div>
          <button onClick={() => setShowBuilder(!showBuilder)} className="h-11 w-11 rounded-2xl border border-white/10 bg-[#24170f]/85 hover:bg-[#2c1d13] transition-colors flex items-center justify-center">
            <Settings2 className="w-5 h-5 text-cream-300/80" />
          </button>
        </div>

        {!showBuilder && (
          <div className="space-y-2">
            {tasks.map((task, i) => (
              <motion.div
                key={task.id}
                className="flex items-center gap-3 py-3 px-3.5 rounded-2xl bg-[#24170f]/78 border border-white/8"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.08 }}
              >
                <div className="h-9 w-9 rounded-xl flex items-center justify-center border border-white/10 bg-[#140e0a]/85 text-base" style={{ boxShadow: `0 10px 24px -18px ${task.themeColor}` }}>
                  <span>{task.itemEmoji}</span>
                </div>
                <div className="w-px self-stretch bg-white/6" />
                <span className="font-display font-semibold text-sm flex-1 text-cream-100">{task.title}</span>
                <span className="text-xs text-cream-400/65 font-body font-semibold">{task.durationMinutes} min</span>
              </motion.div>
            ))}
          </div>
        )}

        <AnimatePresence>
          {showBuilder && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
              <Reorder.Group axis="y" values={tasks} onReorder={setTasks} className="space-y-2">
                {tasks.map((task) => (
                  <TaskBuilderItem
                    key={task.id}
                    task={task}
                    onDurationChange={(delta) => updateTaskDuration(task.id, delta)}
                    onDelete={() => deleteTask(task.id)}
                    onTitleChange={(title) => updateTaskTitle(task.id, title)}
                  />
                ))}
              </Reorder.Group>
              <button
                onClick={addTask}
                className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-white/20 hover:border-dream-glow/35 hover:bg-dream-glow/5 transition-colors text-sm font-display font-semibold text-cream-300/80 hover:text-dream-glow"
              >
                <PlusCircle className="w-4 h-4" />
                Add a task
              </button>
              <p className="text-xs text-cream-400/65 text-center mt-2 font-body">Drag to reorder · Tap +/- to adjust time</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div className="w-full max-w-sm rounded-[28px] border border-white/10 bg-[#1b120c]/82 p-4 shadow-card backdrop-blur-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <div className="text-center mb-3">
          <div className="text-[11px] uppercase tracking-[0.16em] text-cream-400/55 font-body">Ready to begin</div>
          <p className="text-sm text-cream-300/80 font-body mt-1">Start when you want the first step and timer to begin.</p>
        </div>
        <motion.button
          className="btn-primary w-full flex items-center justify-center gap-2 text-xl"
          onClick={startRoutine}
          whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.02 }}
        >
          <Play className="w-6 h-6 fill-current" />
          Start Routine!
        </motion.button>
        <motion.p className="text-sm text-cream-400/65 mt-3 font-body text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          Total time: {totalMinutes} minutes
        </motion.p>
      </motion.div>
    </div>
  );
}

function TaskBuilderItem({ task, onDurationChange, onDelete, onTitleChange }) {
  return (
    <Reorder.Item
      value={task}
      className="flex flex-col gap-2 py-3 px-3.5 rounded-2xl bg-[#24170f]/78 border border-white/8 cursor-grab active:cursor-grabbing"
      whileDrag={{ scale: 1.03, boxShadow: '0 14px 30px rgba(0, 0, 0, 0.35)', backgroundColor: 'rgba(44, 29, 19, 0.96)' }}
    >
      <div className="flex items-center gap-2">
        <GripVertical className="w-4 h-4 text-cream-400/45 shrink-0" />
        <span className="text-lg shrink-0">{task.itemEmoji}</span>
        <input
          type="text"
          value={task.title}
          onChange={(e) => onTitleChange(e.target.value)}
          onPointerDown={(e) => e.stopPropagation()}
          placeholder="Task name..."
          className="flex-1 bg-transparent font-display font-semibold text-sm text-cream-100 placeholder:text-cream-400/45 outline-none border-b border-transparent focus:border-white/20 min-w-0"
        />
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-cream-400/50 hover:text-danger hover:bg-danger/10 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex items-center gap-1.5 pl-10">
        <button
          onClick={(e) => { e.stopPropagation(); onDurationChange(-1); }}
          onPointerDown={(e) => e.stopPropagation()}
          disabled={task.durationMinutes <= 1}
          className="w-8 h-8 rounded-xl bg-[#140e0a]/90 border border-white/10 flex items-center justify-center hover:bg-[#1b120c] transition-colors disabled:opacity-30 text-cream-200"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="w-10 text-center font-display font-bold text-sm" style={{ color: task.themeColor }}>
          {task.durationMinutes}m
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onDurationChange(1); }}
          onPointerDown={(e) => e.stopPropagation()}
          disabled={task.durationMinutes >= 60}
          className="w-8 h-8 rounded-xl bg-[#140e0a]/90 border border-white/10 flex items-center justify-center hover:bg-[#1b120c] transition-colors disabled:opacity-30 text-cream-200"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </Reorder.Item>
  );
}
