import { useState, useRef, useLayoutEffect } from 'react';
import { newBlock, BLOCK_TYPES } from '../utils/articleBlocks';
import ArticleRenderer from './ArticleRenderer';

// Textarea that grows with its content.
function Auto({ value, onChange, placeholder, className }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, [value]);
  return (
    <textarea
      ref={ref}
      className={className}
      value={value}
      placeholder={placeholder}
      rows={1}
      onChange={e => onChange(e.target.value)}
    />
  );
}

function BlockEditor({ block, onChange }) {
  switch (block.type) {
    case 'heading':
      return <Auto className="be-heading" value={block.text} placeholder="Heading" onChange={t => onChange({ text: t })} />;
    case 'quote':
      return <Auto className="be-quote" value={block.text} placeholder="Quote" onChange={t => onChange({ text: t })} />;
    case 'image':
      return (
        <div className="be-image">
          <input className="be-input" value={block.url} placeholder="Paste image URL (https://…)" onChange={e => onChange({ url: e.target.value })} />
          {block.url && <img className="be-image-preview" src={block.url} alt="" />}
          <input className="be-input be-caption" value={block.caption} placeholder="Caption (optional)" onChange={e => onChange({ caption: e.target.value })} />
        </div>
      );
    case 'code':
      return (
        <div className="be-code">
          <input className="be-input be-lang" value={block.lang} placeholder="language (optional)" onChange={e => onChange({ lang: e.target.value })} />
          <Auto className="be-code-area" value={block.code} placeholder="Paste or write code…" onChange={c => onChange({ code: c })} />
        </div>
      );
    case 'divider':
      return <div className="be-divider"><span>section divider</span></div>;
    default:
      return <Auto className="be-paragraph" value={block.text} placeholder="Tell your story…" onChange={t => onChange({ text: t })} />;
  }
}

export default function ArticleEditor({ initial, username, onBack, onSave, onPublishToggle, onDelete }) {
  const [title, setTitle] = useState(initial.title === 'Untitled' ? '' : (initial.title || ''));
  const [subtitle, setSubtitle] = useState(initial.subtitle || '');
  const [blocks, setBlocks] = useState(initial.blocks || []);
  const [published, setPublished] = useState(!!initial.published);
  const [preview, setPreview] = useState(false);
  const [status, setStatus] = useState('');

  const fields = () => ({ title: title.trim() || 'Untitled', subtitle: subtitle.trim() || null, blocks });

  function patch(id, p) { setBlocks(bs => bs.map(b => (b.id === id ? { ...b, ...p } : b))); }
  function add(type) { setBlocks(bs => [...bs, newBlock(type)]); }
  function remove(id) { setBlocks(bs => bs.filter(b => b.id !== id)); }
  function move(id, dir) {
    setBlocks(bs => {
      const i = bs.findIndex(b => b.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= bs.length) return bs;
      const copy = [...bs];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }

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
          ↗ View public article at /u/{username}/article/{initial.id.slice(0, 6)}…
        </a>
      )}

      {preview ? (
        <ArticleRenderer title={title || 'Untitled'} subtitle={subtitle} blocks={blocks} />
      ) : (
        <>
          <input className="ae-title" value={title} placeholder="Title" onChange={e => setTitle(e.target.value)} />
          <input className="ae-subtitle" value={subtitle} placeholder="Add a subtitle…" onChange={e => setSubtitle(e.target.value)} />

          <div className="ae-blocks">
            {blocks.map((b, i) => (
              <div key={b.id} className="ae-block">
                <div className="ae-block-rail">
                  <button className="ae-rail-btn" onClick={() => move(b.id, -1)} disabled={i === 0} title="Move up">↑</button>
                  <button className="ae-rail-btn" onClick={() => move(b.id, 1)} disabled={i === blocks.length - 1} title="Move down">↓</button>
                  <button className="ae-rail-btn danger" onClick={() => remove(b.id)} title="Delete block">✕</button>
                </div>
                <div className="ae-block-body">
                  <BlockEditor block={b} onChange={p => patch(b.id, p)} />
                </div>
              </div>
            ))}
            {blocks.length === 0 && <p className="ae-empty">Add your first block below — text, an image, code, a quote, or a divider.</p>}
          </div>

          <div className="ae-add">
            <span className="ae-add-label">Add block</span>
            {BLOCK_TYPES.map(bt => (
              <button key={bt.type} className="ae-add-btn" onClick={() => add(bt.type)}>
                <span className="ae-add-glyph">{bt.glyph}</span> {bt.label}
              </button>
            ))}
          </div>

          <button className="ae-delete" onClick={onDelete}>Delete article</button>
        </>
      )}
    </div>
  );
}
