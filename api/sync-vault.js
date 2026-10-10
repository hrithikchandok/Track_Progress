import { SYNC } from '../src/data/sync.js';
import { syncVault } from '../server/vault.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  // This app supports multiple accounts: a login alone must not expose the owner's private vault.
  const owner = process.env.VAULT_OWNER_USER_ID;
  if (!owner) return res.status(503).json({ error: 'Set VAULT_OWNER_USER_ID on the server to your Supabase user ID before connecting the vault.' });
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) return res.status(401).json({ error: 'Sign in to sync your vault.' });
  try {
    const auth = await fetch(`${SYNC.url}/auth/v1/user`, {
      headers: { apikey: SYNC.anonKey, Authorization: authorization }, signal: AbortSignal.timeout(10000),
    });
    if (!auth.ok) return res.status(401).json({ error: 'Session expired. Sign in again.' });
    const user = await auth.json();
    if (user.id !== owner) return res.status(403).json({ error: 'This vault is connected to a different account.' });
    const repo = process.env.VAULT_GITHUB_REPO || 'hrithikchandok/obsidian_vault';
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) return res.status(503).json({ error: 'Invalid VAULT_GITHUB_REPO configuration.' });
    const notes = await syncVault({ repo, folder: (process.env.VAULT_FOLDER || '').replace(/^\/+|\/+$/g, ''),
      vault: process.env.OBSIDIAN_VAULT_NAME || 'obsidian_vault', token: process.env.GITHUB_TOKEN });
    res.setHeader('X-Vault-Synced-At', new Date().toISOString());
    return res.status(200).json(notes);
  } catch (error) {
    if (error.retryAfter) res.setHeader('Retry-After', String(error.retryAfter));
    return res.status(error.status || 502).json({ error: error.status ? error.message : 'Vault sync could not reach GitHub. Try again shortly.' });
  }
}
