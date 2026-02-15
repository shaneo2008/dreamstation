/**
 * 🐾 TaskChecklist — Bedtime routine task list with feeding logic
 *
 * Each completed task "feeds" the sleep creature, progressing
 * through the SEED phase. Tasks animate in/out with Framer Motion
 * and use glassmorphic card styling.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Check, Circle } from 'lucide-react';

const taskVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
        opacity: 1,
        x: 0,
        transition: { delay: i * 0.08, duration: 0.35, ease: [0.4, 0, 0.2, 1] },
    }),
    exit: { opacity: 0, x: 20, transition: { duration: 0.2 } },
};

/**
 * @param {Object} props
 * @param {Array<{id: string, label: string, completed: boolean}>} props.tasks
 * @param {(taskId: string) => void} props.onToggle
 * @param {string} [props.className]
 */
export default function TaskChecklist({ tasks = [], onToggle, className = '' }) {
    const completedCount = tasks.filter((t) => t.completed).length;
    const feedLevel = tasks.length > 0 ? completedCount / tasks.length : 0;

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Feed level indicator */}
            <div className="flex items-center gap-2 text-xs text-sleep-350 mb-2">
                <span>🐾 Creature feed level:</span>
                <div className="flex gap-0.5">
                    {tasks.map((_, i) => (
                        <motion.div
                            key={i}
                            className={`w-2 h-2 rounded-full ${i < completedCount ? 'bg-dream-glow' : 'bg-sleep-750'
                                }`}
                            animate={i < completedCount ? { scale: [1, 1.3, 1] } : {}}
                            transition={{ duration: 0.3 }}
                        />
                    ))}
                </div>
            </div>

            {/* Task items */}
            <AnimatePresence>
                {tasks.map((task, index) => (
                    <motion.button
                        key={task.id}
                        custom={index}
                        variants={taskVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={() => onToggle?.(task.id)}
                        className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-glass text-left
              transition-all duration-300 cursor-pointer
              ${task.completed
                                ? 'frost border-glass-soft opacity-70'
                                : 'frost glass-interactive'
                            }
            `}
                        whileTap={{ scale: 0.98 }}
                    >
                        {/* Checkbox */}
                        <div
                            className={`
                flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center
                transition-all duration-300 border
                ${task.completed
                                    ? 'bg-dream-aurora border-dream-glow'
                                    : 'border-sleep-500 bg-transparent'
                                }
              `}
                        >
                            {task.completed ? (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                                >
                                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                </motion.div>
                            ) : (
                                <Circle className="w-3.5 h-3.5 text-sleep-500" strokeWidth={1.5} />
                            )}
                        </div>

                        {/* Label */}
                        <span
                            className={`text-sm font-medium transition-all duration-300 ${task.completed ? 'text-sleep-400 line-through' : 'text-sleep-200'
                                }`}
                        >
                            {task.label}
                        </span>
                    </motion.button>
                ))}
            </AnimatePresence>

            {/* Completion celebration */}
            <AnimatePresence>
                {feedLevel === 1 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-center py-3 text-sm text-dream-shimmer font-medium"
                    >
                        ✨ Creature is fully fed! Ready to move on ✨
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
