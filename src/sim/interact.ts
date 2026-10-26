// Contextual interaction: what the player can do right now, where they stand.
import { BUFFERS, DIVIDER_OPENING, DIVIDER_X, LANES, PLAYER_CARRY as PLAYER_CARRY_LIMIT, STREET_DOOR, type ItemType } from '../content/slice';
import { RECIPES, bufferDef, bufferSpace, distToRect, laneDef, laneKind, propertyOwned, stationDef, unclaimed } from './rules';
import type { Simulation } from './sim';


export type PanelRef =
  | { kind: 'station'; id: string }
  | { kind: 'supplies'; bufferId: string }
  | { kind: 'storage'; bufferId: string }
  | { kind: 'door' }
  | { kind: 'annex' };

export interface Context {
  /** Highlight rectangle in tile units. */
  rect: { x: number; y: number; w: number; h: number };
  label: string;
  /** Primary action: hold (continuous work), tap (instant command) or panel (open management). */
  action: { type: 'hold'; target: string; verb: string } | { type: 'tap'; target: string; verb: string } | { type: 'panel'; verb: string } | null;
  panel: PanelRef | null;
  hint?: string;
}

const ITEM_NAME: Record<ItemType, string> = { blank_stock: 'blank', sleeve: 'sleeve', prepared: 'prepared piece', finished: 'package' };
export const itemName = (t: ItemType) => ITEM_NAME[t];

const RANGE = 1.0;

export function contexts(sim: Simulation): Context[] {
  const s = sim.state;
  const p = s.actors.player;
  if (p.state !== 'free') return [];
  const out: (Context & { d: number; pri: number })[] = [];
  const carried = p.carrying.map((id) => s.batches[id].type);

  for (const l of LANES) {
    const lane = s.lanes[l.id];
    const st = stationDef(l.station);
    if (!propertyOwned(s, st.property)) continue;
    const d = Math.min(distToRect(p.x, p.y, l.rect), Math.hypot(p.x - l.anchor.x, p.y - l.anchor.y));
    if (!lane.built) {
      if (d <= RANGE && LANES.filter((x) => x.station === l.station).every((x) => x.id === l.id || s.lanes[x.id].built || x.builtBy !== l.builtBy))
        out.push({ d, pri: 1, rect: l.rect, label: `Empty spot · ${l.label}`, action: { type: 'panel', verb: 'Build' }, panel: { kind: 'station', id: l.station } });
      continue;
    }
    if (d > RANGE && !(l.id === 'C1' && d <= RANGE + 0.3)) continue;
    const kind = laneKind(l.id);
    const verb = kind === 'form' ? 'Form' : kind === 'pack' ? 'Pack' : 'Hand over';
    const job = lane.jobId ? s.jobs[lane.jobId] : null;
    let action: Context['action'] = { type: 'panel', verb: 'Manage' };
    let hint: string | undefined;
    if (job) {
      if (job.actorId === null && job.state === 'working') action = { type: 'hold', target: `lane:${l.id}`, verb: `${verb} (resume)` };
      else if (job.actorId !== 'player') hint = `${s.actors[job.actorId!]?.name ?? 'Someone'} is using this position`;
      else action = { type: 'hold', target: `lane:${l.id}`, verb };
    } else {
      const need = [...RECIPES[kind].inputs];
      const have = [...carried];
      const missing = need.filter((t) => { const i = have.indexOf(t); if (i >= 0) { have.splice(i, 1); return false; } return true; });
      const orderOk = kind !== 'counter' || (!!s.order && s.order.delivered + s.order.reserved < s.order.qty);
      if (!missing.length && orderOk) action = { type: 'hold', target: `lane:${l.id}`, verb };
      else if (kind === 'counter' && !missing.length) hint = 'Waiting for the next buyer';
      else hint = `Needs ${missing.map((t) => ITEM_NAME[t]).join(' + ')}`;
    }
    const name = l.id === 'C1' ? 'Handover hatch' : st.name;
    out.push({ d, pri: action?.type === 'hold' ? 0 : 3, rect: l.rect, label: name, action, panel: { kind: 'station', id: l.station }, hint });
  }

  for (const b of BUFFERS) {
    if (!propertyOwned(s, b.property)) continue;
    const d = distToRect(p.x, p.y, b.rect);
    if (d > RANGE) continue;
    const def = bufferDef(b.id);
    const isSupply = def.accepts === 'blank_stock' || def.accepts === 'sleeve';
    const panel: PanelRef = isSupply ? { kind: 'supplies', bufferId: b.id } : { kind: 'storage', bufferId: b.id };
    const carriedMatch = carried.includes(def.accepts);
    const label = `${def.label} · ${s.buffers[b.id].items.length}`;
    if (carriedMatch && bufferSpace(s, b.id) > 0)
      out.push({ d, pri: 1, rect: b.rect, label, action: { type: 'tap', target: `buffer:${b.id}`, verb: `Put down ${ITEM_NAME[def.accepts]}` }, panel });
    else if (carried.length < PLAYER_CARRY_LIMIT && unclaimed(s, b.id).length > 0)
      out.push({ d, pri: 2, rect: b.rect, label, action: { type: 'tap', target: `buffer:${b.id}`, verb: `Take ${ITEM_NAME[def.accepts]}` }, panel });
    else
      out.push({ d, pri: 4, rect: b.rect, label, action: { type: 'panel', verb: isSupply ? 'Restock' : 'Manage' }, panel,
        hint: carried.length >= PLAYER_CARRY_LIMIT ? 'Hands full' : unclaimed(s, b.id).length === 0 ? 'Empty' : undefined });
  }

  const door = { x: STREET_DOOR.x, y: STREET_DOOR.y - 1, w: 1, h: 2 };
  const dd = distToRect(p.x, p.y, door);
  if (dd <= 0.6) {
    out.push({ d: dd, pri: carried.length ? 5 : 2, rect: { x: STREET_DOOR.x, y: STREET_DOOR.y, w: 1, h: 1 }, label: 'Street door',
      action: carried.length ? { type: 'panel', verb: 'Errand' } : { type: 'tap', target: 'errand', verb: 'Run errand +$8' },
      panel: { kind: 'door' }, hint: carried.length ? 'Put things down before leaving' : undefined });
  }

  if (!s.unlocked.includes('annex')) {
    const r = { x: DIVIDER_X, y: DIVIDER_OPENING[0], w: 1, h: DIVIDER_OPENING.length };
    const d = distToRect(p.x, p.y, r);
    if (d <= 0.8) out.push({ d, pri: 2, rect: r, label: 'Boarded doorway', action: { type: 'panel', verb: 'Look' }, panel: { kind: 'annex' } });
  }

  out.sort((a, b) => a.pri - b.pri || a.d - b.d);
  return out;
}

export function laneLabel(id: string) {
  return laneDef(id).label;
}
