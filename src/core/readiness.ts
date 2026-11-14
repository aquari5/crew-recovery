// Daily readiness score (0-100): how recovered the astronaut is this morning.
//
// It is an explicit, explainable estimate, not a medical measure:
//   40% last night's sleep
//   25% HRV versus personal baseline
//   15% resting heart rate versus personal baseline
//   20% self-reported mood, energy and stress
// Sleep and at least one other part are required. With less, the score is null
// rather than a number invented from too little data.

import { personalBaseline, upTo } from './evaluate'
import { clamp, mean } from './stats'
import type { DailyRecord, Readiness, Status } from './types'

export const READINESS_OK = 67
export const READINESS_WATCH = 34

export function readinessStatus(score: number | null): Status {
  if (score == null) return 'nodata'
  return score >= READINESS_OK ? 'ok' : score >= READINESS_WATCH ? 'watch' : 'alert'
}

export function computeReadiness(records: DailyRecord[], today: number): Readiness {
  const hist = upTo(records, today)
  const rec = hist.find((r) => r.day === today)
  const none: Readiness = { score: null, status: 'nodata', parts: [] }
  const sleep = rec?.values.sleep
  if (!rec || sleep == null) return none

  const parts: Readiness['parts'] = [
    // 8 h -> 100, 6 h -> 50, 4 h -> 0
    { key: 'sleep', score: clamp(((sleep - 4) / 4) * 100), weight: 0.4 },
  ]

  const hrvBase = personalBaseline(hist, 'hrv', today)
  if (rec.values.hrv != null && hrvBase) {
    const z = (rec.values.hrv - hrvBase.median) / hrvBase.spread
    parts.push({ key: 'hrv', score: clamp(50 + 25 * z), weight: 0.25 })
  }

  const hrBase = personalBaseline(hist, 'restingHR', today)
  if (rec.values.restingHR != null && hrBase) {
    const z = (rec.values.restingHR - hrBase.median) / hrBase.spread
    parts.push({ key: 'restingHR', score: clamp(50 - 25 * z), weight: 0.15 })
  }

  const { mood, energy, stress } = rec.values
  const subjective = mean([
    mood != null ? ((mood - 1) / 4) * 100 : null,
    energy != null ? ((energy - 1) / 4) * 100 : null,
    stress != null ? ((5 - stress) / 4) * 100 : null,
  ])
  if (subjective != null) parts.push({ key: 'subjective', score: subjective, weight: 0.2 })

  if (parts.length < 2) return none
  const total = parts.reduce((s, p) => s + p.weight, 0)
  const score = Math.round(parts.reduce((s, p) => s + p.score * p.weight, 0) / total)
  return { score, status: readinessStatus(score), parts }
}
