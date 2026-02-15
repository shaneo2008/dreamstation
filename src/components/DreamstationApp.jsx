/**
 * 🌙 DreamstationApp — Full-screen sleep-flow orchestrator
 *
 * Consumes `useSleepFlow` (Zustand) and renders the correct phase screen.
 * RESTYLED: Finch-style warm pastels, rounded corners, playful typography.
 *
 * Phase → Component mapping:
 *   PREP   → PrepScreen   (parent checklist)
 *   SYNC   → SyncScreen   (creature appears)
 *   FEED   → FeedScreen   (3 task max)
 *   SEED   → SeedScreen   (n8n story input)
 *   STORY  → StoryScreen  (audio playback)
 *   SLEEP  → SleepScreen  (locked dark screen)
 */

import React, { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ClipboardCheck,
    Sparkles,
    Cookie,
    Wand2,
    BookOpen,
    BedDouble,
    ChevronRight,
    ChevronLeft,
    Check,
    Moon,
} from 'lucide-react';

import { useSleepFlow, PHASES } from '../hooks/useSleepFlow';
import { PhaseHeader, SleepProgressBar } from './shared';
import { Creature } from './creature';

/* ─────────────────────────────────────────────
   Phase transition animation
   ───────────────────────────────────────────── */
const phaseVariants = {
    initial: { opacity: 0, x: 60, filter: 'blur(6px)' },
    animate: { opacity: 1, x: 0, filter: 'blur(0px)' },
    exit: { opacity: 0, x: -60, filter: 'blur(6px)' },
};

const phaseTransition = {
    duration: 0.45,
    ease: [0.4, 0, 0.2, 1],
};

/* ─────────────────────────────────────────────
   PREP Screen — Parent Checklist
   ───────────────────────────────────────────── */
