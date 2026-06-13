// Read-only rendering of an article's block document.
// Shared by the editor preview, the author's reader, and the public page.
function Block({ block }) {
  switch (block.type) {
    case 'heading':
      return <h2 className="ab-heading">{block.text}</h2>;
    case 'quote':
      return <blockquote className="ab-quote">{block.text}</blockquote>;
    case 'image':
      if (!block.url) return null;
      return (
        <figure className="ab-figure">
          <img src={block.url} alt={block.caption || ''} loading="lazy" />
          {block.caption && <figcaption>{block.caption}</figcaption>}
        </figure>
      );
    case 'code':
      return (
        <pre className="ab-code">
          {block.lang && <span className="ab-code-lang">{block.lang}</span>}
          <code>{block.code}</code>
        </pre>
      );
    case 'divider':
      return <hr className="ab-divider" />;
    default:
      return <p className="ab-paragraph">{block.text}</p>;
  }
}

export default function ArticleRenderer({ title, subtitle, blocks = [], meta }) {
  return (
    <article className="article">
      {title && <h1 className="article-title">{title}</h1>}
      {subtitle && <p className="article-subtitle">{subtitle}</p>}
      {meta && <div className="article-meta">{meta}</div>}
      <div className="article-body">
        {blocks.filter(b => b.type === 'divider' || b.text || b.url || b.code).map(b => (
          <Block key={b.id} block={b} />
        ))}
      </div>
    </article>
  );
}
