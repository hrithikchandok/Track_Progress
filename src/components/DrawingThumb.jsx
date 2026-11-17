import { useEffect, useState } from 'react';

// Renders a static preview of an Excalidraw scene as SVG. The Excalidraw
// bundle is imported lazily, and each rendered preview is cached in memory by
// drawing version so re-selecting a drawing is instant.
const svgCache = new Map();

export default function DrawingThumb({ data, cacheKey, title }) {
  const [url, setUrl] = useState(() => svgCache.get(cacheKey) || '');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (svgCache.has(cacheKey)) { setUrl(svgCache.get(cacheKey)); setFailed(false); return; }
    let alive = true;
    setUrl(''); setFailed(false);
    (async () => {
      try {
        const { exportToSvg } = await import('@excalidraw/excalidraw');
        const svg = await exportToSvg({
          elements: data.scene.elements.filter(e => !e.isDeleted),
          files: data.scene.files || {},
          appState: { exportBackground: false, viewBackgroundColor: 'transparent', exportWithDarkMode: false },
          exportPadding: 16,
        });
        const markup = new XMLSerializer().serializeToString(svg);
        const objectUrl = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml' }));
        if (svgCache.size >= 24) { URL.revokeObjectURL(svgCache.values().next().value); svgCache.delete(svgCache.keys().next().value); }
        svgCache.set(cacheKey, objectUrl);
        if (alive) setUrl(objectUrl);
      } catch {
        if (alive) setFailed(true);
      }
    })();
    return () => { alive = false; };
  }, [cacheKey, data]);

  if (failed) return <span className="thumb-msg">Preview unavailable · open the canvas</span>;
  if (!url) return <span className="thumb-skel" aria-hidden="true" />;
  return <img className="drawing-thumb" src={url} alt={`Preview of ${title}`} draggable="false" />;
}
