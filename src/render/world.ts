// World presentation. Reads authoritative simulation state each frame and draws it; it
// never creates goods or money. Simulation events trigger feedback (particles, sound, labels).
import * as Phaser from 'phaser';
import {
  BACK_DOOR, BUFFERS, DECOR, DIVIDER_OPENING, DIVIDER_X, LANES, MAP_H, MAP_W, STREET_DOOR, TILE, WALL_ART,
  type ItemType
} from '../content/slice';
import { SIM_DT, type Simulation } from '../sim/sim';
import { bufferCapacity, laneKind, stationDef } from '../sim/rules';
import type { Actor, SimEvent } from '../sim/types';
import { ATLAS, frameOf, installTextures } from './textures';
import { noise } from '../art/pixel';

export interface WorldHost {
  sim: Simulation;
  isPaused(): boolean;
  reducedMotion(): boolean;
  highlight(): { x: number; y: number; w: number; h: number } | null;
  onSimEvents(events: SimEvent[]): void;
  onWorldTap(tx: number, ty: number): void;
  onFrame(): void;
}

interface ActorView {
  shadow: Phaser.GameObjects.Image;
  body: Phaser.GameObjects.Sprite;
  items: Phaser.GameObjects.Image[];
  bubble: Phaser.GameObjects.Image;
  px: number; py: number; // previous sim position for interpolation
  anim: string;
  cheerUntil: number;
}

const ITEM_FRAME: Record<ItemType, string> = {
  blank_stock: 'item_blank_stock', sleeve: 'item_sleeve', prepared: 'item_prepared', finished: 'item_finished'
};

const BUBBLE: Record<string, string> = {
  no_blank_stock: 'bubble_box', no_sleeve: 'bubble_box', no_prepared: 'bubble_wait', no_finished: 'bubble_wait',
  output_full: 'bubble_full', need_funds: 'bubble_coin', position_busy: 'bubble_wait', no_order: 'bubble_wait', no_path: 'bubble_excl'
};

export const HUD_CSS_PX = 52;

export class WorldScene extends Phaser.Scene {
  host!: WorldHost;
  private acc = 0;
  private actorViews = new Map<string, ActorView>();
  private bufferItems = new Map<string, Phaser.GameObjects.Image[]>();
  private laneViews = new Map<string, {
    bench: Phaser.GameObjects.Image; pad: Phaser.GameObjects.Image; items: Phaser.GameObjects.Image[]; overlay: Phaser.GameObjects.Image;
    bar: Phaser.GameObjects.Graphics; lever?: Phaser.GameObjects.Image; belt?: Phaser.GameObjects.Image; ind?: Phaser.GameObjects.Image;
    glow?: Phaser.GameObjects.Image; tier: string;
  }>();
  private annexCover!: Phaser.GameObjects.Rectangle;
  private boarded!: Phaser.GameObjects.Image;
  private dividerTiles: Phaser.GameObjects.Image[] = [];
  private streetDoor!: Phaser.GameObjects.Image;
  private backDoor!: Phaser.GameObjects.Image;
  private windows: { img: Phaser.GameObjects.Image; w: number }[] = [];
  private buyer!: Phaser.GameObjects.Sprite;
  private buyerItem!: Phaser.GameObjects.Image;
  private sel: Phaser.GameObjects.Image[] = [];
  private fxPool: Phaser.GameObjects.Image[] = [];
  private rainFrame = 0;
  private rainT = 0;
  private dpr = 1;
  private shownOrder: string | null = null;

  constructor() {
    super('world');
  }

  init(data: { host: WorldHost }) {
    this.host = data.host;
    // Scenes are reused on restart (new game / load): rebuild every view from the new state.
    this.acc = 0;
    this.actorViews = new Map();
    this.bufferItems = new Map();
    this.laneViews = new Map();
    this.dividerTiles = [];
    this.windows = [];
    this.sel = [];
    this.fxPool = [];
    this.prev = new Map();
    this.pendingCheer = new Set();
    this.shownOrder = null;
  }

  create() {
    installTextures(this);
    this.buildStatic();
    this.buildObjects();
    for (let i = 0; i < 4; i++) {
      const c = this.add.image(0, 0, ATLAS, 'sel').setDepth(5000).setVisible(false);
      c.setFlip(i === 1 || i === 2, i >= 2);
      this.sel.push(c);
    }
    this.cameras.main.setBackgroundColor('#120e16');
    this.cameras.main.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
    this.layout();
    this.scale.on('resize', () => this.layout());
    const p = this.host.sim.player();
    this.cameras.main.centerOn(p.x * TILE, p.y * TILE);
  }

