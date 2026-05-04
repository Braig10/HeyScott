export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { userId, teamName, token } = req.body || {};
  if (!userId || !teamName) return res.status(400).json({ error: "userId and teamName are required" });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({ error: "Supabase service role key not configured" });
  }

  const headers = {
    "Content-Type": "application/json",
    "apikey": SERVICE_KEY,
    "Authorization": `Bearer ${SERVICE_KEY}`,
    "Prefer": "return=representation",
  };

  try {
    // 1. Create company record
    const companyRes = await fetch(`${SUPABASE_URL}/rest/v1/companies`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name: teamName }),
    });
    const companies = await companyRes.json();
    if (!companyRes.ok || !Array.isArray(companies) || !companies[0]?.id) {
      return res.status(500).json({ error: "Failed to create company record" });
    }
    const companyId = companies[0].id;

    // 2. Update manager's profile with role and company_id
    await fetch(`${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${userId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ role: "manager", company_id: companyId }),
    });

    return res.status(200).json({ companyId });
  } catch (e) {
    return res.status(500).json({ error: "Server error — please try again" });
  }
}
