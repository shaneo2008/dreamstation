import React, { useState, useEffect } from 'react'
import { User, Bell, BookOpen, Heart, ChevronRight, LogOut, ArrowLeft, RefreshCw } from 'lucide-react'
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
  const [baselineNeeded, setBaselineNeeded] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return
      try {
        const profiles = await db.getChildProfiles(user.id)
        setChildProfiles(profiles || [])

        // Check if Week 3 baseline is needed for any child
        if (profiles && profiles.length > 0) {
          for (const profile of profiles) {
            if (profile.mode !== 'full_programme') continue
            try {
              const baselines = await db.getClinicalBaselines(profile.id)
              const hasWeek0 = baselines.some(b => b.week_number === 0)
              const hasWeek3 = baselines.some(b => b.week_number === 3)
              if (hasWeek0 && !hasWeek3) {
                const week0 = baselines.find(b => b.week_number === 0)
                const daysSince = (Date.now() - new Date(week0.captured_at).getTime()) / (1000 * 60 * 60 * 24)
                if (daysSince >= 21) {
                  setBaselineNeeded(true)
                  setSelectedChildId(profile.id)
                  setSelectedChildName(profile.name)
                }
              }
            } catch (e) {
              console.warn('Could not check baselines:', e.message)
            }
          }
        }
      } catch (err) {
        console.error('Error loading settings data:', err)
      }
    }
    load()
  }, [user?.id])

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
    setActiveScreen('baseline')
  }

  const goBack = () => {
    setActiveScreen('main')
    // Reload profiles in case edits were made
    if (user?.id) {
      db.getChildProfiles(user.id).then(p => setChildProfiles(p || []))
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
    return <BaselineReCapture childId={selectedChildId} userId={user?.id} childName={selectedChildName} onBack={goBack} />
  }

  // Main settings screen
  return (
    <div className="min-h-full px-5 py-6 animate-fade-in">
      <div className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-display font-bold mb-2 gradient-text">Settings</h1>
        <p className="text-sleep-500 text-sm font-body">Manage your DreamStation experience</p>
      </div>

      <div className="max-w-lg mx-auto space-y-4">
        {/* Account info */}
        <div className="bg-white/80 backdrop-blur-sm border-2 border-cream-300/50 rounded-3xl p-5 shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-dream-stardust/40 rounded-2xl flex items-center justify-center">
              <User className="w-5 h-5 text-dream-glow" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-display font-bold text-sleep-900 truncate">{user?.email}</p>
              <p className="text-[10px] text-sleep-400 font-mono truncate">{user?.id}</p>
            </div>
          </div>
        </div>

        {/* Child profiles */}
        {childProfiles.map(child => (
          <div key={child.id} className="bg-white/80 backdrop-blur-sm border-2 border-cream-300/50 rounded-3xl p-5 shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-pastel-peach/30 rounded-2xl flex items-center justify-center">
                <Heart className="w-5 h-5 text-pastel-peach" />
              </div>
              <div>
                <h3 className="text-base font-display font-bold text-sleep-900">{child.name}'s Profile</h3>
                <p className="text-xs text-sleep-500 font-body">
                  Age {child.age} · {child.mode === 'full_programme' ? 'Full Programme' : 'Just Stories'}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <SettingsRow icon={User} label="Edit Profile" onClick={() => openChildProfile(child)} />
              <SettingsRow icon={Bell} label="Notification Preferences" onClick={() => openNotifications(child)} />

              {child.mode === 'full_programme' && (
                <>
                  <SettingsRow icon={BookOpen} label="Weekly Briefs" onClick={() => openBriefs(child)} />
                  <SettingsRow icon={BookOpen} label="Morning Reflections" onClick={() => openReactions(child)} />
                  {baselineNeeded && child.id === selectedChildId && (
                    <SettingsRow
                      icon={RefreshCw}
                      label="Week 3 Check-in"
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
        ))}

        {childProfiles.length === 0 && (
          <div className="bg-white/80 backdrop-blur-sm border-2 border-cream-300/50 rounded-3xl p-5 shadow-card text-center">
            <p className="text-sm text-sleep-500 font-body">No child profiles yet. Create a story to get started.</p>
          </div>
        )}

        {/* Sign out */}
        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-danger/10 hover:bg-danger/20 text-danger border-2 border-danger/20 rounded-2xl transition-all font-display font-bold text-sm active:scale-[0.98]"
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
      className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all text-left ${
        highlight
          ? 'bg-dream-stardust/20 hover:bg-dream-stardust/30'
          : 'hover:bg-cream-100/80'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-4 h-4 ${highlight ? 'text-dream-glow' : 'text-sleep-500'}`} />
        <span className={`text-sm font-display font-semibold ${highlight ? 'text-dream-glow' : 'text-sleep-700'}`}>
          {label}
        </span>
      </div>
      <ChevronRight className="w-4 h-4 text-sleep-400" />
    </button>
  )
}
