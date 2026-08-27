# Nitto 1320 Challenge Recreation — Project Specification & Development Roadmap

**Project type:** Faithful recreation / spiritual restoration of the original pre-2007 **Nitto 1320 Challenge** browser game  
**Target era:** Approximately 2004–2006, before Nitto 1320 Legends  
**Primary development method:** Claude Code and/or OpenAI Codex, working one defined stage at a time  
**Status:** Planning / pre-production specification

---

## 1. Project Vision

The goal is to recreate the **original pre-2007 Nitto 1320 Challenge experience** as closely as practical while using a modern, maintainable codebase.

This project is **not** a recreation of Nitto 1320 Legends and must not drift toward Legends-era systems such as large MMO-style track rooms, neighbourhood/property progression, massive vehicle catalogs, or complex live multiplayer infrastructure unless explicitly added much later as a separate decision.

The core experience should remain simple and recognisable:

> **Buy a car → race → earn money → buy parts → tune → improve quarter-mile performance → race better opponents → buy better cars.**

The defining multiplayer feature is **asynchronous racing**. Players should be able to send races to another player, complete their own pass, and allow the opponent to complete their run later. The game then compares the results and determines the winner.

The project should retain the compact, early-2000s browser-game feel rather than being redesigned into a modern 3D racing game.

---

## 2. Historical Target

The target game is **Nitto 1320 Challenge**, specifically the pre-2007 version remembered from roughly 2004–2006.

Key characteristics of this target:

- Small car roster, approximately 10 normal road cars plus a few special late-game cars.
- Side-on 2D drag racing.
- No steering.
- Manual staging and launch timing.
- Manual shifting.
- Nitrous timing.
- Vehicle upgrades bought individually.
- Gear-ratio tuning.
- Dyno testing.
- CPU races for money and progression.
- Asynchronous online challenges.
- Heads-up and bracket racing.
- Cash wagers and potentially pink-slip races depending on final historical confirmation.
- Team system and team racing.
- Early-2000s browser-game style navigation and presentation.

Historical research should continue throughout development, especially when implementing systems whose exact rules, prices, or behaviour remain uncertain.

When historical evidence is available, **historical behaviour should take priority over modern game-design assumptions**.

---

## 3. Core Vehicle Roster

The initial target roster is approximately the following ten normal cars:

1. Honda Civic Si
2. Acura RSX Type-S
3. Mitsubishi Lancer Evolution VII
4. Ford Mustang SVT Cobra
5. Toyota Supra Twin Turbo
6. Nissan Skyline GT-R
7. Dodge Viper SRT-10
8. Mazda RX-8
9. Acura NSX
10. Dodge Neon SRT-4

Special / late-game vehicles may include historically appropriate cars such as:

- Mopar Drag Car
- Special F-Type / F1-style drag vehicle
- Nitto Funny Car

The exact final roster should be based on the chosen historical snapshot of the game.

The game should **not** be designed around hundreds of cars. The small roster is intentional and allows each car to have meaningful individual behaviour, upgrade paths, balance, and identity.

---

## 4. Core Game Features

### 4.1 Garage

Players should be able to:

- Own multiple cars.
- Select a current car.
- View current power and relevant specifications.
- View installed parts.
- Install and remove parts.
- Maintain separate tuning settings for each vehicle.
- Track best ET, MPH, and race record.
- Repair damaged cars.
- Eventually customise appearance.

---

### 4.2 Parts and Modifications

The game should use actual parts/categories rather than generic upgrade levels.

Expected categories include:

- Intake
- Exhaust
- ECU / electronics
- Engine upgrades
- Turbochargers
- Superchargers
- Turbo accessories / intercooling
- Nitrous
- Clutch
- Transmission
- Tyres
- Suspension
- Weight reduction
- Wheels
- Cosmetic modifications

Parts should be **data-driven**, not hard-coded into UI logic.

Each part may define:

