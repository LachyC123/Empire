import { describe, expect, it } from 'vitest';
import { Simulation, createInitialState } from '../src/sim/sim';
import { Bot } from '../src/debug/bot';
import { txn } from './helpers';

describe('test bot (harness) plays the manual loop through real movement', () => {
  it('reaches the first hire from a fresh start without cheats', () => {
    const sim = new Simulation(createInitialState(3));
    const bot = new Bot(sim, { restock: true });
    let t = 0;
    while (sim.state.cash < 60 && t < 30 * 240) { bot.update(); sim.step(); t++; }
    expect(sim.state.cash).toBeGreaterThanOrEqual(60);
    expect(sim.audit()).toEqual([]);
    console.log('seconds to $60 by hand (bot):', (t / 30).toFixed(1), 'orders', sim.state.counters.ordersSettled);
    expect(sim.hire('F1', txn()).ok).toBe(true);
  });
});
