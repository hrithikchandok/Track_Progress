export default function VaultControls({ vault }) {
  return <div className="vault-controls">
    <button className="btn" onClick={vault.sync} disabled={vault.syncing}>{vault.syncing ? 'Syncing…' : 'Sync Vault'}</button>
    <span className="sub" role="status">{vault.syncedAt ? `Last synced ${new Date(vault.syncedAt).toLocaleString()}` : 'Vault not synced yet'}</span>
    {vault.error && <p className="vault-error" role="alert">{vault.error}</p>}
  </div>;
}
