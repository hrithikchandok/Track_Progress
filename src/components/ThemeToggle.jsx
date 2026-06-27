import { useState } from 'react';

// Flips data-theme on <html> and remembers the choice. The no-flash init in
// index.html applies the saved value before first paint.
export default function ThemeToggle() {
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'light'
  );

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('pc-theme', next); } catch (e) { /* ignore */ }
    setTheme(next);
  }

  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      title="Toggle light / dark"
      aria-label="Toggle light / dark theme"
    >
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  );
}
