// Synthetic mission data for the demo: a 120-day Mars transit with a crew of four.
//
// Everything is generated deterministically from a seed, so every machine shows
// the same numbers. No real astronaut data is used.
//
// The data has a story on purpose, so the tool can be demonstrated by moving
// through the mission timeline:
//   days   1-10   adaptation to weightlessness (motion sickness, congestion)
//   days  38-46   shifted sleep schedule for critical operations -> sleep debt,
//                 then a cold sore / rash and a mild fever (virus reactivation)
//   days  63-66   CO2 removal degraded -> elevated cabin CO2, headaches
//   days  78-79   solar particle event -> radiation dose spike
//   days  85-97   resistive exercise device out of service
//   days  96-120  "third-quarter" dip: low mood, low appetite, mass loss
//
// Behaviours also have built-in next-day effects (late caffeine shortens sleep,
// contact with home lifts mood, ...) so the correlation engine has something
// real to find.

import { ENVIRONMENT_BY_ID } from './catalog'
import { clamp, mulberry32 } from './stats'
import type { CrewMember, DailyRecord, JournalKey, MissionEnvironment, SymptomKey } from './types'

export interface MissionData {
  name: string
  env: MissionEnvironment
  startDate: string
  days: number
  /** Planned length of this mission phase in days; used for projections. */
  plannedDays: number
  crew: CrewMember[]
  /** Records per crew member id, sorted by day. */
  records: Record<string, DailyRecord[]>
}

interface Profile extends CrewMember {
  restingHR: number
  hrv: number
  sleepNeed: number
  sys: number
  dia: number
  mass: number
  /** How strongly this person reacts to the mission events (0-1). */
  sensitivity: number
  /** Optional scripted late-mission symptom, to show a level-3 case in the crew view. */
  lateSymptom?: SymptomKey
}

const PROFILES: Profile[] = [
  { id: 'fe1', name: 'Alex Rivera', role: 'Flight Engineer', restingHR: 54, hrv: 62, sleepNeed: 7.5, sys: 116, dia: 74, mass: 72, sensitivity: 1 },
  { id: 'cdr', name: 'Maya Okafor', role: 'Commander', restingHR: 51, hrv: 70, sleepNeed: 7.2, sys: 110, dia: 70, mass: 63, sensitivity: 0.55 },
  { id: 'cmo', name: 'Kenji Tanaka', role: 'Crew Medical Officer', restingHR: 57, hrv: 55, sleepNeed: 7.6, sys: 121, dia: 78, mass: 78, sensitivity: 0.35 },
  { id: 'ms1', name: 'Sofia Lindqvist', role: 'Mission Specialist', restingHR: 56, hrv: 58, sleepNeed: 7.4, sys: 113, dia: 72, mass: 60, sensitivity: 0.75, lateSymptom: 'visionChange' },
]

export const MISSION_DAYS = 120
const EVA_DAYS = new Set([20, 52, 71, 110])
const CO2_EVENT: Record<number, number> = { 63: 3.1, 64: 3.9, 65: 4.4, 66: 3.3 }
const SPE_DOSE: Record<number, number> = { 78: 12.4, 79: 5.1 }

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

const round = (v: number, d = 0) => {
  const f = 10 ** d
  return Math.round(v * f) / f
}

/** How much of a deep-space solar particle event reaches the crew in each environment. */
const SPE_FACTOR: Record<MissionEnvironment['id'], number> = { leo: 0.15, lunar: 1, marsTransit: 1, marsSurface: 0.4 }

