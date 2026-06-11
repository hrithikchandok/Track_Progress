import { useState, useMemo } from 'react';
import { genId } from '../utils/id';
import InterviewModal from './InterviewModal';

// ── Helpers ────────────────────────────────────────────────────────────────

function guessLogoDomain(company) {
  if (!company) return '';
  return company.toLowerCase()
    .replace(/\s+(inc|ltd|llc|corp|co\.?|plc|gmbh)\.?\s*$/i, '')
    .trim()
    .replace(/[^a-z0-9]/g, '') + '.com';
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function fmtDate(dateStr, opts = {}) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('default', opts);
}

const VERDICT = {
  upcoming: { label: 'Upcoming', color: 'var(--accent)' },
  selected: { label: 'Selected', color: 'var(--proc)' },
  rejected: { label: 'Rejected', color: 'var(--core)' },
  pending:  { label: 'Pending',  color: 'var(--muted)' },
};

// ── Sub-components ──────────────────────────────────────────────────────────

function CompanyLogo({ company, domain, size = 28 }) {
  const [srcIdx, setSrcIdx] = useState(0);
  const d = domain || guessLogoDomain(company);

  const sources = d ? [
    `https://img.logo.dev/${d}?token=pk_CHnVtCrUTgS4cJgATm3Szw`,
    `https://logo.clearbit.com/${d}`,
    `https://www.google.com/s2/favicons?sz=64&domain_url=https://${d}`,
  ] : [];

  if (!company || srcIdx >= sources.length) {
    return (
      <div className="iv-logo-fallback" style={{ width: size, height: size, fontSize: size * 0.45, borderRadius: size * 0.22 }}>
        {company?.[0]?.toUpperCase() || '?'}
      </div>
    );
  }
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      borderRadius: size * 0.22,
      border: '1px solid var(--line)',
      background: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <img
        src={sources[srcIdx]} alt={company}
        style={{ width: '80%', height: '80%', objectFit: 'contain', display: 'block' }}
        onError={() => setSrcIdx(i => i + 1)}
      />
    </div>
  );
}

function VerdictBadge({ status }) {
  const { label, color } = VERDICT[status] || VERDICT.upcoming;
  return (
    <span className="iv-verdict-badge" style={{ color, borderColor: color + '44', background: color + '18' }}>
      {label}
    </span>
  );
}

// ── Mini Calendar ───────────────────────────────────────────────────────────

