import { useEffect, useState } from 'react';
import Icon from './Icon';

// Theme choice cycles system → dark → light → system. "system" removes
// data-theme so prefers-color-scheme decides. The no-flash init in index.html
// applies the saved value before first paint.
const ORDER = ['system', 'dark', 'light'];
const LABEL = { system: 'System theme', dark: 'Dark theme', light: 'Light theme' };
const ICON = { system: 'monitor', dark: 'moon', light: 'sun' };

function readChoice() {
  try {
    const t = localStorage.getItem('pc-theme');
    if (t === 'light' || t === 'dark') return t;
  } catch { /* storage unavailable */ }
  return 'system';
}

function applyChoice(choice) {
  const root = document.documentElement;
  if (choice === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', choice);
  try { localStorage.setItem('pc-theme', choice); } catch { /* ignore */ }
}

// The theme actually on screen ('light' | 'dark'), tracking both the explicit
// choice and the OS setting.
export function useResolvedTheme() {
  const get = () => {
    const attr = document.documentElement.getAttribute('data-theme');
    if (attr === 'light' || attr === 'dark') return attr;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };
  const [theme, setTheme] = useState(get);
  useEffect(() => {
    const update = () => setTheme(get());
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    mq?.addEventListener?.('change', update);
    return () => { mo.disconnect(); mq?.removeEventListener?.('change', update); };
  }, []);
  return theme;
}

export default function ThemeToggle() {
  const [choice, setChoice] = useState(readChoice);

  function cycle() {
    const next = ORDER[(ORDER.indexOf(choice) + 1) % ORDER.length];
    applyChoice(next);
    setChoice(next);
  }

  const next = ORDER[(ORDER.indexOf(choice) + 1) % ORDER.length];
  return (
    <button
      className="icon-btn"
      onClick={cycle}
      title={`${LABEL[choice]} · click for ${LABEL[next].toLowerCase()}`}
      aria-label={`${LABEL[choice]}. Switch to ${LABEL[next].toLowerCase()}`}
    >
      <Icon name={ICON[choice]} size={16} />
    </button>
  );
}
