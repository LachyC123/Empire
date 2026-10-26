// Tiny pixel-painting toolkit used to author the game's original sprites in code.
// Every sprite is painted at 1:1 on a canvas, outlined, and packed into one atlas.

export type RGBA = [number, number, number, number];

export function hex(c: string): RGBA {
  const v = c.replace('#', '');
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16), v.length > 6 ? parseInt(v.slice(6, 8), 16) : 255];
}

export class Sprite {
  readonly w: number;
  readonly h: number;
  readonly data: Uint8ClampedArray;

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.data = new Uint8ClampedArray(w * h * 4);
  }

  px(x: number, y: number, c: string | null) {
    if (c === null) return;
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const [r, g, b, a] = hex(c);
    const i = (y * this.w + x) * 4;
    if (a === 255) {
      this.data[i] = r; this.data[i + 1] = g; this.data[i + 2] = b; this.data[i + 3] = 255;
    } else {
      const ia = a / 255, da = this.data[i + 3] / 255;
      const oa = ia + da * (1 - ia);
      if (oa <= 0) return;
      this.data[i] = (r * ia + this.data[i] * da * (1 - ia)) / oa;
      this.data[i + 1] = (g * ia + this.data[i + 1] * da * (1 - ia)) / oa;
      this.data[i + 2] = (b * ia + this.data[i + 2] * da * (1 - ia)) / oa;
      this.data[i + 3] = oa * 255;
    }
  }

  rect(x: number, y: number, w: number, h: number, c: string | null) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c);
  }

  hline(x: number, y: number, w: number, c: string) { this.rect(x, y, w, 1, c); }
  vline(x: number, y: number, h: number, c: string) { this.rect(x, y, 1, h, c); }

  /** Stamp an ASCII template; '.' and ' ' are transparent. */
  stamp(rows: string[], x: number, y: number, pal: Record<string, string | null>, flip = false) {
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch === '.' || ch === ' ') continue;
        const c = pal[ch];
        if (c === undefined) continue;
        this.px(flip ? x + row.length - 1 - i : x + i, y + j, c);
      }
    });
  }

  alpha(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.data[(y * this.w + x) * 4 + 3];
  }

  /** 1px outline around opaque pixels (4-neighbourhood). */
  outline(color: string, region?: { x: number; y: number; w: number; h: number }) {
    const r = region ?? { x: 0, y: 0, w: this.w, h: this.h };
    const marks: [number, number][] = [];
    for (let y = r.y; y < r.y + r.h; y++)
      for (let x = r.x; x < r.x + r.w; x++) {
        if (this.alpha(x, y) > 0) continue;
        const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
          const nx = x + dx, ny = y + dy;
          return nx >= r.x && ny >= r.y && nx < r.x + r.w && ny < r.y + r.h && this.alpha(nx, ny) > 127;
        });
        if (n) marks.push([x, y]);
      }
    for (const [x, y] of marks) this.px(x, y, color);
  }

  /** Darken pixels by a factor (used for cheap shading passes). */
  shade(x: number, y: number, w: number, h: number, f: number) {
    for (let j = y; j < y + h; j++)
      for (let i = x; i < x + w; i++) {
        if (i < 0 || j < 0 || i >= this.w || j >= this.h) continue;
        const k = (j * this.w + i) * 4;
        if (!this.data[k + 3]) continue;
        this.data[k] *= f; this.data[k + 1] *= f; this.data[k + 2] *= f;
      }
  }

  blit(src: Sprite, x: number, y: number, flip = false) {
    for (let j = 0; j < src.h; j++)
      for (let i = 0; i < src.w; i++) {
        const k = (j * src.w + i) * 4;
        if (!src.data[k + 3]) continue;
        const tx = flip ? x + src.w - 1 - i : x + i, ty = y + j;
        if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) continue;
        const d = (ty * this.w + tx) * 4;
        const a = src.data[k + 3] / 255;
        this.data[d] = src.data[k] * a + this.data[d] * (1 - a);
        this.data[d + 1] = src.data[k + 1] * a + this.data[d + 1] * (1 - a);
        this.data[d + 2] = src.data[k + 2] * a + this.data[d + 2] * (1 - a);
        this.data[d + 3] = Math.max(this.data[d + 3], src.data[k + 3]);
      }
  }
}

/** Deterministic hash noise for texture variation (no Math.random in art). */
export function noise(x: number, y: number, seed = 0): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export interface AtlasFrame { x: number; y: number; w: number; h: number }

/** Shelf-packs named sprites into a single RGBA buffer. */
export class AtlasBuilder {
  private items: { name: string; s: Sprite }[] = [];
  add(name: string, s: Sprite) {
    if (this.items.some((i) => i.name === name)) throw new Error(`duplicate sprite ${name}`);
    this.items.push({ name, s });
  }
  build(width = 1024): { w: number; h: number; data: Uint8ClampedArray; frames: Record<string, AtlasFrame> } {
    const frames: Record<string, AtlasFrame> = {};
    let x = 0, y = 0, rowH = 0;
    const sorted = [...this.items].sort((a, b) => b.s.h - a.s.h);
    for (const it of sorted) {
      if (x + it.s.w + 1 > width) { x = 0; y += rowH + 1; rowH = 0; }
      frames[it.name] = { x, y, w: it.s.w, h: it.s.h };
      x += it.s.w + 1;
      rowH = Math.max(rowH, it.s.h);
    }
    const h = y + rowH + 1;
    const out = new Sprite(width, h);
    for (const it of sorted) out.blit(it.s, frames[it.name].x, frames[it.name].y);
    return { w: width, h, data: out.data, frames };
  }
}
