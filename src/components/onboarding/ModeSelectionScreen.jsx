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
    <div className="min-h-full flex flex-col items-center justify-center px-5 py-8 animate-fade-in text-cream-100">
      <motion.div
        className="w-16 h-16 bg-[#f8f1e7] rounded-[28px] shadow-card border border-white/40 flex items-center justify-center mb-6"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Moon className="w-8 h-8 text-dream-glow" />
      </motion.div>

      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#1b120c]/88 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-cream-400/65 font-body shadow-card backdrop-blur-md mb-4">
        <span>Choose your path</span>
      </div>

      <h1 className="text-3xl font-display font-bold text-cream-100 mb-2 text-center">
        How would you like to use DreamStation?
      </h1>
      <p className="text-sm text-cream-300/75 font-body mb-8 text-center max-w-sm leading-relaxed">
        You can change this later in Settings.
      </p>

      <div className="w-full max-w-md space-y-4">
        {/* Just Stories */}
        <button
          onClick={handleJustStoriesSelect}
          className={`w-full text-left p-5 rounded-[28px] border transition-all duration-200 ${
            selected === 'just_stories'
              ? 'border-dream-glow/35 bg-dream-glow/10 shadow-card'
              : 'border-white/10 bg-[#1b120c]/88 hover:border-dream-glow/20'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-[#140e0a]/82 border border-white/10 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-dream-glow" />
            </div>
            <div>
              <h3 className="font-display font-bold text-cream-100 mb-1">Just Stories</h3>
              <p className="text-xs text-cream-300/72 font-body leading-relaxed">
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
            className="glass-card-solid rounded-[24px] p-4 space-y-3"
          >
            <input
              type="text"
              value={justStoriesName}
              onChange={(e) => setJustStoriesName(e.target.value)}
              placeholder="Child's first name"
              className="input-field"
            />
            <input
              type="number"
              min="3"
              max="12"
              value={justStoriesAge}
              onChange={(e) => setJustStoriesAge(e.target.value)}
              placeholder="Age (3–12)"
              className="input-field"
            />
            <button
              onClick={handleJustStoriesSubmit}
              disabled={!justStoriesReady || isSaving}
              className={`w-full py-3 rounded-2xl font-display font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                !justStoriesReady || isSaving
                  ? 'bg-white/10 text-cream-400/55 cursor-not-allowed'
                  : 'bg-dream-glow text-white shadow-glow-sm hover:bg-dream-aurora active:scale-[0.98]'
              }`}
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
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
          className={`w-full text-left p-5 rounded-[28px] border transition-all duration-200 ${
            selected === 'full_programme'
              ? 'border-dream-glow/35 bg-dream-glow/10 shadow-card'
              : 'border-white/10 bg-[#1b120c]/88 hover:border-dream-glow/20'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-[#140e0a]/82 border border-white/10 flex items-center justify-center shrink-0">
              <Brain className="w-5 h-5 text-dream-glow" />
            </div>
            <div>
              <h3 className="font-display font-bold text-cream-100 mb-1">Full Programme</h3>
              <p className="text-xs text-cream-300/72 font-body leading-relaxed">
                Stories that respond to your child's emotional world, plus morning observations and weekly insights for you. Takes about 10 minutes to set up.
              </p>
              <span className="inline-block mt-2 px-2.5 py-1 bg-dream-glow/10 text-dream-glow rounded-full text-[10px] font-display font-semibold border border-dream-glow/20">
                Recommended for the trial
              </span>
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}