- Name
- Category
- Price
- Compatible cars / engines
- Performance effects
- Requirements
- Mutually exclusive groups
- Damage / stress implications if relevant

Examples of mutually exclusive choices:

- Turbo **or** supercharger
- One nitrous kit at a time

A high-power build should not automatically be the fastest possible build if gearing, traction, launch, or tuning are poor.

---

### 4.3 Tuning

Tuning is a major part of the game's identity.

At minimum, support:

- Individual gear ratios
- Final drive ratio

Potentially support, if historically accurate:

- Boost setting
- Nitrous configuration
- Other tune settings confirmed through research

Tuning should meaningfully affect quarter-mile performance.

Two cars with identical parts but different tunes should be capable of producing significantly different ETs.

Historical player tuning guides should be used as regression data where available.

---

### 4.4 Dyno

The dyno should allow players to test changes without running a full race.

Display:

- Horsepower curve
- Torque curve
- Peak horsepower
- Peak torque
- RPM axis

Ideally support comparison between the current run and a previous run.

The dyno should be mechanically connected to the same underlying vehicle model used by the race simulator.

---

### 4.5 Drag Race Gameplay

The race is a side-on quarter-mile drag simulation.

There is no steering.

Player skill comes from:

- Correct staging
- Launch RPM
- Reaction time
- Managing wheelspin / bogging
- Shift timing
- Nitrous timing

The player should physically creep the car through pre-stage and stage beams rather than pressing a simple “ready” button.

Race output should include at least:

- Reaction Time (RT)
- 60-foot time
- 1/8-mile ET
- 1/8-mile MPH
- 1/4-mile ET
- 1/4-mile MPH
- Red-light / foul state

The simulator should support:

- Wheelspin
- Bogging
- Shift delay
- RPM limiter behaviour
- Traction differences between vehicles / tyres
- Vehicle-specific gearing and power curves

---

### 4.6 Vehicle Simulation Philosophy

Do **not** attempt to build an overly complex engineering simulator.

The aim is to reproduce the **behaviour and performance ranges of Nitto 1320 Challenge**, not to model every combustion variable found in a professional motorsport simulator.

The simulation should be deterministic and based on a one-dimensional drag model.

Conceptually:

```text
engine torque
→ gearbox
→ final drive
→ wheel torque
→ tyre/grip limit
→ acceleration
→ aerodynamic + rolling losses
→ vehicle speed and distance
```

Core vehicle data should include things such as:

- Vehicle mass
- Torque / power curve
- RPM range
- Redline
- Gear ratios
- Final drive
- Drivetrain type
- Tyre grip characteristics
- Aerodynamic drag

The goal is to calibrate each vehicle so that good builds and good driving produce historically plausible ET ranges.

---

### 4.7 Mechanical Damage

The original game included mechanical consequences and this should be recreated in a simple but meaningful form.

Possible stress sources:

- Over-revving
- Aggressive nitrous use
- Excessive boost
- Poor component combinations
- Repeated abuse

Damage may affect:

- Engine performance
- Turbo / supercharger performance
- Transmission performance
- Overall reliability

Damaged cars should require repair, creating a money sink and risk/reward system.

Avoid arbitrary or opaque random failures. The player should generally understand why a dangerous setup carries more risk.

---

### 4.8 Computer Racing

CPU races are the primary early-game money source.

Initial difficulty levels:

- Easy
- Medium
- Hard

Difficulty should primarily affect **driver skill**, not hidden vehicle-stat cheating.

Example behaviour:

#### Easy
- Slow RT
- Poor launch
- Inconsistent shifts
- Poor nitrous timing

#### Medium
- Reasonable RT
- Reasonable launch
- Decent shifts

#### Hard
- Strong RT
- Good launch
- Accurate shifts
- Good nitrous timing

CPU races should provide prize money that feeds the upgrade/progression loop.

---

### 4.9 Economy

The economy should support:

