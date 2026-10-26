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
