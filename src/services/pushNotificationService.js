import { db } from '../lib/supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

/**
 * Convert a base64 VAPID key to a Uint8Array for the Push API
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * Check if push notifications are supported and available
 */
export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

/**
 * Get the current notification permission state
 */
export function getPermissionState() {
  if (!isPushSupported()) return 'unsupported'
  return Notification.permission // 'default' | 'granted' | 'denied'
}

/**
 * Request push notification permission and subscribe
 * Returns the subscription object or null if denied/failed
 */
export async function subscribeToPush(userId, childId) {
  if (!isPushSupported()) {
    console.warn('Push notifications not supported in this browser')
    return null
  }

  if (!VAPID_PUBLIC_KEY) {
    console.warn('VAPID public key not configured')
    return null
  }

  try {
    // Request permission
    const permission = await Notification.requestPermission()
    console.log('Notification permission:', permission)

    if (permission !== 'granted') {
      console.log('Push notification permission denied')
      return null
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready
    console.log('Service worker ready:', registration)

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      // Subscribe with VAPID key
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      console.log('New push subscription created:', subscription)
    } else {
      console.log('Existing push subscription found:', subscription)
    }

    // Store subscription in Supabase
    const subscriptionJSON = subscription.toJSON()
    await db.updateNotificationPreferences(userId, childId, {
      push_subscription: subscriptionJSON,
    })
    console.log('Push subscription stored in Supabase')

    return subscription
  } catch (error) {
    console.error('Failed to subscribe to push:', error)
    return null
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(userId, childId) {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      await subscription.unsubscribe()
      console.log('Push subscription removed')
    }

    // Clear from Supabase
    await db.updateNotificationPreferences(userId, childId, {
      push_subscription: null,
    })
    console.log('Push subscription cleared from Supabase')
  } catch (error) {
    console.error('Failed to unsubscribe from push:', error)
  }
}

/**
 * Check if user is currently subscribed to push
 */
export async function isSubscribedToPush() {
  if (!isPushSupported()) return false

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    return !!subscription
  } catch {
    return false
  }
}
