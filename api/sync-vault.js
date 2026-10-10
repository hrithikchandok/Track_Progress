import { syncVault } from '../server/vault.js';
import { vaultAccess, vaultFailure } from '../server/vaultAccess.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const notes = await syncVault(await vaultAccess(req));
    res.setHeader('X-Vault-Synced-At', new Date().toISOString());
    return res.status(200).json(notes);
  } catch (error) { return vaultFailure(res, error); }
}
