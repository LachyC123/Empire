// Original character sprites painted in code: 24×32 frames, feet pivot at (12, 30).
// Each look (player, named workers, supplier, buyers) gets a full set of poses so a new
// hire is visibly a different person.
import { P } from './palette';
import { Sprite } from './pixel';

export const CHAR_W = 24;
export const CHAR_H = 32;

type HairStyle = 'short' | 'bun' | 'long' | 'cap' | 'curly' | 'bald';

export interface Look {
  name: string;
  skin: string; skinS: string;
  hair: string; hairS: string; style: HairStyle;
  shirt: string; shirtS: string;
  pants: string; pantsS: string;
  shoes: string;
  apron?: string; apronS?: string;
  cap?: string; capS?: string;
  beard?: boolean;
}

export const LOOKS: Look[] = [
  // 0 player — teal jacket, dark short hair
  { name: 'player', skin: '#e9b98f', skinS: '#c98f68', hair: '#2a1d1b', hairS: '#120c0b', style: 'short', shirt: '#2e7f7a', shirtS: '#1f5a57', pants: '#3a3550', pantsS: '#28243a', shoes: '#1b1418' },
  // 1 Mina — black bun, cream shirt, teal apron
  { name: 'Mina', skin: '#f3cfaa', skinS: '#d5a47e', hair: '#1c1720', hairS: '#0d0a10', style: 'bun', shirt: '#efe1bd', shirtS: '#cdb98d', pants: '#4b3b3a', pantsS: '#33282a', shoes: '#2a1c18', apron: '#3d8f88', apronS: '#2b6a65' },
  // 2 Tavi — short auburn, mustard shirt, teal apron
  { name: 'Tavi', skin: '#c48a5f', skinS: '#a06a45', hair: '#7a3b22', hairS: '#552615', style: 'curly', shirt: '#d9a441', shirtS: '#b07f27', pants: '#3a4560', pantsS: '#283146', shoes: '#22181a', apron: '#3d8f88', apronS: '#2b6a65' },
  // 3 Odette — long silver hair, plum shirt, teal apron
  { name: 'Odette', skin: '#8d5a3b', skinS: '#6c4029', hair: '#d9d3cf', hairS: '#a9a29f', style: 'long', shirt: '#7a3f6e', shirtS: '#57294f', pants: '#2f2c3a', pantsS: '#201e28', shoes: '#1a1418', apron: '#3d8f88', apronS: '#2b6a65' },
  // 4 Jules — curly ginger, striped red shirt, ochre apron
  { name: 'Jules', skin: '#f1c8a2', skinS: '#d29e78', hair: '#d1652d', hairS: '#a3461b', style: 'curly', shirt: '#c8463d', shirtS: '#962f2a', pants: '#2f3e57', pantsS: '#212c40', shoes: '#241a16', apron: '#d9a441', apronS: '#a97a24' },
  // 5 Rook — buzz cut, green shirt, ochre apron
  { name: 'Rook', skin: '#a8714a', skinS: '#845333', hair: '#2a1e17', hairS: '#160f0b', style: 'short', shirt: '#4f7a48', shirtS: '#375833', pants: '#3b3330', pantsS: '#28221f', shoes: '#1d1513', apron: '#d9a441', apronS: '#a97a24' },
  // 6 Pim — blonde bun, blue shirt, ochre apron
  { name: 'Pim', skin: '#f4d2b4', skinS: '#d8ab89', hair: '#e2bd5c', hairS: '#b38f35', style: 'bun', shirt: '#4f7fb8', shirtS: '#35598a', pants: '#4a3a4f', pantsS: '#332837', shoes: '#231a1d', apron: '#d9a441', apronS: '#a97a24' },
  // 7 Dex — red cap, waistcoat
  { name: 'Dex', skin: '#7a4b31', skinS: '#5c3520', hair: '#1a1210', hairS: '#0c0807', style: 'cap', shirt: '#efe1bd', shirtS: '#cdb98d', pants: '#2b2a35', pantsS: '#1d1c25', shoes: '#151012', apron: '#9e3330', apronS: '#74231f', cap: '#c8463d', capS: '#8f2c28' },
  // 8 spare
  { name: 'spare1', skin: '#e0a982', skinS: '#bd845e', hair: '#5a3b8a', hairS: '#3d2762', style: 'long', shirt: '#e08a3c', shirtS: '#b0652a', pants: '#2f3346', pantsS: '#212433', shoes: '#1a1416' },
  // 9 spare
  { name: 'spare2', skin: '#b67a52', skinS: '#915a37', hair: '#e8e0d0', hairS: '#bab2a3', style: 'bald', shirt: '#6a6f7a', shirtS: '#4b4f58', pants: '#3a2f2a', pantsS: '#28201c', shoes: '#16100e' },
  // 10 Oren — supplier: brown jacket, beanie, beard
  { name: 'Oren', skin: '#d39b74', skinS: '#b07752', hair: '#5a3826', hairS: '#3d2418', style: 'cap', shirt: '#7a5236', shirtS: '#583a25', pants: '#3c4252', pantsS: '#2a2f3b', shoes: '#1c1512', cap: '#3d6e8f', capS: '#2a4f68', beard: true },
  // 11–14 buyers
  { name: 'buyer1', skin: '#f0c49c', skinS: '#cf9c73', hair: '#3b2a24', hairS: '#241815', style: 'long', shirt: '#5b4a8a', shirtS: '#3f3263', pants: '#222', pantsS: '#111', shoes: '#111' },
  { name: 'buyer2', skin: '#8a5636', skinS: '#673d23', hair: '#121010', hairS: '#000000', style: 'short', shirt: '#2f6e4f', shirtS: '#214e38', pants: '#222', pantsS: '#111', shoes: '#111', beard: true },
  { name: 'buyer3', skin: '#e6b38c', skinS: '#c48d66', hair: '#c9c1b5', hairS: '#9b9488', style: 'cap', shirt: '#9a5a2e', shirtS: '#714020', pants: '#222', pantsS: '#111', shoes: '#111', cap: '#2b2f3f', capS: '#1b1e29' },
  { name: 'buyer4', skin: '#c08560', skinS: '#9b6342', hair: '#a8432d', hairS: '#7a2e1e', style: 'bun', shirt: '#d6c49b', shirtS: '#b3a073', pants: '#222', pantsS: '#111', shoes: '#111' }
];

