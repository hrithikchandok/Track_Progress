import { genId, slugify } from './id';

const PROXY = 'https://api.allorigins.win/get?url=';

async function proxyFetch(url) {
  const res = await fetch(`${PROXY}${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error(`Proxy error ${res.status}`);
  const json = await res.json();
  if (json.status?.http_code && json.status.http_code >= 400) {
    throw new Error(`Remote returned ${json.status.http_code}`);
  }
  return json.contents ?? '';
}

export async function fetchSectionFromUrl(rawUrl) {
  const url = rawUrl.trim();

  const ytPlaylistMatch = url.match(/[?&]list=([A-Za-z0-9_-]+)/);
  if (ytPlaylistMatch && url.includes('youtube.com')) {
    return fetchYouTubePlaylist(ytPlaylistMatch[1]);
  }

  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    throw new Error('Paste a YouTube playlist URL — one that contains ?list= in the address bar.');
  }

  return fetchWebPage(url);
}

async function fetchYouTubePlaylist(playlistId) {
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`;
  let xml;
  try { xml = await proxyFetch(rssUrl); }
  catch { throw new Error('Could not reach YouTube. Check the URL and try again.'); }
  const doc = new DOMParser().parseFromString(xml, 'application/xml');

  if (doc.querySelector('parsererror')) throw new Error('YouTube returned an unexpected response. The playlist may be private.');

  const channelTitle = doc.querySelector('feed > title')?.textContent?.trim() || 'YouTube Playlist';
  const entries = [...doc.querySelectorAll('entry')];
  if (entries.length === 0) throw new Error('This playlist appears to be empty or private.');

  const items = entries.map(entry => ({
    id: genId(),
    text: entry.querySelector('title')?.textContent?.trim() || 'Untitled video',
  }));

  return {
    id: genId(),
    title: channelTitle,
    sub: `${items.length} videos · YouTube`,
    unit: 'videos',
    color: '#f87171',
    track: slugify(channelTitle),
    sup: false,
    items,
  };
}

async function fetchWebPage(url) {
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

  // Prefer heading structure (h2/h3/h4) — best for course pages and docs
  let candidates = [...doc.querySelectorAll('h2, h3, h4')]
    .map(h => h.textContent.trim())
    .filter(t => t.length > 2 && t.length < 150);

  // Fallback: list items — works for curricula / syllabus pages
  if (candidates.length < 3) {
    candidates = [...doc.querySelectorAll('ul li, ol li')]
      .map(li => li.textContent.trim())
      .filter(t => t.length > 2 && t.length < 150)
      .slice(0, 60);
  }

  if (candidates.length === 0) {
    throw new Error(
      'Could not extract any content from this page. It may require a login or render content via JavaScript.'
    );
  }

  const items = candidates.map(text => ({ id: genId(), text }));
  const hostname = new URL(url).hostname.replace('www.', '');

  return {
    id: genId(),
    title: pageTitle,
    sub: `${items.length} items · ${hostname}`,
    unit: 'items',
    color: '#5fb4e8',
    track: slugify(pageTitle),
    sup: false,
    items,
  };
}
