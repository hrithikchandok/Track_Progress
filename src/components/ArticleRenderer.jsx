import RichEditor from './RichEditor';
import { toDoc } from './ArticleEditor';

// Read-only rendering of an article. Body is TipTap JSON rendered via a
// non-editable editor instance (keeps syntax highlighting + safe rendering).
export default function ArticleRenderer({ title, subtitle, blocks, meta }) {
  return (
    <article className="article">
      {title && <h1 className="article-title">{title}</h1>}
      {subtitle && <p className="article-subtitle">{subtitle}</p>}
      {meta && <div className="article-meta">{meta}</div>}
      <div className="article-body">
        <RichEditor content={toDoc(blocks)} editable={false} />
      </div>
    </article>
  );
}
