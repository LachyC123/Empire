// Original tiles, furniture, workstation tiers, items and FX sprites painted in code.
import { P } from './palette';
import { Sprite, noise } from './pixel';

const O = P.outline;

function spr(w: number, h: number, paint: (s: Sprite) => void, outline = true): Sprite {
  const s = new Sprite(w, h);
  paint(s);
  if (outline) s.outline(O);
  return s;
}

// ------------------------------------------------------------------ tiles (16×16)

export function floorTile(v: number): Sprite {
  // Horizontal floorboards: 4 boards per tile, low-contrast seams, sparse end joints and grain.
  return spr(16, 16, (s) => {
    const tones = [P.floorA, P.floorB, '#bf8a51', P.floorC];
    for (let row = 0; row < 4; row++) {
      const y = row * 4;
      const base = tones[(row * 3 + v) % 4];
      s.rect(0, y, 16, 3, base);
      s.hline(0, y + 3, 16, '#8a5a32');
      s.hline(0, y, 16, '#d9a86e40');
      // one end joint on some boards only
      if ((row + v) % 3 === 0) {
        const jx = 3 + ((row * 5 + v * 7) % 10);
        s.vline(jx, y, 3, '#8a5a32');
        s.px(jx + 1, y, '#d9a86e60');
      }
      // grain
      for (let x = 0; x < 16; x++) if (noise(x + v * 16, y, 3) > 0.9) s.hline(x, y + 1 + (x % 2), 2, '#a9733f');
    }
  }, false);
}

export function wornTile(): Sprite {
  const s = floorTile(1);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (y % 4 !== 3 && noise(x, y, 9) > 0.45) s.px(x, y, P.floorWorn + '40');
  return s;
}

export function annexTile(v: number): Sprite {
  return spr(16, 16, (s) => {
    for (let ty = 0; ty < 2; ty++)
      for (let tx = 0; tx < 2; tx++) {
        const c = (tx + ty + v) % 2 ? P.annexA : P.annexB;
        s.rect(tx * 8, ty * 8, 8, 8, c);
        s.hline(tx * 8, ty * 8 + 7, 8, P.annexSeam);
        s.vline(tx * 8 + 7, ty * 8, 8, P.annexSeam);
        s.px(tx * 8 + 1, ty * 8 + 1, '#ffffff22');
      }
    for (let i = 0; i < 6; i++) s.px(Math.floor(noise(i, v, 4) * 16), Math.floor(noise(v, i, 5) * 16), P.annexDark);
  }, false);
}

export function wallFace(v: number, annex = false): Sprite {
  return spr(16, 16, (s) => {
    const a = annex ? '#5b4a3f' : P.wallA, b = annex ? '#6a574a' : P.wallB, d = annex ? '#3f332c' : P.wallDark;
    s.rect(0, 0, 16, 16, a);
    // vertical boarding
    for (let x = 0; x < 16; x += 4) { s.vline(x, 0, 11, d); s.vline(x + 1, 0, 11, b); }
    s.hline(0, 0, 16, d);
    // chair rail + wainscot + skirting
    s.hline(0, 10, 16, P.trim);
    s.hline(0, 11, 16, P.trimShade);
    s.rect(0, 12, 16, 3, annex ? '#4a3c33' : '#294f53');
    s.hline(0, 15, 16, P.skirting);
    if (v === 1) { s.px(6, 4, d); s.px(7, 5, d); }
    if (v === 2) { s.rect(9, 3, 3, 2, d + '88'); }
  }, false);
}

