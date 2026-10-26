// Walkability grid and A* pathfinding over the property tile map.
import {
  BUFFERS, DECOR, DIVIDER_OPENING, DIVIDER_X, LANES, MAP_H, MAP_W, STREET_DOOR, BACK_DOOR,
  type Rect, type Tile
} from '../content/slice';
import type { GameState } from './types';

export function rectTiles(r: Rect): Tile[] {
  const out: Tile[] = [];
  for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) out.push({ x, y });
  return out;
}

/** Static walls: outer walls, top wall band (rows 0–1), divider, annex until unlocked. */
export function buildSolidGrid(state: Pick<GameState, 'lanes' | 'unlocked'>): Uint8Array {
  const g = new Uint8Array(MAP_W * MAP_H);
  const set = (x: number, y: number) => { if (x >= 0 && y >= 0 && x < MAP_W && y < MAP_H) g[y * MAP_W + x] = 1; };
  const annex = state.unlocked.includes('annex');
  for (let x = 0; x < MAP_W; x++) { set(x, 0); set(x, 1); set(x, MAP_H - 1); }
  for (let y = 0; y < MAP_H; y++) { set(0, y); set(MAP_W - 1, y); }
  for (let y = 0; y < MAP_H; y++) {
    if (annex && DIVIDER_OPENING.includes(y)) continue;
    set(DIVIDER_X, y);
  }
  if (!annex) for (let y = 0; y < MAP_H; y++) for (let x = DIVIDER_X + 1; x < MAP_W; x++) set(x, y);
  for (const b of BUFFERS) if (b.property === 'backroom' || annex) rectTiles(b.rect).forEach((t) => set(t.x, t.y));
  for (const l of LANES) if (state.lanes[l.id]?.built) rectTiles(l.rect).forEach((t) => set(t.x, t.y));
  for (const d of DECOR) if (d.solid && (d.property === 'backroom' || annex)) rectTiles(d.rect).forEach((t) => set(t.x, t.y));
  // Doors are walkable thresholds (used for arrivals/departures).
  g[STREET_DOOR.y * MAP_W + STREET_DOOR.x] = 0;
  g[BACK_DOOR.y * MAP_W + BACK_DOOR.x] = 0;
  return g;
}

export function isSolid(g: Uint8Array, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return true;
  return g[y * MAP_W + x] === 1;
}

const DIRS = [
  [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
  [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]
] as const;

/** A* from tile to tile. Returns tile-centre waypoints excluding the start, or null. */
export function findPath(g: Uint8Array, from: Tile, to: Tile): Tile[] | null {
  if (from.x === to.x && from.y === to.y) return [];
  if (isSolid(g, to.x, to.y)) return null;
  const N = MAP_W * MAP_H;
  const gScore = new Float64Array(N).fill(Infinity);
  const came = new Int32Array(N).fill(-1);
  const closed = new Uint8Array(N);
  const start = from.y * MAP_W + from.x;
  const goal = to.y * MAP_W + to.x;
  gScore[start] = 0;
  const open: number[] = [start];
  const h = (i: number) => {
    const dx = Math.abs((i % MAP_W) - to.x), dy = Math.abs(Math.floor(i / MAP_W) - to.y);
    return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy);
  };
  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (gScore[open[i]] + h(open[i]) < gScore[open[bi]] + h(open[bi])) bi = i;
    const cur = open.splice(bi, 1)[0];
    if (cur === goal) break;
    if (closed[cur]) continue;
    closed[cur] = 1;
    const cx = cur % MAP_W, cy = Math.floor(cur / MAP_W);
    for (const [dx, dy, cost] of DIRS) {
      const nx = cx + dx, ny = cy + dy;
      if (isSolid(g, nx, ny)) continue;
      if (dx !== 0 && dy !== 0 && (isSolid(g, cx + dx, cy) || isSolid(g, cx, cy + dy))) continue;
      const ni = ny * MAP_W + nx;
      const ng = gScore[cur] + cost;
      if (ng < gScore[ni]) {
        gScore[ni] = ng;
        came[ni] = cur;
        if (!closed[ni]) open.push(ni);
      }
    }
  }
  if (came[goal] === -1) return null;
  const path: Tile[] = [];
  for (let c = goal; c !== start; c = came[c]) path.push({ x: c % MAP_W, y: Math.floor(c / MAP_W) });
  return path.reverse();
}

export function tileOf(x: number, y: number): Tile {
  return { x: Math.floor(x), y: Math.floor(y) };
}

/** Nearest walkable tile to a fractional position (used after layout changes). */
export function nearestWalkable(g: Uint8Array, x: number, y: number): Tile {
  const t = tileOf(x, y);
  if (!isSolid(g, t.x, t.y)) return t;
  for (let r = 1; r < 6; r++)
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++)
        if (!isSolid(g, t.x + dx, t.y + dy)) return { x: t.x + dx, y: t.y + dy };
  return { x: STREET_DOOR.x, y: STREET_DOOR.y - 1 };
}
