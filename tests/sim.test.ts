import { describe, expect, it } from 'vitest';
import { Simulation, createInitialState, SIM_HZ } from '../src/sim/sim';
import { cycleSeconds, stockOf } from '../src/sim/rules';
import { makeEnvelope, readEnvelope, SaveError } from '../src/sim/save';
import { lineReport, stationReport } from '../src/sim/diagnostics';
import { stationOffers } from '../src/sim/offers';
import { autoRestock, expectClean, goToBuffer, goToLane, holdUntil, manualUnit, txn } from './helpers';

const fresh = () => new Simulation(createInitialState(7));

function runChecked(sim: Simulation, seconds: number, each?: () => void) {
  for (let i = 0; i < seconds * SIM_HZ; i++) {
    sim.step();
    if (each && i % SIM_HZ === 0) each();
    if (i % (SIM_HZ * 5) === 0) expectClean(sim);
  }
  expectClean(sim);
}

describe('opening economy', () => {
  it('starts with prepaid supplies and $20', () => {
    const sim = fresh();
    expect(sim.state.cash).toBe(20);
    expect(stockOf(sim.state, 'blank_stock')).toBe(12);
    expect(stockOf(sim.state, 'sleeve')).toBe(12);
    expectClean(sim);
  });

  it('four manual sales make the first $60 assembler affordable without paying for starter stock', () => {
    const sim = fresh();
    while (sim.state.counters.sold < 4) {
      manualUnit(sim);
      expectClean(sim);
    }
    // Opening orders are 1,1,2 units → four units settle three orders of $12 each.
    expect(sim.state.counters.sold).toBe(4);
    expect(sim.state.cash).toBe(20 + 4 * 12);
    expect(stockOf(sim.state, 'blank_stock')).toBe(8);
    expect(sim.state.counters.spentSupplies).toBe(0);
    expect(sim.hire('F1', txn()).ok).toBe(true);
    expect(sim.state.cash).toBe(8);
  });

  it('cash only enters on order settlement, not when goods are made', () => {
    const sim = fresh();
    goToBuffer(sim, 'buf_blank');
    sim.interact('buffer:buf_blank', txn());
    goToLane(sim, 'F1');
    holdUntil(sim, 'lane:F1', () => sim.state.counters.produced.prepared > 0);
    goToBuffer(sim, 'buf_sleeve');
    sim.interact('buffer:buf_sleeve', txn());
    goToLane(sim, 'P1');
    holdUntil(sim, 'lane:P1', () => sim.state.counters.produced.finished > 0);
    expect(sim.state.cash).toBe(20);
  });
});

describe('manual work and reservations', () => {
  it('no input means no work: holding at an empty-handed bench does nothing', () => {
    const sim = fresh();
    goToLane(sim, 'F1');
    sim.setHold('lane:F1');
    sim.run(10);
    expect(sim.state.counters.produced.prepared).toBe(0);
    expect(Object.keys(sim.state.jobs)).toHaveLength(0);
  });

  it('releasing the hold pauses the batch with its progress; resuming continues it', () => {
    const sim = fresh();
    goToBuffer(sim, 'buf_blank');
    sim.interact('buffer:buf_blank', txn());
    goToLane(sim, 'F1');
    sim.setHold('lane:F1');
    sim.run(3);
    sim.setHold(null);
    const job = Object.values(sim.state.jobs)[0];
    expect(job.actorId).toBeNull();
    expect(job.progress).toBeGreaterThan(0.45);
    expect(job.progress).toBeLessThan(0.55);
    sim.run(5);
    expect(job.progress).toBeLessThan(0.55);
    sim.setHold('lane:F1');
    sim.run(3.2);
    expect(sim.state.counters.produced.prepared).toBe(1);
    expectClean(sim);
  });

  it('a hired assembler takes over a paused player job instead of duplicating it', () => {
    const sim = fresh();
    sim.state.cash = 200;
    goToBuffer(sim, 'buf_blank');
    sim.interact('buffer:buf_blank', txn());
    goToLane(sim, 'F1');
    sim.setHold('lane:F1');
    sim.run(3);
    sim.setHold(null);
    const pausedId = Object.keys(sim.state.jobs)[0];
    sim.player().x = 9.5;
    sim.player().y = 10.5;
    expect(sim.hire('F1', txn()).ok).toBe(true);
    sim.run(12);
    expect(sim.state.jobs[pausedId]).toBeUndefined();
    expect(sim.state.counters.produced.prepared).toBeGreaterThanOrEqual(1);
    expect(sim.state.counters.consumed.blank_stock).toBe(sim.state.counters.produced.prepared);
    expectClean(sim);
  });

  it('the player cannot use a position a worker has reserved', () => {
    const sim = fresh();
    sim.state.cash = 200;
    sim.hire('F1', txn());
    sim.run(5);
    goToBuffer(sim, 'buf_blank');
    sim.interact('buffer:buf_blank', txn());
    goToLane(sim, 'F1');
    const workerJob = sim.state.lanes.F1.jobId;
    expect(workerJob).not.toBeNull();
    sim.setHold('lane:F1');
    sim.step();
    expect(sim.state.playerHold).toBeNull();
    expect(sim.state.jobs[workerJob!].actorId).not.toBe('player');
    expectClean(sim);
  });
});

