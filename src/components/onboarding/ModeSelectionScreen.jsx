import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Moon, BookOpen, Brain, ArrowRight } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../lib/supabase'

/**
 * Mode Selection Screen — shown after first free story
 * Two paths: Just Stories (minimal profile) or Full Programme (full intake)
 */
export default function ModeSelectionScreen({ onSelectJustStories, onSelectFullProgramme }) {
  const { user } = useAuth()
  const [selected, setSelected] = useState(null)
  const [justStoriesName, setJustStoriesName] = useState('')
  const [justStoriesAge, setJustStoriesAge] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showJustStoriesForm, setShowJustStoriesForm] = useState(false)

  const handleJustStoriesSelect = () => {
    setSelected('just_stories')
    setShowJustStoriesForm(true)
  }

  const handleJustStoriesSubmit = async () => {
    const ageNum = parseInt(justStoriesAge)
    if (!justStoriesName.trim() || ageNum < 3 || ageNum > 12) return

    try {
      setIsSaving(true)
      const profile = await db.createChildProfile({
        user_id: user.id,
        name: justStoriesName.trim(),
        age: ageNum,
        mode: 'just_stories',
        onboarding_completed: true,
      })
      setIsSaving(false)
      onSelectJustStories?.(profile.id)
    } catch (err) {
      console.error('Error creating Just Stories profile:', err)
      setIsSaving(false)
    }
  }

  const handleFullProgrammeSelect = () => {
    setSelected('full_programme')
    setShowJustStoriesForm(false)
    onSelectFullProgramme?.()
  }

  const justStoriesReady = justStoriesName.trim() && parseInt(justStoriesAge) >= 3 && parseInt(justStoriesAge) <= 12

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-5 py-8 animate-fade-in">
      <motion.div
        className="w-16 h-16 bg-white rounded-3xl shadow-soft border-2 border-cream-300/50 flex items-center justify-center mb-6"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Moon className="w-8 h-8 text-dream-glow" />
      </motion.div>

      <h1 className="text-2xl font-display font-bold text-sleep-900 mb-2 text-center">
        How would you like to use DreamStation?
      </h1>
      <p className="text-sm text-sleep-500 font-body mb-8 text-center max-w-sm">
        You can change this later in Settings.
      </p>

      <div className="w-full max-w-md space-y-4">
        {/* Just Stories */}
        <button
          onClick={handleJustStoriesSelect}
          className={`w-full text-left p-5 rounded-3xl border-2 transition-all duration-200 ${
            selected === 'just_stories'
              ? 'border-dream-glow bg-dream-stardust/20'
              : 'border-cream-300/60 bg-white/80 hover:border-dream-glow/30'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-cream-200 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-sleep-600" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sleep-900 mb-1">Just Stories</h3>
              <p className="text-xs text-sleep-500 font-body leading-relaxed">
                Beautiful bedtime stories personalised with your child's name. Quick setup — just a name and age.
              </p>
            </div>
          </div>
        </button>

        {/* Just Stories mini form */}
        {showJustStoriesForm && selected === 'just_stories' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-white/80 border-2 border-cream-300/50 rounded-2xl p-4 space-y-3"
          >
            <input
              type="text"
              value={justStoriesName}
              onChange={(e) => setJustStoriesName(e.target.value)}
              placeholder="Child's first name"
              className="w-full px-4 py-3 bg-cream-100/80 border-2 border-cream-300/60 rounded-2xl text-sm text-sleep-900 placeholder-sleep-400 font-body focus:border-dream-glow/50 focus:outline-none transition-all"
            />
            <input
              type="number"
              min="3"
              max="12"
              value={justStoriesAge}
              onChange={(e) => setJustStoriesAge(e.target.value)}
              placeholder="Age (3–12)"
              className="w-full px-4 py-3 bg-cream-100/80 border-2 border-cream-300/60 rounded-2xl text-sm text-sleep-900 placeholder-sleep-400 font-body focus:border-dream-glow/50 focus:outline-none transition-all"
            />
            <button
              onClick={handleJustStoriesSubmit}
              disabled={!justStoriesReady || isSaving}
              className={`w-full py-3 rounded-2xl font-display font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                !justStoriesReady || isSaving
                  ? 'bg-cream-300/50 text-sleep-400 cursor-not-allowed'
                  : 'bg-dream-glow text-white shadow-glow-sm hover:bg-dream-aurora active:scale-[0.98]'
              }`}
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-cream-300 border-t-white rounded-full animate-spin" />
                  Saving…
                </span>
              ) : (
                <>Start creating <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </motion.div>
        )}

        {/* Full Programme */}
        <button
          onClick={handleFullProgrammeSelect}
          className={`w-full text-left p-5 rounded-3xl border-2 transition-all duration-200 ${
            selected === 'full_programme'
              ? 'border-dream-glow bg-dream-stardust/20'
              : 'border-cream-300/60 bg-white/80 hover:border-dream-glow/30'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-dream-stardust/40 flex items-center justify-center shrink-0">
              <Brain className="w-5 h-5 text-dream-glow" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sleep-900 mb-1">Full Programme</h3>
              <p className="text-xs text-sleep-500 font-body leading-relaxed">
                Stories that respond to your child's emotional world, plus morning observations and weekly insights for you. Takes about 10 minutes to set up.
              </p>
              <span className="inline-block mt-2 px-2.5 py-1 bg-dream-stardust/30 text-dream-aurora rounded-full text-[10px] font-display font-semibold border border-dream-glow/20">
                Recommended for the trial
              </span>
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}