export function wallTop(edge: 'bottom' | 'top' | 'none' | 'left' | 'right'): Sprite {
  return spr(16, 16, (s) => {
    s.rect(0, 0, 16, 16, P.wallTop);
    for (let i = 0; i < 10; i++) s.px(Math.floor(noise(i, 1, 7) * 16), Math.floor(noise(1, i, 7) * 16), '#24393d');
    if (edge === 'bottom') { s.hline(0, 15, 16, P.wallTopEdge); s.hline(0, 14, 16, '#223b3f'); }
    if (edge === 'top') { s.hline(0, 0, 16, P.wallTopEdge); s.hline(0, 1, 16, '#223b3f'); }
    if (edge === 'left') { s.vline(0, 0, 16, P.wallTopEdge); }
    if (edge === 'right') { s.vline(15, 0, 16, P.wallTopEdge); }
  }, false);
}

export function voidTile(): Sprite {
  return spr(16, 16, (s) => {
    s.rect(0, 0, 16, 16, P.void);
    for (let i = 0; i < 4; i++) s.px(Math.floor(noise(i, 3, 2) * 16), Math.floor(noise(3, i, 2) * 16), '#1a1520');
  }, false);
}

export function doormat(): Sprite {
  return spr(16, 10, (s) => {
    s.rect(1, 1, 14, 8, '#7a3a2c');
    s.rect(2, 2, 12, 6, '#9a4b37');
    for (let x = 3; x < 13; x += 2) s.vline(x, 3, 4, '#7a3a2c');
  });
}

export function streetDoor(open: boolean): Sprite {
  // Seen from inside/top: frame posts with the door leaf.
  return spr(16, 16, (s) => {
    s.rect(0, 0, 16, 16, P.wallTop);
    s.rect(2, 0, 12, 16, open ? '#3b4a63' : P.woodDark);
    if (open) {
      s.rect(3, 2, 10, 12, '#4c6585');
      s.rect(5, 4, 2, 8, '#ffd27a40');
      s.rect(2, 0, 3, 16, P.wood);
    } else {
      s.rect(3, 1, 10, 14, P.wood);
      s.hline(3, 5, 10, P.woodDark);
      s.hline(3, 10, 10, P.woodDark);
      s.px(11, 8, P.cash);
    }
    s.vline(1, 0, 16, P.trim);
    s.vline(14, 0, 16, P.trim);
  }, false);
}

export function backDoor(open: boolean): Sprite {
  return spr(16, 32, (s) => {
    s.rect(0, 0, 16, 32, P.wallTop);
    s.rect(3, 2, 10, 28, open ? '#2c3b55' : P.metalDark);
    if (!open) for (let y = 3; y < 29; y += 3) s.hline(4, y, 8, P.metal);
    else s.rect(3, 2, 3, 28, P.metal);
    s.vline(2, 1, 30, P.copper);
    s.vline(13, 1, 30, P.copper);
  }, false);
}

// ------------------------------------------------------------------ wall art (drawn on the face row)

export function windowArt(w: number, frame: number): Sprite {
  return spr(w, 14, (s) => {
    s.rect(0, 0, w, 14, P.woodDark);
    s.rect(1, 1, w - 2, 11, P.night);
    // distant city silhouette + neon
    for (let x = 1; x < w - 1; x++) {
      const hgt = 3 + Math.floor(noise(x >> 2, 0, 11) * 5);
      s.vline(x, 12 - hgt, hgt, P.nightB);
      if (noise(x, 1, 12) > 0.8) s.px(x, 12 - hgt + 1, P.neonB);
    }
    s.px(4, 4, P.neon); s.px(5, 4, P.neon);
    // rain streaks, animated by frame
    for (let i = 0; i < w; i += 3) {
      const y = (i * 5 + frame * 3) % 11;
      s.px(i + 1, 1 + y, P.rain);
      s.px(i + 1, 1 + ((y + 1) % 11), P.rain + '80');
    }
    // mullions + sill
    for (let x = 0; x < w; x += 16) s.vline(x, 0, 13, P.wood);
    s.vline(w - 1, 0, 13, P.wood);
    s.hline(0, 6, w, P.wood);
    s.hline(0, 12, w, P.trim);
    s.hline(0, 13, w, P.trimShade);
  }, false);
}

