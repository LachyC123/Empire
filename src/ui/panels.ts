// Panel view-models: what a contextual panel shows for a station, shelf, door or the whole line.
import { BUFFERS, DIVIDER_OPENING, DIVIDER_X, LANES, SLICE_MAX_RANK, STATIONS, STREET_DOOR, type ItemType } from '../content/slice';
import { fmtRate, fmtSeconds, lineReport, stationReport } from '../sim/diagnostics';
import { annexOffer, restockOffers, shelvingOffer, stationOffers, type Offer } from '../sim/offers';
import { bufferCapacity, bufferDef, buffersFor, propertyOwned, stationDef, stockOf } from '../sim/rules';
import type { PanelRef } from '../sim/interact';
import type { Simulation } from '../sim/sim';

export interface PanelModel {
  title: string;
  subtitle?: string;
  stats: { key: string; label: string; value: string }[];
  status?: { text: string; ok: boolean };
  lanes?: { key: string; title: string; activity: string; progress: number | null }[];
  offers: Offer[];
  extraHtml?: string;
}

const EQUIP_NAME = ['Rough table', 'Sleeve dispenser + lever press', 'Motorised sealer + belt'];
const ITEM_LABEL: Record<ItemType, string> = { blank_stock: 'Blank stock', sleeve: 'Sleeves', prepared: 'Prepared pieces', finished: 'Finished packages' };

export function panelModel(sim: Simulation, ref: PanelRef | { kind: 'line' }): PanelModel {
  switch (ref.kind) {
    case 'station': return stationPanel(sim, ref.id);
    case 'supplies': return suppliesPanel(sim, ref.bufferId);
    case 'storage': return storagePanel(sim, ref.bufferId);
    case 'door': return doorPanel(sim);
    case 'annex': return annexPanel(sim);
    case 'line': return linePanel(sim);
  }
}

function stationPanel(sim: Simulation, id: string): PanelModel {
  const s = sim.state;
  const def = stationDef(id);
  const r = stationReport(s, id);
  const st = s.stations[id];
  const unit = def.kind === 'form' ? 'piece' : def.kind === 'pack' ? 'package' : 'handover';
  const stats: PanelModel['stats'] = [
    { key: 'cycle', label: 'Work time', value: `${fmtSeconds(r.cycle)} per ${unit}` },
    { key: 'pos', label: 'Positions', value: `${r.staffed} staffed / ${r.positions} built` },
    { key: 'rate', label: 'Output', value: r.staffed === 0
      ? `${r.actualPerMin === null ? '—' : `${fmtRate(r.actualPerMin)}/min`} by hand · hire to automate`
      : `${r.actualPerMin === null ? '—' : fmtRate(r.actualPerMin)}/min actual · ${fmtRate(r.capacityPerMin)}/min if never waiting` }
  ];
  if (def.speedBranch) stats.push({ key: 'rank', label: 'Rhythm', value: `Level ${st.speedRank} of ${SLICE_MAX_RANK[def.speedBranch]}` });
  if (def.equipmentBranch) stats.push({ key: 'equip', label: 'Equipment', value: EQUIP_NAME[st.equipTier] ?? `Tier ${st.equipTier}` });
  if (def.kind === 'counter') {
    const o = s.order;
    stats.push({ key: 'order', label: 'Buyer', value: o ? `${o.buyer} wants ${o.qty} · ${o.delivered} handed over · $${o.qty * o.unitPrice} on completion` : 'Next buyer arriving…' });
  }
  const status = r.primaryBlock ? { text: r.primaryBlock, ok: false } : r.staffed ? { text: 'Working normally', ok: true } : undefined;
  return {
    title: def.name,
    subtitle: def.property === 'annex' ? 'Adjoining workshop' : 'Backroom',
    stats,
    status,
    lanes: r.lanes.filter((l) => l.built).map((l) => ({ key: l.id, title: `${l.label}${l.worker ? ` · ${l.worker}` : ''}`, activity: l.activity, progress: l.progress })),
    offers: stationOffers(sim, id),
    extraHtml: def.kind === 'counter'
      ? '<p class="note">Cash arrives when a buyer’s whole order is handed over. A counter hand fetches packages from the nearest rack and serves the hatch.</p>'
      : `<p class="note">Workers fetch inputs from the nearest shelf, work here, and carry output to the nearest ${def.kind === 'form' ? 'tray' : 'rack'}. Commission is $1 per completed ${unit}, reserved when a task starts — idle workers cost nothing.</p>`
  };
}

