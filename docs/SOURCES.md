# Sources, licences and use of AI tools

NASA Space Apps requires every source to be cited and the use of AI tools to be described. Keep this file current; it feeds the submission form.

## NASA and partner resources (from the challenge Resources tab)

- NASA Human Research Program — 5 Hazards of Human Spaceflight: https://www.nasa.gov/hrp/hazards/
- NASA Human Research Program — Risks of Human Spaceflight: https://www.nasa.gov/hrp/risks/
- NASA Human Research Program — Ongoing HRP Research: https://www.nasa.gov/hrp/ongoing-hrp-research/
- Canadian Space Agency — Monitoring radiation for astronaut health: https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp
- Canadian Space Agency — Why do we conduct science experiments in space?: https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp

NASA HRP pages used for specific indicators and rules:

- Risk from Inadequate Sleep and Irregular Schedules: https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/
- Risk of Cardiovascular Adaptations: https://www.nasa.gov/reference/risk-of-cardiovascular-adaptations/
- Risk of Spaceflight-Induced Bone Changes (1–1.5% bone density loss per month): https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/
- Risk of Behavioral Conditions and Psychiatric Disorders (journaling, privacy, contact with home): https://www.nasa.gov/reference/risk-of-behavioral-conditions-and-psychiatric-disorders/
- Risk of Altered Immune System Responses (virus reactivation, rashes, cold sores): https://www.nasa.gov/reference/risk-of-altered-immune-system-responses/
- Risk of Inadequate Food and Nutrition (menu fatigue): https://www.nasa.gov/reference/risk-of-inadequate-food-and-nutrition/
- Risk of Spaceflight Associated Neuro-ocular Syndrome: https://www.nasa.gov/reference/risk-of-spaceflight-associated-neuro-ocular-syndrome-sans/
- Hazard: Distance from Earth (up to 20 minutes one-way delay to Mars): https://www.nasa.gov/hrp/hazard-distance-from-earth/
- Hazard: Space Radiation: https://www.nasa.gov/hrp/hazard-space-radiation/
- ARCHeR (wrist actigraphy on Artemis II): https://www.nasa.gov/reference/archer/
- Spaceflight Standard Measures: https://www.nasa.gov/reference/standard-measures/

## Reference values behind the thresholds

Thresholds live in `src/core/indicators.ts`. "Checked" means the value was compared with the cited document or an official summary of it on 14 November 2026. "Textbook" means a standard clinical value that was not re-checked against a primary document.

| Indicator | Thresholds used | Reference | Status |
|---|---|---|---|
| Blood pressure | watch ≥ 130/80, alert ≥ 140/90, severe > 180/120, low ≤ 90 systolic | 2025 AHA/ACC High Blood Pressure Guideline, Hypertension 2025;82(10):e212–e316 (categories unchanged from 2017) | Checked |
| Fasting glucose | watch ≥ 100 or < 70, alert ≥ 126 or ≤ 54 mg/dL | American Diabetes Association, Standards of Care: prediabetes 100–125 mg/dL; hypoglycemia level 1 < 70, level 2 < 54 mg/dL | Checked, except the ≥ 126 diabetes criterion (textbook) |
| Cabin CO₂ | watch ≥ 2.5 mmHg, alert ≥ 3 mmHg | NASA-STD-3001 Vol. 2 [V2 6004]: 1-hour average ≤ 3 mmHg; NASA OCHMO-TB-004 Carbon Dioxide, citing Law et al.: 7-day average < 2.5 mmHg keeps headache risk under 1% | Checked |
| Radiation | career limit 600 mSv; deep-space background 1.8 mSv/day | NASA-STD-3001 Vol. 1 and NASA OCHMO Radiation Protection technical brief; Zeitlin et al., Science 2013 (MSL/RAD) | Checked |
| Sleep | watch < 6.5 h, alert ≤ 5 h; "about 6 h a night in flight" | AASM/SRS consensus, Watson et al. 2015 (adults: 7+ h); Barger et al., Lancet Neurology 2014;13:904–912 (6.09 h on ISS) | Barger checked via press material; AASM textbook; the 6.5 h and 5 h cut-offs are our own screening choices |
| Resting heart rate | watch ≥ 90 or < 45, alert ≥ 100 or ≤ 40 bpm | American Heart Association: 60–100 bpm, lower in fit adults | Textbook; the lower cut-offs are our own choice for a fit crew |
| Blood oxygen | watch < 95%, alert ≤ 91% | Standard clinical reference range | Textbook |
| Body temperature | watch ≥ 37.5 °C, alert ≥ 38.0 °C or ≤ 35.0 °C | Standard clinical definitions of fever and hypothermia | Textbook |
| Body mass | watch −5%, alert −10% from mission start | Common clinical criteria for significant unintentional weight loss | Textbook |
| HRV | personal baseline only | No population threshold is meaningful | — |
| Environment dose rates | LEO 0.6, lunar surface 1.4, Mars surface 0.7 mSv/day | Mars surface 0.67 mSv/day: Hassler et al., Science 2014 (MSL/RAD); lunar: Zhang et al., Science Advances 2020 (Chang'e-4 LND); LEO: typical published range | Mars surface checked; lunar and LEO not re-checked, used as context only |

Links: [NASA OCHMO-TB-004 Carbon Dioxide](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf) · [NASA OCHMO Radiation Protection brief](https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf) · [SwRI on MSL/RAD cruise dose](https://www.swri.org/newsroom/press-releases/swri-led-team-calculates-the-radiation-exposure-associated-trip-mars) · [Barger et al. press release](https://www.eurekalert.org/news-releases/595450) · [ADA hypoglycemia levels](https://professional.diabetes.org/sites/dpro/files/2025-05/hypoglycemia-hcp-5-27-25.pdf) · [2025 AHA/ACC guideline quick reference](https://www.2minutemedicine.com/guidelines/high-blood-pressure/)

## Data

All health data in the demo is **synthetic**, generated by `src/core/mission.ts` from a fixed seed. No real astronaut or personal data is included.

## Software

| Package | Licence |
|---|---|
| React, React DOM | MIT |
| Vite, @vitejs/plugin-react | MIT |
| TypeScript | Apache-2.0 |
| Tailwind CSS | MIT |
| Recharts | MIT |
| Vitest | MIT |
| oxlint | MIT |
| Geist and Geist Mono typefaces (via `@fontsource-variable`) | SIL Open Font License 1.1 |

This project is released under the MIT licence.

## Use of AI tools

- **Claude (Anthropic), via Claude Code** — used during the hackathon to design and write the health logic in `src/core/` (data model, thresholds, baseline, readiness score, escalation rules, correlation engine, synthetic mission data), its tests, and the project documentation, under the direction and review of a team member.
- **Codex (OpenAI)** — used during the hackathon to write the first version of the user interface in `src/ui/` from written briefs, under the direction and review of a team member. Its form, chart-scale and crew-sorting helpers remain in use.
- **Claude (Anthropic), via Claude Code** — also used to redesign the user interface (visual system, Today, Body, Trends, timeline).
- The application itself does not call any AI model: every number and recommendation is computed by deterministic, tested code.

Update this section if that changes.