export function hatchBack(): Sprite {
  return spr(48, 13, (s) => {
    s.rect(0, 0, 48, 13, '#18233a');
    for (let x = 0; x < 48; x++) if (noise(x, 2, 6) > 0.7) s.px(x, Math.floor(noise(x, 3, 6) * 4), '#24365a');
    s.rect(0, 9, 48, 4, '#212a3a');
    s.px(40, 2, P.neonB); s.px(41, 2, P.neonB);
  }, false);
}

export function hatchFrame(): Sprite {
  return spr(48, 16, (s) => {
    s.rect(0, 0, 48, 2, P.copperDark);
    s.rect(0, 0, 2, 13, P.copperDark);
    s.rect(46, 0, 2, 13, P.copperDark);
    s.hline(0, 0, 48, P.copper);
    // rolled-up shutter
    s.rect(2, 2, 44, 3, P.metal);
    s.hline(2, 3, 44, P.metalDark);
    s.hline(2, 4, 44, P.metalLight);
    // sill/counter edge
    s.rect(0, 13, 48, 3, P.cream);
    s.hline(0, 15, 48, P.creamDark);
    // OPEN sign
    s.rect(36, 6, 9, 5, P.neon + 'cc');
    s.rect(37, 7, 7, 3, '#ffc2d0');
  }, false);
}

export function posterArt(): Sprite {
  return spr(12, 13, (s) => {
    s.rect(0, 0, 12, 13, P.cream);
    s.rect(1, 1, 10, 7, P.glowDeep);
    s.rect(4, 2, 4, 5, P.glow);
    s.px(5, 3, P.glowWhite);
    s.rect(1, 9, 10, 1, P.stamp);
    s.rect(2, 11, 8, 1, P.creamDark);
  });
}

export function clockArt(): Sprite {
  return spr(10, 10, (s) => {
    s.rect(1, 0, 8, 10, P.copper);
    s.rect(0, 1, 10, 8, P.copper);
    s.rect(1, 1, 8, 8, P.cream);
    s.vline(5, 2, 3, O);
    s.hline(5, 5, 3, O);
  });
}

export function noticeboard(): Sprite {
  return spr(30, 12, (s) => {
    s.rect(0, 0, 30, 12, '#9a6a3c');
    s.rect(1, 1, 28, 10, '#c49a62');
    s.rect(3, 2, 6, 7, P.cream); s.rect(11, 3, 7, 5, '#f6d873'); s.rect(20, 2, 7, 8, P.white);
    s.px(6, 2, P.red); s.px(14, 3, P.blue); s.px(23, 2, P.red);
    s.hline(4, 4, 4, P.creamDark); s.hline(4, 6, 3, P.creamDark); s.hline(21, 4, 5, P.creamDark); s.hline(21, 6, 4, P.creamDark);
  });
}

// ------------------------------------------------------------------ storage

export function shelfWood(): Sprite {
  return spr(32, 30, (s) => {
    s.rect(1, 0, 30, 29, P.woodDark);
    s.rect(2, 1, 28, 27, '#5a3622');
    for (const y of [9, 18, 27]) { s.rect(1, y, 30, 2, P.woodLight); s.hline(1, y + 1, 30, P.wood); }
    s.rect(1, 0, 2, 29, P.wood); s.rect(29, 0, 2, 29, P.wood);
    s.px(3, 2, P.woodDeep); s.px(28, 12, P.woodDeep);
  });
}

export function shelfMetal(): Sprite {
  return spr(32, 30, (s) => {
    s.rect(2, 1, 28, 27, '#3b3f48');
    for (const y of [9, 18, 27]) { s.rect(1, y, 30, 2, P.metalLight); s.hline(1, y + 1, 30, P.metal); }
    s.rect(1, 0, 2, 29, P.copper); s.rect(29, 0, 2, 29, P.copper);
    s.vline(1, 0, 29, P.copperLight);
    s.px(4, 3, P.metalDark);
  });
}

