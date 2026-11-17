import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { sb } from '../lib/supabase';
import TopNav from '../components/TopNav';

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function PublicArticlesPage() {
  const { username } = useParams();
  const [list, setList] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: row } = await sb.from('tracker_progress').select('id').eq('username', username).maybeSingle();
      if (!row) { setList([]); return; }
      const { data } = await sb.from('articles')
        .select('id, title, subtitle, published_at')
        .eq('user_id', row.id)
        .eq('published', true)
        .order('published_at', { ascending: false });
      setList(data || []);
    })();
  }, [username]);

  const nav = (
    <TopNav
      active="articles"
      links={[
        { key: 'tracker', label: 'Tracker', to: `/u/${username}` },
        { key: 'articles', label: 'Articles', to: `/u/${username}/articles` },
      ]}
    />
  );

  if (list === null) return <div className="wrap" style={{ paddingTop: 40 }}>{nav}<p className="sub">Loading…</p></div>;

  return (
    <div className="wrap">
      {nav}
      <div className="kicker">Writing</div>
      <h1>{username}&rsquo;s articles</h1>

      {list.length === 0 ? (
        <p className="sub" style={{ marginTop: 16 }}>No published articles yet.</p>
      ) : (
        <ul className="articles-list" style={{ marginTop: 24 }}>
          {list.map(a => (
            <li key={a.id}>
              <Link className="article-row" to={`/u/${username}/article/${a.id}`}>
                <span className="article-row-title">{a.title || 'Untitled'}</span>
                <span className="article-row-meta"><span className="mono">{fmtDate(a.published_at)}</span></span>
                {a.subtitle && <span className="article-row-sub">{a.subtitle}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
