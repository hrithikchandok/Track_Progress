import { Link } from 'react-router-dom';
import { vaultStats, revisionQueue } from '../utils/vaultProgress';

export default function VaultRoadmap({ vault, activeFilter = 'all' }) {
  const queue = revisionQueue(vault.notes);
  return <section className="vault-roadmap" aria-label="Obsidian roadmap">
    {['HLD', 'LLD'].filter(t => activeFilter === 'all' || activeFilter === t.toLowerCase()).map(track => {
      const stats = vaultStats(vault.notes, track, vault.targets[track]);
      return <details key={track} className="vault-card">
        <summary>{track} · Obsidian notes <span className="sub">{stats.items.length} notes · {stats.completed} ready / revised · Confidence {stats.confidence || '—'}/3</span></summary>
        {!stats.items.length && <p className="sub">Sync notes with track: {track} in their frontmatter to see them here.</p>}
        {stats.items.map(n => <div className="vault-note-row" key={n.id}>
          <Link to={`/obsidian?note=${encodeURIComponent(n.path)}&kind=${n.kind || 'markdown'}`}>{n.title}</Link>
          <span className="chip">{n.status} · {n.confidence || '—'}/3</span>
          <a href={n.obsidianUrl}>Open in Obsidian ↗</a>
          <a href={n.githubUrl} target="_blank" rel="noreferrer">GitHub ↗</a>
        </div>)}
      </details>;
    })}
    {activeFilter === 'all' && <details className="vault-card"><summary>Revision queue · {queue.length} due</summary>
      <p className="sub">Ready/revised notes: confidence 1 → daily, 2 → weekly, 3 → every 30 days. Update lastRevised in Obsidian and sync.</p>
      {queue.length ? queue.map(n => <div className="vault-note-row" key={n.id}><a href={n.obsidianUrl}>{n.title} ↗</a><span className="chip">{n.confidence || '—'}/3</span><span className="sub">Last revised: {n.lastRevised || 'Never'}</span></div>) : <p className="sub">No revisions due.</p>}
    </details>}
  </section>;
}
