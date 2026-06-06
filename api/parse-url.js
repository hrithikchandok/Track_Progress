function extractSignalText(html) {
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  const lines = [];
  const tagRe = /<(h[1-6]|title|li|dt|td|th|label|a)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = tagRe.exec(cleaned)) !== null) {
    const text = m[2]
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ').trim();
    if (text.length > 2 && text.length < 200) lines.push(text);
  }

  const seen = new Set();
  return lines.filter(l => { if (seen.has(l)) return false; seen.add(l); return true; }).join('\n');
}

// Basic fallback extraction when Gemini is unavailable
function extractFallback(rawHtml, url) {
  const signal = extractSignalText(rawHtml);
  const lines = signal.split('\n').filter(Boolean);

  // First non-short line is likely the title
  const title = lines.find(l => l.length > 5) || new URL(url).hostname;

  // Prefer lines that look like content (not nav/footer noise)
  const stopwords = /^(home|about|contact|login|sign in|sign up|menu|search|back|next|previous|cookie|privacy|terms)$/i;
  const items = lines
    .filter(l => l.length > 3 && l.length < 150 && !stopwords.test(l.trim()))
    .slice(0, 80)
    .map(text => ({ text }));

  const hostname = new URL(url).hostname.replace('www.', '');
  return {
    title,
    sub: `${items.length} items · ${hostname}`,
    unit: 'items',
    items,
  };
}

// Parse YouTube RSS feed without Gemini
function extractYouTubeFallback(xml) {
  const titleMatch = xml.match(/<feed[^>]*>[\s\S]*?<title[^>]*>([^<]+)<\/title>/i);
  const feedTitle = titleMatch ? titleMatch[1].trim() : 'YouTube Playlist';
  const entryTitles = [];
  const entryRe = /<entry[\s\S]*?<title[^>]*>([^<]+)<\/title>[\s\S]*?<\/entry>/gi;
  let m;
  while ((m = entryRe.exec(xml)) !== null) entryTitles.push(m[1].trim());
  return {
    title: feedTitle,
    sub: `${entryTitles.length} videos · YouTube`,
    unit: 'videos',
    items: entryTitles.map(text => ({ text })),
  };
}

async function callGemini(endpoint, content, isXml) {
  const prompt = `Extract study/learning content from the text below to create a trackable progress section.

Return ONLY valid JSON with exactly this shape (no markdown, no explanation):
{"title":"…","sub":"…","unit":"videos|chapters|topics|lessons|problems|items","items":[{"text":"…"}]}

Rules:
- title: main subject or course name
- sub: concise subtitle like "150 problems · neetcode.io" or "12 videos · YouTube"
- unit: best word for one item (problems, videos, lessons, chapters, topics, items)
- items: every individual thing to study/complete — use the exact names, no paraphrasing
- Omit navigation, ads, cookie banners, login prompts, and site-chrome links
- Max 100 items, each text under 120 chars

Content:
${content}`;

  const gemRes = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0 },
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (gemRes.status === 429) return null; // signal to retry / fall back
  if (!gemRes.ok) {
    const errBody = await gemRes.json().catch(() => ({}));
    throw new Error(`Gemini ${gemRes.status}: ${errBody?.error?.message || 'unknown'}`);
  }

  const gemJson = await gemRes.json();
  const text = gemJson?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned no content');
  return JSON.parse(text);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url parameter' });
  if (!GEMINI_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY not configured on Vercel' });

  // Fetch the target URL
  let rawContent;
  try {
    const upstream = await fetch(decodeURIComponent(url), {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TrackProgress/1.0)' },
      signal: AbortSignal.timeout(12_000),
    });
    if (!upstream.ok) return res.status(502).json({ error: `Remote returned ${upstream.status}` });
    rawContent = await upstream.text();
  } catch (e) {
    return res.status(502).json({ error: `Could not fetch URL: ${e.message}` });
  }

  const isXml = rawContent.trimStart().startsWith('<?xml') || rawContent.includes('<feed');
  const content = isXml
    ? rawContent.slice(0, 20_000)
    : extractSignalText(rawContent).slice(0, 12_000);

  // Try Gemini with one automatic retry on 429
  let parsed = null;
  try {
    parsed = await callGemini(GEMINI_ENDPOINT, content, isXml);
    if (parsed === null) {
      await sleep(4000);
      parsed = await callGemini(GEMINI_ENDPOINT, content, isXml);
    }
  } catch (e) {
    return res.status(502).json({ error: `AI parsing failed: ${e.message}` });
  }

  // If still rate-limited after retry, fall back to local extraction
  if (parsed === null) {
    parsed = isXml ? extractYouTubeFallback(rawContent) : extractFallback(rawContent, decodeURIComponent(url));
    parsed._fallback = true;
  }

  if (!parsed?.items || !Array.isArray(parsed.items) || parsed.items.length === 0) {
    return res.status(422).json({
      error: 'No content could be extracted. The page may require a login or render via JavaScript.',
    });
  }

  res.status(200).json({
    title: parsed.title || 'Imported Section',
    sub: parsed.sub || `${parsed.items.length} items`,
    unit: parsed.unit || 'items',
    items: parsed.items,
    _fallback: parsed._fallback ?? false,
  });
}