describe('hiring', () => {
  it('a hire is a real actor that walks in, reaches a distinct anchor and produces', () => {
    const sim = fresh();
    sim.state.cash = 200;
    expect(sim.hire('F1', txn()).ok).toBe(true);
    const w = Object.values(sim.state.actors).find((a) => a.kind === 'worker')!;
    expect(w.name).toBe('Mina');
    expect(w.state).toBe('arriving');
    expect(w.y).toBeGreaterThan(12);
    runChecked(sim, 20);
    expect(sim.state.counters.produced.prepared).toBeGreaterThanOrEqual(2);
    expect(sim.state.buffers.buf_tray.items.length).toBe(sim.state.counters.produced.prepared);
    expect(w.tasksDone).toBeGreaterThanOrEqual(2);
  });

  it('commission is reserved at job start and paid once per completed task', () => {
    const sim = fresh();
    sim.state.cash = 61;
    sim.hire('F1', txn());
    let reserved = false;
    for (let i = 0; i < 30 * 30; i++) {
      sim.step();
      if (sim.state.commissionEscrow === 1) reserved = true;
      expect(sim.state.cash + sim.state.commissionEscrow + sim.state.counters.commissionsPaid).toBe(1);
    }
    expect(reserved).toBe(true);
    // $1 covered exactly one task; afterwards she waits for funds instead of driving cash negative.
    expect(sim.state.counters.commissionsPaid).toBe(1);
    expect(sim.state.cash).toBe(0);
    const w = Object.values(sim.state.actors).find((a) => a.kind === 'worker')!;
    expect(w.waitReason).toBe('need_funds');
    expectClean(sim);
  });

  it('never sells an unusable hire: occupied or unbuilt positions reject without spending', () => {
    const sim = fresh();
    sim.state.cash = 500;
    expect(sim.hire('F1', txn()).ok).toBe(true);
    const cash = sim.state.cash;
    const r = sim.hire('F1', txn());
    expect(r.ok).toBe(false);
    const r2 = sim.hire('P2', txn());
    expect(r2.ok).toBe(false);
    expect(sim.state.cash).toBe(cash);
    expect(Object.values(sim.state.actors).filter((a) => a.kind === 'worker')).toHaveLength(1);
  });

  it('a double-tapped purchase (same transaction id) applies once', () => {
    const sim = fresh();
    sim.state.cash = 500;
    const id = txn();
    expect(sim.hire('F1', id).ok).toBe(true);
    expect(sim.hire('F1', id).ok).toBe(true); // replayed receipt, not a second hire
    expect(sim.state.hires.assembler).toBe(1);
    expect(sim.state.cash).toBe(440);
  });

  it('extra workers require real lanes: build + hire bundle creates a second packing table', () => {
    const sim = fresh();
    sim.state.cash = 1000;
    sim.hire('P1', txn());
    const offers = stationOffers(sim, 'st_pack');
    const bundle = offers.find((o) => o.kind === 'buildHire')!;
    expect(bundle.cost).toBe(95 + 120);
    sim.player().x = 6.5;
    sim.player().y = 10.5;
    expect(bundle.run(txn()).ok).toBe(true);
    expect(sim.state.lanes.P2.built).toBe(true);
    expect(sim.state.lanes.P2.workerId).not.toBeNull();
    expect(sim.state.cash).toBe(1000 - 90 - 215);
  });

  it('footprint validation happens before payment', () => {
    const sim = fresh();
    sim.state.cash = 1000;
    sim.player().x = 12.5;
    sim.player().y = 6.5; // standing where the second table would go
    const r = sim.buildLane('P2', txn());
    expect(r.ok).toBe(false);
    expect(sim.state.cash).toBe(1000);
    expect(sim.state.lanes.P2.built).toBe(false);
  });
});

