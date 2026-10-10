# Connect Obsidian Notes

This repository is React/Vite deployed to Vercel, not Next.js. The server endpoint is [api/sync-vault.js](./api/sync-vault.js), with the same `/api/sync-vault` URL. [server/vault.js](./server/vault.js) handles GitHub and gray-matter parsing. The reader lives in [ObsidianNotesPage.jsx](./src/pages/ObsidianNotesPage.jsx).

## Setup

1. Install dependencies with `npm install`.
2. Copy [.env.example](./.env.example) to `.env.local` for local use, or add those values in Vercel Project Settings → Environment Variables.
3. Set `VAULT_OWNER_USER_ID` to your account's UUID from Supabase → Authentication → Users. Only that authenticated user can fetch the vault. Private notes are never added to public profiles.
4. For a private repository, set `GITHUB_TOKEN` to a fine-grained GitHub token with **Contents: Read-only** for `hrithikchandok/obsidian_vault`. Public repositories work without a token, subject to GitHub's lower anonymous rate limit. Never use a `VITE_` prefix for the token.
5. Set `OBSIDIAN_VAULT_NAME` to the exact local vault name displayed in Obsidian. Default: `obsidian_vault`.
6. `VAULT_FOLDER` defaults to blank (all Markdown files). Set it to the exact, case-sensitive folder path, for example `System-Design`, to limit syncing. Paths remain relative to the repository root; the repository root must correspond to the local vault root.
7. Run `npx vercel dev` to serve both the API and frontend locally, or deploy to Vercel and redeploy after changing environment variables. `npm run dev` alone only serves the frontend.
8. Sign in, open **Obsidian Notes** to the right of **Articles**, and click **Sync Vault**. Notes refresh on opening a stale view and every 15 minutes while the tracker/notes view is visible. Commit and push local Obsidian changes to GitHub first; this is a one-way GitHub sync, not filesystem access or a GitHub webhook.

## Note metadata

```yaml
---
title: Distributed Rate Limiter
track: HLD
status: revised
confidence: 3
lastRevised: "2026-10-11"
tags: [redis, token-bucket, concurrency]
---
```

Every `.md` file is shown, even without metadata. Missing title falls back to filename. HLD/LLD can be inferred from folder names, otherwise the note is unclassified. Missing status is draft; missing/invalid confidence and revision dates are unknown. A malformed YAML note fails the sync with its path, preserving the previous snapshot.

Set HLD/LLD target lists in the Notes page, one exact note title or repository path per line; fields save on blur. Track percentage is matched targets with notes created divided by distinct targets, not an invented target count. Ready/revised counts represent completed topics separately. Revision intervals are 1, 7, and 30 days for confidence 1, 2, and 3. Ready/revised notes without a date are due immediately; drafts are excluded.

The API returns a normalized JSON array with `title`, `track`, `status`, `confidence`, `lastRevised`, `tags`, `path`, `githubUrl`, `obsidianUrl`, `content` (body), and `raw` (unchanged Markdown). Fetching uses one immutable commit and bounded concurrency. GitHub rate limits return HTTP 429 and `Retry-After`. Truncated or oversized vaults fail explicitly, never silently drop notes. Limits: 500 notes, 500 KB per note, 2.5 MB total source.

## Rendering and persistence

The reader renders headings, tables, code fences, lists, and common wiki links. **Markdown source** preserves the entire file verbatim, including YAML. Raw HTML is not executed. Obsidian plugin features, canvases, embedded notes, images, and Mermaid diagrams are not reproduced; use the Obsidian/GitHub links for those. The browser may ask before opening the Obsidian URI.

Snapshots, target lists, and sync timestamps are stored in localStorage scoped to the signed-in user. A successful sync replaces the snapshot, including removing deleted notes. Errors retain the last successful snapshot. Browser storage limits produce an explicit error. Vault snapshots are separate from tracker backup/reset and are local to this browser; clearing site data removes them. On shared computers, clear site data after use because signing out does not erase local snapshots.

Run `node --test tests/vault.test.js` and `npm run build` to verify.
