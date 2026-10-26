# 09 · Browser architecture and data integrity

## Stack
Default TypeScript, Phaser and Vite, with version-compatible official template and pinned dependency lockfile selected at implementation. Keep an already viable stack rather than migrating by preference. Do not assume all Phaser generations use identical APIs. No runtime AI key/service, backend or account required for solo core play. DOM overlays are appropriate for accessible menus/settings; render world through the game engine. Avoid one monolithic HTML/script file.

Suggested folders: app/bootstrap/lifecycle; sim/clock/commands/events; production/stations/batches/jobs; actors/workers/player/pathing; economy/orders/ledger/upgrades; content/registries/schemas; world/properties/layout; threats/events/AI; capers/objectives/checkpoints; render/animation/FX/camera; ui/input/panels; audio; save/repository/migrations; tests/tools. Single authoritative simulation state with explicit presentation adapters.

## Work identity and reservations
Stable worldId, propertyId, actorId, stationId, laneId, jobId, batchId, orderId, transactionId and content definition IDs. Task reservations prevent the player and a worker claiming the same batch/lane/output position. Job contract includes inputs in escrow, work progress, output destination, commission reservation and state. Cancellation/upgrade/reassignment chooses either continuation with new worker or exact refund; no partial lost inputs.

Data model separates definitions from instances. Definition: base times, recipes, art keys, unlocks, lane footprint. Instance: level, positions, assigned actor, buffers, pending job. Preserve IDs during save migration and asset changes. A trait/name change cannot break a station reservation.

## Update order
Read input/commands → validate and apply transactions → advance fixed/capped simulation → resolve paths/jobs/events → settle batches/orders → emit events → animation/audio/UI → render. Work uses simulation seconds, not animation FPS or wall-clock setInterval counts. Pause/hidden tab stops sim; resuming doesn't simulate hours of raids. Use 30 or 60Hz simulation based on measured need, with delta cap and bounded catch-up; long event horizons can use scheduler due times.

Transaction operations include HireAtLane, UpgradeStation, PurchaseSupplies, AssignWorker, MoveStation, StartJob, CompleteJob, FulfilOrder, BeginEvent and SettleMission. Verify current revision, prerequisites, cost/capacity, reachability and idempotency receipt. Apply balances and corresponding instances together. A request can be rejected with reason, never half-successful. Cosmetic error must not cause duplicate purchase.

## Visible versus offscreen simulation
An active property simulates path movement and detailed jobs. Inactive owned properties use the same production definitions, labour availability, inventory reservations, time and order demand through a bounded event scheduler. Include configured transport/service overhead rather than granting theoretical max rate unconditionally. On switching scenes, reconstruct workers at valid task states and verify conservation. Offscreen isn't offline: when app is closed, v1 pauses all simulation. Optional future offline earnings need a separate transparent bounded model; do not silently add them.

Never duplicate a job on scene reload. Production output, cash, commission and wage state are committed events. Presentation can rebuild idle/current frame from normalised progress. Workstation layout changes invalidate affected paths and reassign anchors safely. Store workers at valid walkable positions; show re-routing rather than clipping through new walls.

## Persistence
IndexedDB for versioned slots, authoritative ledger, world/property instances, workers/jobs/batches, upgrades/unlocks, orders, relationships, events/caper checkpoints and settings. localStorage only tiny noncritical boot preferences. Queue writes, use a consistent snapshot and atomic transaction boundaries for related records. Keep last-known-good snapshot and bounded recent event receipts. Save on meaningful purchases/unlocks/mission phase and periodically while dirty; don't write every frame.

Save envelope includes schemaVersion, contentVersion, build, worldId, revision, simulationTime, lastCommitId, propertyIndex, ledger, progression, pendingOperations, eventState and checksum metadata. Store plain serialisable data, never sprites/functions/DOM objects. Validate enum IDs, integer money/counts, finite progress, references and input sizes on load/import. Unknown future version fails with clear message rather than guessed conversion.

Export/import early. Keep backup before migration and allow restore without deleting the failed source. Whole-origin browser eviction can remove all local snapshots, so don't promise permanence; persistent-storage request is feature-detected and may not be granted. Exports protect against that broader loss. If quota fails, preserve last valid save, pause unsafe new purchases and offer Retry/Export. No silent asset-cache cleanup that deletes saves. Use single-tab edit ownership to prevent two instances overwriting each other.

## Exploit/consistency cases
Double tapping hires/upgrades; switching properties mid-carry; buying two jobs with same last cash; craft completed as inventory fills; reload after reward but before animation; restoring old partial save; full output rack; route blocked; invalid imported content IDs; extreme speed floor; missing asset; scene shutdown duplicate listeners; closure during pressure event. Tests must prove no item/cash duplication, missing actor, reset cooldown abuse or transaction loss.

## Browser lifecycle
Handle Pointer Events ownership/cancel/lost capture, blur, visibility, resize, audio suspension and rendering-context loss. On interruption pause, clear held input and require deliberate resume. Warm up relevant audio/atlases after first gesture; show asset retry rather than invisible machines. No required fullscreen/orientation lock/vibration. PWA/offline shell is later scope; ordinary Safari works first. Don't replace code/assets under active play during service worker update.

## Performance
Initial targets: stable 60fps on owner's recent iPhone under moderate property activity, deliberate 30fps low mode on measured older devices; first compressed payload target under roughly 12MB excluding optional large content; bounded texture/audio and worker/particle pools. These are goals, not verified limits. Test a busy property with 20–30 active workers before promising the limit. More distant workers should use lower-frequency AI and not all pathfind per frame.

Track frame-time p95, task cost, active sprites, draw calls, path requests, particle count, asset bytes, save duration and memory/texture estimates where supported. Render resolution/DPR cap, atlases and batching help. Degrade decorative effects before required work animation/telegraphs. Test 20-minute warm-device play and repeated property switching for leaks.

## GitHub and deployment
GitHub is source control, not automatic hosting. Keep small milestone commits, content schemas/validators, lockfile, licence inventory and migrations. Establish npm scripts for dev/build/typecheck/lint/unit tests/content validation and browser tests before claiming those commands passed. Use HTTPS static hosting chosen by owner; check asset base paths for subdirectory deployment. No publication performed by this pack. Keep secrets and restricted raw assets out of public source/builds.