function generateFor(p: Profile, seed: number, days: number, startDate: string, env: MissionEnvironment): DailyRecord[] {
  const rnd = mulberry32(seed)
  const noise = (amp: number) => (rnd() * 2 - 1) * amp
  const chance = (prob: number) => rnd() < prob
  const k = p.sensitivity

  const out: DailyRecord[] = []
  let debt = 0 // accumulated sleep debt in hours, decays over days
  let mass = p.mass
  let prev: Partial<Record<JournalKey, boolean>> = {}

  for (let day = 1; day <= days; day++) {
    const adapt = day <= 5
    const shift = day >= 38 && day <= 46
    const deviceDown = day >= 85 && day <= 97
    const q3 = clamp((day - 96) / 14, 0, 1) * k // ramps 0 -> k over two weeks, then holds
    const recent = day > days - 9 // keep the final days complete for the demo
    const co2Event = CO2_EVENT[day]

    // ── Night that ended this morning: driven by YESTERDAY's behaviours ────
    const co2 = round(co2Event ?? 1.9 + noise(0.3), 1)
    let sleep =
      p.sleepNeed - 0.5 + noise(0.45) -
      (prev.caffeineLate ? 0.6 : 0) -
      (prev.screenLate ? 0.4 : 0) -
      (prev.noisySleep ? 0.5 : 0) -
      (prev.scheduleShift ? 1.3 * k + 0.3 : 0) -
      (prev.highWorkload ? 0.3 : 0) +
      (prev.resistiveExercise ? 0.25 : 0) +
      (prev.privateTime ? 0.2 : 0) +
      (prev.sleepAid ? 0.3 : 0) -
      (CO2_EVENT[day - 1] ? 0.5 : 0) -
      (adapt ? 0.5 : 0)
    sleep = round(clamp(sleep, 3.5, 9), 1)
    debt = debt * 0.7 + Math.max(0, 7 - sleep)

    const immune = k >= 0.7 && day >= 46 && day <= 48 // fever after the sleep-debt week
    const hrv = round(p.hrv - 2.2 * debt - (immune ? 6 : 0) + noise(4))
    const restingHR = round(p.restingHR + 1.0 * debt + (immune ? 6 : 0) + noise(1.5))
    const spo2 = round(clamp(97 + noise(1.2) - (co2Event ? 1 : 0), 90, 100))

    // ── Today's behaviours ────────────────────────────────────────────────
    const journal: Partial<Record<JournalKey, boolean>> = {
      scheduleShift: chance(shift ? 0.9 : 0.04),
      highWorkload: chance(shift ? 0.85 : 0.22),
      evaDay: EVA_DAYS.has(day),
      caffeineLate: chance(shift ? 0.7 : 0.2),
      screenLate: chance(0.3 + 0.2 * q3),
      noisySleep: chance(co2Event ? 0.4 : 0.12),
      sleepAid: chance(shift ? 0.3 : 0.05),
      resistiveExercise: deviceDown ? false : chance(0.85 - 0.3 * q3),
      familyContact: chance(clamp(0.6 - 0.3 * (day / days) - 0.2 * q3, 0.05, 1)),
      privateTime: chance(shift ? 0.15 : 0.55 - 0.2 * q3),
      lowAppetite: chance(clamp(0.07 + 0.5 * q3 + (adapt ? 0.4 : 0), 0, 1)),
      lowFluids: chance(shift ? 0.3 : 0.12),
    }

    // ── Today's measurements ──────────────────────────────────────────────
    const stressF =
      2.2 + (journal.highWorkload ? 1.2 : 0) + (journal.scheduleShift ? 0.6 : 0) -
      (journal.privateTime ? 0.5 : 0) + 0.6 * q3 + noise(0.5)
    const moodF =
      3.8 + (journal.familyContact ? 0.5 : 0) + (journal.privateTime ? 0.3 : 0) -
      0.25 * debt - 1.9 * q3 + noise(0.5)
    const energyF =
      3.9 - 0.35 * debt - 0.8 * q3 - (journal.lowAppetite ? 0.4 : 0) +
      (prev.resistiveExercise ? 0.3 : 0) + noise(0.5)
    const scale = (v: number) => round(clamp(v, 1, 5))

    const exercise = EVA_DAYS.has(day)
      ? 30
      : round(journal.resistiveExercise ? 112 + noise(20) : deviceDown ? 35 + noise(10) : 48 + noise(15))

    mass += -0.008 - (journal.lowAppetite ? 0.1 + 0.14 * k : 0) - (deviceDown ? 0.05 : 0) + noise(0.03)

    const feverTemp: Record<number, number> = { 46: 37.8, 47: 38.3, 48: 37.5 }
    const temp = round(immune ? feverTemp[day] : 36.6 + noise(0.2), 1)

    const values: DailyRecord['values'] = {
      sleep,
      restingHR,
      hrv,
      spo2,
      co2,
      radiation: round(
        SPE_DOSE[day] ? SPE_DOSE[day] * SPE_FACTOR[env.id] + env.typicalDoseMsvPerDay : env.typicalDoseMsvPerDay * (1 + noise(0.14)),
        1,
      ),
      bpSys: round(p.sys + 0.8 * debt + noise(4)),
      bpDia: round(p.dia + 0.5 * debt + noise(3)),
      temp,
      mood: scale(moodF),
      energy: scale(energyF),
      stress: scale(stressF),
      exercise,
    }
    if (day % 7 === 1) values.bodyMass = round(mass, 1)
    if (day % 7 === 3) values.glucose = round(88 + noise(6) + (day > 88 ? 9 : 0))

    // ── Symptoms ──────────────────────────────────────────────────────────
    const symptoms: SymptomKey[] = []
    if (day <= 3 && chance(0.8)) symptoms.push('nausea')
    if (day <= 10 && chance(0.6)) symptoms.push('congestion')
    if (day >= 2 && day <= 8 && chance(0.5)) symptoms.push('backPain')
    if ((co2Event && co2Event >= 3.8) || chance(debt > 5 ? 0.5 : 0.03)) symptoms.push('headache')
    if (debt > 4.5 && chance(0.5)) symptoms.push('fatigue')
    if (k >= 0.7 && day >= 45 && day <= 48) symptoms.push('coldSore')
    if (immune) symptoms.push('rash')
    if (p.lateSymptom && day >= days - 4) symptoms.push(p.lateSymptom)

    // ── Realistic gaps: skipped manual entries and an occasional uncharged sensor
    if (!recent) {
      if (chance(0.05)) {
        delete values.bpSys
        delete values.bpDia
      }
      if (chance(0.05)) delete values.temp
      if (chance(0.02)) {
        delete values.sleep
        delete values.restingHR
        delete values.hrv
        delete values.spo2
      }
    }
    const skippedJournal = !recent && chance(0.04)
    if (skippedJournal) {
      delete values.mood
      delete values.energy
      delete values.stress
      delete values.exercise
    }

    out.push({
      day,
      date: addDays(startDate, day - 1),
      values,
      journal: skippedJournal ? {} : journal,
      symptoms: skippedJournal ? [] : symptoms,
    })
    prev = journal // the body reacts to what happened even when it was not logged
  }
  return out
}

