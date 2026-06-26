export default function LiveUsers({ count }) {
  if (!count) return null;
  return (
    <div className="live-bar">
      <span className="live-count">
        <span className="live-dot" />
        <span>{count} {count === 1 ? 'user' : 'users'} online</span>
      </span>
    </div>
  );
}
