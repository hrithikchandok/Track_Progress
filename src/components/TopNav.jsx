import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

// Slim top navigation shared across the app. `links` is an array of
// { key, label, to }; `active` matches one key. `right` renders extra controls.
// The light/dark toggle is always present at the end of the right cluster.
export default function TopNav({ links = [], active, right }) {
  return (
    <nav className="topnav">
      <div className="topnav-links">
        {links.map(l => (
          <Link key={l.key} to={l.to} className={`topnav-link${active === l.key ? ' active' : ''}`}>
            {l.label}
          </Link>
        ))}
      </div>
      <div className="topnav-right">
        <ThemeToggle />
        {right}
      </div>
    </nav>
  );
}
