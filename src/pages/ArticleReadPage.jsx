import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { sb } from '../lib/supabase';
import ArticleRenderer from '../components/ArticleRenderer';

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function ArticleReadPage() {
  const { username, id } = useParams();
  const [article, setArticle] = useState(undefined); // undefined=loading, null=not found

  useEffect(() => {
    sb.from('articles')
      .select('title, subtitle, blocks, published, published_at')
      .eq('id', id)
      .eq('published', true)
      .maybeSingle()
      .then(({ data }) => setArticle(data || null));
  }, [id]);

  if (article === undefined) return <div className="wrap" style={{ paddingTop: 60 }}><p className="sub">Loading…</p></div>;

  if (!article) return (
    <div className="wrap" style={{ paddingTop: 60 }}>
      <div className="kicker" style={{ marginBottom: 12 }}>404</div>
      <h1 style={{ fontSize: 32 }}>Article not found</h1>
      <p className="sub" style={{ marginTop: 8 }}>It may be unpublished or removed.</p>
      <Link className="article-back" to={`/u/${username}/articles`} style={{ marginTop: 20, display: 'inline-block' }}>← All articles</Link>
    </div>
  );

  return (
    <div className="wrap article-read">
      <Link className="article-back" to={`/u/${username}/articles`}>← {username}&rsquo;s articles</Link>
      <ArticleRenderer
        title={article.title}
        subtitle={article.subtitle}
        blocks={article.blocks || []}
        meta={<>By {username} · {fmtDate(article.published_at)}</>}
      />
    </div>
  );
}
