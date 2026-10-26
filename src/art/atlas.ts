// Builds the single game atlas from the painted sprites. Pure data (no DOM), so it can be
// unit-tested and previewed outside the browser.
import { FRAME_NAMES, LOOKS, charFrameName, paintCharacter } from './characters';
import { AtlasBuilder } from './pixel';
import * as A from './props';

export function buildAtlas() {
  const b = new AtlasBuilder();
  LOOKS.forEach((look, i) => {
    for (const f of FRAME_NAMES) b.add(charFrameName(i, f), paintCharacter(look, f));
  });
  for (let v = 0; v < 4; v++) b.add(`floor${v}`, A.floorTile(v));
  b.add('floor_worn', A.wornTile());
  for (let v = 0; v < 2; v++) b.add(`annex${v}`, A.annexTile(v));
  for (let v = 0; v < 3; v++) { b.add(`wall${v}`, A.wallFace(v)); b.add(`wallannex${v}`, A.wallFace(v, true)); }
  for (const e of ['bottom', 'top', 'none', 'left', 'right'] as const) b.add(`walltop_${e}`, A.wallTop(e));
  b.add('void', A.voidTile());
  b.add('doormat', A.doormat());
  b.add('door_street_closed', A.streetDoor(false));
  b.add('door_street_open', A.streetDoor(true));
  b.add('door_back_closed', A.backDoor(false));
  b.add('door_back_open', A.backDoor(true));
  for (const w of [32, 48]) for (let f = 0; f < 4; f++) b.add(`window${w}_${f}`, A.windowArt(w, f));
  b.add('hatch_back', A.hatchBack());
  b.add('hatch_frame', A.hatchFrame());
  b.add('poster', A.posterArt());
  b.add('clock', A.clockArt());
  b.add('noticeboard', A.noticeboard());
  b.add('shelf_blank', A.shelfWood());
  b.add('shelf_sleeve', A.shelfMetal());
  b.add('tray', A.trayTable());
  b.add('rack', A.goodsRack());
  b.add('form_1', A.formBench1());
  b.add('form_2', A.formBench2());
  b.add('pack_1', A.packTable1());
  b.add('pack_2', A.packTable2());
  b.add('pack_3', A.packTable3());
  b.add('lever_up', A.lever(false));
  b.add('lever_down', A.lever(true));
  for (let f = 0; f < 4; f++) b.add(`belt${f}`, A.belt(f));
  b.add('ind_on', A.indicator(true));
  b.add('ind_off', A.indicator(false));
  b.add('counter', A.counterArt());
  b.add('build_pad', A.buildPad());
  b.add('desk', A.desk());
  b.add('armchair', A.armchair());
  b.add('crates', A.crates());
  b.add('plant', A.plant());
  b.add('bin', A.binArt());
  b.add('floor_lamp', A.floorLamp());
  b.add('sofa', A.sofa());
  b.add('kettle_table', A.kettleTable());
  b.add('lockers', A.lockers());
  b.add('boarded', A.boardedOpening());
  b.add('item_blank_stock', A.itemBlank());
  b.add('item_prepared', A.itemPrepared());
  b.add('item_sleeve', A.itemSleeve());
  b.add('item_finished', A.itemFinished());
  b.add('item_crate', A.itemCrate());
  b.add('shadow', A.shadow());
  for (const i of ['box', 'full', 'coin', 'wait', 'excl', 'heart', 'star'] as const) b.add(`bubble_${i}`, A.bubble(i));
  for (const k of ['spark', 'fleck', 'dust', 'coin', 'glint'] as const) b.add(`p_${k}`, A.particle(k));
  b.add('sel', A.selectionCorner());
  return b.build(1024);
}