export function trayTable(): Sprite {
  return spr(32, 20, (s) => {
    s.rect(1, 4, 30, 9, P.cream);
    s.hline(1, 4, 30, P.white);
    s.rect(1, 13, 30, 3, P.creamDark);
    s.rect(3, 5, 26, 7, '#c9b48a');
    s.rect(4, 6, 24, 5, '#d8c69c');
    s.rect(2, 16, 2, 4, P.woodDark); s.rect(28, 16, 2, 4, P.woodDark);
  });
}

export function goodsRack(): Sprite {
  return spr(32, 22, (s) => {
    s.rect(1, 2, 30, 14, P.woodDark);
    s.rect(2, 3, 28, 12, '#4a2c1c');
    s.rect(1, 9, 30, 1, P.woodLight);
    s.rect(1, 15, 30, 2, P.woodLight);
    s.hline(1, 2, 30, P.woodLight);
    s.rect(2, 17, 2, 5, P.woodDark); s.rect(28, 17, 2, 5, P.woodDark);
    s.rect(14, 18, 4, 3, P.cream); // label
    s.hline(15, 19, 2, P.stamp);
  });
}

// ------------------------------------------------------------------ workstations

/** Tier 1 forming bench: rough planks, stone mould, mallet. */
export function formBench1(): Sprite {
  return spr(32, 22, (s) => {
    s.rect(0, 3, 32, 9, P.woodLight);
    for (let x = 0; x < 32; x += 6) s.vline(x, 3, 9, P.wood);
    s.hline(0, 3, 32, '#c58b5c');
    s.rect(0, 12, 32, 4, P.woodDark);
    s.rect(1, 16, 3, 6, P.woodDeep); s.rect(28, 16, 3, 6, P.woodDeep);
    s.rect(12, 4, 9, 6, '#6d6a7a'); s.rect(13, 5, 7, 4, '#55526a'); s.rect(14, 6, 5, 2, '#3e3b52'); // mould
    s.rect(24, 6, 6, 2, P.woodDeep); s.rect(27, 4, 3, 5, P.woodDark); // mallet
    s.px(4, 8, P.woodDark); s.px(7, 5, P.woodDark);
  });
}

/** Tier 2 forming bench: tidy top, copper clamp fixture and lamp — visibly better tools. */
export function formBench2(): Sprite {
  return spr(32, 28, (s) => {
    // lamp arm
    s.rect(3, 0, 2, 9, P.copperDark); s.rect(3, 0, 9, 2, P.copperDark); s.rect(10, 1, 5, 3, P.copper); s.px(12, 4, P.yellow);
    s.rect(0, 9, 32, 9, P.cream);
    s.hline(0, 9, 32, P.white);
    s.rect(0, 18, 32, 4, P.copperDark);
    s.hline(0, 18, 32, P.copper);
    s.rect(1, 22, 3, 6, P.metalDark); s.rect(28, 22, 3, 6, P.metalDark);
    s.rect(11, 10, 11, 7, P.metalDark); s.rect(12, 11, 9, 5, P.metal); s.rect(14, 12, 5, 3, P.glowDeep); // fixture + glowing mould
    s.rect(9, 11, 2, 5, P.copper); s.rect(22, 11, 2, 5, P.copper); // clamps
    s.rect(25, 12, 5, 3, P.metalLight); // tool rail
    s.rect(2, 12, 6, 4, '#c9b48a');
  });
}

export function packTable1(): Sprite {
  return spr(32, 22, (s) => {
    s.rect(0, 3, 32, 9, P.woodLight);
    s.hline(0, 3, 32, '#c58b5c');
    for (let x = 3; x < 32; x += 7) s.vline(x, 3, 9, P.wood);
    s.rect(0, 12, 32, 4, P.woodDark);
    s.rect(1, 16, 3, 6, P.woodDeep); s.rect(28, 16, 3, 6, P.woodDeep);
    s.rect(1, 4, 7, 5, P.sleeveShade); s.rect(2, 5, 5, 3, P.sleeve); // paper stack
    s.rect(24, 5, 6, 4, '#a07a4a'); s.px(26, 6, '#d6b98a'); // twine spool
  });
}