function suppliesPanel(sim: Simulation, bufferId: string): PanelModel {
  const s = sim.state;
  const def = bufferDef(bufferId);
  const busy = sim.supplierBusy();
  const line = (t: ItemType) => {
    const bufs = buffersFor(s, t);
    const cap = bufs.reduce((n, b) => n + bufferCapacity(s, b.id), 0);
    return `${stockOf(s, t)} / ${cap}`;
  };
  const offers = [...restockOffers(sim)];
  const sh = shelvingOffer(sim, def.property, bufferId);
  if (sh) offers.push(sh);
  return {
    title: 'Supplies',
    subtitle: def.label,
    stats: [
      { key: 'blank', label: 'Blank stock', value: line('blank_stock') },
      { key: 'sleeve', label: 'Sleeves', value: line('sleeve') },
      { key: 'oren', label: 'Oren', value: busy ? 'Carrying a delivery in now' : 'Ready to deliver' }
    ],
    status: stockOf(s, 'blank_stock') === 0 ? { text: 'Out of blank stock — forming has stopped', ok: false } : undefined,
    offers,
    extraHtml: '<p class="note">One Nightglass needs 1 blank ($4) + 1 sleeve ($1). You pay once when you order; Oren carries the stock in through the back door.</p>'
  };
}

function storagePanel(sim: Simulation, bufferId: string): PanelModel {
  const s = sim.state;
  const def = bufferDef(bufferId);
  const offers: Offer[] = [];
  const sh = shelvingOffer(sim, def.property, bufferId);
  if (sh) offers.push(sh);
  const reserved = s.buffers[bufferId].items.filter((id) => s.batches[id].claim).length;
  return {
    title: def.label,
    subtitle: ITEM_LABEL[def.accepts],
    stats: [
      { key: 'n', label: 'Holding', value: `${s.buffers[bufferId].items.length} / ${bufferCapacity(s, bufferId)}` },
      { key: 'res', label: 'Reserved', value: `${reserved} claimed by workers · ${s.buffers[bufferId].reservedIn} on the way in` }
    ],
    status: s.buffers[bufferId].items.length + s.buffers[bufferId].reservedIn >= bufferCapacity(s, bufferId) ? { text: 'Full — upstream work pauses until space frees', ok: false } : undefined,
    offers,
    extraHtml: '<p class="note">Finished goods are not money yet — they become cash when a buyer’s order is handed over.</p>'
  };
}

function doorPanel(sim: Simulation): PanelModel {
  const p = sim.player();
  return {
    title: 'Street door',
    subtitle: 'Bellwater, raining',
    stats: [],
    offers: [{
      key: 'errand', kind: 'restock', title: 'Run a neighbourhood errand', cost: 0, benefit: '+$8 after 20 seconds away. Always available — your safety net if cash and stock run out.',
      available: p.carrying.length === 0 && p.state === 'free', reason: p.carrying.length ? 'Put down what you are carrying first' : undefined,
      run: (txn) => sim.errand(txn)
    }],
    extraHtml: '<p class="note">Production pays better than errands once your line is running.</p>'
  };
}

function annexPanel(sim: Simulation): PanelModel {
  const offer = annexOffer(sim);
  return {
    title: 'Adjoining workshop',
    subtitle: 'Boarded-up room next door',
    stats: [],
    offers: offer ? [offer] : [],
    extraHtml: '<p class="note">Opening it knocks through this doorway and gives you a second forming bench, packing table, shelves and a rack — real new positions to staff.</p>'
  };
}

