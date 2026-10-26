// Derived rules: lookups, capacities, cycle times and costs. Pure functions of state + content.
import { registry, node } from '../content/registry';
import {
  BASE_BUFFER_CAPACITY, BUFFERS, HIRE_COSTS, LANES, LOADER_COMMISSION, ROLE_FOR_KIND, STATIONS,
  type BufferDef, type ItemType, type LaneDef, type PropertyId, type RoleId, type StationDef, type StationKind
} from '../content/slice';
import type { GameState } from './types';

const stationById = new Map(STATIONS.map((s) => [s.id, s]));
const laneById = new Map(LANES.map((l) => [l.id, l]));
const bufferById = new Map(BUFFERS.map((b) => [b.id, b]));

export function stationDef(id: string): StationDef {
  const s = stationById.get(id);
  if (!s) throw new Error(`Unknown station ${id}`);
  return s;
}
export function laneDef(id: string): LaneDef {
  const l = laneById.get(id);
  if (!l) throw new Error(`Unknown lane ${id}`);
  return l;
}
export function bufferDef(id: string): BufferDef {
  const b = bufferById.get(id);
  if (!b) throw new Error(`Unknown buffer ${id}`);
  return b;
}
export function laneKind(laneId: string): StationKind {
  return stationDef(laneDef(laneId).station).kind;
}

export const RECIPES: Record<StationKind, { inputs: ItemType[]; output: ItemType | null; stageIndex: number }> = {
  form: { inputs: ['blank_stock'], output: 'prepared', stageIndex: 0 },
  pack: { inputs: ['prepared', 'sleeve'], output: 'finished', stageIndex: 1 },
  counter: { inputs: ['finished'], output: null, stageIndex: 2 }
};

export function rankKey(branch: string, target: string): string {
  return `${branch}@${target}`;
}
export function rankOf(state: GameState, branch: string, target: string): number {
  return state.ranks[rankKey(branch, target)] ?? 0;
}

export function propertyOwned(state: GameState, p: PropertyId): boolean {
  return p === 'backroom' || state.unlocked.includes(p);
}

export function bufferCapacity(state: GameState, bufferId: string): number {
  const def = bufferDef(bufferId);
  const r = rankOf(state, 'shelving', def.property);
  if (r === 0) return BASE_BUFFER_CAPACITY;
  return Number(node(`shelving_${r}`).mechanic.units);
}

export function bufferSpace(state: GameState, bufferId: string): number {
  const b = state.buffers[bufferId];
  return bufferCapacity(state, bufferId) - b.items.length - b.reservedIn;
}

export function unclaimed(state: GameState, bufferId: string): string[] {
  return state.buffers[bufferId].items.filter((id) => state.batches[id].claim === null);
}

/** Buffers that accept a type in properties the player owns. */
export function buffersFor(state: GameState, type: ItemType): BufferDef[] {
  return BUFFERS.filter((b) => b.accepts === type && propertyOwned(state, b.property));
}

export function stockOf(state: GameState, type: ItemType): number {
  return buffersFor(state, type).reduce((n, b) => n + state.buffers[b.id].items.length, 0);
}

export function baseSeconds(kind: StationKind): number {
  const nightglass = registry().products.get('nightglass')!;
  return nightglass.seconds[RECIPES[kind].stageIndex];
}

/** cycle = max(min, base × equipmentFactor / (1 + rateBonus + skill)) — doc 03 work speed model. */
export function cycleSeconds(state: GameState, stationId: string, skillBonus = 0): number {
  const def = stationDef(stationId);
  const st = state.stations[stationId];
  const base = baseSeconds(def.kind);
  let rate = 0;
  let min = registry().sim.minPackagingSeconds;
  if (def.speedBranch && st.speedRank > 0) {
    const m = node(`${def.speedBranch}_${st.speedRank}`).mechanic;
    rate = Number(m.additiveRateBonus);
    min = Number(m.minimumCycleSeconds);
  }
  let factor = 1;
  if (def.equipmentBranch && st.equipTier > 0) factor = Number(node(`${def.equipmentBranch}_${st.equipTier}`).mechanic.cycleTimeFactor);
  return Math.max(min, (base * factor) / (1 + rate + skillBonus));
}

export function cycleAfterSpeed(state: GameState, stationId: string): number | null {
  const def = stationDef(stationId);
  const st = state.stations[stationId];
  if (!def.speedBranch) return null;
  const clone = { ...state, stations: { ...state.stations, [stationId]: { ...st, speedRank: st.speedRank + 1 } } };
  return cycleSeconds(clone as GameState, stationId);
}

export function cycleAfterEquipment(state: GameState, stationId: string): number | null {
  const def = stationDef(stationId);
  const st = state.stations[stationId];
  if (!def.equipmentBranch) return null;
  const clone = { ...state, stations: { ...state.stations, [stationId]: { ...st, equipTier: st.equipTier + 1 } } };
  return cycleSeconds(clone as GameState, stationId);
}

export function hireCost(state: GameState, role: RoleId): number | null {
  const n = state.hires[role] ?? 0;
  const list = HIRE_COSTS[role];
  return n < list.length ? list[n] : null;
}

export function commissionFor(role: RoleId): number {
  if (role === 'loader') return LOADER_COMMISSION;
  return registry().economy.commission[role] ?? 0;
}

export function roleForLane(laneId: string): RoleId {
  return ROLE_FOR_KIND[laneKind(laneId)];
}

export function centre(t: { x: number; y: number }): { x: number; y: number } {
  return { x: t.x + 0.5, y: t.y + 0.5 };
}

export function distToRect(x: number, y: number, r: { x: number; y: number; w: number; h: number }): number {
  const dx = Math.max(r.x - x, 0, x - (r.x + r.w));
  const dy = Math.max(r.y - y, 0, y - (r.y + r.h));
  return Math.hypot(dx, dy);
}