describe('upgrades', () => {
  it('speed upgrade keeps normalised progress and makes the remaining work faster', () => {
    const sim = fresh();
    sim.state.cash = 500;
    goToBuffer(sim, 'buf_blank');
    sim.interact('buffer:buf_blank', txn());
    goToLane(sim, 'F1');
    sim.setHold('lane:F1');
    sim.run(3); // half of 6s
    const job = Object.values(sim.state.jobs)[0];
    const before = job.progress;
    expect(sim.upgradeSpeed('st_form', 0, txn()).ok).toBe(true);
    expect(job.progress).toBe(before);
    expect(cycleSeconds(sim.state, 'st_form')).toBeCloseTo(6 / 1.15, 5);
    // Remaining half now takes 0.5 × 5.217s ≈ 2.61s instead of 3s.
    sim.run(2.7);
    expect(sim.state.counters.produced.prepared).toBe(1);
  });

  it('packaging rank 1 shows the real 6.96s figure from the formula', () => {
    const sim = fresh();
    sim.state.cash = 500;
    const offer = stationOffers(sim, 'st_pack').find((o) => o.kind === 'speed')!;
    expect(offer.benefit).toContain('8.0s → 6.96s');
  });

  it('upgrades apply once: stale expected rank is rejected without charging', () => {
    const sim = fresh();
    sim.state.cash = 500;
    expect(sim.upgradeSpeed('st_pack', 0, txn()).ok).toBe(true);
    const cash = sim.state.cash;
    const stale = sim.upgradeSpeed('st_pack', 0, txn());
    expect(stale.ok).toBe(false);
    expect(sim.state.cash).toBe(cash);
    expect(sim.state.stations.st_pack.speedRank).toBe(1);
  });

  it('equipment tier changes the real cycle and is station scoped', () => {
    const sim = fresh();
    sim.state.cash = 500;
    const t0 = cycleSeconds(sim.state, 'st_pack');
    expect(sim.upgradeEquipment('st_pack', 0, txn()).ok).toBe(true);
    expect(cycleSeconds(sim.state, 'st_pack')).toBeCloseTo(t0 * 0.95, 6);
    expect(cycleSeconds(sim.state, 'st_form')).toBe(6);
  });
});

describe('throughput and bottlenecks', () => {
  function line(opts: { packers: 1 | 2; fastForm: boolean }) {
    const sim = fresh();
    sim.state.cash = 5000;
    sim.player().x = 6.5;
    sim.player().y = 10.5;
    sim.upgradeShelving('backroom', 0, txn());
    sim.upgradeShelving('backroom', 1, txn());
    sim.hire('F1', txn());
    sim.hire('P1', txn());
    sim.hire('C1', txn());
    if (opts.packers === 2) sim.buildLaneAndHire('P2', txn());
    if (opts.fastForm) {
      // Two forming positions double supply (the doc's "4s assembly" equivalent in this layout).
      sim.buildLane('F2', txn());
      sim.hire('F2', txn());
    }
    sim.run(20); // warm-up: arrivals
    const f0 = sim.state.counters.produced.finished;
    runChecked(sim, 180, () => autoRestock(sim));
    return { sim, perMin: ((sim.state.counters.produced.finished - f0) / 180) * 60 };
  }

  it('a second packer is supply-limited until forming improves', () => {
    const one = line({ packers: 1, fastForm: false });
    const two = line({ packers: 2, fastForm: false });
    const twoFast = line({ packers: 2, fastForm: true });
    // With walking, one packer is the limit; a second packer helps until forming caps it.
    expect(two.perMin).toBeGreaterThan(one.perMin * 1.1);
    expect(twoFast.perMin).toBeGreaterThan(two.perMin * 1.15);
    const r = stationReport(two.sim.state, 'st_pack');
    expect(r.capacityPerMin).toBeCloseTo(15, 5);
    const adv = lineReport(two.sim).advice;
    expect(adv).toMatch(/forming/i);
  });

  it('production is input-limited: no stock, no output, clear reason', () => {
    const sim = fresh();
    sim.state.cash = 500;
    sim.hire('F1', txn());
    sim.run(120);
    expect(sim.state.counters.produced.prepared).toBe(12);
    const w = Object.values(sim.state.actors).find((a) => a.kind === 'worker')!;
    expect(w.waitReason).toBe('no_blank_stock');
    expect(lineReport(sim).advice).toMatch(/restock/i);
    expectClean(sim);
  });
});

