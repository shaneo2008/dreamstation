import React, { useState, useEffect, useCallback } from 'react'
import { User, Bell, BookOpen, Heart, ChevronRight, LogOut, RefreshCw } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../lib/supabase'
import ChildProfileEdit from './ChildProfileEdit'
import NotificationPreferences from './NotificationPreferences'
import MorningReactionHistory from './MorningReactionHistory'
import WeeklyBriefScreen from '../WeeklyBriefScreen'
import BaselineReCapture from './BaselineReCapture'

/**
 * Settings Screen — replaces old Account screen
 * 
 * Sub-screens:
 *   - Child Profile Edit (per child)
 *   - Notification Preferences
 *   - My Reflections → Weekly Briefs + Morning Reaction History
 *   - Week 3 Baseline Re-capture (shown when applicable)
 *   - Mode upgrade (Just Stories → Full Programme)
 */
export default function SettingsScreen() {
  const { user, signOut } = useAuth()
  const [childProfiles, setChildProfiles] = useState([])
  const [activeScreen, setActiveScreen] = useState('main') // main | profile | notifications | briefs | reactions | baseline | upgrade
  const [selectedChildId, setSelectedChildId] = useState(null)
  const [selectedChildName, setSelectedChildName] = useState('')
  const [baselineDueMap, setBaselineDueMap] = useState({})
  const [selectedBaselineWeekNumber, setSelectedBaselineWeekNumber] = useState(3)

  const loadSettingsData = useCallback(async () => {
    if (!user?.id) return
    try {
      const profiles = await db.getChildProfiles(user.id)
      setChildProfiles(profiles || [])

      const dueMap = {}

      if (profiles && profiles.length > 0) {
        for (const profile of profiles) {
          if (profile.mode !== 'full_programme') continue
          try {
            const baselines = await db.getClinicalBaselines(profile.id)
            const hasWeek0 = baselines.some(b => b.week_number === 0)
            if (!hasWeek0 || baselines.length === 0) continue

            const latestBaseline = baselines[baselines.length - 1]
            const daysSinceLatest = (Date.now() - new Date(latestBaseline.captured_at).getTime()) / (1000 * 60 * 60 * 24)

            if (daysSinceLatest >= 21) {
              const latestWeekNumber = Number.isFinite(Number(latestBaseline.week_number)) ? Number(latestBaseline.week_number) : 0

              dueMap[profile.id] = {
                nextWeekNumber: Math.max(3, latestWeekNumber + 3),
                daysSinceLatest: Math.floor(daysSinceLatest),
              }
            }
          } catch (e) {
            console.warn('Could not check baselines:', e.message)
          }
        }
      }

      setBaselineDueMap(dueMap)
    } catch (err) {
      console.error('Error loading settings data:', err)
    }
  }, [user?.id])

  useEffect(() => {
    loadSettingsData()
  }, [loadSettingsData])

  const openChildProfile = (child) => {
    setSelectedChildId(child.id)
    setSelectedChildName(child.name)
    setActiveScreen('profile')
  }

  const openNotifications = (child) => {
    setSelectedChildId(child.id)
    setSelectedChildName(child.name)
    setActiveScreen('notifications')
  }

  const openBriefs = (child) => {
    setSelectedChildId(child.id)
    setSelectedChildName(child.name)
    setActiveScreen('briefs')
  }

  const openReactions = (child) => {
    setSelectedChildId(child.id)
    setSelectedChildName(child.name)
    setActiveScreen('reactions')
  }

  const openBaseline = (child) => {
    setSelectedChildId(child.id)
    setSelectedChildName(child.name)
    setSelectedBaselineWeekNumber(baselineDueMap[child.id]?.nextWeekNumber || 3)
    setActiveScreen('baseline')
  }

  const goBack = () => {
    setActiveScreen('main')
    // Reload profiles in case edits were made
    if (user?.id) {
      loadSettingsData()
    }
  }

  // Sub-screen routing
  if (activeScreen === 'profile' && selectedChildId) {
    return <ChildProfileEdit childId={selectedChildId} onBack={goBack} />
  }
  if (activeScreen === 'notifications' && selectedChildId) {
    return <NotificationPreferences userId={user?.id} childId={selectedChildId} childName={selectedChildName} onBack={goBack} />
  }
  if (activeScreen === 'briefs' && selectedChildId) {
    return <WeeklyBriefScreen childId={selectedChildId} childName={selectedChildName} onBack={goBack} />
  }
  if (activeScreen === 'reactions' && selectedChildId) {
    return <MorningReactionHistory childId={selectedChildId} childName={selectedChildName} onBack={goBack} />
  }
  if (activeScreen === 'baseline' && selectedChildId) {
    return <BaselineReCapture childId={selectedChildId} userId={user?.id} childName={selectedChildName} weekNumber={selectedBaselineWeekNumber} onBack={goBack} />
  }

  // Main settings screen
  return (
    <div className="min-h-full px-5 py-6 animate-fade-in text-cream-100">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#1b120c]/88 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-cream-400/65 font-body shadow-card backdrop-blur-md mb-4">
          <span>Account</span>
          <span className="text-cream-200">{childProfiles.length} profile{childProfiles.length === 1 ? '' : 's'}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-2 gradient-text">Settings</h1>
        <p className="text-cream-300/75 text-sm font-body">Manage your DreamStation experience</p>
      </div>

      <div className="max-w-lg mx-auto space-y-4">
        <div className="glass-card-solid p-5 text-cream-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 bg-dream-glow/12 rounded-2xl border border-dream-glow/20 flex items-center justify-center shadow-card">
              <User className="w-5 h-5 text-dream-glow" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-display font-bold text-cream-100 truncate">{user?.email}</p>
              <p className="text-[10px] text-cream-400/55 font-mono truncate">{user?.id}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#140e0a]/75 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.14em] text-cream-400/55 font-body mb-1">Signed in as</p>
            <p className="text-sm text-cream-300/80 font-body leading-relaxed">Your account controls profiles, notifications, reflections, and weekly check-ins.</p>
          </div>
        </div>

        {childProfiles.map(child => {
          const baselineDue = baselineDueMap[child.id]

          return (
          <div key={child.id} className="glass-card-solid p-5 text-cream-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 bg-dream-glow/12 rounded-2xl border border-dream-glow/20 flex items-center justify-center shadow-card">
                <Heart className="w-5 h-5 text-dream-glow" />
              </div>
              <div>
                <h3 className="text-lg font-display font-bold text-cream-100">{child.name}'s Profile</h3>
                <p className="text-xs text-cream-300/70 font-body">
                  Age {child.age} · {child.mode === 'full_programme' ? 'Full Programme' : 'Just Stories'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <SettingsRow icon={User} label="Edit Profile" onClick={() => openChildProfile(child)} />
              <SettingsRow icon={Bell} label="Notification Preferences" onClick={() => openNotifications(child)} />

              {child.mode === 'full_programme' && (
                <>
                  <SettingsRow icon={BookOpen} label="Weekly Briefs" onClick={() => openBriefs(child)} />
                  <SettingsRow icon={BookOpen} label="Morning Reflections" onClick={() => openReactions(child)} />
                  {baselineDue && (
                    <SettingsRow
                      icon={RefreshCw}
                      label={`Week ${baselineDue.nextWeekNumber} Snapshot`}
                      onClick={() => openBaseline(child)}
                      highlight
                    />
                  )}
                </>
              )}

              {child.mode === 'just_stories' && (
                <SettingsRow
                  icon={Heart}
                  label="Upgrade to Full Programme"
                  onClick={() => {
                    setSelectedChildId(child.id)
                    setSelectedChildName(child.name)
                    setActiveScreen('upgrade')
                  }}
                  highlight
                />
              )}
            </div>
          </div>
          )
        })}

        {childProfiles.length === 0 && (
          <div className="glass-card-solid p-5 text-center text-cream-100">
            <p className="text-sm text-cream-300/75 font-body">No child profiles yet. Create a story to get started.</p>
          </div>
        )}

        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-[#3b241a]/88 hover:bg-[#45291d] text-[#F2A180] border border-[#8a4c37]/60 rounded-[20px] transition-all font-display font-bold text-sm shadow-card active:scale-[0.98]"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  )
}

function SettingsRow({ icon: Icon, label, onClick, highlight }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl transition-all text-left border ${
        highlight
          ? 'bg-dream-glow/10 hover:bg-dream-glow/14 border-dream-glow/20'
          : 'bg-[#140e0a]/72 hover:bg-[#1b120c] border-white/8'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`h-8 w-8 rounded-xl border flex items-center justify-center ${highlight ? 'border-dream-glow/20 bg-dream-glow/10' : 'border-white/8 bg-white/5'}`}>
          <Icon className={`w-4 h-4 ${highlight ? 'text-dream-glow' : 'text-cream-300/72'}`} />
        </div>
        <span className={`text-sm font-display font-semibold ${highlight ? 'text-dream-glow' : 'text-cream-100'}`}>
          {label}
        </span>
      </div>
      <ChevronRight className={`w-4 h-4 ${highlight ? 'text-dream-glow/80' : 'text-cream-400/55'}`} />
    </button>
  )
}
