# BACKROOM EMPIRE — repository implementation guidance

Read README, START_HERE_PROMPT and relevant docs. This is a 2D pixel-art browser game for iPhone, not a Roblox place or The Turning expansion. Preserve a suitable existing implementation and user assets; inspect before editing. If blank, choose a supported pinned TypeScript + Phaser + Vite combination from current official docs. Do not mix engine-version APIs or replace working architecture for convenience.

Priority: easy controls; real visible workers; cycle-linked animation; tangible upgrades; understandable production bottlenecks; frequent meaningful progress; coherent art. Every unlock and stat improvement needs the presentation contract in docs/02–05. No pretend income, cosmetic workers with no simulation job, or advertised speed without real throughput change.

Build the smallest complete slice: manual work → sell → hire → worker visibly takes over → upgrade cycle → add another real worker lane → detect supply bottleneck → fix it → unlock room → save/reload. Include failure/recovery and controls. Expand to raids/heists after production, saves and readable movement work.

Simulation owns items, inventory, assignments, money, orders, progression and events. Presentation listens; particle completion never grants output. Use explicit work reservations, integer money, bounded queues, transaction IDs, versioned saves and deterministic fixtures. Prevent duplicate hires/crafts/purchases/rewards. No destructive browser save resets.

Use real coherent assets and complete relevant animation sets. Grey boxes are temporary. If missing assets/tool/device access, document the gap and continue independent tasks; never claim imported art, test results or polish without evidence. Keep licensing records. No runtime AI service is necessary.

Ordinary safe Hire/Upgrade/Build buttons are one press with clear price and benefit. New worker opens a valid position or offers a transparent bundled position+worker purchase; never sells an unusable hire. Show actual output versus theoretical capacity and why work is blocked.

Content is fictional stylised crime. Keep production abstract and heists as invented arcade encounters. Police pressure is an explicit game meter/event system, not advice about real policing. No paid revives, coercive purchases, hidden timers, daily streak punishment or offline attacks.

At first playable and main polish milestones, report controls, real assets, active-play evidence, checks, known gaps and one focused owner review question. Continue ordinary reversible tasks without excessive approvals. Respect actual authorization for repo operations/publication; this plan doesn't grant account access.