function PrepScreen({ prepTasks, togglePrepTask }) {
    return (
        <div className="flex flex-col gap-6 w-full max-w-md mx-auto">
            <div className="text-center mb-2">
                <h2 className="text-2xl font-display font-bold text-sleep-900 mb-1">
                    Parent Prep
                </h2>
                <p className="text-sm text-sleep-600">
                    Complete these before starting the bedtime routine
                </p>
            </div>

            <div className="flex flex-col gap-3">
                {prepTasks.map((task) => (
                    <motion.button
                        key={task.id}
                        onClick={() => togglePrepTask(task.id)}
                        className={`bg-white/80 backdrop-blur-sm border-2 rounded-2xl p-4 flex items-center gap-4 text-left transition-all duration-300 ${
                            task.completed
                                ? 'border-success/40 bg-success/5'
                                : 'border-cream-300/60 hover:border-dream-glow/30'
                        }`}
                        whileTap={{ scale: 0.97 }}
                    >
                        <div
                            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                task.completed
                                    ? 'bg-success border-success'
                                    : 'border-cream-400'
                            }`}
                        >
                            {task.completed && <Check className="w-4 h-4 text-white" />}
                        </div>
                        <span
                            className={`text-sm font-semibold transition-colors ${
                                task.completed ? 'text-sleep-500 line-through' : 'text-sleep-800'
                            }`}
                        >
                            {task.label}
                        </span>
                    </motion.button>
                ))}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   SYNC Screen — Creature Appears
   ───────────────────────────────────────────── */
function SyncScreen({
    creatureId,
    setCreatureId,
    parentCalmLevel,
    setParentCalmLevel,
}) {
    const creatures = [
        { id: 'luna', name: 'Luna', emoji: '🐱', desc: 'A calm, purring kitten' },
        { id: 'cosmo', name: 'Cosmo', emoji: '🐻', desc: 'A sleepy cosmic bear' },
        { id: 'nimbus', name: 'Nimbus', emoji: '🐉', desc: 'A gentle cloud dragon' },
    ];

    return (
        <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
            <Creature
                parentCalmLevel={parentCalmLevel}
                phase="sync"
                size={200}
                showLabel
            />

            {!creatureId ? (
                <>
                    <h2 className="text-xl font-display font-bold text-sleep-900">
                        Choose your sleep creature
                    </h2>
                    <div className="flex flex-col gap-3 w-full">
                        {creatures.map((c) => (
                            <motion.button
                                key={c.id}
                                onClick={() => setCreatureId(c.id)}
                                className="bg-white/80 backdrop-blur-sm border-2 border-cream-300/60 rounded-2xl p-4 flex items-center gap-4 text-left hover:border-dream-glow/40 transition-all"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                <span className="text-3xl">{c.emoji}</span>
                                <div>
                                    <div className="font-display font-bold text-sleep-900">{c.name}</div>
                                    <div className="text-xs text-sleep-500">{c.desc}</div>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center gap-4 w-full">
                    <p className="text-sm text-sleep-600 text-center">
                        Breathe slowly to calm{' '}
                        <span className="font-bold text-dream-glow">
                            {creatures.find((c) => c.id === creatureId)?.name}
                        </span>
                    </p>

                    {/* Calm level slider */}
                    <label className="flex flex-col items-center gap-2 w-full">
                        <span className="text-xs text-sleep-500 font-display font-semibold">
                            Calm Level: {Math.round(parentCalmLevel * 100)}%
                        </span>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={parentCalmLevel}
                            onChange={(e) => setParentCalmLevel(parseFloat(e.target.value))}
                            className="w-full accent-dream-glow"
                        />
                    </label>
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────
   FEED Screen — 3 Tasks Max
   ───────────────────────────────────────────── */
function FeedScreen({ feedTasks, toggleFeedTask, parentCalmLevel }) {
    const completed = feedTasks.filter((t) => t.completed).length;

    return (
        <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
            <Creature
                parentCalmLevel={parentCalmLevel}
                phase="feed"
                size={160}
                showLabel={false}
            />

            <div className="text-center">
                <h2 className="text-xl font-display font-bold text-sleep-900 mb-1">
                    Feed your creature
                </h2>
                <p className="text-sm text-sleep-500">
                    {completed}/{feedTasks.length} tasks done
                </p>
            </div>

            <div className="flex flex-col gap-3 w-full">
                {feedTasks.map((task) => (
                    <motion.button
                        key={task.id}
                        onClick={() => toggleFeedTask(task.id)}
                        className={`bg-white/80 backdrop-blur-sm border-2 rounded-2xl p-4 flex items-center gap-4 text-left transition-all duration-300 ${
                            task.completed
                                ? 'border-dream-glow/40 bg-dream-stardust/30'
                                : 'border-cream-300/60 hover:border-dream-glow/30'
                        }`}
                        whileTap={{ scale: 0.97 }}
                        layout
                    >
                        <motion.div
                            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                task.completed
                                    ? 'bg-dream-glow border-dream-glow'
                                    : 'border-cream-400'
                            }`}
                            animate={task.completed ? { scale: [1, 1.3, 1] } : {}}
                            transition={{ duration: 0.3 }}
                        >
                            {task.completed && <Check className="w-4 h-4 text-white" />}
                        </motion.div>
                        <span
                            className={`text-sm font-semibold ${
                                task.completed ? 'text-sleep-500 line-through' : 'text-sleep-800'
                            }`}
                        >
                            {task.label}
                        </span>
                    </motion.button>
                ))}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   SEED Screen — Story Input → n8n
   ───────────────────────────────────────────── */
