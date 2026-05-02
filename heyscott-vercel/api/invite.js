export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, companyId } = req.body || {};
  if (!email || !companyId) return res.status(400).json({ error: "email and companyId are required" });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({ error: "Supabase service role key not configured" });
  }

  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SERVICE_KEY,
        "Authorization": `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({
        email,
        email_confirm: false,
        user_metadata: {
          role: "learner",
          company_id: companyId,
        },
      }),
    });

    const data = await r.json();

    if (!r.ok || data.error || !data.id) {
      const msg = data.error?.message || data.msg || "Failed to invite user";
      return res.status(400).json({ error: msg });
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: "Server error — please try again" });
  }
}
