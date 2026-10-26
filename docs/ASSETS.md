# Asset and licence manifest

No third-party art, audio, fonts or music are used. Everything below is original work created for this
repository, so it can be redistributed with the source.

| Asset | Source | Licence / ownership | Where | Notes |
|---|---|---|---|---|
| Characters: player, 7 named workers (Mina, Tavi, Odette, Jules, Rook, Pim, Dex), 2 spare looks, Oren (supplier), 4 buyers | Painted in code (`src/art/characters.ts`) | Original, part of this repo | atlas `ch{look}_{pose}` | 24×32 frames, feet pivot (12,30). Poses per look: idle×2, walk×4, carry-walk×4 in 3 directions (left = mirrored right), plus work_low, work_high, press, reach, fold, inspect, cheer×2, wait×2, back_work×2. |
| Tiles: floorboards ×4 + worn, workshop tiles ×2, wall faces ×3 (+workshop), wall tops, doors, void | `src/art/props.ts` | Original | atlas | 16×16 grid |
| Workstations: forming bench T1/T2, packing table T1/T2/T3, lever (up/down), belt ×4, indicator, counter, tray table, goods rack, wood & metal shelves, build pad | `src/art/props.ts` | Original | atlas | Tier art changes silhouette/mechanism, not just colour |
| Decor: desk+lamp, armchair, crates, plants, bin, floor lamp, sofa, kettle table, lockers, boarded doorway, windows (4-frame rain), hatch, poster, clock, noticeboard | `src/art/props.ts` | Original | atlas | |
| Items & FX: blank stock, prepared Nightglass, sleeve, finished package, crate, status bubbles ×7, particles (spark, paper fleck, dust, coin, glint), selection corner, soft glow | `src/art/props.ts`, `src/render/textures.ts` | Original | atlas / `glow` | |
| UI icons | Inline SVG in `src/ui/icons.ts` | Original | DOM | Always paired with words |
| Sound effects + rain ambience | Synthesised at runtime with Web Audio (`src/audio/sfx.ts`) | Original | — | No audio files shipped |
| Font | System UI font stack | Device fonts, not distributed | CSS | |

Palette and proportions follow the pack's art bible (doc 08): warm ochre floors, deep teal walls, cream work
surfaces, copper equipment, teal Nightglass accent. Preview the atlas with
`ART_PREVIEW=<dir> npx vitest run tests/art.test.ts`.

## Known art gaps (honest scope)

- Only three character facings (side is mirrored); no dedicated "carry crate", "load", "short break" or "flee"
  poses yet (not needed until those systems exist).
- Forming bench has two visual tiers and packing table three; ranks beyond the slice reuse the top tier.
- No music. Sound is a small synthesised set, mixed by ear in headless testing only — not verified on a phone speaker.
- This art is a coherent first pass by code, not a commissioned art pack; a dedicated pixel artist pass would
  raise quality further (see PROGRESS.md "second polish pass").
