# UI

Screens and components. All numbers come from `src/core`; nothing here computes health results.

- `AppShell.tsx` — navigation, environment and crew selectors, section switching.
- `Timeline.tsx` — floating mission timeline; one bar per mission day, coloured by that day's status. `MissionStory.tsx` and `story.ts` drive the guided walk-through.
- `screens/Today.tsx` — status headline, readiness orb, findings with checklists, check-in, radiation, one pattern.
- `screens/Body.tsx` — figure with one hotspot per body region and the detail panel.
- `screens/Trends.tsx` — indicator chart with threshold zones and personal baseline; patterns grouped by behaviour.
- `screens/Log.tsx`, `log.ts` — daily entry form, validation and saving.
- `screens/Crew.tsx`, `crew.ts` — crew overview for the Crew Medical Officer.
- `state.tsx` — shared mission state (environment, crew member, day, records, assessment, timeline).

One colour rule: the headline, the orb, the page backdrop and the timeline bar for a day all show `assessment.overall`.

Styles live in `src/index.css`. `?preview` in the URL shows the raw output of the logic (`src/dev/Preview.tsx`).
