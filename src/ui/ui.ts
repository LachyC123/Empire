// DOM overlay: HUD, contextual action button, one-press purchase panels, toasts and menus.
// Accessible text at display resolution; the world itself renders in Phaser.
import type { Offer } from '../sim/offers';
import type { PanelRef, Context } from '../sim/interact';
import { panelModel, type PanelModel } from './panels';
import { ICON } from './icons';
import type { Simulation } from '../sim/sim';
import { stockOf, bufferCapacity, buffersFor } from '../sim/rules';
import { currentGoal } from '../sim/goals';
import type { Prefs } from '../persist/storage';

export type AnyPanel = PanelRef | { kind: 'line' };

export interface UiHost {
  getSim(): Simulation;
  newTxn(): string;
  onPurchase(offer: Offer, ok: boolean, reason?: string): void;
  actionDown(): void;
  actionUp(): void;
  openManage(): void;
  pause(): void;
  resume(): void;
  prefs(): Prefs;
  setPrefs(p: Prefs): void;
  saveNow(): Promise<string>;
  exportSave(): Promise<string>;
  importText(text: string): Promise<string>;
  importSave(): Promise<string>;
  newGame(): void;
  continueGame(): void;
  canContinue(): boolean;
  toTitle(): void;
  storageNote(): string;
}

const OFFER_ICON: Record<string, string> = {
  hire: ICON.hire, speed: ICON.upgrade, equipment: ICON.wrench, build: ICON.build, buildHire: ICON.hire,
  shelving: ICON.shelf, annex: ICON.key, restock: ICON.trolley
};

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const money = (n: number) => `$${n.toLocaleString('en-US')}`;

export class Ui {
  readonly root: HTMLElement;
  private host: UiHost;
  private el: Record<string, HTMLElement> = {};
  private panelRef: AnyPanel | null = null;
  private panelSig = '';
  private panelOpenedAt = 0;
  private lastHud = 0;
  private screen: HTMLElement | null = null;
  private pendingOffers = new Set<string>();
  private detailsOpen = window.innerHeight > 560;

  constructor(root: HTMLElement, host: UiHost) {
    this.root = root;
    this.host = host;
    root.innerHTML = `
      <div class="vignette"></div>
      <div id="hud">
        <div class="group">
          <span class="pill" id="cash">${ICON.cash}<span>$0</span></span>
          <span class="pill" id="stock"></span>
        </div>
        <div class="group"><span class="pill" id="order"></span></div>
        <div class="group">
          <button class="btn" id="btn-line" aria-label="Production overview">${ICON.chart}<span class="lbl">Line</span></button>
          <button class="btn" id="btn-pause" aria-label="Pause and menu">${ICON.pause}</button>
        </div>
      </div>
      <div id="goal"></div>
      <div id="joyzone" class="interactive"><div id="joy"><div class="knob"></div></div></div>
      <div id="joyhint">Drag here to walk</div>
      <div id="actions">
        <div id="target"></div>
        <div class="action-row">
          <button class="btn" id="manage">${ICON.wrench}<span>Manage</span></button>
          <button class="btn" id="act"><span class="ring"></span><span id="act-label">Walk to a station</span></button>
        </div>
      </div>
      <aside id="panel" aria-label="Station panel"><header><h2 id="panel-title"></h2><button class="btn" id="panel-close" aria-label="Close panel">${ICON.close}</button></header><div class="body" id="panel-body"></div></aside>
      <div id="toasts"></div>
      <div id="floaters"></div>
      <div id="screens"></div>
      <div id="rotate">Turn your phone sideways to play.<br/>The game is paused.</div>`;
    for (const id of ['cash', 'stock', 'order', 'goal', 'target', 'act', 'act-label', 'manage', 'panel', 'panel-title', 'panel-body', 'toasts', 'floaters', 'screens', 'joyhint'])
      this.el[id] = root.querySelector(`#${id}`)!;

    const act = this.el.act;
    act.addEventListener('pointerdown', (e) => { e.preventDefault(); act.setPointerCapture(e.pointerId); act.classList.add('pressed'); this.host.actionDown(); });
    const up = (e: PointerEvent) => { act.classList.remove('pressed'); if (act.hasPointerCapture(e.pointerId)) act.releasePointerCapture(e.pointerId); this.host.actionUp(); };
    act.addEventListener('pointerup', up);
    act.addEventListener('pointercancel', up);
    act.addEventListener('lostpointercapture', () => { act.classList.remove('pressed'); this.host.actionUp(); });
    this.el.manage.addEventListener('click', () => this.host.openManage());
    root.querySelector('#btn-line')!.addEventListener('click', () => (this.panelRef?.kind === 'line' ? this.closePanel() : this.openPanel({ kind: 'line' })));
    root.querySelector('#btn-pause')!.addEventListener('click', () => this.showPause());
    root.querySelector('#panel-close')!.addEventListener('click', () => this.closePanel());
    this.el['panel-body'].addEventListener('click', (e) => this.onPanelClick(e));
  }

