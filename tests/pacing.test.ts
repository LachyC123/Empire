import { describe, expect, it } from 'vitest';
import { writeFileSync, mkdirSync } from 'node:fs';
import { Simulation, createInitialState } from '../src/sim/sim';
import { Bot } from '../src/debug/bot';
import { stationOffers, annexOffer } from '../src/sim/offers';

/**
 * Pacing fixture: the harness bot plays the player's hands (walking, holding, handing over) and buys
 * the slice's purchases in a sensible order as soon as each is affordable. Records simulated seconds
 * to each milestone. These are measurements of one strategy, not tuned guarantees.
 */
describe('pacing (one scripted strategy)', () => {
  it('reaches every first-slice milestone with a clean audit', () => {
    const sim = new Simulation(createInitialState(2026));
    const bot = new Bot(sim, { restock: true });
    const plan: { label: string; buy: () => boolean }[] = [
      { label: 'Hire assembler (Mina)', buy: () => sim.hire('F1', `p1-${sim.state.tick}`).ok },
      { label: 'Packing speed 1', buy: () => sim.upgradeSpeed('st_pack', 0, `p2-${sim.state.tick}`).ok },
      { label: 'Hire packer (Jules)', buy: () => sim.hire('P1', `p3-${sim.state.tick}`).ok },
      { label: 'Second packing table + packer', buy: () => stationOffers(sim, 'st_pack').find((o) => o.kind === 'buildHire')?.run(`p4-${sim.state.tick}`).ok ?? false },
      { label: 'Forming speed 1', buy: () => sim.upgradeSpeed('st_form', 0, `p5-${sim.state.tick}`).ok },
      { label: 'Sleeve dispenser (equipment 1)', buy: () => sim.upgradeEquipment('st_pack', 0, `p6-${sim.state.tick}`).ok },
      { label: 'Second forming position + assembler', buy: () => stationOffers(sim, 'st_form').find((o) => o.kind === 'buildHire')?.run(`p7-${sim.state.tick}`).ok ?? false },
      { label: 'Hire counter hand (Dex)', buy: () => sim.hire('C1', `p8-${sim.state.tick}`).ok },
      { label: 'Open adjoining workshop', buy: () => annexOffer(sim)?.run(`p9-${sim.state.tick}`).ok ?? false },
      { label: 'Staff workshop bench', buy: () => sim.hire('F3', `p10-${sim.state.tick}`).ok },
      { label: 'Staff workshop table', buy: () => sim.hire('P3', `p11-${sim.state.tick}`).ok }
    ];
    const rows: { label: string; t: number; cashAfter: number; sold: number }[] = [];
    let i = 0;
    const limit = 45 * 60 * 30; // 45 simulated minutes
    for (let tick = 0; tick < limit && i < plan.length; tick++) {
      // Keep a little cash for commissions and restock before spending.
      if (tick % 15 === 0 && sim.state.cash > 10 && plan[i].buy()) {
        rows.push({ label: plan[i].label, t: Math.round(sim.state.time), cashAfter: sim.state.cash, sold: sim.state.counters.sold });
        i++;
      }
      bot.update();
      sim.step();
    }
    const m = sim.state.milestones;
    const report = [
      `first sale at ${m.first_sale}s`,
      ...rows.map((r) => `${String(r.t).padStart(5)}s  ${r.label} (cash after $${r.cashAfter}, ${r.sold} sold)`),
      `final: ${Math.round(sim.state.time)}s, ${sim.state.counters.sold} sold, ${Object.values(sim.state.actors).filter((a) => a.kind === 'worker').length} staff, cash $${sim.state.cash}`
    ].join('\n');
    console.log(report);
    if (i < plan.length) {
      const st = sim.state;
      console.log('STUCK', JSON.stringify({ cash: st.cash, buffers: Object.fromEntries(Object.entries(st.buffers).map(([k, b]) => [k, b.items.length])),
        player: [st.actors.player.state, st.actors.player.x.toFixed(1), st.actors.player.y.toFixed(1), st.actors.player.carrying.map((id) => st.batches[id].type), st.playerHold],
        workers: Object.values(st.actors).filter((a) => a.kind === 'worker').map((a) => `${a.name}:${a.state}:${a.waitReason}`), jobs: Object.values(st.jobs).map((j) => [j.kind, j.laneId, j.actorId, j.progress.toFixed(2)]), order: st.order, escrow: st.commissionEscrow }));
    }
    mkdirSync('docs/evidence', { recursive: true });
    writeFileSync('docs/evidence/pacing.txt', `${report}\n`);
    expect(sim.audit()).toEqual([]);
    expect(i).toBe(plan.length);
  });
});

describe('controlled output comparison (equal inputs and demand)', () => {
  it('records finished packages per minute for each upgrade step', () => {
    type Step = { label: string; apply: (sim: Simulation) => void };
    const steps: Step[] = [
      { label: '1 assembler + 1 packer + counter hand', apply: () => undefined },
      { label: '+ packing speed 1 (8.0s → 6.96s)', apply: (s) => { s.upgradeSpeed('st_pack', 0, 'a'); } },
      { label: '+ second packing table, staffed', apply: (s) => { s.upgradeSpeed('st_pack', 0, 'a'); s.buildLaneAndHire('P2', 'b'); } },
      { label: '+ second forming position, staffed', apply: (s) => { s.upgradeSpeed('st_pack', 0, 'a'); s.buildLaneAndHire('P2', 'b'); s.buildLaneAndHire('F2', 'c'); } },
      { label: '+ sleeve dispenser (equipment 1)', apply: (s) => { s.upgradeSpeed('st_pack', 0, 'a'); s.buildLaneAndHire('P2', 'b'); s.buildLaneAndHire('F2', 'c'); s.upgradeEquipment('st_pack', 0, 'd'); } }
    ];
    const lines: string[] = [];
    const rates: number[] = [];
    for (const step of steps) {
      const sim = new Simulation(createInitialState(11));
      sim.state.cash = 5000;
      sim.player().x = 16.5; sim.player().y = 10.5; // out of the way; the player does not work
      sim.upgradeShelving('backroom', 0, 's1'); sim.upgradeShelving('backroom', 1, 's2');
      sim.hire('F1', 'h1'); sim.hire('P1', 'h2'); sim.hire('C1', 'h3');
      step.apply(sim);
      sim.run(30); // arrivals + warm-up
      const f0 = sim.state.counters.produced.finished;
      for (let t = 0; t < 300; t++) {
        sim.run(1);
        if (!sim.supplierBusy() && sim.restockCapacity() >= 8) sim.restock(8, `r${t}`);
      }
      expect(sim.audit()).toEqual([]);
      const perMin = ((sim.state.counters.produced.finished - f0) / 300) * 60;
      rates.push(perMin);
      lines.push(`${perMin.toFixed(1).padStart(5)}/min  ${step.label}`);
    }
    console.log(lines.join('\n'));
    writeFileSync('docs/evidence/throughput.txt', `Finished packages per minute over 5 simulated minutes, same seed, stock kept topped up, player idle\n${lines.join('\n')}\n`);
    // A second packer helps less than the first because forming caps supply; adding forming lifts it.
    expect(rates[1]).toBeGreaterThan(rates[0]);
    expect(rates[3]).toBeGreaterThan(rates[2] * 1.15);
  });
});
