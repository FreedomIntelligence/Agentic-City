# Roadmap

The demo is not a cut-down version of the final product — it is the **interface contract** of the final product, with the reasoning replaced by scripts. The roadmap is the order in which the scripts get replaced by real machinery.

## The two agents

Most confusion about "agentic" planning comes from conflating two different agents that happen to share a model:

| | **Planning agent** | **City agent** |
|---|---|---|
| Who it serves | the participant | the simulated city |
| What it does | turns intent into a rule-checked, priced proposal | lives in the plan: chooses housing, work, travel, consumption, investment |
| Its output | an operation, waiting for approval | behaviour, and eventually a verdict on the city |
| Status today | demo: scenario script | not built; described in the competition guide |

The planning agent makes the tool usable. The **city agent is what makes the city agentic** — it is the only part that can tell you whether a plan actually works once people live in it, and it is the part no conventional planning tool can imitate. Any roadmap that does not end there is a roadmap to a better CAD tool.

## Phase 1 — Demo (current)

Guided scenarios replay fixed, pre-validated steps. The city model, rules, pricing, budget ledger, capacity arithmetic and 2D/3D synchronisation are real; the reasoning is scripted and the indicators are precomputed.

**What it proves** — that a planning decision can be expressed as an intent, priced, approved and reflected in the city within one workspace.

## Phase 2 — Live planning loop

Replace the script with the loop the interface already assumes:

```
parse intent → resolve against the city model → propose operations
→ rule check → price → request approval → execute → recompute assessment
```

Work items:

- **Model connection** — the Model settings panel becomes real: service URL, model name, tool schema, streaming, error handling. Participants bring their own model or agent framework; the city model and rules are what they get to act on.
- **Tool surface** — a stable, documented set of operations (query zone, query building, propose construction, demolish, fill pond, add road, commit policy, run assessment) with validation and cost returned as structured data.
- **Recomputation** — indicators derived from the revision rather than precomputed deltas, so an unscripted plan produces trustworthy numbers.
- **Refusal** — the agent must be able to say "this site is not permitted", "this exceeds the budget", "this pond is protected". The demo shows the approval gate; production needs the negative cases.
- **Submission quality** — generated `plan.gpkg` and `policies.yaml` must survive the committee's format and consistency checks without hand-repair.

**Exit criterion** — a participant with no prior knowledge completes a small plan in natural language, with no preset prompts, and the exported files pass validation.

## Phase 3 — City agents (EWM)

The plan becomes a running environment. Household, firm, investor, developer and service agents act inside the submitted spatial and policy conditions, and the assessment stops being a scoreboard of assets and becomes an observation of outcomes.

- **Population** — heterogeneous household agents (income, household structure, workplace, cross-boundary ties) choosing where to settle, given rent, travel time, amenity and policy.
- **Firms and jobs** — location and hiring decisions that respond to transport access, agglomeration, incentives and labour supply; start-up formation and venture investment as first-class dynamics.
- **Daily life** — commuting, school trips, shopping, cross-boundary travel, service use; the burdens that static indicators hide.
- **Policy transmission** — a subsidy or a housing policy must change agent incentives, not just a number in a table.
- **Emergence and feedback** — congestion that appears only after enough agents choose the same corridor; facility supply and demand drifting apart; a policy that reaches fewer people than intended.
- **Agent verdict** — agents rate the city from their own experience, producing the satisfaction measure the competition already promises.

Two design constraints carry over from the simulation design and should not be relaxed:

1. **The model judges, the engine calculates.** Agents return structured decisions; clearing, travel time, land price and accessibility stay deterministic. This keeps results reproducible and keeps arithmetic out of the language model.
2. **Every indicator is attributable.** An agent's decision is stored with its reason, so a score can be traced back to which agents behaved differently and why. Explainability is the point of using agents at all.

**Exit criterion** — the same submitted plan, run twice, produces the same result; and two plans that score identically on static capacity produce visibly different social outcomes.

## Phase 4 — Towards a public platform

- Reproducible scenario packs and reference results for judges.
- A submission validator anyone can run before submitting.
- A public gallery of strong plans with their simulated outcomes.
- Reusable region packs, so the platform is not welded to one 24.3 km² boundary.

## Sequencing rule

Each phase must keep the previous phase's guarantee:

- Phase 2 must not weaken the approval gate.
- Phase 3 must not turn the assessment into a black box.
- Phase 4 must not break reproducibility.

The demo's most valuable asset is not its screens — it is the discipline that **nothing happens to the city without a cost, a rule check and a human decision.** Keep that while the reasoning behind it becomes real.
