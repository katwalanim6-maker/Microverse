# MICROVERSE

**A persistent, fictional planet and civilization simulation.**

MICROVERSE is a long-term simulation-engineering project: a living world with geography, independent individuals, settlements, countries, institutions, economies, industry, transport and history. It is not designed as a conventional win/lose game.

## Current milestone: v0.1 — Planet Genesis

The current application establishes:
- A procedural, fictional planet rendered in 3D.
- 100 generated country territories.
- A target of 73% land and 27% ocean, measured with latitude-based spherical cell weights at the current map resolution.
- Exactly 1,000,000 starting inhabitants per country: 100,000,000 globally.
- Camera rotation and zoom.
- A simulation clock: **1 real second = 1 simulation minute**.
- Pause/resume controls and a responsive observer interface.
- A first population lifecycle foundation for individual records and explicit demographic events.

The atlas and population ledger are foundations, not a fully running 100-million-person civilization. The project does not yet simulate every person's detailed mind, healthcare access, family, economy or daily decisions.

## World constitution

- Fictional planet; history begins at primitive settlements in Year 0.
- 100 countries, each starting with 1,000,000 inhabitants.
- Individuals can be born, age, become ill, recover, migrate and die through explicit simulation events.
- Individuals should have distinct identities, personalities, needs, memories, relationships, beliefs and self-generated ambitions.
- No mandatory civilization progression or predetermined life paths.
- The world is observed and shaped through laws, policies and institutions rather than direct control of every individual.
- Countries may maintain different economic systems and currencies. Some may form currency unions. International trade uses a shared settlement currency without replacing domestic currencies.
- Goods move through physical supply chains using roads, rail, aircraft and sea transport; inventory does not teleport.
- Simulation logic must remain independent of the 3D renderer.

## Technology

- TypeScript + Vite
- Three.js for 3D
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