  // ---------------------------------------------------------------- HUD

  updateHud(now: number) {
    if (now - this.lastHud < 120) return;
    this.lastHud = now;
    const s = this.host.getSim().state;
    this.el.cash.querySelector('span')!.textContent = money(s.cash);
    const cap = (t: 'blank_stock' | 'sleeve') => buffersFor(s, t).reduce((n, b) => n + bufferCapacity(s, b.id), 0);
    const b = stockOf(s, 'blank_stock'), sl = stockOf(s, 'sleeve');
    this.el.stock.innerHTML = `${ICON.blank}<span class="${b <= 2 ? 'low' : ''}">${b}</span><small>/${cap('blank_stock')}</small>${ICON.sleeve}<span class="${sl <= 2 ? 'low' : ''}">${sl}</span>`;
    const o = s.order;
    this.el.order.classList.toggle('waiting', !o);
    this.el.order.innerHTML = o ? `${ICON.person}<span>${esc(o.buyer)} · ${o.delivered}/${o.qty} · ${money(o.qty * o.unitPrice)}</span>` : `${ICON.person}<span>Next buyer…</span>`;
    const g = currentGoal(s);
    if (g.goal) this.el.goal.innerHTML = `<span class="step">${g.index + 1}/${g.total}</span>${esc(g.goal.text)}${g.hint ? `<span class="hint">${esc(g.hint)}</span>` : ''}`;
    else this.el.goal.innerHTML = `<span class="step">✓</span>First slice complete — keep growing your line.${g.hint ? `<span class="hint">${esc(g.hint)}</span>` : ''}`;
    if (this.panelRef) this.refreshPanel();
  }

  bumpCash() {
    this.el.cash.classList.remove('bump');
    void this.el.cash.offsetWidth;
    this.el.cash.classList.add('bump');
  }

  setAction(ctx: Context | null, progress: number, holding: boolean) {
    const act = this.el.act;
    const label = this.el['act-label'];
    act.classList.remove('tap', 'panel', 'idle');
    if (!ctx || !ctx.action) {
      label.textContent = ctx ? ctx.label : 'Walk to a station';
      act.classList.add('idle');
    } else if (ctx.action.type === 'hold') {
      label.textContent = holding ? `${ctx.action.verb}…` : `Hold: ${ctx.action.verb}`;
    } else if (ctx.action.type === 'tap') {
      act.classList.add('tap');
      label.textContent = ctx.action.verb;
    } else {
      act.classList.add('panel');
      label.textContent = ctx.action.verb;
    }
    act.style.setProperty('--p', String(progress));
    this.el.manage.style.visibility = ctx?.panel ? 'visible' : 'hidden';
    this.el.target.innerHTML = ctx ? `${esc(ctx.label)}${ctx.hint ? `<span class="why">${esc(ctx.hint)}</span>` : ''}` : '';
  }

  hideJoyHint() {
    this.el.joyhint.style.display = 'none';
  }

  // ---------------------------------------------------------------- panels

  panelOpen(): AnyPanel | null {
    return this.panelRef;
  }

  openPanel(ref: AnyPanel) {
    this.panelRef = ref;
    this.panelSig = '';
    this.panelOpenedAt = performance.now();
    this.refreshPanel();
    this.el.panel.classList.add('open');
  }

  closePanel() {
    this.panelRef = null;
    this.el.panel.classList.remove('open');
  }

  private currentModel: PanelModel | null = null;

