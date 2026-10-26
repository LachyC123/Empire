# BACKROOM EMPIRE — Complete Master Plan

Pixel-art browser tycoon for iPhone · v1.0 · 26 October 2026

Development handoff, not a playable build. Read README.md and START_HERE_PROMPT.md first.

The key promise: every bought improvement changes real work and its visible presentation.


---

# 01 · Vision and production charter

## Player fantasy
I started alone, making and carrying everything. Now I can walk through rooms full of people and equipment that genuinely do the work I once did. My operation looks, sounds and functions better because of choices I made.

Core loop: interact/make → package/move → fulfil/sell → choose a meaningful improvement → watch it work → tackle a newly opened opportunity. Early gains are frequent; later gains change production structure, scope and activities. The player remains embodied instead of becoming a detached spreadsheet manager.

## What “fast dopamine” means here
Short feedback delays, clear progress, understandable prices, visible before/after improvements and several attainable goals. First useful action in seconds, first completed order in roughly the first minute, first hire around the first few minutes, then an immediately apparent reduction in manual work. Those are playtest targets, not forced reward timers.

Avoid mandatory rapid tapping, artificial real-hour waits, deceptive near-wins, login streak punishment and paid relief from intentionally broken balance. The attractive loop is mastery and growth: an observable problem, an affordable improvement, a visible payoff. Keep one small goal available while a medium project and larger milestone remain visible.

## Embodied operation
Objects exist as batch tokens represented by art. Worker carries a batch, sets it on a bench, performs a readable cycle and puts output into the correct rack. Paths matter but should not become frustrating micromanagement. Start with small layouts; free paused repositioning and route previews help players optimise without a fee for experimentation.

The player's first bench remains relevant later as a specialist station, training area or kept original workspace. Buildings are not discarded simply because a number grew. A familiar room can become one component of a larger operation, showing history and scale.

## Visual pillars
Warm, scruffy personal interiors becoming organised busy spaces; distinctive colourful fictional goods; crisp readable people/machines with rich movement. Reject generic neon UI cards, muddy dark interiors, blurry faux pixel art and identical machine recolours standing in for tiers. Rainy streets and glow add atmosphere, but the main production floor must be easy to read.

## Platform and limits
Landscape iPhone Safari primary, desktop keyboard/mouse secondary. Single-player, pauseable, local-first saves and no account requirement. Controls must be usable with two thumbs. Use a layered top-down view with visible front walls, not difficult isometric placement. No multiplayer or detailed realistic criminal simulator in v1. Capers/raids use simple direct action and contextual interactions. No real manufacturing recipes or actual security/evasion procedures.

## Production tiers
First slice: one backroom plus adjacent room unlock, one product, three stages, one-to-three workers, several speed/lane/equipment upgrades, friendly UI, saving and one non-destructive event demonstration.
Representative alpha: three product families, two premises, meaningful worker specialisations, production targets and routing, one rival event, one police event and one small caper.
Initial full release target: six product families, six property stages, ten worker roles, sixteen upgrade branches, several machine visual tiers, four rival-event families, police-pressure outcomes and six authored capers. Exact volume depends on observed art/design throughput. Supplied data is a concrete target, not shipped content.

## Proof of success
A new player taps a worker and understands upgrade options without explanation. A speed upgrade changes a visible cycle and finished items/minute where upstream supply allows it. Another hire produces another useful worker at an actual lane. The player can explain the current bottleneck. A room looks materially different after twenty meaningful upgrades. A break from play never produces an unseen raid or negative cash spiral. A later caper enriches progression without making the core operation irrelevant.


---

# 02 · Friendly touch UI and one-press actions

## Interaction hierarchy
Walk close to a worker/station and tap it or press contextual Interact. A small outline identifies the target; overlapping targets can be cycled intentionally. A contextual panel opens with three simple choices: Upgrade work, Hire help, Improve equipment. Advanced detail is behind Details. Work can continue behind a small panel in safe premises; a clear Pause button freezes everything. Full management screens pause solo play by default. Danger always pauses when a modal steals input, so upgrades cannot cause accidental raid damage.

Example card:
PACKAGING • Level 2
1 worker working / 2 positions
8.0s → 7.0s per package (rounded preview of 6.96s)
UPGRADE SPEED • $45
HIRE PACKER • $90 • 1 free position
Improve equipment → see next visual tier

Show costs once, with cash owned and shortage if relevant. Use a small clear progress strip: “One more equipment upgrade opens Carton Sealer.” Explain whether the upgrade improves capacity, actual production or convenience. Never advertise +50% income when supplies currently limit output.

## Buying experience
Press → button depresses → action pending → authoritative transaction commits → worker/equipment animation → clear benefit label. Ordinary affordable purchases need no confirmation. A hire offer includes any compulsory lane/desk cost, capacity and footprint. If no legal position exists, don't take money: show Expand work area or choose another station. High-impact removals, save overwrite or abandoning a mission get a deliberate confirmation.

Upon success focus camera briefly on the change without forcing long cinematic movement. New employee enters through the door, walks to a locker/work position and starts the next valid job. If supply is missing, they visibly arrive and show Waiting for prepared goods; they do not pretend to work. Upgrade speed changes remaining cycle fraction consistently, with a concise faster tick animation. Equipment replacement pauses at a safe cycle boundary or transfers progress, never deletes a reserved batch.

## Icons and language
Person-plus = hire; upward chevrons = upgrade; wrench = equipment; box = stored goods; trolley = movement; clock = work time; lightning = machine power state (where implemented); exclamation inside shape = blockage; shield = defence readiness; badge = fictional police pressure. Pair icons with words during onboarding and on panels. Don't rely on red/green alone for affordability.

