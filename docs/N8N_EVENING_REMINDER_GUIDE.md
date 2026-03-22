# n8n Evening Reminder Workflow Guide

## Overview

A scheduled workflow that sends Web Push notifications to parents at their configured evening reminder time, nudging them to create tonight's story.

**Trigger:** Schedule node — runs at 6:00 PM (18:00) daily via cron: `0 18 * * *`
**Sends:** Web Push notification to stored subscription

---

## Prerequisites

### 1. Generate VAPID Keys

Run this in your terminal:
```bash
npx web-push generate-vapid-keys
```

This gives you a **public key** and a **private key**:
- **Public key** → add to your `.env` as `VITE_VAPID_PUBLIC_KEY`
- **Private key** → store in n8n as a credential or environment variable (never in frontend code)
- **Email** → use your contact email for the VAPID subject (e.g. `mailto:hello@dreamstation.app`)

### 2. Install `web-push` npm package in n8n

If using n8n Cloud, you can use the HTTP Request node to call the Web Push API directly. Alternatively, use a Code node with the built-in `fetch` API.

---

## Workflow: "DreamStation Evening Reminder"

### Node 1: Schedule Trigger
- **Type:** Schedule Trigger
- **Mode:** Cron
- **Cron Expression:** `0 18 * * *` (6:00 PM daily)

### Node 2: Query Notification Preferences (Code node)

```javascript
// Query all notification preferences where evening_reminder_time matches current time
const now = new Date();
const currentHour = String(now.getUTCHours()).padStart(2, '0');
const currentMinute = String(now.getUTCMinutes()).padStart(2, '0');
const currentTime = `${currentHour}:${currentMinute}`;

console.log('Checking for reminders at:', currentTime);

return [{
  json: {
    currentTime: currentTime,
    checkTime: `${currentTime}:00` // Supabase time format HH:MM:SS
  }
}];
```

### Node 3: Fetch Matching Preferences (HTTP Request)
- **Method:** GET
- **URL:** `https://YOUR_SUPABASE_URL/rest/v1/notification_preferences?evening_reminder_time=eq.{{ $json.checkTime }}&push_subscription=not.is.null`
- **Auth:** Supabase API (service role key)
- **Headers:** `Content-Type: application/json`

### Node 4: Split Into Items
- **Type:** Split In Batches or loop over array
- Process each notification preference record individually

### Node 5: Fetch Child Profile (HTTP Request)
- **Method:** GET
- **URL:** `https://YOUR_SUPABASE_URL/rest/v1/child_profiles?id=eq.{{ $json.child_id }}&select=name,age,mode`
- **Auth:** Supabase API

### Node 6: Fetch Recent Session (HTTP Request)
- **Method:** GET
- **URL:** `https://YOUR_SUPABASE_URL/rest/v1/story_sessions?child_id=eq.{{ $('Fetch Matching Preferences').item.json.child_id }}&order=created_at.desc&limit=1`
- **Auth:** Supabase API

### Node 7: Build Notification (Code node)

```javascript
const prefs = $('Fetch Matching Preferences').item.json;
const childProfile = $('Fetch Child Profile').first().json;
const recentSessions = $('Fetch Recent Session').all().map(i => i.json);
const childName = childProfile?.name || 'your child';
const subscription = prefs.push_subscription;

if (!subscription || !subscription.endpoint) {
  console.log('No valid push subscription, skipping');
  return [];
}

// Check if there's a recent session (within last 48 hours)
let notificationBody;
let notificationTag = 'evening-reminder';

if (recentSessions.length > 0) {
  const lastSession = recentSessions[0];
  const sessionDate = new Date(lastSession.created_at);
  const hoursSince = (Date.now() - sessionDate.getTime()) / (1000 * 60 * 60);

  if (hoursSince < 48 && lastSession.story_prompt) {
    // Callback notification — reference last session
    const promptSummary = lastSession.story_prompt.length > 50
      ? lastSession.story_prompt.substring(0, 50) + '...'
      : lastSession.story_prompt;
    notificationBody = `Time for tonight's story — last night ${childName} wanted "${promptSummary}". What's on their mind tonight?`;
  } else {
    notificationBody = `Time to create tonight's story for ${childName} ✨`;
  }
} else {
  notificationBody = `Time to create tonight's story for ${childName} ✨`;
}

return [{
  json: {
    subscription: subscription,
    payload: {
      title: 'DreamStation',
      body: notificationBody,
      tag: notificationTag,
      url: '/?tab=create',
      actions: [
        { action: 'create', title: 'Create Story' }
      ]
    }
  }
}];
```

### Node 8: Send Web Push (HTTP Request)

This uses the Web Push protocol directly. You need to sign the request with your VAPID private key.

**Option A — Using n8n Code node with fetch (recommended for n8n Cloud):**

```javascript
// Web Push sending via the web-push protocol
// This requires computing the VAPID JWT — for simplicity, use Option B (external service) or
// deploy a small Lambda/Cloud Function that handles the web-push sending

const subscription = $json.subscription;
const payload = $json.payload;

// For n8n Cloud, the easiest approach is to call a small API endpoint
// that handles the web-push sending. See Option B below.

// If you have a self-hosted n8n with web-push npm available:
// const webpush = require('web-push');
// webpush.setVapidDetails('mailto:hello@dreamstation.app', VAPID_PUBLIC, VAPID_PRIVATE);
// await webpush.sendNotification(subscription, JSON.stringify(payload));

return [{ json: { sent: true, endpoint: subscription.endpoint } }];
```

**Option B — Lambda endpoint (recommended):**

Create a small AWS Lambda (you already have Lambda in your stack) that:
1. Receives `{ subscription, payload }` 
2. Uses the `web-push` npm package to send
3. Returns success/failure

Then call it from n8n via HTTP Request node.

**Lambda code (Node 22):**
```javascript
import webpush from 'web-push';

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:hello@dreamstation.app';

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);

export const handler = async (event) => {
  const body = JSON.parse(event.body);
  const { subscription, payload } = body;

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (error) {
    console.error('Push failed:', error);
    // If subscription is expired/invalid, return specific status
    if (error.statusCode === 410 || error.statusCode === 404) {
      return { statusCode: 410, body: JSON.stringify({ success: false, expired: true }) };
    }
    return { statusCode: 500, body: JSON.stringify({ success: false, error: error.message }) };
  }
};
```

**Lambda package.json:**
```json
{
  "type": "module",
  "dependencies": {
    "web-push": "^3.6.7"
  }
}
```

---

## Wiring Summary

```
Schedule Trigger (6:00 PM daily)
  → Query notification_preferences where evening_reminder_time = 18:00:00
  → For each: fetch child profile + recent session
  → Build notification payload (with/without callback)
  → Send Web Push via Lambda endpoint
```

---

## Testing

1. Generate VAPID keys and add to `.env` and Lambda
2. Complete onboarding → enable push notifications when prompted
3. Check `notification_preferences` in Supabase — `push_subscription` should be populated
4. Set your `evening_reminder_time` to 1 minute from now
5. Wait for the workflow to fire
6. Notification should appear on your device

---

## Notification Payload Format

The service worker in `public/sw.js` expects this JSON structure:

```json
{
  "title": "DreamStation",
  "body": "Time to create tonight's story for Luna ✨",
  "tag": "evening-reminder",
  "url": "/?tab=create",
  "actions": [
    { "action": "create", "title": "Create Story" }
  ]
}
```