  refreshPanel() {
    if (!this.panelRef) return;
    const m = panelModel(this.host.getSim(), this.panelRef);
    this.currentModel = m;
    const sig = JSON.stringify([m.title, m.offers.map((o) => [o.key, o.cost, o.available, o.reason, o.title, o.benefit, o.note]), (m.lanes ?? []).map((l) => l.key), m.status?.ok, m.extraHtml, m.stats.map((s) => s.key)]);
    const body = this.el['panel-body'];
    if (sig !== this.panelSig) {
      this.panelSig = sig;
      const scroll = body.scrollTop;
      this.el['panel-title'].innerHTML = `${esc(m.title)}${m.subtitle ? `<small>${esc(m.subtitle)}</small>` : ''}`;
      const details = `${m.stats.length ? `<dl class="stats">${m.stats.map((s) => `<dt>${esc(s.label)}</dt><dd data-stat="${s.key}">${esc(s.value)}</dd>`).join('')}</dl>` : ''}
        ${m.lanes?.length ? `<div class="lanes">${m.lanes.map((l) => `<div class="lane" data-lane="${l.key}"><b>${esc(l.title)}</b><span></span><span class="act">${esc(l.activity)}</span><span class="bar"><i></i></span></div>`).join('')}</div>` : ''}
        ${m.extraHtml ?? ''}`;
      // Actions first (thumb-reachable on a short landscape phone); numbers and staff under Details.
      body.innerHTML = `
        ${m.status ? `<div class="status ${m.status.ok ? 'ok' : ''}" data-status>${esc(m.status.text)}</div>` : ''}
        ${m.offers.length ? `<div class="offers">${m.offers.map((o) => this.offerHtml(o)).join('')}</div>` : ''}
        ${m.offers.length ? `<details ${this.detailsOpen ? 'open' : ''}><summary>Details</summary>${details}</details>` : details}`;
      body.querySelector('details')?.addEventListener('toggle', (e) => { this.detailsOpen = (e.target as HTMLDetailsElement).open; });
      body.scrollTop = scroll;
    }
    // Dynamic values update in place so buttons stay stable under the finger.
    for (const s of m.stats) { const e = body.querySelector(`[data-stat="${s.key}"]`); if (e && e.textContent !== s.value) e.textContent = s.value; }
    const st = body.querySelector('[data-status]');
    if (st && m.status && st.textContent !== m.status.text) st.textContent = m.status.text;
    for (const l of m.lanes ?? []) {
      const e = body.querySelector(`[data-lane="${l.key}"]`);
      if (!e) continue;
      const a = e.querySelector('.act')!;
      if (a.textContent !== l.activity) a.textContent = l.activity;
      (e.querySelector('.bar i') as HTMLElement).style.width = `${Math.round((l.progress ?? 0) * 100)}%`;
    }
  }

  private offerHtml(o: Offer): string {
    const pending = this.pendingOffers.has(o.key);
    return `<button class="btn offer ${o.available ? 'ready' : ''} ${pending ? 'pending' : ''}" data-offer="${esc(o.key)}" ${o.available && !pending ? '' : 'aria-disabled="true"'}>
      <span class="ico">${OFFER_ICON[o.kind] ?? ICON.upgrade}</span><span class="t">${esc(o.title)}</span><span class="c">${o.cost ? money(o.cost) : 'Free'}</span>
      <span class="b">${esc(o.benefit)}</span>${o.note ? `<span class="n">${esc(o.note)}</span>` : ''}${!o.available && o.reason ? `<span class="r">${esc(o.reason)}</span>` : ''}</button>`;
  }

  private onPanelClick(e: Event) {
    const btn = (e.target as HTMLElement).closest('[data-offer]') as HTMLElement | null;
    if (!btn || !this.currentModel) return;
    // Absorb a finger that was already down when the panel opened.
    if (performance.now() - this.panelOpenedAt < 250) return;
    const key = btn.dataset.offer!;
    const offer = this.currentModel.offers.find((o) => o.key === key);
    if (!offer || this.pendingOffers.has(key)) return;
    if (!offer.available) {
      btn.classList.remove('shake');
      void btn.offsetWidth;
      btn.classList.add('shake');
      this.host.onPurchase(offer, false, offer.reason);
      return;
    }
    this.pendingOffers.add(key);
    btn.classList.add('pending');
    const r = offer.run(this.host.newTxn());
    this.pendingOffers.delete(key);
    this.host.onPurchase(offer, r.ok, r.ok ? undefined : r.reason);
    this.panelSig = '';
    this.refreshPanel();
  }

  // ---------------------------------------------------------------- feedback

