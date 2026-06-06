// Extract only the useful text nodes from HTML — headings, list items, links inside lists.
// This cuts the token count from ~15k to ~2-3k before sending to Gemini.
function extractSignalText(html) {
  // Drop scripts, styles, SVG, templates entirely
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  const lines = [];

  // Pull text from tags that carry meaningful content
  const tagRe = /<(h[1-6]|title|li|dt|td|th|label|a)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = tagRe.exec(cleaned)) !== null) {
    const text = m[2]
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
    if (text.length > 2 && text.length < 200) lines.push(text);
  }

  // Deduplicate while preserving order
  const seen = new Set();
  return lines.filter(l => {
    if (seen.has(l)) return false;
    seen.add(l);
    return true;
  }).join('\n');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url parameter' });
  if (!GEMINI_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY not configured on Vercel' });

  // Step 1: fetch the target URL
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

  // Step 2: pre-process content to minimise tokens sent to Gemini
  const isXml = rawContent.trimStart().startsWith('<?xml') || rawContent.includes('<feed');
  let content;
  if (isXml) {
    // YouTube RSS: keep raw XML but trim to 20k — titles are short, 20k covers ~200 videos
    content = rawContent.slice(0, 20_000);
  } else {
    // Web page: extract only signal text (headings, list items, etc.) — typically <5k tokens
    content = extractSignalText(rawContent).slice(0, 12_000);
  }

  if (content.trim().length < 10) {
    return res.status(422).json({
      error: 'The page appears to be empty or fully JavaScript-rendered. Try a different URL (e.g., a course syllabus page, a playlist RSS link, or a documentation index).',
    });
  }

  // Step 3: call Gemini
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

  let parsed;
  try {
    const gemRes = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0 },
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!gemRes.ok) {
      const errBody = await gemRes.json().catch(() => ({}));
      if (gemRes.status === 429) {
        return res.status(429).json({
          error: 'Gemini rate limit reached. Wait a moment and try again, or check your API quota at aistudio.google.com.',
        });
      }
      return res.status(502).json({ error: `Gemini error ${gemRes.status}: ${errBody?.error?.message || 'unknown'}` });
    }

    const gemJson = await gemRes.json();
    const text = gemJson?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(502).json({ error: 'Gemini returned no content' });

    parsed = JSON.parse(text);
  } catch (e) {
    return res.status(502).json({ error: `AI parsing failed: ${e.message}` });
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
  });
}
