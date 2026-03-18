const webpush = require('web-push');

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:hello@dreamstation.app';

if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
  console.error('VAPID keys not configured in environment variables');
} else {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS' || event.requestContext?.http?.method === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: 'Invalid JSON body' }),
    };
  }

  const { subscription, payload } = body;

  if (!subscription || !subscription.endpoint) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: 'Missing subscription or endpoint' }),
    };
  }

  try {
    const result = await webpush.sendNotification(
      subscription,
      JSON.stringify(payload),
      { TTL: 3600 }
    );

    console.log('Push sent successfully:', result.statusCode);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, statusCode: result.statusCode }),
    };
  } catch (error) {
    console.error('Push failed:', error.statusCode, error.message);

    if (error.statusCode === 410 || error.statusCode === 404) {
      return {
        statusCode: 410,
        headers,
        body: JSON.stringify({
          success: false,
          expired: true,
          error: 'Subscription expired or invalid',
        }),
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};