const MISSION_NAME: Record<MissionEnvironment['id'], string> = {
  leo: 'Station expedition',
  lunar: 'Lunar surface stay',
  marsTransit: 'Mars transit',
  marsSurface: 'Mars surface stay',
}

/** Planned length of each mission phase, in days. */
const PLANNED_DAYS: Record<MissionEnvironment['id'], number> = { leo: 180, lunar: 180, marsTransit: 210, marsSurface: 500 }

export interface MissionOptions {
  seed?: number
  days?: number
  /** Where the crew is. Changes the radiation background, the event dose and the communication delay. */
  envId?: MissionEnvironment['id']
}

export function generateMission(options: MissionOptions = {}): MissionData {
  const { seed = 2026, days = MISSION_DAYS, envId = 'marsTransit' } = options
  const env = ENVIRONMENT_BY_ID[envId]
  const startDate = '2039-07-18'
  const records: Record<string, DailyRecord[]> = {}
  PROFILES.forEach((p, i) => {
    records[p.id] = generateFor(p, seed + i * 7919, days, startDate, env)
  })
  return {
    name: MISSION_NAME[envId],
    env,
    startDate,
    days,
    plannedDays: Math.max(days, PLANNED_DAYS[envId]),
    crew: PROFILES.map(({ id, name, role }) => ({ id, name, role })),
    records,
  }
}
