import { Link } from 'react-router-dom';

// Slim top navigation shared across the app. `links` is an array of
// { key, label, to }; `active` matches one key. `right` renders extra controls.
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
      {right && <div className="topnav-right">{right}</div>}
    </nav>
  );
}
