# BACKROOM EMPIRE
## Hands-on pixel-art tycoon · Claude Code development pack
Version 1.0 · 26 October 2026

Start alone in a shabby backroom. Personally make, package and hand over fictional contraband. Hire someone and physically see them take over a task. Upgrade a workstation and watch it change. Build an increasingly busy organisation, expand to new premises, manage rival/police pressure, and eventually lead large fictional caper missions.

**This is an iPhone-first, landscape, single-player browser game with desktop controls.** The “Roblox tycoon” reference describes satisfying upgrade pacing and visible activity, not the Roblox platform. The recent Roblox Studio/Blender request concerned The Turning, a separate game; neither connector is required here. This is not a replacement for that project.

This ZIP is a detailed design and implementation handoff, not a playable build, supplied art pack or connected repository. No existing game/repo was inspected or changed. Costs, durations, capacities and progression targets are proposed and require playtesting. The included validator and economic fixtures check specific design assumptions, not actual game performance or fun.

## The non-negotiable promise
If the player buys another worker, a new person visibly arrives and works at a real position. If work speed increases, cycles and output genuinely become faster. If equipment upgrades, its appearance and capability change. Unlocks open new things to do. Never substitute a passive income multiplier for the promised action.

## Setup for Claude Code
1. Extract the folder and add it to your GitHub repo; for an existing project use design/backroom-empire and merge agent instructions rather than overwriting files.
2. Read BACKROOM_EMPIRE_MASTER_PLAN.md or the numbered docs.
3. Paste START_HERE_PROMPT.md into Claude Code with the repo open.
4. Build and review the complete first-room slice before scaling the content catalogue.
5. Preserve source, lockfile, content IDs, licence records and save migrations in the repo. No repository creation or publishing was performed for this handoff.

## Included
- CLAUDE.md: implementation rules and quality bar.
- START_HERE_PROMPT.md: ready-to-use kickoff prompt.
- docs/01–13: complete concept, interaction, workers, production, upgrades, economy, threats, capers, art, technical design and QA.
- data/: concrete product, worker, upgrade, property, event and caper definitions.
- tools/validate_pack.py: validates IDs, unlock dependencies and initial economy/throughput fixtures.
- templates/: asset, milestone and upgrade review sheets.

## Tone and scope
Stylised crime fiction, dark humour, readable pixel art. Products use invented names and deliberately invented processes. Crime missions are arcade scenarios with fictional rules, not real production, concealment, security-bypass or evasion instructions. No paid timers, compulsory ads, paid random worker rolls, offline raids or permanent progression wipe.

Single-player v1; optional PWA shell later if tested. Multiplayer, mandatory real-world clocks and detailed driving simulation are out of initial scope. Police and rivals are intended systems, but first prove the operation is fun without them.
