import { describe, expect, it } from 'vitest';
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { buildAtlas } from '../src/art/atlas';
import { FRAME_NAMES, LOOKS, charFrameName } from '../src/art/characters';

function png(w: number, h: number, rgba: Uint8ClampedArray, scale = 1): Buffer {
  const W = w * scale, H = h * scale;
  const raw = Buffer.alloc((W * 4 + 1) * H);
  for (let y = 0; y < H; y++) {
    raw[y * (W * 4 + 1)] = 0;
    for (let x = 0; x < W; x++) {
      const si = ((Math.floor(y / scale) * w + Math.floor(x / scale)) * 4);
      const di = y * (W * 4 + 1) + 1 + x * 4;
      // composite over a mid background so transparency is visible
      const a = rgba[si + 3] / 255;
      const bg = ((Math.floor(x / 8) + Math.floor(y / 8)) % 2) ? 70 : 90;
      raw[di] = rgba[si] * a + bg * (1 - a); raw[di + 1] = rgba[si + 1] * a + bg * (1 - a); raw[di + 2] = rgba[si + 2] * a + bg * (1 - a); raw[di + 3] = 255;
    }
  }
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (b: Buffer) => { let c = 0xffffffff; for (const x of b) c = crcTable[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

describe('art atlas', () => {
  const atlas = buildAtlas();

  it('contains a complete pose set for every look', () => {
    LOOKS.forEach((_, i) => FRAME_NAMES.forEach((f) => expect(atlas.frames[charFrameName(i, f)]).toBeDefined()));
  });

  it('fits a single 1024-wide texture page and frames do not overlap', () => {
    expect(atlas.w).toBe(1024);
    expect(atlas.h).toBeLessThanOrEqual(2048);
    const fr = Object.values(atlas.frames);
    for (let i = 0; i < fr.length; i++)
      for (let j = i + 1; j < fr.length; j++) {
        const a = fr[i], b = fr[j];
        const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
        expect(overlap).toBe(false);
      }
  });

  it('writes a preview when ART_PREVIEW is set', () => {
    if (!process.env.ART_PREVIEW) return;
    mkdirSync(process.env.ART_PREVIEW, { recursive: true });
    writeFileSync(`${process.env.ART_PREVIEW}/atlas.png`, png(atlas.w, atlas.h, atlas.data, 1));
    // Zoomed sheet of a few characters for review.
    const pick = (name: string) => atlas.frames[name];
    const names = [0, 1, 4, 7, 10].flatMap((l) => ['down_idle0', 'down_walk1', 'down_carry0', 'side_walk1', 'up_walk1', 'work_low', 'work_high', 'press', 'cheer0'].map((f) => charFrameName(l, f)));
    const cols = 9, W = 24 * cols, H = 32 * Math.ceil(names.length / cols);
    const out = new Uint8ClampedArray(W * H * 4);
    names.forEach((n, k) => {
      const f = pick(n);
      const ox = (k % cols) * 24, oy = Math.floor(k / cols) * 32;
      for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
        const si = ((f.y + y) * atlas.w + f.x + x) * 4, di = ((oy + y) * W + ox + x) * 4;
        out.set(atlas.data.slice(si, si + 4), di);
      }
    });
    writeFileSync(`${process.env.ART_PREVIEW}/characters.png`, png(W, H, out, 4));
    const props = ['form_1', 'form_2', 'pack_1', 'pack_2', 'pack_3', 'shelf_blank', 'shelf_sleeve', 'tray', 'rack', 'counter', 'desk', 'crates', 'plant', 'sofa', 'floor0', 'floor1', 'wall0', 'window48_0', 'hatch_frame', 'item_blank_stock', 'item_prepared', 'item_sleeve', 'item_finished', 'bubble_box', 'armchair', 'lockers', 'boarded'];
    const PW = 512, PH = 160;
    const pout = new Uint8ClampedArray(PW * PH * 4);
    let px = 0, py = 0, rh = 0;
    for (const n of props) {
      const f = pick(n);
      if (px + f.w > PW) { px = 0; py += rh + 2; rh = 0; }
      for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
        const si = ((f.y + y) * atlas.w + f.x + x) * 4, di = ((py + y) * PW + px + x) * 4;
        if (py + y < PH) pout.set(atlas.data.slice(si, si + 4), di);
      }
      px += f.w + 2; rh = Math.max(rh, f.h);
    }
    writeFileSync(`${process.env.ART_PREVIEW}/props.png`, png(PW, PH, pout, 3));
  });
});