- Starting money
- Vehicle purchases
- Part purchases
- Repairs
- Race winnings
- Cash wagers
- Potential vehicle selling

The progression pace should feel similar to the original game rather than modern free-to-play monetisation.

Do not introduce premium currencies unless explicitly decided later for historical display purposes only.

All money changes should eventually be recorded in a transaction ledger so economy bugs and exploits can be traced.

---

### 4.10 Asynchronous Multiplayer

This is one of the defining systems and must be treated as a core feature.

Players do not need to be online simultaneously.

Challenge flow:

1. Player A selects an opponent.
2. Player A selects their own car.
3. Player A selects the opponent's car if required by the original flow.
4. Player A selects race type.
5. Player A selects wager.
6. Player A runs their race.
7. Challenge becomes an outgoing pending challenge.
8. Player B sees it later as an incoming challenge.
9. Player B does **not** see Player A's result before racing.
10. Player B performs their run.
11. Server compares both runs.
12. Winner is determined.
13. Wager and statistics are settled.
14. Both players can view the completed result.

Challenge Info should have at least:

- Incoming
- Outgoing
- Completed

The server must create immutable snapshots of each relevant vehicle/tune state so players cannot alter a challenged car after one competitor has already completed their run.

---

### 4.11 Race Types

#### Heads-Up

Standard drag race rules using the historically accurate Challenge adjudication rules.

#### Bracket Racing

Support:

- Dial-in
- Handicap start
- Breakout
- Double breakout
- Red lights
- Correct winner adjudication

Bracket rules should be researched carefully and implemented faithfully.

---

### 4.12 Wagers

Expected options:

- Race for fun
- Cash wager
- Potentially pink slips if confirmed appropriate for the target version

Online wagers must be server-authoritative.

Cash should be locked/escrowed once a challenge is committed so players cannot spend wagered funds before settlement.

---

### 4.13 Teams

Teams are a later-stage but historically important feature.

Expected features:

- Create team
- Apply to team
- Invite player
- Team leader / member roles
- Team record
- Team funds / bank
- Team race challenges
- Incoming / outgoing team races
- Team race history

Exact historical permissions and team mechanics should be refined from period documentation before final implementation.

---

### 4.14 Visual Customisation

Visual customisation should remain 2D and lightweight.

Potential options:

- Paint colour
- Wheels
- Ride height
- Tyre appearance
- Additional cosmetic items confirmed through historical research

Preferred implementation is layered 2D artwork:

```text
base car body
+ paint mask
+ wheels
+ tyres
+ optional visual overlays
```

Do not introduce full 3D vehicle models unless the project direction is explicitly changed later.

---

## 5. User Interface Direction

The UI should deliberately retain an early-2000s browser-game character.

Core navigation should resemble:

```text
MAIN | CHALLENGE INFO | GARAGE | RACE TRACK | PARTS SHOP | CAR SHOWROOM | TEAM
```

The game should **not** be redesigned as a generic modern SaaS dashboard.

Avoid:

- Glassmorphism
- Huge card-based dashboards
- Mobile-app styling
- Unnecessary animations
- Modern open-world racing conventions

Aim for:

- Fixed or bounded game canvas
- Straightforward tabs
- Strong 2D car presentation
- Compact information density
- Period-inspired controls and panels
- Modern readability without losing the original visual identity

Functional correctness comes before pixel-perfect historical styling. Serious UI fidelity is intentionally a later stage.

---

## 6. Technical Architecture Rules

These are project-wide rules and should be treated as constraints by Claude Code / Codex.

### 6.1 Separate gameplay from UI

**Never embed core game formulas directly inside React components.**

Race physics, vehicle calculations, tuning, damage, and race adjudication must live in independent TypeScript modules.

---

### 6.2 Data-driven content

Cars and parts must be defined as structured data.

Adding a new car should primarily mean adding a data definition and assets, not creating new branches of hard-coded game logic.

Do not write patterns such as:

