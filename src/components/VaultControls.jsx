import Icon from './Icon';

const fmtTime = iso => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// Sync chip: pulsing dot + last sync time (hidden when unknown) + "Sync vault".
export default function VaultControls({ vault }) {
  return (
    <div className="sync-wrap">
      <div className="sync-chip">
        {vault.syncedAt && (
          <span className="sync-status" role="status" title={`Last synced ${new Date(vault.syncedAt).toLocaleString()}`}>
            <span className={`sync-dot${vault.syncing ? ' busy' : ''}`} aria-hidden="true" />
            <span className="mono">Synced {fmtTime(vault.syncedAt)}</span>
          </span>
        )}
        <button className="btn btn-sm" onClick={vault.sync} disabled={vault.syncing}>
          <Icon name="refresh" size={14} className={vault.syncing ? 'spin' : undefined} />
          {vault.syncing ? 'Syncing…' : 'Sync vault'}
        </button>
      </div>
      {vault.error && <p className="vault-error" role="alert">{vault.error}</p>}
    </div>
  );
}
