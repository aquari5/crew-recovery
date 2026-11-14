# Crew Recovery UI

Implementation covers U1–U7. Acceptance is pending full typecheck, Vitest, build and browser verification; see the validation section below. Only `src/ui/**`, `src/App.tsx`, `src/index.css` and `public/**` were changed. Core logic and clinical thresholds were not modified.

## Implemented

| Task | Implementation |
| --- | --- |
| U1 | Shared memoised mission state, environment/crew selection, five tabs, timeline, status vocabulary, responsive dark theme |
| U2 | Readiness ring and component bars, prioritised action checklists, daily check-in/progress/points |
| U3 | Eight-region SVG body map, keyboard and touch selection, measurements, reasons, help, sources, findings and symptoms |
| U4 | Recharts history, 14/30/all-day ranges, gaps, absolute threshold zones, personal baseline, selected day, tooltips, data table and insights |
| U5 | Prefilled daily log, clearable scales, journal/symptoms, validated measurements, two-reading BP averages, saved statuses, reset and recoverable drafts |
| U6 | Crew assessments sorted by escalation, individual status/readiness/findings and navigation to Today |
| U7 | Seven-step mission story, no-data states, focus and reduced-motion handling, application icon and page title |

### Entry points

- `/`: application, initially Today for Alex Rivera on the latest mission day.
- `?preview`: assessment data with the same mission controls and state as the application.
- `?preview=reference`: original, unmodified logic reference (`src/dev/Preview.tsx`), with its own controls.

### Data behaviour

- Measurements are saved through `saveEntry`, then re-read through `withEntries` before success is shown. Save failures keep the draft visible.
- Only edited values are patched; a cleared value is saved as null and removed by the core merge function.
- Check-in completion, score, points and findings are computed by the core, never manually set by the UI.
- Action checkmarks are temporary and scoped to environment, person and day; they do not change health status.
- Unsaved Log drafts use session storage, separately for each environment/person/day, so switching tabs or mission selection does not overwrite another draft. Leaving with unsaved edits triggers a browser warning.
- Reset clears all saved crew entries and UI drafts, with an in-app confirmation.
- Core storage keys entries by crew/day, not by environment. Saved entries therefore apply when switching environment; the UI does not introduce a conflicting storage scheme.
- Story captions describe the original synthetic mission. Saved entries remain applied; the story never silently clears them.

## Validation

### Passed in this environment

Run with Node 24 or later, no installed packages required:

```sh
node src/ui/tests/contracts.mjs
```

11 executed contract checks cover the required Today/Body scenarios, trend range/gaps, visible radiation spike and sleep dip, threshold-zone ordering, blood-pressure averaging/validation, clearing only edited readings, saved 38.4°C producing fever, reset, and Crew priority/rereading saved entries.

All UI TypeScript/TSX sources were also parsed successfully with the available Babel parser. Local imports resolve. Base foreground/status colour pairs were checked for text contrast. Parsing is not TypeScript type checking, and contract tests do not validate browser behaviour.

### Still required

The supplied ZIP has no Git metadata. No commit or push was made. This executor has an embedded Node runtime but no npm or installed project dependencies, and cannot resolve registry.npmjs.org. Consequently the application has not been launched here; TypeScript, Vitest (including the UI rendering tests), lint, production build and browser verification remain pending.

From the project directory with Node.js/npm and network access:

```sh
npm ci
npm run typecheck
npm test
npm run lint
npm run build
npm run dev
```

Browser acceptance at 390px and 1280px (also inspect 320px, keyboard focus and reduced motion):

1. Switch every tab by pointer and keyboard (arrows, Home, End); change crew/environment; check the timeline endpoints and Today button.
2. Alex: days 30, 44, 47, 78, 120 show calm, sleep debt, fever, level-3 radiation, and low mood/body mass loss respectively.
3. Select all eight SVG regions with Enter/Space and via labelled buttons. Sofia on day 120 has a red eyes region and the vision finding.
4. Trends: day-78 radiation spike and day-38–46 sleep dip are visible; weekly measurement gaps stay gaps. Check ranges, tooltip, baseline and data table.
5. Log: temperature 38.4 on day 120 saves and causes fever on Today. Reload and verify persistence. Clear a scale, validate incomplete/impossible BP entries, save a pair and verify its average. Make sure unrelated values stay unchanged.
6. Start a draft, switch day/crew/tab, then return; the draft is restored. Test storage blocked/full and ensure no false success message.
7. Crew: Sofia first on day 120; all four have radiation findings on day 78; selecting a card opens that person's Today.
8. Run all seven Mission story steps, use Previous/Resume/Close, and confirm edited data is preserved.
9. Reset demo data, confirm, then verify all crew entries and drafts are restored to the original mission.
10. Confirm the fixed timeline never covers focused controls, chart labels remain legible and the favicon/title appear.