```typescript
if (carName === "Civic" && partName === "Turbo X") {
  // special hard-coded behaviour
}
```

unless a genuine unique mechanical exception is required.

---

### 6.3 Deterministic simulation

Given the same:

- Car configuration
- Tune
- Race environment
- Player input sequence
- Simulation seed if randomness exists

…the simulator should reproduce the same result.

This is essential for regression testing and asynchronous multiplayer integrity.

---

### 6.4 Server authority for online play

Once accounts and multiplayer exist, the server is authoritative for:

- Money
- Vehicle ownership
- Parts ownership
- Installed parts
- Vehicle snapshots
- Race results
- Wagers
- Damage
- Team funds

Never trust a browser/client claim such as “I now have $50,000” or “my ET was 7.23”.

---

### 6.5 Automated tests

Physics and race-rule tests are mandatory.

Historical tunes and ET ranges should become regression tests wherever sufficient evidence exists.

Example concept:

```text
Given:
- Fully modified Civic
- Historical gear ratios
- Known nitrous configuration
- Near-optimal driver inputs

Expect:
- Quarter-mile ET falls within the historically plausible Civic range
```

A later code change that makes the Civic suddenly one second faster should fail the test suite.

---

### 6.6 Do not prematurely implement later stages

When working on a stage, Claude Code / Codex should implement **only that stage and prerequisite work required for it**.

Do not scaffold or partially implement multiplayer, teams, admin tools, special vehicles, or other future systems merely because they appear in this roadmap.

Each stage should leave the project in a clean, working state.

---

## 7. Recommended Initial Technology

Preferred initial stack:

- **TypeScript** throughout
- **React** frontend
- Simple TypeScript backend such as Fastify, Hono, Express, or an integrated framework if justified
- **PostgreSQL** once server persistence is required
- A lightweight local store can be used in the very early offline prototype if it simplifies development
- Standard TypeScript testing framework such as Vitest

A realtime multiplayer server, Redis, microservices, Kubernetes, or similar infrastructure are **not required** for the target asynchronous game.

The initial architecture should remain deliberately simple.

---

# 8. DEVELOPMENT ROADMAP

---

## Stage 0 — Project Foundation

### Goal
Create a clean project skeleton and lock in the architectural rules before gameplay development begins.

### Build

- TypeScript project structure
- React frontend
- Shared game modules
- Basic backend/API structure if needed
- Testing framework
- Basic navigation shell
- Placeholder screens for:
  - Main
  - Challenge Info
  - Garage
  - Race Track
  - Parts Shop
  - Car Showroom
  - Team
- Structured car data model
- Structured part data model
- First Honda Civic Si definition
- Basic simulation API/interface, even if physics are not yet implemented

### Do NOT build

- Full physics
- Parts shop logic
- Multiplayer
- Accounts
- Teams
- Full visual design

### Completion Criteria

- Application launches consistently.
- Navigation shell works.
- Civic can be loaded from structured data.
- Tests can instantiate a Civic and call the simulation interface.
- Gameplay logic is demonstrably separate from React components.

---

## Stage 1 — Basic Drag Race Simulator

### Goal
Make it possible to manually drive a stock Civic through a complete quarter-mile pass.

### Build

- Side-view drag strip
- Civic representation
- Pre-stage beam
- Stage beam
- Christmas tree
- Throttle input
- Engine RPM
- Gear selection
- Launch
- Vehicle movement
- Wheelspin
- Acceleration
- Shift behaviour
- Redline / limiter
- Finish line
- Reaction time
- 60-foot time
- 1/8-mile ET + MPH
- 1/4-mile ET + MPH
- Red-light detection
- Basic timing slip/results screen
- Development-only debug telemetry panel

Suggested debug values:

- RPM
- Gear
- Speed
- Distance
- Wheel torque
- Available grip
- Wheelspin
- Elapsed time

### Completion Criteria

