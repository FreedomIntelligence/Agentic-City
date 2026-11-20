# Architecture

Agentic City is four layers on one shared city record. The property that matters is that **nothing is stored twice**: the 2D plan, the 3D city, the assessment panel and the agent conversation all read and write the same plan state.

```
┌──────────────────────────────────────────────────────────────┐
│  Interface          the studio, 2D map, 3D city, panels       │
├──────────────────────────────────────────────────────────────┤
│  Agent              dialogue, proposals, costs                │
├──────────────────────────────────────────────────────────────┤
│  Planning core      rules, operations, budget, drafts, undo   │
├──────────────────────────────────────────────────────────────┤
│  City model         zones, buildings, terrain, water, roads   │
└──────────────────────────────────────────────────────────────┘
```

## City model

The compiled 2035 baseline for a 24.3 km² slice of the Northern Metropolis: 20,924 existing buildings, planning zones with permitted uses and restrictions, terrain, water, and a routed transport graph for walking, cycling, driving and public transport.

Everything downstream is expressed against identifiers in this model — a building, a pond, a zone. That is what makes an operation like *demolish this building, then fill that pond* checkable rather than decorative.

## Planning core

The operations a planner can actually perform. Each one is validated against the city model and priced, and the price comes out of a single budget shared by construction, demolition, land preparation, road building and policy commitments.

That single ledger is the reason a plan has to make choices: you cannot build everything, so the assessment is never a scoreboard of good intentions.

State changes are written as revisions, which is what makes drafts, undo, re-opening and export possible.

## Agent

The agent turns intent into a concrete proposal, and then **stops**: the participant sees what will be built and what it costs, and only after approval does the city change.

```
intent → resolve against the city model → propose operations
       → validate → price → request approval → execute → re-assess
```

This contract — *the agent proposes, the human approves, the core executes* — is the design decision the whole product rests on. It is also why an LLM can be given write access to a city at all.

## Interface

One workspace, six views: the planning studio with its 2D map and 3D city, the evaluation panel, the policy workspace, the competition guide, the video guides, and model settings.

Two properties are worth noting:

- **2D and 3D are two views of one revision**, not two artefacts kept in step by hand.
- **Assessment reads the revision**, not a running tally, so undoing a step restores the numbers as well as the map.

## The two agents

Most confusion around "agentic" planning comes from conflating two different kinds of agent that happen to share a model:

| | **Planning agent** | **City agent** |
|---|---|---|
| Serves | the participant | the simulated city |
| Does | turns intent into a rule-checked, priced proposal | lives in the plan: chooses housing, work, travel, consumption, investment |
| Output | an operation, awaiting approval | behaviour, and a verdict on the city |
| Where it runs | inside the studio | inside the Economic World Model, after submission |

The planning agent makes the tool usable. The city agent is what makes the *city* agentic: it is the only part that can say whether a plan works once people live in it. The demo ships the first and describes the second; see [roadmap.md](roadmap.md).

## Data

The city model is compiled from official Hong Kong mapping and water data (iB1000), OpenStreetMap road and transit networks, and public building and land-use records. Inputs are frozen per release so results are reproducible.

The compiled dataset is not part of this repository.