  /** Size the camera so the backroom reads clearly at phone landscape sizes. */
  layout() {
    const cam = this.cameras.main;
    const w = this.scale.width, h = this.scale.height;
    this.dpr = Number(this.game.canvas.dataset.dpr ?? 1);
    // Reserve a strip under the HUD so the back wall (shelves, hatch) is never hidden behind it.
    const top = Math.round(HUD_CSS_PX * this.dpr);
    const vh = h - top;
    const zoom = Math.max(1, Math.min(vh / (MAP_H * TILE), w / (20 * TILE), 6 * this.dpr));
    cam.setViewport(0, top, w, vh);
    cam.setZoom(zoom);
  }

  // ---------------------------------------------------------------- static map

  private buildStatic() {
    const annexLocked = !this.host.sim.state.unlocked.includes('annex');
    const img = (x: number, y: number, frame: string, depth = 0) => this.add.image(x, y, ATLAS, frame).setOrigin(0, 0).setDepth(depth);
    const worn = new Set<string>();
    for (let y = 7; y <= 12; y++) worn.add(`${STREET_DOOR.x},${y}`);
    for (let x = 2; x <= 14; x++) worn.add(`${x},7`);
    for (let x = 3; x <= 13; x++) worn.add(`${x},4`);
    for (let y = 0; y < MAP_H; y++)
      for (let x = 0; x < MAP_W; x++) {
        const px = x * TILE, py = y * TILE;
        const inAnnex = x > DIVIDER_X;
        if (y === 0) { img(px, py, 'walltop_bottom'); continue; }
        if (y === MAP_H - 1) {
          if (x === STREET_DOOR.x) continue;
          img(px, py, 'walltop_top', 900);
          continue;
        }
        if (x === 0 || x === MAP_W - 1) { img(px, py, x === 0 ? 'walltop_right' : 'walltop_left', 2); continue; }
        if (x === DIVIDER_X) {
          if (DIVIDER_OPENING.includes(y)) {
            img(px, py, 'floor1');
            const t = img(px, py, 'walltop_none', 2);
            this.dividerTiles.push(t);
            if (!annexLocked) t.setVisible(false);
          } else img(px, py, 'walltop_none', y === 1 ? 0 : 2);
          continue;
        }
        if (y === 1) { img(px, py, `${inAnnex ? 'wallannex' : 'wall'}${Math.floor(noise(x, y, 1) * 3)}`); continue; }
        if (inAnnex) img(px, py, `annex${(x + y) % 2}`);
        else img(px, py, worn.has(`${x},${y}`) && noise(x, y, 5) > 0.3 ? 'floor_worn' : `floor${Math.floor(noise(x, y, 2) * 4)}`);
      }
    // Soft shadow under the back wall for depth.
    const g = this.add.graphics().setDepth(1);
    g.fillStyle(0x000000, 0.22).fillRect(TILE, 2 * TILE, (MAP_W - 2) * TILE, 3);
    g.fillStyle(0x000000, 0.12).fillRect(TILE, 2 * TILE + 3, (MAP_W - 2) * TILE, 3);
    // Doors
    this.add.image(STREET_DOOR.x * TILE, (STREET_DOOR.y - 1) * TILE + 6, ATLAS, 'doormat').setOrigin(0, 0).setDepth(1);
    this.streetDoor = img(STREET_DOOR.x * TILE, STREET_DOOR.y * TILE, 'door_street_closed', 900);
    this.backDoor = this.add.image(BACK_DOOR.x * TILE, BACK_DOOR.y * TILE + 8, ATLAS, 'door_back_closed').setOrigin(0, 0.5).setDepth(3);
    // Wall art
    for (const a of WALL_ART) {
      const x = a.x * TILE, y = TILE;
      if (a.art === 'window') {
        const w = a.w * TILE;
        const im = this.add.image(x, y + 1, ATLAS, `window${w}_0`).setOrigin(0, 0).setDepth(1);
        this.windows.push({ img: im, w });
        this.add.image(x + w / 2, y + 20, 'glow').setDepth(2).setTint(0x7fa7ff).setAlpha(0.16).setScale(w / 40, 0.5).setBlendMode(Phaser.BlendModes.ADD);
      } else if (a.art === 'hatch') {
        this.add.image(x, y + 1, ATLAS, 'hatch_back').setOrigin(0, 0).setDepth(1);
        this.buyer = this.add.sprite(x + 24, y + 30, ATLAS, frameOf(11, 'down_idle0')).setOrigin(0.5, 1).setDepth(1.5).setVisible(false);
        this.buyer.setCrop(0, 0, 24, 16);
        this.add.image(x, y, ATLAS, 'hatch_frame').setOrigin(0, 0).setDepth(2);
        this.add.image(x + 40, y + 9, 'glow').setDepth(2.5).setTint(0xff6f91).setAlpha(0.35).setScale(0.45).setBlendMode(Phaser.BlendModes.ADD);
        this.buyerItem = this.add.image(x + 24, y + 26, ATLAS, 'item_finished').setDepth(60).setVisible(false);
      } else {
        this.add.image(x + (a.w * TILE) / 2, y + 7, ATLAS, a.art).setDepth(1);
      }
    }
    // Annex cover (dark, unrented) and boarded doorway
    this.annexCover = this.add.rectangle((DIVIDER_X + 1) * TILE, 0, (MAP_W - DIVIDER_X - 1) * TILE, MAP_H * TILE, 0x0b0910, 0.86).setOrigin(0, 0).setDepth(950);
    this.boarded = this.add.image(DIVIDER_X * TILE, DIVIDER_OPENING[0] * TILE - 1, ATLAS, 'boarded').setOrigin(0, 0).setDepth(DIVIDER_OPENING[1] * TILE + 16);
    if (!annexLocked) { this.annexCover.setVisible(false); this.boarded.setVisible(false); }
  }