- Player can manually stage the Civic.
- Tree sequence works.
- Player can launch, shift, and finish a quarter-mile.
- Timing slip is generated correctly.
- Different input sequences produce different outcomes.

---

## Stage 2 — Nitto Driving Feel

### Goal
Turn the generic drag model into gameplay that begins to feel like Nitto 1320 Challenge.

### Build / Refine

- Launch RPM matters
- Excessive RPM causes wheelspin
- Low RPM causes bogging
- Shift timing affects acceleration
- Early shifts lose time
- Late shifts / limiter lose time
- Meaningful shift delay
- Staging position can slightly affect start behaviour where historically appropriate
- Better throttle response
- Retry/reset flow
- Best ET tracking
- Historical-style timing slip presentation
- Initial physics calibration tests

### Completion Criteria

- Good driving consistently beats poor driving in the same car/tune.
- Launch technique matters.
- Shift technique matters.
- The stock Civic produces a plausible quarter-mile pass.

---

## Stage 3 — Garage and Parts Shop

### Goal
Create the first complete progression loop: race → earn → upgrade → go faster.

### Build

#### Garage
- Current car display
- Installed parts
- Car statistics
- Current horsepower / torque data as appropriate
- Best ET
- Install/remove part controls

#### Parts Shop
Start with approximately **25–40 Civic-compatible parts**.

Initial categories may include:

- Intake
- Exhaust
- ECU/electronics
- Engine
- Turbo
- Supercharger
- Intercooler/turbo accessories
- Nitrous
- Transmission
- Clutch
- Tyres
- Suspension
- Weight reduction

Implement:

- Prices
- Compatibility
- Requirements
- Mutually exclusive parts
- Install/remove behaviour
- Performance modifiers

### Completion Criteria

- Player can buy parts.
- Player can install/remove parts.
- Installed parts change vehicle behaviour.
- Modified Civic can become measurably faster.
- Turbo/supercharger and similar conflicts work correctly.

---

## Stage 4 — Tuning and Dyno

### Goal
Make tuning a meaningful game mechanic rather than allowing the player to simply buy every part.

### Build

#### Dyno
- Run dyno test
- Horsepower curve
- Torque curve
- Peak HP
- Peak torque
- RPM axis
- Previous/current comparison if practical

#### Gear Tuning
- Individual gear ratios
- Final drive
- Vehicle-specific gear count

Potential later tune variables may be added only where historical evidence supports them.

Create regression tests using historical Challenge gear ratios and ET information wherever possible.

### Completion Criteria

- Changing gear ratios materially affects quarter-mile performance.
- A poor tune can make a powerful car slower.
- Dyno output responds correctly to installed parts.
- Dyno and race simulator use the same underlying vehicle model.

---

## Stage 5 — Nitrous and Mechanical Damage

### Goal
Add the risk/reward behaviour associated with aggressive builds and driving.

### Build

- Nitrous activation during race
- Multiple nitrous kit strengths as historically appropriate
- Nitrous timing affects performance
- Mechanical stress model
- Over-rev stress
- Nitrous stress
- Forced-induction stress if relevant
- Damage state
- Performance penalties from damage
- Repair cost
- Maintenance / repair UI
- Damage indicator

### Completion Criteria

- Nitrous can materially improve ET.
- Nitrous timing matters.
- Aggressive/unsafe usage increases risk.
- Damaged cars lose performance and require repair.

---

## Stage 6 — CPU Racing and Economy

### Goal
Create a complete playable single-player version of the game.

### Build

- Easy CPU opponent/driver
- Medium CPU opponent/driver
- Hard CPU opponent/driver
- CPU reaction-time distributions
- CPU launch behaviour
- CPU shift behaviour
- CPU nitrous behaviour
- Starting cash
- Prize money
- Repair costs
- Part costs
- Race history
- Win/loss record
- Basic transaction logging

Balance the progression so upgrades require meaningful but not excessive racing.

### Completion Criteria

A new player can:

