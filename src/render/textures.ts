// Uploads the code-painted atlas into Phaser and registers character animations.
import * as Phaser from 'phaser';
import { buildAtlas } from '../art/atlas';
import { LOOKS, charFrameName } from '../art/characters';

export const ATLAS = 'atlas';

export function installTextures(scene: Phaser.Scene) {
  if (scene.textures.exists(ATLAS)) return;
  const atlas = buildAtlas();
  const canvas = document.createElement('canvas');
  canvas.width = atlas.w;
  canvas.height = atlas.h;
  const ctx = canvas.getContext('2d')!;
  ctx.putImageData(new ImageData(new Uint8ClampedArray(atlas.data), atlas.w, atlas.h), 0, 0);
  const tex = scene.textures.addCanvas(ATLAS, canvas)!;
  for (const [name, f] of Object.entries(atlas.frames)) tex.add(name, 0, f.x, f.y, f.w, f.h);

  // Soft light texture for additive glows (lights are mood, never information).
  const g = document.createElement('canvas');
  g.width = g.height = 64;
  const gc = g.getContext('2d')!;
  const grad = gc.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,0.9)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.35)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  gc.fillStyle = grad;
  gc.fillRect(0, 0, 64, 64);
  scene.textures.addCanvas('glow', g);

  const anims = scene.anims;
  LOOKS.forEach((_, i) => {
    const fr = (names: string[]) => names.map((n) => ({ key: ATLAS, frame: charFrameName(i, n) }));
    for (const d of ['down', 'up', 'side']) {
      anims.create({ key: `${i}_walk_${d}`, frames: fr([0, 1, 2, 3].map((k) => `${d}_walk${k}`)), frameRate: 9, repeat: -1 });
      anims.create({ key: `${i}_carry_${d}`, frames: fr([0, 1, 2, 3].map((k) => `${d}_carry${k}`)), frameRate: 9, repeat: -1 });
      anims.create({ key: `${i}_idle_${d}`, frames: fr([`${d}_idle0`, `${d}_idle0`, `${d}_idle0`, `${d}_idle1`]), frameRate: 2, repeat: -1 });
    }
    anims.create({ key: `${i}_cheer`, frames: fr(['cheer0', 'cheer1']), frameRate: 6, repeat: 3 });
    anims.create({ key: `${i}_wait`, frames: fr(['wait0', 'wait0', 'wait1', 'wait0']), frameRate: 2, repeat: -1 });
  });
}

export function frameOf(look: number, f: string) {
  return charFrameName(look, f);
}
