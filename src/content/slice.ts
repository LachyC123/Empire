// First-slice (M0–M2) authored content: the backroom + adjoining workshop layout,
// stations, buffers, hire offers and the subset of catalogue nodes this build
// implements completely. Values marked "proposed" are not in the pack data and
// need playtesting.

export const TILE = 16;
export const MAP_W = 32;
export const MAP_H = 14;

export type PropertyId = 'backroom' | 'annex';
export type ItemType = 'blank_stock' | 'sleeve' | 'prepared' | 'finished';
export type StationKind = 'form' | 'pack' | 'counter';
export type RoleId = 'assembler' | 'packer' | 'loader';

export interface Rect { x: number; y: number; w: number; h: number }
export interface Tile { x: number; y: number }

export interface Point { x: number; y: number }

export interface BufferDef {
  id: string;
  property: PropertyId;
  accepts: ItemType;
  rect: Rect;
  /** Exact standing points (tile units) from which the buffer can be used. */
  access: Point[];
  label: string;
  art: 'shelf_blank' | 'shelf_sleeve' | 'tray' | 'rack';
}

export interface LaneDef {
  id: string;
  station: string;
  /** Exact standing point behind the bench, facing the camera. */
  anchor: Point;
  rect: Rect;
  /** Lane module node that builds this lane; null = present when the property is owned. */
  builtBy: string | null;
  label: string;
}

export interface StationDef {
  id: string;
  property: PropertyId;
  kind: StationKind;
  name: string;
  lanes: string[];
  /** Upgrade branch for speed ranks (station-scoped). */
  speedBranch: 'assembly' | 'packaging' | null;
  equipmentBranch: 'equipment' | null;
}

export const ROLE_FOR_KIND: Record<StationKind, RoleId> = { form: 'assembler', pack: 'packer', counter: 'loader' };

/**
 * Proposed escalation; first entry equals the pack's baseHireCost. Later entries were lowered after the
 * pacing fixture (tests/pacing.test.ts) showed mid-slice purchases arriving well after the pack's targets.
 */
export const HIRE_COSTS: Record<RoleId, number[]> = {
  assembler: [60, 95, 150],
  packer: [90, 120, 180],
  loader: [160]
};

/** Loader commission is not in the pack economy; proposed $1 per handed-over unit. */
export const LOADER_COMMISSION = 1;

/** Ranks this slice implements end-to-end (mechanic + visible change). */
export const SLICE_MAX_RANK: Record<string, number> = {
  assembly: 3,
  packaging: 3,
  equipment: 2,
  lanes: 2,
  shelving: 2,
  property: 1
};

export const BASE_BUFFER_CAPACITY = 12;
export const PLAYER_CARRY = 2;
export const SUPPLY_PAIR_PRICE = 5; // blank_stock 4 + sleeve 1 (pack prices)

/** Slice gate on top of the node prerequisites (doc 04: "two occupied work lanes and a genuine throughput milestone"). */
export const ANNEX_GATE = { minWorkers: 2, minOrders: 8 };

const both = (x: number, w: number): Point[] => {
  const pts: Point[] = [];
  for (let i = 0; i < w; i++) pts.push({ x: x + i + 0.5, y: 5.5 }, { x: x + i + 0.5, y: 7.5 });
  return pts;
};
const below = (x: number, w: number): Point[] => Array.from({ length: w }, (_, i) => ({ x: x + i + 0.5, y: 3.5 }));

// The production line runs left→right along row 6 with standing room behind (row 5) and in
// front (row 7). Supply shelves and the buyer hatch sit against the back wall (row 2).
export const BUFFERS: BufferDef[] = [
  { id: 'buf_blank', property: 'backroom', accepts: 'blank_stock', rect: { x: 3, y: 2, w: 2, h: 1 }, access: below(3, 2), label: 'Blank stock shelf', art: 'shelf_blank' },
  { id: 'buf_tray', property: 'backroom', accepts: 'prepared', rect: { x: 6, y: 6, w: 2, h: 1 }, access: both(6, 2), label: 'Prepared tray', art: 'tray' },
  { id: 'buf_sleeve', property: 'backroom', accepts: 'sleeve', rect: { x: 7, y: 2, w: 2, h: 1 }, access: below(7, 2), label: 'Sleeve shelf', art: 'shelf_sleeve' },
  { id: 'buf_finished', property: 'backroom', accepts: 'finished', rect: { x: 10, y: 6, w: 2, h: 1 }, access: both(10, 2), label: 'Finished goods rack', art: 'rack' },
  { id: 'buf_blank_annex', property: 'annex', accepts: 'blank_stock', rect: { x: 21, y: 2, w: 2, h: 1 }, access: below(21, 2), label: 'Workshop blank bay', art: 'shelf_blank' },
  { id: 'buf_tray_annex', property: 'annex', accepts: 'prepared', rect: { x: 23, y: 6, w: 2, h: 1 }, access: both(23, 2), label: 'Workshop tray', art: 'tray' },
  { id: 'buf_sleeve_annex', property: 'annex', accepts: 'sleeve', rect: { x: 25, y: 2, w: 2, h: 1 }, access: below(25, 2), label: 'Workshop sleeve bay', art: 'shelf_sleeve' },
  { id: 'buf_finished_annex', property: 'annex', accepts: 'finished', rect: { x: 27, y: 6, w: 2, h: 1 }, access: both(27, 2), label: 'Workshop goods rack', art: 'rack' }
];

