// App bootstrap and lifecycle: wires the simulation, Phaser world, DOM UI, input, audio and saves.
import * as Phaser from 'phaser';
import { LANES, TILE, STREET_DOOR } from './content/slice';
import { Simulation, createInitialState } from './sim/sim';
import { contexts, type Context } from './sim/interact';
import { laneKind, stationDef } from './sim/rules';
import type { GameState, SimEvent } from './sim/types';
import { WorldScene, type WorldHost } from './render/world';
import { Ui, type UiHost } from './ui/ui';
import { MoveInput } from './ui/input';
import { panelAt } from './ui/panels';
import { Audio } from './audio/sfx';
import { SaveStore, claimTab, exportFile, loadPrefs, pickImport, readPasted, savePrefs, type Prefs } from './persist/storage';
import type { Offer } from './sim/offers';
import { SaveError } from './sim/save';
import { Bot } from './debug/bot';

const AUTOSAVE_MS = 12_000;

export class App implements UiHost, WorldHost {
  sim: Simulation;
  private store = new SaveStore();
  private prefsVal: Prefs = loadPrefs();
  private audio = new Audio();
  private ui!: Ui;
  private move!: MoveInput;
  private game!: Phaser.Game;
  private world: WorldScene | null = null;
  private paused = true;
  private mode: 'title' | 'play' = 'title';
  private holding = false;
  private ctxIndex = 0;
  private ctxKeys = '';
  private currentCtx: Context | null = null;
  private txnSerial = 0;
  private hasSave = false;
  private lastSavedRev = -1;
  private lastSaveAt = 0;
  private saveTimer: number | null = null;
  private beats = new Map<string, number>();
  private saving = false;
  private ownsTab = true;

  constructor() {
    this.sim = new Simulation(createInitialState(1));
  }

  async boot() {
    const uiRoot = document.getElementById('ui')!;
    this.ui = new Ui(uiRoot, this);
    this.applyPrefs();
    this.move = new MoveInput(uiRoot.querySelector('#joyzone') as HTMLElement);
    this.move.onFirstMove = () => this.ui.hideJoyHint();
    this.move.onKeyAction = (down) => {
      if (this.mode !== 'play' || this.ui.screenOpen()) return;
      if (down) this.actionDown(); else this.actionUp();
    };
    this.move.onKey = (code) => this.onKey(code);
    this.createGame();
    this.installLifecycle();

    await this.store.init();
    this.ownsTab = await claimTab(() => undefined);
    this.hasSave = await this.store.hasSave();
    if (!this.ownsTab) {
      this.ui.showMessage('Already open', 'Backroom Empire is running in another tab. Use that tab so the two copies cannot overwrite each other’s save.', 'Reload', () => location.reload());
      return;
    }
    document.body.classList.add('mode-title');
    this.ui.showTitle(this.store.available ? undefined : 'This browser is not allowing local saves. You can still play and export your progress from the menu.');
    if (new URLSearchParams(location.search).has('debug')) (window as unknown as { __BE: unknown }).__BE = this.debugApi();
  }

  // ---------------------------------------------------------------- Phaser