Resource units are exact in purchase views even if HUD cash is abbreviated later. Show $1,250 rather than ambiguous 1.2K when paying. Buttons at least 48 CSS pixels, primary actions about 64px, meaningful spacing. Keep control hitboxes separate from tiny sprite buttons. Allow text/control scaling and left-handed layout.

## HUD and navigation
Top: cash, compact current-order status, pause/settings. Heat/rival indicators appear only after their tutorial. Bottom left: movement zone. Bottom right: contextual action and small tool/defence control when relevant. Production management drawer shows current property, actual sales, available jobs and a recommended issue, not dozens of bouncing badges.

Tap a problem badge to focus its cause: upstream empty, output full, unreachable path, worker missing, insufficient supplies. Offer a relevant action, not an unexplained red symbol. A producer may show “Packaging full” even while perfectly functional. Keep task status visible for a selected station and optionally all stations via a work overlay.

## Main screens
Title: animated original room, Continue/New/Slots/Settings/Credits. Property map: small number of clearly identified purchased/available premises, unlock requirement and transfer summary. Workers: role, assignment, current state, training and wages per completed task. Production: input/output buffers, actual versus theoretical rate, pause/target/recipe controls. Upgrades: relevant branches filtered by selected target; overall roadmap available without forcing use. Orders: buyer, quantity, payout, inputs and acceptance terms. Capers: short premise, loadout, difficulty, loss cap and checkpoint/retry rules. Inventory/store: clear stacks and overflow. Settings include accessibility and saves/export/import.

## First fifteen minutes — proposed pace
0:00–0:30: enter shabby room, collect prepaid blank stock, start the fantasy forming bench. Teach move and interact only.
0:30–1:30: form, package and deliver several units through tactile hold interactions. Supplies are prepaid; first orders give immediate money and a visible completed order.
1:30–3:00: hire first assembler. They visibly arrive and repeat the part you were doing. You package while they work.
3:00–5:00: buy packaging rhythm upgrade, observe cycles finishing sooner. Input/output counters show real batches. Restock at a simple delivery pad.
5:00–8:00: add a second position or hire the first dedicated packer, then spot a genuine bottleneck. Introduce routing/trolley or an upstream upgrade.
8:00–12:00: a new machine tier visibly replaces the bench, unlocks a product variation and a second room goal.
12:00–15:00: open the room, arrange one station, assign someone and view your original operation continuing. Introduce a harmless rival message/heat hint, not a destructive raid.

Do not script exact player speed. All prompts fade after demonstrated use, can be reopened, and don't prevent experimentation. Costs/pacing are tuned from actual play, not made “correct” by forced gifts.

## Accessibility and mobile lifecycle
Floating joystick with pointer ownership, dead zone, capture/cancel handling; action supports hold rather than frantic repeated taps. Menus absorb held pointers before closing to prevent accidental purchases. Respect safe areas/browser chrome; portrait pauses with rotate instruction. Fullscreen is optional. No required vibration or audio. Reduced flash/shake/motion and clear text preserve all threat and production information.


---

# 03 · Real production and visible labour

## Batch simulation
Use authored stage graphs. Basic chain: blank stock → fantasy forming → prepared piece → packaging with sleeve → finished goods → handover sale. Later chains add visual stages such as prism alignment, colour sorting or carton assembly; these are deliberately invented processes, not real drug production. Items are typed batch tokens with quantity, quality band, stage and source. Their sprite representation follows the token, not a separate cosmetic counter.

A station defines stage, legal inputs, output, recipe, speed tier, equipment tier, work positions, input/output capacity and interaction anchors. A worker defines role, assignment, carrying capacity, skill, current task and valid route. A job reserves actor, station lane, inputs and output capacity before working. Job states: Proposed → Reserved → Collecting → Travelling → Working → Delivering → Completed, or blocked/interrupted. Each transition has persistence and animation.

No input means no work. Full output means pause before starting the next batch. Missing path means visible blocked state and replan. Worker on a caper cannot also operate the bench. Leaving a room changes simulation detail, not resource rules. Animation ending cannot create goods; job completion commits goods and triggers animation/sound events.

## More workers really mean more workers
Each hire creates a named persistent actor, with original clothes/portrait variants. Offer a specific compatible role and work target rather than a decorative crowd. At stations with spare lanes, assign immediately. If no lane exists, provide a clear composite purchase: Add table + hire packer, price includes both. Footprint validation happens before payment. Worker cannot share the same anchor/body location with another operator.

Parallel packers each reserve distinct batches and show independent staggered animation. A runner can deliver inputs to multiple workers but has actual carrying/travel time. Lane counts and worker counts are separate. Buying a worker improves labour capacity; buying equipment improves lane capability. Neither guarantees throughput if upstream is empty.

## Work speed model
For a lane, cycleSeconds = max(minCycleSeconds, baseCycleSeconds × equipmentTimeFactor / (1 + speedRank × speedStep + boundedSkillBonus)). Defaults must be data-driven and display the real final time. Example basic packaging: base 8s, speed step 0.15, floor 1.2s. One rank makes time approximately 6.96s, not a false 6.8 unless exact tuned formula supports it. UI computes rather than hardcodes previews.

Progress is normalised 0..1. Speed upgrade changes rate of remaining progress, not resets the batch or instantly awards it. A new equipment tier can safely transfer progress at a cycle boundary. Fairly preserve reserved materials/output. Staff training changes hand technique/pose sequence at major milestones and bounded cycle speed; raw animation playback cannot accelerate until unreadable.

