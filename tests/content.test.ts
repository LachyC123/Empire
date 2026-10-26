import { describe, expect, it } from 'vitest';
import { buildRegistry, ContentError } from '../src/content/registry';
import economy from '../design/backroom-empire/data/economy.json';
import simulation from '../design/backroom-empire/data/simulation.json';
import products from '../design/backroom-empire/data/products.json';
import workers from '../design/backroom-empire/data/workers.json';
import upgrades from '../design/backroom-empire/data/upgrades.json';
import properties from '../design/backroom-empire/data/properties.json';
import { BUFFERS, LANES, SLICE_MAX_RANK, STATIONS } from '../src/content/slice';
import { buildSolidGrid, findPath, isSolid } from '../src/sim/grid';
import { createInitialState } from '../src/sim/sim';

const raw = () => JSON.parse(JSON.stringify({ economy, simulation, products, workers, upgrades, properties }));

describe('content registry', () => {
  it('converts the pack catalogue into validated definitions', () => {
    const r = buildRegistry();
    expect(r.nodes.size).toBe(96);
    expect(r.branches.size).toBe(16);
    expect(r.products.get('nightglass')!.seconds).toEqual([6, 8, 2]);
    expect(r.roles.get('assembler')!.baseHireCost).toBe(60);
  });

  it('every slice rank exists in the catalogue', () => {
    const r = buildRegistry();
    for (const [branch, max] of Object.entries(SLICE_MAX_RANK)) for (let i = 1; i <= max; i++) expect(r.nodes.has(`${branch}_${i}`)).toBe(true);
    for (const l of LANES) if (l.builtBy) expect(r.nodes.has(l.builtBy)).toBe(true);
  });

  it('rejects broken data loudly', () => {
    const a = raw();
    a.upgrades.nodes[1].requires = ['does_not_exist'];
    expect(() => buildRegistry(a)).toThrow(ContentError);
    const b = raw();
    b.upgrades.nodes[1].cashCost = 1;
    expect(() => buildRegistry(b)).toThrow(/increase/);
    const c = raw();
    c.economy.startingCash = 1.5;
    expect(() => buildRegistry(c)).toThrow(ContentError);
  });
});

describe('layout', () => {
  it('every anchor and access tile is walkable and reachable from the street door, before and after expansion', () => {
    const s = createInitialState();
    for (const l of LANES) s.lanes[l.id].built = !l.station.endsWith('annex');
    for (const unlocked of [[], ['annex']] as const) {
      s.unlocked = [...unlocked];
      if (unlocked.length) for (const l of LANES) s.lanes[l.id].built = true;
      const g = buildSolidGrid(s);
      const targets = [
        ...BUFFERS.filter((b) => b.property === 'backroom' || unlocked.length).flatMap((b) => b.access),
        ...LANES.filter((l) => s.lanes[l.id].built).map((l) => l.anchor)
      ].map((p) => ({ x: Math.floor(p.x), y: Math.floor(p.y) }));
      for (const t of targets) {
        expect(isSolid(g, t.x, t.y)).toBe(false);
        expect(findPath(g, { x: 9, y: 12 }, t)).not.toBeNull();
      }
    }
  });

  it('stations reference real lanes and anchors never overlap', () => {
    const ids = new Set(LANES.map((l) => l.id));
    for (const s of STATIONS) for (const l of s.lanes) expect(ids.has(l)).toBe(true);
    const keys = LANES.map((l) => `${l.anchor.x},${l.anchor.y}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
