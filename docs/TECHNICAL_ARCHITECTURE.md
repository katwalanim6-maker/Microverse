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

## 3. Proposed module boundaries

```text
src/
  app/             Application startup and lifecycle
  render/          Three.js scene, camera, planet and visual effects
  simulation/
    clock/         Simulation clock and time conversion
    world/         World state and geography data
    population/    Individual identity and population scheduling
    society/       Households, communities and institutions
    governance/    Laws, policies and political systems
    economy/       Markets, currencies, firms and accounting
    industry/      Factories, production and inventory
    logistics/     Routes, vehicles, shipments and delivery
  ui/              Observer interface and panels
  storage/         Save/load and schema versioning
  shared/          Types, constants and utilities
```

Only modules required by the current milestone need to exist in code. Future folders should be introduced when their contracts are defined.

## 4. Rendering strategy

Use a globe-first camera with orbit controls. Later zoom tiers:
- Planet: globe, continents, oceans and broad borders.
- Regional: countries, provinces, terrain, roads and settlements.
- Local: buildings, inhabitants and vehicles.
- Site: individual homes, factories, warehouses and institutions.

Use level of detail (LOD). Distant regions should use simplified geometry and aggregated markers. Close-up detail is loaded only for the observed area. Cap device pixel ratio and avoid rendering a million individual meshes.

## 5. Simulation time

The constitutional rate is one simulation minute per real second. The clock should be a separate service with:
- Accumulated simulation time.
- Pause/resume.
- Controlled speed multiplier.
- A monotonic elapsed-time source while the app is active.
- Persisted timestamp/checkpoint for recovery.
- Deterministic tick/event ordering where practical.

Rendering frame rate must never define simulation time.

## 6. Population scale

One million inhabitants is a data and simulation target, not a requirement to instantiate one million detailed 3D objects or run one million LLM prompts continuously.

Use compact records, event queues, spatial partitioning, coarse regional aggregation and selective detailed updates. Define measurable performance budgets before increasing active-agent detail.

## 7. Persistence

Persist versioned world snapshots and event/checkpoint data. A save should include world seed, simulation time, population state, institutions, economy and pending events as those systems are introduced. Migrations must be explicit and tested.

## 8. Testing strategy

- Unit tests for time, deterministic generation and economic calculations.
- Integration tests for cross-module state changes.
- Simulation tests for long-run stability and plausible emergent outcomes.
- Performance tests on target phones.
- Persistence tests for save, reload and schema migration.

Every milestone follows: define → design → build → test → integrate → simulate → optimize → freeze.
