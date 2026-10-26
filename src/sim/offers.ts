// Purchase offers shown on contextual panels: exact price, the next useful benefit and why
// something is unavailable. Every offer maps to exactly one authoritative command.
import { node } from '../content/registry';
import { LANES, SLICE_MAX_RANK, SUPPLY_PAIR_PRICE, type PropertyId } from '../content/slice';
import { fmtRate, fmtSeconds, lineReport } from './diagnostics';
import {
  bufferCapacity, cycleAfterEquipment, cycleAfterSpeed, cycleSeconds, hireCost, rankOf, roleForLane, stationDef
} from './rules';
import type { Simulation } from './sim';
import type { CommandResult } from './types';

export type OfferKind = 'hire' | 'speed' | 'equipment' | 'build' | 'buildHire' | 'shelving' | 'annex' | 'restock';

export interface Offer {
  key: string;
  kind: OfferKind;
  title: string;
  cost: number;
  benefit: string;
  note?: string;
  available: boolean;
  reason?: string;
  run: (txn: string) => CommandResult;
}

const ROLE_LABEL = { assembler: 'assembler', packer: 'packer', loader: 'counter hand' } as const;

function afford(sim: Simulation, cost: number): string | undefined {
  return sim.state.cash >= cost ? undefined : `Need $${(cost - sim.state.cash).toLocaleString('en-US')} more`;
}

export function stationOffers(sim: Simulation, stationId: string): Offer[] {
  const s = sim.state;
  const def = stationDef(stationId);
  const st = s.stations[stationId];
  const offers: Offer[] = [];
  const unit = def.kind === 'form' ? 'piece' : def.kind === 'pack' ? 'package' : 'handover';
  const line = lineReport(sim);

  // Hire into an existing free position.
  const freeLane = def.lanes.find((l) => s.lanes[l].built && !s.lanes[l].workerId);
  const role = roleForLane(def.lanes[0]);
  const hc = hireCost(s, role);
  if (freeLane && hc !== null) {
    const staffedNow = def.lanes.filter((l) => s.lanes[l].workerId).length;
    offers.push({
      key: `hire:${freeLane}`,
      kind: 'hire',
      title: `Hire ${ROLE_LABEL[role]}`,
      cost: hc,
      benefit: `${staffedNow + 1} worker${staffedNow ? 's' : ''} working · takes over ${LANES.find((l) => l.id === freeLane)!.label.toLowerCase()}`,
      note: def.kind === 'counter' ? '$1 commission per unit handed over' : `$1 commission per completed ${unit}`,
      available: s.cash >= hc,
      reason: afford(sim, hc),
      run: (txn) => sim.hire(freeLane, txn)
    });
  }

  // Build the next physical position (optionally bundled with a hire).
  const nextLane = def.lanes.map((id) => LANES.find((l) => l.id === id)!).find((l) => !s.lanes[l.id].built && l.builtBy);
  if (nextLane && nextLane.builtBy) {
    const n = node(nextLane.builtBy);
    const rank = n.rank;
    const prereqOk = rankOf(s, 'lanes', def.property) === rank - 1;
    const inSlice = rank <= SLICE_MAX_RANK.lanes;
    if (inSlice) {
      if (!freeLane && hc !== null) {
        const total = n.cashCost + hc;
        offers.push({
          key: `buildHire:${nextLane.id}`,
          kind: 'buildHire',
          title: `Add ${def.kind === 'pack' ? 'packing table' : 'forming position'} + hire ${ROLE_LABEL[role]}`,
          cost: total,
          benefit: `New ${nextLane.label.toLowerCase()} with a worker · capacity ${fmtRate((def.lanes.filter((l) => s.lanes[l].workerId).length * 60) / cycleSeconds(s, stationId))} → ${fmtRate(((def.lanes.filter((l) => s.lanes[l].workerId).length + 1) * 60) / cycleSeconds(s, stationId))}/min`,
          note: `$${n.cashCost} position + $${hc} hire`,
          available: prereqOk && s.cash >= total,
          reason: !prereqOk ? 'Build the earlier position first' : afford(sim, total),
          run: (txn) => sim.buildLaneAndHire(nextLane.id, txn)
        });
      }
      offers.push({
        key: `build:${nextLane.id}`,
        kind: 'build',
        title: `Build ${nextLane.label.toLowerCase()}`,
        cost: n.cashCost,
        benefit: `${n.effect} — a real new work spot you or a hire can use`,
        available: prereqOk && s.cash >= n.cashCost,
        reason: !prereqOk ? 'Build the earlier position first' : afford(sim, n.cashCost),
        run: (txn) => sim.buildLane(nextLane.id, txn)
      });
    }
  }

  // Speed (station-scoped rhythm ranks).
  if (def.speedBranch) {
    const next = st.speedRank + 1;
    if (next <= SLICE_MAX_RANK[def.speedBranch]) {
      const n = node(`${def.speedBranch}_${next}`);
      const after = cycleAfterSpeed(s, stationId)!;
      const now = cycleSeconds(s, stationId);
      let note: string | undefined;
      const stage = line.stages.find((x) => x.kind === def.kind)!;
      const upstream = def.kind === 'pack' ? line.stages[0] : null;
      if (upstream && upstream.staffed > 0 && stage.staffed > 0 && upstream.capacity < stage.capacity) note = `Extra speed will wait for forming (${fmtRate(upstream.capacity)}/min supplied)`;
      offers.push({
        key: `speed:${stationId}`,
        kind: 'speed',
        title: `Upgrade ${def.kind === 'form' ? 'forming' : 'packing'} speed`,
        cost: n.cashCost,
        benefit: `${fmtSeconds(now)} → ${fmtSeconds(after)} per ${unit} · ${n.effect}`,
        note,
        available: s.cash >= n.cashCost,
        reason: afford(sim, n.cashCost),
        run: (txn) => sim.upgradeSpeed(stationId, st.speedRank, txn)
      });
    }
  }

  // Equipment tier.
  if (def.equipmentBranch) {
    const next = st.equipTier + 1;
    if (next <= SLICE_MAX_RANK.equipment) {
      const n = node(`${def.equipmentBranch}_${next}`);
      offers.push({
        key: `equip:${stationId}`,
        kind: 'equipment',
        title: next === 1 ? 'Install sleeve dispenser' : 'Install motorised sealer',
        cost: n.cashCost,
        benefit: `${n.effect} · ${fmtSeconds(cycleSeconds(s, stationId))} → ${fmtSeconds(cycleAfterEquipment(s, stationId)!)} per ${unit}`,
        note: 'New table equipment on every packing position here',
        available: s.cash >= n.cashCost,
        reason: afford(sim, n.cashCost),
        run: (txn) => sim.upgradeEquipment(stationId, st.equipTier, txn)
      });
    }
  }
  return offers;
}

