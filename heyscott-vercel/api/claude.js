/**
 * api/claude.js — Vercel Serverless Function
 *
 * Proxies requests to the Anthropic API.
 * The ANTHROPIC_API_KEY lives here on the server — it is NEVER
 * sent to the browser or included in the built frontend code.
 *
 * Set ANTHROPIC_API_KEY in:
 *   Vercel Dashboard → Your Project → Settings → Environment Variables
 */

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: {
        type: 'config_error',
        message: 'ANTHROPIC_API_KEY is not set. Go to Vercel → Project Settings → Environment Variables and add it.',
      },
    });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({
      error: {
        type: 'proxy_error',
        message: 'Failed to reach Anthropic API: ' + err.message,
      },
    });
  }
}