At very high productivity, maintain a readable minimum hand-action duration and express gains through larger batch handling, parallel mechanisms, wider lanes and more output per visible cycle. The batch size and output ledger must agree: show a tray/carton rather than a single package producing ten unexplained items. No unbounded animation timescale or thousands of particle instances.

## Player work
Early hands-on actions are collect, hold to work, carry and deposit. A simple optional timing accent can give a small bounded bonus, never required accuracy or mass repetitive tapping. The player is another valid worker with exclusive action/position reservation. Helping cannot multiply already completed jobs. When automation arrives, personal activity becomes setup, priority delivery, specialist crafting, quality choice, new property opening or missions.

Manual work must still be useful, but the game should not collapse when the player stands and watches the operation. A staffed loop continues if supplies and demand exist. Idle time can be an enjoyable visual reward without mandatory click collection.

## Orders and cash
Cash enters only on completed sale/order settlement. Finished inventory has potential value, not automatically earned cash. Show gross sales and net after material/commission costs separately. Use integer cash units and exact integer item quantities; fractional task progress is separate. Starter supplies are prepaid; don't charge for them twice. Restock reservations consume cash once and deliver actual stock.

Ordinary buyer demand is reliable enough to support recovery; larger accepted contracts reserve inventory targets, may have active-session deadlines and give an upfront warning. Do not create mandatory deadlines while the app is closed. Orders cannot consume the same goods twice. If input money is exhausted, an unlimited low-yield manual errand with no inputs creates recovery income without becoming the optimal endgame method.

## Worker roles and personality
Assembler, packer, runner, stockkeeper, loader, technician, quality specialist, supervisor, guard and caper specialist. Roles have core behaviours; training adds bounded improvements. Generated names and modest traits bring personality without random broken competence. A careful packer is consistent but slower, a nimble runner moves quickly with smaller loads. No paid rarity rolls.

Early hiring is deterministic: first assembler and first packer are predictable offers. Later applicants vary within a useful range. UI displays assignment and trait effect. Rename/dismiss/reassign allowed with clear outcomes. Personal relationships can unlock dialogue/role preference, but the production game does not require managing twenty friendship meters.

## Comfort and staffing
Avoid fatigue chores in the first slice. Later a break room provides small capped comfort/recovery benefits with short staggered breaks included in reported sustainable rate. No hourly wages draining while absent. Proposed economy uses commissions per completed useful task, shown before hiring; idle workers cost nothing. Never silently deduct ordinary salaries alongside commissions. Reassignment preserves partial progress or refunds reserved inputs according to a single explicit policy.

## Diagnostics that help players
Each station shows actual units/min over a rolling window, theoretical capacity under supply and a primary limiting reason. Explain “Your two packers can handle 15/min; assembly currently supplies 10/min.” Upgrade cards can warn that extra capacity will wait for inputs, while still allowing strategic preparation. A simple highlight traces input/output and blocked routes on demand, not permanently over the beautiful room.


---

# 04 · Deep progression with tangible change

## Upgrade design rule
Every upgrade has cost, prerequisites, mechanical effect, visible effect and acceptance test. If a numerical change is too small to notice immediately, group it into a useful step rather than selling dozens of invisible increments. Major tiers change silhouette, work method or access. Unlocks are announced at the station and recorded in a roadmap with clear unmet requirements.

Sixteen branches with six specified steps each form the initial target catalogue: assembly rhythm, packaging rhythm, parallel lanes, machine tier, carrying, shelving, loading, worker training, product research, property development, supervision, comfort, defences, civic-pressure readiness, caper preparation and presentation/customisation. This yields 96 purchase nodes, not 96 finished art assets or a claim of infinite content. Several nodes unlock capabilities rather than permanent passive multipliers.

Every branch has a clear owner/scope: selected station, worker, property or empire. Preview exact target. A property decoration cannot accidentally boost all production globally. Shared/global branches are explicitly labelled. Keep station-specific counters if more than one station exists; “Packaging rhythm 3” isn't one ambiguous universal flag.

## Capability gates
Product discovery can require a real machine tier and a modest completed-order milestone. Property expansion can require purchased capacity and successful output. A second workstation needs a valid footprint. Advanced capers need a staffed stable operation plus particular preparation capabilities. No circular prerequisites or only-rarest-drop gate. Cash alone should not skip all learning, but don't require performing an arbitrary chore a thousand times.

Example: two successful ordinary orders + packaging equipment tier 2 unlocks a new product variant. Two occupied work lanes and a genuine throughput milestone reveals the adjoining-room offer. Buying it gives actual space and new anchor positions, not merely another menu page. Decorative progression never blocks mandatory production.

## Six properties
Backroom: small layout, personally doing every job; spare corner for a second table.
Adjoining workshop: two rooms, multiple lanes, first runner, separate input/output shelves.
Converted shop: shopfront order collection, stockroom and product choice.
Warehouse: loading space, equipment clusters, supervisor controls and rival-event introduction.
Industrial courtyard: multiple buildings, transport links, specialist teams and caper staging.
Headquarters complex: broad organisation, specialised old properties, major missions and customisation.

Keep purchased premises persistent. The first room can supply a basic intermediate to later lines, host trainees or become a nostalgic office. Transfers use scheduled in-game transport and stock targets, represented visibly at loading areas. Do not simulate an entire real city continuously; use hand-authored walkable properties linked by a compact district map with short travel transitions.

## Horizontal and vertical growth
Vertical upgrades improve existing processes; horizontal upgrades introduce a different decision. A faster wrapper is vertical. A carton station enabling multi-product orders is horizontal. A new runner route improves logistics. Product specialisations change space, input availability and order mix. Avoid making one highest-price item objectively dominate every line.

