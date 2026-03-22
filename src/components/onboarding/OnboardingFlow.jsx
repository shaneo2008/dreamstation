import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Plus, X, Moon, Heart, Brain, Bed, Shield, Users, Check } from 'lucide-react'
import { useOnboardingStore } from '../../hooks/useOnboardingStore'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../lib/supabase'

const fadeVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
}

const NEURO_OPTIONS = [
  'Finds it hard to sit still or slow down',
  'Gets overwhelmed by noise, crowds, or busy environments',
  'Worries more than other kids their age',
  'Finds transitions and changes to routine really difficult',
  'Gets very focused on specific interests',
  'Finds social situations draining even if they enjoy them',
  'Finds it hard to get to sleep most nights',
  'Has been assessed for or diagnosed with ADHD',
  'Has been assessed for or diagnosed with autism',
  'Has been assessed for or diagnosed with anxiety',
  'Has sensory sensitivities (textures, sounds, tags, lights)',
  'None of these really fit',
  'Not sure',
]

const FEAR_OPTIONS = [
  'Starting something new (school, activity, place)',
  'Making or keeping friends',
  'Getting things wrong or not being good enough',
  'Loud or overwhelming environments',
  'Something bad happening to someone they love',
  'Their body (illness, pain, physical changes)',
  'Being left out or excluded',
  'The dark or being alone at night',
  'Changes to routine or plans',
  'Being watched or performing in front of others',
  'Not sure',
  'None of these',
]

const NIGHT_WAKING_OPTIONS = [
  'Almost every night',
  'A few times a week',
  'Once or twice a week',
  'Occasionally',
  'Rarely or never',
]

const GENDER_OPTIONS = [
  { value: 'Girl', label: 'Girl' },
  { value: 'Boy', label: 'Boy' },
  { value: 'They/them', label: 'We use they/them' },
  { value: 'Skip', label: 'Skip this' },
]

const RELATIONSHIP_OPTIONS = ['Parent', 'Sibling', 'Grandparent', 'Friend', 'Teacher', 'Other']

/* ─────────────────────────────────────────────
   Progress Bar
   ───────────────────────────────────────────── */
function ProgressBar({ current, total }) {
  return (
    <div className="flex items-center gap-1.5 mb-6">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
            i < current ? 'bg-dream-glow' : i === current ? 'bg-dream-glow/50' : 'bg-cream-300/60'
          }`}
        />
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Checkbox Item
   ───────────────────────────────────────────── */
function CheckItem({ label, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`w-full text-left px-4 py-3 rounded-2xl border-2 transition-all duration-200 flex items-center gap-3 ${
        checked
          ? 'border-dream-glow/50 bg-dream-stardust/30'
          : 'border-cream-300/60 bg-white/60 hover:border-dream-glow/20'
      }`}
    >
      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
        checked ? 'bg-dream-glow border-dream-glow' : 'border-cream-400'
      }`}>
        {checked && <Check className="w-3 h-3 text-white" />}
      </div>
      <span className="text-sm text-sleep-800 font-body">{label}</span>
    </button>
  )
}

/* ─────────────────────────────────────────────
   Radio Item
   ───────────────────────────────────────────── */
function RadioItem({ label, selected, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`px-4 py-3 rounded-2xl border-2 transition-all duration-200 text-sm font-body ${
        selected
          ? 'border-dream-glow bg-dream-stardust/30 text-sleep-900'
          : 'border-cream-300/60 bg-white/60 text-sleep-600 hover:border-dream-glow/20'
      }`}
    >
      {label}
    </button>
  )
}

/* ─────────────────────────────────────────────
   Slider Field
   ───────────────────────────────────────────── */
function SliderField({ label, hint, value, onChange }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-display font-semibold text-sleep-800">{label}</label>
      <p className="text-xs text-sleep-500 font-body">{hint}</p>
      <div className="flex items-center gap-3">
        <span className="text-xs text-sleep-400 font-body w-4">1</span>
        <input
          type="range"
          min="1"
          max="10"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="flex-1 accent-dream-glow"
        />
        <span className="text-xs text-sleep-400 font-body w-4">10</span>
        <span className="w-8 text-center text-sm font-display font-bold text-dream-glow">{value}</span>
      </div>
    </div>
  )
}

