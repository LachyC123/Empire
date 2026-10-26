import type { ItemType, PropertyId, RoleId, StationKind } from '../content/slice';

export type Loc =
  | { k: 'buffer'; id: string }
  | { k: 'actor'; id: string }
  | { k: 'lane'; id: string }
  | { k: 'transit'; id: string };

/** A typed batch token. Its sprite follows the token; there is no separate cosmetic counter. */
export interface Batch {
  id: string;
  type: ItemType;
  qty: number;
  loc: Loc;
  /** Job that has claimed this batch for collection, if any. */
  claim: string | null;
  source: string;
}

export interface BufferState {
  id: string;
  items: string[];
  /** Units of space promised to in-flight jobs/deliveries. */
  reservedIn: number;
}

export interface LaneState {
  id: string;
  built: boolean;
  jobId: string | null;
  workerId: string | null;
}

export interface StationState {
  id: string;
  speedRank: number;
  equipTier: number;
  /** Rolling completion timestamps (sim seconds) for actual-rate diagnostics. */
  completions: number[];
}

export type JobKind = 'form' | 'pack' | 'handover' | 'delivery';
export type JobState = 'reserved' | 'collecting' | 'travelling' | 'working' | 'delivering' | 'completed';

export interface Stop { bufferId: string; batchIds: string[] }

export interface Job {
  id: string;
  kind: JobKind;
  laneId: string | null;
  actorId: string | null;
  state: JobState;
  /** Remaining pickup stops (worker jobs) or drop stops (delivery jobs). */
  stops: Stop[];
  inputIds: string[];
  outputBufferId: string | null;
  outputReserved: boolean;
  progress: number;
  commission: number;
  /** Handover commission covered by the order's own payout (paid once at settlement) when cash is short. */
  commissionDeferred?: boolean;
  orderId: string | null;
  createdAt: number;
}

export type ActorKind = 'player' | 'worker' | 'supplier';
export type ActorState =
  | 'free'      // player under direct control
  | 'away'      // player on errand
  | 'arriving'  // new hire walking in
  | 'idle'
  | 'collecting'
  | 'travelling'
  | 'working'
  | 'delivering'
  | 'returning'
  | 'leaving';

export type WaitReason =
  | null
  | 'no_blank_stock'
  | 'no_sleeve'
  | 'no_prepared'
  | 'no_finished'
  | 'output_full'
  | 'need_funds'
  | 'position_busy'
  | 'no_order'
  | 'no_path';

export interface Actor {
  id: string;
  kind: ActorKind;
  role: RoleId | null;
  name: string;
  look: number;
  x: number;
  y: number;
  dir: 'down' | 'up' | 'left' | 'right';
  moving: boolean;
  path: { x: number; y: number }[];
  state: ActorState;
  jobId: string | null;
  carrying: string[];
  laneId: string | null;
  waitReason: WaitReason;
  awayUntil: number;
  /** Next sim time a blocked worker re-checks its reservation (kept in state for deterministic reloads). */
  retryAt: number;
  hiredAt: number;
  tasksDone: number;
}

export interface Order {
  id: string;
  buyer: string;
  qty: number;
  delivered: number;
  reserved: number;
  unitPrice: number;
  openedAt: number;
  /** Counter-hand commissions owed from this order's payout. */
  deferredCommission?: number;
}

export interface LedgerEntry { t: number; kind: string; amount: number; note: string }

export interface Counters {
  acquired: Record<ItemType, number>;
  consumed: Record<ItemType, number>;
  produced: Record<ItemType, number>;
  sold: number;
  ordersSettled: number;
  earned: number;
  spentSupplies: number;
  spentUpgrades: number;
  spentHires: number;
  commissionsPaid: number;
  errands: number;
}

export interface GameState {
  schema: 1;
  worldId: string;
  revision: number;
  tick: number;
  time: number;
  seed: number;
  rng: number;
  nextId: number;
  cash: number;
  commissionEscrow: number;
  batches: Record<string, Batch>;
  buffers: Record<string, BufferState>;
  lanes: Record<string, LaneState>;
  stations: Record<string, StationState>;
  actors: Record<string, Actor>;
  jobs: Record<string, Job>;
  order: Order | null;
  nextOrderAt: number;
  orderSerial: number;
  hires: Record<RoleId, number>;
  /** Purchased node ranks keyed by branch@scopeInstance, e.g. "packaging@st_pack". */
  ranks: Record<string, number>;
  unlocked: PropertyId[];
  /** Recently committed transaction receipts (bounded) for idempotency. */
  receipts: Record<string, { ok: boolean; reason?: string; t: number }>;
  receiptOrder: string[];
  ledger: LedgerEntry[];
  counters: Counters;
  playerHold: string | null;
  input: { x: number; y: number };
  milestones: Record<string, number>;
}

export type SimEvent =
  | { type: 'JobReserved'; jobId: string; laneId: string | null; actorId: string | null }
  | { type: 'JobCompleted'; jobId: string; kind: JobKind; laneId: string | null; actorId: string | null; output: string | null }
  | { type: 'BatchTransferred'; batchId: string; from: Loc; to: Loc }
  | { type: 'OrderSettled'; orderId: string; amount: number; buyer: string }
  | { type: 'OrderOpened'; orderId: string; buyer: string; qty: number }
  | { type: 'UnitHandedOver'; orderId: string }
  | { type: 'HireCommitted'; actorId: string; laneId: string; role: RoleId }
  | { type: 'UpgradeCommitted'; nodeId: string; target: string }
  | { type: 'LaneBuilt'; laneId: string }
  | { type: 'PropertyUnlocked'; property: PropertyId }
  | { type: 'SuppliesOrdered'; pairs: number; cost: number }
  | { type: 'SuppliesDelivered'; bufferId: string; count: number }
  | { type: 'ErrandStarted' }
  | { type: 'ErrandDone'; amount: number }
  | { type: 'Rejected'; command: string; reason: string }
  | { type: 'Milestone'; id: string };

export type CommandResult = { ok: true; txn: string } | { ok: false; txn: string; reason: string };

export type { ItemType, PropertyId, RoleId, StationKind };