Unlock next opportunities early enough to invite planning without overwhelming the screen. Near-term button, medium room goal, long-term operation milestone are sufficient. A roadmap groups branches into chapters; not every lock needs a pulsing notification. Display “Requires carton station” with a focus action rather than obscure level numbers alone.

## Suggested milestone chapter progression
1. First earnings: manual chain, first hire, first speed purchase.
2. A working team: second role, input buffer, extra packaging lane and runner.
3. Your own workshop: equipment tier, second product, layout mode and expansion.
4. A real operation: multiple properties, supervisors, larger orders and abstract pressure.
5. Holding ground: readable raids, guards/repairs, recovery and specialist teams.
6. Bigger opportunities: optional capers, exclusive machine blueprints, large customisation projects.
7. Mastery: distinct production specialisations, mission variants and ambitious multi-property contracts.

No forced prestige wipe. Optional new-save challenge modes may come later. Completing a chapter should create freedom, not force abandoning a beautifully arranged property.

## Art/animation tier examples
Packaging tier 1: rough table, paper sleeve, hand-fold/press/place sequence.
Tier 2: neat station with dispenser, lever press and small rack.
Tier 3: powered sealer with belt motion and alternating work positions.
Tier 4: multi-lane packing cell, tray handling and stacker.
Tier 5+: specialist modules and batching; more readable mechanisms, not 8× faster flailing hands.

For each rendered scene verify workers actually touch the correct equipment anchors, output appears at the correct location, new positions have access and cosmetic clutter doesn't hide hands. Major unlocks need new pose/animation support, not a taller sprite with old hands operating empty air.


---

# 05 · Fictional goods, economy and pacing

## Six invented product families
Nightglass: luminous fantasy tokens made from blank stock, forming then sleeve packaging. Early anchor chain with minimal stages.
Velvet Echo: soft coloured charms assembled, sorted and boxed. Adds batch sorting and choice of box presentation.
Suncoil: miniature luminous coils aligned in a fictional tuning rig, encased and packed. Adds precision-station capacity.
Moonfoam: puff-like fantasy material shaped in a whimsical aerator, set and packed. Adds large footprint/buffer requirements; no real chemistry.
Prism Bloom: geometric ornamental growths handled by an invented light loom, sorted and protected in cases. Adds fragile-game-item handling and valuable small batches.
Crown Assemblies: premium mixed sets using prepared goods from several lines and carton assembly. Adds cross-line planning rather than an endlessly larger price multiplier.

All are explicitly invented contraband with abstract symbols and game rules. Don't substitute real controlled-substance recipes, tools, ingredients or realistic distribution advice. The criminal tone comes from characters, setting, abstract consequences and fictional missions.

## Early economy fixture
Start with $20, 12 blank stock and 12 sleeves prepaid. One Nightglass unit uses one of each. New blank stock costs $4; sleeve costs $1; sale pays $12. Manual stages: form 6s, package 8s, handover 2s, excluding walking. Four manual sales take a theoretical minimum 64 seconds, raise cash to $68 and make the first $60 assembler affordable. The player still has eight prepaid input pairs. Physical play will take longer; tune from observed sessions.

Assembler commission $1 per completed unit. Packer commission $1 per completed unit. Commission is reserved before task start, not charged on animation or again at sale. With both workers, contribution per ordinary sale is $12 − $5 input − $2 commissions = $5 before optional logistics costs. A runner commission must be per actual transported batch, not mistakenly per each item and each frame. Report profit after all active costs.

When an accepted job can't cover commission, show Need work funds before reserving inputs. A free manual task always remains possible. A no-input neighbourhood errand gives modest cash with real active time, preventing a softlock if the player spends everything on upgrades. Price this below a functioning production line's return. No debt spiral or negative-cash trick.

## Throughput versus capacity
One assembly lane at 6s can supply 10 units/minute. One packaging lane at 8s can process 7.5/minute. Packaging limits the line. A second staffed packaging lane creates capacity 15/minute, but actual completed goods remain capped around 10/minute until assembly improves. A 4s assembly cycle then raises supply to 15/minute, making the second worker visibly useful. Travel, break and loading time reduce actual rates further.

This is a feature: players learn why their operation behaves as it does. Diagnose bottlenecks with friendly language, not require arithmetic. Never show capacity as earnings; avoid misleading “+100% profits” on a labour purchase when upstream supply is unchanged.

## Cost growth
Each upgrade uses authored cost arrays rather than an unbounded exponential function. A branch can rise modestly across six steps, but major machine tiers also require useful milestone prerequisites. Per-property tuning avoids selling global multiplicative bonuses that compound into runaway income. Maintain finite scalar caps and integer amounts, never uncontrolled floating-point currency.

Early upgrades should often be reachable in 30–120 active seconds; midgame meaningful steps may take 3–10 minutes of productive play; large premises/capers can span longer sessions with smaller useful actions along the way. These are hypotheses, not guaranteed timers or instructions to pad gameplay. Test cash/time trajectories across different choices, including cautious, aggressive, decorative and mission-focused players.

## Demand and supply
Starter customers provide repeatable small orders at a stable price. Later customers have distinct requested mix, quantity and optional active-session deadline. Never accept a deadline silently. Capacity and profitability are visible before accepting. Orders reserve output to prevent two buyers consuming it. Limit accepted jobs, allow cancellation with previewed bounded consequence and never charge fees greater than available recovery options.

