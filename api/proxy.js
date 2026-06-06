export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url parameter' });

  let upstream;
  try {
    upstream = await fetch(decodeURIComponent(url), {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TrackProgress/1.0)' },
    });
  } catch (e) {
    return res.status(502).json({ error: `Could not reach remote: ${e.message}` });
  }

  if (!upstream.ok) {
    return res.status(upstream.status).json({ error: `Remote returned ${upstream.status}` });
  }

  const text = await upstream.text();
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', upstream.headers.get('content-type') || 'text/plain; charset=utf-8');
  res.status(200).send(text);
}
