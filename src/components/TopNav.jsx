import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import Icon from './Icon';
import { sb } from '../lib/supabase';

// Pages of the signed-in app. Public profile pages pass their own `links`.
export const APP_LINKS = [
  { key: 'tracker', label: 'Tracker', to: '/' },
  { key: 'articles', label: 'Articles', to: '/articles' },
  { key: 'obsidian', label: 'Obsidian Notes', to: '/obsidian' },
];

function Avatar({ onSignOut }) {
  const [email, setEmail] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    let alive = true;
    sb.auth.getSession().then(({ data }) => { if (alive) setEmail(data?.session?.user?.email || ''); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = e => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const esc = e => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', esc); };
  }, [open]);

  if (!email && !onSignOut) return null;
  const initial = (email[0] || '·').toUpperCase();
  return (
    <div className="avatar-wrap" ref={ref}>
      <button className="avatar" aria-label="Account menu" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(v => !v)}>
        {initial}
      </button>
      {open && (
        <div className="menu-pop" role="menu">
          {email && <div className="menu-label">{email}</div>}
          {onSignOut && (
            <button role="menuitem" className="menu-item" onClick={() => { setOpen(false); onSignOut(); }}>
              <Icon name="logout" size={15} /> Sign out
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Sticky translucent top bar: brand, segmented page switcher, then
// theme toggle, search and account. `right` renders extra page controls.
export default function TopNav({ links = APP_LINKS, active, right, onSignOut }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isApp = links === APP_LINKS;

  function openSearch() {
    if (location.pathname === '/obsidian') window.dispatchEvent(new CustomEvent('pc:focus-search'));
    else navigate('/obsidian', { state: { focusSearch: true } });
  }

  return (
    <nav className="topnav" aria-label="Main">
      <Link to={links[0]?.to || '/'} className="brand" aria-label="Prep Console home">
        <span className="brand-mark" aria-hidden="true">P</span>
        <span className="brand-name">Prep Console</span>
      </Link>
      <div className="seg nav-seg" role="tablist" aria-label="Pages">
        {links.map(l => (
          <Link
            key={l.key}
            to={l.to}
            role="tab"
            aria-selected={active === l.key}
            aria-current={active === l.key ? 'page' : undefined}
            className={`seg-item${active === l.key ? ' active' : ''}`}
          >
            {l.label}
          </Link>
        ))}
      </div>
      <div className="topnav-right">
        {right}
        <ThemeToggle />
        {isApp && (
          <button className="icon-btn" onClick={openSearch} aria-label="Search notes" title="Search notes">
            <Icon name="search" size={16} />
          </button>
        )}
        {isApp && <Avatar onSignOut={onSignOut} />}
      </div>
    </nav>
  );
}
