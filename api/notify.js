/**
 * api/notify.js — Vercel Serverless Function
 *
 * Receives module gap notifications from the onboarding flow
 * and logs them. Extend this to send emails if needed.
 *
 * Optional: set NOTIFY_EMAIL in Vercel environment variables
 * to receive email alerts when a curriculum gap is detected.
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body;

    // Log the notification (visible in Vercel function logs)
    console.log('📚 Module gap detected:', {
      user:     payload.userName,
      focus:    payload.userFocus,
      gap:      payload.reason,
      module:   payload.suggestedModule,
      priority: payload.priority,
      time:     payload.timestamp,
    });

    // Optional: send to Supabase for manager visibility
    // You can extend this to email via Resend, SendGrid, etc.

    return res.status(200).json({ ok: true });
  } catch (err) {
    // Never fail — this is fire-and-forget
    return res.status(200).json({ ok: true });
  }
}
