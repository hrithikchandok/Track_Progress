function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, ' ')
    .trim();
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
      signal: AbortSignal.timeout(10_000),
    });
    if (!upstream.ok) return res.status(502).json({ error: `Remote returned ${upstream.status}` });
    rawContent = await upstream.text();
  } catch (e) {
    return res.status(502).json({ error: `Could not fetch URL: ${e.message}` });
  }

  // Step 2: clean up — keep XML as-is (YouTube RSS), strip HTML for web pages
  const isXml = rawContent.trimStart().startsWith('<?xml') || rawContent.includes('<feed');
  const content = isXml ? rawContent : stripHtml(rawContent);
  const truncated = content.slice(0, 60_000);

  // Step 3: call Gemini to extract structured section data
  const prompt = `You are extracting study/learning content from a webpage or YouTube playlist to create a trackable section.

Return ONLY valid JSON (no markdown fences, no explanation) matching exactly this shape:
{
  "title": "section title from the page",
  "sub": "short subtitle e.g. '12 videos · course name' or '18 chapters · site.com'",
  "unit": "videos OR chapters OR topics OR lessons OR items",
  "items": [
    { "text": "item name" }
  ]
}

Rules:
- items = the actual things to study/watch/complete (video titles, chapters, topic names, lesson names)
- For YouTube RSS feed: each <entry><title> is one item; use the <feed><title> as the section title
- For web pages: extract headings (h1/h2/h3), course modules, syllabus entries, or numbered lessons
- Skip navigation, ads, footers, cookie banners, login prompts, and sidebar links
- Keep each item text under 120 characters
- Maximum 80 items
- Be accurate and complete — do not summarise or paraphrase item names, use the exact titles

Content to parse:
${truncated}`;

  let parsed;
  try {
    const gemRes = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0,
        },
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!gemRes.ok) {
      const errText = await gemRes.text();
      return res.status(502).json({ error: `Gemini error ${gemRes.status}`, detail: errText });
    }

    const gemJson = await gemRes.json();
    const text = gemJson?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(502).json({ error: 'Gemini returned no content' });

    parsed = JSON.parse(text);
  } catch (e) {
    return res.status(502).json({ error: `AI parsing failed: ${e.message}` });
  }

  if (!parsed?.items || !Array.isArray(parsed.items) || parsed.items.length === 0) {
    return res.status(422).json({ error: 'No content could be extracted from this URL. It may require a login or render content via JavaScript.' });
  }

  res.status(200).json({
    title: parsed.title || 'Imported Section',
    sub: parsed.sub || `${parsed.items.length} items`,
    unit: parsed.unit || 'items',
    items: parsed.items,
  });
}
