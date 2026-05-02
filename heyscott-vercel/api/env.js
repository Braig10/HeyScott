/**
 * api/env.js — Vercel Serverless Function
 *
 * Passes PUBLIC configuration to the frontend at runtime.
 * The Supabase anon key is safe to expose (it's a public key).
 * The ANTHROPIC_API_KEY is NOT included here — it stays server-side only.
 *
 * Set these in Vercel → Project Settings → Environment Variables:
 *   SUPABASE_URL       = https://zaqzhyxlticdkldflgnx.supabase.co
 *   SUPABASE_ANON_KEY  = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *   COMPANY_ID         = 1775cff8-3650-4950-b578-88a24efcdf62
 */

export default function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=3600'); // cache for 1 hour
  res.json({
    SUPABASE_URL:      process.env.SUPABASE_URL      || '',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
    COMPANY_ID:        process.env.COMPANY_ID        || '1775cff8-3650-4950-b578-88a24efcdf62',
  });
}
