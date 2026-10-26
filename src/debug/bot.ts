// Test harness only (exposed with ?debug): a helper that plays the player's part using the same
// commands as the controls — it steers with movement input through real collision, picks up,
// holds to work and hands over. Used by browser checks to reach later states quickly.
import { LANES, STREET_DOOR } from '../content/slice';
import { findPath, tileOf } from '../sim/grid';
import { distToRect, laneDef, stockOf, unclaimed, bufferDef } from '../sim/rules';
import type { Simulation } from '../sim/sim';

type Goal = { kind: 'buffer'; id: string } | { kind: 'lane'; id: string } | { kind: 'door' } | { kind: 'wait' };

export class Bot {
  private n = 0;
  constructor(private sim: Simulation, private opts: { restock: boolean; sellOnly?: boolean } = { restock: true }) {}

  private carrying(t: string) {
    const s = this.sim.state;
    return s.actors.player.carrying.filter((id) => s.batches[id].type === t).length;
  }

  private pickBuffer(type: 'blank_stock' | 'sleeve' | 'prepared' | 'finished'): string | null {
    const s = this.sim.state;
    const ids = Object.keys(s.buffers).filter((id) => bufferDef(id).accepts === type && (bufferDef(id).property === 'backroom' || s.unlocked.includes(bufferDef(id).property)) && unclaimed(s, id).length > 0);
    return ids[0] ?? null;
  }

  private freeLane(kind: 'F' | 'P'): string | null {
    const s = this.sim.state;
    const ids = LANES.filter((l) => l.id.startsWith(kind) && s.lanes[l.id].built && !s.lanes[l.id].workerId).map((l) => l.id);
    return ids.find((id) => !s.lanes[id].jobId || s.jobs[s.lanes[id].jobId!].actorId === null) ?? null;
  }

  private decide(): Goal {
    const s = this.sim.state;
    const o = s.order;
    const orderOpen = !!o && o.delivered + o.reserved < o.qty;
    const loader = !!s.lanes.C1.workerId;
    // Finish any paused hand job first (it already holds its inputs).
    const paused = LANES.find((l) => { const j = s.lanes[l.id].jobId ? s.jobs[s.lanes[l.id].jobId!] : null; return j && j.actorId === null && j.state === 'working' && !s.lanes[l.id].workerId; });
    if (paused) return { kind: 'lane', id: paused.id };
    // Never get stuck with full hands: return a spare blank before fetching anything else.
    if (this.carrying('blank_stock') && s.actors.player.carrying.length > 1) return { kind: 'buffer', id: 'buf_blank' };
    if (this.carrying('finished')) return orderOpen && !loader ? { kind: 'lane', id: 'C1' } : { kind: 'buffer', id: 'buf_finished' };
    if (this.carrying('prepared') && this.carrying('sleeve')) { const l = this.freeLane('P'); return l ? { kind: 'lane', id: l } : { kind: 'buffer', id: 'buf_tray' }; }
    if (this.carrying('prepared')) return { kind: 'buffer', id: this.pickBuffer('sleeve') ?? 'buf_tray' };
    if (this.carrying('blank_stock')) { const l = this.freeLane('F'); return l ? { kind: 'lane', id: l } : { kind: 'buffer', id: 'buf_blank' }; }
    if (!loader && orderOpen && this.pickBuffer('finished')) return { kind: 'buffer', id: this.pickBuffer('finished')! };
    if (this.freeLane('P') && this.pickBuffer('prepared') && stockOf(s, 'sleeve') > 0) return { kind: 'buffer', id: this.pickBuffer('prepared')! };
    if (!this.opts.sellOnly && this.freeLane('F') && this.pickBuffer('blank_stock')) return { kind: 'buffer', id: this.pickBuffer('blank_stock')! };
    if (s.cash < 5 && (stockOf(s, 'blank_stock') === 0 || stockOf(s, 'sleeve') === 0) && stockOf(s, 'finished') === 0 && !s.actors.player.carrying.length) return { kind: 'door' };
    return { kind: 'wait' };
  }

  /** One decision + steering update; call once per simulation step. */
  update() {
    const sim = this.sim;
    const s = sim.state;
    const p = s.actors.player;
    this.n++;
    // Restock like a careful player: when low, a modest bundle, keeping a cash reserve for commissions.
    if (this.opts.restock && this.n % 30 === 0 && !sim.supplierBusy() && (stockOf(s, 'blank_stock') <= 4 || stockOf(s, 'sleeve') <= 2)) {
      const pairs = Math.min(sim.restockCapacity(), 8, Math.floor((s.cash - 3) / 5));
      const urgent = stockOf(s, 'blank_stock') === 0 || stockOf(s, 'sleeve') === 0;
      if (pairs > 0 && (urgent || pairs >= Math.min(4, sim.restockCapacity()))) sim.restock(pairs, `bot-r-${s.tick}`);
    }
    if (p.state !== 'free') return;
    if (s.playerHold) {
      const lane = s.lanes[s.playerHold.slice(5)];
      if (lane.jobId || this.decide().kind === 'lane') return; // keep holding while work continues
      sim.setHold(null);
    }
    const g = this.decide();
    let rect: { x: number; y: number; w: number; h: number } | null = null;
    let stand: { x: number; y: number } | null = null;
    if (g.kind === 'buffer') { rect = bufferDef(g.id).rect; stand = sim.accessPoint(g.id, p); }
    if (g.kind === 'lane') { rect = laneDef(g.id).rect; stand = laneDef(g.id).anchor; }
    if (g.kind === 'door') { rect = { x: STREET_DOOR.x, y: STREET_DOOR.y - 1, w: 1, h: 2 }; stand = { x: STREET_DOOR.x + 0.5, y: STREET_DOOR.y - 0.5 }; }
    if (!rect || !stand) { sim.setInput(0, 0); return; }
    const inRange = g.kind === 'door' ? Math.hypot(p.x - stand.x, p.y - stand.y) < 0.6 : distToRect(p.x, p.y, rect) <= 0.9 && Math.hypot(p.x - stand.x, p.y - stand.y) < 0.9;
    if (inRange) {
      sim.setInput(0, 0);
      if (g.kind === 'buffer') sim.interact(`buffer:${g.id}`, `bot-${s.tick}`);
      if (g.kind === 'lane') sim.setHold(`lane:${g.id}`);
      if (g.kind === 'door') sim.errand(`bot-e-${s.tick}`);
      return;
    }
    // Steer along an A* path using ordinary movement input.
    const path = findPath(sim.solid(), tileOf(p.x, p.y), tileOf(stand.x, stand.y));
    const next = path && path.length > 1 ? { x: path[0].x + 0.5, y: path[0].y + 0.5 } : stand;
    const dx = next.x - p.x, dy = next.y - p.y;
    const d = Math.hypot(dx, dy);
    sim.setInput(d > 0.05 ? dx / d : 0, d > 0.05 ? dy / d : 0);
  }
}
