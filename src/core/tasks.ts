// Daily check-in tasks, streak and points: the engagement layer.
// Everything is derived from the records, so there is no separate state to sync.

import { JOURNAL } from './catalog'
import { INDICATORS } from './indicators'
import type { DailyRecord, DailyTask, IndicatorId } from './types'

const has = (r: DailyRecord | undefined, id: IndicatorId) => r?.values[id] != null

function measuredWithin(records: DailyRecord[], id: IndicatorId, today: number, days: number): boolean {
  return records.some((r) => r.day <= today && r.day > today - days && r.values[id] != null)
}

/** Indicators whose measurement is due today (manual ones only). */
export function dueToday(records: DailyRecord[], today: number): IndicatorId[] {
  const rec = records.find((r) => r.day === today)
  return INDICATORS.filter((d) => {
    if (d.cadence === 'daily') return !has(rec, d.id)
    if (d.cadence === 'weekly') return !measuredWithin(records, d.id, today, 7)
    return false
  }).map((d) => d.id)
}

export function tasksFor(records: DailyRecord[], day: number): DailyTask[] {
  const rec = records.find((r) => r.day === day)
  const journalLogged = !!rec && JOURNAL.some((j) => rec.journal[j.key] != null)
  const tasks: DailyTask[] = [
    {
      id: 'checkin',
      label: 'Rate mood, energy and stress',
      done: has(rec, 'mood') && has(rec, 'energy') && has(rec, 'stress'),
      points: 10,
    },
    { id: 'journal', label: 'Fill in the daily journal', done: journalLogged, points: 10 },
    { id: 'bp', label: 'Measure blood pressure', done: has(rec, 'bpSys') && has(rec, 'bpDia'), points: 10 },
    { id: 'temp', label: 'Measure body temperature', done: has(rec, 'temp'), points: 10 },
    {
      id: 'exercise',
      label: 'Resistive exercise session',
      done: rec?.journal.resistiveExercise === true,
      points: 20,
    },
    { id: 'sleep', label: 'Sleep 7 hours or more', done: (rec?.values.sleep ?? 0) >= 7, points: 15 },
  ]
  // Weekly items appear only while they are due or were done today.
  for (const [id, label] of [
    ['glucose', 'Weekly fasting glucose'],
    ['bodyMass', 'Weekly body mass'],
  ] as const) {
    const doneToday = has(rec, id)
    if (doneToday || !measuredWithin(records, id, day - 1, 6)) {
      tasks.push({ id, label, done: doneToday, points: 15 })
    }
  }
  return tasks
}

const CORE = ['checkin', 'journal', 'bp', 'temp']

function coreDone(records: DailyRecord[], day: number): boolean {
  const t = tasksFor(records, day)
  return CORE.every((id) => t.find((x) => x.id === id)?.done)
}

/**
 * Consecutive days with the core check-in complete. An unfinished today does
 * not break the streak; it just is not counted yet.
 */
export function streak(records: DailyRecord[], today: number): number {
  let n = 0
  let day = coreDone(records, today) ? today : today - 1
  while (day >= 1 && coreDone(records, day)) {
    n++
    day--
  }
  return n
}

export function totalPoints(records: DailyRecord[], today: number): number {
  let sum = 0
  for (const r of records) {
    if (r.day > today) continue
    for (const t of tasksFor(records, r.day)) if (t.done) sum += t.points
  }
  return sum
}
