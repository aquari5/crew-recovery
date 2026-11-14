# Task board

Deadline: **Sunday 15 November, 23:59** (local time of the team creator). Aim to have everything merged by Sunday 18:00 and use the evening for the demo video and the submission form.

## Who owns what

| Area | Owner | Files |
|---|---|---|
| Health logic, demo data, thresholds, tests | `aquari5` + Claude | `src/core/**`, `src/dev/**`, `docs/**` |
| Screens, components, visual design | `afkjacobbb` + Codex | `src/ui/**`, `src/App.tsx`, `src/index.css`, `public/**` |

Rules that keep two AI-assisted people out of each other's way:

1. Stay inside your own files. If the UI needs something from the logic (a new field, a new function), write it in the "Requests" section at the bottom and push; do not edit `src/core/`.
2. `git pull --rebase` before every push. Push small and often to `main`.
3. `npm run typecheck` and `npm test` must pass before a push.
4. All user-facing text in English.

## UI tasks (`afkjacobbb` + Codex)

Do them in order. U1 first because the others plug into it. Each brief below can be pasted into Codex as is.

### U1 — App shell, theme and mission timeline

```
Read docs/CORE_API.md and src/dev/Preview.tsx first. Build the app shell for an astronaut health
monitoring tool in React + TypeScript + Tailwind v4. Only create or edit files in src/ui/,
src/App.tsx and src/index.css. Never edit src/core/.

1. src/ui/state.tsx: a React context holding { mission, crewId, day, setCrewId, setDay, records,
   assessment, refresh } where mission = generateMission(), records = withEntries(crewId,
   mission.records[crewId]), assessment = assess(records, day, mission.env), all memoised.
   refresh() bumps a counter so records are re-read after saveEntry(). Default crewId 'fe1',
   default day = mission.days. Also hold envId (default 'marsTransit') and setEnvId, and create
   the mission with generateMission({ envId }).
2. src/ui/AppShell.tsx: top bar with the app name "Crew Recovery", mission name, environment label,
   "Ground reply: <roundTripDelayLabel(env)> round trip", an environment selector (ENVIRONMENTS)
   and a crew member selector. Below it,
   tab navigation: Today, Body, Trends, Log, Crew. Simple state-based tabs, no router library.
   Each tab renders a placeholder component from src/ui/screens/ for now.
3. src/ui/Timeline.tsx: a mission timeline scrubber fixed at the bottom: a slider from day 1 to
   mission.days showing "Mission day N · <date>", with previous/next day buttons and a "Today"
   button that jumps to the last day. Moving it changes `day` in the context.
4. src/ui/status.ts: one place that maps Status ('ok' | 'watch' | 'alert' | 'nodata') to label
   ("Good", "Watch", "Act", "No data"), colour classes and an icon, plus a <StatusBadge> component.
   Status must never be shown by colour alone: always colour + icon + text. 'nodata' is grey and is
   never styled like 'ok'.
5. Theme: dark "spacecraft console" look, high contrast, large touch targets (min 44 px), readable
   at arm's length. Define colour tokens once in src/index.css with Tailwind @theme.
6. Change src/App.tsx to render the shell inside the context provider. Keep src/dev/Preview.tsx
   reachable by adding "?preview" to the URL.

Done when: npm run typecheck and npm test pass, the five tabs switch, the crew selector and the
timeline change the data shown on the Preview page, and the layout works at 390 px and 1280 px wide.
```

### U2 — Today screen

```
Read docs/CORE_API.md. Using the context from src/ui/state.tsx, build src/ui/screens/Today.tsx.
Only edit files in src/ui/.

Top: a large readiness ring (0-100, animated on change, coloured by assessment.readiness.status;
show "—" and "Not enough data" when score is null) next to a one-line summary of
assessment.overall. Under the ring, list readiness.parts as small bars (Sleep, HRV, Resting HR,
How you feel).

Middle: "What to do" — one card per assessment.findings item, most urgent first. Each card shows a
level chip (1 "Self-care", 2 "Crew Medical Officer", 3 "Flight surgeon"), the title, the `why`
text, and the `actions` as a numbered checklist the user can tick (ticks are local UI state).
Level 3 cards are visually the strongest. With no findings show a calm "Nothing needs action
today" state.

Bottom: "Today's check-in" — assessment.tasks as a checklist with points, a progress bar, the
streak ("N-day streak") and total points. Tasks that are not done link to the Log tab.

Done when: scrubbing the timeline to days 30, 44, 47, 78 and 120 for crew member fe1 shows,
in order: no findings; sleep debt; fever; a level-3 radiation card; low mood and body mass loss.
```

### U3 — Body map

