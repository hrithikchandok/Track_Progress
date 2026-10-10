# Connect Obsidian Notes

This repository is React/Vite deployed to Vercel, not Next.js. The server endpoint is [api/sync-vault.js](./api/sync-vault.js), with the same `/api/sync-vault` URL. [server/vault.js](./server/vault.js) handles GitHub and gray-matter parsing. The reader lives in [ObsidianNotesPage.jsx](./src/pages/ObsidianNotesPage.jsx).

## Setup

1. Install dependencies with `npm install`.
2. Copy [.env.example](./.env.example) to `.env.local` for local use, or add those values in Vercel Project Settings → Environment Variables.
3. Your public `hrithikchandok/obsidian_vault` repository works without a token or owner ID. The API uses anonymous access only in public mode, even if a token is configured. GitHub REST discovers the current commit and file tree; public file bodies are fetched from GitHub's raw host to conserve the REST rate limit.
4. For a private repository, set BOTH `VAULT_OWNER_USER_ID` to your UUID from Supabase → Authentication → Users and `GITHUB_TOKEN` to a fine-grained token with **Contents: Read-only**. Only the specified user can fetch the vault in this mode. Never use a `VITE_` prefix for the token. Private notes are never added to public profiles.
5. Set `OBSIDIAN_VAULT_NAME` to the exact local vault name displayed in Obsidian. Default: `obsidian_vault`.
6. `VAULT_FOLDER` defaults to blank (all Markdown files). Set it to the exact, case-sensitive folder path, for example `System-Design`, to limit syncing. Paths remain relative to the repository root; the repository root must correspond to the local vault root.
7. Run `npm run dev` to serve both vault APIs and the frontend locally, or deploy to Vercel. Vite loads server settings from `.env.local`; restart after changing settings. Production uses the Vercel API routes.
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

The reader renders headings, tables, code fences, lists, and common wiki links. **Markdown source** preserves the entire file verbatim, including YAML. Raw HTML is not executed. Obsidian plugin features, embedded notes, Markdown attachments, and Mermaid diagrams are not reproduced; use the Obsidian/GitHub links for those. The browser may ask before opening the Obsidian URI.

The **Excalidraw** filter includes `.excalidraw` JSON files from all nested folders. They open in a read-only Excalidraw canvas with zoom, pan, and embedded images. Empty scenes show an empty-drawing message. Drawing JSON is fetched on demand from the synced commit through `/api/vault-drawing`, with a 2.5 MB per-drawing limit. Only drawing metadata is persisted; up to six opened scenes are cached in memory. The original scene can be inspected using **Drawing source**. Changes must be committed and pushed from Obsidian before syncing. Drawing metadata defaults to unclassified/draft and does not automatically claim completed HLD topics. Compressed `.excalidraw.md` plugin files are not supported by the drawing viewer.

Snapshots, target lists, and sync timestamps are stored in localStorage scoped to the signed-in user. A successful sync replaces the snapshot, including removing deleted notes. Errors retain the last successful snapshot. Browser storage limits produce an explicit error. Vault snapshots are separate from tracker backup/reset and are local to this browser; clearing site data removes them. On shared computers, clear site data after use because signing out does not erase local snapshots.

Run `node --test tests/vault.test.js` and `npm run build` to verify.