Restock UI offers clear bundles and total price. Delivery is a short in-game arrival animation; high-tier routes can increase load size/reduce handling. Auto-restock becomes an earned rule: buy only below threshold, within budget, preserving specified cash reserve. No hidden offscreen spending when paused/closed. Scarcity events are bounded and forecast; a substitute or baseline recipe remains obtainable.

## Quality
Use a few meaningful bands, not 100 nearly invisible values. Quality comes from compatible recipe/machine/skill requirements and optional deliberate choices. Poor quality does not randomly invalidate a prepaid critical order. Show expected band before starting. A specialist can offer a clearly priced quality pathway with lower throughput, giving a reason to retain different lines.

## Feedback cadence and test interpretation
Measure time to first completed sale, first hire, first visible speed change, first sustained automated loop, first bottleneck fix and first room expansion. Track money earned/spent, blocked worker time, active manual time and idle waiting. The target is frequent intentional decisions. Do not “fix” pacing by adding endless free cash popups that make the economy meaningless.

The included economy checker verifies a limited sample: starter affordability, resource conservation, no negative ledger and the expected bottleneck change. It does not simulate the entire content tree or certify long-term balance.


---

# 06 · Rival gangs, raids and police pressure

## Role in the game
Pressure gives success texture and creates new upgrade opportunities, but must not destroy the pleasure of building. Start with rival characters, messages and small recoverable disruptions. Introduce active danger only after the player has a functioning staffed line and has completed a clear tutorial. Include a relaxed setting for players who mainly want operation growth; no hidden reduction in core content.

Two independent readable meters: Rival Attention and Civic Heat. They are authored game abstractions. Large optional contracts, story choices and high-profile missions raise them; safe recovery activities, reduced high-profile activity and explicit civic-resolution events lower them. Do not encode real concealment, bribery, money laundering or evasion practices. All consequences occur through fictional game rules and clear UI.

## Event scheduler
Idle → Eligible → Telegraph → Ready → Active → Result → Recovery → Cooldown. Save event ID, seed, trigger reasons, stage, participants, committed result and loss budget. Only one major pressure event at a time. Threat cannot start while onboarding, loading, already in a caper, in a modal, or recovering from a recent major loss. If paused/closed, no threat progress. A ready event waits for a fair resumable entry state.

Warnings are part of the atmosphere: a rival car idles outside, workers mention a threat, a visible notice appears, or a phone message previews likely targets and stakes. Do not create an unknown raid percentage that immediately destroys a property. Require enough warning for player choice, not a seconds-long compulsory response to an alert.

## Rival event families
Intimidation: short confrontation near the loading area; choose a bounded resource settlement, a relationship/story response or a simple arcade defence scene. Outcome changes rivalry and a small reward/repair, not ownership of the save.
Warehouse rush: a few readable AI rivals attempt to take designated crates in a contained encounter. Workers move to safe zones. Player can defend marked objectives using simple movement/defence and hire guard support. Only event-designated stock is at risk.
Equipment disruption: one station is visibly damaged/paused; repair interaction or technician assignment restores it. Alternative station remains usable. No hidden recipe deletion.
Recover a shipment: optional mission to reclaim a specific fictional cargo token. Declining means losing the bounded cargo, not all future supply access. Supply recovery can be achieved through ordinary work as well.

Give rival factions distinct style and motivations: the garishly dressed Copper Dogs prefer public challenges; the neat Grey Ledger crew pressures contracts; the theatrical Velvet Union competes for prestigious jobs. These are authored antagonists, not real gangs. Their characters can negotiate story truces or become recurring rivals without a city-wide war simulator.

## Police presence
Patrol silhouettes, environmental sirens, official notices and an abstract heat panel make police part of the world. Tutorial event explains exactly what heat means in game. At a threshold, queue a specific authored enforcement event with a displayed consequence range. Player options are fictional scenario resolution, accepting a capped setback, or choosing an appropriate non-criminal recovery activity; no real tactical instruction on deceiving police.

A police event can temporarily close one affected station, confiscate identified event cargo, or impose a bounded fine. Detention is a short story/result scene with checkpoint recovery, not permanent imprisonment or lost save. The game need not include attacking police; don't make violence against officers the required solution. Ordinary workers flee to safe zones and return afterwards.

## Explicit loss protection
Before the event show risked cargo/cash/repair limit. Default full release loss cap proposal: at most one tagged shipment OR a capped fraction of recent net earnings, never both compounded without preview. Absolute ceiling scales by chapter and is authored in data. Buildings keep their upgrade levels. No permanent worker death in this tycoon, no deletion of purchased premises, no negative cash, no raid on closed app. Repair costs have a no-input manual recovery route. After an event, grant a meaningful protected recovery interval and defer another major event.

Guards, strengthened shutters and warning boards improve the fictional encounter or reduce a displayed loss exposure, not make it silently impossible to lose. Their visual presence matters. A guard patrols/stands at the assigned position, helps in valid encounters and cannot also package goods. Defence purchases should feel like real workers/equipment, not invisible insurance multipliers.

## Controls and fairness
Two-thumb movement, contextual interaction, one defence/attack control and dodge only where introduced. If adding combat, keep enemy counts modest, telegraphs strong and damage non-graphic. No tiny aiming targets. Auto-target assist excludes noncombat workers. Outcome uses collision/AI state, not random unannounced defeat. Camera and UI do not hide objectives under thumbs.

Before pressure is expanded, prove the noncombat event/recovery loop. More dangerous missions are optional authored progression branches; players can grow the operation through production even if they avoid high-pressure play.


---

# 07 · Big capers and late-game variety

## Why capers belong
Late-game missions create a new way to use your organisation: select a small crew, prepare abstract equipment, play a short bespoke scenario and bring back something that changes your operation. They should not turn the entire game into a mediocre shooter or passive percentage-success menu.

