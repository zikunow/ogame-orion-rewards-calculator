# Orion rewards calculators

- Full calculator: https://zikunow.github.io/ogame-orion-rewards-calculator/
- Simple investment calculator: https://zikunow.github.io/ogame-orion-rewards-calculator/ias_for-dummies/?budget=100

Both calculators now report **gross resource MSU per calendar day**, hours in a flight session, missions/scans per session, refill waiting time and the full start-to-start cycle. Income is constrained by lithium production and slot capacity; requesting arbitrary waves cannot create sustainable income.

## Shared engine

`shared/planner-core.js` and `shared/planner-costs.js` are the same engine files published by `zikunow/ogame-orion-upgrade-planner` in commit `084b6a37aebc550b8a14547e1554be00e6bac71a`. The browser loads the already-public sample directly from `https://zikunow.github.io/ogame-orion-upgrade-planner/anomaly-sample.js`. Its contents are not copied into this repository or its deployment. Both calculators therefore depend on that public script remaining available and compatible. Tests prepare a gitignored local copy from the pinned public commit and verify its blob hash. Update the engine files together when the common model changes.

The anonymous sample has 333 complete six-result scans / 1,998 anomalies from 30 October 2026. Fields contain only mode, three resource rewards, claim lithium and minutes. No coordinates, player IDs or session identifiers are included. The owner authorized public publication of this source sample; it is already published in the planner repository.

Default strategy: PvP, q >=28.4 actual resource MSU / gross claim lithium, six concurrent slots, fleet speed x2, reserve 20% of the seven-day lithium cap. Multiple results of a scan may be used. Resource bonuses and T18 are applied before selection, which is recomputed for each configuration.

```
cashback = baseCashback / 100 * (1 + 0.002 * planets * lithiumLevel)
scanPrice = hourlyLithiumProduction / 2
netLithiumPerFlight = meanClaim * (1 - cashback) + scansPerFlight * scanPrice
flightsPerDay = min(24 * hourlyProduction / netLithiumPerFlight,
                   slots * 1440 / meanMissionMinutes)
dailyIncome = meanResourceMSU * flightsPerDay
weeklyCap = 168 * hourlyProduction
```

The base cashback is 5%; lithium building 17 on 18 planets gives 8.06%. Cashback applies to claims, not scans. This is a working interpretation supplied by the owner, not a verified exact game formula. Its random distribution is unknown; the model uses expected cashback.

Reference rewards are normalized by the observed +61.2% resource bonus and assumed General multipliers 1.5 PvE / 2 PvP, as in the source analysis. Source T18 enhancement was not independently recorded. Rewards and claim prices are extrapolated in proportion to lithium production; durations scale from fleet speed x2. These are modelling assumptions, not validated game formulas for every IAS/economy/class.

Session estimates use 256 deterministic Monte Carlo resamplings of full scan batches. Production continues, a real-balance storage cap applies, full claim cost is reserved until completion, and new actions stop near the configured reserve. The next cycle starts immediately when lithium refills. A slot-limited state that does not deplete mean stock shows no finite session. The stationary income used for ranking can differ slightly from a finite-session Monte Carlo ratio.

Income is metal +1.5 crystal +3 deuterium, before fuel, battle losses and lithium conversion costs. Ships, items, XP and artefacts have no assigned value. Full mission completion is assumed; partial-wave optimization is not included. Hours exclude additional fleet return time, manual actions and sleep. All selected missions are assumed successfully completed.

## Simple calculator

Only one input remains: investment budget in **billions of MSU**. `budget=100` means 100 billion MSU of development, not 100 million lithium. Legacy `waves` is ignored and removed from the URL.

The fit starts from zero and searches scanner 1–80, common resource building level 0–50 (all three resources share a level), General T18 0–80 and lithium building 0–50, with 18 planets, economy x10, General, six slots, experience 100, lifeform technology boost 7.5%, research discount building 25. Existing fleet, slot/result unlocks and lifeform support-building costs are excluded. This is the best fit **within the stated equal-resource-level grid**, not a global optimum over independent resource levels.

For each feasible resource/T18/lithium combination, the highest affordable scanner level is best within the shared scaling model: selection and affordable flights/day do not depend on that common production scale, while reward and income grow with production. The search therefore binary-searches scanner level instead of enumerating it. Selection statistics are cached by resource/T18 levels. Tests verify this reduction against exhaustive enumeration on a bounded four-dimensional grid, including lithium levels.

Costs and budget arithmetic use exact BigInts. The result links to the identical configuration in the full calculator. Session and income values are identical in both views.

## Full calculator

Allows separate metal/crystal/deuterium building levels, lithium building, T18, class, planets, economy, lifeform support, threshold, reserve, slots and fleet speed. It uses the planner engine directly. The optional match-buildings button only raises existing building/T18 levels while a candidate has better marginal calendar-income value than the next scanner upgrade; it preserves existing levels and does not change scanner level. It is a greedy helper, not the simple budget search.

Legacy URLs map `resourceLevel` to metal/crystal/deut, `lithiumLevel` to lithium and `availableSlots` to slots unless the new keys are present. Old launches, used-slots and scan-result-count parameters no longer override the six-result source model or the lithium budget. RU/EN and both themes remain supported.

## Checks and publication

```
node tests/prepare-sample.cjs
node --test tests/*.test.cjs
node tests/serve.cjs
REWARDS_URL=http://127.0.0.1:8080/ node tests/browser-check.cjs
```

Unit tests cover equality with the planner model, cashback, all-planet costs, candidate matching, validation, no-target/continuous sessions, legacy links, exact budget parsing, bounded exhaustive optimizer validation and equality between simple/full results. Browser checks cover four viewport widths, both full-calculator languages/themes, validation, state reset, old links and the simple-to-full handoff. CI checks branches/PRs; main deploys both sites and the shared assets, then verifies the published calculators.
