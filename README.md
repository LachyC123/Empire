# Backroom Empire

A hands-on, top-down pixel-art tycoon for **landscape iPhone Safari** (desktop keyboard/mouse also supported).
You start alone in a borrowed backroom in rainy Bellwater, make and pack glowing (entirely fictional) Nightglass
by hand, sell it at the hatch, then hire people who visibly walk in and take over real work positions.

The design handoff that this build implements lives in [`design/backroom-empire/`](design/backroom-empire/README.md)
(extracted from `BACKROOM_EMPIRE_Claude_Code_Complete_Plan.zip`). Progress against it: [`PROGRESS.md`](PROGRESS.md).

## Run it

Requires Node 22+ (tested with 22.22.0 / npm 10.9.4).

```bash
npm install            # pinned: phaser 4.2.1, vite 6.4.5, typescript 5.7.3, vitest 3.2.7
npm run dev            # http://localhost:5173 (also on your LAN via --host, for a phone on the same Wi‑Fi)
npm run build          # static site in dist/ (relative paths; works from a subdirectory)
npm run preview        # serve the built dist/
```

Checks:

```bash
npm run check          # typecheck + unit/simulation tests + content validation (incl. the pack's validator)
npm run test:browser   # real Chromium playthrough + viewport checks; writes screenshots to docs/evidence/
```

## Controls

| | Phone (landscape) | Keyboard |
|---|---|---|
| Walk | drag anywhere on the left side (floating stick) | WASD / arrows |
| Do the highlighted thing | big button, bottom right — **hold** to work, tap to pick up / put down | E or Space (hold to work) |
| Hire / upgrade / build | **Manage**, or tap a station / shelf / worker | M |
| Next overlapping target | — | Q |
| Production line overview | **Line** (top right) | L |
| Pause, save, export/import, settings | ❚❚ (top right) | Esc / P |

Settings: sound, rain ambience, reduced motion, larger text, left-handed layout.
Saves are local (IndexedDB, with a last-good backup) and autosave; use **Export save file** from the menu to keep a copy.

## How it is built

- `src/sim/` — the authoritative, deterministic simulation (items as batch tokens, buffers, lanes, jobs with
  reservations, workers with pathfinding, orders, integer ledger, transactions with receipts, saves).
  Presentation never creates goods or money.
- `src/content/` — validated runtime definitions converted from the pack's data (`registry.ts`) plus the
  first-slice layout and offers (`slice.ts`).
- `src/art/` — all sprites are original pixel art painted in code into one atlas (see [`docs/ASSETS.md`](docs/ASSETS.md)).
- `src/render/` — Phaser 4 world scene (reads state, animates from job progress, particles, lights).
- `src/ui/` — DOM HUD, contextual action button, panels, menus; `src/persist/` — saves; `src/audio/` — synthesized SFX.
- `tests/` — Vitest simulation/content/art tests; `scripts/browser-check.mjs` — Playwright gameplay checks.