1. Start with the Civic.
2. Race CPU opponents.
3. Earn money.
4. Buy upgrades.
5. Tune the car.
6. Repair damage.
7. Progress from a stock Civic toward a highly modified competitive Civic.

This stage represents the first complete **offline alpha**.

---

## Stage 7 — Car Showroom and Core Vehicle Roster

### Goal
Expand from one test vehicle into the actual Nitto car roster and prove the simulation is truly data-driven.

### Build First

Add progressively:

1. Civic Si
2. RSX Type-S
3. Lancer Evolution VII
4. Supra Twin Turbo

Do not immediately add all ten cars.

Verify that these four have distinct characteristics.

Then add:

5. Mustang SVT Cobra
6. Skyline GT-R
7. Neon SRT-4
8. RX-8
9. NSX
10. Viper SRT-10

#### Showroom
- Browse cars
- Price
- Basic specifications
- Buy car
- Sell car if historically appropriate
- Own multiple vehicles
- Garage selection

Each car must define its own:

- Mass
- Power/torque curve
- RPM range
- Gearbox
- Final drive
- Drivetrain
- Grip characteristics
- Upgrade compatibility
- Historical performance ceiling

### Completion Criteria

- At least four cars initially feel distinctly different.
- Simulator contains no Civic-specific assumptions.
- Full normal roster can eventually be bought and modified.
- Competitive ET ranges are historically plausible.

---

## Stage 8 — Visual Customisation

### Goal
Allow players to make visually distinct versions of the same car while retaining a lightweight 2D rendering system.

### Build

- Paint colours
- Wheels
- Wheel sizes if historically appropriate
- Ride height
- Tyre appearance
- Other cosmetics confirmed from Challenge research
- Layered 2D vehicle rendering

### Completion Criteria

- Two players can own the same model but create clearly different-looking cars.
- Cosmetic choices do not require separate full car renders for every combination.

---

## Stage 9 — Accounts and Persistent Profiles

### Goal
Move from an offline game into persistent online accounts in preparation for multiplayer.

### Build

- Account creation
- Login
- Username/player name
- Persistent garage
- Persistent wallet
- Persistent parts and tunes
- Persistent race history
- Player profile
- Player search
- Server-authoritative vehicle ownership and economy
- Database migrations

### Completion Criteria

- Player can log in from a different device/session and retain the same game state.
- Client cannot directly grant itself money/cars/parts.

---

## Stage 10 — Asynchronous Online Challenge System

### Goal
Recreate the defining asynchronous multiplayer experience of Nitto 1320 Challenge.

### Build

#### Challenge Creation
- Select opponent
- Select own car
- Select opponent car where historically appropriate
- Select race type
- Select wager
- Select track/lane if confirmed appropriate
- Perform challenger run
- Send/store challenge

#### Challenge Info
- Incoming
- Outgoing
- Completed

#### Async Resolution
- Opponent receives challenge later
- Challenger result remains hidden
- Opponent completes race
- Server compares results
- Winner determined
- Stats settled
- Result becomes viewable

#### Integrity
- Immutable car/tune snapshots
- Stored player input stream or equivalent authoritative race data
- Stored RT, ET, MPH, splits, foul states

### Completion Criteria

- Two players can complete a competitive race without ever being online simultaneously.
- First player's time cannot be seen by the second before they race.
- Car configuration cannot be altered to exploit an already-started challenge.

This stage represents the core **online beta milestone**.

---

## Stage 11 — Heads-Up, Bracket Racing, and Wagers

### Goal
Complete the historically important competitive rules.

### Build

#### Heads-Up
- Historically accurate winner calculation
- Fouls/red lights

#### Bracket Racing
- Dial-in
- Handicap start
- Breakout
- Double breakout
- Red-light handling
- Correct winner adjudication

#### Wagers
- Race for fun
- Cash wager
- Escrow/locked funds
- Settlement
- Potential pink slips if confirmed for the chosen version

