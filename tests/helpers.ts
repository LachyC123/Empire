import { Simulation } from '../src/sim/sim';
import { bufferDef, laneDef } from '../src/sim/rules';
import { stockOf } from '../src/sim/rules';

let n = 0;
export const txn = () => `t${++n}`;

/** Test harness: place the player next to a target instead of steering with input. */
export function goToBuffer(sim: Simulation, bufferId: string) {
  const a = bufferDef(bufferId).access[0];
  const p = sim.player();
  p.x = a.x;
  p.y = a.y;
}
export function goToLane(sim: Simulation, laneId: string) {
  const a = laneDef(laneId).anchor;
  const p = sim.player();
  p.x = a.x;
  p.y = a.y;
}

export function holdUntil(sim: Simulation, target: string, cond: () => boolean, maxSeconds = 30) {
  sim.setHold(target);
  for (let i = 0; i < maxSeconds * 30 && !cond(); i++) sim.step();
  sim.setHold(null);
}

export function expectClean(sim: Simulation) {
  const errs = sim.audit();
  if (errs.length) throw new Error(`Audit failed: ${errs.join('; ')}`);
}

/** Perform one complete manual unit: form, pack and hand over to the current order. */
export function manualUnit(sim: Simulation) {
  const s = sim.state;
  goToBuffer(sim, 'buf_blank');
  if (!sim.interact('buffer:buf_blank', txn()).ok) throw new Error('take blank failed');
  goToLane(sim, 'F1');
  const prep0 = s.counters.produced.prepared;
  holdUntil(sim, 'lane:F1', () => s.counters.produced.prepared > prep0);
  goToBuffer(sim, 'buf_sleeve');
  if (!sim.interact('buffer:buf_sleeve', txn()).ok) throw new Error('take sleeve failed');
  goToLane(sim, 'P1');
  const fin0 = s.counters.produced.finished;
  holdUntil(sim, 'lane:P1', () => s.counters.produced.finished > fin0);
  // Wait for a buyer if needed.
  for (let i = 0; i < 300 && !s.order; i++) sim.step();
  goToLane(sim, 'C1');
  const sold0 = s.counters.sold;
  holdUntil(sim, 'lane:C1', () => s.counters.sold > sold0);
}

/** Keep the shelves topped up like an attentive player would. */
export function autoRestock(sim: Simulation) {
  if (!sim.supplierBusy() && stockOf(sim.state, 'blank_stock') < 6) {
    const cap = sim.restockCapacity();
    const pairs = Math.min(cap, Math.floor(sim.state.cash / 5));
    if (pairs > 0) sim.restock(pairs, txn());
  }
}
