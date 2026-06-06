export default function LiveUsers({ count }) {
  if (count === 0) return null;
  return (
    <div className="live-count">
      <span className="live-dot" />
      <span>{count} {count === 1 ? 'user' : 'users'} online</span>
    </div>
  );
}
