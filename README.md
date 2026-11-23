# MICROVERSE

**A persistent, fictional planet and civilization simulation.**

MICROVERSE is a long-term simulation-engineering project: a living world with geography, independent individuals, settlements, countries, institutions, economies, industry, transport and history. It is not designed as a conventional win/lose game.

## Current milestone: v0.1 — Planet Genesis

This first application milestone establishes the browser-based 3D world shell:
- A procedural, fictional planet rendered in 3D.
- Camera rotation and zoom.
- A simulation clock: **1 real second = 1 simulation minute**.
- Pause/resume controls and a responsive observer interface.
- A modular foundation for future simulation systems.

The globe is an initial visual prototype. It does **not** yet simulate the one million inhabitants, countries, economies, factories or transport networks. Those systems are planned milestones, not currently implemented features.

## World constitution

- Fictional planet; history begins at primitive settlements in Year 0.
- Initial population target: 1,000,000 simulated individuals.
- Individuals should have distinct identities, personalities, needs, memories, relationships, beliefs and self-generated ambitions.
- No mandatory civilization progression or predetermined life paths.
- The world is observed and shaped through laws, policies and institutions rather than direct control of every individual.
- Countries may maintain different economic systems and currencies. Some may form currency unions. International trade uses a shared settlement currency without replacing domestic currencies.
- Goods move through physical supply chains using roads, rail, aircraft and sea transport; inventory does not teleport.
- Simulation logic must remain independent of the 3D renderer.

## Technology

- TypeScript + Vite
- Three.js for 3D rendering
- Browser-based application, designed responsively for phones
- Railway for hosting; GitHub for source control

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run start
```

## Project documents

- [Project blueprint](docs/PROJECT_BLUEPRINT.md)
- [Technical architecture](docs/TECHNICAL_ARCHITECTURE.md)
- [Development roadmap](docs/DEVELOPMENT_ROADMAP.md)
- [Development log](docs/DEVELOPMENT_LOG.md)

## Development principles

1. Define → design → build → test → integrate → simulate → optimize → freeze.
2. Keep simulation state separate from rendering state.
3. Make important simulation rules deterministic and testable.
4. Use event-driven and aggregated simulation where appropriate; do not attempt to run one heavyweight AI conversation per inhabitant every frame.
5. Preserve working milestones with small, understandable commits.
