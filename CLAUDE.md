# Backroom Empire — agent instructions

The design source of truth is `design/backroom-empire/` (CLAUDE.md, START_HERE_PROMPT.md, master plan, docs/, data/).
Read `design/backroom-empire/CLAUDE.md` before changing gameplay; its rules apply to this whole repo. Key points:

- Simulation (`src/sim/`) owns items, money, assignments, orders and progression. Rendering/UI only read state and
  react to events. Never grant output or cash from an animation, tween or particle.
- Every hire is a real actor at a real lane; every speed/equipment purchase changes the real cycle; show actual vs
  capacity and the blocking reason. No passive income counters.
- Integer money, explicit reservations, transaction ids (receipts), bounded queues, versioned saves.
  Bump `SCHEMA_VERSION` in `src/sim/save.ts` and add a migration test for any save-shape change.
- Tuning numbers come from `design/backroom-empire/data/*.json` via `src/content/registry.ts`; slice-only values
  (marked "proposed") live in `src/content/slice.ts`.
- Content is fictional and abstract (invented goods/processes; arcade capers; police pressure as a game meter only).
- Art is code-painted pixel art in `src/art/`; record any imported asset in `docs/ASSETS.md` with its licence.

Before claiming a change works: `npm run check` and, for anything visible, `npm run test:browser` and look at the
screenshots in `docs/evidence/`. Keep `PROGRESS.md` honest: planned vs implemented vs tested vs unverified.
