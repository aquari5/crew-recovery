# Task board

Deadline: **Sunday 15 November, 23:59** (local time of the team creator). Aim to have everything merged by Sunday 18:00 and use the evening for the demo video and the submission form.

## Who owns what

| Area | Owner | Files |
|---|---|---|
| Health logic, demo data, thresholds, tests | `aquari5` + Claude | `src/core/**`, `src/dev/**`, `docs/**` |
| Screens, components, visual design | `aquari5` + Claude (first version: `afkjacobbb` + Codex) | `src/ui/**`, `src/App.tsx`, `src/index.css`, `public/**` |

Rules that keep two AI-assisted people out of each other's way:

1. Stay inside your own files. If the UI needs something from the logic (a new field, a new function), write it in the "Requests" section at the bottom and push; do not edit `src/core/`.
2. `git pull --rebase` before every push. Push small and often to `main`.
3. `npm run typecheck` and `npm test` must pass before a push.
4. All user-facing text in English.

## UI

The first UI (tasks U1–U7) was built by `afkjacobbb` with Codex. On 14 November the UI was redesigned by `aquari5` with Claude: light theme, readiness orb, timeline strip, hotspot body map. The form logic in `src/ui/log.ts`, the crew sorting in `src/ui/crew.ts` and the chart helpers in `src/ui/trends.ts` are kept from the first version. There are no open UI briefs.

## Logic tasks (`aquari5` + Claude)

- [x] Data model, indicator catalogue, thresholds with sources
- [x] Personal baseline, indicator status, trends
- [x] Readiness score
- [x] Escalation rules (16) with three levels and the communication-delay note
- [x] Correlation engine
- [x] Check-in tasks, streak, points
- [x] Synthetic 120-day mission for four crew members
- [x] Local storage of entries
- [x] Tests (27 logic + 20 UI, all run by `npm test`)
- [x] UI redesign
- [x] Verify thresholds against sources (see `docs/SOURCES.md` for what was checked)
- [x] Environment option (station / Moon / Mars) affecting radiation and delay notes
- [ ] Demo script and 30-second video plan
- [ ] Submission text, including the required description of AI tool use
- [ ] Deploy the build to a public URL

## Requests (UI → logic)

Write here what you need from `src/core/` and push. Format: `- [ ] what you need — why`.
