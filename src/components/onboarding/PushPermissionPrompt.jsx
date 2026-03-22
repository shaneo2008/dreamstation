import React, { useState, useEffect } from 'react'
import { Bell, BellOff, X } from 'lucide-react'
import { isPushSupported, getPermissionState, subscribeToPush } from '../../services/pushNotificationService'

/**
 * Push Permission Prompt — shown after onboarding completes
 * Handles permission denied gracefully — app works without notifications
 */
export default function PushPermissionPrompt({ userId, childId, childName, onComplete }) {
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [permState, setPermState] = useState('default')
  const supported = isPushSupported()

  useEffect(() => {
    setPermState(getPermissionState())
  }, [])

  // Already granted or not supported — skip prompt
  if (!supported || permState === 'granted') {
    // If already granted, silently subscribe and close
    if (permState === 'granted' && userId && childId) {
      subscribeToPush(userId, childId).then(() => onComplete?.())
      return null
    }
    onComplete?.()
    return null
  }

  // Previously denied — show explanation
  if (permState === 'denied') {
    return (
      <div className="fixed inset-0 bg-sleep-950/30 backdrop-blur-sm flex items-center justify-center z-50 px-4">
        <div className="bg-white/95 backdrop-blur-lg border-2 border-cream-300/50 rounded-3xl p-6 max-w-sm w-full shadow-dream">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-cream-200 rounded-2xl flex items-center justify-center">
              <BellOff className="w-5 h-5 text-sleep-500" />
            </div>
            <button onClick={() => onComplete?.()} className="p-1 text-sleep-400 hover:text-sleep-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <h3 className="text-lg font-display font-bold text-sleep-900 mb-2">Notifications blocked</h3>
          <p className="text-sm text-sleep-600 font-body mb-4">
            You've previously blocked notifications for DreamStation. You can enable them in your browser settings if you change your mind.
          </p>
          <button
            onClick={() => onComplete?.()}
            className="w-full py-3 bg-cream-200 hover:bg-cream-300 text-sleep-700 rounded-2xl font-display font-bold text-sm transition-all"
          >
            Got it — continue without notifications
          </button>
        </div>
      </div>
    )
  }

  // Default state — ask for permission
  const handleEnable = async () => {
    setIsSubscribing(true)
    try {
      await subscribeToPush(userId, childId)
    } catch (err) {
      console.warn('Push subscription failed:', err)
    }
    setIsSubscribing(false)
    onComplete?.()
  }

  return (
    <div className="fixed inset-0 bg-sleep-950/30 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white/95 backdrop-blur-lg border-2 border-cream-300/50 rounded-3xl p-6 max-w-sm w-full shadow-dream">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 bg-dream-stardust/40 rounded-2xl flex items-center justify-center">
            <Bell className="w-5 h-5 text-dream-glow" />
          </div>
          <button onClick={() => onComplete?.()} className="p-1 text-sleep-400 hover:text-sleep-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <h3 className="text-lg font-display font-bold text-sleep-900 mb-2">Stay in the loop</h3>
        <p className="text-sm text-sleep-600 font-body mb-2">
          We'd like to send you a gentle nudge each evening when it's story time for <span className="font-semibold text-dream-glow">{childName || 'your child'}</span>, and a quick observation each morning after a story night.
        </p>
        <p className="text-xs text-sleep-400 font-body mb-5">
          You can change notification times in Settings anytime.
        </p>
        <div className="space-y-2">
          <button
            onClick={handleEnable}
            disabled={isSubscribing}
            className="w-full py-3 bg-dream-glow hover:bg-dream-aurora text-white rounded-2xl font-display font-bold text-sm transition-all shadow-glow-sm active:scale-[0.98] disabled:opacity-60"
          >
            {isSubscribing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-cream-300 border-t-white rounded-full animate-spin" />
                Enabling…
              </span>
            ) : (
              'Enable notifications'
            )}
          </button>
          <button
            onClick={() => onComplete?.()}
            className="w-full py-3 text-sleep-500 hover:text-sleep-700 font-body text-sm transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}
