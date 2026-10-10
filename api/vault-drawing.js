import { githubClient, publicVaultFile, VaultError } from '../server/vault.js';
import { vaultAccess, vaultFailure } from '../server/vaultAccess.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const config = await vaultAccess(req);
    const sha = req.query?.sha;
    if (typeof sha !== 'string' || !/^[a-f0-9]{40}$/.test(sha)) throw new VaultError('Invalid drawing version.', 400);
    const { ref, path } = req.query;
    if (typeof ref !== 'string' || !/^[a-f0-9]{40}$/.test(ref) || typeof path !== 'string'
      || !/\.excalidraw$/i.test(path) || path.split('/').some(p => !p || p === '.' || p === '..')
      || (config.folder && !path.startsWith(`${config.folder}/`))) throw new VaultError('Invalid drawing path or commit.', 400);
    let raw;
    if (!config.token) raw = await publicVaultFile({ ...config, ref, path });
    else {
      const blob = await githubClient(config)(`/git/blobs/${sha}`);
      if (blob.size > 2500000 || blob.encoding !== 'base64') throw new VaultError('Drawing exceeds the 2.5 MB viewer limit or has an unsupported encoding.', 422);
      raw = Buffer.from(blob.content, 'base64').toString('utf8');
    }
    if (Buffer.byteLength(raw) > 2500000) throw new VaultError('Drawing exceeds the 2.5 MB viewer limit.', 422);
    let scene;
    try { scene = JSON.parse(raw); } catch { throw new VaultError('This file is not valid Excalidraw JSON.', 422); }
    if (scene.type !== 'excalidraw' || !Array.isArray(scene.elements)) throw new VaultError('This file is not an Excalidraw scene.', 422);
    return res.status(200).json({ scene, raw });
  } catch (error) { return vaultFailure(res, error); }
}