function MiniCalendar({ interviews, onDayClick, selectedDate }) {
  const [viewDate, setViewDate] = useState(() => new Date());
  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const ivByDate = useMemo(() => {
    const map = {};
    interviews.forEach(iv => {
      if (!iv.date) return;
      const d = iv.date.slice(0, 10);
      (map[d] = map[d] || []).push(iv);
    });
    return map;
  }, [interviews]);

  const today      = todayStr();
  const firstDow   = new Date(year, month, 1).getDay();
  const daysInMon  = new Date(year, month + 1, 0).getDate();
  const monthLabel = viewDate.toLocaleDateString('default', { month: 'long', year: 'numeric' });

  function key(d) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  const cells = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMon }, (_, i) => i + 1)];

  return (
    <div className="iv-calendar">
      <div className="iv-cal-header">
        <button className="iv-cal-nav" onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>‹</button>
        <span className="iv-cal-month">{monthLabel}</span>
        <button className="iv-cal-nav" onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>›</button>
      </div>
      <div className="iv-cal-grid">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d} className="iv-cal-dow">{d}</div>)}
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />;
          const k    = key(day);
          const ivs  = ivByDate[k];
          const dotC = ivs
            ? ivs.some(v => v.status === 'selected') ? 'var(--proc)'
            : ivs.some(v => v.status === 'rejected') ? 'var(--core)'
            : 'var(--accent)'
            : null;
          return (
            <button
              key={k}
              className={`iv-cal-day${k === today ? ' today' : ''}${selectedDate === k ? ' selected' : ''}${ivs ? ' has-iv' : ''}`}
              onClick={() => onDayClick(k)}
            >
              {day}
              {dotC && <span className="iv-cal-dot" style={{ background: dotC }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Upcoming card ───────────────────────────────────────────────────────────

function UpcomingCard({ iv, onClick }) {
  const date     = new Date(iv.date + 'T00:00:00');
  const diffDays = Math.ceil((date - new Date()) / 864e5);
  const relative = diffDays <= 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : `in ${diffDays}d`;

  return (
    <div className="iv-upcoming-card" onClick={onClick}>
      <CompanyLogo company={iv.company} domain={iv.companyDomain} size={38} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="iv-card-role">{iv.role}</div>
        <div className="iv-card-company">{iv.company}</div>
        {iv.round && <div className="iv-card-round">{iv.round}</div>}
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>{relative}</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--faint)', marginTop: 2 }}>
          {fmtDate(iv.date, { month: 'short', day: 'numeric' })}
        </div>
      </div>
    </div>
  );
}

// ── Past card ───────────────────────────────────────────────────────────────

function PastCard({ iv, onClick }) {
  return (
    <div className="iv-past-card" onClick={onClick}>
      <CompanyLogo company={iv.company} domain={iv.companyDomain} size={32} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="iv-past-company">{iv.company}</div>
        <div className="iv-past-role">{iv.role}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        <VerdictBadge status={iv.status} />
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--faint)' }}>
          {fmtDate(iv.date, { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>
    </div>
  );
}

// ── Detail / verdict modal ──────────────────────────────────────────────────

function DetailModal({ iv, onEdit, onDelete, onUpdate, onClose }) {
  const [newTodo, setNewTodo] = useState('');
  const [newQ,    setNewQ]    = useState('');

  function toggleTodo(id) {
    onUpdate({ ...iv, todos: (iv.todos || []).map(t => t.id === id ? { ...t, done: !t.done } : t) });
  }
  function addTodo() {
    if (!newTodo.trim()) return;
    onUpdate({ ...iv, todos: [...(iv.todos || []), { id: genId(), text: newTodo.trim(), done: false }] });
    setNewTodo('');
  }
  function removeTodo(id) {
    onUpdate({ ...iv, todos: (iv.todos || []).filter(t => t.id !== id) });
  }
  function addQ() {
    if (!newQ.trim()) return;
    onUpdate({ ...iv, questions: [...(iv.questions || []), newQ.trim()] });
    setNewQ('');
  }
  function removeQ(idx) {
    const q = [...(iv.questions || [])];
    q.splice(idx, 1);
    onUpdate({ ...iv, questions: q });
  }

  return (
    <div className="modal" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-card" style={{ maxWidth: 520 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <CompanyLogo company={iv.company} domain={iv.companyDomain} size={48} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--mono)', fontWeight: 800, fontSize: 16 }}>{iv.company}</div>
            <div style={{ color: 'var(--muted)', fontSize: 14 }}>{iv.role}</div>
            {iv.round && <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--faint)', marginTop: 2 }}>{iv.round}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <VerdictBadge status={iv.status} />
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--faint)', marginTop: 4 }}>
              {fmtDate(iv.date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Verdict row */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
          {Object.entries(VERDICT).map(([v, { label, color }]) => (
            <button
              key={v}
              className="iv-verdict-chip"
              style={{
                flex: 1, color, borderColor: iv.status === v ? color : color + '44',
                background: iv.status === v ? color + '22' : 'transparent',
              }}
              onClick={() => onUpdate({ ...iv, status: v })}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Todos */}
        <div className="field-label">Prep Todos</div>
        <div className="iv-list-items">
          {(iv.todos || []).map(t => (
            <div key={t.id} className="iv-list-item">
              <input type="checkbox" className="cb" checked={t.done} onChange={() => toggleTodo(t.id)} />
              <span style={{ flex: 1, fontSize: 13, color: t.done ? 'var(--faint)' : 'var(--text)', textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</span>
              <button className="iv-rm-btn" onClick={() => removeTodo(t.id)}>×</button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <input
              className="auth-input"
              style={{ marginBottom: 0, flex: 1, padding: '6px 10px', fontSize: 13 }}
              placeholder="Add todo…"
              value={newTodo}
              onChange={e => setNewTodo(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTodo()}
            />
            <button className="btn" style={{ padding: '6px 12px' }} onClick={addTodo}>+</button>
          </div>
        </div>

        {/* Questions */}
        <div className="field-label" style={{ marginTop: 14 }}>Questions Asked</div>
        <div className="iv-list-items">
          {(iv.questions || []).map((q, i) => (
            <div key={i} className="iv-list-item">
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--faint)', minWidth: 18, marginTop: 2 }}>{i + 1}.</span>
              <span style={{ flex: 1, fontSize: 13 }}>{q}</span>
              <button className="iv-rm-btn" onClick={() => removeQ(i)}>×</button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <input
              className="auth-input"
              style={{ marginBottom: 0, flex: 1, padding: '6px 10px', fontSize: 13 }}
              placeholder="Add question asked…"
              value={newQ}
              onChange={e => setNewQ(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addQ()}
            />
            <button className="btn" style={{ padding: '6px 12px' }} onClick={addQ}>+</button>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <button className="btn" onClick={() => onEdit(iv)}>Edit Details</button>
          <button className="btn danger" onClick={() => { if (confirm('Delete this interview?')) onDelete(); }}>Delete</button>
          <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Section ────────────────────────────────────────────────────────────

export default function InterviewsSection({ interviews, applicationsCount, onSave, onUpdateApps }) {
  const [showModal,   setShowModal]   = useState(false);
  const [editingIv,   setEditingIv]   = useState(null);
  const [detailIv,    setDetailIv]    = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  const today = todayStr();

  const upcoming = interviews
    .filter(iv => iv.status === 'upcoming' && iv.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  const past = interviews
    .filter(iv => iv.status !== 'upcoming' || iv.date < today)
    .sort((a, b) => b.date.localeCompare(a.date));

  const selectedCount = interviews.filter(i => i.status === 'selected').length;
  const rejectedCount = interviews.filter(i => i.status === 'rejected').length;
  const convRate      = applicationsCount > 0
    ? Math.round((interviews.length / applicationsCount) * 100)
    : null;

  function handleSave(iv) {
    const exists = interviews.find(i => i.id === iv.id);
    onSave(exists ? interviews.map(i => i.id === iv.id ? iv : i) : [...interviews, iv]);
    setShowModal(false);
    setEditingIv(null);
  }

  function handleDelete(id) {
    onSave(interviews.filter(i => i.id !== id));
    setDetailIv(null);
  }

  function handleUpdate(updated) {
    onSave(interviews.map(i => i.id === updated.id ? updated : i));
    setDetailIv(updated);
  }

  function handleDayClick(dateKey) {
    setSelectedDay(prev => prev === dateKey ? null : dateKey);
  }

  function openAdd() {
    setEditingIv(selectedDay ? { date: selectedDay, status: 'upcoming' } : null);
    setShowModal(true);
  }

  const shownUpcoming = selectedDay
    ? interviews.filter(iv => iv.date === selectedDay)
    : upcoming;

  return (
    <div className="iv-section">
      {/* ── Header ── */}
      <div className="iv-section-head">
        <div>
          <div className="kicker" style={{ marginBottom: 6 }}>Interviews</div>
          {applicationsCount > 0 && (
            <div className="iv-conversion">
              <span className="iv-conv-num">{interviews.length}</span>
              <span className="iv-conv-sep"> interviews from </span>
              <button
                className="iv-conv-apps"
                onClick={() => {
                  const v = prompt('Total applications sent:', applicationsCount);
                  if (v && !isNaN(+v) && +v >= 0) onUpdateApps(+v);
                }}
              >{applicationsCount} apps</button>
              {convRate !== null && <span className="iv-conv-rate"> · {convRate}% call rate</span>}
            </div>
          )}
        </div>

        <div className="iv-stats-row">
          {[
            { num: interviews.length, lbl: 'Total',    col: 'var(--text)' },
            { num: upcoming.length,   lbl: 'Upcoming', col: 'var(--accent)' },
            { num: selectedCount,     lbl: 'Selected', col: 'var(--proc)' },
            { num: rejectedCount,     lbl: 'Rejected', col: 'var(--core)' },
          ].map(({ num, lbl, col }) => (
            <div key={lbl} className="iv-stat">
              <span className="iv-stat-num" style={{ color: col }}>{num}</span>
              <span className="iv-stat-lbl">{lbl}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="iv-layout">
        {/* Left: calendar + upcoming */}
        <div className="iv-left">
          <MiniCalendar
            interviews={interviews}
            onDayClick={handleDayClick}
            selectedDate={selectedDay}
          />

          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div className="iv-list-label">
                {selectedDay
                  ? `${fmtDate(selectedDay, { month: 'short', day: 'numeric' })} — ${shownUpcoming.length || 'no'} interview${shownUpcoming.length !== 1 ? 's' : ''}`
                  : 'Upcoming'}
              </div>
              {selectedDay && (
                <button className="iv-clear-sel" onClick={() => setSelectedDay(null)}>× clear</button>
              )}
            </div>

            {shownUpcoming.length === 0 ? (
              <div style={{ color: 'var(--faint)', fontFamily: 'var(--mono)', fontSize: 12, padding: '6px 0' }}>
                {selectedDay ? 'No interviews on this day' : 'No upcoming interviews scheduled'}
              </div>
            ) : (
              shownUpcoming.map(iv => (
                <UpcomingCard key={iv.id} iv={iv} onClick={() => setDetailIv(iv)} />
              ))
            )}

            <button className="iv-add-btn" onClick={openAdd}>+ Schedule Interview</button>
          </div>
        </div>

        {/* Right: past interviews sidebar */}
        <div className="iv-sidebar">
          <div className="iv-list-label" style={{ marginBottom: 10 }}>Past Interviews</div>
          {past.length === 0 ? (
            <div style={{ color: 'var(--faint)', fontFamily: 'var(--mono)', fontSize: 11, padding: '6px 0' }}>
              No past interviews yet
            </div>
          ) : (
            past.map(iv => (
              <PastCard key={iv.id} iv={iv} onClick={() => setDetailIv(iv)} />
            ))
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {showModal && (
        <InterviewModal
          initial={editingIv}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingIv(null); }}
        />
      )}
      {detailIv && (
        <DetailModal
          iv={detailIv}
          onEdit={iv => { setDetailIv(null); setEditingIv(iv); setShowModal(true); }}
          onDelete={() => handleDelete(detailIv.id)}
          onUpdate={handleUpdate}
          onClose={() => setDetailIv(null)}
        />
      )}
    </div>
  );
}
