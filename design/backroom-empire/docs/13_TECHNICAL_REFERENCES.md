# 13 · Primary references and verification limits

Checked 26 October 2026. Technical references support platform choices, not the original fictional design.

- Phaser templates: https://docs.phaser.io/phaser/getting-started/project-templates — official bundler/TypeScript template options. Choose a current compatible version and inspect actual package files rather than mixing historical tutorials.
- Official TypeScript/Vite template: https://github.com/phaserjs/template-vite-ts — useful source to inspect at scaffold time. Package versions can change; this pack deliberately doesn't prescribe an unchecked latest version.
- MDN storage quotas and eviction: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria — browser-local data is subject to origin storage behaviour and may be evicted/cleared; persistent storage isn't an unconditional guarantee. Export/import and failure handling are required.

Further implementation checkpoints: Pointer Events, Web Audio suspension, Page Visibility, IndexedDB transactions and Vite deployment/base-path documentation. Verify APIs in the selected browser/engine versions at implementation. No physical-device, actual game, asset or hosting test was performed to create this planning pack.

All timings, costs, capacities, visual budgets and content counts are proposals. The included fixture validation is deliberately limited and does not prove fun, complete balance, worker pathfinding, visual polish or production readiness.
