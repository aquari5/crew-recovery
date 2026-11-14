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

## Use of Super Intelligence (SI) tools

See "Use of AI tools" in `docs/SOURCES.md`. Claude (Anthropic) and Codex (OpenAI) were used as coding assistants during the hackathon. The application itself does not call any AI model.

## Links for the form

- **Link to Final Project:** https://aquari5.github.io/crew-recovery/ (live app) · source: https://github.com/aquari5/crew-recovery
- **Link to Project Demo:** `docs/demo.mp4` in the repository. The guide asks for a public link that needs no login; upload the file to YouTube (unlisted or public) or use the GitHub file link, and test it in a private window.

## Demo video (29.6 seconds)

`docs/demo.mp4`, 1920×1080, no sound. The Project Submission Guide sets a hard limit of 30 seconds; a longer demo is not eligible for global judging. A voice-over must fit inside the same 29.6 seconds. Narration in a language other than English is allowed only because the video has English captions.

The guide suggests this order: who you are and your team name, the challenge, the project name and tagline, how it works, what it could become. The captions cover the last four; say the team name in the voice-over.

| Time | On screen | Caption | Suggested voice-over |
|---|---|---|---|
| 0.0–3.0 | Title card | On the way to Mars, a doctor is 20 minutes away. | "We are team ___. On the way to Mars, a doctor is twenty minutes away." |
| 3.0–5.6 | App appears, day 30, green | Crew Recovery. Health autonomy for deep space. | "This is Crew Recovery." |
| 5.6–8.3 | Zoom on headline and readiness | Every morning, one answer: am I fit for today? | "Every morning it gives an astronaut one answer." |
| 8.3–13.5 | Timeline to day 44, then 47, action steps | It catches sleep debt building… and the fever that follows. | "It catches sleep debt building, and the fever that follows." |
| 13.5–18.7 | Day 78, ground report | Solar storm: what to do, and who to tell. One complete report to Earth. Every question costs 40 minutes. | "In a solar storm it says what to do, and writes one complete report to Earth." |
| 18.7–22.5 | Body map, heart | Every signal explains itself. | "Every signal explains how to measure it and why it matters." |
| 22.5–25.4 | Trends, patterns | It learns what helps you recover. Tested against false patterns. | "It learns what helps you recover." |
| 25.4–27.7 | Mission outlook | And shows where the slow risks are heading. | "And shows where slow risks are heading." |
| 27.7–29.6 | End card | No server. No link to Earth needed. | "No server. No link to Earth needed." |

The video is a capture of the real application driven by a script; the camera moves, cursor and captions are added by the same script. It carries the visible note "Live capture of the app · edited with AI assistance", because the guide requires a visible mark on images and video made with AI tools.

Rules from the guide to keep in mind when adding sound: no image, video or audio of a person under 18; AI-generated audio must be acknowledged in the description.