```
Read docs/CORE_API.md. Build src/ui/screens/Body.tsx. Only edit files in src/ui/.

Left: an inline SVG human figure (front view, simple flat shapes, no external image) with 8
clickable regions matching BodyRegionId: head, eyes, heart, lungs, gut, musculoskeletal (limbs and
spine), skin (outline), wholeBody (a halo around the figure for radiation). Each region is filled
by assessment.regions[id] using the status colours from src/ui/status.ts, pulses gently when its
status is 'alert', and is keyboard-focusable with an aria-label like "Heart & circulation: Watch".

Right: a detail panel for the selected region: REGION_BY_ID[id].label and .about; the indicators
whose INDICATOR_BY_ID[x].region equals the region, each with value (formatValue), StatusBadge,
trend arrow, the `reasons`, and an expandable "How to measure" (howToMeasure steps), "Why it
matters in space" (whyInSpace) and "Sources"; then any findings whose `regions` include the
region; then today's symptoms in that region (SYMPTOMS).

Done when: every region can be selected by mouse and keyboard, colours follow the timeline, and
on day 120 for crew member ms1 the eyes region is red with the vision finding shown.
```

### U4 — Trends

```
Read docs/CORE_API.md. Build src/ui/screens/Trends.tsx with Recharts (already installed). Only
edit files in src/ui/.

A selector of indicators (INDICATORS) and a range toggle (14 / 30 / all days up to the selected
day). The chart is a line of records[].values[id] with gaps where a day has no value (connectNulls
off). Draw the thresholds from INDICATOR_BY_ID[id].bands as shaded horizontal zones (amber for
watch, red for alert) — skip this for bodyMass, whose bands are percentages. Draw the personal
baseline (the selected day's IndicatorResult.baseline.median) as a dashed line labelled "Your
normal". Mark the selected day. Tooltip shows day, date and value with unit.

Under the chart: "What affects your recovery" — assessment.insights (max 8) as rows using
describeInsight(i), a green or amber marker from i.good, and the strength. Add the line
"Correlations in your own data, not proof of cause." With no insights, explain that at least
5 days with and 5 days without a behaviour are needed.

Done when: the chart animates between indicators, is readable at 390 px wide, and the day-78
radiation spike and the day 38-46 sleep dip are clearly visible for crew member fe1.
```

### U5 — Daily log

```
Read docs/CORE_API.md. Build src/ui/screens/Log.tsx. Only edit files in src/ui/.

A form for the selected day and crew member, prefilled from the current record:
- Mood, energy, stress: 1-5 button scales (tap again to clear).
- Journal: JOURNAL items as large toggle buttons showing label and hint.
- Symptoms: SYMPTOMS as multi-select chips.
- Measurements: blood pressure (two readings; show and save the average of each pair as bpSys and
  bpDia), temperature, exercise minutes, and — marked "weekly" — fasting glucose and body mass.
  Each field has a "How?" button that opens the indicator's howToMeasure steps and whyInSpace.
  Reject impossible numbers (for example systolic outside 60-260) with an inline message.
- Items listed in assessment.due get a "Due today" marker.
Save with saveEntry(crewId, day, patch), then call refresh() from the context and show what
changed: the new status of each indicator that was just entered.

Done when: entering temperature 38.4 on the last day makes a fever finding appear on the Today
tab, the entry survives a page reload, and a "Reset demo data" button (clearEntries + refresh)
restores the original data.
```

### U6 — Crew overview

```
Read docs/CORE_API.md. Build src/ui/screens/Crew.tsx. Only edit files in src/ui/.

One card per mission.crew member for the selected day: name, role, overall StatusBadge, readiness
score, the title and level of the most urgent finding (or "No action needed"), and the count of
findings. Compute each with assess(withEntries(id, mission.records[id]), day, mission.env),
memoised. Cards are sorted most urgent first. Clicking a card selects that crew member and opens
the Today tab. Add a short note that this view is for the Crew Medical Officer.

Done when: on day 120 Sofia Lindqvist is first with a level-3 finding, and on day 78 all four
show the radiation event.
```

### U7 — Polish (after U1–U6)

- Guided demo: a "Mission story" button that steps through days 30 → 44 → 47 → 64 → 78 → 92 → 120 with a one-line caption for each.
- Empty and `nodata` states on every screen; keyboard navigation; reduced-motion support.
- App icon and page title in `public/`.

## Logic tasks (`aquari5` + Claude)

- [x] Data model, indicator catalogue, thresholds with sources
- [x] Personal baseline, indicator status, trends
- [x] Readiness score
- [x] Escalation rules (16) with three levels and the communication-delay note
- [x] Correlation engine
- [x] Check-in tasks, streak, points
- [x] Synthetic 120-day mission for four crew members
- [x] Local storage of entries
- [x] Tests (27)
- [x] Verify thresholds against sources (see `docs/SOURCES.md` for what was checked)
- [x] Environment option (station / Moon / Mars) affecting radiation and delay notes
- [ ] Demo script and 30-second video plan
- [ ] Submission text, including the required description of AI tool use
- [ ] Deploy the build to a public URL

## Requests (UI → logic)

Write here what you need from `src/core/` and push. Format: `- [ ] what you need — why`.
