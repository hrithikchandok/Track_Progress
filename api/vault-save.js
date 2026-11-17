import { VaultError } from '../server/vault.js';
import { vaultAccess, vaultFailure } from '../server/vaultAccess.js';
import { saveVaultFile } from '../server/vaultWrite.js';

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body);
  let raw = '';
  for await (const chunk of req) { raw += chunk; if (raw.length > 4000000) throw new VaultError('Request too large.', 413); }
  return JSON.parse(raw || '{}');
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    // Writing is owner-only: vaultAccess verifies the Supabase session against
    // VAULT_OWNER_USER_ID and only then hands out the server-side token.
    if (!process.env.VAULT_OWNER_USER_ID) {
      throw new VaultError('Editing is not configured. Set VAULT_OWNER_USER_ID and GITHUB_TOKEN on the server.', 503);
    }
    const config = await vaultAccess(req);
    let body;
    try { body = await readBody(req); } catch (e) { throw e instanceof VaultError ? e : new VaultError('Invalid request body.', 400); }
    const note = await saveVaultFile({ ...config, path: body.path, sha: body.sha, content: body.content });
    return res.status(200).json({ note, savedAt: new Date().toISOString() });
  } catch (error) { return vaultFailure(res, error); }
}
