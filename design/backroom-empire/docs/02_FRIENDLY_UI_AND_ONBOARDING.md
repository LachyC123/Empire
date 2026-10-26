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
