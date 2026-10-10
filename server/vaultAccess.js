import { SYNC } from '../src/data/sync.js';
import { VaultError } from './vault.js';

export async function vaultAccess(req) {
  const repo = process.env.VAULT_GITHUB_REPO || 'hrithikchandok/obsidian_vault';
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new VaultError('Invalid VAULT_GITHUB_REPO configuration.', 503);
  const owner = process.env.VAULT_OWNER_USER_ID;
  // Without an owner, GitHub's anonymous API enforces public-only access.
  // Never attach a configured server token to an unauthenticated request.
  if (owner) {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) throw new VaultError('Sign in to sync your vault.', 401);
    const auth = await fetch(`${SYNC.url}/auth/v1/user`, {
      headers: { apikey: SYNC.anonKey, Authorization: authorization }, signal: AbortSignal.timeout(10000),
    });
    if (!auth.ok) throw new VaultError('Session expired. Sign in again.', 401);
    if ((await auth.json()).id !== owner) throw new VaultError('This vault is connected to a different account.', 403);
  }
  return { repo, folder: (process.env.VAULT_FOLDER || '').replace(/^\/+|\/+$/g, ''),
    vault: process.env.OBSIDIAN_VAULT_NAME || 'obsidian_vault', token: owner ? process.env.GITHUB_TOKEN : undefined };
}

export function vaultFailure(res, error) {
  if (error.retryAfter) res.setHeader('Retry-After', String(error.retryAfter));
  return res.status(error.status || 502).json({ error: error.status ? error.message : 'Vault sync could not reach GitHub. Try again shortly.' });
}