const O = P.outline;

// Heads are 10×10, placed at (7, 4). S skin, s skin shade, H hair, h hair shade, E eye, B blush, C cap, c cap shade, W white highlight.
const HEAD: Record<'down' | 'up' | 'side', Partial<Record<HairStyle, string[]>>> = {
  down: {
    short: ['..HHHHHH..', '.HHHHHHHH.', 'HHHhHHhHHH', 'HHSSSSSSHH', 'HSSSSSSSSH', 'HSESSSSESs', 'SSSSSSSSSs', '.SBSSSSBs.', '..SSSSSs..', '...ssss...'],
    bun: ['...hHHh...', '..HHHHHH..', '.HHHHHHHH.', 'HHHSSSSHHH', 'HSSSSSSSSH', 'HSESSSSESs', 'SSSSSSSSSs', '.SBSSSSBs.', '..SSSSSs..', '...ssss...'],
    long: ['..HHHHHH..', '.HHHHHHHH.', 'HHHHhhHHHH', 'HHSSSSSSHH', 'HHSSSSSSHH', 'HHESSSSEHH', 'HHSSSSSSHh', 'HHBSSSSBHh', 'Hh.SSSs.hh', 'h..ssss..h'],
    cap: ['..CCCCCC..', '.CCCCCCCC.', 'CCCCCCCCCC', 'cccccccccc', 'HSSSSSSSSH', 'HSESSSSESs', 'SSSSSSSSSs', '.SBSSSSBs.', '..SSSSSs..', '...ssss...'],
    curly: ['.H.HH.HH..', 'HHHHHHHHH.', 'HHhHHHhHHH', 'HHSSSSSSHH', 'HSSSSSSSSH', 'HSESSSSESs', 'SSSSSSSSSs', '.SBSSSSBs.', '..SSSSSs..', '...ssss...'],
    bald: ['...SSSS...', '.SSSSWSSS.', 'SSSSSSSSSs', 'HSSSSSSSSH', 'HSSSSSSSSs', 'HSESSSSESs', 'SSSSSSSSSs', '.SBSSSSBs.', '..SSSSSs..', '...ssss...']
  },
  up: {
    short: ['..HHHHHH..', '.HHHHHHHH.', 'HHHHHHHHHH', 'HHHhHHhHHH', 'HHHHHHHHHH', 'HHHHHHHHHH', 'hHHHHHHHHh', '.hHHHHHHh.', '..SSSSSs..', '...ssss...'],
    bun: ['...HHHH...', '..HhhhhH..', '.HHHHHHHH.', 'HHHHHHHHHH', 'HHHHHHHHHH', 'HHHHHHHHHH', 'hHHHHHHHHh', '.hHHHHHHh.', '..SSSSSs..', '...ssss...'],
    long: ['..HHHHHH..', '.HHHHHHHH.', 'HHHHHHHHHH', 'HHHHHHHHHH', 'HHHHHHHHHH', 'HHHHHHHHHH', 'HHHHHHHHHH', 'HHHHHHHHHh', 'HhHHHHHHhh', 'h.hhhhhh.h'],
    cap: ['..CCCCCC..', '.CCCCCCCC.', 'CCCCCCCCCC', 'CCCCCCCCCC', 'cccccccccc', 'HHHHHHHHHH', 'hHHHHHHHHh', '.hHHHHHHh.', '..SSSSSs..', '...ssss...'],
    curly: ['.H.HH.HH..', 'HHHHHHHHH.', 'HHhHHHhHHH', 'HHHHHHHHHH', 'HHhHHHHhHH', 'HHHHHHHHHH', 'hHHHHHHHHh', '.hHHHHHHh.', '..SSSSSs..', '...ssss...'],
    bald: ['...SSSS...', '.SSSSWSSS.', 'SSSSSSSSSs', 'SSSSSSSSSs', 'SSSSSSSSSs', 'HSSSSSSSSH', 'hHHHHHHHHh', '.hSSSSSSh.', '..SSSSSs..', '...ssss...']
  },
  side: {
    short: ['..HHHHHH..', '.HHHHHHHH.', 'HHHHHHHHHH', 'HHHHHSSSSH', 'HHHSSSSSSS', 'HHHSSSSESS', '.hHSSSSSSS', '.hHSSSSBS.', '..SSSSSSs.', '...ssss...'],
    bun: ['HHh.......', 'hHHHHHHH..', '.HHHHHHHHH', 'HHHHHSSSSH', 'HHHSSSSSSS', 'HHHSSSSESS', '.hHSSSSSSS', '.hHSSSSBS.', '..SSSSSSs.', '...ssss...'],
    long: ['..HHHHHH..', '.HHHHHHHH.', 'HHHHHHHHHH', 'HHHHHSSSSH', 'HHHHSSSSSS', 'HHHHSSSESS', 'HHHHSSSSSS', 'HHHhSSSBS.', 'HHh.SSSSs.', 'Hh..ssss..'],
    cap: ['..CCCCCC..', '.CCCCCCCC.', 'CCCCCCCCCC', 'cccccccccccc', 'HHHSSSSSSS', 'HHHSSSSESS', '.hHSSSSSSS', '.hHSSSSBS.', '..SSSSSSs.', '...ssss...'],
    curly: ['.H.HH.H...', 'HHHHHHHHH.', 'HHHhHHHHHH', 'HHHHHSSSSH', 'HHHSSSSSSS', 'HHHSSSSESS', '.hHSSSSSSS', '.hHSSSSBS.', '..SSSSSSs.', '...ssss...'],
    bald: ['...SSSS...', '.SSSSWSSS.', 'SSSSSSSSSS', 'SSSSSSSSSS', 'HSSSSSSSSS', 'HHSSSSSESS', '.hSSSSSSSS', '.hSSSSSBS.', '..SSSSSSs.', '...ssss...']
  }
};

