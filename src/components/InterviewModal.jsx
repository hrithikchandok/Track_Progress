import { useState } from 'react';
import { genId } from '../utils/id';

function guessLogoDomain(company) {
  if (!company) return '';
  return company.toLowerCase()
    .replace(/\s+(inc|ltd|llc|corp|co\.?|plc|gmbh)\.?\s*$/i, '')
    .trim()
    .replace(/[^a-z0-9]/g, '') + '.com';
}

const VERDICT_OPTIONS = [
  { v: 'upcoming', label: 'Upcoming', color: 'var(--accent)' },
  { v: 'selected', label: 'Selected', color: 'var(--proc)' },
  { v: 'rejected', label: 'Rejected', color: 'var(--core)' },
  { v: 'pending',  label: 'Pending',  color: 'var(--muted)' },
];

export default function InterviewModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState({
    id:            initial?.id            || genId(),
    company:       initial?.company       || '',
    companyDomain: initial?.companyDomain || '',
    role:          initial?.role          || '',
    date:          initial?.date          || new Date().toISOString().slice(0, 10),
    round:         initial?.round         || '',
    status:        initial?.status        || 'upcoming',
    todos:         initial?.todos         || [],
    questions:     initial?.questions     || [],
    notes:         initial?.notes         || '',
  });

  const [logoSrcIdx, setLogoSrcIdx] = useState(0);
  const logoDomain = form.companyDomain || guessLogoDomain(form.company);
  const logoSources = logoDomain ? [
    `https://img.logo.dev/${logoDomain}?token=pk_CHnVtCrUTgS4cJgATm3Szw`,
    `https://logo.clearbit.com/${logoDomain}`,
    `https://www.google.com/s2/favicons?sz=64&domain_url=https://${logoDomain}`,
  ] : [];

  function set(field, val) {
    if (field === 'company' || field === 'companyDomain') setLogoSrcIdx(0);
    setForm(f => ({ ...f, [field]: val }));
  }

  const canSave = form.company.trim() && form.role.trim() && form.date;

  return (
    <div className="modal" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-card" style={{ maxWidth: 440 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          {logoSources.length > 0 && logoSrcIdx < logoSources.length ? (
            <div style={{
              width: 40, height: 40, flexShrink: 0, borderRadius: 8,
              border: '1px solid var(--line)', background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}>
              <img
                src={logoSources[logoSrcIdx]}
                style={{ width: '80%', height: '80%', objectFit: 'contain', display: 'block' }}
                onError={() => setLogoSrcIdx(i => i + 1)}
                alt=""
              />
            </div>
          ) : (
            <div className="iv-logo-fallback" style={{ width: 40, height: 40, fontSize: 18 }}>
              {form.company?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <h3>{initial?.id ? 'Edit Interview' : 'Schedule Interview'}</h3>
        </div>

        <label className="field-label">Company *</label>
        <input
          className="auth-input"
          placeholder="Google, Stripe, Airbnb…"
          value={form.company}
          onChange={e => set('company', e.target.value)}
        />

        <label className="field-label">Company domain (for logo)</label>
        <input
          className="auth-input"
          placeholder="google.com  ← leave blank to auto-detect"
          value={form.companyDomain}
          onChange={e => set('companyDomain', e.target.value)}
        />

        <label className="field-label">Role *</label>
        <input
          className="auth-input"
          placeholder="Software Engineer, PM, Data Scientist…"
          value={form.role}
          onChange={e => set('role', e.target.value)}
        />

        <label className="field-label">Date *</label>
        <input
          className="auth-input"
          type="date"
          value={form.date}
          onChange={e => set('date', e.target.value)}
        />

        <label className="field-label">Round</label>
        <input
          className="auth-input"
          placeholder="Technical Round 1, HR Screen, System Design…"
          value={form.round}
          onChange={e => set('round', e.target.value)}
        />

        <label className="field-label">Verdict</label>
        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          {VERDICT_OPTIONS.map(({ v, label, color }) => (
            <button
              key={v}
              type="button"
              onClick={() => set('status', v)}
              className="iv-verdict-chip"
              style={{
                color,
                borderColor: form.status === v ? color : color + '44',
                background: form.status === v ? color + '22' : 'transparent',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="modal-row" style={{ marginTop: 14 }}>
          <button className="btn" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={() => canSave && onSave(form)}
            disabled={!canSave}
            style={{ flex: 2 }}
          >
            {initial?.id ? 'Save Changes' : 'Add Interview'}
          </button>
        </div>
      </div>
    </div>
  );
}