### Completion Criteria

- H2H races reliably adjudicate winners.
- Bracket races correctly handle edge cases.
- Wagers cannot be duplicated, avoided, or spent after commitment.

---

## Stage 12 — Teams

### Goal
Recreate Challenge's social/team competition layer.

### Build

- Create team
- Apply to team
- Invite player
- Accept/reject
- Team leader/member roles
- Team profile
- Team record
- Team bank/funds
- Deposit/withdraw controls
- Team challenges
- Incoming/outgoing team races
- Team race history

Historical permissions should be researched before finalising the detailed rules.

### Completion Criteria

- Players can form teams.
- Teams can hold funds.
- Teams can send and resolve asynchronous competitive races.
- Team statistics persist correctly.

---

## Stage 13 — Special Cars and Endgame

### Goal
Add long-term progression after the normal road-car roster.

### Build

Historically appropriate special vehicles, potentially including:

- Mopar Drag Car
- F-Type / special drag vehicle
- Funny Car

Determine their unlock methods from historical evidence.

Old paid-membership gating does not need to be reproduced literally unless intentionally chosen. Prefer suitable game progression such as:

- Expensive purchase
- Achievement unlock
- Career milestone
- Special event/reward

### Completion Criteria

- Late-game players have meaningful goals after mastering the standard car roster.
- Special vehicles retain their historically exceptional performance gap.

---

## Stage 14 — Historical UI Recreation

### Goal
Once functionality is stable, bring the game's presentation much closer to the original Challenge experience.

### Build / Refine

- Period-style top navigation
- Main screen
- Challenge Info
- Garage
- Race Track
- Parts Shop
- Car Showroom
- Team screen
- Race HUD
- Timing displays
- Buttons
- Panels
- Fonts and spacing where legally and technically appropriate
- Fixed/bounded game-canvas behaviour

Use surviving screenshots and historical references for layout inspiration.

### Completion Criteria

- A former Nitto 1320 Challenge player should immediately recognise the visual structure and workflow.
- UI remains readable on modern hardware without becoming a modern dashboard redesign.

---

## Stage 15 — Historical Calibration and Balance

### Goal
Move from a Nitto-inspired implementation toward a historically convincing recreation.

### Build

Create a documented historical balance matrix for each vehicle:

- Stock ET target
- Modified ET target
- Known community tune(s)
- Historical gearing
- Known parts/build data
- Expected top-end performance

Examples of rough historical competitive ranges to investigate/calibrate:

- Civic: low 8-second range
- RSX/Evo/Supra/Cobra/Skyline: mid-to-high 7s
- NSX: low 7s
- Viper: low 6s
- Special drag cars: much faster

Exact figures must be validated during research.

Convert reliable historical examples into automated tests.

Also calibrate:

- Car prices
- Part prices
- CPU winnings
- Repair costs
- Progression rate
- Damage risk
- Wager behaviour

### Completion Criteria

- Historical builds produce historically plausible results.
- Future physics changes are guarded by regression tests.
- Economy feels similar in pace to remembered Challenge progression.

---

## Stage 16 — Administration, Security, and Deployment

### Goal
Prepare the game for stable ongoing use by real players.

### Build

- Admin car editor
- Admin parts editor
- Balance configuration tools
- Account moderation
- Economy ledger viewer
- Race inspection tools
- Suspicious-result / anti-cheat checks
- Error logging
- Database backups
- Automated migrations
- Production hosting
- HTTPS
- Monitoring

Admin tools should allow common balance changes without editing source code.

### Completion Criteria

- Game can be safely hosted for multiple players.
- Important actions are auditable.
- Economy and race anomalies can be investigated.
- Balance data can be modified without rewriting game logic.

---

# 9. Release Milestones

## Prototype — Stages 0–2

> A player can manually drive a Civic through a convincing Nitto-style quarter-mile pass.

---

## Offline Alpha — Stages 3–6