Use invented arcade spaces, symbolic mechanisms and clearly fantastical objectives. No realistic security vulnerabilities, lock/electronic bypass methods, real target layouts or operational criminal procedure. A “vault” can be a stylised puzzle chamber with obvious game switches and a glowing prize. The entertainment is movement, teamwork, timing and meaningful choices.

## Unlock and staging
A caper board opens after multiple properties and a stable staffed line, initially Chapter 5/6. First teaser appears earlier as a story invitation so the ambition is visible. A staging room has lockers, a planning table, selected crew, gear props and a vehicle arrival animation. Preparation is a few understandable choices, not a real-world blueprint.

Each caper card shows premise, entry cost, recommended abilities, expected active duration, failure loss cap, reward types and checkpoint rules. Assign up to two worker companions. Their absence affects home capacity, previewed before committing. Roles offer alternate solutions, not a mandatory rare hire. Practice/tutorial variant explains movement and actions without risking the operation.

## Caper loop
Choose operation → assemble crew/loadout → enter authored scene → complete 2–3 varied challenges → secure objective → reach clearly marked game exit → result/reward → return to visible home improvement. Target 3–7 active minutes for initial missions. Save at major phase boundaries; pause and resume freely in single-player. Home routine work may continue through the same simulation clock, but all home raids are deferred while a caper is active.

## Six proposed scenarios
THE WRONG VAN: original compact depot arena, identify a game-marked cargo among decoys using visible symbol clues, carry it across a moving-platform route, return to staging. Reward trolley/loader module blueprint. No real vehicle entry or theft method.
THE NIGHT AUCTION: theatrical fictional event where an item changes hands through game stations; interact with characters and complete a timing/route challenge to claim the story objective. Reward a rare workstation skin and optional quality module; the player does not place real-money bets.
THE SKYLINE SWITCH: fantastical rooftop set with obvious colour/shape switches, bridge states and weather hazards; technician and runner offer different routes. Reward broad logistics module and a new property lead.
THE MOVING SHOWROOM: stylised train-like diorama of sliding rooms with safe vestibules; carry a large object while crew helps at explicit game levers. Reward high-capacity cart system. No real rail-security detail.
THE GLASS PALACE: extravagant original puzzle location; align visible light shapes and navigate readable guardian constructs. Reward premium product blueprint and a distinctive machine asset.
THE BIG HANDOVER: multi-stage story finale bringing your rival relationships and prepared crew together; complete invented objective stations and choose a bounded alliance outcome. Reward headquarters expansion and repeatable challenge variants, not a forced reset.

These are briefs, not already built levels. Each needs geometry, readable objectives, animations, audio, encounter rules, checkpoints and a real ending. Build one complete caper before announcing the others in the release UI.

## Crew abilities
Runner handles time-sensitive carrying; technician operates authored machine nodes; hauler carries larger objective pieces; guard provides a short protection window; quality specialist identifies objective markings; supervisor coordinates a clearly defined teammate action. Skills are reliable at valid targets, with cooldown/progress and interruption. Two useful role combinations can finish each main caper. Core progression never requires a randomly generated trait.

## Rewards and failure
First completion gives a unique unlock plus bounded cash/material reward. Repeats give predictable reduced ordinary rewards and optional mastery objectives, not duplicate unique blueprints. No paid random loot crates. Caper-earned machines can also have slower production/story unlock routes where needed so the main tycoon isn't permanently blocked.

Failure loses only previewed entry supplies/event cargo or a small chapter-capped fee. Crew temporarily recovers, never dies permanently. Buildings, learned recipes and purchased tiers survive. Retry from safe checkpoint or abort to home. No forcing all stages again because a phone call interrupted the app. All unique rewards and outcomes are idempotent transactions.

## Late-game depth
Specialise properties, pursue mixed-product contracts, develop crew abilities, create efficient layouts, customise headquarters and master caper variants. New product/process content should change decisions. Do not substitute arbitrary escalating cash requirements for deeper mechanics. The original backroom can remain a profitable sub-line or personal showcase throughout.


---

# 08 · Pixel-art and feedback production bible

## Art direction
Top-down with visible building fronts, chunky readable characters and tangible machines. Default 16px grid, roughly 24×32 character frame, feet pivot and independent smaller foot collider. If an existing coherent art system differs, preserve it and document measurements. Render world at a deliberate low logical resolution with nearest-neighbour scaling; UI at crisp readable display resolution. Validate camera framing and pixel stability on actual phones before commissioning many assets.

Palette: warm ochre floors, deep teal shadows, cream work surfaces, copper/rust equipment, product-specific accent colours, restrained neon outside. Higher tiers get cleaner layout, moving components and richer silhouette, not simply gold recolours. Leave negative space at work anchors so hands, materials and outputs remain visible. Roofs/walls fade when obscuring the player. Use light for mood without turning packaging into a dark pixel hunt.

## Upgrade presentation contract
For each upgrade define: existing sprite/animation, new visual components, changes to motion cadence/batch representation, new interaction anchors, output effect, sound variation, UI preview and actual simulation delta. A QA reviewer must be able to point to the change in normal gameplay. No effect may depend solely on a tiny level badge.

Speed step: shorter pause between actions and proportionate machine motion, still readable. Hiring: distinct new worker enters, reaches a different anchor and works. Capacity: shelf/crate/packing tray visibly larger. Equipment: dispenser, motor, belt, stacker or extra articulated part added. Training: more efficient hand sequence at major tier. Logistics: trolley/vehicle/route genuinely used. Research: new tool/product appears on workbench. Defence: new guard or visible fixture. Comfort/customisation: furniture, lighting, staff activity or facade changes.