function SeedScreen({
    seedInput,
    setSeedInput,
    sendToN8N,
    seedLoading,
    seedError,
    seedSubmitted,
}) {
    const themes = [
        'Space adventure',
        'Underwater kingdom',
        'Enchanted forest',
        'Cloud castle',
        'Dinosaur island',
    ];

    const handleSend = useCallback(() => {
        sendToN8N(async (payload) => {
            console.log('📡 Sending to n8n:', payload);
            await new Promise((r) => setTimeout(r, 2000));
            return {
                title: `${payload.childName || 'A Child'}'s ${payload.theme || 'Dream'}`,
                description: `A magical bedtime story about ${payload.theme || 'adventure'}…`,
                audioUrl: null,
            };
        });
    }, [sendToN8N]);

    return (
        <div className="flex flex-col gap-5 w-full max-w-md mx-auto">
            <div className="text-center mb-1">
                <h2 className="text-xl font-display font-bold text-sleep-900 mb-1">
                    Create tonight&apos;s story
                </h2>
                <p className="text-sm text-sleep-500">
                    Tell us about the adventure
                </p>
            </div>

            {!seedSubmitted ? (
                <>
                    {/* Child name */}
                    <input
                        type="text"
                        placeholder="Child's name"
                        value={seedInput.childName}
                        onChange={(e) => setSeedInput({ childName: e.target.value })}
                        className="bg-white/80 backdrop-blur-sm border-2 border-cream-300/60 rounded-2xl px-4 py-3 text-sm text-sleep-900 placeholder-sleep-400 outline-none focus:border-dream-glow/50 transition-all"
                    />

                    {/* Theme picker */}
                    <div>
                        <label className="text-xs text-sleep-500 font-display font-semibold mb-2 block">
                            Pick a theme
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {themes.map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setSeedInput({ theme: t })}
                                    className={`px-4 py-2 rounded-full text-xs font-display font-semibold transition-all ${
                                        seedInput.theme === t
                                            ? 'bg-dream-glow text-white shadow-sm'
                                            : 'bg-white/80 border-2 border-cream-300/60 text-sleep-600 hover:border-dream-glow/30'
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Extras */}
                    <textarea
                        placeholder="Any extras? (e.g. 'include a friendly robot')"
                        value={seedInput.extras}
                        onChange={(e) => setSeedInput({ extras: e.target.value })}
                        rows={3}
                        className="bg-white/80 backdrop-blur-sm border-2 border-cream-300/60 rounded-2xl px-4 py-3 text-sm text-sleep-900 placeholder-sleep-400 outline-none resize-none focus:border-dream-glow/50 transition-all"
                    />

                    {seedError && (
                        <p className="text-danger text-xs text-center font-semibold">{seedError}</p>
                    )}

                    <motion.button
                        onClick={handleSend}
                        disabled={seedLoading || !seedInput.theme}
                        className={`w-full py-3.5 rounded-2xl font-display font-bold text-sm transition-all ${
                            seedLoading || !seedInput.theme
                                ? 'bg-cream-300/50 text-sleep-400 cursor-not-allowed'
                                : 'bg-dream-glow text-white shadow-glow-sm hover:bg-dream-aurora active:scale-[0.98]'
                        }`}
                        whileTap={!seedLoading ? { scale: 0.97 } : {}}
                    >
                        {seedLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-cream-300 border-t-white rounded-full animate-spin" />
                                Generating…
                            </span>
                        ) : (
                            'Generate Story ✨'
                        )}
                    </motion.button>
                </>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/80 backdrop-blur-sm border-2 border-cream-300/60 rounded-2xl p-6 text-center"
                >
                    <span className="text-4xl mb-3 block">📖</span>
                    <h3 className="text-lg font-display font-bold text-sleep-900">Story ready!</h3>
                    <p className="text-sm text-sleep-500 mt-1">
                        Advance to listen to the adventure
                    </p>
                </motion.div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────
   STORY Screen — Audio Playback
   ───────────────────────────────────────────── */
function StoryScreen({
    story,
    storyProgress,
    storyPlaying,
    setStoryPlaying,
    setStoryProgress,
    markStoryComplete,
    parentCalmLevel,
}) {
    const simRef = useRef(null);

    const handleTogglePlay = useCallback(() => {
        if (storyPlaying) {
            setStoryPlaying(false);
            if (simRef.current) clearInterval(simRef.current);
        } else {
            setStoryPlaying(true);
            let progress = storyProgress;
            simRef.current = setInterval(() => {
                progress = Math.min(1, progress + 0.01);
                setStoryProgress(progress);
                if (progress >= 1) {
                    clearInterval(simRef.current);
                    markStoryComplete();
                }
            }, 300);
        }
    }, [storyPlaying, storyProgress, setStoryPlaying, setStoryProgress, markStoryComplete]);

    return (
        <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
            <Creature
                parentCalmLevel={Math.min(1, parentCalmLevel + 0.2)}
                phase="story"
                size={160}
                showLabel
            />

            <div className="bg-white/80 backdrop-blur-sm border-2 border-cream-300/60 rounded-2xl p-6 w-full text-center">
                <h3 className="text-lg font-display font-bold text-sleep-900 mb-1">
                    {story?.title || 'Bedtime Story'}
                </h3>
                <p className="text-xs text-sleep-500 mb-4">
                    {story?.description || 'A magical adventure awaits…'}
                </p>

                {/* Progress bar */}
                <div className="w-full h-2.5 rounded-full bg-cream-200 mb-4 overflow-hidden">
                    <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-dream-glow to-pastel-peach"
                        animate={{ width: `${(storyProgress) * 100}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>

                {/* Play/Pause */}
                <motion.button
                    onClick={handleTogglePlay}
                    className="w-14 h-14 rounded-full bg-dream-glow flex items-center justify-center shadow-glow-sm mx-auto"
                    whileTap={{ scale: 0.9 }}
                >
                    {storyPlaying ? (
                        <div className="flex gap-1">
                            <div className="w-1 h-5 bg-white rounded-full" />
                            <div className="w-1 h-5 bg-white rounded-full" />
                        </div>
                    ) : (
                        <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1" />
                    )}
                </motion.button>

                <p className="text-xs text-sleep-500 mt-3 font-display font-semibold">
                    {Math.round(storyProgress * 100)}% complete
                </p>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   SLEEP Screen — Locked Dark Screen
   ───────────────────────────────────────────── */
function SleepScreen({ resetFlow }) {
    const pressTimer = useRef(null);
    const [showReset, setShowReset] = useState(false);

    const handlePressStart = useCallback(() => {
        pressTimer.current = setTimeout(() => {
            setShowReset(true);
        }, 3000);
    }, []);

    const handlePressEnd = useCallback(() => {
        clearTimeout(pressTimer.current);
    }, []);

    return (
        <motion.div
            className="fixed inset-0 bg-sleep-950 flex flex-col items-center justify-center z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, ease: 'easeInOut' }}
        >
            <motion.div
                onPointerDown={handlePressStart}
                onPointerUp={handlePressEnd}
                onPointerLeave={handlePressEnd}
                className="mb-8 cursor-default select-none"
                animate={{ opacity: [0.15, 0.3, 0.15] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
                <Moon className="w-12 h-12 text-sleep-600" />
            </motion.div>

            <motion.p
                className="text-sleep-500 text-sm font-display font-semibold tracking-widest"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.5, y: 0 }}
                transition={{ delay: 1.5, duration: 1.5 }}
            >
                Goodnight
            </motion.p>

            <AnimatePresence>
                {showReset && (
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        onClick={resetFlow}
                        className="mt-12 px-6 py-2 rounded-full bg-sleep-800 text-sleep-400 text-xs font-display border border-sleep-700 hover:border-sleep-500 transition-all"
                    >
                        End session
                    </motion.button>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

/* ═════════════════════════════════════════════
   Main Orchestrator
   ═════════════════════════════════════════════ */
export default function DreamstationApp() {
    const flow = useSleepFlow();

    const {
        currentPhase,
        showNavigation,
        canAdvance,
        canGoBack,
        isLocked,
        phaseProgress,
        overallProgress,
        advancePhase,
        goBack,
        phases,
    } = flow;

    const renderPhase = () => {
        switch (currentPhase) {
            case PHASES.PREP:
                return (
                    <PrepScreen
                        prepTasks={flow.prepTasks}
                        togglePrepTask={flow.togglePrepTask}
                    />
                );
            case PHASES.SYNC:
                return (
                    <SyncScreen
                        creatureId={flow.creatureId}
                        setCreatureId={flow.setCreatureId}
                        parentCalmLevel={flow.parentCalmLevel}
                        setParentCalmLevel={flow.setParentCalmLevel}
                    />
                );
            case PHASES.FEED:
                return (
                    <FeedScreen
                        feedTasks={flow.feedTasks}
                        toggleFeedTask={flow.toggleFeedTask}
                        parentCalmLevel={flow.parentCalmLevel}
                    />
                );
            case PHASES.SEED:
                return (
                    <SeedScreen
                        seedInput={flow.seedInput}
                        setSeedInput={flow.setSeedInput}
                        sendToN8N={flow.sendToN8N}
                        seedLoading={flow.seedLoading}
                        seedError={flow.seedError}
                        seedSubmitted={flow.seedSubmitted}
                    />
                );
            case PHASES.STORY:
                return (
                    <StoryScreen
                        story={flow.story}
                        storyProgress={flow.storyProgress}
                        storyPlaying={flow.storyPlaying}
                        setStoryPlaying={flow.setStoryPlaying}
                        setStoryProgress={flow.setStoryProgress}
                        markStoryComplete={flow.markStoryComplete}
                        parentCalmLevel={flow.parentCalmLevel}
                    />
                );
            case PHASES.SLEEP:
                return <SleepScreen resetFlow={flow.resetFlow} />;
            default:
                return null;
        }
    };

    const phaseIcons = {
        [PHASES.PREP]: ClipboardCheck,
        [PHASES.SYNC]: Sparkles,
        [PHASES.FEED]: Cookie,
        [PHASES.SEED]: Wand2,
        [PHASES.STORY]: BookOpen,
        [PHASES.SLEEP]: BedDouble,
    };

    return (
        <div className="min-h-screen bg-cream-100 flex flex-col relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute inset-0 bg-sleep-glow pointer-events-none" />

            {/* ── Top bar: Phase header + progress ── */}
            {showNavigation && (
                <motion.header
                    className="relative z-10 px-6 pt-6 pb-2"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <PhaseHeader phase={currentPhase} className="mb-4" />

                    {/* Stepper dots */}
                    <div className="flex items-center gap-1.5 mb-2">
                        {phases.map((p, i) => {
                            const PhaseIcon = phaseIcons[p];
                            const isActive = p === currentPhase;
                            const isDone = i < flow.phaseIndex;
                            return (
                                <div key={p} className="flex items-center gap-1.5">
                                    <motion.div
                                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                                            isActive
                                                ? 'bg-dream-glow text-white shadow-glow-sm'
                                                : isDone
                                                    ? 'bg-success/20 text-success border border-success/30'
                                                    : 'bg-white/60 text-sleep-400 border border-cream-300'
                                        }`}
                                        animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        {isDone ? (
                                            <Check className="w-3.5 h-3.5" />
                                        ) : (
                                            <PhaseIcon className="w-3.5 h-3.5" />
                                        )}
                                    </motion.div>
                                    {i < phases.length - 1 && (
                                        <div
                                            className={`w-4 h-0.5 rounded-full transition-colors ${
                                                isDone ? 'bg-success/40' : 'bg-cream-300'
                                            }`}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <SleepProgressBar
                        progress={overallProgress}
                        size="sm"
                        className="mt-1"
                    />
                </motion.header>
            )}

            {/* ── Main content area ── */}
            <main className="flex-1 relative z-10 px-6 py-6 overflow-y-auto">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentPhase}
                        variants={phaseVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={phaseTransition}
                        className="h-full"
                    >
                        {renderPhase()}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* ── Bottom navigation ── */}
            {showNavigation && (
                <motion.nav
                    className="relative z-10 px-6 pb-6 pt-2 flex items-center justify-between"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <motion.button
                        onClick={goBack}
                        disabled={!canGoBack}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-display font-semibold transition-all ${
                            canGoBack
                                ? 'bg-white/80 border-2 border-cream-300/60 text-sleep-700 hover:border-dream-glow/30'
                                : 'opacity-0 pointer-events-none'
                        }`}
                        whileTap={canGoBack ? { scale: 0.95 } : {}}
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                    </motion.button>

                    <span className="text-xs font-display font-semibold text-sleep-400">
                        {Math.round(phaseProgress * 100)}%
                    </span>

                    <motion.button
                        onClick={advancePhase}
                        disabled={!canAdvance}
                        className={`flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-sm font-display font-bold transition-all ${
                            canAdvance
                                ? 'bg-dream-glow text-white shadow-glow-sm hover:bg-dream-aurora active:scale-[0.98]'
                                : 'bg-cream-300/50 text-sleep-400 cursor-not-allowed'
                        }`}
                        whileTap={canAdvance ? { scale: 0.95 } : {}}
                    >
                        {currentPhase === PHASES.STORY ? 'Sleep' : 'Next'}
                        <ChevronRight className="w-4 h-4" />
                    </motion.button>
                </motion.nav>
            )}
        </div>
    );
}
