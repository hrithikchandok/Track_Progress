export default function LiveUsers({ count, soundOn, onToggleSound }) {
  return (
    <div className="live-bar">
      {count > 0 ? (
        <span className="live-count">
          <span className="live-dot" />
          <span>{count} {count === 1 ? 'user' : 'users'} online</span>
        </span>
      ) : <span />}
      <button
        className={`sfx-toggle${soundOn ? ' on' : ''}`}
        onClick={onToggleSound}
        title={soundOn ? 'Engine sound on — tap to mute' : 'Engine sound off — tap to enable'}
      >
        <span className="sfx-glyph">{soundOn ? '🔊' : '🔇'}</span>
        <span className="sfx-label">{soundOn ? 'FX on' : 'FX off'}</span>
      </button>
    </div>
  );
}
