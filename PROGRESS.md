# Progress

Live log for the build. The design pack's original note is kept at `design/backroom-empire/PROGRESS.md`.
Legend: **Implemented** = in code · **Tested** = automated check passes · **Unverified** = not yet observed on the target device.

## Milestone status

| Milestone | Status |
|---|---|
| M0 audit, charter, visual target | Done. Repo was empty except the ZIP; pack moved to `design/backroom-empire/`. Pinned TypeScript 5.7.3 + Phaser 4.2.1 + Vite 6.4.5 (same stack as the official `phaserjs/template-vite-ts`, which pins Phaser 4.0.0; Phaser 4 migration notes read from the installed package). Asset manifest: `docs/ASSETS.md`. |
| M1 hands-on first sale | Implemented + tested. |
| M2 visible tycoon transformation | Implemented + tested in Chromium. **Not yet played on a physical iPhone.** |
| M3–M8 | Not started (by design: no shallow placeholders for raids, police or capers). |

## What exists now (first playable slice)

- **Hands-on loop:** walk (floating stick / WASD), take a blank from the shelf, *hold* Work at the forming bench,
  take a sleeve, hold Work at the packing table, hand it to the buyer at the hatch. Cash only arrives when a
  buyer's whole order is handed over. Items are real batch tokens that you see in hands, on benches and on shelves.
- **Real workers:** hiring creates a named person (Mina, Jules, Tavi, Rook, Dex…) who walks in through the street
  door to a specific free position, then fetches inputs, works, and carries output. They wait with a visible bubble
  and a plain-language reason when blocked (no blanks, no sleeves, tray full, no funds). A hire is refused, without
  spending, if no position is free; the panel instead offers the bundled *add table + hire* purchase.
- **Upgrades that change the work:** packing/forming rhythm ranks 1–3 (real formula: 8.0s → 6.96s → …, progress is
  preserved mid-batch, the work-pose cadence speeds up); forming rank 3 swaps in a new bench with clamp fixture,
  lamp and glowing mould; packing equipment tier 1 adds a sleeve dispenser and an animated lever press, tier 2 a
  motorised sealer with a moving belt and indicator; second packing and forming positions are physical benches
  with dust/settle animation; bigger shelves hold visibly more stock.
- **Bottlenecks:** each panel shows actual output vs staffed capacity; the Line overview names the limiting stage
  ("Your packers can handle 17/min; forming currently supplies 10/min…").
- **Supplies & recovery:** restock (prepaid starting stock, then $5 per blank+sleeve pair) carried in by Oren
  through the back door; a no-input street errand (+$8 after 20 s) always exists; the counter hand can sell even
  at $0 (his $1 commission comes out of that sale).
- **New room:** the boarded doorway opens the adjoining workshop (requirements: sleeve dispenser, second packing
  position, 2 staff, 8 orders, $300) with its own bench, table, shelves and rack that workers really use.
- **Saves:** IndexedDB slot + last-good backup (atomic rotate), autosave on purchases and every ~12 s, save on
  hide; export/import JSON with checksum and validation; future-version saves are refused with a message;
  single-tab lock. In-progress jobs resume exactly; a held action is stored as a paused job, never lost.
- **UI:** one-press Hire/Upgrade/Build buttons with exact price, benefit and reason when unavailable; goal strip;
  pause/settings (volume, rain, reduced motion, larger text, left-handed); portrait shows "turn sideways" and pauses.
- **Art/sound:** all original, painted in code (see `docs/ASSETS.md`); synthesised material sounds per work beat,
  coins, hire/upgrade motifs and rain ambience.

## Checks performed (latest run)

- `npm run check`: typecheck clean; **39 Vitest tests** (simulation rules, transactions, saves, content, art atlas,
  harness bot, pacing) and the pack's `validate_pack.py` (PASS).
  Covered: conservation of every item stage each 5 s of long runs; integer non-negative cash; commission reserved
  once and paid once; one job per worker, one worker/job per lane, one claim per batch; double-tapped transaction
  replays the receipt instead of buying twice; stale-price/rank rejected without charge; footprint check before
  payment; hire without a free lane refused; speed upgrade keeps progress; input-limited production; save →
  reload → identical continuation; corrupt/foreign/future saves rejected; recovery from $0 with no stock;
  soft-lock regression (broke shop with goods to sell).
- `npm run test:browser` (Playwright + Chromium, SwiftShader GL): full playthrough with real keyboard input and
  panel button clicks — see `docs/evidence/browser-check.json` and screenshots `docs/evidence/*.jpg`.
  Viewports 667×375, 844×390, 932×430 and 1280×720: panel inside the screen, purchase buttons ≥ 48 px, no HUD
  overlap, no horizontal scroll. No page or console errors.
- Measured output (`docs/evidence/throughput.txt`, same seed, stock topped up, player idle, packages/min):
  5.8 base → 6.4 with packing speed 1 → 7.0 with a 2nd packer (forming-limited) → 12.2 with a 2nd forming
  position → 12.6 with the sleeve dispenser.
- Measured pacing for one scripted strategy (`docs/evidence/pacing.txt`): first sale 20 s, first hire 1:20,
  packing speed 3:56, packer 6:43, second table 13:36, dispenser 15:45, workshop open 31:15, workshop fully
  staffed 38:41. Production build: ~0.44 MB gzipped (target < 12 MB).

## Known gaps and honest limits

- **No physical iPhone test.** Safari touch feel, thumb occlusion, safe areas on a notched phone, audio unlock,
  frame rate and heat are unverified. Headless Chromium rendered at ~9 fps, so no performance claim is made.
- **Pacing after minute 7 is ~2× slower than the pack's plan** (workshop at ~31 min vs 12–15 min). I lowered only my
  own proposed later hire costs; the pack's sale price, margins and upgrade costs are unchanged pending a decision.
- Sleeve dispenser is only 5% faster (pack value `cycleTimeFactor 0.95`): visible but numerically too small to feel.
- Movement is free 8-way walking; workers path on a tile grid and may overlap each other while walking (never at
  work anchors). No layout/relocation mode yet.
- Single product (Nightglass), one buyer at a time, no runner/stockkeeper, no training, no break room.
- Raids, police pressure, properties beyond the workshop and capers are designed in the pack but deliberately not built.
- Art is a coherent code-painted first pass, not a commissioned pixel-art set; only three facings (left is mirrored).

## Proposed second polish pass (before expanding content)

1. Play on the owner's iPhone; fix touch/safe-area/audio/performance findings first.
2. Pacing: tune margins or upgrade costs so the workshop opens around 12–15 minutes, then re-run `tests/pacing.test.ts`.
3. Feel: stronger before/after on speed ranks (subtle motion lines, faster tool sound), make equipment tier 1 a
   meaningful step, short camera focus on new installs, a worker "first day" moment.
4. Art: richer bench silhouettes per tier, worker carry/place poses, room wear and personal props, small floor labels
   during onboarding.
5. Then M3: production graph data, runner role and stock targets, relocation mode, migrations test harness.
