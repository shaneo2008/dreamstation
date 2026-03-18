import React, { useState, useEffect } from 'react'
import { ArrowLeft, Save, Check, Plus, X } from 'lucide-react'
import { db } from '../../lib/supabase'
import OnboardingFlow from '../onboarding/OnboardingFlow'

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

const RELATIONSHIP_OPTIONS = ['Parent', 'Sibling', 'Grandparent', 'Friend', 'Teacher', 'Other']

export default function ChildProfileEdit({ childId, onBack }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showUpgradeFlow, setShowUpgradeFlow] = useState(false)

  // Profile fields
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [genderPronoun, setGenderPronoun] = useState('')
  const [personalityDescription, setPersonalityDescription] = useState('')
  const [neuroFlags, setNeuroFlags] = useState([])
  const [neuroProfile, setNeuroProfile] = useState('')
  const [mode, setMode] = useState('just_stories')

  // Dynamic context fields
  const [fearFlags, setFearFlags] = useState([])
  const [currentStressors, setCurrentStressors] = useState('')
  const [stressorsUpdatedAt, setStressorsUpdatedAt] = useState(null)
  const [bedtimeDescription, setBedtimeDescription] = useState('')
  const [nightWakingFrequency, setNightWakingFrequency] = useState('')
  const [allies, setAllies] = useState([{ name: '', relationship: '' }])
  const [pets, setPets] = useState([])
  const [socialDifficulty, setSocialDifficulty] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const full = await db.getFullChildProfile(childId)
        if (full) {
          setName(full.name || '')
          setAge(String(full.age || ''))
          setGenderPronoun(full.gender_pronoun || '')
          setPersonalityDescription(full.personality_description || '')
          setNeuroFlags(full.neuro_flags || [])
          setNeuroProfile(full.neuro_profile || '')
          setMode(full.mode || 'just_stories')

          const ctx = full.child_dynamic_context
          if (ctx) {
            setFearFlags(ctx.fear_flags || [])
            setCurrentStressors(ctx.current_stressors || '')
            setStressorsUpdatedAt(ctx.stressors_updated_at)
            setBedtimeDescription(ctx.bedtime_description || '')
            setNightWakingFrequency(ctx.night_waking_frequency || '')
            setAllies(ctx.allies?.length > 0 ? ctx.allies : [{ name: '', relationship: '' }])
            setPets(ctx.pets || [])
            setSocialDifficulty(ctx.social_difficulty || '')
          }
        }
      } catch (err) {
        console.error('Error loading child profile:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [childId])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await db.updateChildProfile(childId, {
        name: name.trim(),
        age: parseInt(age),
        gender_pronoun: genderPronoun,
        personality_description: personalityDescription,
        neuro_flags: neuroFlags,
        neuro_profile: neuroProfile || null,
      })

      await db.updateChildDynamicContext(childId, {
        fear_flags: fearFlags,
        current_stressors: currentStressors || null,
        bedtime_description: bedtimeDescription || null,
        night_waking_frequency: nightWakingFrequency || null,
        allies: allies.filter(a => a.name.trim()),
        pets: pets.filter(p => p.name.trim()),
        social_difficulty: socialDifficulty || null,
      })

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('Error saving profile:', err)
      alert('Failed to save: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleNeuroFlag = (flag) => {
    if (flag === 'None of these really fit') {
      setNeuroFlags(['None of these really fit'])
      return
    }
    const filtered = neuroFlags.filter(f => f !== 'None of these really fit')
    setNeuroFlags(filtered.includes(flag) ? filtered.filter(f => f !== flag) : [...filtered, flag])
  }

  const toggleFearFlag = (flag) => {
    if (flag === 'None of these') {
      setFearFlags(['None of these'])
      return
    }
    const filtered = fearFlags.filter(f => f !== 'None of these')
    setFearFlags(filtered.includes(flag) ? filtered.filter(f => f !== flag) : [...filtered, flag])
  }

  // Mode upgrade flow
  if (showUpgradeFlow) {
    return (
      <OnboardingFlow
        onComplete={() => {
          setShowUpgradeFlow(false)
          onBack()
        }}
        onSkip={() => setShowUpgradeFlow(false)}
      />
    )
  }

  if (loading) {
    return (
      <div className="min-h-full px-5 py-6 flex items-center justify-center">
        <div className="animate-spin text-2xl">⏳</div>
      </div>
    )
  }

  const stressorsDaysAgo = stressorsUpdatedAt
    ? Math.floor((Date.now() - new Date(stressorsUpdatedAt).getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="min-h-full px-5 py-6 animate-fade-in pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 text-sleep-500 hover:text-sleep-800 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-display font-bold text-sleep-900">{name}'s Profile</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-dream-glow hover:bg-dream-aurora text-white rounded-xl font-display font-semibold text-sm transition-all active:scale-[0.97] disabled:opacity-60"
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : saved ? 'Saved' : 'Save'}
        </button>
      </div>

      <div className="max-w-lg mx-auto space-y-6">
        {/* Section 1: Basics */}
        <Section title="Who they are">
          <Field label="Name">
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="input-field" />
          </Field>
          <Field label="Age">
            <input type="number" min="3" max="12" value={age} onChange={e => setAge(e.target.value)} className="input-field" />
          </Field>
          <Field label="Pronouns">
            <div className="grid grid-cols-2 gap-2">
              {['Girl', 'Boy', 'They/them', 'Skip'].map(opt => (
                <button key={opt} onClick={() => setGenderPronoun(opt)}
                  className={`px-3 py-2 rounded-xl border-2 text-sm font-body transition-all ${genderPronoun === opt ? 'border-dream-glow bg-dream-stardust/30 text-sleep-900' : 'border-cream-300/60 text-sleep-600'}`}
                >{opt}</button>
              ))}
            </div>
          </Field>
          <Field label="Describe them">
            <textarea value={personalityDescription} onChange={e => setPersonalityDescription(e.target.value)} rows={3} className="input-field resize-none" />
          </Field>
        </Section>

        {/* Section 2: Nervous System (Full Programme only) */}
        {mode === 'full_programme' && (
          <Section title="Their nervous system">
            <Field label="Select all that apply">
              <div className="space-y-2">
                {NEURO_OPTIONS.map(opt => (
                  <CheckItem key={opt} label={opt} checked={neuroFlags.includes(opt)} onChange={() => toggleNeuroFlag(opt)} />
                ))}
              </div>
            </Field>
            <Field label="Notes">
              <textarea value={neuroProfile} onChange={e => setNeuroProfile(e.target.value)} rows={2} className="input-field resize-none" placeholder="Anything else..." />
            </Field>
          </Section>
        )}

        {/* Section 3: Bedtime (Full Programme only) */}
        {mode === 'full_programme' && (
          <Section title="What bedtime looks like">
            <Field label="When bedtime is difficult, what does that usually look like?">
              <textarea value={bedtimeDescription} onChange={e => setBedtimeDescription(e.target.value)} rows={3} className="input-field resize-none" />
            </Field>
            <Field label="Night waking frequency">
              <div className="space-y-2">
                {['Almost every night', 'A few times a week', 'Once or twice a week', 'Occasionally', 'Rarely or never'].map(opt => (
                  <button key={opt} onClick={() => setNightWakingFrequency(opt)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl border-2 text-sm font-body transition-all ${nightWakingFrequency === opt ? 'border-dream-glow bg-dream-stardust/30 text-sleep-900' : 'border-cream-300/60 text-sleep-600'}`}
                  >{opt}</button>
                ))}
              </div>
            </Field>
          </Section>
        )}

        {/* Section 4: Fears & Stressors (Full Programme only) */}
        {mode === 'full_programme' && (
          <Section title="What's on their mind">
            <Field label="Fears and worries">
              <div className="space-y-2">
                {FEAR_OPTIONS.map(opt => (
                  <CheckItem key={opt} label={opt} checked={fearFlags.includes(opt)} onChange={() => toggleFearFlag(opt)} />
                ))}
              </div>
            </Field>
            <Field label="Current stressors">
              <textarea value={currentStressors} onChange={e => setCurrentStressors(e.target.value)} rows={3} className="input-field resize-none"
                placeholder="Anything happening right now..." />
              {stressorsDaysAgo !== null && (
                <p className="text-[10px] text-sleep-400 font-body mt-1">
                  Last updated {stressorsDaysAgo === 0 ? 'today' : `${stressorsDaysAgo} day${stressorsDaysAgo !== 1 ? 's' : ''} ago`}
                  {stressorsDaysAgo > 14 && ' — worth refreshing if things have changed'}
                </p>
              )}
            </Field>
          </Section>
        )}

        {/* Section 5: Their World (Full Programme only) */}
        {mode === 'full_programme' && (
          <Section title="Their world">
            <Field label="Important people">
              <div className="space-y-2">
                {allies.map((ally, i) => (
                  <div key={i} className="flex gap-2">
                    <input type="text" value={ally.name} onChange={e => { const u = [...allies]; u[i] = { ...u[i], name: e.target.value }; setAllies(u) }}
                      placeholder="Name" className="flex-1 input-field" />
                    <select value={ally.relationship} onChange={e => { const u = [...allies]; u[i] = { ...u[i], relationship: e.target.value }; setAllies(u) }}
                      className="input-field w-auto">
                      <option value="">Role</option>
                      {RELATIONSHIP_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    {allies.length > 1 && (
                      <button onClick={() => setAllies(allies.filter((_, j) => j !== i))} className="p-2 text-danger/60 hover:text-danger"><X className="w-4 h-4" /></button>
                    )}
                  </div>
                ))}
                <button onClick={() => setAllies([...allies, { name: '', relationship: '' }])}
                  className="flex items-center gap-1 text-xs text-dream-glow font-display font-semibold">
                  <Plus className="w-3.5 h-3.5" /> Add person
                </button>
              </div>
            </Field>
            <Field label="Pets">
              <div className="space-y-2">
                {pets.map((pet, i) => (
                  <div key={i} className="flex gap-2">
                    <input type="text" value={pet.name} onChange={e => { const u = [...pets]; u[i] = { ...u[i], name: e.target.value }; setPets(u) }}
                      placeholder="Name" className="flex-1 input-field" />
                    <input type="text" value={pet.type} onChange={e => { const u = [...pets]; u[i] = { ...u[i], type: e.target.value }; setPets(u) }}
                      placeholder="Type" className="flex-1 input-field" />
                    <button onClick={() => setPets(pets.filter((_, j) => j !== i))} className="p-2 text-danger/60 hover:text-danger"><X className="w-4 h-4" /></button>
                  </div>
                ))}
                <button onClick={() => setPets([...pets, { name: '', type: '' }])}
                  className="flex items-center gap-1 text-xs text-dream-glow font-display font-semibold">
                  <Plus className="w-3.5 h-3.5" /> Add pet
                </button>
              </div>
            </Field>
            <Field label="Social difficulty">
              <textarea value={socialDifficulty} onChange={e => setSocialDifficulty(e.target.value)} rows={2} className="input-field resize-none" placeholder="Optional..." />
            </Field>
          </Section>
        )}

        {/* Mode upgrade */}
        {mode === 'just_stories' && (
          <Section title="Upgrade">
            <p className="text-sm text-sleep-600 font-body mb-3">
              You're currently on Just Stories. Upgrade to Full Programme to get personalised stories, morning observations, and weekly reflections.
            </p>
            <button onClick={() => setShowUpgradeFlow(true)}
              className="w-full py-3 bg-dream-glow hover:bg-dream-aurora text-white rounded-2xl font-display font-bold text-sm transition-all shadow-glow-sm active:scale-[0.98]">
              Upgrade to Full Programme
            </button>
          </Section>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm border-2 border-cream-300/50 rounded-3xl p-5 shadow-card">
      <h2 className="text-base font-display font-bold text-sleep-900 mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-display font-semibold text-sleep-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function CheckItem({ label, checked, onChange }) {
  return (
    <button type="button" onClick={onChange}
      className={`w-full text-left px-3 py-2.5 rounded-xl border-2 transition-all flex items-center gap-2.5 ${
        checked ? 'border-dream-glow/50 bg-dream-stardust/30' : 'border-cream-300/60 bg-white/60 hover:border-dream-glow/20'
      }`}>
      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${checked ? 'bg-dream-glow border-dream-glow' : 'border-cream-400'}`}>
        {checked && <Check className="w-2.5 h-2.5 text-white" />}
      </div>
      <span className="text-xs text-sleep-800 font-body">{label}</span>
    </button>
  )
}
