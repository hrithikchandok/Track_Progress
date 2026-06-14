import { useState } from 'react';
import RichEditor from './RichEditor';

// The body document is stored as TipTap JSON in the `blocks` column.
// Coerce anything else (old block arrays, null) to an empty doc.
export function toDoc(blocks) {
  if (blocks && typeof blocks === 'object' && !Array.isArray(blocks) && blocks.type === 'doc') return blocks;
  return undefined;
}

export default function ArticleEditor({ initial, username, onBack, onSave, onPublishToggle, onDelete }) {
  const [title, setTitle] = useState(initial.title === 'Untitled' ? '' : (initial.title || ''));
  const [subtitle, setSubtitle] = useState(initial.subtitle || '');
  const [doc, setDoc] = useState(() => toDoc(initial.blocks));
  const [published, setPublished] = useState(!!initial.published);
  const [preview, setPreview] = useState(false);
  const [status, setStatus] = useState('');

  // `blocks` is NOT NULL in the DB — fall back to an empty doc, never null.
  const EMPTY_DOC = { type: 'doc', content: [] };
  const fields = () => ({ title: title.trim() || 'Untitled', subtitle: subtitle.trim() || null, blocks: doc || EMPTY_DOC });

  async function doSave() {
    setStatus('Saving…');
    await onSave(fields());
    setStatus('Saved ✓');
    setTimeout(() => setStatus(''), 1500);
  }

  async function togglePublish() {
    const next = !published;
    setStatus(next ? 'Publishing…' : 'Unpublishing…');
    await onSave(fields());
    await onPublishToggle(next);
    setPublished(next);
    setStatus(next ? 'Published ✓' : 'Switched to draft');
    setTimeout(() => setStatus(''), 1800);
  }

  async function back() {
    await onSave(fields());
    onBack();
  }

  return (
    <div className="wrap article-editor">
      <div className="ae-toolbar">
        <button className="btn" onClick={back}>← Back</button>
        <span className={`ae-status${published ? ' pub' : ''}`}>
          {status || (published ? '● Published' : '○ Draft')}
        </span>
        <div className="ae-toolbar-right">
          <button className="btn" onClick={() => setPreview(p => !p)}>{preview ? 'Edit' : 'Preview'}</button>
          <button className="btn" onClick={doSave}>Save</button>
          <button className={`btn ${published ? '' : 'btn-primary'}`} onClick={togglePublish}>
            {published ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </div>

      {published && username && (
        <a className="ae-public-link" href={`/u/${username}/article/${initial.id}`} target="_blank" rel="noopener noreferrer">
          ↗ View public article
        </a>
      )}

      <input className="ae-title" value={title} placeholder="Title" onChange={e => setTitle(e.target.value)} />
      <input className="ae-subtitle" value={subtitle} placeholder="Add a subtitle…" onChange={e => setSubtitle(e.target.value)} />

      {preview ? (
        <div className="article-body">
          <RichEditor content={doc} editable={false} />
        </div>
      ) : (
        <RichEditor content={doc} editable onChange={setDoc} />
      )}

      {!preview && <button className="ae-delete" onClick={onDelete}>Delete article</button>}
    </div>
  );
}
