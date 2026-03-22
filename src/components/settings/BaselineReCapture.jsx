import React, { useState } from 'react'
import { ArrowLeft, Check } from 'lucide-react'
import { db } from '../../lib/supabase'

/**
 * Week 3 Baseline Re-Capture
 * 
 * Identical to onboarding baseline screen. 5 sliders (1-10).
 * Saves new record with week_number = 3 (does NOT overwrite Week 0).
 */
export default function BaselineReCapture({ childId, userId, childName, onBack }) {
  const [bedtimeResistance, setBedtimeResistance] = useState(5)
  const [sleepOnsetLatency, setSleepOnsetLatency] = useState(5)
  const [nightWakingScore, setNightWakingScore] = useState(5)
  const [parentalStress, setParentalStress] = useState(5)
  const [morningMood, setMorningMood] = useState(5)
  const [isSaving, setIsSaving] = useState(false)
  const [completed, setCompleted] = useState(false)

  const handleComplete = async () => {
    setIsSaving(true)
    try {
      await db.createClinicalBaseline({
        child_id: childId,
        user_id: userId,
        bedtime_resistance: bedtimeResistance,
        sleep_onset_latency: sleepOnsetLatency,
        night_waking_frequency: nightWakingScore,
        parental_stress: parentalStress,
        morning_mood: morningMood,
        week_number: 3,
      })
      setCompleted(true)
      setTimeout(() => onBack(), 2000)
    } catch (err) {
      console.error('Error saving baseline:', err)
      alert('Failed to save: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (completed) {
    return (
      <div className="min-h-full px-5 py-6 flex flex-col items-center justify-center animate-fade-in">
        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-success" />
        </div>
        <h2 className="text-xl font-display font-bold text-sleep-900 mb-2">Thanks!</h2>
        <p className="text-sm text-sleep-600 font-body text-center max-w-xs">
          We'll compare this with your answers from three weeks ago to show you what's changed.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-full px-5 py-6 animate-fade-in pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 text-sleep-500 hover:text-sleep-800 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-display font-bold text-sleep-900">Week 3 Check-in</h1>
      </div>

      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <p className="text-sm text-sleep-600 font-body">
            It's been three weeks since you started with {childName}. Let's see how things have shifted — same questions as before, takes about a minute.
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm border-2 border-cream-300/50 rounded-3xl p-5 space-y-6 shadow-card">
          <SliderField
            label="The bedtime battle — how hard is it right now?"
            hint="1 = barely a struggle, 10 = full war every night"
            value={bedtimeResistance}
            onChange={setBedtimeResistance}
          />
          <SliderField
            label="Time to fall asleep — once they're settled, how long does it usually take?"
            hint="1 = out quickly, 10 = takes forever"
            value={sleepOnsetLatency}
            onChange={setSleepOnsetLatency}
          />
          <SliderField
            label="Night wakings — how often are you up in the night?"
            hint="1 = rarely, 10 = most nights"
            value={nightWakingScore}
            onChange={setNightWakingScore}
          />
          <SliderField
            label="Your stress at bedtime — how are you finding it?"
            hint="1 = fine, 10 = I'm on my last nerve by 8pm"
            value={parentalStress}
            onChange={setParentalStress}
          />
          <SliderField
            label="Their mood in the morning — how do they usually start the day?"
            hint="1 = bright and easy, 10 = really hard to get going"
            value={morningMood}
            onChange={setMorningMood}
          />
        </div>

        <button
          onClick={handleComplete}
          disabled={isSaving}
          className={`w-full mt-6 py-3.5 rounded-2xl font-display font-bold text-sm transition-all ${
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
            "Done"
          )}
        </button>
      </div>
    </div>
  )
}

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
