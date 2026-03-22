import React, { useState, useEffect } from 'react'
import { ArrowLeft, Save, Check, Bell } from 'lucide-react'
import { db } from '../../lib/supabase'
import { isPushSupported, subscribeToPush, unsubscribeFromPush, isSubscribedToPush } from '../../services/pushNotificationService'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export default function NotificationPreferences({ userId, childId, childName, onBack }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)

  const [eveningTime, setEveningTime] = useState('18:30')
  const [morningTime, setMorningTime] = useState('08:00')
  const [briefDay, setBriefDay] = useState('sunday')
  const [briefTime, setBriefTime] = useState('19:30')

  useEffect(() => {
    const load = async () => {
      try {
        const prefs = await db.getNotificationPreferences(userId, childId)
        if (prefs) {
          setEveningTime(prefs.evening_reminder_time?.substring(0, 5) || '18:30')
          setMorningTime(prefs.morning_reflection_time?.substring(0, 5) || '08:00')
          setBriefDay(prefs.weekly_brief_day || 'sunday')
          setBriefTime(prefs.weekly_brief_time?.substring(0, 5) || '19:30')
        }
        const subscribed = await isSubscribedToPush()
        setPushEnabled(subscribed)
      } catch (err) {
        console.error('Error loading notification preferences:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId, childId])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await db.updateNotificationPreferences(userId, childId, {
        evening_reminder_time: eveningTime + ':00',
        morning_reflection_time: morningTime + ':00',
        weekly_brief_day: briefDay,
        weekly_brief_time: briefTime + ':00',
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('Error saving notification preferences:', err)
      alert('Failed to save: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const [pushError, setPushError] = useState(null)

  const handleTogglePush = async () => {
    setPushError(null)
    if (pushEnabled) {
      await unsubscribeFromPush(userId, childId)
      setPushEnabled(false)
    } else {
      try {
        console.log('🔔 Attempting to subscribe to push...')
        console.log('🔔 VAPID key loaded:', !!import.meta.env.VITE_VAPID_PUBLIC_KEY)
        const sub = await subscribeToPush(userId, childId)
        console.log('🔔 Subscribe result:', sub)
        if (sub) {
          setPushEnabled(true)
        } else {
          setPushError('Could not enable — check VAPID key is in .env and restart dev server')
        }
      } catch (err) {
        console.error('🔔 Push subscribe error:', err)
        setPushError(err.message)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-full px-5 py-6 flex items-center justify-center">
        <div className="animate-spin text-2xl">⏳</div>
      </div>
    )
  }

  return (
    <div className="min-h-full px-5 py-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 text-sleep-500 hover:text-sleep-800 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-display font-bold text-sleep-900">Notifications</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-dream-glow hover:bg-dream-aurora text-white rounded-xl font-display font-semibold text-sm transition-all active:scale-[0.97] disabled:opacity-60"
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : saved ? 'Saved' : 'Save'}
        </button>
      </div>

      <div className="max-w-lg mx-auto space-y-4">
        <p className="text-xs text-sleep-500 font-body">Notification times for {childName}</p>

        {/* Push toggle */}
        {isPushSupported() && (
          <div className="bg-white/80 backdrop-blur-sm border-2 border-cream-300/50 rounded-3xl p-5 shadow-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className={`w-5 h-5 ${pushEnabled ? 'text-dream-glow' : 'text-sleep-400'}`} />
                <div>
                  <p className="text-sm font-display font-semibold text-sleep-900">Push Notifications</p>
                  <p className="text-xs text-sleep-500 font-body">{pushEnabled ? 'Enabled' : 'Disabled'}</p>
                </div>
              </div>
              <button
                onClick={handleTogglePush}
                className={`w-12 h-7 rounded-full transition-all duration-200 relative ${pushEnabled ? 'bg-dream-glow' : 'bg-cream-300'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-1 transition-all duration-200 ${pushEnabled ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
            {pushError && (
              <p className="text-xs text-danger font-body mt-2">{pushError}</p>
            )}
          </div>
        )}

        {/* Evening reminder */}
        <div className="bg-white/80 backdrop-blur-sm border-2 border-cream-300/50 rounded-3xl p-5 shadow-card space-y-3">
          <h2 className="text-base font-display font-bold text-sleep-900">Evening Reminder</h2>
          <p className="text-xs text-sleep-500 font-body">When should we remind you it's story time?</p>
          <input
            type="time"
            value={eveningTime}
            min="17:00"
            max="21:00"
            onChange={e => setEveningTime(e.target.value)}
            className="w-full px-4 py-3 bg-cream-100/80 border-2 border-cream-300/60 rounded-2xl text-sm text-sleep-900 font-body focus:border-dream-glow/50 focus:outline-none transition-all"
          />
        </div>

        {/* Morning reflection */}
        <div className="bg-white/80 backdrop-blur-sm border-2 border-cream-300/50 rounded-3xl p-5 shadow-card space-y-3">
          <h2 className="text-base font-display font-bold text-sleep-900">Morning Reflection</h2>
          <p className="text-xs text-sleep-500 font-body">When do you want to receive last night's observations?</p>
          <input
            type="time"
            value={morningTime}
            min="06:00"
            max="11:00"
            onChange={e => setMorningTime(e.target.value)}
            className="w-full px-4 py-3 bg-cream-100/80 border-2 border-cream-300/60 rounded-2xl text-sm text-sleep-900 font-body focus:border-dream-glow/50 focus:outline-none transition-all"
          />
        </div>

        {/* Weekly brief */}
        <div className="bg-white/80 backdrop-blur-sm border-2 border-cream-300/50 rounded-3xl p-5 shadow-card space-y-3">
          <h2 className="text-base font-display font-bold text-sleep-900">Weekly Brief</h2>
          <div>
            <p className="text-xs text-sleep-500 font-body mb-2">Which day works best?</p>
            <div className="grid grid-cols-4 gap-1.5">
              {DAYS.map(day => (
                <button key={day} onClick={() => setBriefDay(day)}
                  className={`px-2 py-2 rounded-xl text-xs font-display font-semibold capitalize transition-all ${
                    briefDay === day ? 'bg-dream-glow text-white' : 'bg-cream-100/80 border border-cream-300/60 text-sleep-600'
                  }`}
                >{day.substring(0, 3)}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-sleep-500 font-body mb-2">What time?</p>
            <input
              type="time"
              value={briefTime}
              min="18:00"
              max="21:00"
              onChange={e => setBriefTime(e.target.value)}
              className="w-full px-4 py-3 bg-cream-100/80 border-2 border-cream-300/60 rounded-2xl text-sm text-sleep-900 font-body focus:border-dream-glow/50 focus:outline-none transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
