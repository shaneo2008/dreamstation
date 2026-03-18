# DreamStation Web Push Sender — Lambda Deployment

## Setup

### 1. Generate VAPID Keys
```bash
npx web-push generate-vapid-keys
```
Save both keys. Public key goes in your frontend `.env`, private key goes in Lambda env vars.

### 2. Install & Package
```bash
cd lambda/web-push-sender
npm install
zip -r function.zip index.mjs node_modules package.json package-lock.json
```

### 3. Deploy to AWS Lambda
- **Runtime:** Node.js 22.x
- **Handler:** index.handler
- **Architecture:** arm64 (cheaper) or x86_64
- **Memory:** 128 MB (sufficient)
- **Timeout:** 10 seconds

### 4. Environment Variables
| Variable | Value |
|----------|-------|
| `VAPID_PUBLIC_KEY` | Your VAPID public key |
| `VAPID_PRIVATE_KEY` | Your VAPID private key |
| `VAPID_EMAIL` | `mailto:hello@dreamstation.app` (your contact email) |

### 5. Add API Gateway Trigger
- Create an HTTP API (API Gateway v2)
- Route: `POST /send-push`
- Note the invoke URL — this is your `WEB_PUSH_LAMBDA_URL`

### 6. Configure n8n
Add the Lambda URL as an n8n environment variable:
- **Variable name:** `WEB_PUSH_LAMBDA_URL`
- **Value:** `https://YOUR_API_GATEWAY_ID.execute-api.REGION.amazonaws.com/send-push`

### 7. Add VAPID Public Key to Frontend
In your `.env`:
```
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key_here
```

### 8. Add Claude API Key to n8n
Add as an n8n environment variable:
- **Variable name:** `CLAUDE_API_KEY`
- **Value:** Your Anthropic API key (starts with `sk-ant-`)

## Request Format

```json
POST /send-push
{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  },
  "payload": {
    "title": "DreamStation",
    "body": "Time for tonight's story ✨",
    "tag": "evening-reminder",
    "url": "/?tab=create"
  }
}
```

## Response Codes
| Code | Meaning |
|------|---------|
| 200 | Push sent successfully |
| 400 | Bad request (missing subscription/payload) |
| 410 | Subscription expired — remove from database |
| 500 | Server error |
