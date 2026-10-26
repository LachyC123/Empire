# 12 · Validation and quality gates

## Primary acceptance test: show the improvement
Capture same scene before/after first hire, speed purchase, second lane, machine tier and room expansion. Count actual outputs over a controlled simulation interval with equal inputs/demand. Inspect live motion: new actor appears, correct anchor, hands/props align, cycle gets faster, output rate changes where not bottlenecked. If bottlenecked, UI explains it accurately. Passing a stat assertion alone isn't enough.

## Main play routes
Fresh slot → first sale → restock → hire → faster work → second worker → bottleneck fix → room unlock → save/reload.
No cash/no supplies → manual recovery errand → stock purchase → production restored.
Two product lines → shared runner/storage → target stock → accepted mixed order → delivery.
Rival warning → preparation/choice → encounter → bounded loss/reward → repair → ordinary work.
Police threshold → notice/event → bounded consequence → recovery → no instant repeat.
Caper → crew unavailable at home → scene → checkpoint → fail/retry or finish → unique reward → home upgrade → reload.

## Simulation tests
Conservation of input/prepared/packed/sold plus in-flight escrow. Integer nonnegative money/resources. Commission reserved/paid/refunded once. Every worker max one active task; every lane max one worker/job; every batch max one claim. Capacity and output bounds hold. A speed increase preserves progress fraction and raises rate; floor prevents impossible timing. Recipe change returns or completes old job safely. Relocation revalidates anchors and paths. Offscreen/on-screen transition has equal accounted production under same conditions.

## Transaction tests
Double tap, stale panel price, simultaneous queued purchases, not enough cash, no lane/footprint, full output, cancellation, restart during animation, reward delivered before crash, corrupt import, unsupported version, missing ID, two tabs. Check authoritative state rather than merely button state. Failed purchase does not spend and successful purchase is not replayed.

## Pacing tests
Record active seconds to first sale/hire/speed change/automated loop/new room; blocked time by reason; purchase mix; actual profit and supply costs; manual effort versus watching. Test a novice who buys tempting cosmetic upgrades, a player who hires too early, and a player who pursues only speed. All should recover, none should become irreversibly stuck. Initial data checks do not prove full balance.

## Visual and mobile checks
Actual iPhone Safari plus emulated 667×375, 844×390 and 932×430 CSS viewports; both landscape rotations, browser chrome and safe areas. Check touch hold/drag/cancel, modal close while finger held, large text, left hand, inventory full, crowded room, overlay labels, light/dark scenes and effect maximum. Tiny icons cannot be the only explanation. Real device required for thumb occlusion and heat-related performance observations.

## NPC and layout checks
Hire at every legal station orientation; cancel/reassign during collect/work/deliver; blocked door; worker injured by event; supervisor reassignment; full stockroom; loading scene shutdown; caper crew assignment while holding batch. Workers neither vanish nor continue invisible home work. Multiple employees do not stack at same anchor or endlessly oscillate. Do not use teleporting through objects to conceal path bugs.

## Events and capers
No event before unlock; no simultaneous major threats; no threat advances paused/closed; no event while modal steals input; caper blocks home raids; no result reroll by reload; loss respects stated cap; repeated reward unique; all failure routes return to playable recovery. Actions reference game-only mechanisms, not real crime instruction. All objectives visible and achievable on touch without a third required finger.

## Save and lifecycle
Fresh/no storage, normal checkpoint/reload, export/import into new slot, old-version migration, quota failure, unexpected browser close, app switch, interrupted audio, context loss, service worker update, large save, duplicate tabs and changed hosting origin. Never show saved if transaction failed. Never infer offline earnings/attacks from a large wall-clock difference in v1.

## Performance
20-minute busy-property play with 20–30 workers target, path activity, light/particles, order events and saves. Repeat ten scene switches/restarts; observe counts/listeners/pools and memory estimates. Profile actual active production, not an empty floor. Measure input responsiveness, frame times and asset loading. Low mode preserves work/collision/threat information.

## Release blockers
Missing primary animations, fake/duplicated output, invisible workers, unintelligible UI, no resource recovery, save corruption, broken main loop, unlicensed final assets or serious unresolved device faults. State exactly what remains unverified. “Polished” requires motion, controls, economy and visuals working together.