  // ---------------------------------------------------------------- objects

  private buildObjects() {
    const bottomDepth = (r: { y: number; h: number }) => (r.y + r.h) * TILE;
    for (const d of DECOR) {
      const cx = (d.rect.x + d.rect.w / 2) * TILE, by = (d.rect.y + d.rect.h) * TILE;
      this.add.image(cx, by, ATLAS, d.art).setOrigin(0.5, 1).setDepth(bottomDepth(d.rect));
      if (d.art === 'floor_lamp') this.add.image(cx, by - 28, 'glow').setTint(0xffc46b).setAlpha(0.55).setScale(1.6).setBlendMode(Phaser.BlendModes.ADD).setDepth(1000);
      if (d.art === 'desk') this.add.image(cx + 8, by - 18, 'glow').setTint(0xffd27a).setAlpha(0.35).setScale(0.8).setBlendMode(Phaser.BlendModes.ADD).setDepth(1000);
    }
    for (const b of BUFFERS) {
      const cx = (b.rect.x + b.rect.w / 2) * TILE, by = (b.rect.y + b.rect.h) * TILE;
      this.add.image(cx, by, ATLAS, b.art).setOrigin(0.5, 1).setDepth(bottomDepth(b.rect));
      this.bufferItems.set(b.id, []);
    }
    for (const l of LANES) {
      const cx = (l.rect.x + l.rect.w / 2) * TILE, by = (l.rect.y + l.rect.h) * TILE;
      const depth = bottomDepth(l.rect);
      const kind = laneKind(l.id);
      const bench = this.add.image(cx, by, ATLAS, kind === 'counter' ? 'counter' : kind === 'form' ? 'form_1' : 'pack_1').setOrigin(0.5, 1).setDepth(depth);
      const pad = this.add.image(cx, by - 8, ATLAS, 'build_pad').setDepth(3).setAlpha(0.8).setVisible(false);
      const overlay = this.add.image(cx, by - 14, ATLAS, 'item_finished').setDepth(depth + 0.6).setVisible(false);
      const bar = this.add.graphics().setDepth(4000);
      const v = { bench, pad, items: [] as Phaser.GameObjects.Image[], overlay, bar, tier: '' } as ReturnType<WorldScene['laneViews']['get']> & object;
      if (kind === 'pack') {
        v.lever = this.add.image(cx + 11, by - 18, ATLAS, 'lever_up').setDepth(depth + 0.5).setVisible(false);
        v.belt = this.add.image(cx + 3, by - 11, ATLAS, 'belt0').setDepth(depth + 0.4).setVisible(false);
        v.ind = this.add.image(cx + 9, by - 22, ATLAS, 'ind_off').setDepth(depth + 0.5).setVisible(false);
      }
      if (kind === 'form') v.glow = this.add.image(cx + 1, by - 13, 'glow').setTint(0x5ff0d4).setScale(0.35).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD).setDepth(depth + 0.7);
      this.laneViews.set(l.id, v as never);
    }
  }

  // ---------------------------------------------------------------- frame

  update(_time: number, deltaMs: number) {
    const sim = this.host.sim;
    if (!this.host.isPaused()) {
      this.acc += Math.min(deltaMs / 1000, 0.25);
      while (this.acc >= SIM_DT) {
        this.capturePrev();
        sim.step();
        this.acc -= SIM_DT;
      }
      const ev = sim.drainEvents();
      if (ev.length) {
        this.react(ev);
        this.host.onSimEvents(ev);
      }
    }
    const alpha = this.host.isPaused() ? 1 : this.acc / SIM_DT;
    this.syncActors(alpha);
    this.syncBuffers();
    this.syncLanes();
    this.syncWorld(deltaMs);
    this.syncHighlight();
    const p = sim.player();
    const cam = this.cameras.main;
    const tx = p.x * TILE - cam.width / (2 * cam.zoom), ty = p.y * TILE - cam.height / (2 * cam.zoom);
    const k = this.host.reducedMotion() ? 1 : 0.12;
    cam.scrollX += (tx - cam.scrollX) * k;
    cam.scrollY += (ty - cam.scrollY) * k;
    this.host.onFrame();
  }

  private prev = new Map<string, { x: number; y: number }>();
  private capturePrev() {
    for (const a of Object.values(this.host.sim.state.actors)) this.prev.set(a.id, { x: a.x, y: a.y });
  }

  /** Presentation-only offset: workers at a bench stand tucked in behind it so hands meet the worktop. */
  private benchOffset(a: Actor): number {
    for (const l of LANES) {
      const d = Math.hypot(a.x - l.anchor.x, a.y - l.anchor.y);
      if (d < 0.6 && l.anchor.y < 6 && laneKind(l.id) !== 'counter') return (1 - d / 0.6) * 11;
    }
    return 0;
  }

  private syncActors(alpha: number) {
    const s = this.host.sim.state;
    const seen = new Set<string>();
    for (const a of Object.values(s.actors)) {
      seen.add(a.id);
      let v = this.actorViews.get(a.id);
      if (!v) {
        v = {
          shadow: this.add.image(0, 0, ATLAS, 'shadow').setDepth(5),
          body: this.add.sprite(0, 0, ATLAS, frameOf(a.look, 'down_idle0')).setOrigin(0.5, 30 / 32),
          items: [], bubble: this.add.image(0, 0, ATLAS, 'bubble_wait').setVisible(false),
          px: a.x, py: a.y, anim: '', cheerUntil: 0
        };
        this.actorViews.set(a.id, v);
      }
      const pr = this.prev.get(a.id) ?? { x: a.x, y: a.y };
      const x = (pr.x + (a.x - pr.x) * alpha) * TILE;
      const yOff = this.benchOffset(a);
      const y = (pr.y + (a.y - pr.y) * alpha) * TILE + yOff;
      const visible = a.state !== 'away';
      v.body.setVisible(visible).setPosition(Math.round(x), Math.round(y)).setDepth(y + 0.1);
      v.shadow.setVisible(visible && yOff < 4).setPosition(Math.round(x), Math.round(y) - 1);
      this.animateActor(a, v);
      // Carried batches are drawn from the actual tokens in the actor's hands.
      const carried = a.carrying.map((id) => s.batches[id]).filter(Boolean);
      while (v.items.length < carried.length) v.items.push(this.add.image(0, 0, ATLAS, 'item_blank_stock'));
      v.items.forEach((im, i) => {
        const b = carried[i];
        if (!b || !visible) { im.setVisible(false); return; }
        const crate = a.kind === 'supplier';
        im.setVisible(crate ? i === 0 : true).setFrame(crate ? 'item_crate' : ITEM_FRAME[b.type]);
        const side = a.dir === 'left' ? -1 : 1;
        const ox = a.dir === 'left' || a.dir === 'right' ? 6 * side : (i - (carried.length - 1) / 2) * 6;
        const oy = crate ? -13 : a.dir === 'up' ? -14 : -12 - i * 2;
        im.setPosition(Math.round(x + ox), Math.round(y + oy)).setDepth(a.dir === 'up' ? y : y + 0.2);
      });
      // Status bubble: why a worker is waiting.
      const why = a.kind === 'worker' && a.state === 'idle' && a.waitReason ? BUBBLE[a.waitReason] : null;
      const cheering = v.cheerUntil > this.time.now;
      v.bubble.setVisible(!!why || cheering);
      if (cheering) v.bubble.setFrame('bubble_star');
      else if (why) v.bubble.setFrame(why);
      v.bubble.setPosition(Math.round(x + 6), Math.round(y - 34 + Math.sin(this.time.now / 300) * 1)).setDepth(4500);
    }
    // New hires celebrate briefly once they reach their position.
    for (const id of [...this.pendingCheer]) {
      const a = s.actors[id];
      if (!a) { this.pendingCheer.delete(id); continue; }
      if (a.state !== 'arriving') { this.cheer(id, 1400); this.pendingCheer.delete(id); }
    }
    for (const [id, v] of this.actorViews) {
      if (seen.has(id)) continue;
      v.body.destroy(); v.shadow.destroy(); v.bubble.destroy(); v.items.forEach((i) => i.destroy());
      this.actorViews.delete(id);
    }
  }

  private animateActor(a: Actor, v: ActorView) {
    const s = this.host.sim.state;
    const look = a.look;
    let key = '';
    let frame: string | null = null;
    const dirKey = a.dir === 'left' || a.dir === 'right' ? 'side' : a.dir;
    v.body.setFlipX(a.dir === 'left');
    const job = a.jobId ? s.jobs[a.jobId] : Object.values(s.jobs).find((j) => j.actorId === a.id);
    if (v.cheerUntil > this.time.now) key = `${look}_cheer`;
    else if (job && job.state === 'working' && job.actorId === a.id && job.laneId && !a.moving) {
      frame = this.workFrame(job.laneId, job.progress, a.dir === 'up');
    } else if (a.moving) key = `${look}_${a.carrying.length ? 'carry' : 'walk'}_${dirKey}`;
    else if (a.kind === 'worker' && a.state === 'idle' && a.waitReason) key = `${look}_wait`;
    else if (a.carrying.length) frame = `${dirKey}_carry0`;
    else key = `${look}_idle_${dirKey}`;
    if (frame) {
      v.anim = '';
      v.body.anims.stop();
      v.body.setFrame(frameOf(look, frame));
    } else if (key !== v.anim) {
      v.anim = key;
      v.body.play(key);
    }
  }

  /** Work poses follow normalised job progress: faster cycles mean a faster visible cadence. */
  private workFrame(laneId: string, progress: number, fromFront: boolean): string {
    const kind = laneKind(laneId);
    if (fromFront) return Math.floor(progress * 8) % 2 ? 'back_work1' : 'back_work0';
    const beats = kind === 'form' ? ['work_high', 'work_low', 'work_high', 'press', 'inspect', 'work_low'] : kind === 'pack' ? ['reach', 'fold', 'work_low', 'press', 'fold', 'press'] : ['inspect', 'work_high', 'work_high', 'cheer0'];
    return beats[Math.min(beats.length - 1, Math.floor(progress * beats.length))];
  }

  private syncBuffers() {
    const s = this.host.sim.state;
    for (const b of BUFFERS) {
      const items = s.buffers[b.id].items;
      const pool = this.bufferItems.get(b.id)!;
      const cap = bufferCapacity(s, b.id);
      while (pool.length < Math.max(items.length, 0)) pool.push(this.add.image(0, 0, ATLAS, 'item_blank_stock'));
      const cx = (b.rect.x + b.rect.w / 2) * TILE, by = (b.rect.y + b.rect.h) * TILE;
      const depth = by + 0.5;
      const shelf = b.art === 'shelf_blank' || b.art === 'shelf_sleeve';
      const perRow = 4, rows = shelf ? 3 : 2;
      const slots = perRow * rows;
      pool.forEach((im, i) => {
        if (i >= items.length) { im.setVisible(false); return; }
        const bt = s.batches[items[i]];
        const layer = Math.floor(i / slots), k = i % slots;
        const row = Math.floor(k / perRow), col = k % perRow;
        let x: number, y: number;
        if (shelf) { x = cx - 10 + col * 7; y = by - 30 + 6 + row * 9 - layer * 3; }
        else if (b.art === 'tray') { x = cx - 10 + col * 7; y = by - 15 + row * 4 - layer * 3; }
        else { x = cx - 10 + col * 7; y = by - 17 + row * 7 - layer * 3; }
        im.setVisible(true).setFrame(ITEM_FRAME[bt.type]).setPosition(Math.round(x), Math.round(y)).setDepth(depth + row * 0.01 + layer * 0.02);
        im.setAlpha(bt.claim ? 0.55 : 1); // reserved for a worker: shown dimmed, still physically present
      });
      void cap;
    }
  }

  private syncLanes() {
    const s = this.host.sim.state;
    const t = this.time.now;
    for (const l of LANES) {
      const v = this.laneViews.get(l.id)!;
      const lane = s.lanes[l.id];
      const def = stationDef(l.station);
      const owned = def.property === 'backroom' || s.unlocked.includes(def.property);
      const kind = laneKind(l.id);
      const st = s.stations[l.station];
      const tier = kind === 'form' ? (st.speedRank >= 3 ? 'form_2' : 'form_1') : kind === 'pack' ? `pack_${1 + st.equipTier}` : 'counter';
      v.bench.setVisible(lane.built);
      if (tier !== v.tier) {
        if (v.tier && lane.built) this.burst(v.bench.x, v.bench.y - 12, 'p_spark', 14, 0xfff3b0);
        v.tier = tier;
        v.bench.setFrame(tier);
      }
      const nextBuildable = owned && !lane.built && l.builtBy !== null;
      v.pad.setVisible(nextBuildable).setAlpha(0.55 + Math.sin(t / 350) * 0.25);
      const job = lane.jobId ? s.jobs[lane.jobId] : null;
      const working = !!job && job.state === 'working';
      const progress = working ? Math.min(1, job!.progress) : 0;
      // Items physically on the worktop (the batch tokens at this lane).
      const onLane = job ? job.inputIds.filter((id) => s.batches[id]?.loc.k === 'lane') : [];
      while (v.items.length < onLane.length) v.items.push(this.add.image(0, 0, ATLAS, 'item_blank_stock'));
      const surfaceY = v.bench.y - v.bench.height + (tier === 'form_2' || tier === 'pack_2' || tier === 'pack_3' ? 13 : 7);
      v.items.forEach((im, i) => {
        if (i >= onLane.length || !lane.built) { im.setVisible(false); return; }
        const b = s.batches[onLane[i]];
        im.setVisible(true).setFrame(ITEM_FRAME[b.type]).setPosition(Math.round(v.bench.x - 3 + i * 7), Math.round(surfaceY)).setDepth(v.bench.depth + 0.5);
      });
      // Presentation of in-progress transformation (alpha follows progress; output only exists on completion).
      if (working && kind !== 'counter') {
        v.overlay.setVisible(true).setFrame(kind === 'form' ? 'item_prepared' : 'item_finished').setAlpha(progress * 0.9)
          .setPosition(Math.round(v.bench.x - 3), Math.round(surfaceY - 1));
      } else v.overlay.setVisible(false);
      // Progress strip
      v.bar.clear();
      if (working && lane.built) {
        const w = 20, x = v.bench.x - w / 2, y = v.bench.y - v.bench.height - 4 - (kind === 'counter' ? 18 : 22);
        v.bar.fillStyle(0x1e1626, 0.85).fillRect(x - 1, y - 1, w + 2, 4);
        v.bar.fillStyle(job!.actorId === null ? 0xb39f73 : 0x5ff0d4, 1).fillRect(x, y, Math.max(1, Math.round(w * progress)), 2);
      }
      // Equipment motion follows the job's progress.
      if (v.lever) {
        const t2 = st.equipTier;
        v.lever.setVisible(lane.built && t2 === 1);
        const pressPhase = working && (Math.floor(progress * 6) === 3 || Math.floor(progress * 6) === 5);
        v.lever.setFrame(pressPhase ? 'lever_down' : 'lever_up');
        v.belt!.setVisible(lane.built && t2 >= 2).setFrame(`belt${working ? Math.floor(progress * 24) % 4 : 0}`);
        v.ind!.setVisible(lane.built && t2 >= 2).setFrame(working ? 'ind_on' : 'ind_off');
        if (t2 >= 2) v.ind!.setPosition(v.bench.x + 10, v.bench.y - 24);
      }
      if (v.glow) {
        v.glow.setVisible(lane.built);
        v.glow.setAlpha(working ? 0.25 + progress * 0.55 : tier === 'form_2' ? 0.15 : 0);
        v.glow.setPosition(v.bench.x + 1, v.bench.y - (tier === 'form_2' ? 13 : 8));
      }
    }
  }

  private syncWorld(deltaMs: number) {
    const s = this.host.sim.state;
    this.rainT += deltaMs;
    if (this.rainT > 140) {
      this.rainT = 0;
      this.rainFrame = (this.rainFrame + 1) % 4;
      for (const w of this.windows) w.img.setFrame(`window${w.w}_${this.rainFrame}`);
    }
    const near = (tx: number, ty: number) => Object.values(s.actors).some((a) => a.state !== 'away' && Math.hypot(a.x - tx, a.y - ty) < 1.4);
    this.streetDoor.setFrame(near(STREET_DOOR.x + 0.5, STREET_DOOR.y + 0.2) ? 'door_street_open' : 'door_street_closed');
    this.backDoor.setFrame(near(BACK_DOOR.x + 0.8, BACK_DOOR.y + 0.5) ? 'door_back_open' : 'door_back_closed');
    // Buyer at the hatch mirrors the open order.
    const o = s.order;
    if (o && this.shownOrder !== o.id) {
      this.shownOrder = o.id;
      this.buyer.setFrame(frameOf(11 + (s.orderSerial % 4), 'down_idle0')).setVisible(true).setAlpha(0);
      this.tweens.add({ targets: this.buyer, alpha: 1, duration: 300 });
    }
    if (!o && this.shownOrder) {
      this.shownOrder = null;
      this.tweens.add({ targets: this.buyer, alpha: 0, duration: 500, delay: 350 });
    }
    if (o) this.buyer.y = TILE + 30 + Math.round(Math.sin(this.time.now / 600));
    const unlocked = s.unlocked.includes('annex');
    if (unlocked && this.annexCover.visible && !this.tweens.isTweening(this.annexCover)) this.annexCover.setVisible(false);
    if (unlocked) for (const t of this.dividerTiles) t.setVisible(false);
  }

  private syncHighlight() {
    const r = this.host.highlight();
    const show = !!r;
    this.sel.forEach((c) => c.setVisible(show));
    if (!r) return;
    const pad = 2 + Math.round((Math.sin(this.time.now / 180) + 1) * 1);
    const x0 = r.x * TILE - pad, y0 = r.y * TILE - pad - 6, x1 = (r.x + r.w) * TILE + pad, y1 = (r.y + r.h) * TILE + pad;
    this.sel[0].setPosition(x0 + 2, y0 + 2);
    this.sel[1].setPosition(x1 - 2, y0 + 2);
    this.sel[2].setPosition(x1 - 2, y1 - 2);
    this.sel[3].setPosition(x0 + 2, y1 - 2);
  }

  // ---------------------------------------------------------------- feedback

  private fx(frame: string): Phaser.GameObjects.Image {
    const im = this.fxPool.pop() ?? this.add.image(0, 0, ATLAS, frame);
    return im.setFrame(frame).setVisible(true).setAlpha(1).setScale(1).setDepth(4800).clearTint();
  }

  private release(im: Phaser.GameObjects.Image) {
    im.setVisible(false);
    if (this.fxPool.length < 200) this.fxPool.push(im);
    else im.destroy();
  }

  burst(x: number, y: number, frame: string, n: number, tint?: number) {
    if (this.host.reducedMotion()) n = Math.min(n, 3);
    for (let i = 0; i < n; i++) {
      const im = this.fx(frame).setPosition(x, y);
      if (tint) im.setTint(tint);
      const ang = (i / n) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 6 + Math.random() * 12;
      this.tweens.add({
        targets: im, x: x + Math.cos(ang) * dist, y: y + Math.sin(ang) * dist - 6, alpha: 0, duration: 450 + Math.random() * 250,
        ease: 'Cubic.easeOut', onComplete: () => this.release(im)
      });
    }
  }

  private coinsTo(x: number, y: number, n: number) {
    for (let i = 0; i < n; i++) {
      const im = this.fx('p_coin').setPosition(x + (i - n / 2) * 4, y);
      this.tweens.add({ targets: im, y: y - 14 - i * 2, duration: 260, ease: 'Quad.easeOut', yoyo: false, delay: i * 50,
        onComplete: () => this.tweens.add({ targets: im, alpha: 0, y: im.y - 6, duration: 300, onComplete: () => this.release(im) }) });
    }
  }

  focus(x: number, y: number) {
    if (this.host.reducedMotion()) return;
    const cam = this.cameras.main;
    cam.shake(80, 0.0015);
    void x; void y;
  }

  private react(events: SimEvent[]) {
    const s = this.host.sim.state;
    for (const e of events) {
      switch (e.type) {
        case 'JobCompleted': {
          if (!e.laneId) break;
          const v = this.laneViews.get(e.laneId)!;
          const kind = laneKind(e.laneId);
          if (kind === 'pack') this.burst(v.bench.x, v.bench.y - 16, 'p_fleck', 7);
          else if (kind === 'form') this.burst(v.bench.x, v.bench.y - 14, 'p_glint', 4);
          break;
        }
        case 'OrderSettled':
          this.coinsTo(11.5 * TILE, 2 * TILE + 4, Math.min(6, Math.ceil(e.amount / 12) + 1));
          break;
        case 'UnitHandedOver':
          this.buyerItem.setVisible(true).setAlpha(1).setPosition(11.5 * TILE, 2 * TILE + 8);
          this.tweens.add({ targets: this.buyerItem, y: 2 * TILE - 2, alpha: 0, duration: 380, onComplete: () => this.buyerItem.setVisible(false) });
          break;
        case 'HireCommitted': {
          const v = this.actorViews.get(e.actorId);
          void v;
          break;
        }
        case 'LaneBuilt': {
          const v = this.laneViews.get(e.laneId)!;
          this.burst(v.bench.x, v.bench.y - 6, 'p_dust', 16);
          v.bench.setScale(1, 0.2);
          this.tweens.add({ targets: v.bench, scaleY: 1, duration: 380, ease: 'Back.easeOut' });
          this.focus(v.bench.x, v.bench.y);
          break;
        }
        case 'UpgradeCommitted': {
          const st = STATION_LANE_CENTER(e.target);
          if (st) {
            this.burst(st.x, st.y, 'p_spark', 12);
            this.focus(st.x, st.y);
          }
          break;
        }
        case 'PropertyUnlocked': {
          this.burst(DIVIDER_X * TILE + 8, (DIVIDER_OPENING[0] + 1) * TILE, 'p_dust', 30);
          this.tweens.add({ targets: this.boarded, y: this.boarded.y + 10, alpha: 0, duration: 600, ease: 'Quad.easeIn' });
          this.tweens.add({ targets: this.annexCover, alpha: 0, duration: this.host.reducedMotion() ? 10 : 1400, onComplete: () => this.annexCover.setVisible(false) });
          for (const t of this.dividerTiles) t.setVisible(false);
          break;
        }
        case 'SuppliesDelivered': {
          const b = BUFFERS.find((x) => x.id === e.bufferId)!;
          this.burst((b.rect.x + 1) * TILE, (b.rect.y + 1) * TILE - 8, 'p_dust', 5);
          break;
        }
        case 'Milestone':
          if (e.id === 'first_hire') {
            const w = Object.values(s.actors).find((a) => a.kind === 'worker');
            if (w) this.cheer(w.id, 1600);
          }
          break;
        default:
          break;
      }
      if (e.type === 'HireCommitted') this.pendingCheer.add(e.actorId);
    }
  }

  private pendingCheer = new Set<string>();

  cheer(actorId: string, ms: number) {
    const v = this.actorViews.get(actorId);
    if (v) v.cheerUntil = this.time.now + ms;
  }

  /** Tile coordinates under a CSS-pixel point on the canvas. */
  screenToTile(cssX: number, cssY: number): { x: number; y: number } {
    const cam = this.cameras.main;
    return { x: (cam.worldView.x + (cssX * this.dpr - cam.x) / cam.zoom) / TILE, y: (cam.worldView.y + (cssY * this.dpr - cam.y) / cam.zoom) / TILE };
  }

  /** Screen position (CSS px) of a world point, for DOM labels. */
  worldToScreen(wx: number, wy: number): { x: number; y: number } {
    const cam = this.cameras.main;
    return { x: ((wx - cam.worldView.x) * cam.zoom + cam.x) / this.dpr, y: ((wy - cam.worldView.y) * cam.zoom + cam.y) / this.dpr };
  }
}

function STATION_LANE_CENTER(target: string): { x: number; y: number } | null {
  const lane = LANES.find((l) => l.station === target) ?? LANES.find((l) => l.id === target);
  if (!lane) return null;
  return { x: (lane.rect.x + lane.rect.w / 2) * TILE, y: lane.rect.y * TILE };
}
