// The near-term goal strip: one clear next step at a time, derived purely from state.
import { stockOf } from './rules';
import type { GameState } from './types';

export interface Goal { id: string; text: string; done: (s: GameState) => boolean }

const workers = (s: GameState, role?: string) => Object.values(s.actors).filter((a) => a.kind === 'worker' && (!role || a.role === role)).length;

export const GOALS: Goal[] = [
  { id: 'take', text: 'Grab a blank from the shelf (top left)', done: (s) => s.counters.produced.prepared > 0 || Object.values(s.actors.player.carrying).length > 0 },
  { id: 'form', text: 'Hold Work at the forming bench to shape Nightglass', done: (s) => s.counters.produced.prepared > 0 },
  { id: 'pack', text: 'Take a sleeve and hold Work at the packing table', done: (s) => s.counters.produced.finished > 0 },
  { id: 'sell', text: 'Hand the package to the buyer at the hatch', done: (s) => s.counters.ordersSettled > 0 },
  { id: 'hire1', text: 'Earn $60 and hire your first assembler at the forming bench', done: (s) => workers(s, 'assembler') > 0 },
  { id: 'speed', text: 'Upgrade packing speed at the packing table', done: (s) => s.stations.st_pack.speedRank > 0 },
  { id: 'hire2', text: 'Hire a packer so you can focus on selling', done: (s) => workers(s, 'packer') > 0 },
  { id: 'restock', text: 'Restock blanks and sleeves before they run out', done: (s) => s.milestones.first_restock !== undefined },
  { id: 'lane2', text: 'Add a second packing table and staff it', done: (s) => !!s.lanes.P2.workerId },
  { id: 'bottleneck', text: 'Forming is now the bottleneck — speed it up or add a forming position', done: (s) => s.stations.st_form.speedRank >= 2 || !!s.lanes.F2.workerId },
  { id: 'equip', text: 'Install the sleeve dispenser on the packing table', done: (s) => s.stations.st_pack.equipTier >= 1 },
  { id: 'annex', text: 'Open the adjoining workshop', done: (s) => s.unlocked.includes('annex') },
  { id: 'staffAnnex', text: 'Staff the workshop bench and table', done: (s) => !!s.lanes.F3.workerId && !!s.lanes.P3.workerId }
];

export function currentGoal(s: GameState): { goal: Goal | null; index: number; total: number; hint: string | null } {
  const i = GOALS.findIndex((g) => !g.done(s));
  const goal = i >= 0 ? GOALS[i] : null;
  let hint: string | null = null;
  const outOfInputs = stockOf(s, 'blank_stock') === 0 || stockOf(s, 'sleeve') === 0;
  if (outOfInputs && s.cash < 5 && stockOf(s, 'finished') === 0) hint = 'Out of supplies and cash: run an errand at the street door (+$8), then restock.';
  else if (stockOf(s, 'sleeve') <= 2 && stockOf(s, 'sleeve') < stockOf(s, 'blank_stock')) hint = 'Sleeves are low — restock at a shelf.';
  else if (stockOf(s, 'blank_stock') <= 2) hint = 'Blank stock is low — restock at the shelf.';
  return { goal, index: i < 0 ? GOALS.length : i, total: GOALS.length, hint };
}
