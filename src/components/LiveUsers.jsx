import { useState } from 'react';

export default function LiveUsers({ users, currentUserId }) {
  const [expanded, setExpanded] = useState(false);
  if (!users.length) return null;

  const others = users.filter(u => u.userId !== currentUserId);
  const self = users.find(u => u.userId === currentUserId);

  return (
    <div className="live-users">
      <button
        className="live-users-toggle"
        onClick={() => setExpanded(v => !v)}
        title={expanded ? 'Hide live users' : 'Show live users'}
      >
        <span className="live-dot" />
        <span>{users.length} online</span>
        <span className="live-chevron">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <ul className="live-users-list">
          {self && (
            <li className="live-user-row live-user-self">
              <span className="live-dot" />
              <div className="live-user-info">
                <span className="live-user-name">{self.username} <em>(you)</em></span>
                <span className="live-user-email">{self.email}</span>
              </div>
            </li>
          )}
          {others.map(u => (
            <li key={u.userId} className="live-user-row">
              <span className="live-dot" />
              <div className="live-user-info">
                <span className="live-user-name">{u.username}</span>
                <span className="live-user-email">{u.email}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
