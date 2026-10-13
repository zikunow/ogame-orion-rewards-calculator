# OGame Orion Rewards Calculator

A standalone RU/EN calculator for expected Orion anomaly rewards, lithium spending and account investment. Includes a ready-to-use General configuration, exact resource costs, a shareable settings URL, and Minimal/Cosmic themes matching the existing IAS project.

Repository: `zikunow/ogame-orion-rewards-calculator`.
Pages address after deployment: `https://zikunow.github.io/ogame-orion-rewards-calculator/`.
This project is independent of the original IAS repository.

## Run

Open `index.html` directly in a browser, or serve this directory with `python3 -m http.server 8000`. No build or third-party dependencies are required. Clipboard copying may require HTTPS or localhost; if copying is blocked, use the browser address bar.

Run regression checks with Node 18+: `node --test tests/*.test.cjs`.

## Model

Default settings: General, economy x10, 18 planets, scanner 39, experience 100 (+10%), building boost 7.5%, research discount building 25 (6.25%), T18 7, all three resource sub-buildings 15, lithium sub-building 18, six available slots and scan results, six fleet launches per day using six slots each.

Default checkpoints: 81,099,193,887 MSU investment; 795,254,665.2844315 average resource MSU; 26,893,709.00253577 average lithium reward; 21,717,567.43137255 average claim cost. At 36 flights/day: 28,629,167,950.239532 resource MSU and a lithium change of -58,711,059.085182816 after expected scan costs and claims.

Reward constants are supplied by the experiment: 1,878 anomalies from 313 scans, with a fixed selection of 102 missions (12 PvE, 90 PvP). The UI explains the selection thresholds, mode-specific unboosted sums and all formulas. The spreadsheet is linked for provenance; this package does not import or reselect its raw records.

Resource rewards and claim costs scale with Q under an unchanged-distribution assumption. Lithium scaling is optional and explicitly unconfirmed. Economy is fixed at x10. Other classes are modeled with no General bonus; their own effects are excluded. Result counts other than six use conditional scan-budget estimates because the scan-price dependency has not been confirmed.

Investment uses BigInt rational arithmetic, including the original IAS nearest rounding and per-resource flooring for sub-buildings and T18. MSU uses a fixed 3:2:1 trade ratio. Slot/result unlock costs and the construction cost of lifeform boost/discount buildings are excluded. Fuel, fleet losses, ships, artifacts, items and XP are excluded from resource MSU. Q is conversion capacity, not free daily lithium production.

## Deployment

Enable Pages with **Settings → Pages → Source: GitHub Actions**. The included workflow checks the calculation model and deploys only static assets on pushes to `main` or manual dispatch.

## Source

Cost formulas, lifeform research-building names, and visual styles were inspected from `zikunow/ogame-orion-ias-calculator` on 2026-10-13. Expected reward constants and modeling requirements come from the supplied specification. Sources are also linked in the calculator.
