import { it } from 'vitest';
import { Simulation, createInitialState } from '../src/sim/sim';
import { Bot } from '../src/debug/bot';
import { stockOf } from '../src/sim/rules';
it('dbg', () => {
  const sim = new Simulation(createInitialState(99));
  const autoplay = (sec: number, sellOnly = false) => { const b = new Bot(sim, { restock: true, sellOnly }); for (let i = 0; i < sec * 30; i++) { b.update(); sim.step(); } sim.setInput(0,0); sim.setHold(null); };
  const earn = (c: number) => { let n = 0; while (sim.state.cash < c && n++ < 400) autoplay(5); return n; };
  const log = (l: string) => { const w = Object.values(sim.state.actors).filter(a => a.kind === 'worker').map(a => `${a.name}:${a.state}:${a.waitReason}`).join(' '); console.log(l, Math.round(sim.state.time), '$' + sim.state.cash, 'blank', stockOf(sim.state, 'blank_stock'), 'sl', stockOf(sim.state, 'sleeve'), 'tray', stockOf(sim.state,'prepared'), 'fin', stockOf(sim.state,'finished'), 'carry', sim.player().carrying.map(id => sim.state.batches[id].type).join(','), w); };
  earn(60); sim.hire('F1', 'h'); log('hired');
  sim.run(6); autoplay(60, true); log('after60');
  console.log('n', earn(45)); log('45'); sim.upgradeSpeed('st_pack', 0, 'u');
  console.log('n', earn(90)); log('90'); sim.hire('P1', 'hp');
  console.log('n', earn(245)); log('245');
});
