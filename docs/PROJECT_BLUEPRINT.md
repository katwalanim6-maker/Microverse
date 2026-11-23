# MICROVERSE — Project Blueprint

## 1. Vision

Build a persistent, entirely fictional planet whose geography, inhabitants, societies and institutions evolve through interacting systems. The world should continue to have its own history even when the observer does not intervene.

The observer is the **World Architect**: able to inspect the world and establish or revise laws, policies and systems, but not to micromanage every inhabitant.

## 2. Foundational constitution

| Dimension | Initial rule |
|---|---|
| World | Entirely fictional planet |
| Initial population target | 1,000,000 individuals |
| Starting history | Primitive settlements, Year 0 |
| Time scale | 1 real second = 1 simulation minute |
| Governance | Emerges locally; no mandatory global government |
| Progression | No required technological or political path |
| Observer | World Architect / observer |

Time conversion:
- 1 simulation hour = 1 real minute.
- 1 simulation day = 24 real minutes.
- 30-day simulation month = 12 real hours.
- 365-day simulation year = 6 real days and 2 hours.

The clock must support pause, resume, save/load and controlled speed changes. Elapsed simulation time must not be lost merely because a browser tab is backgrounded.

## 3. Planet and environment

The planet contains continents, oceans, islands, mountains, rivers, plains, forests, deserts, climate zones, natural resources and ecosystems. Geography and resource distribution should influence where settlements emerge and what they can produce.

## 4. Individuals and minds

Every inhabitant is an individual, not merely a population counter. Each persistent identity should be able to hold:
- Personality and temperament.
- Needs, emotions and changing circumstances.
- Personal memories and learned knowledge.
- Skills, beliefs, values and preferences.
- Goals, ambitions and plans that can change over a lifetime.
- Family, friendship, trust, cooperation, affection, rivalry and other social relationships.
- A decision policy that selects actions from the individual's own situation.

A person's future must not be hard-coded from their parents' profession or social position. A farmer's child may pursue any available ambition, subject to opportunity, learning and circumstance.

### Scalable mind simulation

All inhabitants receive persistent identity and compact behavioral state. Scheduling is event-driven and priority-based: nearby, changing or socially important situations receive more computation, while quiet populations can be advanced through efficient aggregate rules. Detailed language-model reasoning is an optional tool for selected situations, not a per-person-per-tick requirement.

## 5. Society and institutions

Families, communities, villages, towns and cities emerge over time. Institutions may include education, healthcare, local administration, courts, public services, banks, businesses, unions, media and cultural organizations.

Professions emerge in response to needs and opportunities: farming, construction, healing, teaching, trade, science, public service, transport, manufacturing, art and many others.

## 6. Governance and international relations

Countries may develop different constitutions, laws, political structures, tax systems and public services. Public opinion, peaceful movements, elections, policy changes, legitimacy, disputes and institutional reform can emerge.

International relations include diplomacy, trade agreements, alliances, sanctions, negotiation, peace agreements and reconstruction. Conflict, if represented, remains a high-level social and geopolitical process rather than a tactical combat simulator.

## 7. Economic constitution

Each country can have its own economic model, ownership structures, tax policy, labour rules, trade policy and domestic currency.

Currency structure:
1. **National currencies** for domestic economic activity.
2. **Currency unions** where participating countries voluntarily share a currency and coordinate monetary policy.
3. **International settlement currency** (working name: Global Credit / GCR) for cross-border settlement. It does not automatically replace national currencies.

Exchange rates respond to trade flows, supply and demand, monetary policy and economic conditions.

Economic actors include households, farms, businesses, factories, banks, central banks, insurers, governments, customs authorities and labour organizations.

Factories require owners, workers, raw materials, machinery, energy, inventory, management, finance and transport. Workers are individuals with skills, wages, expenses, rest needs and the ability to change jobs or organize.

## 8. Production and logistics

Goods move through traceable physical supply chains. Example:

Mine → raw-material transport → processing plant → factory → warehouse → distributor → retailer → household.

Transport modes include roads and trucks, railways and trains, airports and aircraft, seaports and ships. Transport firms have crews, drivers, pilots, mechanics, vehicles, maintenance, fuel, routes, schedules and operating costs.

A shipment follows a real state sequence: order → inventory check → transport booking → dispatch → in transit → possible delay or storage → delivery → payment and records update.

## 9. Observer experience

The observer can move between planet, regional, settlement and close-up views. Inspection panels should reveal relevant details without turning the experience into a spreadsheet. World-level controls can establish policies and inspect consequences.

## 10. Non-goals and safeguards

- No assumption that every civilization must become industrial or centralized.
- No omniscient or omnipotent individual AI calls every frame.
- No teleporting goods or instant economic outcomes.
- No renderer dependency in core simulation rules.
- No claim that planned systems exist before they are implemented.
