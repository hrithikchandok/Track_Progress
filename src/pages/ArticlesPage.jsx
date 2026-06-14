import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sb } from '../lib/supabase';
import { useArticles } from '../hooks/useArticles';
import TopNav from '../components/TopNav';

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ArticlesPage({ userId, onSignOut }) {
  const { articles, loading, createArticle } = useArticles(userId);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    sb.from('tracker_progress').select('username').eq('id', userId).maybeSingle()
      .then(({ data }) => setUsername(data?.username || ''));
  }, [userId]);

  async function openNew() {
    setBusy(true);
    setErr('');
    const { id, error } = await createArticle();
    setBusy(false);
    if (error || !id) {
      setErr(error?.message
        ? `Couldn't create article: ${error.message}`
        : "Couldn't create the article. Make sure the `articles` table exists in Supabase (run supabase_articles.sql).");
      return;
    }
    navigate(`/articles/${id}`);
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
          {busy ? 'Creating…' : '+ New article'}
        </button>
      </div>

      {err && <div className="banner edit" style={{ borderColor: 'rgba(248,113,113,.4)', color: 'var(--core)', background: 'rgba(248,113,113,.08)' }}>{err}</div>}

      {loading ? (
        <p className="sub">Loading…</p>
      ) : articles.length === 0 ? (
        <div className="articles-empty">
          <p>No articles yet.</p>
          <button className="btn btn-primary" onClick={openNew} disabled={busy}>{busy ? 'Creating…' : 'Write your first one'}</button>
        </div>
      ) : (
        <div className="articles-list">
          {articles.map(a => (
            <button key={a.id} className="article-row" onClick={() => navigate(`/articles/${a.id}`)}>
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
