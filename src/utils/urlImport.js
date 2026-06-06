import { genId, slugify } from './id';
import { PRESET_COLORS } from '../data/sections';

// ─── Production path: Gemini-powered server-side extraction ──────────────────

async function fetchViaGemini(url) {
  const res = await fetch(`/api/parse-url?url=${encodeURIComponent(url)}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `Server error ${res.status}`);
  return json; // { title, sub, unit, items: [{text}] }
}

// ─── Dev fallback: allorigins proxy + basic DOM parsing ──────────────────────

async function proxyFetch(url) {
  const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error(`Proxy error ${res.status}`);
  const json = await res.json();
  if (json.status?.http_code >= 400) throw new Error(`Remote returned ${json.status.http_code}`);
  return json.contents ?? '';
}

async function devFetchYouTubePlaylist(playlistId) {
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`;
  let xml;
  try { xml = await proxyFetch(rssUrl); }
  catch { throw new Error('Could not reach YouTube. Check the URL and try again.'); }
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('YouTube returned an unexpected response. The playlist may be private.');
  const channelTitle = doc.querySelector('feed > title')?.textContent?.trim() || 'YouTube Playlist';
  const entries = [...doc.querySelectorAll('entry')];
  if (entries.length === 0) throw new Error('This playlist appears to be empty or private.');
  return {
    title: channelTitle,
    sub: `${entries.length} videos · YouTube`,
    unit: 'videos',
    items: entries.map(e => ({ text: e.querySelector('title')?.textContent?.trim() || 'Untitled video' })),
  };
}

async function devFetchWebPage(url) {
  let html;
  try { html = await proxyFetch(url); }
  catch { throw new Error('Could not fetch that page. Make sure the URL is public and try again.'); }
  const doc = new DOMParser().parseFromString(html, 'text/html');
  ['nav', 'footer', 'aside', 'script', 'style', 'header'].forEach(tag =>
    doc.querySelectorAll(tag).forEach(el => el.remove())
  );
  const pageTitle =
    doc.querySelector('title')?.textContent?.trim() ||
    doc.querySelector('h1')?.textContent?.trim() ||
    new URL(url).hostname;
  let candidates = [...doc.querySelectorAll('h2, h3, h4')]
    .map(h => h.textContent.trim())
    .filter(t => t.length > 2 && t.length < 150);
  if (candidates.length < 3) {
    candidates = [...doc.querySelectorAll('ul li, ol li')]
      .map(li => li.textContent.trim())
      .filter(t => t.length > 2 && t.length < 150)
      .slice(0, 60);
  }
  if (candidates.length === 0) throw new Error('Could not extract content. The page may require a login or use JavaScript rendering.');
  const hostname = new URL(url).hostname.replace('www.', '');
  return {
    title: pageTitle,
    sub: `${candidates.length} items · ${hostname}`,
    unit: 'items',
    items: candidates.map(text => ({ text })),
  };
}

// ─── Public entry point ───────────────────────────────────────────────────────

function buildSection(raw, url) {
  const color = PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
  return {
    id: genId(),
    title: raw.title || 'Imported Section',
    sub: raw.sub || `${raw.items.length} items`,
    unit: raw.unit || 'items',
    color,
    track: slugify(raw.title || 'imported'),
    sup: false,
    items: raw.items.map(item => ({ id: genId(), text: item.text })),
  };
}

export async function fetchSectionFromUrl(rawUrl) {
  const url = rawUrl.trim();

  // Validate it looks like a URL
  try { new URL(url); } catch { throw new Error('That doesn\'t look like a valid URL.'); }

  if (import.meta.env.DEV) {
    // Dev: use basic DOM parsing via allorigins (no Gemini key needed locally)
    const ytMatch = url.match(/[?&]list=([A-Za-z0-9_-]+)/);
    if (ytMatch && url.includes('youtube.com')) {
      const raw = await devFetchYouTubePlaylist(ytMatch[1]);
      return buildSection(raw, url);
    }
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      throw new Error('Paste a YouTube playlist URL — one that contains ?list= in the address bar.');
    }
    const raw = await devFetchWebPage(url);
    return buildSection(raw, url);
  }

  // Production: full Gemini-powered extraction
  if (url.includes('youtube.com') && !url.match(/[?&]list=/)) {
    throw new Error('Paste a YouTube playlist URL — one that contains ?list= in the address bar.');
  }
  const raw = await fetchViaGemini(url);
  return buildSection(raw, url);
}
