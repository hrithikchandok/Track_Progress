import { useState } from 'react';
import { fetchSectionFromUrl } from '../utils/urlImport';

export default function LinkImportModal({ onImport, onClose }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleImport() {
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    try {
      const section = await fetchSectionFromUrl(url.trim());
      onImport(section);
      onClose();
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter') handleImport();
    if (e.key === 'Escape') onClose();
  }

  return (
    <div className="modal" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card" style={{ maxWidth: 480 }}>
        <div className="kicker" style={{ marginBottom: 8 }}>New section from link</div>
        <h3 style={{ fontSize: 18, marginBottom: 6 }}>Import from URL</h3>
        <p style={{ marginBottom: 20, fontSize: 13, color: 'var(--muted)' }}>
          Paste a YouTube playlist or any public webpage (course syllabus, docs, article).
          We'll pull the content and create a section you can track.
        </p>

        <label className="field-label">URL</label>
        <input
          className="auth-input"
          placeholder="https://www.youtube.com/playlist?list=… or any public URL"
          value={url}
          onChange={e => { setUrl(e.target.value); setError(''); }}
          onKeyDown={handleKey}
          autoFocus
          disabled={loading}
        />

        {error && (
          <div className="modal-err" style={{ marginTop: 8 }}>{error}</div>
        )}

        <div style={{ marginTop: 8, marginBottom: 20, fontSize: 11, color: 'var(--faint)', fontFamily: 'var(--mono)' }}>
          Works best with: YouTube playlists · course outline pages · documentation indexes
        </div>

        <div className="modal-row">
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={handleImport}
            disabled={!url.trim() || loading}
          >
            {loading ? 'Fetching…' : 'Create section'}
          </button>
          <button className="btn" onClick={onClose} disabled={loading}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