const BEARD_DOWN = ['..........', '..........', '..........', '..........', '..........', '..........', 'h........h', 'hhHHHHHHhh', '.hHHHHHHh.', '..hhhhhh..'];
const BEARD_SIDE = ['..........', '..........', '..........', '..........', '..........', '..........', '.....hHHHH', '.....hHHH.', '....hhhh..', '..........'];

type Dir = 'down' | 'up' | 'side';
type Pose =
  | 'idle0' | 'idle1' | 'walk0' | 'walk1' | 'walk2' | 'walk3'
  | 'carry0' | 'carry1' | 'carry2' | 'carry3'
  | 'work_low' | 'work_high' | 'press' | 'reach' | 'fold' | 'inspect' | 'cheer0' | 'cheer1' | 'wait0' | 'wait1'
  | 'back_work0' | 'back_work1';

export const FRAME_NAMES: string[] = [];
for (const d of ['down', 'up', 'side'] as Dir[])
  for (const p of ['idle0', 'idle1', 'walk0', 'walk1', 'walk2', 'walk3', 'carry0', 'carry1', 'carry2', 'carry3'])
    FRAME_NAMES.push(`${d}_${p}`);
FRAME_NAMES.push('work_low', 'work_high', 'press', 'reach', 'fold', 'inspect', 'cheer0', 'cheer1', 'wait0', 'wait1', 'back_work0', 'back_work1');

