import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { sb } from '../lib/supabase';
import { useArticles } from '../hooks/useArticles';
import ArticleEditor from '../components/ArticleEditor';

// Dedicated editor route: /articles/:id
export default function ArticleEditorPage({ userId }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getArticle, saveArticle, setPublished, deleteArticle } = useArticles(userId);
  const [article, setArticle] = useState(undefined); // undefined=loading, null=not found
  const [username, setUsername] = useState('');

  useEffect(() => {
    getArticle(id).then(a => setArticle(a || null));
    sb.from('tracker_progress').select('username').eq('id', userId).maybeSingle()
      .then(({ data }) => setUsername(data?.username || ''));
  }, [id, userId, getArticle]);

  if (article === undefined) {
    return <div className="wrap" style={{ paddingTop: 80 }}><p className="sub">Loading…</p></div>;
  }

  if (article === null) {
    return (
      <div className="wrap" style={{ paddingTop: 80 }}>
        <div className="kicker" style={{ marginBottom: 12 }}>404</div>
        <h1 style={{ fontSize: 32 }}>Article not found</h1>
        <Link className="article-back" to="/articles" style={{ marginTop: 20, display: 'inline-block' }}>← All articles</Link>
      </div>
    );
  }

  return (
    <ArticleEditor
      key={article.id}
      initial={article}
      username={username}
      onBack={() => navigate('/articles')}
      onSave={fields => saveArticle(article.id, fields)}
      onPublishToggle={pub => setPublished(article.id, pub)}
      onDelete={async () => {
        if (!confirm('Delete this article permanently?')) return;
        await deleteArticle(article.id);
        navigate('/articles');
      }}
    />
  );
}