/** Tier 2: sleeve dispenser and lever press (lever drawn separately so it animates). */
export function packTable2(): Sprite {
  return spr(32, 26, (s) => {
    s.rect(0, 7, 32, 9, P.cream);
    s.hline(0, 7, 32, P.white);
    s.rect(0, 16, 32, 4, P.woodDark);
    s.hline(0, 16, 32, P.wood);
    s.rect(1, 20, 3, 6, P.woodDeep); s.rect(28, 20, 3, 6, P.woodDeep);
    // dispenser: copper box with sleeve slot
    s.rect(1, 0, 9, 12, P.copperDark); s.rect(2, 1, 7, 10, P.copper); s.rect(3, 3, 5, 2, P.sleeve); s.hline(3, 9, 5, P.copperLight);
    // press base
    s.rect(22, 9, 9, 6, P.metalDark); s.rect(23, 10, 7, 4, P.metal); s.rect(24, 4, 2, 6, P.metalDark);
    s.rect(12, 9, 8, 5, '#d8c69c');
  });
}

export function lever(down: boolean): Sprite {
  return spr(10, 10, (s) => {
    if (down) { s.rect(0, 6, 8, 2, P.metalLight); s.rect(0, 5, 3, 3, P.red); }
    else { s.rect(5, 0, 2, 7, P.metalLight); s.rect(4, 0, 4, 3, P.red); }
    s.rect(5, 6, 3, 3, P.metalDark);
  });
}

/** Tier 3: motorised sealer housing with a belt (belt drawn separately to animate). */
export function packTable3(): Sprite {
  return spr(32, 28, (s) => {
    s.rect(0, 9, 32, 9, P.metal);
    s.hline(0, 9, 32, P.metalLight);
    s.rect(0, 18, 32, 4, P.metalDark);
    s.rect(1, 22, 3, 6, P.metalDeep); s.rect(28, 22, 3, 6, P.metalDeep);
    s.rect(1, 2, 9, 12, P.copperDark); s.rect(2, 3, 7, 10, P.copper); s.rect(3, 5, 5, 2, P.sleeve);
    s.rect(20, 0, 11, 12, P.metalDark); s.rect(21, 1, 9, 9, '#4e5862'); s.rect(22, 2, 7, 3, '#2a3036'); // sealer hood
    s.rect(23, 6, 5, 2, P.stamp);
    s.rect(11, 11, 18, 5, P.metalDeep); // belt bed
  });
}

export function belt(frame: number): Sprite {
  return spr(18, 5, (s) => {
    s.rect(0, 0, 18, 5, '#2b2f35');
    for (let x = -4; x < 18; x += 4) s.vline(x + frame, 1, 3, '#515862');
  }, false);
}

export function indicator(on: boolean): Sprite {
  return spr(4, 4, (s) => { s.rect(0, 0, 4, 4, on ? '#7dff9a' : '#3b5a43'); s.px(1, 1, on ? '#eaffef' : '#4f7a5a'); }, false);
}

export function counterArt(): Sprite {
  return spr(48, 18, (s) => {
    s.rect(0, 0, 48, 6, P.cream);
    s.hline(0, 0, 48, P.white);
    s.rect(0, 6, 48, 10, P.wood);
    for (let x = 4; x < 48; x += 8) s.vline(x, 7, 8, P.woodDark);
    s.hline(0, 6, 48, P.woodDark);
    s.rect(36, 1, 4, 3, P.copperLight); s.px(37, 0, P.copper); // bell
    s.rect(4, 1, 8, 3, P.creamDark); // ledger book
    s.hline(5, 2, 6, P.cream);
  });
}

