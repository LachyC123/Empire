// The authoritative simulation. Owns items, inventory, assignments, money, orders and
// progression. Presentation reads state and drains events; it never grants output.
import { registry, node } from '../content/registry';
import {
  ANNEX_GATE, BACK_DOOR, BACK_INSIDE, BUFFERS, BUYERS, FIRST_NAMES, LANES, NEXT_ORDER_DELAY,
  OPENING_ORDER_QTY, PLAYER_CARRY, SLICE_MAX_RANK, STATIONS, STREET_DOOR, STREET_INSIDE, SUPPLY_PAIR_PRICE,
  type ItemType, type PropertyId, type RoleId
} from '../content/slice';
import { buildSolidGrid, findPath, isSolid, nearestWalkable, rectTiles, tileOf } from './grid';
import {
  RECIPES, bufferCapacity, bufferDef, bufferSpace, buffersFor, centre, commissionFor, cycleSeconds, distToRect, hireCost,
  laneDef, laneKind, propertyOwned, rankKey, rankOf, roleForLane, stationDef, unclaimed
} from './rules';
import type {
  Actor, Batch, CommandResult, GameState, Job, JobKind, Loc, SimEvent, WaitReason
} from './types';

export const SIM_HZ = 30;
export const SIM_DT = 1 / SIM_HZ;
const PLAYER_SPEED = 4.6; // tiles/s
const WORKER_SPEED = 4.0;
const SUPPLIER_SPEED = 3.0;
const RECEIPT_LIMIT = 256;
const LEDGER_LIMIT = 60;
const RATE_WINDOW = 60;
const PLAYER_ID = 'player';

const ITEM_TYPES: ItemType[] = ['blank_stock', 'sleeve', 'prepared', 'finished'];
const zeroItems = () => ({ blank_stock: 0, sleeve: 0, prepared: 0, finished: 0 }) as Record<ItemType, number>;

export function createInitialState(seed = 1, worldId = `world-${seed}`): GameState {
  const reg = registry();
  const s: GameState = {
    schema: 1,
    worldId,
    revision: 0,
    tick: 0,
    time: 0,
    seed,
    rng: seed >>> 0 || 1,
    nextId: 1,
    cash: reg.economy.startingCash,
    commissionEscrow: 0,
    batches: {},
    buffers: {},
    lanes: {},
    stations: {},
    actors: {},
    jobs: {},
    order: null,
    nextOrderAt: 1.5,
    orderSerial: 0,
    hires: { assembler: 0, packer: 0, loader: 0 },
    ranks: {},
    unlocked: [],
    receipts: {},
    receiptOrder: [],
    ledger: [],
    counters: {
      acquired: zeroItems(), consumed: zeroItems(), produced: zeroItems(), sold: 0, ordersSettled: 0,
      earned: 0, spentSupplies: 0, spentUpgrades: 0, spentHires: 0, commissionsPaid: 0, errands: 0
    },
    playerHold: null,
    input: { x: 0, y: 0 },
    milestones: {}
  };
  for (const b of BUFFERS) s.buffers[b.id] = { id: b.id, items: [], reservedIn: 0 };
  for (const l of LANES) s.lanes[l.id] = { id: l.id, built: l.builtBy === null && (laneDef(l.id).station.endsWith('annex') ? false : true), jobId: null, workerId: null };
  for (const st of STATIONS) s.stations[st.id] = { id: st.id, speedRank: 0, equipTier: 0, completions: [] };
  // Starting supplies are prepaid stock on the backroom shelves.
  for (const [type, qty] of Object.entries(reg.economy.startingInventory)) {
    const buf = type === 'blank_stock' ? 'buf_blank' : type === 'sleeve' ? 'buf_sleeve' : null;
    if (!buf) continue;
    for (let i = 0; i < qty; i++) {
      const id = newId(s, 'b');
      s.batches[id] = { id, type: type as ItemType, qty: 1, loc: { k: 'buffer', id: buf }, claim: null, source: 'starter' };
      s.buffers[buf].items.push(id);
      s.counters.acquired[type as ItemType]++;
    }
  }
  s.actors[PLAYER_ID] = makeActor(PLAYER_ID, 'player', null, 'You', 0, 6.5, 9.5);
  s.actors[PLAYER_ID].state = 'free';
  return s;
}

function makeActor(id: string, kind: Actor['kind'], role: RoleId | null, name: string, look: number, x: number, y: number): Actor {
  return {
    id, kind, role, name, look, x, y, dir: 'down', moving: false, path: [], state: 'idle', jobId: null,
    carrying: [], laneId: null, waitReason: null, awayUntil: 0, retryAt: 0, hiredAt: 0, tasksDone: 0
  };
}

function newId(s: GameState, prefix: string): string {
  return `${prefix}${s.nextId++}`;
}

export class Simulation {
  state: GameState;
  private events: SimEvent[] = [];
  private grid: Uint8Array;
  private gridKey = '';

  constructor(state?: GameState) {
    this.state = state ?? createInitialState();
    this.grid = this.solid();
  }

  // ---------------------------------------------------------------- utilities

  solid(): Uint8Array {
    const key = `${this.state.unlocked.join(',')}|${LANES.map((l) => (this.state.lanes[l.id].built ? 1 : 0)).join('')}`;
    if (key !== this.gridKey) {
      this.grid = buildSolidGrid(this.state);
      this.gridKey = key;
    }
    return this.grid;
  }

  drainEvents(): SimEvent[] {
    const e = this.events;
    this.events = [];
    return e;
  }

  private emit(e: SimEvent) {
    this.events.push(e);
  }

