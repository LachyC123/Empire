// Player-facing production diagnostics: actual output vs theoretical capacity and why work is blocked.
import { LANES, STATIONS, type StationKind } from '../content/slice';
import { cycleSeconds, laneDef, propertyOwned, stationDef } from './rules';
import type { Simulation } from './sim';
import type { GameState, WaitReason } from './types';

export const REASON_TEXT: Record<Exclude<WaitReason, null>, string> = {
  no_blank_stock: 'Out of blank stock — restock the shelf',
  no_sleeve: 'Out of sleeves — restock the shelf',
  no_prepared: 'Waiting for prepared pieces from forming',
  no_finished: 'Waiting for finished goods',
  output_full: 'Output rack is full',
  need_funds: 'Needs $1 work funds for commission',
  position_busy: 'Position in use — waiting',
  no_order: 'Waiting for the next buyer',
  no_path: 'Cannot reach — path blocked'
};

export interface LaneReport {
  id: string;
  label: string;
  built: boolean;
  worker: string | null;
  activity: string;
  progress: number | null;
  blocked: WaitReason;
}

export interface StationReport {
  id: string;
  kind: StationKind;
  name: string;
  cycle: number;
  positions: number;
  staffed: number;
  actualPerMin: number | null;
  capacityPerMin: number;
  lanes: LaneReport[];
  primaryBlock: string | null;
}

export function fmtSeconds(s: number): string {
  const r1 = Math.round(s * 10) / 10;
  return Math.abs(r1 - s) < 0.005 ? `${r1.toFixed(1)}s` : `${s.toFixed(2)}s`;
}

export function fmtRate(n: number): string {
  return n >= 10 ? n.toFixed(0) : n.toFixed(1);
}

const ACTIVITY: Record<string, string> = {
  arriving: 'Arriving', idle: 'Ready', collecting: 'Fetching inputs', travelling: 'Bringing inputs',
  working: 'Working', delivering: 'Delivering output', returning: 'Returning to position'
};

export function laneReport(state: GameState, laneId: string): LaneReport {
  const def = laneDef(laneId);
  const lane = state.lanes[laneId];
  const w = lane.workerId ? state.actors[lane.workerId] : null;
  const job = lane.jobId ? state.jobs[lane.jobId] : null;
  let activity = 'No one assigned';
  if (w) activity = w.waitReason && w.state === 'idle' ? REASON_TEXT[w.waitReason] : ACTIVITY[w.state] ?? w.state;
  if (job && job.actorId === 'player') activity = 'You are working here';
  else if (job && job.actorId === null) activity = 'Paused job — hold to resume';
  return {
    id: laneId,
    label: def.label,
    built: lane.built,
    worker: w ? w.name : null,
    activity,
    progress: job && job.state === 'working' ? Math.min(1, job.progress) : null,
    blocked: w && w.state === 'idle' ? w.waitReason : null
  };
}

/** Actual completions per minute over the trailing window (null until there is enough history). */
export function actualRate(state: GameState, stationId: string): number | null {
  const st = state.stations[stationId];
  const window = Math.min(60, state.time);
  if (window < 15) return null;
  const n = st.completions.filter((t) => t >= state.time - window).length;
  return (n / window) * 60;
}

export function stationReport(state: GameState, stationId: string): StationReport {
  const def = stationDef(stationId);
  const lanes = def.lanes.map((l) => laneReport(state, l));
  const built = lanes.filter((l) => l.built);
  const staffed = built.filter((l) => l.worker).length;
  const cycle = cycleSeconds(state, stationId);
  const blocks = lanes.map((l) => l.blocked).filter((b): b is Exclude<WaitReason, null> => !!b);
  return {
    id: stationId,
    kind: def.kind,
    name: def.name,
    cycle,
    positions: built.length,
    staffed,
    actualPerMin: actualRate(state, stationId),
    capacityPerMin: (staffed * 60) / cycle,
    lanes,
    primaryBlock: blocks.length ? REASON_TEXT[blocks[0]] : staffed === 0 && built.length ? 'No one assigned — you can work it by hand' : null
  };
}

export interface LineStage { kind: StationKind; label: string; capacity: number; actual: number | null; staffed: number; positions: number }

export function lineReport(sim: Simulation): { stages: LineStage[]; advice: string } {
  const s = sim.state;
  const kinds: [StationKind, string][] = [['form', 'Forming'], ['pack', 'Packing'], ['counter', 'Handover']];
  const stages = kinds.map(([kind, label]) => {
    const sts = STATIONS.filter((st) => st.kind === kind && propertyOwned(s, st.property)).map((st) => stationReport(s, st.id));
    const actuals = sts.map((r) => r.actualPerMin).filter((v): v is number => v !== null);
    return {
      kind, label,
      capacity: sts.reduce((n, r) => n + r.capacityPerMin, 0),
      actual: actuals.length ? actuals.reduce((a, b) => a + b, 0) : null,
      staffed: sts.reduce((n, r) => n + r.staffed, 0),
      positions: sts.reduce((n, r) => n + r.positions, 0)
    };
  });
  return { stages, advice: adviseLine(sim, stages) };
}

function adviseLine(sim: Simulation, stages: LineStage[]): string {
  const s = sim.state;
  const [form, pack, hand] = stages;
  const stockBlocked = LANES.some((l) => {
    const w = s.lanes[l.id].workerId ? s.actors[s.lanes[l.id].workerId!] : null;
    return w && (w.waitReason === 'no_blank_stock' || w.waitReason === 'no_sleeve') && w.state === 'idle';
  });
  if (stockBlocked) return 'Supplies have run out. Restock at the shelf — workers wait until stock arrives.';
  if (form.staffed + pack.staffed + hand.staffed === 0) return 'You are doing every job by hand. Earn $60 to hire your first assembler.';
  const handNote = hand.staffed === 0 ? ' You are handling the hatch yourself — a counter hand automates sales.' : '';
  if (form.staffed > 0 && pack.staffed > 0) {
    if (pack.capacity < form.capacity)
      return `Packing is the bottleneck: ${fmtRate(pack.capacity)}/min while forming supplies ${fmtRate(form.capacity)}/min. Speed up packing or add a packing position.${handNote}`;
    if (form.capacity < pack.capacity)
      return `Your packers can handle ${fmtRate(pack.capacity)}/min; forming currently supplies ${fmtRate(form.capacity)}/min. Speed up forming or add a forming position.${handNote}`;
    if (hand.staffed > 0 && hand.capacity < form.capacity) return `Handover limits sales at ${fmtRate(hand.capacity)}/min. Production is ahead of the hatch.`;
    return `Forming and packing are balanced at about ${fmtRate(form.capacity)}/min before walking time.${handNote}`;
  }
  const staffed = stages.filter((st) => st.staffed > 0).map((st) => st.label.toLowerCase());
  const missing = stages.filter((st) => st.staffed === 0).map((st) => st.label.toLowerCase());
  return `Staffed: ${staffed.join(', ')}. You still handle ${missing.join(' and ')} yourself.`;
}
