import { useState, useEffect } from 'react';
import { sb } from '../lib/supabase';
import { useArticles } from '../hooks/useArticles';
import TopNav from '../components/TopNav';
import ArticleEditor from '../components/ArticleEditor';

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ArticlesPage({ userId, onSignOut }) {
  const { articles, loading, createArticle, getArticle, saveArticle, setPublished, deleteArticle } = useArticles(userId);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    sb.from('tracker_progress').select('username').eq('id', userId).maybeSingle()
      .then(({ data }) => setUsername(data?.username || ''));
  }, [userId]);

  async function openNew() {
    setBusy(true);
    const id = await createArticle();
    if (id) setEditing(await getArticle(id));
    setBusy(false);
  }

  async function open(id) {
    setBusy(true);
    setEditing(await getArticle(id));
    setBusy(false);
  }

  if (editing) {
    return (
      <ArticleEditor
        key={editing.id}
        initial={editing}
        username={username}
        onBack={() => setEditing(null)}
        onSave={fields => saveArticle(editing.id, fields)}
        onPublishToggle={pub => setPublished(editing.id, pub)}
        onDelete={async () => {
          if (!confirm('Delete this article permanently?')) return;
          await deleteArticle(editing.id);
          setEditing(null);
        }}
      />
    );
  }

  const navRight = (
    <>
      {username && <a className="topnav-ext" href={`/u/${username}/articles`} target="_blank" rel="noopener noreferrer">↗ Public view</a>}
      {onSignOut && <button className="topnav-signout" onClick={onSignOut}>Sign out</button>}
    </>
  );

  return (
    <div className="wrap">
      <TopNav
        active="articles"
        links={[{ key: 'tracker', label: '◷ Tracker', to: '/' }, { key: 'articles', label: '✎ Articles', to: '/articles' }]}
        right={navRight}
      />

      <div className="articles-head">
        <div>
          <div className="kicker">Writing</div>
          <h1>Articles</h1>
          <p className="sub" style={{ marginTop: 6 }}>Draft, publish, and share long-form notes. Published pieces appear on your public profile.</p>
        </div>
        <button className="btn btn-primary new-article-btn" onClick={openNew} disabled={busy}>
          {busy ? '…' : '+ New article'}
        </button>
      </div>

      {loading ? (
        <p className="sub">Loading…</p>
      ) : articles.length === 0 ? (
        <div className="articles-empty">
          <p>No articles yet.</p>
          <button className="btn btn-primary" onClick={openNew} disabled={busy}>Write your first one</button>
        </div>
      ) : (
        <div className="articles-list">
          {articles.map(a => (
            <button key={a.id} className="article-row" onClick={() => open(a.id)}>
              <div className="article-row-main">
                <span className="article-row-title">{a.title || 'Untitled'}</span>
                {a.subtitle && <span className="article-row-sub">{a.subtitle}</span>}
              </div>
              <div className="article-row-meta">
                <span className={`article-badge${a.published ? ' pub' : ''}`}>{a.published ? 'Published' : 'Draft'}</span>
                <span className="article-row-date">{fmtDate(a.updated_at)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
