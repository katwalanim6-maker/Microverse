# MICROVERSE — World Expansion 2.0

## Design decision

MICROVERSE is a fictional planetary civilization simulator with a long-term path to a multi-world, spacefaring simulation. This document is the design contract for expansion work; it does not claim that all listed systems are already implemented.

## Confirmed world constitution

- A larger-feeling home planet and eventual expansion into space and other worlds.
- 100 starting countries.
- 73% target land coverage, calculated using spherical surface-area weights.
- 1,000,000 starting inhabitants per country (100,000,000 total).
- Simulation clock: 1 real second = 30 simulation minutes.
- Individuals can have distinct lives, skills, ambitions, relationships and changing occupations.
- Borders, governments, leadership and institutions can change over time.
- No fixed catalogue of all possible professions or life paths.

## Geography resolution ladder

The source currently uses a 540 × 270 simulation grid (145,800 cells), while older architecture notes described a 1620 × 810 atlas. These values must not be conflated.

Resolution upgrades are gated by deterministic generation tests, memory measurements, generation-time measurements and target-phone rendering tests:

| Stage | Grid | Cells | Decision |
|---|---:|---:|---|
| Current source baseline | 540 × 270 | 145,800 | Verify and preserve |
| Benchmark A | 1080 × 540 | 583,200 | First scale-up candidate |
| Benchmark B | 1620 × 810 | 1,312,200 | Preferred high-resolution target |
| Benchmark C | 3240 × 1620 | 5,248,800 | Only after profiling and algorithm optimization |

Do not jump directly to the largest grid. Country assignment currently compares land cells against country seeds; its cost must be profiled and improved before very large grids are enabled. Land percentage must continue to use spherical cell weights, and every country must receive at least one land cell.

## Larger planet presentation

Planet physical radius, geography grid resolution, texture resolution and mesh tessellation are separate settings. Increase them independently and test camera near/far planes, zoom limits, atmosphere, borders, lighting, Sun/Moon spacing and mobile GPU memory together. Do not claim a larger physical planet merely because the texture has more pixels.

## Open-ended profession and discovery model

Profession records are extensible data, not a closed TypeScript union. An occupation may define skills, knowledge prerequisites, tools, training paths, work environments and economic outputs. The initial catalogue should include inventors, philosophers, astronauts, scientists, engineers, educators, healthcare workers, builders, farmers, merchants, artists, explorers, public servants and trades. The engine must also permit new occupations to emerge from technology, knowledge, institutions and demand.

People should be able to learn, specialize, change careers, combine skills, create organizations and develop new ambitions. Their options depend on their abilities, opportunities, resources and society; no occupation is automatically available to everyone.

## Political evolution and history

Leadership succession, government changes, diplomacy, treaties, independence, country mergers and splits, and territorial changes are persistent events. Abstract conflict simulation may produce political, demographic, economic and territorial consequences, without modeling real-world tactical instructions. All changes must be recorded so users can inspect what happened, when, and why.

## Space expansion

Spaceflight requires accumulated science, engineering, industrial capacity, infrastructure and resources. Build this in stages: astronomy, satellites, launch systems, orbital facilities, lunar exploration, off-world settlements and interplanetary travel. Other worlds need their own environments, resources, settlements and logistics.

## Simulation and compute architecture

- Simulation core is authoritative and independent of rendering.
- Use aggregate cohorts for broad population dynamics and selectively materialize individuals for detailed life histories.
- Use event queues and deterministic seeded processes where practical.
- Persist snapshots, event history, simulation time and schema versions.
- A phone is the observer/control client, not the long-running simulation host.
- Kaggle is useful for experiments and benchmarks; it does not guarantee uninterrupted 24/7 execution.
- Railway can host services, but persistent simulation workers and databases must be designed and cost-reviewed before provisioning.

## Acceptance gates

1. Reproduce the same geography from the same seed.
2. Verify exactly 100 countries and at least one land cell per country.
3. Verify 73% land by spherical surface weighting within a documented finite-grid tolerance.
4. Verify exactly 1,000,000 starting people per country and 100,000,000 total.
5. Benchmark every resolution stage for generation time, peak memory and mobile frame rate.
6. Verify the 30-minute-per-second clock, pause/resume, save/reload and offline catch-up behavior.
7. Verify border and leadership events are reversible in historical inspection.
8. Keep a known-good deployment while testing expansion on a separate branch/environment.