/** Thick limb from (x0,y0) to (x1,y1) with a 2×2 hand. */
function limb(s: Sprite, x0: number, y0: number, x1: number, y1: number, c: string, cs: string, hand: string) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= steps; i++) {
    const x = Math.round(x0 + ((x1 - x0) * i) / steps), y = Math.round(y0 + ((y1 - y0) * i) / steps);
    s.px(x, y, c);
    s.px(x + 1, y, cs);
  }
  s.rect(x1, y1, 2, 2, hand);
}

function drawLegsFront(s: Sprite, L: Look, liftL: number, liftR: number, oy: number) {
  // left leg x8..10, right leg x13..15, rows 22..27, shoes 28..29
  const leg = (x: number, lift: number) => {
    s.rect(x, 22 + oy, 3, 6 - lift, L.pants);
    s.vline(x + 2, 22 + oy, 6 - lift, L.pantsS);
    s.rect(x, 28 - lift + oy, 3, 2, L.shoes);
    s.px(x, 28 - lift + oy, '#3a2e2e');
  };
  leg(8, liftL);
  leg(13, liftR);
  s.rect(9, 22 + oy, 6, 1, L.pantsS);
}

function drawLegsSide(s: Sprite, L: Look, front: number, back: number, oy: number) {
  // front/back foot x offsets relative to hip at x=11
  const leg = (dx: number, c: string, cs: string) => {
    const fx = 11 + dx;
    for (let y = 22; y < 28; y++) {
      const t = (y - 22) / 6;
      const x = Math.round(11 + dx * t);
      s.rect(x, y + oy, 3, 1, c);
      s.px(x + 2, y + oy, cs);
    }
    s.rect(fx, 28 + oy, 4, 2, L.shoes);
  };
  leg(back, L.pantsS, L.pantsS);
  leg(front, L.pants, L.pantsS);
}

