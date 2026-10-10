# Cleanup and retained references

Date: October 3, 2026. The project was not a Git repository during this review.
Before replacing or removing active source, a source-only snapshot is retained in
`archive/prototypes/pre-sports-layout-2026-10-03.zip`, with a SHA-256 manifest.
Credentials, .env files, private keys, dependencies, and runtime data are excluded.

## Retired from the active tree

- `web/`: the wallet-oriented Polymarket Copy Bot, unrelated to the sports
  equivalence/coverage workflow. Its source and original Node manifest/lockfile
  remain in the snapshot archive.
- `docs/copybot.md`: documentation for that retired prototype, retained in the archive.
- `docs/langgraph-architecture.png`, `docs/langgraph-architecture.prompt.txt`, and
  `docs/langgraph-image-notes.md`: superseded generated diagram assets. The active
  architecture uses a maintained Mermaid graph and the validated CLI blueprint.
- Root `node_modules/`: dependencies belonged to the retired copy-bot. The root
  Node package now only delegates scripts to the independently installed reference.
- Stale Python `__pycache__` directories and generated project `.egg-info` metadata.
  These are regenerable and ignored; package installation may recreate metadata.
- Older duplicate reference UI logs `ui-stdout.log` and `ui-stderr.log`; the active
  server uses `ui.stdout.log`, `ui.stderr.log`, and `ui.pid`.

## Retained

- The complete `apps/kalshi-btc15m` reference, its tests, package lock, installed SDK,
  active runtime files, and external credential convention.
- The Python catalog integration and its mocked SDK regression tests.
- Canonical Decimal data contracts and architecture/context/plan commands.
- `.venv`, local credentials, all private-key locations, and current runtime state.

## Added or consolidated

English README and instructions; sports role/workflow registry; conditional graph
blueprint; contract specification; medallion design and proposed SQL schema;
next-session acceptance criteria; scoped AI prompts; updated project context and
a decision record. Root scripts now expose the reference UI explicitly and no
longer install a second Node SDK. Sports connections and execution remain inactive.

The ZIP is historical reference, not an active dependency. Restore it to a separate
folder if needed; do not overwrite the reorganized project or copy credentials into it.
