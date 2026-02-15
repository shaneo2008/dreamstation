/**
 * 📖 StoryPlayer — N8N integration & audio playback for bedtime stories
 *
 * Handles:
 *   - Fetching story data (placeholder for N8N webhook integration)
 *   - Audio playback with progress tracking
 *   - Visual story card with glassmorphic styling
 *
 * Connects to your existing N8N workflows and audio services.
 */

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, Volume2, BookOpen } from 'lucide-react';

/**
 * @param {Object} props
 * @param {Object}   [props.story]       — Story object { title, description, audioUrl }
 * @param {Function} [props.onComplete]  — Called when story finishes playing
 * @param {Function} [props.onFetchStory]— Trigger N8N webhook to generate a story
 * @param {string}   [props.className]
 */
export default function StoryPlayer({
    story = null,
    onComplete,
    onFetchStory,
    className = '',
}) {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const togglePlay = useCallback(() => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    }, [isPlaying]);

    const handleTimeUpdate = useCallback(() => {
        if (!audioRef.current) return;
        const current = audioRef.current.currentTime;
        const total = audioRef.current.duration;
        setProgress(total > 0 ? current / total : 0);
    }, []);

    const handleLoadedMetadata = useCallback(() => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    }, []);

    const handleEnded = useCallback(() => {
        setIsPlaying(false);
        setProgress(1);
        onComplete?.();
    }, [onComplete]);

    const handleFetchStory = useCallback(async () => {
        setIsLoading(true);
        try {
            await onFetchStory?.();
        } finally {
            setIsLoading(false);
        }
    }, [onFetchStory]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`frost glass-interactive p-6 ${className}`}>
            <div className="flex items-center gap-3 mb-4">
                <BookOpen className="w-5 h-5 text-dream-glow" strokeWidth={1.5} />
                <h3 className="text-lg font-display font-semibold text-sleep-200">
                    Bedtime Story
                </h3>
            </div>

            <AnimatePresence mode="wait">
                {!story ? (
                    /* No story loaded — show fetch button */
                    <motion.div
                        key="no-story"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center py-8"
                    >
                        <p className="text-sm text-sleep-350 mb-4">
                            Generate a personalised bedtime story
                        </p>
                        <motion.button
                            onClick={handleFetchStory}
                            disabled={isLoading}
                            className="glass-surface px-6 py-3 text-sm font-medium text-dream-shimmer disabled:opacity-50"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <motion.div
                                        className="w-4 h-4 border-2 border-dream-glow border-t-transparent rounded-full"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    />
                                    Generating…
                                </span>
                            ) : (
                                "✨ Create tonight's story"
                            )}
                        </motion.button>
                    </motion.div>
                ) : (
                    /* Story loaded — show player */
                    <motion.div
                        key="story-loaded"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="mb-4">
                            <h4 className="text-base font-medium text-sleep-150">
                                {story.title}
                            </h4>
                            {story.description && (
                                <p className="text-xs text-sleep-400 mt-1 line-clamp-2">
                                    {story.description}
                                </p>
                            )}
                        </div>

                        {/* Audio element */}
                        {story.audioUrl && (
                            <audio
                                ref={audioRef}
                                src={story.audioUrl}
                                onTimeUpdate={handleTimeUpdate}
                                onLoadedMetadata={handleLoadedMetadata}
                                onEnded={handleEnded}
                                preload="metadata"
                            />
                        )}

                        {/* Progress bar */}
                        <div className="mb-3">
                            <div className="w-full h-1.5 rounded-full bg-sleep-800 overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{
                                        background: 'linear-gradient(90deg, #432e8a, #a78bfa)',
                                        width: `${progress * 100}%`,
                                    }}
                                    transition={{ duration: 0.1 }}
                                />
                            </div>
                            <div className="flex justify-between mt-1 text-[10px] text-sleep-450 font-mono">
                                <span>{formatTime(progress * duration)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-center gap-4">
                            <motion.button
                                onClick={togglePlay}
                                className="glass-surface w-12 h-12 rounded-full flex items-center justify-center"
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {isPlaying ? (
                                    <Pause className="w-5 h-5 text-dream-shimmer" />
                                ) : (
                                    <Play className="w-5 h-5 text-dream-shimmer ml-0.5" />
                                )}
                            </motion.button>

                            <motion.button
                                className="glass-surface w-9 h-9 rounded-full flex items-center justify-center"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <SkipForward className="w-4 h-4 text-sleep-350" />
                            </motion.button>

                            <motion.button
                                className="glass-surface w-9 h-9 rounded-full flex items-center justify-center"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Volume2 className="w-4 h-4 text-sleep-350" />
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