export const STATIONS: StationDef[] = [
  { id: 'st_form', property: 'backroom', kind: 'form', name: 'Forming bench', lanes: ['F1', 'F2'], speedBranch: 'assembly', equipmentBranch: null },
  { id: 'st_pack', property: 'backroom', kind: 'pack', name: 'Packing table', lanes: ['P1', 'P2'], speedBranch: 'packaging', equipmentBranch: 'equipment' },
  { id: 'st_counter', property: 'backroom', kind: 'counter', name: 'Handover hatch', lanes: ['C1'], speedBranch: null, equipmentBranch: null },
  { id: 'st_form_annex', property: 'annex', kind: 'form', name: 'Workshop forming bench', lanes: ['F3'], speedBranch: 'assembly', equipmentBranch: null },
  { id: 'st_pack_annex', property: 'annex', kind: 'pack', name: 'Workshop packing table', lanes: ['P3'], speedBranch: 'packaging', equipmentBranch: 'equipment' }
];

const bench = (x: number) => ({ anchor: { x: x + 1, y: 5.5 }, rect: { x, y: 6, w: 2, h: 1 } });

export const LANES: LaneDef[] = [
  { id: 'F1', station: 'st_form', ...bench(2), builtBy: null, label: 'Forming position 1' },
  { id: 'F2', station: 'st_form', ...bench(4), builtBy: 'lanes_2', label: 'Forming position 2' },
  { id: 'P1', station: 'st_pack', ...bench(8), builtBy: null, label: 'Packing position 1' },
  { id: 'P2', station: 'st_pack', ...bench(12), builtBy: 'lanes_1', label: 'Packing position 2' },
  { id: 'C1', station: 'st_counter', anchor: { x: 11.5, y: 3.5 }, rect: { x: 10, y: 2, w: 3, h: 1 }, builtBy: null, label: 'Hatch counter' },
  { id: 'F3', station: 'st_form_annex', ...bench(21), builtBy: null, label: 'Workshop forming position' },
  { id: 'P3', station: 'st_pack_annex', ...bench(25), builtBy: null, label: 'Workshop packing position' }
];

export interface DecorDef { id: string; property: PropertyId; art: string; rect: Rect; solid: boolean }

export const DECOR: DecorDef[] = [
  { id: 'desk', property: 'backroom', art: 'desk', rect: { x: 15, y: 10, w: 2, h: 1 }, solid: true },
  { id: 'chair', property: 'backroom', art: 'armchair', rect: { x: 17, y: 11, w: 1, h: 1 }, solid: true },
  { id: 'crates', property: 'backroom', art: 'crates', rect: { x: 1, y: 11, w: 2, h: 1 }, solid: true },
  { id: 'plant', property: 'backroom', art: 'plant', rect: { x: 18, y: 2, w: 1, h: 1 }, solid: true },
  { id: 'bin', property: 'backroom', art: 'bin', rect: { x: 14, y: 2, w: 1, h: 1 }, solid: true },
  { id: 'lamp', property: 'backroom', art: 'floor_lamp', rect: { x: 18, y: 10, w: 1, h: 1 }, solid: true },
  { id: 'sofa', property: 'annex', art: 'sofa', rect: { x: 21, y: 11, w: 2, h: 1 }, solid: true },
  { id: 'kettle', property: 'annex', art: 'kettle_table', rect: { x: 24, y: 11, w: 1, h: 1 }, solid: true },
  { id: 'annex_plant', property: 'annex', art: 'plant', rect: { x: 30, y: 2, w: 1, h: 1 }, solid: true },
  { id: 'lockers', property: 'annex', art: 'lockers', rect: { x: 29, y: 2, w: 1, h: 1 }, solid: true }
];

/** Wall-mounted art in the top wall face row (y=1); not collidable beyond the wall itself. */
export const WALL_ART = [
  { art: 'poster', x: 1, w: 1, property: 'backroom' as PropertyId },
  { art: 'clock', x: 6, w: 1, property: 'backroom' as PropertyId },
  { art: 'hatch', x: 10, w: 3, property: 'backroom' as PropertyId },
  { art: 'window', x: 15, w: 3, property: 'backroom' as PropertyId },
  { art: 'window', x: 22, w: 2, property: 'annex' as PropertyId },
  { art: 'noticeboard', x: 27, w: 2, property: 'annex' as PropertyId }
];

export const STREET_DOOR: Tile = { x: 9, y: 13 };
export const STREET_INSIDE: Tile = { x: 9, y: 12 };
export const BACK_DOOR: Tile = { x: 0, y: 9 };
export const BACK_INSIDE: Tile = { x: 1, y: 9 };
export const DIVIDER_X = 19;
export const DIVIDER_OPENING = [8, 9];

export function propertyOfTile(x: number): PropertyId {
  return x >= DIVIDER_X ? 'annex' : 'backroom';
}

export const FIRST_NAMES: Record<RoleId, string[]> = {
  assembler: ['Mina', 'Tavi', 'Odette'],
  packer: ['Jules', 'Rook', 'Pim'],
  loader: ['Dex']
};

export const TRAITS: Record<string, string> = {
  Mina: 'Meticulous — steady, careful hands',
  Jules: 'Lively — takes pride in neat packages',
  Tavi: 'Quiet — hums while working',
  Odette: 'Night owl — loves the lamp light',
  Rook: 'Tidy — squares every stack',
  Pim: 'Chatty — knows every buyer',
  Dex: 'Charming — regulars ask for Dex'
};

export const BUYERS = ['Lou', 'Petra', 'Nico', 'Mrs Abel', 'Hanno', 'Juno', 'Fitz', 'Sal', 'Bram', 'Ines'];
/** Opening order sizes (proposed); afterwards seeded 1–3, rising to 4 once staffed. */
export const OPENING_ORDER_QTY = [1, 1, 2, 1, 2, 2, 3, 2];
export const NEXT_ORDER_DELAY = 2.5;
