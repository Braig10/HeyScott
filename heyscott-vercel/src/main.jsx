import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

/**
 * Fetch public config from the server before mounting.
 * This gives window._env to the app so Supabase connects correctly.
 * The Anthropic API key is NOT here — it stays in api/claude.js.
 */
async function init() {
  try {
    const res = await fetch('/api/env')
    if (res.ok) {
      window._env = await res.json()
    } else {
      window._env = {}
    }
  } catch (e) {
    // If /api/env fails (e.g. local dev without server), continue with empty config
    window._env = {}
  }

  ReactDOM.createRoot(document.getElementById('root')).render(<App />)
}

init()