## Required worker animations
Idle, walk, carry small batch, carry crate, collect, place, form, fold/pack, operate lever, inspect, load, celebrate briefly, blocked/wait, take short break, flee to safe area, recover and relevant caper action. Roles can share base rigs/sheets with task-specific overlays, but hands and props must align. Newly hired worker uses a unique clothing/portrait combination to make added staffing obvious.

Station animation follows actual normalised job progress and machine state. Empty stations idle; full output visibly stacks to a cap; blocked machines stop. During extreme speed tiers, larger trays or parallel lanes express extra output. Animation cannot show 3 packages while ledger creates 30 unexplained units. Output VFX is one per batch or a clearly represented batch cluster.

## Asset pipeline
Inventory supplied assets first; none is included or assumed owned in this pack. Use coherent licensed pixel-art bases, create bespoke machine tiers and UI icons, and record source/author/licence/allowed redistribution/attribution. Keep raw source and atlas exports separate. Art acquisition and sprite cleanup are real tasks, not something generic rectangles satisfy. Image generation can assist concept exploration if available, but final sheets require deliberate grid/palette/pivot/frame consistency.

First-slice assets: player, two worker roles with full cycles, backroom and adjoining-room tiles/props, forming bench, two packaging-table versions, rack/tray, delivery pad/door, supplies/intermediate/finished item sprites, cash/order feedback, complete small icon set and main menus. Add recognisable windows, personal objects and room wear to avoid a sterile factory diagram.

## Particles and camera
Short paper flecks at packaging, wood dust at expansion, sparks at machine upgrade, smoke/steam only on invented equipment, small coin/cash flyout on actual sale. Decorative effects pooled and bounded. Default starting budgets 100/200/350 active cosmetic particles in low/medium/high modes; profile, don't promise compatibility. No permanent screen shake or fireworks per item. Strongest celebration for first hire, new room, machine tier and mission completion.

Camera gives modest lookahead, collision-free interior framing and a quick optional focus on purchased improvements. Don't drag the camera away while player is handling a threat. Reduced-motion disables focus sweeps/flyouts but keeps benefit labels and signals.

## Sound
Each work cycle gets a small material-specific sound: fold, press, clack, tray drop. Multiple machines create a controlled layered rhythm; voice/cycle concurrency limits prevent a wall of noise. Faster operation changes cadence naturally, but don't pitch everything to absurd squeaks. Cash confirmation is short and pleasant; big upgrades get a distinct brief motif. Staff react occasionally, not every purchase.

Music shifts between quiet beginning, busy workshop, district travel and caper tension. Separate ambience, music, machines, UI and threats volumes. Audio unlocks on Start/Continue user gesture and resumes correctly after interruption. Every necessary warning has a visual equivalent. No paid or unlicensed music assumed.

## Visual QA scenes
Compare same camera before/after: first hire; speed upgrade; second lane; machine tier; room expansion; busy warehouse; pressure event; caper return. Inspect at target phone size and in motion. A beautiful static room with motionless workers fails. A mathematically correct sim with unreadable fast animation also fails.


---

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


---

# 10 · People, setting and content production

## Setting
A fictional rain-soaked city called Bellwater, with compact districts and a slightly theatrical criminal economy. The player's initial room is borrowed behind a shuttered shop. They have a workbench, supplies and an order, not an empire handed to them. Visual storytelling shows growth through reclaimed space, equipment, people and personal touches.

Story supports progression without lengthy interruptions. A practical mentor introduces work; a supplier offers increasingly specialised fictional components; customers have preferences and quirks; rivals appear as recurring characters; a coordinator offers bigger capers after the operation proves capable. No real cartel names, logos or historical criminal organisations required.

## Core characters
Mina, the first reliable assembler: meticulous hands, dry humour, clear tutorial teaching. Jules, a lively packer: expressive work poses, takes pride in making the room look professional. Oren, supplier: battered van, remembers your first order, offers broader stock by chapter. Cass, technician: upgrades equipment and appears physically at installations. Ren, coordinator: introduces short caper opportunities with honest game risk previews. Inspector Vale: recurring fictional authority figure whose notices/events create pressure; not a caricature requiring combat. Rival leaders each have distinct colour/silhouette and limited recurring dialogue.

Generated employees use a consistent portrait/clothing pool, role, trait and name. They remain legible and useful. Traits are bounded preferences or specialisations, not invisible random failures. Individual histories can create short optional stories, but the player should manage production rather than thirty emotional bars.

## Worker skills
Each role has a main practical improvement: assembler cycle efficiency; packer handling; runner load/travel efficiency; stockkeeper targets/restock; loader handover batches; technician machine installation/repair; quality specialist deliberate premium processing; supervisor rules/assignment; guard event support; caper specialist authored mission actions. Role upgrades specify whether they act on one worker or a property team. A supervisor does not magically double every other worker's speed.

## Room composition
Backroom landmarks: battered desk, glowing lamp, worn floor path, front door, supply stack, package shelf and tiny personal corner. Expanded workshop adds wall opening, separate desk/bench, new shelving and a shared break spot. Warehouse has readable loading boundary, lanes, equipment clusters and elevated visual landmarks without changing top-down navigation. Headquarters adds meeting/staging/office spaces and personalised displays of past projects.

Design navigable paths before decorative clutter. Important work anchors never overlap. Doors need actual carrying clearance. Tall props fade appropriately. Windows and rain make atmosphere; consoles/screens are not generic neon wallpaper. A room should be identifiable from its silhouette and function.

