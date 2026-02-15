/**
 * 🐾 Creature — Lottie-powered mirroring creature
 *
 * The animation speed is controlled by a `parentCalmLevel` prop (0–1).
 * When the parent is calm (Sync mode, calmLevel ≈ 1), the creature
 * slows to 0.5× speed, encouraging the child to mirror the calm.
 *
 * Speed mapping:
 *   parentCalmLevel = 0  → speed 1.6× (energetic / restless)
 *   parentCalmLevel = 0.5→ speed 1.0× (normal)
 *   parentCalmLevel = 1  → speed 0.5× (slow, serene, mirroring calm)
 *
 * Props:
 *   parentCalmLevel  0–1 float, drives animation speed
 *   phase            'sync' | 'seed' | 'settle' | 'sleep'
 *   className        additional CSS classes
 *   size             pixel width/height (default 240)
 *   showLabel        whether to display the mood label
 *   animationData    optional override Lottie JSON (swap creature skins)
 *
 * Usage:
 *   <Creature parentCalmLevel={0.9} phase="sync" />
 */

import { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import Lottie from 'lottie-react';
import { motion, AnimatePresence } from 'framer-motion';

// Default bundled animation
import defaultCreatureAnimation from './creature-animation.json';

/* ─── Phase-specific visual configuration ─── */
const PHASE_CONFIG = {
    prep: {
        label: 'Waiting to appear…',
        glowColor: 'rgba(108, 82, 201, 0.12)',
        glowSize: 20,
        bgOpacity: 0.06,
        calmSpeedMultiplier: 0.6,
    },
    sync: {
        label: 'Awake & curious',
        glowColor: 'rgba(167, 139, 250, 0.30)',
        glowSize: 50,
        bgOpacity: 0.15,
        // In sync mode, parentCalmLevel drives the creature to slow down
        calmSpeedMultiplier: 1.0,
    },
    feed: {
        label: 'Happy & munching',
        glowColor: 'rgba(124, 58, 237, 0.28)',
        glowSize: 45,
        bgOpacity: 0.13,
        calmSpeedMultiplier: 1.1,
    },
    seed: {
        label: 'Thinking up a story…',
        glowColor: 'rgba(108, 82, 201, 0.24)',
        glowSize: 38,
        bgOpacity: 0.11,
        calmSpeedMultiplier: 0.9,
    },
    story: {
        label: 'Getting sleepy',
        glowColor: 'rgba(108, 82, 201, 0.22)',
        glowSize: 35,
        bgOpacity: 0.10,
        calmSpeedMultiplier: 0.7,
    },
    sleep: {
        label: 'Fast asleep',
        glowColor: 'rgba(67, 46, 138, 0.18)',
        glowSize: 28,
        bgOpacity: 0.08,
        calmSpeedMultiplier: 0.5,
    },
};

/**
 * Maps parentCalmLevel (0–1) to an animation speed multiplier.
 *
 *   calmLevel 0   → 1.6× (restless, fast)
 *   calmLevel 0.5 → 1.0× (normal)
 *   calmLevel 1   → 0.5× (serene, slow — mirroring encouraged)
 *
 * Formula: speed = MAX_SPEED - calmLevel × (MAX_SPEED - MIN_SPEED)
 * Then multiplied by the per-phase calmSpeedMultiplier.
 */
const MAX_SPEED = 1.6;
const MIN_SPEED = 0.5;

function calmLevelToSpeed(calmLevel, phaseMultiplier = 1) {
    const clamped = Math.min(1, Math.max(0, calmLevel));
    const baseSpeed = MAX_SPEED - clamped * (MAX_SPEED - MIN_SPEED);
    return baseSpeed * phaseMultiplier;
}

/**
 * @param {Object} props
 * @param {number}  props.parentCalmLevel — 0 (restless) to 1 (serene calm)
 * @param {'prep'|'sync'|'feed'|'seed'|'story'|'sleep'} [props.phase]
 * @param {string}  [props.className]
 * @param {number}  [props.size]          — Width & height in px
 * @param {boolean} [props.showLabel]     — Show mood label below creature
 * @param {Object}  [props.animationData] — Override Lottie JSON
 */
export default function Creature({
    parentCalmLevel = 0.5,
    phase = 'sync',
    className = '',
    size = 240,
    showLabel = true,
    animationData,
}) {
    const lottieRef = useRef(null);
    const [isReady, setIsReady] = useState(false);

    // Resolve phase config
    const config = useMemo(
        () => PHASE_CONFIG[phase] || PHASE_CONFIG.sync,
        [phase]
    );

    // Calculate target speed from calm level + phase multiplier
    const targetSpeed = useMemo(
        () => calmLevelToSpeed(parentCalmLevel, config.calmSpeedMultiplier),
        [parentCalmLevel, config.calmSpeedMultiplier]
    );

    // Smoothly update the Lottie playback speed when targetSpeed changes.
    // Uses requestAnimationFrame for buttery-smooth transitions.
    const currentSpeedRef = useRef(1);
    const rafIdRef = useRef(null);

    const smoothSetSpeed = useCallback((target) => {
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);

        const LERP_FACTOR = 0.04; // Lower = smoother, slower transition

        function step() {
            const current = currentSpeedRef.current;
            const diff = target - current;

            // Close enough — snap to target
            if (Math.abs(diff) < 0.005) {
                currentSpeedRef.current = target;
                lottieRef.current?.setSpeed(target);
                return;
            }

            // Lerp toward target
            const next = current + diff * LERP_FACTOR;
            currentSpeedRef.current = next;
            lottieRef.current?.setSpeed(next);
            rafIdRef.current = requestAnimationFrame(step);
        }

        rafIdRef.current = requestAnimationFrame(step);
    }, []);

    // Trigger smooth speed transition whenever target changes
    useEffect(() => {
        if (isReady) {
            smoothSetSpeed(targetSpeed);
        }
        return () => {
            if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        };
    }, [targetSpeed, isReady, smoothSetSpeed]);

    // Callback when Lottie is loaded and ready
    const handleDOMLoaded = useCallback(() => {
        setIsReady(true);
        if (lottieRef.current) {
            lottieRef.current.setSpeed(targetSpeed);
        }
    }, [targetSpeed]);

    // Derive a human-readable speed label
    const speedLabel = useMemo(() => {
        if (targetSpeed <= 0.6) return 'Serene';
        if (targetSpeed <= 0.9) return 'Gentle';
        if (targetSpeed <= 1.2) return 'Normal';
        return 'Lively';
    }, [targetSpeed]);

    // Glow animation intensifies as creature calms down
    const glowIntensity = useMemo(
        () => 0.5 + parentCalmLevel * 0.5,
        [parentCalmLevel]
    );

    return (
        <div
            className={`relative flex flex-col items-center justify-center ${className}`}
            style={{ width: size, height: size + (showLabel ? 48 : 0) }}
        >
            {/* Ambient glow behind the creature */}
            <motion.div
                className="absolute rounded-full pointer-events-none"
                style={{
                    width: size * 0.85,
                    height: size * 0.75,
                    top: size * 0.15,
                    left: size * 0.075,
                }}
                animate={{
                    boxShadow: `0 0 ${config.glowSize * glowIntensity}px ${config.glowColor}`,
                    opacity: [0.4 * glowIntensity, 0.7 * glowIntensity, 0.4 * glowIntensity],
                }}
                transition={{
                    duration: 3 / Math.max(0.3, targetSpeed),
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />

            {/* Creature wrapper with phase transition */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={phase}
                    className="relative"
                    style={{ width: size, height: size }}
                    initial={{ opacity: 0, scale: 0.85, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.85, y: -10 }}
                    transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                >
                    {/* Floating motion — slower when calm */}
                    <motion.div
                        animate={{ y: [0, -6 * (1 - parentCalmLevel * 0.5), 0] }}
                        transition={{
                            duration: 2.5 / Math.max(0.3, targetSpeed),
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    >
                        <Lottie
                            lottieRef={lottieRef}
                            animationData={animationData || defaultCreatureAnimation}
                            loop
                            autoplay
                            onDOMLoaded={handleDOMLoaded}
                            style={{
                                width: size,
                                height: size,
                                filter: `drop-shadow(0 0 ${12 * glowIntensity}px ${config.glowColor})`,
                            }}
                            aria-label={`Sleep creature — ${config.label}`}
                        />
                    </motion.div>
                </motion.div>
            </AnimatePresence>

            {/* Mood label + speed indicator */}
            {showLabel && (
                <motion.div
                    className="flex flex-col items-center gap-0.5 mt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.8 }}
                    key={`${phase}-${speedLabel}`}
                >
                    <span className="text-xs font-medium text-sleep-300 tracking-wide">
                        {config.label}
                    </span>
                    <span className="text-[10px] font-mono text-sleep-500">
                        {targetSpeed.toFixed(2)}× · {speedLabel}
                    </span>
                </motion.div>
            )}
        </div>
    );
}
