export async function callAPI(messages, system, opts={}) {
  const model      = opts.model      || "claude-sonnet-4-6";
  const max_tokens = opts.max_tokens || 1000;
  const temperature = opts.temperature ?? 0.7;
  const body = {model, max_tokens, messages, temperature};
  if(system) body.system = system;

  const fetchPromise = fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  }).then(async r => {
    const text = await r.text();
    // If the server returned HTML, /api/claude is missing or misconfigured
    if (text.trimStart().startsWith("<")) {
      if (r.status === 404) throw new Error("The /api/claude route wasn't found — make sure api/claude.js is deployed to Vercel.");
      throw new Error(`Server returned an HTML error page (HTTP ${r.status}). Check your Vercel deployment and ANTHROPIC_API_KEY environment variable.`);
    }
    try {
      return JSON.parse(text);
    } catch(e) {
      throw new Error(`Unexpected response from /api/claude (not valid JSON): ${text.slice(0, 120)}`);
    }
  });

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Request timed out after 30s — please try again")), 30000)
  );

  const d = await Promise.race([fetchPromise, timeoutPromise]);
  if(d.error) throw new Error(d.error.message || d.error.type || "API error");
  if(!d.content?.[0]?.text) throw new Error("No response received — please try again");
  return d.content[0].text;
}
export function parseJSON(t){return JSON.parse(t.replace(/```json\s*/g,"").replace(/```\s*/g,"").trim());}