function drawTorso(s: Sprite, L: Look, dir: Dir, oy: number) {
  const y = 14 + oy;
  if (dir === 'side') {
    s.rect(8, y, 8, 8, L.shirt);
    s.rect(8, y, 2, 8, L.shirtS);
    s.rect(8, y + 7, 8, 1, L.shirtS);
    if (L.apron) {
      s.rect(13, y + 2, 3, 6, L.apron);
      s.vline(13, y + 2, 6, L.apronS!);
    }
    return;
  }
  s.rect(7, y, 10, 8, L.shirt);
  s.rect(15, y, 2, 8, L.shirtS);
  s.rect(7, y + 7, 10, 1, L.shirtS);
  if (dir === 'down') {
    s.rect(10, y, 4, 1, L.skinS); // neckline
    if (L.name === 'Jules') for (let i = 1; i < 7; i += 2) s.hline(7, y + i, 10, L.shirtS);
    if (L.apron) {
      s.rect(9, y + 2, 6, 6, L.apron);
      s.vline(14, y + 2, 6, L.apronS!);
      s.hline(9, y + 2, 6, L.apronS!);
      s.px(9, y, L.apron); s.px(14, y, L.apron); s.vline(9, y, 2, L.apron); s.vline(14, y, 2, L.apron);
      s.px(11, y + 5, L.apronS!); s.px(12, y + 5, L.apronS!); // pocket
    }
  } else {
    if (L.apron) { s.hline(7, y + 4, 10, L.apron); s.px(11, y + 5, L.apron); s.px(12, y + 5, L.apron); }
  }
}

function drawHead(s: Sprite, L: Look, dir: Dir, oy: number, blink = false) {
  const pal: Record<string, string | null> = {
    S: L.skin, s: L.skinS, H: L.hair, h: L.hairS, E: blink ? L.skinS : '#1e1626', B: '#e48a7c', C: L.cap ?? L.hair, c: L.capS ?? L.hairS, W: '#ffffff80'
  };
  const tpl = HEAD[dir][L.style] ?? HEAD[dir].short!;
  s.stamp(tpl.map((r) => r.slice(0, 10)), 7, 4 + oy, pal);
  if (L.beard && dir === 'down') s.stamp(BEARD_DOWN, 7, 4 + oy, { H: L.hair, h: L.hairS });
  if (L.beard && dir === 'side') s.stamp(BEARD_SIDE, 7, 4 + oy, { H: L.hair, h: L.hairS });
  if (dir === 'down' && !blink) {
    // tiny eye highlights
    s.px(9, 9 + oy, '#3b3150');
    s.px(14, 9 + oy, '#3b3150');
  }
}

