// Movement input: floating touch joystick (pointer ownership, dead zone, cancel handling) + keyboard.
export class MoveInput {
  private keys = new Set<string>();
  private joyId: number | null = null;
  private origin = { x: 0, y: 0 };
  private vec = { x: 0, y: 0 };
  private zone: HTMLElement;
  private base: HTMLElement;
  private knob: HTMLElement;
  onFirstMove: (() => void) | null = null;
  onKeyAction: ((down: boolean) => void) | null = null;
  onKey: ((key: string) => void) | null = null;

  constructor(zone: HTMLElement) {
    this.zone = zone;
    this.base = zone.querySelector('#joy') as HTMLElement;
    this.knob = this.base.querySelector('.knob') as HTMLElement;
    zone.addEventListener('pointerdown', (e) => this.down(e));
    zone.addEventListener('pointermove', (e) => this.move(e));
    zone.addEventListener('pointerup', (e) => this.up(e));
    zone.addEventListener('pointercancel', (e) => this.up(e));
    zone.addEventListener('lostpointercapture', (e) => this.up(e));
    window.addEventListener('keydown', (e) => {
      if (e.repeat) { if (['Space', 'KeyE', 'Enter'].includes(e.code)) e.preventDefault(); return; }
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      this.keys.add(e.code);
      if (['Space', 'KeyE', 'Enter'].includes(e.code)) { e.preventDefault(); this.onKeyAction?.(true); }
      else this.onKey?.(e.code);
      if (this.keyVector().x || this.keyVector().y) this.onFirstMove?.();
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      if (['Space', 'KeyE', 'Enter'].includes(e.code)) this.onKeyAction?.(false);
    });
    window.addEventListener('blur', () => this.reset());
  }

  private down(e: PointerEvent) {
    if (this.joyId !== null) return;
    e.preventDefault();
    this.joyId = e.pointerId;
    this.zone.setPointerCapture(e.pointerId);
    const r = this.zone.getBoundingClientRect();
    this.origin = { x: e.clientX, y: e.clientY };
    this.base.style.display = 'block';
    this.base.style.left = `${e.clientX - r.left}px`;
    this.base.style.top = `${e.clientY - r.top}px`;
    this.knob.style.transform = '';
    this.onFirstMove?.();
  }

  private move(e: PointerEvent) {
    if (e.pointerId !== this.joyId) return;
    const dx = e.clientX - this.origin.x, dy = e.clientY - this.origin.y;
    const max = 44, dead = 8;
    const d = Math.hypot(dx, dy);
    const k = d > max ? max / d : 1;
    this.knob.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
    if (d < dead) { this.vec = { x: 0, y: 0 }; return; }
    const m = Math.min(1, (d - dead) / (max - dead));
    this.vec = { x: (dx / d) * m, y: (dy / d) * m };
  }

  private up(e: PointerEvent) {
    if (e.pointerId !== this.joyId) return;
    this.joyId = null;
    this.vec = { x: 0, y: 0 };
    this.base.style.display = 'none';
  }

  private keyVector() {
    const k = this.keys;
    const x = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
    const y = (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0) - (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0);
    return { x, y };
  }

  vector(): { x: number; y: number } {
    const kv = this.keyVector();
    if (kv.x || kv.y) {
      const m = Math.hypot(kv.x, kv.y);
      return { x: kv.x / m, y: kv.y / m };
    }
    return this.vec;
  }

  /** Clear held input (on pause, blur, visibility change). */
  reset() {
    this.keys.clear();
    this.vec = { x: 0, y: 0 };
    this.joyId = null;
    this.base.style.display = 'none';
    this.onKeyAction?.(false);
  }
}