> A player can race CPUs, earn money, buy parts, tune, dyno, use nitrous, damage/repair the car, and build a fast Civic.

---

## Garage Alpha — Stages 7–8

> The normal Nitto vehicle roster is playable and visually customisable.

---

## Online Beta — Stages 9–12

> Players can create accounts, send asynchronous races, bracket/H2H race for wagers, and participate in teams.

---

## Historical Recreation — Stages 13–16

> The endgame, UI, vehicle performance, economy, and progression increasingly resemble the original pre-2007 Nitto 1320 Challenge.

---

# 10. Explicit Non-Goals / Scope Guardrails

Unless deliberately added in a future project decision, do **not** implement:

- Nitto 1320 Legends neighbourhood/property progression
- Massive 100+ car roster
- Open-world driving
- Steering-based circuit racing
- Full 3D vehicle simulation
- Realtime MMO track rooms
- Spectator servers
- Complex WebSocket live-race infrastructure
- Redis solely for speculative future scale
- Microservice architecture
- Modern battle passes
- Loot boxes
- Premium currency economy
- Generic mobile-game progression
- Modern card-dashboard redesign

These systems are outside the target scope and create unnecessary complexity.

---

# 11. Rules for Claude Code / Codex

When using this document as an AI-agent handoff, the coding agent should follow these rules:

1. **Read this entire specification before changing project architecture.**
2. **Confirm the current development stage from the repository before implementing work.**
3. **Only implement the requested stage unless a small prerequisite is essential.**
4. **Do not silently introduce features from later stages.**
5. **Do not substitute Nitto 1320 Legends mechanics for Challenge mechanics.**
6. **Keep gameplay calculations outside UI components.**
7. **Keep cars and parts data-driven.**
8. **Preserve deterministic race simulation.**
9. **Add automated tests whenever changing physics, tuning, or race adjudication.**
10. **Do not replace working systems wholesale unless specifically instructed.**
11. **Prefer incremental changes over large rewrites.**
12. **Document uncertain historical behaviour rather than inventing certainty.**
13. **If a historical rule is unknown, isolate it behind configuration so it can be corrected later.**
14. **Do not optimise for theoretical massive scale before the game is proven.**
15. **Maintain a working build at the end of every stage.**

---

# 12. Recommended Repository Documentation

The repository should eventually contain:

```text
/PROJECT_SPEC.md       <- this document
/ROADMAP.md            <- current stage and progress summary
/HISTORICAL_NOTES.md   <- sources, screenshots, confirmed/uncertain original behaviour
/BALANCE_NOTES.md      <- ET targets, prices, progression data
/ARCHITECTURE.md       <- actual code architecture once established
/CHANGELOG.md          <- meaningful project changes
```

`ROADMAP.md` should identify:

- Current stage
- Completed stages
- In-progress tasks
- Known bugs
- Deferred items
- Next acceptance criteria

This prevents Claude Code / Codex from relying on chat memory to understand project state.

---

# 13. Ultimate Success Criteria

The project succeeds if a former Nitto 1320 Challenge player can experience the following loop and immediately recognise it:

1. Start with a modest Civic.
2. Race the computer for money.
3. Buy meaningful individual modifications.
4. Experiment with gearing and tuning.
5. Run the dyno.
6. Learn the correct launch RPM.
7. Improve shift and nitrous timing.
8. Turn the Civic into an 8-second car.
9. Save for faster cars such as the RSX, Evo, Supra, NSX, or Viper.
10. Inspect other players and send asynchronous races.
11. Log in later to see incoming challenges and completed results.
12. Compete in heads-up and bracket races for fun or money.
13. Join a team and participate in team competition.

The project is **not** intended to be the biggest possible drag racing game.

The design priority is:

> **Small roster, meaningful tuning, satisfying drag-race execution, nostalgic interface, and asynchronous competition.**

That combination is the identity of the game and should remain the guiding principle throughout development.
