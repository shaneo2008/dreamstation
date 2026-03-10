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
    <div className="min-h-screen flex flex-col items-center px-4 pt-8 pb-8">
      <motion.div className="text-center mb-6" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold text-foreground mb-1">{characterName}'s {routineName}</h1>
        <p className="text-muted-foreground font-semibold text-sm">Complete tasks to feed {characterName}!</p>
      </motion.div>

      <motion.div className="mb-6" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
        <PixelRexCharacter state="idle" size={180} className="mx-auto" characterId={selectedCharacter} />
      </motion.div>

      <motion.div
        className="glass-card-solid w-full max-w-sm p-5 mb-4"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">{routineName} Routine</h3>
            <p className="text-sm text-muted-foreground">{tasks.length} tasks · {totalMinutes} min total</p>
          </div>
          <button onClick={() => setShowBuilder(!showBuilder)} className="glass-card p-2.5 hover:bg-white/80 transition-colors">
            <Settings2 className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {!showBuilder && (
          <div className="space-y-2">
            {tasks.map((task, i) => (
              <motion.div
                key={task.id}
                className="flex items-center gap-3 py-2 px-3 rounded-xl bg-secondary/50"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.08 }}
              >
                <span className="text-xl">{task.itemEmoji}</span>
                <span className="font-semibold text-sm flex-1">{task.title}</span>
                <span className="text-xs text-muted-foreground font-semibold">{task.durationMinutes} min</span>
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
                className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors text-sm font-semibold text-muted-foreground hover:text-primary"
              >
                <PlusCircle className="w-4 h-4" />
                Add a task
              </button>
              <p className="text-xs text-muted-foreground text-center mt-2">Drag to reorder · Tap +/- to adjust time</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.button
        className="btn-primary w-full max-w-sm flex items-center justify-center gap-2 text-xl"
        onClick={startRoutine}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.02 }}
      >
        <Play className="w-6 h-6 fill-current" />
        Start Routine!
      </motion.button>

      <motion.p className="text-sm text-muted-foreground mt-3 font-semibold" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
        Total time: {totalMinutes} minutes
      </motion.p>
    </div>
  );
}

function TaskBuilderItem({ task, onDurationChange, onDelete, onTitleChange }) {
  return (
    <Reorder.Item
      value={task}
      className="flex flex-col gap-2 py-2.5 px-3 rounded-xl bg-secondary/50 cursor-grab active:cursor-grabbing"
      whileDrag={{ scale: 1.03, boxShadow: '0 8px 25px rgba(139, 109, 78, 0.15)', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
    >
      <div className="flex items-center gap-2">
        <GripVertical className="w-4 h-4 text-muted-foreground/50 shrink-0" />
        <span className="text-lg shrink-0">{task.itemEmoji}</span>
        <input
          type="text"
          value={task.title}
          onChange={(e) => onTitleChange(e.target.value)}
          onPointerDown={(e) => e.stopPropagation()}
          placeholder="Task name..."
          className="flex-1 bg-transparent font-semibold text-sm text-foreground placeholder:text-muted-foreground/50 outline-none border-b border-transparent focus:border-border min-w-0"
        />
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-red-400 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex items-center gap-1.5 pl-10">
        <button
          onClick={(e) => { e.stopPropagation(); onDurationChange(-1); }}
          onPointerDown={(e) => e.stopPropagation()}
          disabled={task.durationMinutes <= 1}
          className="w-7 h-7 rounded-lg bg-white/80 border border-border flex items-center justify-center hover:bg-white transition-colors disabled:opacity-30"
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
          className="w-7 h-7 rounded-lg bg-white/80 border border-border flex items-center justify-center hover:bg-white transition-colors disabled:opacity-30"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </Reorder.Item>
  );
}