function linePanel(sim: Simulation): PanelModel {
  const s = sim.state;
  const rep = lineReport(sim);
  const max = Math.max(1, ...rep.stages.map((x) => Math.max(x.capacity, x.actual ?? 0)));
  const staffed = rep.stages.filter((x) => x.staffed > 0);
  const limit = staffed.length ? staffed.reduce((a, b) => (b.capacity < a.capacity ? b : a)) : null;
  const stages = rep.stages.map((x) => `
    <div class="stage ${limit === x ? 'limit' : ''}"><span>${x.label}</span>
      <span class="track"><span class="cap" style="width:${(x.capacity / max) * 100}%"></span><span class="act" style="width:${((x.actual ?? 0) / max) * 100}%"></span></span>
      <span>${x.actual === null ? '—' : fmtRate(x.actual)} / ${fmtRate(x.capacity)}</span></div>`).join('');
  const c = s.counters;
  const net = c.earned - c.spentSupplies - c.commissionsPaid;
  const recent = s.ledger.slice(-8).reverse().map((l) => `<span>${l.note}</span><span class="${l.amount < 0 ? 'neg' : ''}">${l.amount < 0 ? '−' : '+'}$${Math.abs(l.amount)}</span>`).join('');
  return {
    title: 'Production line',
    subtitle: 'Units per minute: actual / staffed capacity',
    stats: [],
    status: { text: rep.advice, ok: false },
    offers: [],
    extraHtml: `${stages}
      <p class="note">Bars: pale = capacity of staffed positions, teal = what actually came out over the last minute. Walking and waiting for inputs make actual lower than capacity.</p>
      <div class="section-title">Money</div>
      <div class="ledger"><span>Sales (gross)</span><span>$${c.earned}</span><span>Supplies bought</span><span class="neg">−$${c.spentSupplies}</span>
      <span>Commissions paid</span><span class="neg">−$${c.commissionsPaid}</span><span><b>Trading profit</b></span><span><b>${net < 0 ? '−' : ''}$${Math.abs(net)}</b></span>
      <span>Invested in hires/upgrades</span><span>$${c.spentHires + c.spentUpgrades}</span><span>Orders completed</span><span>${c.ordersSettled}</span></div>
      <div class="section-title">Recent</div><div class="ledger">${recent || '<span>Nothing yet</span><span></span>'}</div>`
  };
}

/** Which panel a world tap at tile coordinates refers to (sprites extend up from their footprint). */
export function panelAt(sim: Simulation, tx: number, ty: number): PanelRef | null {
  const s = sim.state;
  const inR = (r: { x: number; y: number; w: number; h: number }) => tx >= r.x && tx < r.x + r.w && ty >= r.y - 1 && ty < r.y + r.h;
  for (const a of Object.values(s.actors)) {
    if (a.kind === 'worker' && a.laneId && Math.hypot(a.x - tx, a.y - 0.7 - ty) < 0.7) {
      return { kind: 'station', id: STATIONS.find((x) => x.lanes.includes(a.laneId!))!.id };
    }
  }
  for (const l of LANES) {
    const st = stationDef(l.station);
    if (!propertyOwned(s, st.property)) continue;
    if (inR(l.rect) && (s.lanes[l.id].built || l.builtBy)) return { kind: 'station', id: st.id };
  }
  for (const b of BUFFERS) {
    if (!propertyOwned(s, b.property) || !inR(b.rect)) continue;
    return b.accepts === 'blank_stock' || b.accepts === 'sleeve' ? { kind: 'supplies', bufferId: b.id } : { kind: 'storage', bufferId: b.id };
  }
  if (!s.unlocked.includes('annex') && tx >= DIVIDER_X && tx < DIVIDER_X + 1 && ty >= DIVIDER_OPENING[0] - 0.5 && ty < DIVIDER_OPENING[1] + 1) return { kind: 'annex' };
  if (Math.floor(tx) === STREET_DOOR.x && ty >= STREET_DOOR.y - 1) return { kind: 'door' };
  return null;
}