  toast(text: string, kind: 'good' | 'bad' | 'big' | '' = '', life = 2.6, key?: string) {
    if (key) this.el.toasts.querySelectorAll(`[data-key="${key}"]`).forEach((e) => e.remove());
    const t = document.createElement('div');
    if (key) t.dataset.key = key;
    t.className = `toast ${kind}`;
    t.style.setProperty('--life', `${life}s`);
    t.textContent = text;
    this.el.toasts.appendChild(t);
    while (this.el.toasts.children.length > 2) this.el.toasts.firstChild!.remove();
    setTimeout(() => t.remove(), (life + 0.5) * 1000);
  }

  floater(x: number, y: number, text: string, cls = '') {
    const f = document.createElement('div');
    f.className = `floater ${cls}`;
    f.style.left = `${x}px`;
    f.style.top = `${y}px`;
    f.textContent = text;
    this.el.floaters.appendChild(f);
    setTimeout(() => f.remove(), cls === 'name' ? 2700 : 1700);
  }

  // ---------------------------------------------------------------- screens

  private show(html: string, cls = ''): HTMLElement {
    this.closeScreen();
    const sc = document.createElement('div');
    sc.className = `screen ${cls}`;
    sc.innerHTML = html;
    this.el.screens.appendChild(sc);
    this.screen = sc;
    return sc;
  }

  closeScreen() {
    this.screen?.remove();
    this.screen = null;
  }

  screenOpen(): boolean {
    return !!this.screen;
  }

  showTitle(message?: string) {
    const can = this.host.canContinue();
    const sc = this.show(`
      <div class="logo">
        <h1>BACKROOM<br/><span>EMPIRE</span></h1>
        <p>Start alone in a borrowed backroom in rainy Bellwater. Make, pack and hand over glowing Nightglass — then hire people who really do the work.</p>
        <div class="row">
          ${can ? '<button class="btn primary" data-a="continue">Continue</button>' : ''}
          <button class="btn ${can ? '' : 'primary'}" data-a="new">New game</button>
          <button class="btn" data-a="import">Import save file</button>
          <button class="btn" data-a="paste">Paste save</button>
          <button class="btn" data-a="settings">Settings</button>
        </div>
        ${message ? `<p class="fine" style="color:#ffc9a8">${esc(message)}</p>` : ''}
        <p class="fine">Fictional, stylised crime: invented goods and abstract processes. Saves stay on this device — export a copy from the menu. ${esc(this.host.storageNote())}</p>
      </div>`, 'title');
    sc.addEventListener('click', async (e) => {
      const a = (e.target as HTMLElement).closest('[data-a]') as HTMLElement | null;
      if (!a) return;
      const act = a.dataset.a;
      if (act === 'continue') this.host.continueGame();
      if (act === 'new') {
        if (can) this.confirm('Start a new game?', 'Your current save is kept as a backup slot until the next save overwrites it. Export it first if you want to keep it.', 'Start new', () => this.host.newGame(), () => this.showTitle());
        else this.host.newGame();
      }
      if (act === 'import') {
        const msg = await this.host.importSave();
        this.showTitle(msg);
      }
      if (act === 'settings') this.showSettings(() => this.showTitle());
      if (act === 'paste') this.showPaste(() => this.showTitle());
    });
  }

  showPaste(back: () => void) {
    const sc = this.show(`<div class="card"><h2>Paste a save</h2>
      <p class="note">Paste the text you copied with “Export save”.</p>
      <textarea id="paste-save" rows="5" style="width:100%;font:inherit;font-size:0.8em" spellcheck="false"></textarea>
      <div class="row"><button class="btn" data-a="back">Cancel</button><button class="btn primary" data-a="load">Load save</button></div>
      <p class="note" data-msg></p></div>`);
    sc.addEventListener('click', async (e) => {
      const a = (e.target as HTMLElement).closest('[data-a]') as HTMLElement | null;
      if (!a) return;
      if (a.dataset.a === 'back') back();
      if (a.dataset.a === 'load') {
        const text = (sc.querySelector('#paste-save') as HTMLTextAreaElement).value.trim();
        const msg = await this.host.importText(text);
        const m = sc.querySelector('[data-msg]');
        if (m) m.textContent = msg;
      }
    });
  }