export function paintCharacter(L: Look, frame: string): Sprite {
  const s = new Sprite(CHAR_W, CHAR_H);
  const [d0, p0] = frame.includes('_') && !frame.startsWith('work') && !frame.startsWith('back') ? (frame.split('_') as [Dir, Pose]) : ['down', frame as Pose];
  let dir: Dir = d0 as Dir;
  const pose = p0 as Pose;
  if (frame.startsWith('back_')) dir = 'up';
  const sleeve = L.shirt, sleeveS = L.shirtS, hand = L.skin;
  const walkPhase = /walk|carry/.test(pose) ? Number(pose.slice(-1)) : -1;
  const bob = walkPhase === 1 || walkPhase === 3 ? -1 : pose === 'idle1' ? 1 : 0;
  const carrying = pose.startsWith('carry');

  if (dir === 'side') {
    const fwd = walkPhase === 1 ? 3 : walkPhase === 3 ? -3 : 0;
    drawLegsSide(s, L, fwd, -fwd, 0);
    // back arm
    if (!carrying) limb(s, 11, 15 + bob, 11 - fwd / 1.5, 21 + bob, sleeveS, sleeveS, L.skinS);
    drawTorso(s, L, 'side', bob);
    drawHead(s, L, 'side', bob);
    if (carrying) limb(s, 12, 15 + bob, 16, 18 + bob, sleeve, sleeveS, hand);
    else limb(s, 12, 15 + bob, 12 + fwd / 1.5, 21 + bob, sleeve, sleeveS, hand);
    s.outline(O);
    return s;
  }

  // front/back legs
  if (walkPhase === 1) drawLegsFront(s, L, 2, 0, 0);
  else if (walkPhase === 3) drawLegsFront(s, L, 0, 2, 0);
  else drawLegsFront(s, L, 0, 0, 0);

  const armsBehind = dir === 'up';
  const arms = () => {
    const sw = walkPhase === 1 ? 1 : walkPhase === 3 ? -1 : 0;
    switch (pose) {
      case 'work_low':
        limb(s, 6, 15, 8, 21, sleeve, sleeveS, hand); limb(s, 16, 15, 14, 21, sleeve, sleeveS, hand); break;
      case 'work_high':
        limb(s, 6, 15, 8, 18, sleeve, sleeveS, hand); limb(s, 16, 15, 14, 18, sleeve, sleeveS, hand); break;
      case 'press':
        limb(s, 6, 15, 10, 20, sleeve, sleeveS, hand); limb(s, 16, 15, 12, 20, sleeve, sleeveS, hand); break;
      case 'reach':
        limb(s, 6, 15, 3, 19, sleeve, sleeveS, hand); limb(s, 16, 15, 14, 21, sleeve, sleeveS, hand); break;
      case 'fold':
        limb(s, 6, 15, 9, 19, sleeve, sleeveS, hand); limb(s, 16, 15, 17, 21, sleeve, sleeveS, hand); break;
      case 'inspect':
        limb(s, 6, 15, 9, 17, sleeve, sleeveS, hand); limb(s, 16, 15, 13, 17, sleeve, sleeveS, hand); break;
      case 'cheer0':
        limb(s, 6, 15, 4, 8, sleeve, sleeveS, hand); limb(s, 16, 15, 18, 8, sleeve, sleeveS, hand); break;
      case 'cheer1':
        limb(s, 6, 15, 3, 10, sleeve, sleeveS, hand); limb(s, 16, 15, 19, 10, sleeve, sleeveS, hand); break;
      case 'wait0': case 'wait1':
        limb(s, 6, 15, 6, 19, sleeve, sleeveS, hand); limb(s, 16, 15, 16, 19, sleeve, sleeveS, hand); break;
      case 'back_work0':
        limb(s, 6, 15, 7, 13, sleeve, sleeveS, L.skinS); limb(s, 16, 15, 15, 13, sleeve, sleeveS, L.skinS); break;
      case 'back_work1':
        limb(s, 6, 15, 8, 12, sleeve, sleeveS, L.skinS); limb(s, 16, 15, 14, 12, sleeve, sleeveS, L.skinS); break;
      default:
        if (carrying) {
          limb(s, 6, 15 + bob, 8, 19 + bob, sleeve, sleeveS, hand);
          limb(s, 16, 15 + bob, 14, 19 + bob, sleeve, sleeveS, hand);
        } else {
          limb(s, 5, 15 + bob, 5 - sw, 20 + bob, sleeve, sleeveS, hand);
          limb(s, 17, 15 + bob, 17 + sw, 20 + bob, sleeve, sleeveS, hand);
        }
    }
  };
  if (armsBehind && (carrying || pose.startsWith('back_'))) arms();
  drawTorso(s, L, dir, bob);
  if (!(armsBehind && (carrying || pose.startsWith('back_')))) arms();
  drawHead(s, L, dir, pose === 'inspect' ? 1 : bob, pose === 'idle1' || pose === 'wait1');
  if (pose === 'wait0' || pose === 'wait1') s.px(16, 6, null);
  s.outline(O);
  return s;
}

export function charFrameName(look: number, frame: string): string {
  return `ch${look}_${frame}`;
}
