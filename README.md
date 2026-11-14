# crew-recovery

Health monitoring tool for astronauts on long-duration missions: daily journal + wearable data to spot what hurts recovery and suggest actions without mission control. Built for the 2026 NASA Space Apps Challenge ("Create Health Monitoring Software for Astronauts on Space Missions").

## What it does

- **Daily picture of your health.** 15 indicators (sleep, heart, blood pressure, temperature, glucose, body mass, exercise, radiation, cabin CO₂, mood…) are colour-coded against clinical reference ranges **and against your own baseline**.
- **Tells you what to do and who to involve.** Findings come with concrete steps and one of three levels: self-care, Crew Medical Officer, flight surgeon on the ground. With a Mars-distance link the tool tells you to start now instead of waiting for a reply.
- **Finds what affects your recovery.** A correlation engine compares the days you logged a behaviour (late caffeine, shifted schedule, contact with home…) with the days you did not, corrects for the number of comparisons and for behaviours that come in bundles, and was tested on data with known truth ([docs/VALIDATION.md](docs/VALIDATION.md)).
- **Looks ahead.** A mission outlook projects cumulative radiation, bone density at risk, sleep debt and body mass to the end of the mission.
- **Writes the message to the ground.** One complete SBAR report for the flight surgeon, because with a delayed link every follow-up question costs a full round trip.
- **Guides the measurement.** Blood pressure is taken with on-screen steps and timers.
- **Explains itself.** Every indicator says how to measure it, why it matters in space and which source the thresholds come from.
- **Teaches itself.** A first-visit guide shows a short walk-through and the same steps as text.
- **Works with no link to Earth.** No backend: everything runs and is stored in the browser.

**Live app:** https://aquari5.github.io/crew-recovery/ · **Demo video:** [docs/demo.mp4](docs/demo.mp4)

The demo runs on a synthetic 120-day Mars transit with a crew of four. No real astronaut data is used.

## Run it

```bash
npm install
npm run dev
```

Other commands: `npm test` (logic tests), `npm run typecheck`, `npm run build`.

## Structure

| Path | What | Owner |
|---|---|---|
| `src/core/` | Health logic: data model, thresholds, baseline, readiness, escalation rules, correlation engine, demo mission | logic |
| `src/ui/` | Screens and components | UI |
| `src/dev/Preview.tsx` | Plain page showing every output of the logic; a working usage example | logic |
| `docs/CORE_API.md` | How the UI calls the logic | |
| `docs/TASKS.md` | Task board and briefs | |
| `docs/SOURCES.md` | References, licences and how AI tools were used | |
| `docs/VALIDATION.md` | How the correlation engine was tested, with results | |
| `docs/SUBMISSION.md` | Draft text for the project page and the demo script | |

## Disclaimer

This is a hackathon prototype for education and demonstration. It is not a medical device and its output is not medical advice.

## License

MIT
