// Converts the design pack's proposed tuning data into validated runtime definitions.
// The pack JSON stays the single source of tuning numbers; this module rejects
// malformed data loudly instead of guessing.
import economyJson from '../../design/backroom-empire/data/economy.json';
import simulationJson from '../../design/backroom-empire/data/simulation.json';
import productsJson from '../../design/backroom-empire/data/products.json';
import workersJson from '../../design/backroom-empire/data/workers.json';
import upgradesJson from '../../design/backroom-empire/data/upgrades.json';
import propertiesJson from '../../design/backroom-empire/data/properties.json';

export const CONTENT_VERSION = 'pack-1.0+slice-1';

export interface UpgradeNodeDef {
  id: string;
  branch: string;
  rank: number;
  scope: string;
  cashCost: number;
  requires: string[];
  effect: string;
  mechanic: Record<string, unknown> & { kind: string };
}

export interface ProductDef {
  id: string;
  name: string;
  inputs: Record<string, number>;
  stages: string[];
  seconds: number[];
  sale: number;
}

export interface WorkerRoleDef {
  id: string;
  role: string;
  baseHireCost: number;
  speciality: string;
}

export interface Registry {
  economy: {
    startingCash: number;
    startingInventory: Record<string, number>;
    purchasePrices: Record<string, number>;
    commission: Record<string, number>;
    basicSale: number;
    errand: { activeSeconds: number; rewardCash: number };
  };
  sim: {
    basePackagingSeconds: number;
    packagingSpeedStep: number;
    minPackagingSeconds: number;
    baseAssemblySeconds: number;
    baseHandoverSeconds: number;
  };
  products: Map<string, ProductDef>;
  roles: Map<string, WorkerRoleDef>;
  nodes: Map<string, UpgradeNodeDef>;
  branches: Map<string, UpgradeNodeDef[]>;
  properties: Map<string, { id: string; name: string; unlock: string | null; baseWorkerPositions: number }>;
}

export class ContentError extends Error {}

function fail(msg: string): never {
  throw new ContentError(`Content validation failed: ${msg}`);
}

function posInt(v: unknown, where: string): number {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 0) fail(`${where} must be a non-negative integer (got ${String(v)})`);
  return v;
}

function posNum(v: unknown, where: string): number {
  if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) fail(`${where} must be a positive finite number (got ${String(v)})`);
  return v;
}

const KNOWN_MECHANICS = new Set([
  'work_rate_bonus',
  'unlock_distinct_anchor',
  'equipment_module',
  'carry_capacity',
  'buffer_capacity',
  'worker_skill_bonus',
  'capability_unlock',
  'dispatch_batch'
]);