  showPause() {
    this.host.pause();
    const sc = this.show(`<div class="card"><h2>Paused</h2>
      <p class="note">Everything is frozen while this menu is open.</p>
      <div class="row"><button class="btn primary" data-a="resume">Resume</button></div>
      <div class="row"><button class="btn" data-a="save">Save now</button><button class="btn" data-a="export">Export save file</button></div>
      <div class="row"><button class="btn" data-a="import">Import save file</button><button class="btn" data-a="paste">Paste save</button></div>
      <div class="row"><button class="btn" data-a="settings">Settings</button></div>
      <div class="row"><button class="btn" data-a="help">Controls</button><button class="btn danger" data-a="title">Quit to title</button></div>
      <p class="note" data-msg></p></div>`);
    sc.addEventListener('click', async (e) => {
      const a = (e.target as HTMLElement).closest('[data-a]') as HTMLElement | null;
      if (!a) return;
      const msg = sc.querySelector('[data-msg]')!;
      switch (a.dataset.a) {
        case 'resume': this.closeScreen(); this.host.resume(); break;
        case 'save': msg.textContent = await this.host.saveNow(); break;
        case 'export': msg.textContent = await this.host.exportSave(); break;
        case 'import': msg.textContent = await this.host.importSave(); break;
        case 'paste': this.showPaste(() => this.showPause()); break;
        case 'settings': this.showSettings(() => this.showPause()); break;
        case 'help': this.showHelp(); break;
        case 'title': await this.host.saveNow(); this.host.toTitle(); break;
      }
    });
  }

  showHelp() {
    const sc = this.show(`<div class="card"><h2>Controls</h2>
      <p><b>Phone:</b> drag on the left side to walk. The big button does what the highlighted thing needs — <b>hold</b> it to work, tap to pick up or put down. <b>Manage</b> opens hire/upgrade options. Tap any station to open it.</p>
      <p><b>Keyboard:</b> WASD / arrows walk · E or Space: action (hold to work) · M: manage · Q: next target · L: line overview · Esc: pause.</p>
      <p class="note">Workers only work with real stock: if a shelf is empty they wait and show why.</p>
      <div class="row"><button class="btn primary" data-a="back">Back</button></div></div>`);
    sc.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('[data-a]')) this.showPause(); });
  }

  showSettings(back: () => void) {
    const p = this.host.prefs();
    const sc = this.show(`<div class="card"><h2>Settings</h2>
      <label>Sound effects <input type="range" min="0" max="1" step="0.05" data-k="volume" value="${p.volume}"></label>
      <label>Rain ambience <input type="range" min="0" max="1" step="0.05" data-k="ambience" value="${p.ambience}"></label>
      <label>Reduced motion <input type="checkbox" data-k="reducedMotion" ${p.reducedMotion ? 'checked' : ''}></label>
      <label>Larger text <input type="checkbox" data-k="largeText" ${p.largeText ? 'checked' : ''}></label>
      <label>Left-handed controls <input type="checkbox" data-k="leftHanded" ${p.leftHanded ? 'checked' : ''}></label>
      <div class="row"><button class="btn primary" data-a="back">Done</button></div></div>`);
    sc.addEventListener('input', (e) => {
      const t = e.target as HTMLInputElement;
      const k = t.dataset.k as keyof Prefs | undefined;
      if (!k) return;
      const next = { ...this.host.prefs(), [k]: t.type === 'checkbox' ? t.checked : Number(t.value) };
      this.host.setPrefs(next as Prefs);
    });
    sc.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('[data-a="back"]')) back(); });
  }

  confirm(title: string, text: string, okLabel: string, ok: () => void, cancel: () => void) {
    const sc = this.show(`<div class="card"><h2>${esc(title)}</h2><p>${esc(text)}</p>
      <div class="row"><button class="btn" data-a="no">Cancel</button><button class="btn danger" data-a="yes">${esc(okLabel)}</button></div></div>`);
    sc.addEventListener('click', (e) => {
      const a = (e.target as HTMLElement).closest('[data-a]') as HTMLElement | null;
      if (!a) return;
      if (a.dataset.a === 'yes') ok(); else cancel();
    });
  }

  showMessage(title: string, text: string, button: string, then: () => void) {
    const sc = this.show(`<div class="card"><h2>${esc(title)}</h2><p>${esc(text)}</p><div class="row"><button class="btn primary" data-a="ok">${esc(button)}</button></div></div>`);
    sc.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('[data-a]')) then(); });
  }
}