/* ═════════════════════════════════════════════
   SCREEN: Welcome
   ═════════════════════════════════════════════ */
function WelcomeScreen() {
  const { nextScreen } = useOnboardingStore()
  return (
    <div className="flex flex-col items-center text-center px-2">
      <motion.div
        className="w-20 h-20 bg-white rounded-3xl shadow-soft border-2 border-cream-300/50 flex items-center justify-center mb-6"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Moon className="w-10 h-10 text-dream-glow" />
      </motion.div>
      <h1 className="text-2xl font-display font-bold text-sleep-900 mb-4">Let's get to know your child</h1>
      <div className="text-sm text-sleep-600 font-body space-y-3 max-w-sm mb-8">
        <p>
          We're going to ask you a few things about your child so the stories feel like they were made just for them — and so we can help you notice what's on their mind over the weeks ahead.
        </p>
        <p>
          The more honest you are here the more useful this will be. There are no wrong answers, and you can update everything later in Settings.
        </p>
        <p className="text-sleep-400">This takes about 10 minutes.</p>
      </div>
      <button
        onClick={nextScreen}
        className="w-full max-w-xs bg-dream-glow hover:bg-dream-aurora text-white font-display font-bold py-3.5 rounded-2xl transition-all shadow-glow-sm active:scale-[0.98]"
      >
        Let's go
      </button>
    </div>
  )
}

/* ═════════════════════════════════════════════
   SCREEN: Section 1 — Who Is Your Child
   ═════════════════════════════════════════════ */
function Section1Screen() {
  const { childName, childAge, genderPronoun, parentDescription, setField } = useOnboardingStore()
  const ageNum = parseInt(childAge)
  const ageOutOfRange = childAge && (ageNum < 3 || ageNum > 12)

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <Heart className="w-5 h-5 text-dream-glow" />
        <h2 className="text-xl font-display font-bold text-sleep-900">Who is your child?</h2>
      </div>
      <p className="text-sm text-sleep-600 font-body">
        Let's start with the basics. We'll use these to build a world that feels like it was made just for them.
      </p>

      {/* Name */}
      <div>
        <label className="block text-sm font-display font-semibold text-sleep-700 mb-1.5">What's their name?</label>
        <p className="text-xs text-sleep-400 font-body mb-2">First name only — this appears in every story</p>
        <input
          type="text"
          value={childName}
          onChange={(e) => setField('childName', e.target.value)}
          placeholder="First name"
          className="w-full px-4 py-3 bg-white/80 border-2 border-cream-300/60 rounded-2xl text-sm text-sleep-900 placeholder-sleep-400 font-body focus:border-dream-glow/50 focus:outline-none transition-all"
        />
      </div>

      {/* Age */}
      <div>
        <label className="block text-sm font-display font-semibold text-sleep-700 mb-1.5">How old are they?</label>
        <input
          type="number"
          min="3"
          max="12"
          value={childAge}
          onChange={(e) => setField('childAge', e.target.value)}
          placeholder="Age (3–12)"
          className="w-full px-4 py-3 bg-white/80 border-2 border-cream-300/60 rounded-2xl text-sm text-sleep-900 placeholder-sleep-400 font-body focus:border-dream-glow/50 focus:outline-none transition-all"
        />
        {ageOutOfRange && (
          <p className="text-xs text-danger mt-1 font-body">DreamStation works best for ages 3–12</p>
        )}
      </div>

      {/* Gender */}
      <div>
        <label className="block text-sm font-display font-semibold text-sleep-700 mb-1.5">Are they a girl, boy, or something else?</label>
        <p className="text-xs text-sleep-400 font-body mb-2">This helps us get pronouns right in the stories</p>
        <div className="grid grid-cols-2 gap-2">
          {GENDER_OPTIONS.map(opt => (
            <RadioItem
              key={opt.value}
              label={opt.label}
              selected={genderPronoun === opt.value}
              onChange={() => setField('genderPronoun', opt.value)}
            />
          ))}
        </div>
      </div>

      {/* Parent description */}
      <div>
        <label className="block text-sm font-display font-semibold text-sleep-700 mb-1.5">
          Describe them in a sentence — the way you'd describe them to someone who'd never met them.
        </label>
        <p className="text-xs text-sleep-400 font-body mb-2">
          e.g. "She's incredibly imaginative but finds the world a bit overwhelming sometimes" or "He's the funniest kid in the room until he's not, and then everything falls apart"
        </p>
        <textarea
          value={parentDescription}
          onChange={(e) => setField('parentDescription', e.target.value)}
          placeholder="Tell us about them..."
          rows={3}
          className="w-full px-4 py-3 bg-white/80 border-2 border-cream-300/60 rounded-2xl text-sm text-sleep-900 placeholder-sleep-400 font-body resize-none focus:border-dream-glow/50 focus:outline-none transition-all"
        />
        {parentDescription && parentDescription.length < 10 && (
          <p className="text-xs text-sleep-400 mt-1 font-body">A bit more would really help us — even one full sentence</p>
        )}
      </div>
    </div>
  )
}

