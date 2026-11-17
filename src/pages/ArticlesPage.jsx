import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sb } from '../lib/supabase';
import { useArticles } from '../hooks/useArticles';
import TopNav from '../components/TopNav';
import Icon from '../components/Icon';

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

  const navRight = username
    ? <a className="topnav-ext" href={`/u/${username}/articles`} target="_blank" rel="noopener noreferrer">Public view</a>
    : null;

  return (
    <div className="wrap">
      <TopNav active="articles" onSignOut={onSignOut} right={navRight} />

      <div className="articles-head">
        <div>
          <div className="eyebrow">Writing</div>
          <h1 className="page-title">Articles</h1>
          <p className="sub">Draft, publish, and share long-form notes. Published pieces appear on your public profile.</p>
        </div>
        <button className="btn btn-primary new-article-btn" onClick={openNew} disabled={busy}>
          <Icon name="plus" size={15} /> {busy ? 'Creating…' : 'New article'}
        </button>
      </div>

      {err && <div className="banner error" role="alert">{err}</div>}

      {loading ? (
        <p className="sub">Loading…</p>
      ) : articles.length === 0 ? (
        <div className="articles-empty">
          <p>No articles yet.</p>
          <button className="btn btn-primary" onClick={openNew} disabled={busy}>{busy ? 'Creating…' : 'Write your first one'}</button>
        </div>
      ) : (
        <ul className="articles-list">
          {articles.map(a => (
            <li key={a.id}>
              <button className="article-row" onClick={() => navigate(`/articles/${a.id}`)}>
                <span className="article-row-title">{a.title || 'Untitled'}</span>
                <span className="article-row-meta">
                  <span className="mono">{fmtDate(a.updated_at)}</span>
                  <span aria-hidden="true">·</span>
                  <span className={`status-pill${a.published ? ' pub' : ''}`}>{a.published ? 'Published' : 'Draft'}</span>
                </span>
                {a.subtitle && <span className="article-row-sub">{a.subtitle}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