describe('recovery and restock', () => {
  it('broke with no stock: errand → restock → production restored', () => {
    const sim = fresh();
    // Burn stock into finished goods on the rack, then spend all cash.
    sim.state.cash = 72; // hire ($60) + twelve $1 commissions
    sim.hire('F1', txn());
    sim.run(140);
    expect(stockOf(sim.state, 'blank_stock')).toBe(0);
    expect(sim.state.cash).toBe(0);
    // Make room on the full tray: pack one piece by hand and shelve it.
    goToBuffer(sim, 'buf_tray');
    sim.interact('buffer:buf_tray', txn());
    goToBuffer(sim, 'buf_sleeve');
    sim.interact('buffer:buf_sleeve', txn());
    goToLane(sim, 'P1');
    holdUntil(sim, 'lane:P1', () => sim.state.counters.produced.finished > 0);
    goToBuffer(sim, 'buf_finished');
    expect(sim.interact('buffer:buf_finished', txn()).ok).toBe(true);
    expect(sim.player().carrying).toHaveLength(0);
    const p = sim.player();
    p.x = 9.5; p.y = 12.5;
    expect(sim.errand(txn()).ok).toBe(true);
    sim.run(21);
    expect(sim.state.cash).toBe(8);
    expect(sim.restock(1, txn()).ok).toBe(true);
    expect(sim.state.cash).toBe(3);
    sim.run(25);
    expect(sim.state.counters.produced.prepared).toBe(13);
    expectClean(sim);
  });

  it('restock costs once, is delivered physically and respects shelf space', () => {
    const sim = fresh();
    sim.state.cash = 100;
    expect(sim.restock(1, txn()).ok).toBe(false); // shelves are full at start
    goToBuffer(sim, 'buf_blank');
    sim.interact('buffer:buf_blank', txn());
    sim.interact('buffer:buf_blank', txn());
    goToBuffer(sim, 'buf_sleeve');
    // Only blank space exists; sleeves still full → pairs limited by the smaller space.
    expect(sim.restockCapacity()).toBe(0);
    sim.interact('buffer:buf_blank', txn()); // hands full → rejected
    expect(sim.restock(1, txn()).ok).toBe(false);
    expect(sim.state.cash).toBe(100);
  });
});

describe('no soft-lock when broke', () => {
  it('a counter hand sells finished goods even at $0; the commission comes out of that sale once', () => {
    const sim = fresh();
    sim.state.cash = 160;
    sim.player().x = 6.5; sim.player().y = 10.5;
    expect(sim.hire('C1', txn()).ok).toBe(true);
    expect(sim.state.cash).toBe(0);
    // Put two finished packages on the rack by hand.
    for (let k = 0; k < 2; k++) {
      goToBuffer(sim, 'buf_blank'); sim.interact('buffer:buf_blank', txn());
      goToLane(sim, 'F1'); holdUntil(sim, 'lane:F1', () => sim.state.counters.produced.prepared > k);
      goToBuffer(sim, 'buf_sleeve'); sim.interact('buffer:buf_sleeve', txn());
      goToLane(sim, 'P1'); holdUntil(sim, 'lane:P1', () => sim.state.counters.produced.finished > k);
      goToBuffer(sim, 'buf_finished'); sim.interact('buffer:buf_finished', txn());
    }
    sim.player().x = 6.5; sim.player().y = 10.5;
    const before = sim.state.counters.ordersSettled;
    runChecked(sim, 30);
    expect(sim.state.counters.ordersSettled).toBeGreaterThan(before);
    const sold = sim.state.counters.sold;
    expect(sim.state.counters.commissionsPaid).toBe(sold);
    expect(sim.state.cash).toBe(sim.state.counters.earned - sold);
  });
});

