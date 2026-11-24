# MICROVERSE — Development Roadmap

## Ten connected world systems

These are the ten major systems that make up MICROVERSE. They are designed together and will be integrated continuously; implementation follows their data dependencies so that every system operates on the same authoritative world state.

1. **Complete globe and geographical world** — planet shape, continents, oceans, elevation, climate, biomes, rivers, resources and navigable geography.
2. **Countries, borders and governments** — country territories, border data, provinces, capitals, institutions and government structures.
3. **Population and individual minds** — 100 million persistent inhabitants (one million in each of 100 countries), identity, personality, needs, memory, skills, ambitions and autonomous decisions.
4. **Families, communities and societies** — households, kinship, friendships, neighborhoods, communities, organizations, culture and social institutions.
5. **Production, economy and currency** — land use, farms, businesses, factories, workers, supply chains, national currencies, currency unions and Global Credit (GCR) settlement.
6. **Politics, laws and diplomacy** — laws, public opinion, elections, courts, peaceful political movements, treaties, trade relations and international institutions.
7. **Autonomous world simulation** — event-driven agents, markets, institutions, environmental processes and emergent world events.
8. **Observer and World Architect modes** — observation, inspection, analytics, policy creation and carefully controlled world-level interventions.
9. **Historical memory and generations** — persistent timelines, records, births, deaths, generational change, institutional memory and historical archives.
10. **Advanced civilization behaviour** — science, technology, education, culture, environmental adaptation, automation and long-term societal change.

## Milestone 0 — Project foundation

- Repository and documentation.
- TypeScript/Vite application.
- Build and hosting pipeline.
- Module boundaries and test conventions.

## Milestone 1 — Living Planet Atlas (v0.1)

The first playable/observable world should establish the planet as a real data model, not just a textured sphere.

- Procedurally generated fictional planet with a reproducible world seed.
- Distinct continents, oceans, coastlines and geographic regions.
- Foundational elevation and terrain classification, with room for rivers, climate and biomes.
- Country territories and visible borders built from geographic region data.
- A starting population of 100,000,000: exactly 1,000,000 in each of 100 countries, represented in regional population records and displayed at globe/region scale. This is an aggregate population layer at this milestone; detailed individual minds arrive in the population system.
- Country records with stable IDs, names, territory references and population totals. Government behaviour is added in the governance system.
- Responsive globe rotation, zoom and camera controls, tested on a phone.
- Simulation clock at 1 real second = 1 simulation minute.
- Versioned world seed and save/load foundation.
- Geography and country data remain independent of Three.js rendering code.

**Acceptance:** production build succeeds; globe works on a phone; drag rotation feels immediate and predictable; zoom works; continents and country borders are geographically coherent; country count is 100; each country starts with exactly 1,000,000 people; global population sums to 100,000,000; land coverage is 73%; clock pause/resume works; the same seed reproduces the same base geography; no simulation rule is embedded in rendering code.

## Milestone 2 — Population and individual minds

- One million persistent identity records.
- Personality, needs, memory, skills and ambitions.
- Decision policies and event-driven scheduling.
- Social relationships and learning.

## Milestone 3 — Families, communities and settlements

- Households, communities, villages, towns and cities.
- Public buildings and services.
- Education, healthcare, culture and professions.

## Milestone 4 — Countries and governance

- Provinces, administrations, laws and government institutions.
- Taxation, courts, public opinion and peaceful political change.
- Diplomacy and international institutions.

## Milestone 5 — Production and national economies

- Households, farms, businesses, jobs and wages.
- Markets, prices, banking, taxation and domestic currencies.
- Multiple economic models between countries.

## Milestone 6 — Industrial civilization

- Mines, energy, factories, workers and production.
- Warehouses, inventory, costs and accounting.
- Labour shortages, business growth and failure.

## Milestone 7 — Global transportation

- Roads, trucks, railways and trains.
- Airports, aircraft, seaports and ships.
- Routes, crews, maintenance and shipment tracking.

## Milestone 8 — International economy

- Currency unions and exchange rates.
- Global Credit (GCR) settlement system.
- Customs, imports, exports and international banking.

## Milestone 9 — Autonomous and advanced civilization

- Event-driven world simulation and emergent outcomes.
- Research, technology, environmental systems and automation.
- Culture, media and long-term international development.

## Milestone 10 — Observer, World Architect and history

- Planetary observation and inspection.
- Policy and law editor with controlled interventions.
- Historical timelines, generational records and analytics.

## Release discipline

Each milestone must have acceptance criteria, automated checks where possible, a phone test, a saved checkpoint and a clear list of what is not yet implemented. Never overwrite the last known-good milestone without a recoverable version.

Each module follows: define → design → build → test → integrate → simulate → optimize → freeze.


## World Expansion 2.0 — scale and open-ended civilization

This expansion extends the ten connected systems without replacing their foundations.

### World scale and resolution
- Preserve one authoritative spherical geography grid; renderer resolution and simulation resolution remain separate.
- Benchmark a staged resolution ladder: 540 × 270 baseline, 1080 × 540, 1620 × 810, then 3240 × 1620 only after memory, generation-time and phone-render benchmarks pass.
- Keep the 73% land target measured by spherical cell area, not raw pixel count.
- Use typed arrays / compact cell fields and deterministic generation; avoid one heavyweight object per cell where practical.
- Increase visual planet scale independently from map-cell resolution and retune camera clipping, zoom and celestial presentation as a single tested change.
- Add higher-resolution texture/mesh sampling without creating one Three.js object per geography cell.

### Open-ended lives and professions
- Profession definitions are data-driven and extensible, not a closed enum of permitted jobs.
- Support inventors, philosophers, scientists, astronauts, engineers, artists, trades, services and future occupations.
- New occupations can emerge from discovered knowledge, tools, institutions, economic demand and social change.
- People may change occupations, combine skills, found organizations and pursue unusual ambitions; the simulation must not guarantee that every person can do every job.

### Political and historical change
- Leaders, succession, institutions, diplomacy, treaties, independence, state mergers/splits and territorial changes are persistent world events.
- Conflicts are represented as abstract, high-level simulation outcomes with political, demographic, economic and territorial consequences; no real-world tactical instruction is part of the simulator.
- Every border change and leadership transition is recorded in the historical event log and can be inspected on a timeline.

### Spacefaring expansion
- Space development is gated by scientific knowledge, industrial capacity, institutions, resources and accumulated technology.
- Add satellites, orbital infrastructure, spaceflight and eventual off-world settlements as later simulation layers.
- Space locations use their own coordinate and environment model while remaining connected to the planetary economy and history.

### Performance and persistence
- Keep simulation logic independent from the Three.js viewer.
- Use aggregate population cohorts plus selectively materialized individual records; do not instantiate 100 million full autonomous AI objects.
- Persist versioned world snapshots, event history, simulation time and random seeds.
- The target time rate is 1 real second = 30 simulated minutes; persistent cloud execution is a separate infrastructure milestone and is not provided by a browser tab alone.
