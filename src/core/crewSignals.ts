// Crew-wide signals: is it you, or is it the cabin?
//
// One astronaut with a headache has a headache. Three of four with a headache
// on the same day have a shared cause: the air, the schedule, the food, a
// failed device. Treating each person separately would miss it. This module
// compares the crew on one day and reports what several of them share, so the
// first question becomes "what changed for all of us?".

import { assess } from './assess'
import { SYMPTOM_BY_KEY } from './catalog'
import { INDICATOR_BY_ID, formatValue } from './indicators'
import type { CrewMember, DailyRecord, IndicatorId, MissionEnvironment, Status, SymptomKey } from './types'

export interface CrewSignal {
  id: string
  kind: 'indicator' | 'symptom'
  status: Status
  title: string
  why: string
  actions: string[]
  /** Names of the crew members who share it. */
  affected: string[]
  crewSize: number
}

/** Indicators that describe the vehicle, not the person: one reading out of range concerns everyone. */
const CABIN: IndicatorId[] = ['co2', 'radiation']

/** Where to look first when several people share an out-of-range indicator. */
const LOOK_AT: Partial<Record<IndicatorId, string[]>> = {
  sleep: ['Compare the work-rest schedule with last week: shifted or shortened sleep periods affect everyone.', 'Check noise, light and temperature in the sleep stations.', 'Ask the ground to protect an 8-hour sleep window before the next critical task.'],
  restingHR: ['Check cabin temperature and CO₂.', 'Look for a shared short-sleep period in the last days.'],
  hrv: ['Look for a shared short-sleep or high-workload period in the last days.'],
  exercise: ['Check the exercise devices: a fault removes everyone’s sessions at once.', 'Switch the whole crew to elastic bands and body-weight work until it is repaired.'],
  mood: ['Plan one shared activity that is not work.', 'Check when each person last had private time and contact with home.', 'Raise it with the ground as a crew matter, not an individual one.'],
  energy: ['Review workload and sleep for the whole crew.', 'Check that meals are being eaten as planned.'],
  stress: ['Review the timeline with the ground: workload is the usual shared cause.', 'Protect private time for each person today.'],
  temp: ['Several raised temperatures suggest an infection moving through the crew: separate eating utensils, clean shared surfaces.', 'Check cabin temperature control.'],
  spo2: ['Check cabin pressure, oxygen and CO₂ before assuming a lung problem.'],
  bodyMass: ['Review the food system: menu fatigue and missed meals affect the whole crew.'],
}

const SYMPTOM_HINT: Partial<Record<SymptomKey, string[]>> = {
  headache: ['Measure cabin CO₂ where people work and sleep; pockets form where air does not move.', 'Check fan and ventilation flow, and CO₂ removal performance.'],
  nausea: ['Early in the mission this is adaptation to weightlessness. Later, suspect food or water: check what was shared.'],
  fatigue: ['Review sleep and workload for the whole crew before treating individuals.'],
  congestion: ['Common in the first days from the fluid shift. Later, check humidity and air filters.'],
  dizziness: ['Check cabin CO₂ and oxygen.'],
  rash: ['Several rashes suggest a shared irritant or an infection: check hygiene supplies and shared surfaces.'],
  coldSore: ['Virus reactivation under shared stress or short sleep: look at the schedule.'],
}

const list = (names: string[]) => (names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`)
const worse = (a: Status, b: Status): Status => (a === 'alert' || b === 'alert' ? 'alert' : 'watch')

/**
 * What the crew shares on `day`. A signal is shared when at least two people,
 * and at least half of those with data, have it.
 */
export function crewSignals(crew: CrewMember[], records: Record<string, DailyRecord[]>, day: number, env: MissionEnvironment): CrewSignal[] {
  const people = crew.map((member) => ({
    member,
    assessment: assess(records[member.id] ?? [], day, env),
    today: (records[member.id] ?? []).find((r) => r.day === day),
  }))
  const shared = (n: number, withData: number) => n >= 2 && n * 2 >= withData
  const out: CrewSignal[] = []

  for (const def of Object.values(INDICATOR_BY_ID)) {
    const results = people.map((p) => ({ name: p.member.name, result: p.assessment.indicators.find((i) => i.id === def.id)! }))
    const withData = results.filter((r) => r.result.status !== 'nodata')
    const off = withData.filter((r) => r.result.status !== 'ok')
    if (!shared(off.length, withData.length)) continue
    const status = off.map((r) => r.result.status).reduce(worse, 'watch' as Status)
    const names = off.map((r) => r.name)
    const cabin = CABIN.includes(def.id)
    const reading = formatValue(def.id, off[0].result.value)
    out.push({
      id: `indicator-${def.id}`,
      kind: 'indicator',
      status,
      title: cabin ? `${def.label}: out of range for everyone on board` : `${def.label}: ${off.length} of ${withData.length} crew out of range`,
      why: cabin
        ? `${reading} today. This is a property of the vehicle, so it concerns everyone on board, with or without symptoms.`
        : `${list(names)} are out of range on the same day. One shared cause is more likely than ${off.length} separate ones.`,
      actions: cabin
        ? def.id === 'co2'
          ? ['Check CO₂ removal and ventilation now.', 'Move work and sleep away from places with poor air flow.', 'Log headaches for the whole crew, including mild ones.']
          : ['Follow the radiation finding on each person’s Today screen.', 'Log every dosimeter, not only the highest one.']
        : (LOOK_AT[def.id] ?? ['Look for what changed for everyone in the last days: schedule, workload, equipment, food.']),
      affected: names,
      crewSize: crew.length,
    })
  }

  const symptomKeys = new Set(people.flatMap((p) => p.today?.symptoms ?? []))
  const reporting = people.filter((p) => p.today && Object.keys(p.today.journal).length > 0)
  for (const key of symptomKeys) {
    const names = people.filter((p) => p.today?.symptoms.includes(key)).map((p) => p.member.name)
    if (!shared(names.length, reporting.length)) continue
    const label = SYMPTOM_BY_KEY[key].label
    out.push({
      id: `symptom-${key}`,
      kind: 'symptom',
      status: 'watch',
      title: `${label}: reported by ${names.length} of ${reporting.length} crew`,
      why: `${list(names)} report it today. A symptom that several people share points at the environment before it points at any one of them.`,
      actions: SYMPTOM_HINT[key] ?? ['Look for what the affected people share: location, food, water, schedule.'],
      affected: names,
      crewSize: crew.length,
    })
  }

  const rank = (s: CrewSignal) => (s.status === 'alert' ? 2 : 1) * 10 + s.affected.length
  return out.sort((a, b) => rank(b) - rank(a))
}