## Upgrade content authoring
Each node needs mechanical effect, prerequisite, owned scope, cost, art key/change, animation behaviour, sound, UI phrase, save fields and verification. Review utility and bottleneck effect before adding more nodes. No automatic “upgrade everything” button until players understand their operation; batch actions can be a late convenience with precise preview, never the main game.

A content update should add at least one new decision—product process, room configuration, worker ability, mission interaction or visual identity—not just a more expensive numeric tier. Retain compatible old saves and meaningful older production. IDs never recycled for different items.

## Initial content budgets
Six product families, six property stages, ten roles, sixteen branches × six nodes, eight event briefs and six caper briefs. The data catalogue is a production backlog. In the first slice implement one product, first premises/adjacent room, first roles and roughly 8–12 meaningful purchases completely. Avoid exposing greyed-out buttons for dozens of unimplemented features as if they already exist.

## Narrative progression and ending
A light campaign can culminate in The Big Handover and headquarters expansion, resolving key rival relationships. Free play continues. No mandatory prestige/reset, death wipe or last-second confiscation of everything. Players can specialise, improve layouts, complete new contracts and replay authored caper variants. Keep the tycoon pleasure at the centre even after the story concludes.


---

# 11 · Implementation order for Claude Code

## M0 — audit, charter and visual target
Inspect repo/assets/instructions; identify current engine/version and commands; create asset/license manifest; pin compatible toolchain only if needed; establish data contracts and save version; create one coherent finished target room and worker cycle. Exit: a credible visual/technical direction, missing assets clearly named, no false playable claim.

## M1 — hands-on first sale
Movement/camera/touch; input/stock; forming/packaging/handover; player carry; actual batch tokens; cash transaction; minimal UI; complete animation and sound; save/load; basic no-input recovery task. Exit: repeat first sale cycle normally, see each item stage, pause/reload without losing/duplicating goods.

## M2 — visible tycoon transformation
Hire first assembler, see arrival/work; add packer; speed upgrade; extra physical lane/second worker; equipment sprite tier; friendly bottleneck explanation; restock; adjacent-room unlock. Exit: complete manual→automated transition, prove actual speed/hire differences and saved assignments. First owner review with before/after active gameplay, controls, tests and gaps. Ask whether upgrades feel visible/satisfying and UI is effortless.

## M3 — robust management
Production graph data, buffers, queues, commissions, worker reservations/path recovery, relocation, stock targets, multiple properties, role training, defined scope of upgrades, single-tab save ownership and migrations. Exit: no duplication/negative ledger; switching properties preserves real work; blocked status gives actionable diagnosis; the economy has a safe recovery route.

## M4 — product and property breadth
Three product families/two-to-three properties, horizontal capabilities, orders/quality, research, visual tiers, crew identities and supervisor rules. Exit: added products change layouts and decisions; early products remain useful; no universally dominant strategy. Measure pace before scaling catalogue.

## M5 — pressure without frustration
One complete rival encounter and one police event, clear warnings, defence visuals, bounded loss, recovery and cooldown. Exit: no offline attacks, no permanent worker/property loss, paused menus safe, and results reflect actual gameplay/choices. Do not add full combat system unless the first contained encounter proves it helps.

## M6 — first playable caper
Staging room, crew selection with home opportunity cost, small authored scene, two useful approaches, clear objectives, checkpoint/retry, actual unique reward integration into home. Exit: complete/retry/abort/reload, no reward duplication, home raids deferred, purchased ability visibly useful afterwards.

## M7 — target content and main polish
Expand justified catalogue, complete machine tiers/animations, role silhouettes, sound mix, reaction feedback, performance, accessibility, device QA and production hosting. Second owner review with actual evidence. Only label full release after all required paths and assets are complete, not merely represented in JSON.

## M8 — continued growth
New lines, distinct properties, specialist content and caper variants, with migration tests and old-save compatibility. No unnecessary reset. Use measured production throughput and playtest findings to set future scope.

## Repository habits
Small feature branches/commits, issue acceptance criteria, record architecture decisions, preserve user's files, no force-push or unrelated rewrites. Keep source, art metadata, tests and content scripts together. Main progress log distinguishes planned, implemented, tested and unverified. Exact run commands are discovered/created in actual implementation, not assumed present in this planning ZIP.

## Required milestone deliverable
Build/commit, launch/control instructions, actual visual evidence, assets/licences, measured behaviour, checks, known defects and next highest-value task. Do not substitute a generated promotional picture for a screenshot of the running game.


---

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


---

# 13 · Primary references and verification limits

Checked 26 October 2026. Technical references support platform choices, not the original fictional design.

- Phaser templates: https://docs.phaser.io/phaser/getting-started/project-templates — official bundler/TypeScript template options. Choose a current compatible version and inspect actual package files rather than mixing historical tutorials.
- Official TypeScript/Vite template: https://github.com/phaserjs/template-vite-ts — useful source to inspect at scaffold time. Package versions can change; this pack deliberately doesn't prescribe an unchecked latest version.
- MDN storage quotas and eviction: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria — browser-local data is subject to origin storage behaviour and may be evicted/cleared; persistent storage isn't an unconditional guarantee. Export/import and failure handling are required.

Further implementation checkpoints: Pointer Events, Web Audio suspension, Page Visibility, IndexedDB transactions and Vite deployment/base-path documentation. Verify APIs in the selected browser/engine versions at implementation. No physical-device, actual game, asset or hosting test was performed to create this planning pack.

All timings, costs, capacities, visual budgets and content counts are proposals. The included fixture validation is deliberately limited and does not prove fun, complete balance, worker pathfinding, visual polish or production readiness.
