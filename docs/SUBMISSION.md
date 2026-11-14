# Submission draft

Text for the NASA Space Apps project page. Check the field names and length limits against the Project Submission Guide before pasting.

## Project name

Crew Recovery

## High-level summary

Crew Recovery is a health monitoring tool for astronauts who are too far from Earth to ask a doctor in real time. It turns a daily two-minute check-in and wearable data into one clear answer: am I fit for today, what should I do about it, and who needs to know. Fifteen health indicators are colour-coded against clinical reference ranges and against the astronaut's own baseline. Sixteen rules turn patterns into step-by-step actions at three levels: handle it yourself, involve the Crew Medical Officer, or contact the flight surgeon. A correlation engine shows each astronaut which of their own habits help or hurt their recovery. A mission outlook projects the slow risks — radiation dose, bone loss, sleep debt, body mass — to the end of the mission. When the ground must be involved, the tool writes one complete medical report, because with a 20-minute delay every follow-up question costs 40 minutes. Everything runs in the browser with no server and no network.

## Project details

### The problem

On the International Space Station a flight surgeon is a few seconds away. On the way to Mars a message takes up to 20 minutes each way, there is no resupply and no quick return. NASA's Human Research Program describes five hazards — radiation, isolation and confinement, distance from Earth, gravity fields, and hostile closed environments — and their effects build slowly and reinforce each other: short sleep weakens immunity, low mood reduces appetite, missed exercise costs bone. The crew member is the first person who can notice, and usually is not a doctor.

### What it does

- **Today.** One headline and one colour for the day, a readiness score from sleep, heart rate variability, resting heart rate and self-ratings, and a short list of what to do, each with ordered steps and the right level of escalation.
- **Body.** A figure with eight regions. Each shows its indicators, what they mean, how to take the measurement, why it matters in space, and the source of the threshold.
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
- Entries are stored on the device. There is no backend.

### Data

The demo uses a synthetic 120-day Mars transit for a crew of four, generated from a fixed seed. It contains a schedule shift that builds sleep debt and is followed by a fever, a cabin CO₂ excursion, a solar particle event, an exercise device outage, and a late-mission dip in mood and body mass. No real astronaut data is used.

### What makes it different

- It answers "what do I do and who do I tell", not only "what is my number".
- It personalises: thresholds are checked against each astronaut's own normal, and the patterns come from their own data.
- It is built for delay: full guidance on board, and a single complete message to the ground.
- It explains itself: every indicator carries its measurement method, its reason and its source.

### Limits

It is a prototype for demonstration and education, not a medical device. Thresholds are screening values. The bone estimate assumes a resistive session fully protects bone that day. Radiation projection is linear and cannot foresee solar events. The synthetic data was written to demonstrate the logic and does not validate it.

## Space agency data and resources

See `docs/SOURCES.md` for the full list: NASA Human Research Program hazards, risks and research pages; NASA-STD-3001; NASA OCHMO technical briefs on carbon dioxide and radiation protection; Canadian Space Agency resources on radiation monitoring.

## Use of AI

See "Use of AI tools" in `docs/SOURCES.md`. Claude (Anthropic) and Codex (OpenAI) were used as coding assistants during the hackathon. The application itself does not call any AI model.

## Demo script (30 seconds)

| Time | Screen | Narration |
|---|---|---|
| 0–4 s | Today, day 30, green | "On the way to Mars a doctor is 20 minutes away. Crew Recovery tells an astronaut how they are, every morning." |
| 4–10 s | Story → day 44, then 47 | "A week of shifted schedules builds sleep debt. Three days later: a fever. The tool says what to do and who to tell." |
| 10–15 s | Day 78, dark level-3 card, Ground report | "A solar storm. Shelter now — and one complete report for the flight surgeon, because every question costs 40 minutes." |
| 15–20 s | Body map, tap heart, open "How to measure" | "Every signal explains itself: how to measure it, why it matters in space, where the threshold comes from." |
| 20–25 s | Trends → patterns | "It learns from your own data what helps you recover and what does not." |
| 25–30 s | Today → Mission outlook | "And it shows where the slow risks are heading. No server, no link to Earth needed." |

Recording tips: use the timeline's Story button to jump between the days, record at 1280×720 or larger, and keep the cursor still while narrating.