export function buildPad(): Sprite {
  return spr(32, 16, (s) => {
    for (let x = 0; x < 32; x += 4) { s.hline(x, 0, 2, '#ffe9a8'); s.hline(x, 15, 2, '#ffe9a8'); }
    for (let y = 0; y < 16; y += 4) { s.vline(0, y, 2, '#ffe9a8'); s.vline(31, y, 2, '#ffe9a8'); }
    s.rect(15, 4, 2, 8, '#ffe9a8');
    s.rect(12, 7, 8, 2, '#ffe9a8');
  }, false);
}

// ------------------------------------------------------------------ decor

export function desk(): Sprite {
  return spr(32, 24, (s) => {
    s.rect(0, 6, 32, 9, P.woodLight);
    s.hline(0, 6, 32, '#c58b5c');
    s.rect(0, 15, 32, 5, P.woodDark);
    s.rect(1, 20, 3, 4, P.woodDeep); s.rect(28, 20, 3, 4, P.woodDeep);
    s.rect(3, 7, 9, 6, P.white); s.rect(5, 8, 8, 6, P.cream); s.hline(6, 10, 5, P.creamDark); s.hline(6, 12, 4, P.creamDark);
    s.rect(16, 8, 4, 4, P.red); s.rect(17, 9, 2, 2, '#5a2a1a'); // mug
    s.rect(24, 0, 2, 9, P.copperDark); s.rect(21, 0, 7, 3, P.copper); s.px(24, 3, P.yellow); // lamp
  });
}

export function armchair(): Sprite {
  return spr(18, 22, (s) => {
    s.rect(1, 2, 16, 10, '#7a3f4f'); s.rect(3, 3, 12, 7, '#9a5466');
    s.rect(0, 9, 18, 9, '#7a3f4f'); s.rect(3, 10, 12, 5, '#b06578');
    s.rect(1, 18, 2, 4, P.woodDeep); s.rect(15, 18, 2, 4, P.woodDeep);
  });
}

export function crates(): Sprite {
  return spr(32, 26, (s) => {
    const crate = (x: number, y: number, w: number, h: number) => {
      s.rect(x, y, w, h, P.wood); s.rect(x + 1, y + 1, w - 2, h - 2, P.woodLight);
      s.hline(x, y + Math.floor(h / 2), w, P.wood);
      s.vline(x + 2, y, h, P.wood); s.vline(x + w - 3, y, h, P.wood);
    };
    crate(0, 10, 16, 15); crate(15, 12, 16, 13); crate(5, 0, 14, 11);
    s.rect(8, 4, 6, 3, P.cream); s.px(10, 5, P.stamp);
  });
}

export function plant(): Sprite {
  return spr(16, 26, (s) => {
    s.rect(4, 17, 8, 8, P.copper); s.hline(4, 17, 8, P.copperLight); s.rect(5, 24, 6, 1, P.copperDark);
    const leaf = (x: number, y: number, c: string) => { s.rect(x, y, 3, 5, c); s.px(x + 1, y - 1, c); };
    leaf(2, 9, P.plantDark); leaf(10, 8, P.plantDark); leaf(6, 3, P.plant); leaf(3, 5, P.plant); leaf(9, 4, P.plantLight); leaf(6, 10, P.plantLight); leaf(11, 12, P.plant);
  });
}

export function binArt(): Sprite {
  return spr(12, 14, (s) => {
    s.rect(1, 2, 10, 12, P.metalDark); s.rect(0, 1, 12, 2, P.metal); s.vline(3, 4, 9, P.metal); s.vline(7, 4, 9, P.metal);
    s.rect(4, 0, 4, 2, P.sleeve);
  });
}

export function floorLamp(): Sprite {
  return spr(12, 34, (s) => {
    s.rect(1, 0, 10, 8, '#e8c37a'); s.rect(2, 1, 8, 6, '#f6dc9d'); s.hline(1, 7, 10, '#c79c4f');
    s.vline(5, 8, 22, P.copperDark); s.vline(6, 8, 22, P.copper);
    s.rect(2, 30, 8, 3, P.copperDark);
  });
}