  private createGame() {
    const parent = document.getElementById('game')!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      width: Math.round(innerWidth * dpr),
      height: Math.round(innerHeight * dpr),
      backgroundColor: '#120e16',
      scale: { mode: Phaser.Scale.NONE },
      render: { smoothPixelArt: true },
      input: { keyboard: false, mouse: false, touch: false, gamepad: false },
      audio: { noAudio: true },
      banner: false,
      scene: []
    });
    this.game.events.once('ready', () => {
      this.sizeCanvas();
      this.game.scene.add('world', WorldScene, true, { host: this });
      this.world = this.game.scene.getScene('world') as WorldScene;
    });
    window.addEventListener('resize', () => this.sizeCanvas());
    // World taps open the tapped station's panel.
    let start: { x: number; y: number; t: number } | null = null;
    parent.addEventListener('pointerdown', (e) => { start = { x: e.clientX, y: e.clientY, t: performance.now() }; });
    parent.addEventListener('pointerup', (e) => {
      if (!start || !this.world || this.mode !== 'play') return;
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 12 || performance.now() - start.t > 600) return;
      const t = this.world.screenToTile(e.clientX, e.clientY);
      this.onWorldTap(t.x, t.y);
    });
  }

  private sizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = innerWidth, h = innerHeight;
    this.game.scale.resize(Math.round(w * dpr), Math.round(h * dpr));
    const c = this.game.canvas;
    c.style.width = `${w}px`;
    c.style.height = `${h}px`;
    c.dataset.dpr = String(dpr);
    this.world?.layout();
  }

  private setSim(state: GameState) {
    this.sim = new Simulation(state);
    this.holding = false;
    this.beats.clear();
    this.lastSavedRev = state.revision;
    if (this.world) this.world.scene.restart({ host: this });
  }

  // ---------------------------------------------------------------- WorldHost

  getSim() { return this.sim; }
  isPaused() { return this.paused; }
  reducedMotion() { return this.prefsVal.reducedMotion; }
  highlight() { return this.mode === 'play' && this.currentCtx ? this.currentCtx.rect : null; }

  onWorldTap(tx: number, ty: number) {
    const ref = panelAt(this.sim, tx, ty);
    if (ref) { this.audio.play('tap'); this.ui.openPanel(ref); }
  }

  onFrame() {
    const now = performance.now();
    if (this.mode !== 'play') return;
    const v = this.paused ? { x: 0, y: 0 } : this.move.vector();
    if (this.holding && Math.hypot(v.x, v.y) > 0.35) this.actionUp();
    this.sim.setInput(v.x, v.y);
    if (this.holding && !this.sim.state.playerHold) this.holding = false;

    const list = contexts(this.sim);
    const keys = list.map((c) => c.label).join('|');
    if (keys !== this.ctxKeys) { this.ctxKeys = keys; this.ctxIndex = 0; }
    let ctx = list.length ? list[this.ctxIndex % list.length] : null;
    let progress = 0;
    if (this.holding && this.sim.state.playerHold) {
      const target = this.sim.state.playerHold;
      ctx = list.find((c) => c.action && 'target' in c.action && c.action.target === target) ?? ctx;
      const lane = this.sim.state.lanes[target.slice(5)];
      const job = lane?.jobId ? this.sim.state.jobs[lane.jobId] : null;
      progress = job ? Math.min(1, job.progress) : 0;
    }
    this.currentCtx = ctx;
    this.ui.setAction(ctx, progress, this.holding);
    this.ui.updateHud(now);
    this.workSounds();
    if (!this.paused && now - this.lastSaveAt > AUTOSAVE_MS && this.sim.state.revision !== this.lastSavedRev) void this.saveNow(true);
    else if (!this.paused && now - this.lastSaveAt > AUTOSAVE_MS * 2) void this.saveNow(true);
  }

  /** Material-specific tick on each visible work beat; faster cycles naturally change cadence. */
  private workSounds() {
    const s = this.sim.state;
    for (const l of LANES) {
      const lane = s.lanes[l.id];
      const job = lane.jobId ? s.jobs[lane.jobId] : null;
      if (!job || job.state !== 'working' || job.actorId === null) continue;
      const kind = laneKind(l.id);
      const beat = Math.floor(job.progress * 6);
      if (this.beats.get(job.id) === beat) continue;
      this.beats.set(job.id, beat);
      if (kind === 'form') this.audio.play(beat === 3 ? 'press' : 'formBeat');
      else if (kind === 'pack') this.audio.play(beat === 3 || beat === 5 ? 'press' : 'packBeat');
    }
    if (this.beats.size > 64) this.beats.clear();
  }

  onSimEvents(events: SimEvent[]) {
    const s = this.sim.state;
    let saveSoon = false;
    for (const e of events) {
      switch (e.type) {
        case 'BatchTransferred':
          if ((e.to.k === 'actor' && e.to.id === 'player')) this.audio.play('pickup');
          else if (e.from.k === 'actor' && e.from.id === 'player' && e.to.k === 'buffer') this.audio.play('place');
          break;
        case 'JobCompleted':
          if (e.actorId === 'player') this.audio.play('complete');
          break;
        case 'OrderSettled': {
          this.audio.play('coin');
          this.ui.bumpCash();
          this.float(11.5 * TILE, 2 * TILE, `+$${e.amount}`, 'cash');
          saveSoon = true;
          break;
        }
        case 'HireCommitted': {
          const a = s.actors[e.actorId];
          this.audio.play('hire');
          const job = e.role === 'assembler' ? 'forming' : e.role === 'packer' ? 'packing' : 'serving the hatch';
          this.ui.toast(`${a.name} is on the way in — they'll take over ${job}.`, 'good', 3.2, 'hire');
          this.float((STREET_DOOR.x + 0.5) * TILE, (STREET_DOOR.y - 1.5) * TILE, `${a.name} hired!`, 'name');
          saveSoon = true;
          break;
        }
        case 'UpgradeCommitted':
          if (!e.nodeId.startsWith('lanes') && !e.nodeId.startsWith('property')) this.audio.play('upgrade');
          saveSoon = true;
          break;
        case 'LaneBuilt':
          this.audio.play('build');
          break;
        case 'PropertyUnlocked':
          this.audio.play('unlock');
          this.ui.toast('The adjoining workshop is open! New bench, table and shelves next door.', 'big', 4);
          break;
        case 'SuppliesOrdered':
          this.ui.toast(`Oren is bringing ${e.pairs} blank${e.pairs === 1 ? '' : 's'} + ${e.pairs} sleeve${e.pairs === 1 ? '' : 's'}.`, 'good', 2.6, 'supplies');
          saveSoon = true;
          break;
        case 'SuppliesDelivered':
          this.audio.play('deliver');
          break;
        case 'ErrandStarted':
          this.audio.play('door');
          this.ui.toast('Out on an errand… back in 20 seconds.', '', 2.4);
          break;
        case 'ErrandDone':
          this.audio.play('coin');
          this.ui.bumpCash();
          this.float((STREET_DOOR.x + 0.5) * TILE, (STREET_DOOR.y - 1.5) * TILE, `+$${e.amount}`, 'cash');
          saveSoon = true;
          break;
        case 'Milestone':
          if (e.id === 'first_sale') this.ui.toast('First sale! Earn $60 to hire your first assembler.', 'big', 3.5);
          if (e.id === 'first_form') this.ui.toast('Shaped! Now grab a sleeve and pack it.', 'good');
          if (e.id === 'first_pack') this.ui.toast('Packed! Hand it to the buyer at the hatch.', 'good');
          break;
        default:
          break;
      }
    }
    if (saveSoon) this.scheduleSave();
  }

  private float(wx: number, wy: number, text: string, cls: string) {
    if (!this.world) return;
    const p = this.world.worldToScreen(wx, wy);
    this.ui.floater(p.x, p.y, text, cls);
  }

  // ---------------------------------------------------------------- actions

  actionDown() {
    this.audio.unlock();
    if (this.paused || this.mode !== 'play') return;
    const ctx = this.currentCtx;
    if (!ctx || !ctx.action) return;
    const a = ctx.action;
    if (a.type === 'hold') {
      this.sim.setHold(a.target);
      this.holding = true;
    } else if (a.type === 'tap') {
      const r = a.target === 'errand' ? this.sim.errand(this.newTxn()) : this.sim.interact(a.target, this.newTxn());
      if (!r.ok) { this.audio.play('error'); this.ui.toast(r.reason, 'bad', 1.8, 'reject'); }
    } else if (ctx.panel) {
      this.ui.openPanel(ctx.panel);
    }
  }

  actionUp() {
    if (this.holding) {
      this.sim.setHold(null);
      this.holding = false;
    }
  }

  openManage() {
    this.audio.unlock();
    const ctx = this.currentCtx;
    if (ctx?.panel) this.ui.openPanel(ctx.panel);
    else this.ui.openPanel({ kind: 'line' });
  }

  private onKey(code: string) {
    if (this.mode !== 'play') return;
    if (code === 'Escape') {
      if (this.ui.screenOpen()) { this.ui.closeScreen(); this.resume(); }
      else if (this.ui.panelOpen()) this.ui.closePanel();
      else this.ui.showPause();
    }
    if (this.ui.screenOpen()) return;
    if (code === 'KeyM') this.openManage();
    if (code === 'KeyQ' || code === 'Tab') this.ctxIndex++;
    if (code === 'KeyL') this.ui.panelOpen()?.kind === 'line' ? this.ui.closePanel() : this.ui.openPanel({ kind: 'line' });
    if (code === 'KeyP') this.ui.showPause();
  }

  newTxn() {
    return `${this.sim.state.worldId}:${Date.now().toString(36)}:${++this.txnSerial}`;
  }

  onPurchase(offer: Offer, ok: boolean, reason?: string) {
    this.audio.unlock();
    if (!ok) {
      this.audio.play('error');
      if (reason) this.ui.toast(reason, 'bad', 1.8, 'reject');
      return;
    }
    const msg: Record<string, string> = {
      speed: `Faster! ${offer.benefit.split(' · ')[0]}`,
      equipment: `Installed: ${offer.title.replace('Install ', '')}. ${offer.benefit.split(' · ')[1] ?? ''}`,
      build: 'New position built — hire someone or use it yourself.',
      shelving: 'Bigger shelves fitted.',
      annex: ''
    };
    if (msg[offer.kind]) this.ui.toast(msg[offer.kind], 'good', 3);
    this.scheduleSave();
  }

  // ---------------------------------------------------------------- lifecycle & saves

  pause() {
    this.paused = true;
    this.actionUp();
    this.move.reset();
    this.audio.suspend();
  }

  resume() {
    if (this.mode !== 'play') return;
    if (matchMedia('(orientation: portrait) and (max-width: 900px)').matches) return;
    this.paused = false;
    this.audio.resume();
  }

  private installLifecycle() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.mode === 'play') {
        void this.saveNow(true);
        if (!this.ui.screenOpen()) this.ui.showPause();
      }
    });
    window.addEventListener('pagehide', () => { if (this.mode === 'play') void this.saveNow(true); });
    const mq = matchMedia('(orientation: portrait) and (max-width: 900px)');
    mq.addEventListener('change', () => {
      if (mq.matches && this.mode === 'play' && !this.ui.screenOpen()) this.ui.showPause();
    });
    window.addEventListener('blur', () => this.actionUp());
  }

  private scheduleSave() {
    if (this.saveTimer !== null) return;
    this.saveTimer = window.setTimeout(() => { this.saveTimer = null; void this.saveNow(true); }, 700);
  }

  async saveNow(quiet = false): Promise<string> {
    if (this.mode !== 'play' || !this.ownsTab) return 'Nothing to save yet.';
    if (this.saving) return 'Saving…';
    this.lastSaveAt = performance.now();
    if (!this.store.available) return 'Saving is unavailable in this browser — use Export save file.';
    this.saving = true;
    try {
      await this.store.save(this.sim.state);
      this.lastSavedRev = this.sim.state.revision;
      this.hasSave = true;
      return `Saved at ${new Date().toLocaleTimeString()}.`;
    } catch (e) {
      const msg = `Couldn't save (${(e as Error).message}). Your last good save is kept — try again or export a copy.`;
      if (!quiet) this.ui.toast(msg, 'bad', 4);
      else this.ui.toast('Autosave failed — open the menu to export a copy.', 'bad', 3);
      return msg;
    } finally {
      this.saving = false;
    }
  }

  exportSave() { return exportFile(this.sim.state); }

  async importText(text: string): Promise<string> {
    try {
      this.setSim(readPasted(text));
      this.mode = 'play';
      document.body.classList.remove('mode-title');
      await this.saveNow(true);
      this.ui.closeScreen();
      this.resume();
      this.ui.toast('Save imported.', 'good');
      return 'Save imported.';
    } catch (e) {
      return (e as Error).message;
    }
  }

  async importSave(): Promise<string> {
    try {
      const state = await pickImport();
      this.setSim(state);
      this.mode = 'play';
      document.body.classList.remove('mode-title');
      await this.saveNow(true);
      this.ui.closeScreen();
      this.resume();
      this.ui.toast('Save imported.', 'good');
      return 'Save imported.';
    } catch (e) {
      return e instanceof SaveError ? e.message : `Import failed: ${(e as Error).message}`;
    }
  }

  canContinue() { return this.hasSave; }

  toTitle() {
    this.pause();
    this.mode = 'title';
    this.ui.closePanel();
    document.body.classList.add('mode-title');
    this.ui.showTitle();
  }
  storageNote() { return this.store.available ? '' : 'Local saving is unavailable here.'; }

  async continueGame() {
    this.audio.unlock();
    const r = await this.store.load();
    if (!r.state) { this.ui.showTitle(r.error ?? 'No save found.'); return; }
    this.setSim(r.state);
    this.start();
    this.ui.toast(r.error ?? 'Welcome back.', r.error ? 'bad' : 'good', r.error ? 5 : 2);
  }

  newGame() {
    this.audio.unlock();
    this.setSim(createInitialState(Math.floor(Math.random() * 1e9) + 1));
    this.start();
    void this.saveNow(true);
    this.ui.toast('Your first buyer is at the hatch. Grab a blank from the shelf.', 'good', 4);
  }

  private start() {
    this.mode = 'play';
    document.body.classList.remove('mode-title');
    this.lastSaveAt = performance.now();
    this.ui.closeScreen();
    this.ui.closePanel();
    this.paused = false;
    this.resume();
  }

  prefs() { return this.prefsVal; }
  setPrefs(p: Prefs) {
    this.prefsVal = p;
    savePrefs(p);
    this.applyPrefs();
  }

  private applyPrefs() {
    const p = this.prefsVal;
    document.body.classList.toggle('large-text', p.largeText);
    document.body.classList.toggle('left-handed', p.leftHanded);
    document.body.classList.toggle('reduced-motion', p.reducedMotion);
    this.audio.setVolumes(p.volume, p.ambience);
  }

  // ---------------------------------------------------------------- test hook (?debug only)

  private debugApi() {
    return {
      app: this,
      sim: () => this.sim,
      run: (sec: number) => this.sim.run(sec),
      state: () => this.sim.state,
      ctx: () => this.currentCtx,
      newGame: () => this.newGame(),
      continueGame: () => this.continueGame(),
      save: () => this.saveNow(),
      openPanel: (ref: Parameters<Ui['openPanel']>[0]) => this.ui.openPanel(ref),
      closePanel: () => this.ui.closePanel(),
      laneStation: (id: string) => stationDef(LANES.find((l) => l.id === id)!.station).id,
      pause: () => this.pause(),
      resume: () => this.resume(),
      /** Fast-forward with the test bot playing the player's part through real controls/commands. */
      autoplay: (seconds: number, opts?: { restock?: boolean; sellOnly?: boolean }) => {
        const bot = new Bot(this.sim, { restock: opts?.restock ?? true, sellOnly: opts?.sellOnly });
        const n = Math.round(seconds * 30);
        for (let i = 0; i < n; i++) { bot.update(); this.sim.step(); }
        this.sim.setInput(0, 0);
        this.sim.setHold(null);
        const ev = this.sim.drainEvents();
        this.onSimEvents(ev);
        return this.sim.audit();
      },
      audit: () => this.sim.audit(),
      /** Read the stored save without starting it. */
      peekSave: async () => (await this.store.load()).state
    };
  }
}
