/**
 * 🐾 SleepCreature — Animated mirroring creature component
 *
 * The creature visually mirrors the child's sleep-flow progress:
 *   - SYNC:   Alert, eyes open, bouncing gently
 *   - SEED:   Happily eating / energetic as tasks complete
 *   - SETTLE: Calming down, yawning, slower motion
 *   - SLEEP:  Eyes closed, "breathing" animation, zzz's
 *
 * Uses Framer Motion for fluid phase transitions.
 * Replace the SVG placeholder with Lottie animations or custom SVGs
 * for production-quality creatures.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';

/** Creature mood config per sleep phase */
const CREATURE_MOODS = {
    sync: {
        label: 'Awake & curious',
        eyeState: 'open',
        bodyColor: '#a78bfa',
        glowColor: 'rgba(167, 139, 250, 0.3)',
        animation: {
            y: [0, -8, 0],
            scale: [1, 1.03, 1],
            transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
        },
    },
    seed: {
        label: 'Happy & munching',
        eyeState: 'happy',
        bodyColor: '#7c3aed',
        glowColor: 'rgba(124, 58, 237, 0.3)',
        animation: {
            y: [0, -5, 0],
            scale: [1, 1.05, 1],
            rotate: [0, 2, -2, 0],
            transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
        },
    },
    settle: {
        label: 'Getting sleepy',
        eyeState: 'drowsy',
        bodyColor: '#6c52c9',
        glowColor: 'rgba(108, 82, 201, 0.25)',
        animation: {
            y: [0, -3, 0],
            scale: [1, 1.01, 1],
            transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
        },
    },
    sleep: {
        label: 'Fast asleep',
        eyeState: 'closed',
        bodyColor: '#432e8a',
        glowColor: 'rgba(67, 46, 138, 0.2)',
        animation: {
            y: [0, -2, 0],
            scale: [1, 1.005, 1],
            transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
        },
    },
};

/**
 * SVG Placeholder Creature
 * Replace this with a Lottie player or more detailed SVG artwork.
 */
function CreatureSVG({ eyeState, bodyColor }) {
    return (
        <svg viewBox="0 0 200 200" className="w-full h-full" aria-hidden="true">
            {/* Body */}
            <ellipse cx="100" cy="120" rx="60" ry="55" fill={bodyColor} opacity="0.9" />

            {/* Belly */}
            <ellipse cx="100" cy="130" rx="40" ry="35" fill="rgba(255,255,255,0.08)" />

            {/* Left ear */}
            <ellipse cx="65" cy="75" rx="18" ry="25" fill={bodyColor} opacity="0.85" />
            <ellipse cx="65" cy="75" rx="10" ry="15" fill="rgba(255,255,255,0.06)" />

            {/* Right ear */}
            <ellipse cx="135" cy="75" rx="18" ry="25" fill={bodyColor} opacity="0.85" />
            <ellipse cx="135" cy="75" rx="10" ry="15" fill="rgba(255,255,255,0.06)" />

            {/* Eyes */}
            {eyeState === 'open' && (
                <>
                    <circle cx="82" cy="110" r="8" fill="#f3f0fd" />
                    <circle cx="82" cy="110" r="4" fill="#1a1038" />
                    <circle cx="118" cy="110" r="8" fill="#f3f0fd" />
                    <circle cx="118" cy="110" r="4" fill="#1a1038" />
                    {/* Sparkle highlights */}
                    <circle cx="85" cy="108" r="2" fill="white" opacity="0.8" />
                    <circle cx="121" cy="108" r="2" fill="white" opacity="0.8" />
                </>
            )}

            {eyeState === 'happy' && (
                <>
                    <path d="M74 110 Q82 102 90 110" stroke="#f3f0fd" strokeWidth="3" fill="none" strokeLinecap="round" />
                    <path d="M110 110 Q118 102 126 110" stroke="#f3f0fd" strokeWidth="3" fill="none" strokeLinecap="round" />
                </>
            )}

            {eyeState === 'drowsy' && (
                <>
                    <ellipse cx="82" cy="110" rx="7" ry="3" fill="#f3f0fd" opacity="0.7" />
                    <ellipse cx="118" cy="110" rx="7" ry="3" fill="#f3f0fd" opacity="0.7" />
                </>
            )}

            {eyeState === 'closed' && (
                <>
                    <path d="M75 110 Q82 114 89 110" stroke="#ddd6fa" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6" />
                    <path d="M111 110 Q118 114 125 110" stroke="#ddd6fa" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6" />
                </>
            )}

            {/* Mouth */}
            {eyeState !== 'closed' ? (
                <path d="M92 128 Q100 134 108 128" stroke="#f3f0fd" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
            ) : (
                <ellipse cx="100" cy="128" rx="4" ry="2" fill="#f3f0fd" opacity="0.2" />
            )}

            {/* Zzz's when sleeping */}
            {eyeState === 'closed' && (
                <g opacity="0.5">
                    <text x="140" y="90" fill="#c4b5fd" fontSize="14" fontFamily="sans-serif" fontWeight="bold">z</text>
                    <text x="152" y="78" fill="#c4b5fd" fontSize="11" fontFamily="sans-serif" fontWeight="bold" opacity="0.7">z</text>
                    <text x="160" y="68" fill="#c4b5fd" fontSize="9" fontFamily="sans-serif" fontWeight="bold" opacity="0.4">z</text>
                </g>
            )}
        </svg>
    );
}

/**
 * @param {Object} props
 * @param {'sync'|'seed'|'settle'|'sleep'} props.phase   — Current sleep phase
 * @param {number} [props.progress]                       — Phase completion 0–1
 * @param {string} [props.className]                      — Additional CSS classes
 */
export default function SleepCreature({ phase = 'sync', progress = 0, className = '' }) {
    const mood = useMemo(() => CREATURE_MOODS[phase] || CREATURE_MOODS.sync, [phase]);

    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            {/* Background glow */}
            <motion.div
                className="absolute inset-0 rounded-full"
                animate={{
                    boxShadow: `0 0 ${40 + progress * 20}px ${mood.glowColor}`,
                    opacity: [0.5, 0.8, 0.5],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Creature body with phase-based animation */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={phase}
                    className="relative w-full h-full"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{
                        opacity: 1,
                        ...mood.animation,
                    }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.5 }}
                >
                    <CreatureSVG eyeState={mood.eyeState} bodyColor={mood.bodyColor} />
                </motion.div>
            </AnimatePresence>

            {/* Mood label */}
            <motion.span
                className="absolute -bottom-6 text-xs text-sleep-350 font-medium tracking-wide"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                key={mood.label}
            >
                {mood.label}
            </motion.span>
        </div>
    );
}