export function sofa(): Sprite {
  return spr(34, 22, (s) => {
    s.rect(1, 2, 32, 9, '#3d6e8f'); s.rect(3, 3, 28, 6, '#4f86ab');
    s.rect(0, 8, 34, 10, '#3d6e8f'); s.rect(3, 9, 13, 6, '#6aa0c4'); s.rect(18, 9, 13, 6, '#6aa0c4');
    s.rect(1, 18, 2, 4, P.woodDeep); s.rect(31, 18, 2, 4, P.woodDeep);
    s.rect(5, 4, 6, 4, P.yellow); // cushion
  });
}

export function kettleTable(): Sprite {
  return spr(16, 22, (s) => {
    s.rect(0, 8, 16, 7, P.woodLight); s.hline(0, 8, 16, '#c58b5c'); s.rect(0, 15, 16, 2, P.woodDark);
    s.rect(1, 17, 2, 5, P.woodDeep); s.rect(13, 17, 2, 5, P.woodDeep);
    s.rect(3, 1, 7, 8, P.metalLight); s.rect(4, 2, 5, 6, P.metal); s.rect(10, 3, 2, 2, P.metalLight); s.rect(5, 0, 3, 1, P.metalDark);
    s.rect(11, 6, 3, 3, P.cream);
  });
}

export function lockers(): Sprite {
  return spr(16, 32, (s) => {
    s.rect(0, 0, 16, 31, P.blueDark); s.rect(1, 1, 6, 29, P.blue); s.rect(9, 1, 6, 29, P.blue);
    for (const x of [2, 10]) for (let y = 3; y < 10; y += 2) s.hline(x, y, 4, P.blueDark);
    s.px(6, 16, P.metalLight); s.px(14, 16, P.metalLight);
  });
}

export function boardedOpening(): Sprite {
  return spr(16, 34, (s) => {
    s.rect(0, 0, 16, 34, '#241a1e');
    for (const y of [3, 11, 19, 27]) { s.rect(0, y, 16, 5, P.wood); s.hline(0, y, 16, P.woodLight); s.px(2, y + 2, O); s.px(13, y + 2, O); }
    s.rect(3, 14, 10, 6, P.cream); s.hline(5, 16, 6, P.stamp); s.hline(5, 18, 4, P.creamDark); // "TO LET" note
  });
}

// ------------------------------------------------------------------ items & fx

export function itemBlank(): Sprite {
  return spr(8, 7, (s) => {
    s.rect(1, 1, 6, 5, P.blank); s.hline(1, 1, 6, P.blankLight); s.vline(6, 1, 5, P.blankDark); s.hline(1, 5, 6, P.blankDark);
  });
}
export function itemPrepared(): Sprite {
  return spr(8, 8, (s) => {
    s.rect(3, 1, 2, 6, P.glowMid); s.rect(2, 2, 4, 4, P.glowMid); s.rect(3, 2, 2, 3, P.glow); s.px(3, 2, P.glowWhite); s.px(1, 3, P.glowDeep); s.px(6, 4, P.glowDeep);
  });
}
export function itemSleeve(): Sprite {
  return spr(8, 7, (s) => {
    s.rect(1, 1, 6, 5, P.sleeve); s.hline(1, 3, 6, P.sleeveShade); s.vline(6, 1, 5, P.sleeveShade);
  });
}
export function itemFinished(): Sprite {
  return spr(9, 8, (s) => {
    s.rect(1, 1, 7, 6, P.sleeve); s.vline(7, 1, 6, P.sleeveShade); s.hline(1, 6, 7, P.sleeveShade);
    s.rect(3, 1, 3, 2, P.glow); s.px(4, 1, P.glowWhite);
    s.rect(3, 4, 3, 2, P.stamp); s.px(4, 4, '#ff8a80');
  });
}
export function itemCrate(): Sprite {
  return spr(14, 12, (s) => {
    s.rect(0, 1, 14, 10, P.wood); s.rect(1, 2, 12, 8, P.woodLight); s.hline(0, 5, 14, P.wood); s.vline(3, 1, 10, P.wood); s.vline(10, 1, 10, P.wood);
    s.rect(5, 3, 4, 2, P.blank); s.rect(5, 7, 4, 2, P.sleeve);
  });
}