export function buildRegistry(raw = {
  economy: economyJson as unknown,
  simulation: simulationJson as unknown,
  products: productsJson as unknown,
  workers: workersJson as unknown,
  upgrades: upgradesJson as unknown,
  properties: propertiesJson as unknown
}): Registry {
  const eco = raw.economy as Record<string, any>;
  const sim = raw.simulation as Record<string, any>;

  const startingInventory: Record<string, number> = {};
  for (const [k, v] of Object.entries(eco.startingInventory ?? {})) startingInventory[k] = posInt(v, `economy.startingInventory.${k}`);
  const purchasePrices: Record<string, number> = {};
  for (const [k, v] of Object.entries(eco.purchasePrices ?? {})) purchasePrices[k] = posInt(v, `economy.purchasePrices.${k}`);
  const commission: Record<string, number> = {};
  for (const [k, v] of Object.entries(eco.commissionPerCompletedTask ?? {})) commission[k] = posInt(v, `economy.commission.${k}`);
  if (eco.offlineProgression !== false) fail('economy.offlineProgression must be false for v1');

  const products = new Map<string, ProductDef>();
  for (const p of (raw.products as any).products ?? []) {
    if (typeof p.id !== 'string' || products.has(p.id)) fail(`duplicate or missing product id ${p.id}`);
    if (!Array.isArray(p.stages) || !Array.isArray(p.seconds) || p.stages.length !== p.seconds.length) fail(`product ${p.id} stages/seconds mismatch`);
    p.seconds.forEach((s: unknown, i: number) => posNum(s, `product ${p.id} seconds[${i}]`));
    posInt(p.sale, `product ${p.id} sale`);
    products.set(p.id, { id: p.id, name: p.name, inputs: p.inputs, stages: p.stages, seconds: p.seconds, sale: p.sale });
  }

  const roles = new Map<string, WorkerRoleDef>();
  for (const w of (raw.workers as any).workers ?? []) {
    if (roles.has(w.id)) fail(`duplicate worker role ${w.id}`);
    if (w.requiresValidTaskAnchor !== true) fail(`worker ${w.id} must require a valid task anchor`);
    roles.set(w.id, { id: w.id, role: w.role, baseHireCost: posInt(w.baseHireCost, `worker ${w.id} cost`), speciality: w.speciality });
  }

  const nodes = new Map<string, UpgradeNodeDef>();
  const branches = new Map<string, UpgradeNodeDef[]>();
  for (const n of (raw.upgrades as any).nodes ?? []) {
    if (typeof n.id !== 'string' || nodes.has(n.id)) fail(`duplicate or missing node id ${n.id}`);
    if (!n.mechanic || typeof n.mechanic.kind !== 'string') fail(`node ${n.id} has no mechanic`);
    if (!KNOWN_MECHANICS.has(n.mechanic.kind)) fail(`node ${n.id} has unknown mechanic kind ${n.mechanic.kind}`);
    if (typeof n.effect !== 'string' || !n.effect) fail(`node ${n.id} has no player-facing effect`);
    const def: UpgradeNodeDef = {
      id: n.id,
      branch: n.branch,
      rank: posInt(n.rank, `node ${n.id} rank`),
      scope: n.scope,
      cashCost: posInt(n.cashCost, `node ${n.id} cost`),
      requires: Array.isArray(n.requires) ? n.requires : fail(`node ${n.id} requires must be an array`),
      effect: n.effect,
      mechanic: n.mechanic
    };
    nodes.set(def.id, def);
    if (!branches.has(def.branch)) branches.set(def.branch, []);
    branches.get(def.branch)!.push(def);
  }
  for (const n of nodes.values()) for (const r of n.requires) if (!nodes.has(r)) fail(`node ${n.id} requires unknown ${r}`);
  for (const [b, list] of branches) {
    list.sort((a, c) => a.rank - c.rank);
    list.forEach((n, i) => {
      if (n.rank !== i + 1) fail(`branch ${b} rank gap at ${n.id}`);
      if (i > 0 && n.cashCost <= list[i - 1].cashCost) fail(`branch ${b} costs must increase (${n.id})`);
    });
  }

  const properties = new Map<string, { id: string; name: string; unlock: string | null; baseWorkerPositions: number }>();
  for (const p of (raw.properties as any).properties ?? []) {
    if (p.unlock !== null && !nodes.has(p.unlock)) fail(`property ${p.id} unlock ${p.unlock} unknown`);
    properties.set(p.id, { id: p.id, name: p.name, unlock: p.unlock, baseWorkerPositions: posInt(p.baseWorkerPositions, `property ${p.id}`) });
  }

  return {
    economy: {
      startingCash: posInt(eco.startingCash, 'economy.startingCash'),
      startingInventory,
      purchasePrices,
      commission,
      basicSale: posInt(eco.basicSale, 'economy.basicSale'),
      errand: {
        activeSeconds: posNum(eco.recoveryErrand?.activeSeconds, 'errand.activeSeconds'),
        rewardCash: posInt(eco.recoveryErrand?.rewardCash, 'errand.rewardCash')
      }
    },
    sim: {
      basePackagingSeconds: posNum(sim.basePackagingSeconds, 'simulation.basePackagingSeconds'),
      packagingSpeedStep: posNum(sim.packagingSpeedStep, 'simulation.packagingSpeedStep'),
      minPackagingSeconds: posNum(sim.minPackagingSeconds, 'simulation.minPackagingSeconds'),
      baseAssemblySeconds: posNum(sim.baseAssemblySeconds, 'simulation.baseAssemblySeconds'),
      baseHandoverSeconds: posNum(sim.baseHandoverSeconds, 'simulation.baseHandoverSeconds')
    },
    products,
    roles,
    nodes,
    branches,
    properties
  };
}

let cached: Registry | null = null;
export function registry(): Registry {
  if (!cached) cached = buildRegistry();
  return cached;
}

export function node(id: string): UpgradeNodeDef {
  const n = registry().nodes.get(id);
  if (!n) throw new ContentError(`Unknown upgrade node ${id}`);
  return n;
}
