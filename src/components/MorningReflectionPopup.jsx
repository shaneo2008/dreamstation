import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, HelpCircle, X, MessageSquare, Check } from 'lucide-react'
import { db } from '../lib/supabase'

const REACTION_OPTIONS = [
  { value: 'noticed', label: 'Noticed this', icon: Eye, color: 'bg-success hover:bg-success/80' },
  { value: 'not_sure', label: 'Not sure', icon: HelpCircle, color: 'bg-pastel-lavender hover:bg-pastel-lavender/80' },
  { value: 'didnt_see', label: "Didn't see that", icon: X, color: 'bg-cream-300 hover:bg-cream-400 text-sleep-700' },
]

const cardVariants = {
  enter: { opacity: 0, x: 60, scale: 0.95 },
  center: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: -60, scale: 0.95 },
}

/**
 * Morning Reflection Popup
 * 
 * Shows 3 observation cards one at a time, parent reacts with one tap each.
 * Optional note after all reactions. Then closes.
 * 
 * Props:
 *   reactionRecord — the morning_reactions row from Supabase (contains observations, id, session_id, child_id)
 *   childName — for display
 *   onComplete — callback when popup closes
 */
export default function MorningReflectionPopup({ reactionRecord, childName, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [reactions, setReactions] = useState([])
  const [showNote, setShowNote] = useState(false)
  const [parentNote, setParentNote] = useState('')
  const [showCompletion, setShowCompletion] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const observations = useMemo(() => reactionRecord?.observations || [], [reactionRecord?.observations])

  const handleReaction = useCallback(async (reaction) => {
    const newReactions = [...reactions, reaction]
    setReactions(newReactions)

    if (currentIndex < observations.length - 1) {
      // Move to next card
      setCurrentIndex(prev => prev + 1)
    } else {
      // All reactions done — show optional note
      setShowNote(true)
    }

    // Save progress incrementally (partially_complete if not all done)
    try {
      await db.updateMorningReaction(reactionRecord.id, {
        reactions: newReactions.map((r, i) => ({
          type: observations[i]?.type,
          reaction: r,
        })),
        partially_complete: newReactions.length < observations.length,
      })
    } catch (err) {
      console.warn('Failed to save reaction progress:', err.message)
    }
  }, [currentIndex, observations, reactions, reactionRecord?.id])

  const handleComplete = useCallback(async () => {
    setIsSaving(true)
    try {
      await db.updateMorningReaction(reactionRecord.id, {
        reactions: reactions.map((r, i) => ({
          type: observations[i]?.type,
          reaction: r,
        })),
        parent_note: parentNote.trim() || null,
        partially_complete: false,
        reacted_at: new Date().toISOString(),
      })
    } catch (err) {
      console.error('Failed to save final reactions:', err.message)
    }
    setIsSaving(false)
    setShowCompletion(true)

    // Auto-close after brief delay
    setTimeout(() => {
      onComplete?.()
    }, 2500)
  }, [reactions, observations, parentNote, reactionRecord?.id, onComplete])

  const handleDismiss = useCallback(async () => {
    // Save whatever we have so far
    if (reactions.length > 0) {
      try {
        await db.updateMorningReaction(reactionRecord.id, {
          reactions: reactions.map((r, i) => ({
            type: observations[i]?.type,
            reaction: r,
          })),
          partially_complete: true,
        })
      } catch (err) {
        console.warn('Failed to save partial reactions:', err.message)
      }
    }
    onComplete?.()
  }, [reactions, observations, reactionRecord?.id, onComplete])

  if (!reactionRecord || observations.length === 0) return null

  // Completion screen
  if (showCompletion) {
    return (
      <div className="fixed inset-0 bg-sleep-950/40 backdrop-blur-sm flex items-center justify-center z-[60] px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/95 backdrop-blur-lg border-2 border-cream-300/50 rounded-3xl p-8 max-w-sm w-full shadow-dream text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="w-14 h-14 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Check className="w-7 h-7 text-success" />
          </motion.div>
          <p className="text-sm text-sleep-600 font-body">
            Thanks. We'll include this in your weekly reflection.
          </p>
        </motion.div>
      </div>
    )
  }

  // Optional note screen
  if (showNote) {
    return (
      <div className="fixed inset-0 bg-sleep-950/40 backdrop-blur-sm flex items-center justify-center z-[60] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 backdrop-blur-lg border-2 border-cream-300/50 rounded-3xl p-6 max-w-sm w-full shadow-dream"
        >
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-dream-glow" />
            <h3 className="text-lg font-display font-bold text-sleep-900">Anything else?</h3>
          </div>
          <p className="text-xs text-sleep-500 font-body mb-3">
            Anything on your mind about last night? (optional)
          </p>
          <textarea
            value={parentNote}
            onChange={(e) => setParentNote(e.target.value.slice(0, 300))}
            placeholder="Optional..."
            rows={3}
            className="w-full px-4 py-3 bg-cream-100/80 border-2 border-cream-300/60 rounded-2xl text-sm text-sleep-900 placeholder-sleep-400 font-body resize-none focus:border-dream-glow/50 focus:outline-none transition-all mb-2"
          />
          <p className="text-[10px] text-sleep-400 font-body mb-4 text-right">{parentNote.length}/300</p>
          <button
            onClick={handleComplete}
            disabled={isSaving}
            className="w-full py-3 bg-dream-glow hover:bg-dream-aurora text-white rounded-2xl font-display font-bold text-sm transition-all shadow-glow-sm active:scale-[0.98] disabled:opacity-60"
          >
            {isSaving ? 'Saving…' : 'Done'}
          </button>
          <button
            onClick={handleComplete}
            className="w-full py-2 mt-2 text-sleep-400 hover:text-sleep-600 text-xs font-body transition-colors"
          >
            Skip
          </button>
        </motion.div>
      </div>
    )
  }

  // Observation cards
  const currentObs = observations[currentIndex]

  return (
    <div className="fixed inset-0 bg-sleep-950/40 backdrop-blur-sm flex items-center justify-center z-[60] px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/95 backdrop-blur-lg border-2 border-cream-300/50 rounded-3xl p-6 max-w-sm w-full shadow-dream"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-display font-bold text-sleep-900">{childName}'s night</h3>
            <p className="text-xs text-sleep-500 font-body">Here's what we noticed from last night.</p>
          </div>
          <button onClick={handleDismiss} className="p-1.5 text-sleep-400 hover:text-sleep-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5 mb-5">
          {observations.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i < currentIndex ? 'bg-dream-glow' : i === currentIndex ? 'bg-dream-glow/50' : 'bg-cream-300/60'
              }`}
            />
          ))}
        </div>

        {/* Observation card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            variants={cardVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Type badge */}
            <div className="mb-3">
              <span className="inline-block px-2.5 py-1 bg-dream-stardust/30 text-dream-aurora rounded-full text-[10px] font-display font-semibold border border-dream-glow/20 capitalize">
                {currentObs?.type || 'observation'}
              </span>
            </div>

            {/* Observation text */}
            <p className="text-sm text-sleep-800 font-body leading-relaxed mb-6 min-h-[60px]">
              {currentObs?.text || 'Loading observation...'}
            </p>

            {/* Reaction buttons */}
            <div className="space-y-2">
              {REACTION_OPTIONS.map(opt => {
                const Icon = opt.icon
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleReaction(opt.value)}
                    className={`w-full py-3 px-4 ${opt.color} text-white rounded-2xl font-display font-semibold text-sm transition-all active:scale-[0.97] flex items-center justify-center gap-2`}
                  >
                    <Icon className="w-4 h-4" />
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Card counter */}
        <p className="text-[10px] text-sleep-400 font-body text-center mt-4">
          {currentIndex + 1} of {observations.length}
        </p>
      </motion.div>
    </div>
  )
}