export function shadow(): Sprite {
  return spr(14, 6, (s) => {
    s.rect(2, 0, 10, 6, '#00000040'); s.rect(0, 1, 14, 4, '#00000040'); s.rect(3, 1, 8, 4, '#00000030');
  }, false);
}

export function bubble(icon: 'box' | 'full' | 'coin' | 'wait' | 'excl' | 'heart' | 'star'): Sprite {
  return spr(13, 14, (s) => {
    s.rect(1, 0, 11, 10, P.white); s.rect(0, 1, 13, 8, P.white); s.rect(4, 10, 3, 2, P.white); s.px(4, 12, P.white);
    switch (icon) {
      case 'box': s.rect(3, 3, 7, 5, P.woodLight); s.hline(3, 5, 7, P.wood); s.px(6, 2, P.red); s.px(6, 1, P.red); break;
      case 'full': s.rect(3, 2, 7, 2, P.sleeveShade); s.rect(3, 4, 7, 2, P.sleeve); s.rect(3, 6, 7, 2, P.sleeveShade); break;
      case 'coin': s.rect(4, 2, 5, 6, P.cash); s.rect(3, 3, 7, 4, P.cash); s.vline(6, 3, 4, P.cashDark); break;
      case 'wait': s.px(3, 5, O); s.px(6, 5, O); s.px(9, 5, O); break;
      case 'excl': s.rect(6, 2, 2, 4, P.red); s.rect(6, 7, 2, 1, P.red); break;
      case 'heart': s.rect(3, 3, 3, 3, P.neon); s.rect(7, 3, 3, 3, P.neon); s.rect(4, 5, 5, 2, P.neon); s.px(6, 7, P.neon); break;
      case 'star': s.rect(6, 1, 1, 7, P.yellow); s.rect(3, 4, 7, 1, P.yellow); s.rect(5, 3, 3, 3, P.yellow); break;
    }
  });
}

export function particle(kind: 'spark' | 'fleck' | 'dust' | 'coin' | 'glint'): Sprite {
  switch (kind) {
    case 'spark': return spr(3, 3, (s) => { s.px(1, 0, '#fff3b0'); s.px(0, 1, '#fff3b0'); s.px(1, 1, '#ffffff'); s.px(2, 1, '#fff3b0'); s.px(1, 2, '#fff3b0'); }, false);
    case 'fleck': return spr(2, 2, (s) => { s.rect(0, 0, 2, 2, P.sleeve); s.px(1, 1, P.sleeveShade); }, false);
    case 'dust': return spr(4, 4, (s) => { s.rect(1, 0, 2, 4, '#d9c7a8aa'); s.rect(0, 1, 4, 2, '#d9c7a8aa'); }, false);
    case 'coin': return spr(7, 7, (s) => { s.rect(1, 0, 5, 7, P.cash); s.rect(0, 1, 7, 5, P.cash); s.vline(3, 1, 5, P.cashDark); s.px(2, 1, P.cashLight); }, true);
    case 'glint': return spr(5, 5, (s) => { s.vline(2, 0, 5, '#e6fff8'); s.hline(0, 2, 5, '#e6fff8'); s.px(2, 2, '#ffffff'); }, false);
  }
}

export function selectionCorner(): Sprite {
  return spr(5, 5, (s) => { s.hline(0, 0, 5, '#fff3b0'); s.vline(0, 0, 5, '#fff3b0'); s.px(1, 1, '#fff3b0'); }, false);
}
