# Submission draft

Text for the NASA Space Apps project page. The headings below are the fields of the 2026 project form, in order.

## Project Name

Crew Recovery

## High-Level Project Summary

Crew Recovery is a health monitoring tool for astronauts who are too far from Earth to ask a doctor in real time. It turns a daily two-minute check-in and wearable data into one clear answer: am I fit for today, what should I do about it, and who needs to know. Fifteen health indicators are colour-coded against clinical reference ranges and against the astronaut's own baseline. Sixteen rules turn patterns into step-by-step actions at three levels: handle it yourself, involve the Crew Medical Officer, or contact the flight surgeon. A correlation engine shows each astronaut which of their own habits help or hurt their recovery. A mission outlook projects the slow risks — radiation dose, bone loss, sleep debt, body mass — to the end of the mission. When the ground must be involved, the tool writes one complete medical report, because with a 20-minute delay every follow-up question costs 40 minutes. Everything runs in the browser with no server and no network.

## Detailed Project Description

### The problem

On the International Space Station a flight surgeon is a few seconds away. On the way to Mars a message takes up to 20 minutes each way, there is no resupply and no quick return. NASA's Human Research Program describes five hazards — radiation, isolation and confinement, distance from Earth, gravity fields, and hostile closed environments — and their effects build slowly and reinforce each other: short sleep weakens immunity, low mood reduces appetite, missed exercise costs bone. The crew member is the first person who can notice, and usually is not a doctor.

### What it does

- **Today.** One headline and one colour for the day, a readiness score from sleep, heart rate variability, resting heart rate and self-ratings, and a short list of what to do, each with ordered steps and the right level of escalation.
- **Body.** A 3D figure with eight regions that glows where something needs attention. Each region shows its indicators, how to take the measurement, which flight hardware measures it today, what was measured in real crews, why it matters in space, and the source of the threshold.
- **Trends.** Every indicator over time, with the reference zones and the astronaut's own normal drawn on the chart, and the behaviours that go together with better or worse recovery in that person's own data.
- **Log.** A daily check-in: mood, energy and stress, twelve yes/no journal items, symptoms, and measurements. Blood pressure has a guided mode with timers, because a correct reading needs five minutes of rest and two readings.
- **Crew.** An overview for the Crew Medical Officer, most urgent person first.
- **Timeline.** Every mission day is one bar, coloured by that day's status, so the history of the mission is visible at a glance and any day can be reopened.
- **Mission outlook.** Projections of cumulative radiation against the 600 mSv career limit, bone density put at risk by days without resistive exercise, sleep debt, and body mass at mission end.
- **Ground report.** A complete SBAR message (situation, background, assessment, request) with all readings and the actions already started, ready to copy or save.
- **Environments.** Space station, lunar base, Mars transit and Mars surface change the radiation background and the communication delay; the advice adapts (for example, "start now, the reply takes 20 minutes").

### How it works

All health logic is deterministic TypeScript with tests (56). Nothing is computed by an AI model, so every number and recommendation can be traced to a rule and a cited threshold.

- A value is judged twice: against clinical reference ranges, and against the person's own 28-day baseline using a robust z-score. One unusual day is a prompt to look; sustained patterns are escalated.
- "Not measured" is never shown as "fine". Missing data has its own state throughout.
- The correlation engine compares days with and without each logged behaviour. A pattern is shown only if it is at least moderate in size (Cohen's d ≥ 0.5), survives a correction for the roughly 70 comparisons made at once (Welch's t-test with Benjamini–Hochberg), and is still there in a multiple regression with all other behaviours accounted for.
- The engine was tested on generated data with known truth (`docs/VALIDATION.md`). The first version showed 3.1 false patterns per astronaut on data with no effects; the current one shows 0.13, and still finds a strong real effect 93% of the time within 120 days.
- Entries are stored on the device. There is no backend. After the first visit the app is kept on the device by a service worker and opens with no network at all, which is the situation it is built for.

### Data

The demo uses a synthetic 120-day Mars transit for a crew of four, generated from a fixed seed. It contains a schedule shift that builds sleep debt and is followed by a fever, a cabin CO₂ excursion, a solar particle event, an exercise device outage, and a late-mission dip in mood and body mass. No real astronaut data is used.

### What makes it different

- It answers "what do I do and who do I tell", not only "what is my number".
- It personalises: thresholds are checked against each astronaut's own normal, and the patterns come from their own data.
- It is built for delay: full guidance on board, and a single complete message to the ground.
- It explains itself: every indicator carries its measurement method, its reason and its source.

### Limits

It is a prototype for demonstration and education, not a medical device. Thresholds are screening values. The bone estimate assumes a resistive session fully protects bone that day. Radiation projection is linear and cannot foresee solar events. The synthetic data was written to demonstrate the logic and does not validate it.

## NASA Data

NASA data and resources are the basis of the tool's rules, not an addition to them:

- **NASA Human Research Program, 5 Hazards of Human Spaceflight** and the HRP risk pages (sleep, cardiovascular, bone, behavioural, immune, nutrition, SANS, distance from Earth, radiation): they define which indicators are tracked, how body regions and hazards are grouped, and the content of the escalation rules.
- **NASA-STD-3001** (Vol. 1 and 2) and the **NASA OCHMO technical briefs** on carbon dioxide and radiation protection: the 600 mSv career dose limit and the cabin CO₂ limits (3 mmHg 1-hour average, 2.5 mmHg 7-day average) are the thresholds the app uses.
- **Mars Science Laboratory RAD measurements** (Zeitlin et al., Science 2013): the 1.8 mSv/day deep-space dose rate drives the radiation model and the end-of-mission projection.
- **NASA-funded ISS sleep study** (Barger et al., Lancet Neurology 2014): the 6.09 h crew average is shown next to the user's own sleep.
- **ISS body mass measurements with SLAMMD** (Zwart et al. 2014): the measured crew mass loss is shown next to the user's own trend.
- **NASA, Wearable Tech for Space Station Research**: confirms that sleep, CO₂ exposure and radiation are measured with crew-worn devices today; each indicator in the app names its flight hardware.
- **NASA HRP bone loss rate** (1–1.5% per month without countermeasures): used in the bone outlook.

