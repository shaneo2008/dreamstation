/**
 * 🌙 PhaseHeader — Displays current sleep phase with animated transitions
 * RESTYLED: Warm pastel Finch aesthetic
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
    ClipboardCheck,
    Sparkles,
    Cookie,
    Wand2,
    BookOpen,
    BedDouble,
} from 'lucide-react';

const PHASE_CONFIG = {
    prep: {
        icon: ClipboardCheck,
        title: 'Prep',
        subtitle: 'Get ready for bedtime',
        color: 'text-pastel-lavender',
        bg: 'bg-pastel-lavender/15',
        border: 'border-pastel-lavender/30',
    },
    sync: {
        icon: Sparkles,
        title: 'Sync',
        subtitle: 'Meet your sleep creature',
        color: 'text-dream-glow',
        bg: 'bg-dream-glow/10',
        border: 'border-dream-glow/25',
    },
    feed: {
        icon: Cookie,
        title: 'Feed',
        subtitle: 'Complete tasks to feed your creature',
        color: 'text-pastel-peach',
        bg: 'bg-pastel-peach/15',
        border: 'border-pastel-peach/30',
    },
    seed: {
        icon: Wand2,
        title: 'Seed',
        subtitle: 'Create your bedtime story',
        color: 'text-pastel-mint',
        bg: 'bg-pastel-mint/15',
        border: 'border-pastel-mint/30',
    },
    story: {
        icon: BookOpen,
        title: 'Story',
        subtitle: 'Listen & wind down',
        color: 'text-pastel-sky',
        bg: 'bg-pastel-sky/15',
        border: 'border-pastel-sky/30',
    },
    sleep: {
        icon: BedDouble,
        title: 'Sleep',
        subtitle: 'Goodnight, sleep tight',
        color: 'text-pastel-lavender',
        bg: 'bg-pastel-lavender/10',
        border: 'border-pastel-lavender/20',
    },
};

export default function PhaseHeader({ phase = 'prep', className = '' }) {
    const config = PHASE_CONFIG[phase] || PHASE_CONFIG.prep;
    const Icon = config.icon;

    return (
        <AnimatePresence mode="wait">
            <motion.header
                key={phase}
                className={`flex items-center gap-4 ${className}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            >
                {/* Phase icon */}
                <motion.div
                    className={`flex items-center justify-center w-12 h-12 rounded-2xl ${config.bg} border ${config.border}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                >
                    <Icon className={`w-6 h-6 ${config.color}`} strokeWidth={1.5} />
                </motion.div>

                {/* Text */}
                <div>
                    <h2 className="text-xl font-display font-bold text-sleep-900">
                        {config.title}
                    </h2>
                    <p className="text-sm text-sleep-500 mt-0.5">{config.subtitle}</p>
                </div>
            </motion.header>
        </AnimatePresence>
    );
}
