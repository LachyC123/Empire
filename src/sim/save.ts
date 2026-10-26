// Versioned save envelope: plain data only, integrity checksum, strict validation on load/import.
import { CONTENT_VERSION } from '../content/registry';
import { BUFFERS, LANES, STATIONS } from '../content/slice';
import type { GameState } from './types';

export const SCHEMA_VERSION = 1;
export const BUILD = '0.1.0-m2';

export interface SaveEnvelope {
  format: 'backroom-empire-save';
  schemaVersion: number;
  contentVersion: string;
  build: string;
  worldId: string;
  revision: number;
  simulationTime: number;
  savedAt: string;
  checksum: string;
  state: GameState;
}

export class SaveError extends Error {}

/** FNV-1a 32-bit over the canonical JSON string. Detects corruption, not tampering. */
export function checksum(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

export function makeEnvelope(state: GameState): SaveEnvelope {
  const copy = JSON.parse(JSON.stringify(state)) as GameState;
  copy.input = { x: 0, y: 0 };
  copy.playerHold = null;
  // A held work action never survives a save: the job is stored paused with its progress.
  for (const j of Object.values(copy.jobs)) if (j.actorId === 'player') j.actorId = null;
  return {
    format: 'backroom-empire-save',
    schemaVersion: SCHEMA_VERSION,
    contentVersion: CONTENT_VERSION,
    build: BUILD,
    worldId: copy.worldId,
    revision: copy.revision,
    simulationTime: copy.time,
    savedAt: new Date().toISOString(),
    checksum: checksum(JSON.stringify(copy)),
    state: copy
  };
}

const isInt = (v: unknown) => typeof v === 'number' && Number.isInteger(v) && v >= 0;
const isFin = (v: unknown) => typeof v === 'number' && Number.isFinite(v);

/** Validate an envelope (from storage or an imported file) and return a safe state copy. */
export function readEnvelope(raw: unknown): GameState {
  if (!raw || typeof raw !== 'object') throw new SaveError('Not a save file');
  const env = raw as Partial<SaveEnvelope>;
  if (env.format !== 'backroom-empire-save') throw new SaveError('Not a BACKROOM EMPIRE save');
  if (typeof env.schemaVersion !== 'number') throw new SaveError('Missing schema version');
  if (env.schemaVersion > SCHEMA_VERSION) throw new SaveError(`This save is from a newer version (schema ${env.schemaVersion}); update the game to load it`);
  if (env.schemaVersion < 1) throw new SaveError('Unsupported old save version');
  const st = env.state as GameState | undefined;
  if (!st || typeof st !== 'object') throw new SaveError('Save has no state');
  if (checksum(JSON.stringify(st)) !== env.checksum) throw new SaveError('Save checksum mismatch — file is damaged');

  const errs: string[] = [];
  if (!isInt(st.cash)) errs.push('cash');
  if (!isInt(st.commissionEscrow)) errs.push('escrow');
  if (!isFin(st.time) || st.time < 0) errs.push('time');
  for (const b of BUFFERS) if (!st.buffers?.[b.id] || !Array.isArray(st.buffers[b.id].items)) errs.push(`buffer ${b.id}`);
  for (const l of LANES) if (!st.lanes?.[l.id]) errs.push(`lane ${l.id}`);
  for (const s of STATIONS) {
    const x = st.stations?.[s.id];
    if (!x || !isInt(x.speedRank) || !isInt(x.equipTier)) errs.push(`station ${s.id}`);
  }
  const types = new Set(['blank_stock', 'sleeve', 'prepared', 'finished']);
  for (const [id, b] of Object.entries(st.batches ?? {})) {
    if (b.id !== id || !types.has(b.type) || !isInt(b.qty)) errs.push(`batch ${id}`);
    if (b.loc?.k === 'buffer' && !st.buffers[b.loc.id]) errs.push(`batch ${id} buffer`);
    if (b.loc?.k === 'actor' && !st.actors?.[b.loc.id]) errs.push(`batch ${id} actor`);
    if (b.loc?.k === 'lane' && !st.lanes[b.loc.id]) errs.push(`batch ${id} lane`);
  }
  for (const [id, j] of Object.entries(st.jobs ?? {})) {
    if (j.id !== id || !isFin(j.progress) || j.progress < 0 || j.progress > 1.0001) errs.push(`job ${id}`);
    if (j.laneId && !st.lanes[j.laneId]) errs.push(`job ${id} lane`);
  }
  for (const [id, a] of Object.entries(st.actors ?? {})) {
    if (a.id !== id || !isFin(a.x) || !isFin(a.y)) errs.push(`actor ${id}`);
    if (a.laneId && !st.lanes[a.laneId]) errs.push(`actor ${id} lane`);
  }
  if (!st.actors?.player) errs.push('player');
  if (errs.length) throw new SaveError(`Save failed validation: ${errs.slice(0, 5).join(', ')}`);
  return JSON.parse(JSON.stringify(st)) as GameState;
}