/* ═════════════════════════════════════════════
   SCREEN: Section 2 — Their Nervous System
   ═════════════════════════════════════════════ */
function Section2Screen() {
  const { neuroFlags, neuroNotes, setNeuroFlag, setField } = useOnboardingStore()

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <Brain className="w-5 h-5 text-dream-glow" />
        <h2 className="text-xl font-display font-bold text-sleep-900">How does their nervous system work?</h2>
      </div>
      <div className="text-sm text-sleep-600 font-body space-y-2">
        <p>Every child's nervous system is different. This helps us understand how yours experiences the world — so the stories and the observations we share with you actually make sense for them.</p>
        <p>Tick anything that feels familiar. You don't need a diagnosis.</p>
      </div>

      <div>
        <label className="block text-sm font-display font-semibold text-sleep-700 mb-2">Do any of these sound like your child?</label>
        <p className="text-xs text-sleep-400 font-body mb-3">Select all that apply</p>
        <div className="space-y-2">
          {NEURO_OPTIONS.map(option => (
            <CheckItem
              key={option}
              label={option}
              checked={neuroFlags.includes(option)}
              onChange={() => setNeuroFlag(option)}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-display font-semibold text-sleep-700 mb-1.5">
          Anything else you'd like us to know about how they experience the world?
        </label>
        <p className="text-xs text-sleep-400 font-body mb-2">Optional — anything not covered above</p>
        <textarea
          value={neuroNotes}
          onChange={(e) => setField('neuroNotes', e.target.value)}
          placeholder="Anything else..."
          rows={3}
          className="w-full px-4 py-3 bg-white/80 border-2 border-cream-300/60 rounded-2xl text-sm text-sleep-900 placeholder-sleep-400 font-body resize-none focus:border-dream-glow/50 focus:outline-none transition-all"
        />
      </div>
    </div>
  )
}

/* ═════════════════════════════════════════════
   SCREEN: Section 3 — What Bedtime Looks Like
   ═════════════════════════════════════════════ */
function Section3Screen() {
  const { bedtimeDescription, nightWakingFrequency, setField } = useOnboardingStore()

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <Bed className="w-5 h-5 text-dream-glow" />
        <h2 className="text-xl font-display font-bold text-sleep-900">Tell us about bedtime</h2>
      </div>
      <p className="text-sm text-sleep-600 font-body">
        Honestly — what does a hard bedtime look like in your house? Don't worry, we've heard it all.
      </p>

      <div>
        <label className="block text-sm font-display font-semibold text-sleep-700 mb-1.5">
          When bedtime is difficult, what does that usually look like?
        </label>
        <p className="text-xs text-sleep-400 font-body mb-2">
          e.g. "She finds a reason to get up every five minutes" or "He completely loses it if the routine changes even slightly" or "She just cannot switch her brain off"
        </p>
        <textarea
          value={bedtimeDescription}
          onChange={(e) => setField('bedtimeDescription', e.target.value)}
          placeholder="What does a hard bedtime look like..."
          rows={3}
          className="w-full px-4 py-3 bg-white/80 border-2 border-cream-300/60 rounded-2xl text-sm text-sleep-900 placeholder-sleep-400 font-body resize-none focus:border-dream-glow/50 focus:outline-none transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-display font-semibold text-sleep-700 mb-2">
          How often does your child wake in the night?
        </label>
        <div className="space-y-2">
          {NIGHT_WAKING_OPTIONS.map(option => (
            <RadioItem
              key={option}
              label={option}
              selected={nightWakingFrequency === option}
              onChange={() => setField('nightWakingFrequency', option)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ═════════════════════════════════════════════
   SCREEN: Section 4 — What They Worry About
   ═════════════════════════════════════════════ */
function Section4Screen() {
  const { fearFlags, currentStressors, setFearFlag, setField } = useOnboardingStore()

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <Shield className="w-5 h-5 text-dream-glow" />
        <h2 className="text-xl font-display font-bold text-sleep-900">What's on their mind?</h2>
      </div>
      <p className="text-sm text-sleep-600 font-body">
        Children often show us what they're worried about before they tell us. This helps us notice when those themes come up in their stories.
      </p>

      <div>
        <label className="block text-sm font-display font-semibold text-sleep-700 mb-1.5">
          Does your child worry about any of these? Tick anything that feels true.
        </label>
        <p className="text-xs text-sleep-400 font-body mb-3">You know them best — go with your gut</p>
        <div className="space-y-2">
          {FEAR_OPTIONS.map(option => (
            <CheckItem
              key={option}
              label={option}
              checked={fearFlags.includes(option)}
              onChange={() => setFearFlag(option)}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-display font-semibold text-sleep-700 mb-1.5">
          Is there anything happening in their life right now that we should know about?
        </label>
        <p className="text-xs text-sleep-400 font-body mb-2">
          e.g. "She's nervous about a big family event next week" or "His best friend just moved schools" or "We have a new baby at home". Big things and small things both count.
        </p>
        <textarea
          value={currentStressors}
          onChange={(e) => setField('currentStressors', e.target.value)}
          placeholder="Anything happening right now... (optional)"
          rows={3}
          className="w-full px-4 py-3 bg-white/80 border-2 border-cream-300/60 rounded-2xl text-sm text-sleep-900 placeholder-sleep-400 font-body resize-none focus:border-dream-glow/50 focus:outline-none transition-all"
        />
      </div>
    </div>
  )
}

/* ═════════════════════════════════════════════
   SCREEN: Section 5 — Their World
   ═════════════════════════════════════════════ */
function Section5Screen() {
  const { allies, pets, socialDifficulty, addAlly, removeAlly, updateAlly, addPet, removePet, updatePet, setField } = useOnboardingStore()

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <Users className="w-5 h-5 text-dream-glow" />
        <h2 className="text-xl font-display font-bold text-sleep-900">Their world</h2>
      </div>
      <p className="text-sm text-sleep-600 font-body">
        Almost done. This helps us put the right people in their stories — and notice when they keep coming up.
      </p>

      {/* Allies */}
      <div>
        <label className="block text-sm font-display font-semibold text-sleep-700 mb-1.5">
          Who are the important people in their life?
        </label>
        <p className="text-xs text-sleep-400 font-body mb-3">Add family members, close friends, anyone who matters to them</p>
        <div className="space-y-3">
          {allies.map((ally, i) => (
            <div key={i} className="flex gap-2 items-start">
              <input
                type="text"
                value={ally.name}
                onChange={(e) => updateAlly(i, 'name', e.target.value)}
                placeholder="Name"
                className="flex-1 px-3 py-2.5 bg-white/80 border-2 border-cream-300/60 rounded-xl text-sm text-sleep-900 placeholder-sleep-400 font-body focus:border-dream-glow/50 focus:outline-none transition-all"
              />
              <select
                value={ally.relationship}
                onChange={(e) => updateAlly(i, 'relationship', e.target.value)}
                className="px-3 py-2.5 bg-white/80 border-2 border-cream-300/60 rounded-xl text-sm text-sleep-900 font-body focus:border-dream-glow/50 focus:outline-none transition-all"
              >
                <option value="">Relationship</option>
                {RELATIONSHIP_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              {allies.length > 1 && (
                <button onClick={() => removeAlly(i)} className="p-2 text-danger/60 hover:text-danger transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addAlly}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-display font-semibold text-dream-glow hover:text-dream-aurora transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add another person
          </button>
        </div>
      </div>

      {/* Pets */}
      <div>
        <label className="block text-sm font-display font-semibold text-sleep-700 mb-1.5">Any pets?</label>
        <div className="space-y-3">
          {pets.map((pet, i) => (
            <div key={i} className="flex gap-2 items-start">
              <input
                type="text"
                value={pet.name}
                onChange={(e) => updatePet(i, 'name', e.target.value)}
                placeholder="Pet's name"
                className="flex-1 px-3 py-2.5 bg-white/80 border-2 border-cream-300/60 rounded-xl text-sm text-sleep-900 placeholder-sleep-400 font-body focus:border-dream-glow/50 focus:outline-none transition-all"
              />
              <input
                type="text"
                value={pet.type}
                onChange={(e) => updatePet(i, 'type', e.target.value)}
                placeholder="Type (dog, cat...)"
                className="flex-1 px-3 py-2.5 bg-white/80 border-2 border-cream-300/60 rounded-xl text-sm text-sleep-900 placeholder-sleep-400 font-body focus:border-dream-glow/50 focus:outline-none transition-all"
              />
              <button onClick={() => removePet(i)} className="p-2 text-danger/60 hover:text-danger transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            onClick={addPet}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-display font-semibold text-dream-glow hover:text-dream-aurora transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add a pet
          </button>
        </div>
      </div>

      {/* Social difficulty */}
      <div>
        <label className="block text-sm font-display font-semibold text-sleep-700 mb-1.5">
          Is there anyone or anything causing difficulty for them socially right now?
        </label>
        <p className="text-xs text-sleep-400 font-body mb-2">
          e.g. "There's a kid at school who's been unkind" or "She's finding it hard since her best friend moved class". Optional — skip if nothing comes to mind.
        </p>
        <textarea
          value={socialDifficulty}
          onChange={(e) => setField('socialDifficulty', e.target.value)}
          placeholder="Optional..."
          rows={3}
          className="w-full px-4 py-3 bg-white/80 border-2 border-cream-300/60 rounded-2xl text-sm text-sleep-900 placeholder-sleep-400 font-body resize-none focus:border-dream-glow/50 focus:outline-none transition-all"
        />
      </div>
    </div>
  )
}

/* ═════════════════════════════════════════════
   SCREEN: Completion
   ═════════════════════════════════════════════ */
function CompletionScreen() {
  const { childName, nextScreen } = useOnboardingStore()

  return (
    <div className="flex flex-col items-center text-center px-2">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mb-6"
      >
        <Check className="w-10 h-10 text-success" />
      </motion.div>
      <h1 className="text-2xl font-display font-bold text-sleep-900 mb-4">You're all set</h1>
      <div className="text-sm text-sleep-600 font-body space-y-3 max-w-sm mb-8">
        <p>We've got everything we need to get started.</p>
        <p>
          Every story from tonight will be built around <span className="font-bold text-dream-glow">{childName || 'your child'}</span>. And each morning after a story night, we'll share a small observation about what came up — things you might want to notice through the day.
        </p>
        <p>You can update anything in Settings at any time.</p>
      </div>
      <button
        onClick={nextScreen}
        className="w-full max-w-xs bg-dream-glow hover:bg-dream-aurora text-white font-display font-bold py-3.5 rounded-2xl transition-all shadow-glow-sm active:scale-[0.98]"
      >
        One last thing — a quick snapshot
      </button>
    </div>
  )
}

/* ═════════════════════════════════════════════
   SCREEN: Clinical Baseline Capture
   ═════════════════════════════════════════════ */
function BaselineScreen({ onComplete, isSaving }) {
  const store = useOnboardingStore()

  return (
    <div className="space-y-5">
      <div className="text-center mb-2">
        <h2 className="text-xl font-display font-bold text-sleep-900 mb-2">One last thing — a quick snapshot</h2>
        <p className="text-sm text-sleep-600 font-body">
          We'll ask you these same questions in three weeks so we can show you what's changed. Takes about a minute.
        </p>
      </div>

      <div className="bg-white/80 backdrop-blur-sm border-2 border-cream-300/50 rounded-3xl p-5 space-y-6">
        <SliderField
          label="The bedtime battle — how hard is it right now?"
          hint="1 = barely a struggle, 10 = full war every night"
          value={store.bedtimeResistance}
          onChange={(v) => store.setField('bedtimeResistance', v)}
        />
        <SliderField
          label="Time to fall asleep — once they're settled, how long does it usually take?"
          hint="1 = out quickly, 10 = takes forever"
          value={store.sleepOnsetLatency}
          onChange={(v) => store.setField('sleepOnsetLatency', v)}
        />
        <SliderField
          label="Night wakings — how often are you up in the night?"
          hint="1 = rarely, 10 = most nights"
          value={store.nightWakingScore}
          onChange={(v) => store.setField('nightWakingScore', v)}
        />
        <SliderField
          label="Your stress at bedtime — how are you finding it?"
          hint="1 = fine, 10 = I'm on my last nerve by 8pm"
          value={store.parentalStress}
          onChange={(v) => store.setField('parentalStress', v)}
        />
        <SliderField
          label="Their mood in the morning — how do they usually start the day?"
          hint="1 = bright and easy, 10 = really hard to get going"
          value={store.morningMood}
          onChange={(v) => store.setField('morningMood', v)}
        />
      </div>

      <button
        onClick={onComplete}
        disabled={isSaving}
        className={`w-full py-3.5 rounded-2xl font-display font-bold text-sm transition-all ${
          isSaving
            ? 'bg-cream-300/50 text-sleep-400 cursor-not-allowed'
            : 'bg-dream-glow text-white shadow-glow-sm hover:bg-dream-aurora active:scale-[0.98]'
        }`}
      >
        {isSaving ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-cream-300 border-t-white rounded-full animate-spin" />
            Saving…
          </span>
        ) : (
          "Done — let's go"
        )}
      </button>
    </div>
  )
}

/* ═════════════════════════════════════════════
   MAIN ORCHESTRATOR
   ═════════════════════════════════════════════ */
export default function OnboardingFlow({ onComplete, onSkip }) {
  const { user } = useAuth()
  const store = useOnboardingStore()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)

  const { currentScreen, screenIndex, nextScreen, prevScreen } = store

  // Validation per section
  const canProceed = () => {
    switch (currentScreen) {
      case 'welcome': return true
      case 'section1': {
        const ageNum = parseInt(store.childAge)
        return store.childName.trim() && ageNum >= 3 && ageNum <= 12 && store.genderPronoun && store.parentDescription.length >= 10
      }
      case 'section2': return true // all optional after neuro flags
      case 'section3': return store.bedtimeDescription.trim() && store.nightWakingFrequency
      case 'section4': return true // fear flags optional
      case 'section5': return store.allies.some(a => a.name.trim())
      case 'completion': return true
      case 'baseline': return true
      default: return true
    }
  }

  // Progressive save on section navigation
  const handleNext = async () => {
    if (!canProceed()) return

    try {
      setError(null)

      // Save Section 1 → create child profile
      if (currentScreen === 'section1' && !store.childProfileId) {
        setIsSaving(true)
        const profile = await db.createChildProfile({
          user_id: user.id,
          name: store.childName.trim(),
          age: parseInt(store.childAge),
          gender_pronoun: store.genderPronoun,
          personality_description: store.parentDescription,
          mode: 'full_programme',
        })
        store.setField('childProfileId', profile.id)
        setIsSaving(false)
      }
      // Update profile if revisiting section 1
      else if (currentScreen === 'section1' && store.childProfileId) {
        setIsSaving(true)
        await db.updateChildProfile(store.childProfileId, {
          name: store.childName.trim(),
          age: parseInt(store.childAge),
          gender_pronoun: store.genderPronoun,
          personality_description: store.parentDescription,
        })
        setIsSaving(false)
      }

      // Save Section 2 → update profile + dynamic context
      if (currentScreen === 'section2' && store.childProfileId) {
        setIsSaving(true)
        await db.updateChildProfile(store.childProfileId, {
          neuro_flags: store.neuroFlags,
          neuro_profile: store.neuroNotes || null,
        })
        setIsSaving(false)
      }

      // Save Section 3 → update dynamic context
      if (currentScreen === 'section3' && store.childProfileId) {
        setIsSaving(true)
        await db.updateChildDynamicContext(store.childProfileId, {
          bedtime_description: store.bedtimeDescription,
          night_waking_frequency: store.nightWakingFrequency,
        })
        setIsSaving(false)
      }

      // Save Section 4 → update dynamic context
      if (currentScreen === 'section4' && store.childProfileId) {
        setIsSaving(true)
        await db.updateChildDynamicContext(store.childProfileId, {
          fear_flags: store.fearFlags,
          current_stressors: store.currentStressors || null,
        })
        setIsSaving(false)
      }

      // Save Section 5 → update dynamic context
      if (currentScreen === 'section5' && store.childProfileId) {
        setIsSaving(true)
        const validAllies = store.allies.filter(a => a.name.trim())
        const validPets = store.pets.filter(p => p.name.trim())
        await db.updateChildDynamicContext(store.childProfileId, {
          allies: validAllies,
          pets: validPets,
          social_difficulty: store.socialDifficulty || null,
        })
        setIsSaving(false)
      }

      nextScreen()
    } catch (err) {
      console.error('Onboarding save error:', err)
      setError(err.message)
      setIsSaving(false)
    }
  }

  // Final save — baseline + mark onboarding complete
  const handleBaselineComplete = async () => {
    try {
      setIsSaving(true)
      setError(null)

      // Save clinical baseline
      await db.createClinicalBaseline({
        child_id: store.childProfileId,
        user_id: user.id,
        bedtime_resistance: store.bedtimeResistance,
        sleep_onset_latency: store.sleepOnsetLatency,
        night_waking_frequency: store.nightWakingScore,
        parental_stress: store.parentalStress,
        morning_mood: store.morningMood,
        week_number: 0,
      })

      // Mark onboarding complete
      await db.updateChildProfile(store.childProfileId, {
        onboarding_completed: true,
      })

      setIsSaving(false)
      store.reset()
      onComplete?.(store.childProfileId)
    } catch (err) {
      console.error('Baseline save error:', err)
      setError(err.message)
      setIsSaving(false)
    }
  }

  const showBackButton = screenIndex > 0 && currentScreen !== 'completion' && currentScreen !== 'baseline'
  const showNextButton = currentScreen !== 'welcome' && currentScreen !== 'completion' && currentScreen !== 'baseline'
  const sectionNumber = screenIndex >= 1 && screenIndex <= 5 ? screenIndex : null

  return (
    <div className="min-h-full px-5 py-6 animate-fade-in">
      {/* Progress bar for sections 1-5 */}
      {sectionNumber && <ProgressBar current={sectionNumber - 1} total={5} />}

      {/* Section label */}
      {sectionNumber && (
        <p className="text-xs font-display font-semibold text-sleep-400 mb-4">{sectionNumber} of 5</p>
      )}

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-xl text-xs text-danger font-body">
          {error}
        </div>
      )}

      {/* Screen content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          variants={fadeVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="max-w-lg mx-auto"
        >
          {currentScreen === 'welcome' && <WelcomeScreen />}
          {currentScreen === 'section1' && <Section1Screen />}
          {currentScreen === 'section2' && <Section2Screen />}
          {currentScreen === 'section3' && <Section3Screen />}
          {currentScreen === 'section4' && <Section4Screen />}
          {currentScreen === 'section5' && <Section5Screen />}
          {currentScreen === 'completion' && <CompletionScreen />}
          {currentScreen === 'baseline' && <BaselineScreen onComplete={handleBaselineComplete} isSaving={isSaving} />}
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      {showNextButton && (
        <div className="max-w-lg mx-auto mt-6 flex items-center justify-between">
          {showBackButton ? (
            <button
              onClick={prevScreen}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-display font-semibold text-sleep-500 hover:text-sleep-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : <div />}

          <button
            onClick={handleNext}
            disabled={!canProceed() || isSaving}
            className={`flex items-center gap-1.5 px-6 py-3 rounded-2xl text-sm font-display font-bold transition-all ${
              !canProceed() || isSaving
                ? 'bg-cream-300/50 text-sleep-400 cursor-not-allowed'
                : 'bg-dream-glow text-white shadow-glow-sm hover:bg-dream-aurora active:scale-[0.98]'
            }`}
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-cream-300 border-t-white rounded-full animate-spin" />
                Saving…
              </span>
            ) : currentScreen === 'section5' ? (
              <>Finish — let's make some stories</>
            ) : (
              <>Next <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      )}

      {/* Skip link on welcome */}
      {currentScreen === 'welcome' && onSkip && (
        <div className="text-center mt-4">
          <button
            onClick={onSkip}
            className="text-sm text-sleep-400 hover:text-sleep-600 font-body transition-colors"
          >
            I'll do this later
          </button>
        </div>
      )}
    </div>
  )
}
