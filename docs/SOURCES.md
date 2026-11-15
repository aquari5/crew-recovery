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

## Real NASA data used by the app

- **NASA DONKI, solar energetic particle (SEP) events** — https://ccmc.gsfc.nasa.gov/tools/DONKI/ , API: https://api.nasa.gov/ (`/DONKI/SEP`). Operated by NASA's Community Coordinated Modeling Center.
  - Live: the app requests the last 30 days when it is online and keeps the answer for an hour (`src/ui/SpaceWeather.tsx`).
  - Recorded: the records for 3–13 September 2017 (9 records) and 6–16 May 2024 (14 records), and the empty answer for 1 October–15 November 2026, were fetched on 15 Nov 2026 and are stored unchanged apart from dropped fields in `src/core/data/donki.ts`.
  - Logic and tests on these records: `src/core/spaceWeather.ts`, `src/core/core.test.ts`.
  - Limits: the app uses NASA's public `DEMO_KEY`, which allows a few requests per hour per address; when the request fails the stored copy is shown and labelled. The flare feed (`/DONKI/FLR`) returned an error on 15 Nov 2026, so flares are taken from the links inside the particle-event records, which NASA adds after the event. Detections are from near-Earth and STEREO spacecraft; a crew on the way to Mars would be at a different place in the heliosphere.

## Measured in flight today

Every numeric indicator in the tool is already measured in space. The app shows this under "How to measure" for each indicator (`src/core/flight.ts`). All entries were checked against the linked page on 14 Nov 2026.

| Indicator | Flight hardware | Source |
|---|---|---|
| Sleep | Actiwatch Spectrum wrist actigraph (ISS) | [NASA, Wearable Tech for Space Station Research](https://www.nasa.gov/missions/station/iss-research/wearable-tech-for-space-station-research/) |
| Resting heart rate, HRV, blood pressure, SpO₂ | Bio-Monitor smart shirt (ISS): heart rate, heart electrical activity, blood pressure, blood oxygen, skin temperature, activity | [Canadian Space Agency, Bio-Monitor](https://www.asc-csa.gc.ca/eng/sciences/bio-monitor.asp) |
| Body temperature | ESA T-Mini headband sensor (core temperature); Bio-Monitor (skin temperature) | NASA wearable tech article; CSA Bio-Monitor |
| Blood glucose | Continuous glucose monitors on Axiom Mission 4 (2025). Sponsor-reported, preliminary, not peer reviewed | [Axiom Space release](https://axiomspace.com/release/suite-ride-research-unlocks-potential-for-first-astronaut-with-diabetes) |
| Body mass | SLAMMD (NASA) and BMMD (Roscosmos) | [Zwart et al. 2014](https://www.ncbi.nlm.nih.gov/pubmed/25197887) |
| Exercise | Advanced Resistive Exercise Device (ARED) | [NASA NTRS](https://ntrs.nasa.gov/api/citations/20160012791/downloads/20160012791.pdf) |
| Radiation | Personal dosimeters: CSA EVARM, ESA Active Dosimeter (also on Artemis I) | NASA wearable tech article |
| Cabin CO₂ | Personal CO₂ Monitor clipped to clothing (ISS) | NASA wearable tech article |
| Mood, energy, stress | Self-rating; no instrument | — |

Measurements in real crews shown in the app next to the user's own reading:

- Sleep: ISS crews averaged 6.09 h a night. Barger et al., Lancet Neurology 2014;13:904–912, https://doi.org/10.1016/S1474-4422(14)70122-X
- Body mass: mean loss of 2.8% (SLAMMD) to 4.4% (BMMD) in 25 crew members. Zwart et al. 2014, https://www.ncbi.nlm.nih.gov/pubmed/25197887
- Radiation: 1.8 mSv/day on the cruise to Mars, measured by the RAD instrument on NASA's Mars Science Laboratory. Zeitlin et al., Science 2013, https://doi.org/10.1126/science.1235989

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

## Music

"Spirit Molecule" by Filo Starquez is used under the voice in `public/demo.mp4` and `public/tour.mp4`. The artist offers it as free to use; the credit line and licence from the download page are to be added here. The audio file itself is not included in this repository.

## Use of AI tools

- **Code:** written with Claude Code (Anthropic), under the direction and review of the team. An early draft of some interface code was written with Codex (OpenAI).
- **Voice-over:** a recorded voice modulated with ElevenLabs, used in `public/demo.mp4` and `public/tour.mp4`. This is also stated in the metadata of both video files and of the recordings in `docs/voice/`.
- **Videos:** captures of the real application; no part of the picture is generated imagery.
- The application itself does not call any AI model: every number and recommendation is computed by deterministic, tested code.
