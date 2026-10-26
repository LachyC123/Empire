// Browser gameplay + viewport checks with real Chromium. Produces screenshots in docs/evidence/.
// Usage: npm run test:browser            (starts its own Vite dev server)
//        BASE_URL=http://host:port/ npm run test:browser
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');

const OUT = 'docs/evidence';
mkdirSync(OUT, { recursive: true });
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`); };

let server = null;
let base = process.env.BASE_URL;
if (!base) {
  server = spawn('npx', ['vite', '--port', '5199', '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] });
  await new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('vite did not start')), 30000);
    server.stdout.on('data', (d) => { if (String(d).includes('ready')) { clearTimeout(t); res(); } });
  });
  base = 'http://localhost:5199/';
}
const url = `${base}?debug=1`;

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const errors = [];

async function newPage(w, h) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${w}x${h}: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`${w}x${h} console: ${m.text()}`); });
  await page.goto(url);
  await page.waitForFunction(() => !!window.__BE, null, { timeout: 20000 });
  await page.waitForTimeout(600);
  return { ctx, page };
}

const shot = (page, name) => page.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 82 });
const S = (page) => page.evaluate(() => window.__BE.state());
const place = async (page, x, y) => {
  await page.evaluate(([x, y]) => { const p = window.__BE.sim().player(); p.x = x; p.y = y; }, [x, y]);
  // Let a few rendered frames pass so the contextual action button reflects the new spot.
  await page.evaluate(() => new Promise((r) => { let n = 0; const f = () => (++n < 3 ? requestAnimationFrame(f) : r()); requestAnimationFrame(f); }));
};
/** Let the harness bot play (real commands) until a purchase is affordable. */
const earnUntil = (page, cash, extra = '') => page.evaluate(([cash, extra]) => {
  const B = window.__BE; let n = 0;
  // Small margin: staff commissions are reserved continuously while the page keeps running.
  while ((B.state().cash < cash + 15 || (extra === 'orders8' && B.state().counters.ordersSettled < 8)) && n++ < 400) B.autoplay(5);
  return B.state().cash;
}, [cash, extra]);
const clickOffer = async (page, panelRef, key) => {
  await page.evaluate((r) => window.__BE.openPanel(r), panelRef);
  await page.waitForTimeout(400);
  const el = await page.$(`[data-offer="${key}"]`);
  if (!el) return false;
  await el.click({ force: true });
  await page.waitForTimeout(300);
  return true;
};
const tapAction = async (page, until) => { await page.keyboard.press('KeyE'); await waitFor(page, until, null, 5000); };
async function waitFor(page, fn, arg, ms = 30000) {
  await page.waitForFunction(fn, arg, { timeout: ms, polling: 100 });
}
async function holdKeyUntil(page, key, fn, ms = 40000) {
  await page.keyboard.down(key);
  try { await waitFor(page, fn, null, ms); } finally { await page.keyboard.up(key); }
}

// ------------------------------------------------------------------ main playthrough (844×390)
{
  const { page } = await newPage(844, 390);
  await shot(page, '00-title-844x390');
  await page.click('[data-a="new"]');
  await page.waitForTimeout(800);
  check('new game starts with $20 and 12+12 prepaid stock', await page.evaluate(() => { const s = window.__BE.state(); return s.cash === 20; }));
  await shot(page, '01-start');

  // Walk with the keyboard (real movement + collision): down-right for a moment.
  const p0 = await page.evaluate(() => ({ ...window.__BE.sim().player() }));
  await page.keyboard.down('KeyD'); await page.waitForTimeout(1200); await page.keyboard.up('KeyD');
  const p1 = await page.evaluate(() => ({ ...window.__BE.sim().player() }));
  check('keyboard walking moves the player', p1.x > p0.x + 0.25, `x ${p0.x.toFixed(2)} → ${p1.x.toFixed(2)}`);

  // Manual first unit through the contextual action button (E = action).
  await place(page, 3.5, 3.6);
  const ctxLabel = await page.textContent('#act-label');
  check('action button offers "Take blank" at the shelf', /Take blank/.test(ctxLabel ?? ''), ctxLabel);
  await tapAction(page, () => window.__BE.state().actors.player.carrying.length === 1);
  check('pressing action picks up a real blank token', (await S(page)).actors.player.carrying.length === 1);
  await place(page, 3.0, 5.5);
  await page.keyboard.down('KeyE');
  await waitFor(page, () => { const s = window.__BE.state(); const j = Object.values(s.jobs)[0]; return j && j.progress > 0.45; });
  await shot(page, '02-manual-forming-hold');
  await waitFor(page, () => window.__BE.state().counters.produced.prepared >= 1);
  await page.keyboard.up('KeyE');
  check('holding Form at the bench produces exactly one prepared piece', (await S(page)).counters.produced.prepared === 1);
  await place(page, 7.5, 3.6);
  await tapAction(page, () => window.__BE.state().actors.player.carrying.length === 2);
  await place(page, 9.0, 5.5);
  await holdKeyUntil(page, 'KeyE', () => window.__BE.state().counters.produced.finished >= 1);
  await waitFor(page, () => !!window.__BE.state().order);
  await place(page, 11.5, 3.6);
  await holdKeyUntil(page, 'KeyE', () => window.__BE.state().counters.sold >= 1);
  await page.waitForTimeout(300);
  const afterSale = await S(page);
  check('first hand-made sale pays $12 on settlement', afterSale.cash === 32, `cash $${afterSale.cash}`);
  await shot(page, '03-first-sale');

  // Bot plays the remaining manual loop (same commands) until the first hire is affordable.
  const audit0 = await page.evaluate(() => { const B = window.__BE; let n = 0; while (B.state().cash < 60 && n++ < 200) B.autoplay(1); return B.audit(); });
  check('manual loop reaches $60 with a clean ledger/conservation audit', audit0.length === 0 && (await S(page)).cash >= 60, audit0.join('; '));

  // Hire through the station panel button.
  await place(page, 3.0, 7.6); await page.waitForTimeout(200);
  await page.keyboard.press('KeyM');
  await page.waitForTimeout(350);
  await shot(page, '04-forming-panel-before-hire');
  await page.click('[data-offer="hire:F1"]', { force: true });
  await page.waitForTimeout(400);
  let st = await S(page);
  const mina = Object.values(st.actors).find((a) => a.kind === 'worker');
  check('hire button creates a named worker walking in from the street door', !!mina && mina.name === 'Mina' && mina.state === 'arriving');
  await page.click('#panel-close');
  await page.waitForTimeout(1600);
  await shot(page, '05-mina-arrives');
  await page.evaluate(() => window.__BE.run(6));
  await page.waitForTimeout(300);
  await shot(page, '06-mina-working');
  st = await S(page);
  const lane = st.lanes.F1;
  check('Mina occupies the forming position and is doing a real job', lane.workerId === mina.id && !!lane.jobId, `job ${lane.jobId}`);

  // Earn, then buy packing speed and show the before/after numbers.
  await earnUntil(page, 45);
  await place(page, 9.0, 7.6);
  await page.keyboard.press('KeyM'); await page.waitForTimeout(400);
  const speedText = await page.textContent('[data-offer="speed:st_pack"]');
  check('packing speed offer shows the real formula preview 8.0s → 6.96s', /8\.0s → 6\.96s/.test(speedText ?? ''), speedText?.replace(/\s+/g, ' ').trim());
  await shot(page, '07-packing-panel-speed-offer');
  await page.click('[data-offer="speed:st_pack"]', { force: true });
  await page.waitForTimeout(400);
  check('speed upgrade applied once (one tap)', (await S(page)).stations.st_pack.speedRank === 1);
  await page.click('#panel-close');

  // Hire a packer, then build + staff a second packing table as one bundled purchase.
  await earnUntil(page, 90);
  await clickOffer(page, { kind: 'station', id: 'st_pack' }, 'hire:P1');
  check('packer hired at packing position 1', !!(await S(page)).lanes.P1.workerId);
  await page.evaluate(() => window.__BE.closePanel());
  const cash245 = await earnUntil(page, 245);
  await place(page, 6.5, 10.5);
  await page.evaluate(() => window.__BE.openPanel({ kind: 'station', id: 'st_pack' }));
  await page.waitForTimeout(400);
  await shot(page, '08-packing-panel-bundle');
  await clickOffer(page, { kind: 'station', id: 'st_pack' }, 'buildHire:P2');
  let st2 = await S(page);
  check('bundle builds a physical second table and staffs it', st2.lanes.P2.built && !!st2.lanes.P2.workerId, `earned to $${cash245}, now $${st2.cash}, toasts: ${await page.textContent('#toasts')}`);
  await page.evaluate(() => window.__BE.closePanel());
  await page.evaluate(() => window.__BE.autoplay(45, { sellOnly: true }));
  await place(page, 10.5, 8.5);
  await page.waitForTimeout(600);
  await shot(page, '09-two-packers-working');
  await page.evaluate(() => window.__BE.openPanel({ kind: 'line' }));
  await page.waitForTimeout(400);
  const advice = await page.textContent('#panel-body .status');
  check('line overview names the real bottleneck in plain words', /packers can handle|Packing is the bottleneck/i.test(advice ?? ''), advice ?? '');
  await shot(page, '10-line-bottleneck');
  await page.evaluate(() => window.__BE.closePanel());

  // Equipment tier (visible dispenser + lever), then fix the bottleneck with a second forming position.
  await earnUntil(page, 120);
  await clickOffer(page, { kind: 'station', id: 'st_pack' }, 'equip:st_pack');
  check('sleeve dispenser installed (equipment tier 1)', (await S(page)).stations.st_pack.equipTier === 1);
  await page.evaluate(() => window.__BE.closePanel());
  await page.evaluate(() => window.__BE.run(3));
  await place(page, 10.5, 8.5);
  await page.waitForTimeout(600);
  await shot(page, '11-sleeve-dispenser');
  await earnUntil(page, 185);
  await place(page, 6.5, 10.5);
  await clickOffer(page, { kind: 'station', id: 'st_form' }, 'build:F2');
  await earnUntil(page, 120);
  await clickOffer(page, { kind: 'station', id: 'st_form' }, 'hire:F2');
  await page.evaluate(() => window.__BE.closePanel());
  check('second forming position built and staffed (bottleneck fix)', !!(await S(page)).lanes.F2.workerId);
  const before = await page.evaluate(() => window.__BE.state().counters.produced.finished);
  await page.evaluate(() => window.__BE.autoplay(60));
  const after = await page.evaluate(() => window.__BE.state().counters.produced.finished);
  check('output keeps flowing after the fix', after - before >= 8, `${after - before} packages in 60s`);

  // The adjoining workshop.
  await earnUntil(page, 300, 'orders8');
  await place(page, 17.5, 8.5);
  await page.waitForTimeout(300);
  await shot(page, '12a-boarded-doorway-panel-before');
  await clickOffer(page, { kind: 'annex' }, 'annex');
  st = await S(page);
  check('adjoining workshop unlocked through its real requirements', st.unlocked.includes('annex'), `orders ${st.counters.ordersSettled}`);
  await page.evaluate(() => window.__BE.closePanel());
  await page.evaluate(() => window.__BE.run(2));
  await page.waitForTimeout(1800);
  await shot(page, '12-workshop-open');
  await earnUntil(page, 190);
  await clickOffer(page, { kind: 'station', id: 'st_form_annex' }, 'hire:F3');
  await earnUntil(page, 230);
  await clickOffer(page, { kind: 'station', id: 'st_pack_annex' }, 'hire:P3');
  await page.evaluate(() => window.__BE.closePanel());
  await page.evaluate(() => window.__BE.autoplay(40));
  await place(page, 20.5, 9.5);
  await page.waitForTimeout(1800);
  await shot(page, '13-workshop-staffed');
  st = await S(page);
  check('workshop positions staffed by real workers', !!st.lanes.F3.workerId && !!st.lanes.P3.workerId);
  let audit = await page.evaluate(() => window.__BE.audit());
  check('integrity audit clean after the full slice', audit.length === 0, audit.join('; '));

  // Save, reload the page, continue: in-progress jobs keep their exact progress.
  await page.evaluate(() => window.__BE.pause());
  const saved = await page.evaluate(async () => { const B = window.__BE; B.resume(); B.run(0.37); B.pause(); await B.save(); const s = B.state(); return { jobs: Object.fromEntries(Object.values(s.jobs).map((j) => [j.id, j.progress])), cash: s.cash, t: s.time, workers: Object.values(s.actors).filter((a) => a.kind === 'worker').length }; });
  await page.reload();
  await page.waitForFunction(() => !!window.__BE);
  await page.waitForTimeout(500);
  const stored = await page.evaluate(async () => { const s = await window.__BE.peekSave(); return { jobs: Object.fromEntries(Object.values(s.jobs).map((j) => [j.id, j.progress])), cash: s.cash, t: s.time, workers: Object.values(s.actors).filter((a) => a.kind === 'worker').length }; });
  const sameJobs = Object.keys(saved.jobs).length > 0 && Object.entries(saved.jobs).every(([id, p]) => stored.jobs[id] === p);
  check('after a page reload the stored save holds every in-progress job at its exact progress, plus cash and staff', sameJobs && saved.cash === stored.cash && saved.workers === stored.workers,
    `${Object.keys(saved.jobs).length} jobs, $${stored.cash}, ${stored.workers} workers`);
  await page.click('[data-a="continue"]');
  await page.waitForTimeout(600);
  const cont = await page.evaluate(() => { const s = window.__BE.state(); return { jobs: Object.values(s.jobs).map((j) => [j.id, j.progress]), workers: Object.values(s.actors).filter((a) => a.kind === 'worker').length }; });
  const continued = cont.workers === saved.workers && cont.jobs.some(([id, p]) => saved.jobs[id] !== undefined && p >= saved.jobs[id]);
  check('Continue resumes those jobs from where they were (no reset, no duplicate)', continued, JSON.stringify(cont.jobs.slice(0, 4)));
  await page.evaluate(() => window.__BE.resume());
  await page.waitForTimeout(800);
  await shot(page, '14-after-reload');
  await page.context().close();
}

// ------------------------------------------------------------------ recovery route
{
  const { page } = await newPage(844, 390);
  await page.click('[data-a="new"]');
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    const B = window.__BE; const sim = B.sim();
    // Spend down: hire with all cash, burn stock, leaving no money and no supplies.
    sim.state.cash = 72; sim.hire('F1', 'rc-h');
    sim.run(150);
    const broke = { cash: sim.state.cash, blanks: sim.state.buffers.buf_blank.items.length };
    return broke;
  });
  check('recovery fixture: no cash and no blank stock', r.cash === 0 && r.blanks === 0, JSON.stringify(r));
  await place(page, 9.5, 12.4);
  await page.waitForTimeout(300);
  const label = await page.textContent('#act-label');
  check('street door offers the no-input errand', /errand/i.test(label ?? ''), label);
  await page.keyboard.press('KeyE');
  await page.evaluate(() => window.__BE.run(21));
  check('errand returns the player with $8', (await S(page)).cash === 8);
  // Make room on the full tray (pack one piece by hand), then restock with the errand money.
  await page.evaluate(() => { const sim = window.__BE.sim(); const p = sim.player();
    p.x = 6.5; p.y = 5.5; sim.interact('buffer:buf_tray', 'rc-t'); p.x = 7.5; p.y = 3.5; sim.interact('buffer:buf_sleeve', 'rc-s');
    p.x = 9; p.y = 5.5; sim.setHold('lane:P1'); sim.run(9); sim.setHold(null); p.x = 10.5; p.y = 5.5; sim.interact('buffer:buf_finished', 'rc-f'); });
  const ok = await page.evaluate(() => window.__BE.sim().restock(1, 'rc-r').ok);
  await page.evaluate(() => window.__BE.run(25));
  check('restock with errand money restores production', ok && (await S(page)).counters.produced.prepared >= 13);
  await page.context().close();
}

// ------------------------------------------------------------------ viewport fit
for (const [w, h] of [[667, 375], [844, 390], [932, 430], [1280, 720]]) {
  const { page } = await newPage(w, h);
  await page.click('[data-a="new"]');
  await page.waitForTimeout(400);
  await page.addStyleTag({ content: '#panel { transition: none !important; }' });
  await page.evaluate(() => { const s = window.__BE.sim(); s.state.cash = 500; window.__BE.openPanel({ kind: 'station', id: 'st_pack' }); });
  await page.waitForTimeout(600);
  const m = await page.evaluate(() => {
    const r = (sel) => document.querySelector(sel)?.getBoundingClientRect();
    const panel = r('#panel');
    const offers = [...document.querySelectorAll('.offer')].map((e) => e.getBoundingClientRect());
    const pills = [...document.querySelectorAll('#hud .pill, #hud .btn')].map((e) => e.getBoundingClientRect());
    let overlap = false;
    for (let i = 0; i < pills.length; i++) for (let j = i + 1; j < pills.length; j++) {
      const a = pills[i], b = pills[j];
      if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) overlap = true;
    }
    return {
      vw: innerWidth, vh: innerHeight, panel: panel && { l: panel.left, r: panel.right, t: panel.top, b: panel.bottom },
      minOffer: Math.min(...offers.map((o) => o.height)), offers: offers.length, overlap,
      act: r('#act').height, hudRight: Math.max(...pills.map((p) => p.right)), hscroll: document.documentElement.scrollWidth > innerWidth
    };
  });
  const inside = m.panel && m.panel.l >= 0 && m.panel.r <= m.vw && m.panel.t >= 0 && m.panel.b <= m.vh;
  check(`${w}×${h}: panel fits, offers ≥48px, HUD not overlapping, no horizontal scroll`,
    inside && m.minOffer >= 48 && !m.overlap && m.act >= 48 && !m.hscroll && m.hudRight <= m.vw, JSON.stringify(m));
  await shot(page, `20-viewport-${w}x${h}-panel`);
  await page.evaluate(() => window.__BE.closePanel());
  await page.waitForTimeout(300);
  await shot(page, `21-viewport-${w}x${h}`);
  await page.context().close();
}

check('no page errors or console errors', errors.length === 0, errors.slice(0, 5).join(' | '));
await browser.close();
if (server) server.kill();
writeFileSync(`${OUT}/browser-check.json`, JSON.stringify({ at: new Date().toISOString(), results }, null, 2));
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} browser checks passed`);
process.exit(failed.length ? 1 : 0);