describe('property unlock', () => {
  it('the workshop is gated, then adds real positions and buffers that workers use', () => {
    const sim = fresh();
    sim.state.cash = 5000;
    expect(sim.unlockAnnex(txn()).ok).toBe(false);
    sim.player().x = 6.5; sim.player().y = 10.5;
    sim.upgradeEquipment('st_pack', 0, txn());
    sim.hire('F1', txn());
    sim.buildLaneAndHire('P2', txn());
    sim.state.counters.ordersSettled = 8;
    const cash = sim.state.cash;
    expect(sim.unlockAnnex(txn()).ok).toBe(true);
    expect(sim.state.cash).toBe(cash - 300);
    expect(sim.state.lanes.F3.built).toBe(true);
    expect(sim.hire('F3', txn()).ok).toBe(true);
    // Workshop shelves are empty until restocked.
    sim.run(5);
    autoRestock(sim);
    runChecked(sim, 60, () => autoRestock(sim));
    expect(sim.state.stations.st_form_annex.completions.length).toBeGreaterThan(0);
    expect(sim.unlockAnnex(txn()).ok).toBe(false);
  });
});

describe('saves', () => {
  it('save/reload mid-job preserves in-progress work exactly (deterministic continuation)', () => {
    const sim = fresh();
    sim.state.cash = 1000;
    sim.player().x = 6.5; sim.player().y = 10.5;
    sim.hire('F1', txn());
    sim.hire('P1', txn());
    sim.run(23.3);
    const busy = Object.values(sim.state.jobs).filter((j) => j.progress > 0 && j.progress < 1);
    expect(busy.length).toBeGreaterThan(0);
    const env = JSON.parse(JSON.stringify(makeEnvelope(sim.state)));
    const loaded = new Simulation(readEnvelope(env));
    for (const j of busy) expect(loaded.state.jobs[j.id].progress).toBe(j.progress);
    sim.run(40);
    loaded.run(40);
    expect(JSON.stringify(loaded.state)).toBe(JSON.stringify(sim.state));
    expectClean(loaded);
  });

  it('a held player action is stored paused, never lost or duplicated', () => {
    const sim = fresh();
    goToBuffer(sim, 'buf_blank');
    sim.interact('buffer:buf_blank', txn());
    goToLane(sim, 'F1');
    sim.setHold('lane:F1');
    sim.run(2);
    const loaded = new Simulation(readEnvelope(makeEnvelope(sim.state)));
    const j = Object.values(loaded.state.jobs)[0];
    expect(j.actorId).toBeNull();
    expect(j.progress).toBeCloseTo(1 / 3, 1);
    expectClean(loaded);
  });

  it('rejects corrupt, foreign and future-version saves', () => {
    const sim = fresh();
    const env = makeEnvelope(sim.state);
    const tampered = JSON.parse(JSON.stringify(env));
    tampered.state.cash = 999999;
    expect(() => readEnvelope(tampered)).toThrow(SaveError);
    expect(() => readEnvelope({ format: 'other' })).toThrow(SaveError);
    const future = JSON.parse(JSON.stringify(env));
    future.schemaVersion = 99;
    expect(() => readEnvelope(future)).toThrow(/newer version/);
    expect(() => readEnvelope('nope')).toThrow(SaveError);
  });
});

describe('movement', () => {
  it('walls and furniture block the player', () => {
    const sim = fresh();
    const p = sim.player();
    p.x = 2.5; p.y = 7.6; // just south of the first forming bench
    sim.setInput(0, -1);
    sim.run(2);
    expect(p.y).toBeGreaterThan(7.1);
    sim.setInput(-1, 0);
    sim.run(5);
    expect(p.x).toBeGreaterThan(1.2);
  });
});
