/**
 * 🌙 SleepProgressBar — Glassmorphic progress indicator
 *
 * Displays phase or overall progress as a filled bar
 * with a soft glow that intensifies as progress grows.
 */

import { motion } from 'framer-motion';

/**
 * @param {Object} props
 * @param {number}  props.value      — Progress value 0–1
 * @param {string}  [props.label]    — Optional label text
 * @param {'sm'|'md'|'lg'} [props.size] — Bar height
 * @param {string}  [props.className]
 */
export default function SleepProgressBar({
    value = 0,
    label,
    size = 'md',
    className = '',
}) {
    const clampedValue = Math.min(1, Math.max(0, value));
    const percent = Math.round(clampedValue * 100);

    const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };
    const barHeight = heights[size] || heights.md;

    return (
        <div className={`w-full ${className}`}>
            {label && (
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-sleep-300 tracking-wide">
                        {label}
                    </span>
                    <span className="text-xs font-mono text-sleep-400">{percent}%</span>
                </div>
            )}
            <div
                className={`w-full ${barHeight} rounded-full overflow-hidden frost-subtle`}
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={label || 'Progress'}
            >
                <motion.div
                    className="h-full rounded-full relative"
                    style={{
                        background: 'linear-gradient(90deg, #432e8a 0%, #6c52c9 40%, #a78bfa 100%)',
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                >
                    {/* Glow tip */}
                    <motion.div
                        className="absolute right-0 top-0 bottom-0 w-8 rounded-full"
                        style={{
                            background:
                                'linear-gradient(90deg, transparent, rgba(167, 139, 250, 0.5))',
                        }}
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                </motion.div>
            </div>
        </div>
    );
}