Full list with links: `docs/SOURCES.md`.

## Space Agency Partner Data and Other References

- **Canadian Space Agency:** Bio-Monitor (continuous heart rate, blood pressure, blood oxygen, skin temperature on the ISS), "Monitoring radiation for astronaut health", EVARM personal dosimeters.
- **European Space Agency:** T-Mini core temperature sensor and Active Dosimeter, as described in NASA's wearable technology article.
- Clinical reference ranges: 2025 AHA/ACC blood pressure guideline, ADA Standards of Care, AASM/SRS sleep consensus.
- Statistics: Welch 1947, Benjamini and Hochberg 1995, Cohen 1988.
- Software: React, Vite, TypeScript, Tailwind CSS, Recharts, Vitest (MIT); Geist typefaces (SIL OFL 1.1).
- Music in the demo video and the in-app guide: "Spirit Molecule" by Filo Starquez, offered by the artist as free to use. **Before submitting, paste here the exact credit line and licence from the page the track was downloaded from.**
- No third-party images, 3D models or datasets are used. The demo data is synthetic and generated by the project's own code.

Full list with links and licences: `docs/SOURCES.md`.

## Use of Super Intelligence (SI)

Yes. Claude (Anthropic), through Claude Code, was used as a coding assistant during the hackathon to write the health logic, its tests, the user interface, the shader that draws the 3D body figure, the documentation, and the script that records the demo video from the running application. Codex (OpenAI) wrote an early version of the user interface; some of its form and list code is still in use. The team chose the challenge, set the direction, made the design and scope decisions and reviewed the results. The application itself does not call any AI model: every number and recommendation is computed by deterministic, tested code. No images, audio or video were produced by a generative model. Details: "Use of AI tools" in `docs/SOURCES.md`.

## Links for the form

- **Link to Final Project:** https://aquari5.github.io/crew-recovery/ (live app) · source: https://github.com/aquari5/crew-recovery
- **Link to Project Demo:** `docs/demo.mp4` in the repository. The guide asks for a public link that needs no login; upload the file to YouTube (unlisted or public) or use the GitHub file link, and test it in a private window.

## Demo video (29.6 seconds)

`docs/demo.mp4`, 1920×1080, 60 fps, with voice-over and music, 29.6 s. The Project Submission Guide sets a hard limit of 30 seconds; a longer demo is not eligible for global judging. Team: **EZ Aqlimczak** (shown on the opening and closing cards).

### Voice-over

The recorded voice is in `docs/voice/demo.mp3`. The film's scenes were retimed to it and each phrase was placed on its scene with `scripts/mix-audio.py`.

| Starts | Line | On screen |
|---|---|---|
| 0.2 | On the way to Mars, a doctor is twenty minutes away. | Title card |
| 3.7 | We're EZ Aqlimczak, and this is Crew Recovery. | The app appears, a calm day |
| 7.2 | Every morning it answers one question: am I fit for today? | Headline and readiness score |
| 11.2 | It catches sleep debt building, and the fever that follows. | Days 44 and 47, steps to take |
| 14.8 | In a solar storm it says what to do, and writes one complete report to Earth. | Day 78, ground report |
| 19.6 | Every signal explains itself. | Body map |
| 22.2 | It learns what helps you recover, and shows where slow risks are heading. | Patterns, mission outlook |
| 26.5 | No server. No link to Earth needed. | End card |

Rules from the guide for the sound: the speaker must be 18 or older; narration in another language is allowed only with English captions (the video has them); an AI-generated voice must be acknowledged in the project description.

The video is a capture of the real application driven by `scripts/record-demo.cjs`; the camera moves, cursor and captions are added by the same script. This is stated in the "Use of SI" field.

## In-app guide

On the first visit the app opens a "How to use" dialog with a 38-second walk-through (`public/tour.mp4`) and the same steps as text. It can be reopened with the "?" button in the header.

### Voice-over for the walk-through

The guide plays muted until the viewer turns the sound on, so the captions carry it on their own. The recorded voice is in `docs/voice/tour.mp3` and is mixed into `public/tour.mp4`.

| Start | Line |
|---|---|
| 0.0 | Each morning, this is where you start. |
| 3.8 | The cards say what to do, and who to involve. |
| 7.4 | Drag the timeline to revisit any mission day, |
| 11.8 | or press Story for the key moments. |
| 14.8 | Log how you feel, what you did and your measurements in two minutes. |
| 19.8 | Blood pressure has a guided mode. |
| 22.8 | Select a body region to see every signal, |
| 28.6 | and open Trends to see what helps and what hurts your recovery. |
| 32.2 | One click writes the message to Earth. |
| 37.0 | You're set. |

## What comes next

- Planned self-experiments: the app proposes, for example, five days with and five days without late caffeine, then compares. Testing one planned change instead of 70 comparisons lets it confirm weaker effects than observation alone can.
- Input from real wearables and cabin sensors instead of manual entry.
- Validation on analog-mission data (for example isolation studies), since no real astronaut data was used.
