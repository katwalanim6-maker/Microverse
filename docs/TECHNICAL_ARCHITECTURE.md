# MICROVERSE — Technical Architecture

## 1. Architectural rule

The simulation core is authoritative. The 3D renderer is a client of simulation state and must never own the rules of society, time, production or decision-making. This allows the visual layer to be replaced without erasing the world.

## 2. Initial stack

- TypeScript for application and simulation logic.
- Vite for development and production bundling.
- Three.js for WebGL rendering.
- Web Workers for future background simulation workloads.
- IndexedDB for browser-side persistence.
- Railway for hosting the web application.
- GitHub for source control and milestone history.

## 3. Module boundaries

```text
src/
  app/             Application startup and lifecycle
  render/          Three.js scene, camera, planet and visual effects
  simulation/
    clock/         Simulation clock and time conversion
    world/         World state and geography data
    population/    Individual lifecycle, ledger and event scheduling
    society/       Households, communities and institutions
    governance/    Laws, policies and political systems
    economy/        Markets, currencies, firms and accounting
    industry/       Factories, production and inventory
    logistics/      Routes, vehicles, shipments and delivery
  ui/              Observer interface and panels
  storage/         Save/load and schema versioning
  shared/          Types, constants and utilities
```

Only modules required by the current milestone need to exist in code. Future modules are introduced when their contracts are defined.

## 4. Rendering strategy

Use a globe-first camera with explicit drag rotation and fixed-axis zoom (do not couple pinch gestures to rotation). The current atlas geography grid is 540 × 270 and includes:
- Per-cell elevation, moisture, temperature and biome classification.
- Procedural mountain/highland/plain relief and coastal terrain.
- Deterministic drainage paths that mark river cells.
- Country-aware natural terrain colouring and visible political boundaries.
- A high-resolution displaced 3D mesh whose vertex radius follows smoothly interpolated elevation and land/ocean height fields.
- Separate smooth Catmull–Rom country-border curves projected onto the terrain surface; borders are geometry, not darkened map pixels.
- A fixed-axis zoom camera; pinch zoom is isolated from drag rotation so zoom gestures cannot spin the planet.

Zoom tiers:
- Planet: globe, continents, oceans and broad borders.
- Regional: country territories, relief, biomes, river systems and coastlines.
- Local: future provinces, watersheds, settlements and road corridors.
- Site: future individual homes, factories, warehouses and institutions.

The next rendering stage should introduce regional tile/mesh LOD and streamed high-resolution overlays. Distant regions stay simplified; only the observed area receives the most expensive detail. Cap device pixel ratio and avoid rendering a million individual meshes. The target is perceptually sharp detail, not unlimited or physically infinite resolution.

## 5. Simulation time

The constitutional rate is one simulation minute per real second. The clock should be a separate service with:
- Accumulated simulation time.
- Pause/resume.
- Controlled speed multiplier.
- A monotonic elapsed-time source while the app is active.
- Persisted timestamp/checkpoint for recovery.
- Deterministic tick/event ordering where practical.

Rendering frame rate must never define simulation time.

## 6. Population scale and lifecycle

The starting world contains 100 countries with 1,000,000 inhabitants each: 100,000,000 globally. This is a population total, not a requirement to instantiate 100 million detailed JavaScript objects at startup.

The first lifecycle module defines:
- Compact individual identity and residence records.
- Age-in-days and life-stage helpers.
- A country population ledger.
- Explicit birth, death, migration, illness and recovery events.
- Invariants: births add one resident, deaths remove one resident, cross-border migration transfers one resident without changing global population, and illness/recovery do not change population totals.

The next stage adds individual state transitions, event scheduling, family/social records, healthcare access and demographic models. Use event queues, spatial partitioning, regional aggregation and selective detailed updates. Detailed language-model reasoning is an optional tool for selected situations, not a per-person-per-tick requirement.

## 7. Persistence

Persist versioned world snapshots and event/checkpoint data. A save should include world seed, simulation time, population ledger, individual records as they are materialized, institutions, economy and pending events as those systems are introduced. Migrations must be explicit and tested.

## 8. Testing strategy

- Unit tests for time, deterministic generation, life-stage boundaries and population events.
- Integration tests for cross-module state changes.
- Simulation tests for long-run stability and plausible emergent outcomes.
- Performance tests on target phones.
- Persistence tests for save, reload and schema migration.

Every milestone follows: define → design → build → test → integrate → simulate → optimize → freeze.
