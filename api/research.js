// One serverless function, running on Vercel. The only place that holds the secret keys.
//   GET  /api/research          -> list past research from Supabase (newest first)
//   GET  /api/research?id=12    -> one saved brief
//   POST /api/research          -> research a company with Gemini + Google Search, save the brief

export const config = { maxDuration: 60 }; // web research can take 15 to 40 seconds

const { GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

// ---------- Supabase: the data ----------
async function db(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SECRET_KEY,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(options.headers || {})
    }
  });
  if (!res.ok) throw new Error(`Supabase: ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

// ---------- Gemini: the thinking ----------
async function research(company) {
  const prompt = `You are a research analyst at an advisory firm that helps founders and CEOs with
growth, margin improvement, fundraising and M&A. Use Google Search to research the company "${company}".

Return ONLY a JSON object, with no other text, using exactly these keys:
{
  "company": "official company name",
  "one_liner": "what the company does, in one sentence",
  "sector": "sector and business model",
  "headquarters": "city, country",
  "founded": "year, or Unknown",
  "size_signals": ["facts about scale: funding raised, revenue, employees, stores. Give the year and say 'reported' for each"],
  "key_people": ["Name, Role"],
  "recent_news": ["one line per item, newest first, with month and year"],
  "likely_challenges": ["3 business challenges this company probably faces, based on the evidence"],
  "how_we_could_help": ["2 or 3 specific ways an advisory firm could help, tied to the challenges"],
  "opening_line": "a natural first line for an email to the founder, referring to something specific and recent"
}

Rules: do not invent facts. If you cannot find something, write "Not found".
If the name is ambiguous, pick the most prominent company and say so in one_liner.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],          // lets Gemini search the live web
        generationConfig: { temperature: 0.2 }
      })
    }
  );
  if (!res.ok) throw new Error(`Gemini: ${await res.text()}`);
  const data = await res.json();
  const cand = data?.candidates?.[0];
  const text = cand?.content?.parts?.map(p => p.text || '').join('') || '';

  // Pull the JSON object out of the reply, even if the model wrapped it in other text
  const start = text.indexOf('{'), end = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Gemini did not return a brief. Try again.');
  const brief = JSON.parse(text.slice(start, end + 1));

  // The web pages Gemini actually used
  const seen = new Set();
  const sources = (cand?.groundingMetadata?.groundingChunks || [])
    .map(c => c.web).filter(Boolean)
    .filter(w => !seen.has(w.uri) && seen.add(w.uri))
    .slice(0, 8)
    .map(w => ({ title: w.title || w.uri, url: w.uri }));

  return { brief, sources };
}

// ---------- The handler ----------
export default async function handler(req, res) {
  try {
    if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_SECRET_KEY) {
      return res.status(500).json({ error: 'Missing environment variables. Check step 7 in the README.' });
    }

    if (req.method === 'GET') {
      if (req.query.id) {
        const rows = await db(`research?id=eq.${Number(req.query.id)}&select=*`);
        return res.status(200).json(rows[0] || null);
      }
      const rows = await db('research?select=id,company,created_at&order=created_at.desc&limit=50');
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const company = String(req.body?.company || '').trim().slice(0, 120);
      if (!company) return res.status(400).json({ error: 'Type a company name first.' });

      const { brief, sources } = await research(company);
      const saved = await db('research', {
        method: 'POST',
        body: JSON.stringify({ company: brief.company || company, brief, sources })
      });
      return res.status(200).json(saved[0]);
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
