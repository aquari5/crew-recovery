// Ground report: one complete message for the flight surgeon.
//
// With a 20-minute one-way delay there is no conversation, only messages. A
// vague first message costs 40 minutes per clarifying question, so the report
// carries everything a clinician would ask for, in SBAR order (Situation,
// Background, Assessment, Request), as plain text that survives any link.

import { JOURNAL, SYMPTOM_BY_KEY, roundTripDelayLabel } from './catalog'
import { upTo } from './evaluate'
import { INDICATOR_BY_ID, formatValue } from './indicators'
import { mean } from './stats'
import type { CrewSignal } from './crewSignals'
import type { Assessment, CrewMember, DailyRecord, JournalKey, MissionEnvironment } from './types'

export interface GroundReport {
  subject: string
  body: string
}

/** Journal items that protect health: their absence is the signal, not their presence. */
const PROTECTIVE: JournalKey[] = ['resistiveExercise', 'familyContact', 'privateTime']

const LEVEL = { 1: 'self-care', 2: 'Crew Medical Officer', 3: 'flight surgeon' } as const
const pad = (s: string, n: number) => (s.length >= n ? s : s + ' '.repeat(n - s.length))

export function buildGroundReport(input: {
  crew: CrewMember
  missionName: string
  env: MissionEnvironment
  records: DailyRecord[]
  assessment: Assessment
  /** Signals shared across the crew today; those that include this person are reported. */
  crewSignals?: CrewSignal[]
}): GroundReport {
  const { crew, missionName, env, records, assessment: a } = input
  const hist = upTo(records, a.day)
  const today = hist.find((r) => r.day === a.day)
  const week = hist.filter((r) => r.day > a.day - 7)
  const top = a.findings[0]
  const lines: string[] = []
  const add = (...xs: string[]) => lines.push(...xs)

  add(
    `CREW HEALTH REPORT — ${crew.name}, ${crew.role}`,
    `${missionName} · mission day ${a.day} (${a.date}) · ${env.label}`,
    `Link: ${roundTripDelayLabel(env)} round trip. Generated on board from crew-entered and sensor data. Not reviewed by a clinician.`,
    '',
    'SITUATION',
  )
  if (a.findings.length) {
    for (const f of a.findings) add(`- [Level ${f.level}, ${LEVEL[f.level]}] ${f.title}. ${f.why}`)
  } else {
    add('- No findings requiring action. Routine status report.')
  }

  add('', 'BACKGROUND')
  add(`- Symptoms today: ${today?.symptoms.length ? today.symptoms.map((s) => SYMPTOM_BY_KEY[s].label.toLowerCase()).join(', ') : 'none reported'}.`)
  const avg = (id: 'sleep' | 'mood' | 'exercise', d: number) => {
    const m = mean(week.map((r) => r.values[id]))
    return m == null ? 'no data' : m.toFixed(d)
  }
  add(`- Last 7 days: sleep ${avg('sleep', 1)} h/night, mood ${avg('mood', 1)}/5, exercise ${avg('exercise', 0)} min/day.`)
  // Risk behaviours that were present, and protective ones that were missing.
  const flags = JOURNAL.filter((j) => !PROTECTIVE.includes(j.key))
    .map((j) => ({ label: j.label.toLowerCase(), n: week.filter((r) => r.journal[j.key]).length }))
    .filter((f) => f.n >= 3)
  if (flags.length) add(`- Logged on 3+ of the last 7 days: ${flags.map((f) => `${f.label} (${f.n})`).join(', ')}.`)
  const missing = JOURNAL.filter((j) => PROTECTIVE.includes(j.key))
    .map((j) => ({ label: j.label.toLowerCase(), n: week.filter((r) => r.journal[j.key] === false).length }))
    .filter((f) => f.n >= 4)
  if (missing.length) add(`- Missing on 4+ of the last 7 days: ${missing.map((f) => `${f.label} (${f.n} days without)`).join(', ')}.`)
  const sharedWithCrew = (input.crewSignals ?? []).filter((signal) => signal.affected.includes(crew.name))
  if (sharedWithCrew.length) {
    add(`- Shared with other crew today (a common cause is likely): ${sharedWithCrew.map((signal) => `${signal.title.toLowerCase()}`).join('; ')}.`)
  }
  add(`- Mission radiation dose: ${a.radiation.cumulativeMsv} mSv (${Math.round(a.radiation.fractionOfLimit * 100)}% of the ${a.radiation.careerLimitMsv} mSv career limit).`)

  add('', 'ASSESSMENT', `${pad('Indicator', 28)}${pad('Value', 16)}${pad('Own normal', 14)}Status`)
  for (const i of a.indicators) {
    const def = INDICATOR_BY_ID[i.id]
    const age = i.valueDay != null && i.valueDay !== a.day ? ` (day ${i.valueDay})` : ''
    add(
      `${pad(def.label, 28)}${pad(formatValue(i.id, i.value) + age, 16)}${pad(i.baseline ? i.baseline.median.toFixed(def.decimals) : '—', 14)}${i.status === 'nodata' ? 'no data' : i.status}`,
    )
  }
  add(`Readiness score: ${a.readiness.score ?? 'not available'}${a.readiness.score != null ? '/100' : ''}. Overall status: ${a.overall}.`)

  const started = a.findings.filter((f) => f.level >= 2)
  if (started.length) {
    add('', 'ACTIONS STARTED ON BOARD')
    for (const f of started) {
      add(`${f.title}:`)
      f.actions.forEach((step, n) => add(`  ${n + 1}. ${step}`))
    }
  }

  add('', 'REQUEST')
  const forGround = a.findings.filter((f) => f.level === 3)
  if (forGround.length) add(`- Flight surgeon review requested for: ${forGround.map((f) => f.title.toLowerCase()).join('; ')}.`, '- Advise on further steps and on any change to the crew timeline.')
  else if (started.length) add('- For information. Being managed on board with the Crew Medical Officer. Advise if you want additional measurements.')
  else add('- For information only. No reply required.')

  return {
    subject: `Day ${a.day} health report — ${crew.name}${top ? ` — L${top.level}: ${top.title}` : ' — routine'}`,
    body: lines.join('\n'),
  }
}
