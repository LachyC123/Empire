// Builds a single self-contained HTML page (all JS + CSS inline) for hosting as a claude.ai Artifact
// or any static host that only accepts one file. Output: dist-artifact/backroom-empire.html
import { build } from 'vite';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';

const out = 'dist-artifact/build';
await build({
  configFile: false, // standalone config: one bundle, no vendor chunk split
  logLevel: 'warn',
  base: './',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 4000,
    outDir: out,
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
    rollupOptions: { output: { inlineDynamicImports: true } }
  }
});

const assets = readdirSync(`${out}/assets`);
const js = assets.filter((f) => f.endsWith('.js')).map((f) => readFileSync(`${out}/assets/${f}`, 'utf8'));
const css = assets.filter((f) => f.endsWith('.css')).map((f) => readFileSync(`${out}/assets/${f}`, 'utf8'));
if (js.length !== 1) throw new Error(`expected one JS bundle, got ${js.length}`);
const safeJs = js[0].replace(/<\/script/gi, '<\\/script');

// The artifact host supplies <!doctype>, <head> (charset + viewport-fit=cover) and <body>.
const page = `<title>Backroom Empire</title>
<meta name="theme-color" content="#120e16">
<style>
:root { color-scheme: dark; background: #120e16; }
body { background: #120e16; }
${css.join('\n')}
</style>
<div id="game"></div>
<div id="ui" aria-live="polite"></div>
<script type="module">
${safeJs}
</script>
`;
mkdirSync('dist-artifact', { recursive: true });
writeFileSync('dist-artifact/backroom-empire.html', page);
console.log(`dist-artifact/backroom-empire.html ${(page.length / 1024 / 1024).toFixed(2)} MB`);
