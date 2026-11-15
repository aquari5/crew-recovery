# Core API

Everything the UI needs comes from one import. Do not import from files inside `src/core/` directly and do not re-declare its types.

```ts
import { generateMission, withEntries, assess, saveEntry, INDICATOR_BY_ID, type Assessment } from '../core'
```

A complete working example is `src/dev/Preview.tsx`.

## The three calls you need

```ts
const mission = generateMission({ envId })        // demo data, same on every machine
const records = withEntries(crewId, mission.records[crewId])  // + what the user typed in
const a = assess(records, day, mission.env)       // everything for one person on one day
```

- `mission.crew` — `{ id, name, role }[]` (4 people; `fe1` "Alex Rivera" is the main character).
- `mission.days` — 120. `day` is 1-based. Any day from 1 to 120 can be assessed, which is how the timeline scrubber works.
- `envId` is optional: `'leo' | 'lunar' | 'marsTransit' | 'marsSurface'` (default `'marsTransit'`). It changes the radiation background, the size of the solar event and the communication delay. List the choices from `ENVIRONMENTS`.
- `mission.env` — where the crew is (`label`, `commDelaySec`, `gravityG`). `roundTripDelayLabel(env)` gives `"20 min"`.
- Wrap the calls in `useMemo`; `assess` is cheap but not free.

## `Assessment`

| Field | Type | Meaning |
|---|---|---|
| `overall` | `Status` | Worst status of the day |
| `readiness` | `{ score: number \| null, status, parts[] }` | 0–100 recovery score. `null` = not enough data, show "—" |
| `indicators` | `IndicatorResult[]` | One per indicator, fixed order |
| `findings` | `Finding[]` | What to do, most urgent first |
| `regions` | `Record<BodyRegionId, Status>` | Colour of each body region |
| `insights` | `Insight[]` | Behaviour → metric correlations, strongest first |
| `tasks` | `DailyTask[]` | Today's check-in list with `done` and `points` |
| `streak`, `points` | `number` | Consecutive complete check-ins; total points |
| `radiation` | `{ cumulativeMsv, careerLimitMsv, fractionOfLimit }` | Mission dose so far |
| `due` | `IndicatorId[]` | Manual measurements due today |

`Status` is `'ok' | 'watch' | 'alert' | 'nodata'`. **`nodata` is not `ok`**: render it grey with "—", never green.

### `IndicatorResult`

`{ id, value, valueDay, status, reasons[], baseline, z, trend }`

- `value` is `null` when nothing recent was measured. Use `formatValue(id, value)` to print it with its unit.
- `reasons` are ready-to-show sentences.
- `baseline` is `{ median, spread, n }` — the person's own normal — or `null` early in the mission.
- `trend.dir` is `'up' | 'down' | 'flat' | 'none'`. `none` means "not enough data": show no arrow.

### `Finding`

`{ id, level, title, why, actions[], indicators[], regions[], hazards[] }`

`level`: `1` self-care · `2` Crew Medical Officer · `3` flight surgeon (ground). `actions` are ordered steps.

### `Insight`

Use `describeInsight(i)` for the sentence. `i.good` says whether the effect is healthy; `i.strength` is `'moderate' | 'strong'`. `i.p` is the p-value of the difference and `i.adjusted` is the difference that remains with all other behaviours accounted for (or `null`). Only pairs that pass the checks in `docs/VALIDATION.md` are returned.

## Other calls

| Call | Returns |
|---|---|
| `missionTimeline(records, env)` | `{ day, status, level }[]` for every mission day; `status` equals `assess(...).overall` for that day |
| `missionOutlook(records, day, mission.plannedDays)` | Four `OutlookItem`s (`radiation`, `bone`, `sleepDebt`, `bodyMass`) with `value`, `detail`, `status`, `basis` |
| `buildGroundReport({ crew, missionName, env, records, assessment })` | `{ subject, body }`, a plain-text SBAR report |

## Static content (for labels, help text, the body map)

| Export | Use |
|---|---|
| `INDICATORS`, `INDICATOR_BY_ID` | `label`, `unit`, `region`, `bands` (thresholds), `howToMeasure[]`, `whyInSpace`, `sources[]`, `cadence` |
| `REGIONS`, `REGION_BY_ID` | 8 body regions with `label` and `about` |
| `JOURNAL` | 12 daily yes/no items with `label` and `hint` |
| `SYMPTOMS` | 11 symptoms with `label` and `region` |
| `HAZARDS` | NASA's five hazards |
| `ENVIRONMENTS` | Station, Moon, Mars transit, Mars surface |

`bands` is `{ alertLow?, watchLow?, watchHigh?, alertHigh? }`; use it to draw threshold zones on charts. For `bodyMass` the bands are percent change from mission start, not kilograms.

## Raw data for charts

`records` is `DailyRecord[]`: `{ day, date, values, journal, symptoms }`. `values[id]` is `undefined` on days without a measurement — leave a gap in the line, do not plot 0.

```ts
const points = records.filter(r => r.day <= day).map(r => ({ day: r.day, value: r.values.hrv }))
```

## Saving what the user enters

```ts
saveEntry(crewId, day, {
  values: { bpSys: 118, bpDia: 76, mood: 4 },
  journal: { caffeineLate: true },
  symptoms: ['headache'],
})
```

Entries are stored in `localStorage` and merged by `withEntries`. After saving, re-read `withEntries(...)` (bump a state counter that the `useMemo` depends on) so the assessment updates. Pass `null` as a value to clear a reading. `clearEntries()` resets the demo.

## Timing convention

`sleep`, `restingHR`, `hrv` on day N describe the night that ended on the morning of day N. The journal on day N describes what happened during day N.

## Crew-wide signals

`crewSignals(crew, recordsByCrewId, day, env)` returns what at least two people, and at least half of those with data, share on that day: out-of-range indicators and reported symptoms, each with `title`, `why`, `actions` and the names in `affected`. Pass the result to `buildGroundReport({ ..., crewSignals })` to include the shared ones in a person's report.

## Space weather

`parseDonki(records)` turns NASA DONKI SEP records into events; `spaceWeatherAt(events, timeMs)` gives the status and advice at a moment; `warningTimes(events, env)` gives, per flare, the minutes until the first measured protons and what is left after the one-way link delay. Recorded data: `SEP_2017_09`, `SEP_2024_05`, `SNAPSHOT`.
