import { SYNC } from '../data/sync';

export default function SyncBanner({ syncOn, canEdit }) {
  if (!syncOn) return null;

  if (canEdit) {
    return (
      <div className="banner edit">
        ✏️ <b>Edit mode</b> — your changes sync live to everyone viewing this link.
      </div>
    );
  }
  return (
    <div className="banner view">
      🔵 <b>Live view</b> — {SYNC.rowId}&rsquo;s real-time progress (read-only).
    </div>
  );
}
