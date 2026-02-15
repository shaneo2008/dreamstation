/**
 * 😴 MorningSurvey — Morning-after feedback slider & weekly report
 *
 * Captures the child's reported sleep quality using an
 * emoji-based slider and stores the data for weekly reporting.
 *
 * Features:
 *   - 5-point emoji scale for sleep quality
 *   - Optional "how do you feel?" text
 *   - Weekly trend summary component
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sun, TrendingUp, Calendar } from 'lucide-react';

const SLEEP_SCORES = [
    { value: 1, emoji: '😫', label: 'Terrible', color: '#ef4444' },
    { value: 2, emoji: '😕', label: 'Not great', color: '#f97316' },
    { value: 3, emoji: '😐', label: 'Okay', color: '#eab308' },
    { value: 4, emoji: '😊', label: 'Good', color: '#a78bfa' },
    { value: 5, emoji: '🤩', label: 'Amazing!', color: '#7c3aed' },
];

/**
 * @param {Object} props
 * @param {Function} props.onSubmit      — Called with { score, note, date }
 * @param {Array}    [props.weeklyData]  — Array of past scores for the weekly chart
 * @param {string}   [props.className]
 */
export default function MorningSurvey({
    onSubmit,
    weeklyData = [],
    className = '',
}) {
    const [selectedScore, setSelectedScore] = useState(null);
    const [note, setNote] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const weeklyAvg = useMemo(() => {
        if (weeklyData.length === 0) return null;
        const sum = weeklyData.reduce((acc, d) => acc + d.score, 0);
        return (sum / weeklyData.length).toFixed(1);
    }, [weeklyData]);

    const handleSubmit = () => {
        if (selectedScore === null) return;
        onSubmit?.({
            score: selectedScore,
            note: note.trim() || null,
            date: new Date().toISOString(),
        });
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`frost p-8 text-center ${className}`}
            >
                <motion.div
                    className="text-5xl mb-3"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    🌅
                </motion.div>
                <h3 className="text-lg font-display font-semibold text-sleep-200 mb-1">
                    Thanks for sharing!
                </h3>
                <p className="text-sm text-sleep-400">
                    Have a wonderful day ✨
                </p>
            </motion.div>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Survey Card */}
            <div className="frost p-6">
                <div className="flex items-center gap-3 mb-5">
                    <Sun className="w-5 h-5 text-dream-glow" strokeWidth={1.5} />
                    <h3 className="text-lg font-display font-semibold text-sleep-200">
                        Good Morning!
                    </h3>
                </div>

                <p className="text-sm text-sleep-350 mb-5">
                    How did you sleep last night?
                </p>

                {/* Emoji slider */}
                <div className="flex items-center justify-between gap-2 mb-6">
                    {SLEEP_SCORES.map((item) => (
                        <motion.button
                            key={item.value}
                            onClick={() => setSelectedScore(item.value)}
                            className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-glass transition-all duration-300 cursor-pointer
                ${selectedScore === item.value
                                    ? 'frost border-glass-strong scale-110'
                                    : 'hover:bg-sleep-800/40'
                                }
              `}
                            whileTap={{ scale: 0.9 }}
                        >
                            <span className="text-2xl">{item.emoji}</span>
                            <span className="text-[10px] text-sleep-400 font-medium">
                                {item.label}
                            </span>
                        </motion.button>
                    ))}
                </div>

                {/* Optional note */}
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Anything else to share? (optional)"
                    rows={2}
                    className="glass-input w-full px-4 py-3 text-sm resize-none mb-4"
                />

                {/* Submit */}
                <motion.button
                    onClick={handleSubmit}
                    disabled={selectedScore === null}
                    className="w-full glass-surface py-3 text-sm font-medium text-dream-shimmer disabled:opacity-40 disabled:cursor-not-allowed"
                    whileHover={selectedScore !== null ? { scale: 1.02 } : {}}
                    whileTap={selectedScore !== null ? { scale: 0.98 } : {}}
                >
                    Submit
                </motion.button>
            </div>

            {/* Weekly Summary (if data available) */}
            {weeklyData.length > 0 && (
                <div className="frost p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-4 h-4 text-dream-glow" strokeWidth={1.5} />
                        <h4 className="text-sm font-display font-semibold text-sleep-250">
                            This Week
                        </h4>
                        {weeklyAvg && (
                            <div className="ml-auto flex items-center gap-1 text-xs text-sleep-400">
                                <TrendingUp className="w-3 h-3" />
                                <span>Avg: {weeklyAvg}/5</span>
                            </div>
                        )}
                    </div>

                    {/* Simple bar chart */}
                    <div className="flex items-end gap-1.5 h-16">
                        {weeklyData.slice(-7).map((entry, i) => {
                            const height = (entry.score / 5) * 100;
                            const scoreConfig = SLEEP_SCORES.find((s) => s.value === entry.score);
                            return (
                                <motion.div
                                    key={i}
                                    className="flex-1 rounded-t-md"
                                    style={{ backgroundColor: scoreConfig?.color || '#6c52c9' }}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${height}%` }}
                                    transition={{ delay: i * 0.08, duration: 0.4 }}
                                    title={`${entry.date}: ${scoreConfig?.label}`}
                                />
                            );
                        })}
                    </div>

                    {/* Day labels */}
                    <div className="flex gap-1.5 mt-1">
                        {weeklyData.slice(-7).map((entry, i) => (
                            <span
                                key={i}
                                className="flex-1 text-center text-[9px] text-sleep-500 font-mono"
                            >
                                {new Date(entry.date).toLocaleDateString('en', { weekday: 'narrow' })}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