  private rand(): number {
    // mulberry32, state kept in save for deterministic reloads
    let t = (this.state.rng = (this.state.rng + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  private ledger(kind: string, amount: number, note: string) {
    const l = this.state.ledger;
    l.push({ t: Math.round(this.state.time * 10) / 10, kind, amount, note });
    if (l.length > LEDGER_LIMIT) l.splice(0, l.length - LEDGER_LIMIT);
  }

  private milestone(id: string) {
    if (this.state.milestones[id] === undefined) {
      this.state.milestones[id] = Math.round(this.state.time * 10) / 10;
      this.emit({ type: 'Milestone', id });
    }
  }

  private moveBatch(b: Batch, to: Loc) {
    const from = b.loc;
    if (from.k === 'buffer') {
      const items = this.state.buffers[from.id].items;
      const i = items.indexOf(b.id);
      if (i >= 0) items.splice(i, 1);
    } else if (from.k === 'actor') {
      const c = this.state.actors[from.id]?.carrying;
      if (c) {
        const i = c.indexOf(b.id);
        if (i >= 0) c.splice(i, 1);
      }
    }
    b.loc = to;
    if (to.k === 'buffer') this.state.buffers[to.id].items.push(b.id);
    if (to.k === 'actor') this.state.actors[to.id].carrying.push(b.id);
    this.emit({ type: 'BatchTransferred', batchId: b.id, from, to });
  }

  private consume(id: string) {
    const b = this.state.batches[id];
    if (!b) throw new Error(`consume missing batch ${id}`);
    if (b.loc.k === 'actor') {
      const c = this.state.actors[b.loc.id]?.carrying;
      if (c && c.includes(id)) c.splice(c.indexOf(id), 1);
    }
    if (b.loc.k === 'buffer') {
      const items = this.state.buffers[b.loc.id].items;
      if (items.includes(id)) items.splice(items.indexOf(id), 1);
    }
    this.state.counters.consumed[b.type] += b.qty;
    delete this.state.batches[id];
  }

  private create(type: ItemType, loc: Loc, source: string): Batch {
    const id = newId(this.state, 'b');
    const b: Batch = { id, type, qty: 1, loc, claim: null, source };
    this.state.batches[id] = b;
    if (loc.k === 'actor') this.state.actors[loc.id].carrying.push(id);
    if (loc.k === 'buffer') this.state.buffers[loc.id].items.push(id);
    return b;
  }

  private txn(txn: string, name: string, fn: () => string | null): CommandResult {
    const prior = this.state.receipts[txn];
    if (prior) return prior.ok ? { ok: true, txn } : { ok: false, txn, reason: prior.reason ?? 'rejected' };
    const reason = fn();
    this.state.receipts[txn] = reason ? { ok: false, reason, t: this.state.time } : { ok: true, t: this.state.time };
    this.state.receiptOrder.push(txn);
    while (this.state.receiptOrder.length > RECEIPT_LIMIT) delete this.state.receipts[this.state.receiptOrder.shift()!];
    if (reason) {
      this.emit({ type: 'Rejected', command: name, reason });
      return { ok: false, txn, reason };
    }
    this.state.revision++;
    return { ok: true, txn };
  }

  // ---------------------------------------------------------------- commands

  setInput(x: number, y: number) {
    const m = Math.hypot(x, y);
    this.state.input = m > 1 ? { x: x / m, y: y / m } : { x, y };
  }

  setHold(target: string | null) {
    if (this.state.playerHold === target) return;
    this.releaseHold();
    this.state.playerHold = target;
  }

  private releaseHold() {
    const s = this.state;
    if (!s.playerHold) return;
    for (const j of Object.values(s.jobs)) if (j.actorId === PLAYER_ID) j.actorId = null; // paused, progress kept
    s.playerHold = null;
  }

  hire(laneId: string, txn: string): CommandResult {
    return this.txn(txn, 'hire', () => this.doHire(laneId));
  }

  private doHire(laneId: string): string | null {
    const s = this.state;
    const lane = s.lanes[laneId];
    if (!lane) return 'Unknown position';
    if (!lane.built) return 'Build this position first';
    if (lane.workerId) return 'This position already has a worker';
    const role = roleForLane(laneId);
    const cost = hireCost(s, role);
    if (cost === null) return 'No more applicants for this role in this build';
    if (s.cash < cost) return `Need $${cost - s.cash} more`;
    s.cash -= cost;
    s.counters.spentHires += cost;
    this.ledger('hire', -cost, `Hired ${role}`);
    this.spawnWorker(laneId, role);
    return null;
  }

  private spawnWorker(laneId: string, role: RoleId) {
    const s = this.state;
    const n = s.hires[role]++;
    const name = FIRST_NAMES[role][n] ?? `${role} ${n + 1}`;
    const look = { assembler: 1, packer: 4, loader: 7 }[role] + n;
    const id = newId(s, 'w');
    const a = makeActor(id, 'worker', role, name, look, STREET_DOOR.x + 0.5, STREET_DOOR.y + 0.5);
    a.state = 'arriving';
    a.laneId = laneId;
    a.hiredAt = s.time;
    a.dir = 'up';
    s.actors[id] = a;
    s.lanes[laneId].workerId = id;
    this.pathTo(a, laneDef(laneId).anchor);
    this.emit({ type: 'HireCommitted', actorId: id, laneId, role });
    this.milestone(`hire_${role}`);
    if (n === 0 && role === 'assembler') this.milestone('first_hire');
  }

  buildLane(laneId: string, txn: string): CommandResult {
    return this.txn(txn, 'buildLane', () => this.doBuildLane(laneId, false));
  }

  buildLaneAndHire(laneId: string, txn: string): CommandResult {
    return this.txn(txn, 'buildLaneAndHire', () => this.doBuildLane(laneId, true));
  }

  private doBuildLane(laneId: string, alsoHire: boolean): string | null {
    const s = this.state;
    const def = LANES.find((l) => l.id === laneId);
    if (!def || !def.builtBy) return 'This position cannot be built';
    const lane = s.lanes[laneId];
    if (lane.built) return 'Already built';
    const n = node(def.builtBy);
    const [, rankStr] = def.builtBy.split('_');
    const rank = Number(rankStr);
    const prop = stationDef(def.station).property;
    if (rankOf(s, 'lanes', prop) !== rank - 1) return 'Build the earlier position first';
    if (rank > SLICE_MAX_RANK.lanes) return 'Not available in this build';
    let cost = n.cashCost;
    const role = roleForLane(laneId);
    const hc = alsoHire ? hireCost(s, role) : 0;
    if (alsoHire && hc === null) return 'No more applicants for this role in this build';
    cost += hc ?? 0;
    if (s.cash < cost) return `Need $${cost - s.cash} more`;
    // Footprint validation happens before payment.
    for (const t of rectTiles(def.rect)) {
      for (const a of Object.values(s.actors)) {
        const at = tileOf(a.x, a.y);
        if (at.x === t.x && at.y === t.y) return a.kind === 'player' ? 'Step out of the build area first' : `${a.name} is standing in the build area`;
      }
    }
    lane.built = true;
    const g = buildSolidGrid(s);
    if (!this.reachable(g)) {
      lane.built = false;
      return 'That would block a walkway';
    }
    s.cash -= n.cashCost;
    s.counters.spentUpgrades += n.cashCost;
    s.ranks[rankKey('lanes', prop)] = rank;
    this.ledger('build', -n.cashCost, def.label);
    this.solid();
    this.invalidatePaths();
    this.emit({ type: 'LaneBuilt', laneId });
    this.emit({ type: 'UpgradeCommitted', nodeId: def.builtBy, target: laneId });
    if (alsoHire && hc !== null) {
      s.cash -= hc;
      s.counters.spentHires += hc;
      this.ledger('hire', -hc, `Hired ${role}`);
      this.spawnWorker(laneId, role);
    }
    return null;
  }

  private reachable(g: Uint8Array): boolean {
    const targets = [
      ...BUFFERS.filter((b) => propertyOwned(this.state, b.property)).flatMap((b) => b.access),
      ...LANES.filter((l) => this.state.lanes[l.id].built).map((l) => l.anchor)
    ].map((p) => tileOf(p.x, p.y));
    targets.push(BACK_INSIDE);
    return targets.every((t) => findPath(g, STREET_INSIDE, t) !== null);
  }

  private invalidatePaths() {
    const g = this.solid();
    for (const a of Object.values(this.state.actors)) {
      if (a.kind === 'player') {
        const t = tileOf(a.x, a.y);
        if (isSolid(g, t.x, t.y)) {
          const w = nearestWalkable(g, a.x, a.y);
          a.x = w.x + 0.5;
          a.y = w.y + 0.5;
        }
        continue;
      }
      if (a.path.length) {
        const goal = a.path[a.path.length - 1];
        this.pathTo(a, { x: Math.floor(goal.x), y: Math.floor(goal.y) });
      }
    }
  }

  upgradeSpeed(stationId: string, expectedRank: number, txn: string): CommandResult {
    return this.txn(txn, 'upgradeSpeed', () => {
      const s = this.state;
      const def = stationDef(stationId);
      if (!def.speedBranch) return 'No speed upgrades here';
      if (!propertyOwned(s, def.property)) return 'Property not owned';
      const st = s.stations[stationId];
      if (st.speedRank !== expectedRank) return 'Already upgraded';
      const next = st.speedRank + 1;
      if (next > SLICE_MAX_RANK[def.speedBranch]) return 'Top rank for this build';
      const n = node(`${def.speedBranch}_${next}`);
      if (s.cash < n.cashCost) return `Need $${n.cashCost - s.cash} more`;
      s.cash -= n.cashCost;
      s.counters.spentUpgrades += n.cashCost;
      st.speedRank = next; // normalised progress is preserved; the remaining rate changes
      s.ranks[rankKey(def.speedBranch, stationId)] = next;
      this.ledger('upgrade', -n.cashCost, `${def.name}: ${n.effect}`);
      this.emit({ type: 'UpgradeCommitted', nodeId: n.id, target: stationId });
      this.milestone(`${def.speedBranch}_upgrade`);
      return null;
    });
  }

  upgradeEquipment(stationId: string, expectedTier: number, txn: string): CommandResult {
    return this.txn(txn, 'upgradeEquipment', () => {
      const s = this.state;
      const def = stationDef(stationId);
      if (!def.equipmentBranch) return 'No equipment upgrades here';
      if (!propertyOwned(s, def.property)) return 'Property not owned';
      const st = s.stations[stationId];
      if (st.equipTier !== expectedTier) return 'Already installed';
      const next = st.equipTier + 1;
      if (next > SLICE_MAX_RANK.equipment) return 'Top tier for this build';
      const n = node(`${def.equipmentBranch}_${next}`);
      if (s.cash < n.cashCost) return `Need $${n.cashCost - s.cash} more`;
      s.cash -= n.cashCost;
      s.counters.spentUpgrades += n.cashCost;
      st.equipTier = next; // in-progress batches keep their normalised progress
      s.ranks[rankKey(def.equipmentBranch, stationId)] = next;
      this.ledger('upgrade', -n.cashCost, `${def.name}: ${n.effect}`);
      this.emit({ type: 'UpgradeCommitted', nodeId: n.id, target: stationId });
      this.milestone('equipment_upgrade');
      return null;
    });
  }

  upgradeShelving(property: PropertyId, expectedRank: number, txn: string): CommandResult {
    return this.txn(txn, 'upgradeShelving', () => {
      const s = this.state;
      if (!propertyOwned(s, property)) return 'Property not owned';
      const r = rankOf(s, 'shelving', property);
      if (r !== expectedRank) return 'Already upgraded';
      if (r + 1 > SLICE_MAX_RANK.shelving) return 'Top rank for this build';
      const n = node(`shelving_${r + 1}`);
      if (s.cash < n.cashCost) return `Need $${n.cashCost - s.cash} more`;
      s.cash -= n.cashCost;
      s.counters.spentUpgrades += n.cashCost;
      s.ranks[rankKey('shelving', property)] = r + 1;
      this.ledger('upgrade', -n.cashCost, n.effect);
      this.emit({ type: 'UpgradeCommitted', nodeId: n.id, target: property });
      return null;
    });
  }

  annexRequirements(): { label: string; met: boolean }[] {
    const s = this.state;
    const n = node('property_1');
    const workers = Object.values(s.actors).filter((a) => a.kind === 'worker').length;
    return [
      ...n.requires.map((r) => {
        const rn = node(r);
        const met = rn.branch === 'equipment' ? s.stations.st_pack.equipTier >= rn.rank : rankOf(s, rn.branch, 'backroom') >= rn.rank;
        return { label: rn.effect, met };
      }),
      { label: `${ANNEX_GATE.minWorkers} staff working`, met: workers >= ANNEX_GATE.minWorkers },
      { label: `${ANNEX_GATE.minOrders} orders completed (${Math.min(s.counters.ordersSettled, ANNEX_GATE.minOrders)}/${ANNEX_GATE.minOrders})`, met: s.counters.ordersSettled >= ANNEX_GATE.minOrders }
    ];
  }

  unlockAnnex(txn: string): CommandResult {
    return this.txn(txn, 'unlockAnnex', () => {
      const s = this.state;
      if (s.unlocked.includes('annex')) return 'Already open';
      const req = this.annexRequirements().find((r) => !r.met);
      if (req) return `Requires: ${req.label}`;
      const n = node('property_1');
      if (s.cash < n.cashCost) return `Need $${n.cashCost - s.cash} more`;
      s.cash -= n.cashCost;
      s.counters.spentUpgrades += n.cashCost;
      s.unlocked.push('annex');
      s.ranks[rankKey('property', 'empire')] = 1;
      for (const l of LANES) if (stationDef(l.station).property === 'annex' && l.builtBy === null) s.lanes[l.id].built = true;
      this.ledger('property', -n.cashCost, 'Adjoining workshop opened');
      this.solid();
      this.invalidatePaths();
      this.emit({ type: 'PropertyUnlocked', property: 'annex' });
      this.emit({ type: 'UpgradeCommitted', nodeId: 'property_1', target: 'annex' });
      this.milestone('annex');
      return null;
    });
  }

  /** Space-limited pairs of blank stock + sleeves (one Nightglass's inputs each). */
  restockCapacity(): number {
    const space = (t: ItemType) => buffersFor(this.state, t).reduce((n, b) => n + Math.max(0, bufferSpace(this.state, b.id)), 0);
    return Math.min(space('blank_stock'), space('sleeve'));
  }

  supplierBusy(): boolean {
    return Object.values(this.state.actors).some((a) => a.kind === 'supplier');
  }

  restock(pairs: number, txn: string): CommandResult {
    return this.txn(txn, 'restock', () => {
      const s = this.state;
      if (!Number.isInteger(pairs) || pairs <= 0) return 'Choose an amount';
      if (this.supplierBusy()) return 'Oren is already on the way';
      if (pairs > this.restockCapacity()) return 'Not enough shelf space';
      const cost = pairs * SUPPLY_PAIR_PRICE;
      if (s.cash < cost) return `Need $${cost - s.cash} more`;
      s.cash -= cost;
      s.counters.spentSupplies += cost;
      this.ledger('supplies', -cost, `${pairs} blank stock + ${pairs} sleeves`);
      const sup = makeActor(newId(s, 's'), 'supplier', null, 'Oren', 10, BACK_DOOR.x + 0.5, BACK_DOOR.y + 0.5);
      sup.state = 'delivering';
      sup.dir = 'right';
      s.actors[sup.id] = sup;
      const job: Job = {
        id: newId(s, 'j'), kind: 'delivery', laneId: null, actorId: sup.id, state: 'delivering', stops: [], inputIds: [],
        outputBufferId: null, outputReserved: false, progress: 0, commission: 0, orderId: null, createdAt: s.time
      };
      for (const type of ['blank_stock', 'sleeve'] as ItemType[]) {
        let left = pairs;
        // Fill the buffers with the most free space first (backroom first on ties).
        const bufs = buffersFor(s, type).map((b) => ({ id: b.id, space: bufferSpace(s, b.id) })).sort((a, b) => b.space - a.space);
        for (const b of bufs) {
          const n = Math.min(left, b.space);
          if (n <= 0) continue;
          const ids: string[] = [];
          for (let i = 0; i < n; i++) {
            ids.push(this.create(type, { k: 'actor', id: sup.id }, 'oren').id);
            s.counters.acquired[type]++;
          }
          s.buffers[b.id].reservedIn += n;
          job.stops.push({ bufferId: b.id, batchIds: ids });
          left -= n;
        }
      }
      // Visit stops nearest-first from the back door.
      job.stops.sort((a, b) => bufferDef(a.bufferId).access[0].x - bufferDef(b.bufferId).access[0].x);
      s.jobs[job.id] = job;
      sup.jobId = job.id;
      this.pathTo(sup, this.accessPoint(job.stops[0].bufferId, sup));
      this.emit({ type: 'SuppliesOrdered', pairs, cost });
      this.milestone('first_restock');
      return null;
    });
  }

  errand(txn: string): CommandResult {
    return this.txn(txn, 'errand', () => {
      const s = this.state;
      const p = s.actors[PLAYER_ID];
      if (p.state !== 'free') return 'Busy';
      if (p.carrying.length) return 'Put down what you are carrying first';
      if (Math.hypot(p.x - (STREET_DOOR.x + 0.5), p.y - (STREET_DOOR.y + 0.5)) > 1.6) return 'Go to the street door';
      this.releaseHold();
      p.state = 'away';
      p.awayUntil = s.time + registry().economy.errand.activeSeconds;
      this.emit({ type: 'ErrandStarted' });
      return null;
    });
  }

  /** Tap interaction with a buffer: place a matching carried item, otherwise take one. */
  interact(target: string, txn: string): CommandResult {
    return this.txn(txn, 'interact', () => {
      const s = this.state;
      const p = s.actors[PLAYER_ID];
      if (p.state !== 'free') return 'Busy';
      if (!target.startsWith('buffer:')) return 'Nothing to do here';
      const bufId = target.slice(7);
      const def = bufferDef(bufId);
      if (!propertyOwned(s, def.property)) return 'Locked';
      if (distToRect(p.x, p.y, def.rect) > 1.0) return 'Move closer';
      const carried = p.carrying.find((id) => s.batches[id].type === def.accepts);
      if (carried) {
        if (bufferSpace(s, bufId) <= 0) return `${def.label} is full`;
        this.moveBatch(s.batches[carried], { k: 'buffer', id: bufId });
        return null;
      }
      if (p.carrying.length >= PLAYER_CARRY) return 'Hands full';
      const avail = unclaimed(s, bufId);
      if (!avail.length) return `${def.label} is empty`;
      // Take the most recently placed unit (top of the stack).
      this.moveBatch(s.batches[avail[avail.length - 1]], { k: 'actor', id: PLAYER_ID });
      return null;
    });
  }

  // ---------------------------------------------------------------- step

  step(dt = SIM_DT) {
    const s = this.state;
    s.tick++;
    s.time += dt;
    this.solid();
    this.stepPlayer(dt);
    this.stepOrders();
    for (const a of Object.values(s.actors)) {
      if (a.kind === 'worker') this.stepWorker(a, dt);
      else if (a.kind === 'supplier') this.stepSupplier(a, dt);
    }
    if (s.tick % SIM_HZ === 0) {
      for (const st of Object.values(s.stations)) {
        const cutoff = s.time - RATE_WINDOW;
        while (st.completions.length && st.completions[0] < cutoff) st.completions.shift();
      }
    }
  }

  run(seconds: number) {
    const n = Math.round(seconds * SIM_HZ);
    for (let i = 0; i < n; i++) this.step();
  }

  private stepPlayer(dt: number) {
    const s = this.state;
    const p = s.actors[PLAYER_ID];
    if (p.state === 'away') {
      if (s.time >= p.awayUntil) {
        const amt = registry().economy.errand.rewardCash;
        s.cash += amt;
        s.counters.errands++;
        s.counters.earned += amt;
        this.ledger('errand', amt, 'Neighbourhood errand');
        p.state = 'free';
        p.x = STREET_INSIDE.x + 0.5;
        p.y = STREET_INSIDE.y + 0.5;
        p.dir = 'up';
        this.emit({ type: 'ErrandDone', amount: amt });
      }
      return;
    }
    // Movement (blocked while holding a work action).
    const { x: ix, y: iy } = s.input;
    p.moving = false;
    if (!s.playerHold && (ix !== 0 || iy !== 0)) {
      const g = this.solid();
      const hw = 0.3, hh = 0.2;
      const blocked = (x: number, y: number) =>
        isSolid(g, Math.floor(x - hw), Math.floor(y - hh)) || isSolid(g, Math.floor(x + hw), Math.floor(y - hh)) ||
        isSolid(g, Math.floor(x - hw), Math.floor(y + hh)) || isSolid(g, Math.floor(x + hw), Math.floor(y + hh));
      const nx = p.x + ix * PLAYER_SPEED * dt;
      if (!blocked(nx, p.y)) p.x = nx;
      const ny = p.y + iy * PLAYER_SPEED * dt;
      if (!blocked(p.x, ny)) p.y = ny;
      // Keep the player inside the room (doors are thresholds, not exits).
      p.y = Math.min(p.y, 12.75);
      p.x = Math.max(p.x, 1.3);
      p.moving = true;
      p.dir = Math.abs(ix) > Math.abs(iy) ? (ix > 0 ? 'right' : 'left') : iy > 0 ? 'down' : 'up';
    }
    if (s.playerHold) this.stepPlayerHold(dt);
  }

  /** Can the player work this lane from where they stand? */
  playerInLaneRange(laneId: string): boolean {
    const p = this.state.actors[PLAYER_ID];
    const def = laneDef(laneId);
    const a = def.anchor;
    return distToRect(p.x, p.y, def.rect) <= 0.95 || Math.hypot(p.x - a.x, p.y - a.y) <= 1.0;
  }

  private stepPlayerHold(dt: number) {
    const s = this.state;
    const target = s.playerHold!;
    if (!target.startsWith('lane:')) return this.releaseHold();
    const laneId = target.slice(5);
    const lane = s.lanes[laneId];
    const p = s.actors[PLAYER_ID];
    if (!lane?.built || !this.playerInLaneRange(laneId)) return this.releaseHold();
    const kind = laneKind(laneId);
    let job = lane.jobId ? s.jobs[lane.jobId] : null;
    if (job) {
      if (job.actorId && job.actorId !== PLAYER_ID) return this.releaseHold();
      if (job.state !== 'working') return this.releaseHold();
      job.actorId = PLAYER_ID;
    } else {
      // Start a new player job using carried inputs.
      const need = RECIPES[kind].inputs;
      const picked: string[] = [];
      for (const t of need) {
        const id = p.carrying.find((c) => s.batches[c].type === t && !picked.includes(c));
        if (!id) return this.releaseHold();
        picked.push(id);
      }
      let orderId: string | null = null;
      if (kind === 'counter') {
        const o = s.order;
        if (!o || o.delivered + o.reserved >= o.qty) return this.releaseHold();
        o.reserved++;
        orderId = o.id;
      }
      job = {
        id: newId(s, 'j'), kind: kind === 'counter' ? 'handover' : (kind as JobKind), laneId, actorId: PLAYER_ID, state: 'working',
        stops: [], inputIds: picked, outputBufferId: null, outputReserved: false, progress: 0, commission: 0, orderId, createdAt: s.time
      };
      s.jobs[job.id] = job;
      lane.jobId = job.id;
      for (const id of picked) this.moveBatch(s.batches[id], { k: 'lane', id: laneId });
      this.emit({ type: 'JobReserved', jobId: job.id, laneId, actorId: PLAYER_ID });
    }
    const def = laneDef(laneId);
    p.dir = p.y < def.rect.y ? 'down' : 'up';
    job.progress += dt / cycleSeconds(s, def.station);
    if (job.progress >= 1) this.completeWork(job, p);
  }

  private stepOrders() {
    const s = this.state;
    if (s.order || s.time < s.nextOrderAt) return;
    const serial = s.orderSerial++;
    const workers = Object.values(s.actors).filter((a) => a.kind === 'worker').length;
    const qty = serial < OPENING_ORDER_QTY.length ? OPENING_ORDER_QTY[serial] : 1 + Math.floor(this.rand() * (workers >= 3 ? 4 : 3));
    const buyer = BUYERS[serial % BUYERS.length];
    s.order = { id: newId(s, 'o'), buyer, qty, delivered: 0, reserved: 0, unitPrice: registry().economy.basicSale, openedAt: s.time };
    this.emit({ type: 'OrderOpened', orderId: s.order.id, buyer, qty });
  }

  /** Work finished on a lane: consume inputs, create output, release the lane. */
  private completeWork(job: Job, actor: Actor) {
    const s = this.state;
    const laneId = job.laneId!;
    const def = laneDef(laneId);
    const kind = laneKind(laneId);
    for (const id of job.inputIds) this.consume(id);
    job.inputIds = [];
    job.progress = 1;
    s.lanes[laneId].jobId = null;
    s.stations[def.station].completions.push(s.time);
    let outputId: string | null = null;
    const out = RECIPES[kind].output;
    if (out) {
      const b = this.create(out, { k: 'actor', id: actor.id }, laneId);
      s.counters.produced[out]++;
      outputId = b.id;
      this.milestone(kind === 'form' ? 'first_form' : 'first_pack');
    } else {
      // Handover: the unit goes to the buyer.
      s.counters.sold++;
      const o = s.order;
      if (o && o.id === job.orderId) {
        o.reserved--;
        o.delivered++;
        if (job.commissionDeferred && actor.kind === 'worker') {
          o.deferredCommission = (o.deferredCommission ?? 0) + job.commission;
          job.commission = 0; // now owed by the order, paid exactly once at settlement
        }
        this.emit({ type: 'UnitHandedOver', orderId: o.id });
        if (o.delivered >= o.qty) this.settleOrder();
      }
    }
    this.emit({ type: 'JobCompleted', jobId: job.id, kind: job.kind, laneId, actorId: actor.id, output: outputId });
    if (actor.kind === 'player') {
      delete s.jobs[job.id];
      return;
    }
    if (out && job.outputBufferId) {
      job.state = 'delivering';
      actor.state = 'delivering';
      this.pathTo(actor, this.accessPoint(job.outputBufferId, actor));
    } else {
      this.finishWorkerJob(job, actor);
    }
  }

  private settleOrder() {
    const s = this.state;
    const o = s.order!;
    const amount = o.qty * o.unitPrice;
    s.cash += amount;
    s.counters.earned += amount;
    s.counters.ordersSettled++;
    this.ledger('sale', amount, `${o.buyer}: ${o.qty} × Nightglass`);
    if (o.deferredCommission) {
      s.cash -= o.deferredCommission;
      s.counters.commissionsPaid += o.deferredCommission;
      this.ledger('commission', -o.deferredCommission, 'Counter hand (from sale)');
    }
    this.emit({ type: 'OrderSettled', orderId: o.id, amount, buyer: o.buyer });
    this.milestone('first_sale');
    s.order = null;
    s.nextOrderAt = s.time + NEXT_ORDER_DELAY;
  }

  private finishWorkerJob(job: Job, a: Actor) {
    const s = this.state;
    if (job.commission) {
      s.commissionEscrow -= job.commission;
      s.counters.commissionsPaid += job.commission;
      this.ledger('commission', -job.commission, `${a.name} task`);
    }
    a.tasksDone++;
    delete s.jobs[job.id];
    a.jobId = null;
    a.state = 'idle';
  }

  // ---------------------------------------------------------------- workers

  /** Path to an exact point (tile units). Tile-centre waypoints, then the exact point. */
  private pathTo(a: Actor, pt: { x: number; y: number }): boolean {
    const g = this.solid();
    let from = tileOf(a.x, a.y);
    if (isSolid(g, from.x, from.y)) from = nearestWalkable(g, a.x, a.y);
    const target = tileOf(pt.x, pt.y);
    const p = findPath(g, from, target);
    if (!p) {
      a.path = [];
      a.waitReason = 'no_path';
      return false;
    }
    a.path = p.map(centre);
    if (a.path.length) a.path[a.path.length - 1] = { x: pt.x, y: pt.y };
    else a.path = [{ x: pt.x, y: pt.y }];
    return true;
  }

  /** The access point of a buffer closest to a position. */
  accessPoint(bufferId: string, from: { x: number; y: number }): { x: number; y: number } {
    let best = bufferDef(bufferId).access[0], bd = Infinity;
    for (const p of bufferDef(bufferId).access) {
      const d = Math.hypot(p.x - from.x, p.y - from.y);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }

  /** Follow the current path; returns true when the destination is reached. */
  private follow(a: Actor, speed: number, dt: number): boolean {
    let budget = speed * dt;
    a.moving = false;
    while (budget > 0 && a.path.length) {
      const wp = a.path[0];
      const dx = wp.x - a.x, dy = wp.y - a.y;
      const d = Math.hypot(dx, dy);
      if (d <= budget) {
        a.x = wp.x;
        a.y = wp.y;
        budget -= d;
        a.path.shift();
      } else {
        a.x += (dx / d) * budget;
        a.y += (dy / d) * budget;
        budget = 0;
      }
      if (d > 1e-6) {
        a.moving = true;
        a.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
      }
    }
    return a.path.length === 0;
  }

  private atAnchor(a: Actor): boolean {
    if (!a.laneId) return false;
    const c = laneDef(a.laneId).anchor;
    return Math.hypot(a.x - c.x, a.y - c.y) < 0.05;
  }

  private nearestBuffer(a: Actor, ids: string[]): string | null {
    let best: string | null = null, bd = Infinity;
    for (const id of ids) {
      const t = this.accessPoint(id, a);
      const d = Math.hypot(t.x - a.x, t.y - a.y);
      if (d < bd) { bd = d; best = id; }
    }
    return best;
  }

  private stepWorker(a: Actor, dt: number) {
    const s = this.state;
    const job = a.jobId ? s.jobs[a.jobId] : null;
    switch (a.state) {
      case 'arriving':
      case 'returning':
        if (!a.path.length && !this.atAnchor(a)) this.pathTo(a, laneDef(a.laneId!).anchor);
        if (this.follow(a, WORKER_SPEED, dt)) {
          a.state = 'idle';
          a.dir = 'down';
        }
        return;
      case 'idle':
        this.planWorker(a);
        return;
      case 'collecting': {
        if (!job) { a.state = 'idle'; return; }
        if (!a.path.length) this.pathTo(a, this.accessPoint(job.stops[0].bufferId, a));
        if (this.follow(a, WORKER_SPEED, dt)) {
          const stop = job.stops.shift()!;
          for (const id of stop.batchIds) this.moveBatch(s.batches[id], { k: 'actor', id: a.id });
          if (job.stops.length) {
            this.pathTo(a, this.accessPoint(job.stops[0].bufferId, a));
          } else {
            job.state = 'travelling';
            a.state = 'travelling';
            this.pathTo(a, laneDef(job.laneId!).anchor);
          }
        }
        return;
      }
      case 'travelling': {
        if (!job) { a.state = 'idle'; return; }
        if (!a.path.length && !this.atAnchor(a)) this.pathTo(a, laneDef(job.laneId!).anchor);
        if (this.follow(a, WORKER_SPEED, dt)) {
          for (const id of [...a.carrying]) if (job.inputIds.includes(id)) this.moveBatch(s.batches[id], { k: 'lane', id: job.laneId! });
          job.state = 'working';
          a.state = 'working';
          a.dir = 'down';
        }
        return;
      }
      case 'working': {
        if (!job) { a.state = 'idle'; return; }
        a.moving = false;
        a.dir = 'down';
        job.progress += dt / cycleSeconds(s, laneDef(job.laneId!).station);
        if (job.progress >= 1) this.completeWork(job, a);
        return;
      }
      case 'delivering': {
        if (!job) { a.state = 'idle'; return; }
        if (!a.path.length) this.pathTo(a, this.accessPoint(job.outputBufferId!, a));
        if (this.follow(a, WORKER_SPEED, dt)) {
          const buf = s.buffers[job.outputBufferId!];
          for (const id of [...a.carrying]) this.moveBatch(s.batches[id], { k: 'buffer', id: buf.id });
          buf.reservedIn--;
          this.finishWorkerJob(job, a);
          // Immediately look for the next job from here instead of walking back first.
          this.planWorker(a);
        }
        return;
      }
      default:
        return;
    }
  }

  /** Reserve everything a job needs (lane, inputs, output space, commission) or explain why not. */
  private planWorker(a: Actor) {
    const s = this.state;
    if (!a.laneId) return;
    if (a.retryAt > s.time) return this.ensureAtAnchor(a);
    const lane = s.lanes[a.laneId];
    const def = laneDef(a.laneId);
    const kind = laneKind(a.laneId);
    const role = a.role!;
    const commission = commissionFor(role);
    const recipe = RECIPES[kind];
    const wait = (r: WaitReason) => {
      a.waitReason = r;
      a.retryAt = s.time + 0.25;
      this.ensureAtAnchor(a);
    };

    let outputBufferId: string | null = null;
    if (recipe.output) {
      const candidates = buffersFor(s, recipe.output).filter((b) => bufferSpace(s, b.id) > 0).map((b) => b.id);
      outputBufferId = this.nearestBuffer(a, candidates);
    }

    if (lane.jobId) {
      const existing = s.jobs[lane.jobId];
      if (existing.actorId !== null || existing.state !== 'working') return wait('position_busy');
      // Take over a paused job (e.g. one the player left half-done).
      if (recipe.output && !outputBufferId) return wait('output_full');
      const deferTakeover = s.cash < commission && kind === 'counter' && !!existing.orderId;
      if (s.cash < commission && !deferTakeover) return wait('need_funds');
      if (deferTakeover) existing.commissionDeferred = true;
      else { s.cash -= commission; s.commissionEscrow += commission; }
      existing.commission = commission;
      existing.actorId = a.id;
      if (outputBufferId) {
        s.buffers[outputBufferId].reservedIn++;
        existing.outputBufferId = outputBufferId;
        existing.outputReserved = true;
      }
      a.jobId = existing.id;
      a.waitReason = null;
      a.state = 'travelling';
      this.pathTo(a, def.anchor);
      return;
    }

    let order = null as GameState['order'];
    if (kind === 'counter') {
      order = s.order;
      if (!order || order.delivered + order.reserved >= order.qty) return wait('no_order');
    }
    const stops: { bufferId: string; batchIds: string[] }[] = [];
    let from = { x: a.x, y: a.y };
    for (const t of recipe.inputs) {
      const cands = buffersFor(s, t).filter((b) => unclaimed(s, b.id).length > 0).map((b) => b.id);
      const best = this.nearestBuffer({ ...a, ...from } as Actor, cands);
      if (!best) return wait(`no_${t}` as WaitReason);
      stops.push({ bufferId: best, batchIds: [unclaimed(s, best)[0]] });
      from = this.accessPoint(best, from);
    }
    if (recipe.output && !outputBufferId) return wait('output_full');
    // A sale pays for its own handover: the counter hand never deadlocks a broke shop with goods to sell.
    const defer = s.cash < commission && kind === 'counter';
    if (s.cash < commission && !defer) return wait('need_funds');

    // All checks passed: commit the reservation atomically.
    const job: Job = {
      id: newId(s, 'j'), kind: kind === 'counter' ? 'handover' : (kind as JobKind), laneId: a.laneId, actorId: a.id, state: 'collecting',
      stops, inputIds: stops.flatMap((st) => st.batchIds), outputBufferId, outputReserved: !!outputBufferId, progress: 0,
      commission, commissionDeferred: defer || undefined, orderId: order ? order.id : null, createdAt: s.time
    };
    for (const id of job.inputIds) s.batches[id].claim = job.id;
    if (outputBufferId) s.buffers[outputBufferId].reservedIn++;
    if (order) order.reserved++;
    if (!defer) {
      s.cash -= commission;
      s.commissionEscrow += commission;
    }
    s.jobs[job.id] = job;
    lane.jobId = job.id;
    a.jobId = job.id;
    a.waitReason = null;
    a.state = 'collecting';
    this.pathTo(a, this.accessPoint(stops[0].bufferId, a));
    this.emit({ type: 'JobReserved', jobId: job.id, laneId: a.laneId, actorId: a.id });
  }

  private ensureAtAnchor(a: Actor) {
    if (!this.atAnchor(a) && a.state === 'idle') {
      a.state = 'returning';
      this.pathTo(a, laneDef(a.laneId!).anchor);
    }
  }

  private stepSupplier(a: Actor, dt: number) {
    const s = this.state;
    const job = a.jobId ? s.jobs[a.jobId] : null;
    if (a.state === 'delivering' && job) {
      if (!a.path.length && job.stops.length) this.pathTo(a, this.accessPoint(job.stops[0].bufferId, a));
      if (!this.follow(a, SUPPLIER_SPEED, dt)) return;
      const stop = job.stops.shift();
      if (stop) {
        for (const id of stop.batchIds) this.moveBatch(s.batches[id], { k: 'buffer', id: stop.bufferId });
        s.buffers[stop.bufferId].reservedIn -= stop.batchIds.length;
        this.emit({ type: 'SuppliesDelivered', bufferId: stop.bufferId, count: stop.batchIds.length });
      }
      if (job.stops.length) this.pathTo(a, this.accessPoint(job.stops[0].bufferId, a));
      else {
        delete s.jobs[job.id];
        a.jobId = null;
        a.state = 'leaving';
        this.pathTo(a, centre(BACK_DOOR));
      }
      return;
    }
    if (a.state === 'leaving' && this.follow(a, SUPPLIER_SPEED, dt)) delete s.actors[a.id];
  }

  // ---------------------------------------------------------------- queries

  player(): Actor {
    return this.state.actors[PLAYER_ID];
  }

  /** Conservation and integrity checks; returns a list of violations (empty = healthy). */
  audit(): string[] {
    const s = this.state;
    const errs: string[] = [];
    const count = zeroItems();
    for (const b of Object.values(s.batches)) {
      count[b.type] += b.qty;
      if (b.loc.k === 'buffer' && !s.buffers[b.loc.id].items.includes(b.id)) errs.push(`batch ${b.id} not listed in buffer`);
      if (b.loc.k === 'actor' && !s.actors[b.loc.id]?.carrying.includes(b.id)) errs.push(`batch ${b.id} not carried by ${b.loc.id}`);
      if (b.claim && !s.jobs[b.claim]) errs.push(`batch ${b.id} claimed by missing job`);
    }
    const c = s.counters;
    // acquired = existing + consumed (raw inputs); produced = existing + consumed (intermediate/finished)
    for (const t of ['blank_stock', 'sleeve'] as ItemType[]) if (c.acquired[t] !== count[t] + c.consumed[t]) errs.push(`${t} not conserved`);
    if (c.produced.prepared !== count.prepared + c.consumed.prepared) errs.push('prepared not conserved');
    if (c.produced.finished !== count.finished + c.consumed.finished) errs.push('finished not conserved');
    if (c.consumed.finished !== c.sold) errs.push('finished consumed without a sale');
    if (c.produced.prepared !== c.consumed.blank_stock) errs.push('forming output mismatch');
    if (c.produced.finished !== c.consumed.sleeve) errs.push('packing output mismatch');
    if (!Number.isInteger(s.cash) || s.cash < 0) errs.push(`cash invalid ${s.cash}`);
    if (!Number.isInteger(s.commissionEscrow) || s.commissionEscrow < 0) errs.push('escrow invalid');
    const escrow = Object.values(s.jobs).reduce((n, j) => n + (j.actorId && s.actors[j.actorId]?.kind === 'worker' && !j.commissionDeferred ? j.commission : 0), 0);
    if (escrow !== s.commissionEscrow) errs.push(`escrow mismatch ${escrow} vs ${s.commissionEscrow}`);
    for (const b of Object.values(s.buffers)) {
      if (b.reservedIn < 0) errs.push(`buffer ${b.id} negative reservation`);
      if (b.items.length + b.reservedIn > bufferCapacity(s, b.id)) errs.push(`buffer ${b.id} overflow`);
      if (new Set(b.items).size !== b.items.length) errs.push(`buffer ${b.id} duplicate item`);
    }
    const laneJobs = new Map<string, number>();
    for (const j of Object.values(s.jobs)) {
      if (j.laneId && s.lanes[j.laneId].jobId === j.id) laneJobs.set(j.laneId, (laneJobs.get(j.laneId) ?? 0) + 1);
    }
    for (const l of Object.values(s.lanes)) if (l.jobId && !s.jobs[l.jobId]) errs.push(`lane ${l.id} references missing job`);
    const workerJobs = new Map<string, number>();
    for (const j of Object.values(s.jobs)) if (j.actorId) workerJobs.set(j.actorId, (workerJobs.get(j.actorId) ?? 0) + 1);
    for (const [a, n] of workerJobs) if (n > 1) errs.push(`actor ${a} has ${n} jobs`);
    const laneWorkers = new Map<string, number>();
    for (const a of Object.values(s.actors)) if (a.laneId) laneWorkers.set(a.laneId, (laneWorkers.get(a.laneId) ?? 0) + 1);
    for (const [l, n] of laneWorkers) if (n > 1) errs.push(`lane ${l} has ${n} workers`);
    const anchors = new Set<string>();
    for (const l of LANES) {
      const k = `${l.anchor.x},${l.anchor.y}`;
      if (anchors.has(k)) errs.push(`duplicate anchor ${k}`);
      anchors.add(k);
    }
    for (const t of ITEM_TYPES) if (count[t] < 0) errs.push(`${t} negative`);
    return errs;
  }
}
