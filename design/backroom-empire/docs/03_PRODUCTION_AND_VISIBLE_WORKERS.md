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