export function shelvingOffer(sim: Simulation, property: PropertyId, bufferId: string): Offer | null {
  const s = sim.state;
  const r = rankOf(s, 'shelving', property);
  if (r + 1 > SLICE_MAX_RANK.shelving) return null;
  const n = node(`shelving_${r + 1}`);
  return {
    key: `shelving:${property}`,
    kind: 'shelving',
    title: 'Bigger shelves',
    cost: n.cashCost,
    benefit: `Holds ${bufferCapacity(s, bufferId)} → ${Number(n.mechanic.units)} per shelf/rack in this room`,
    available: s.cash >= n.cashCost,
    reason: afford(sim, n.cashCost),
    run: (txn) => sim.upgradeShelving(property, r, txn)
  };
}

export function restockOffers(sim: Simulation): Offer[] {
  const s = sim.state;
  const cap = sim.restockCapacity();
  const busy = sim.supplierBusy();
  const affordable = Math.floor(s.cash / SUPPLY_PAIR_PRICE);
  const out: Offer[] = [];
  const fill = Math.min(cap, affordable);
  const sizes = Array.from(new Set([6, fill].filter((n) => n > 0))).sort((a, b) => a - b);
  for (const n of sizes) {
    const cost = n * SUPPLY_PAIR_PRICE;
    out.push({
      key: `restock:${n}`,
      kind: 'restock',
      title: n === fill && n !== 6 ? `Restock ${n} (fill up)` : `Restock ${n}`,
      cost,
      benefit: `${n} blank stock + ${n} sleeves, carried in by Oren`,
      available: !busy && n <= cap && s.cash >= cost,
      reason: busy ? 'Oren is on the way' : n > cap ? `Only room for ${cap}` : afford(sim, cost),
      run: (txn) => sim.restock(n, txn)
    });
  }
  if (!out.length) {
    out.push({
      key: 'restock:none', kind: 'restock', title: 'Restock', cost: SUPPLY_PAIR_PRICE,
      benefit: '1 blank stock + 1 sleeve per $5', available: false,
      reason: busy ? 'Oren is on the way' : cap === 0 ? 'Shelves are full' : 'Need $5 — run an errand at the street door',
      run: (txn) => sim.restock(1, txn)
    });
  }
  return out;
}

export function annexOffer(sim: Simulation): Offer | null {
  const s = sim.state;
  if (s.unlocked.includes('annex')) return null;
  const n = node('property_1');
  const req = sim.annexRequirements();
  const missing = req.filter((r) => !r.met);
  return {
    key: 'annex',
    kind: 'annex',
    title: 'Open the adjoining workshop',
    cost: n.cashCost,
    benefit: 'A second room with its own forming bench, packing table and shelves',
    note: req.map((r) => `${r.met ? '✓' : '○'} ${r.label}`).join(' · '),
    available: !missing.length && s.cash >= n.cashCost,
    reason: missing.length ? `Requires: ${missing[0].label}` : afford(sim, n.cashCost),
    run: (txn) => sim.unlockAnnex(txn)
  };
}
