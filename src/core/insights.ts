// Correlation engine: which logged behaviours go together with better or worse
// recovery FOR THIS ASTRONAUT.
//
// No medical knowledge is hard-coded here. The engine scans every
// (behaviour x metric) pair and reports what the data shows.
//
// Guard rails against conclusions from noise:
//   - at least MIN_GROUP days with the behaviour and MIN_GROUP without
//   - effect size (Cohen's d), not just a difference of means
//   - weak effects (d < 0.5) are never shown, because many pairs are tested at
//     once and chance alone regularly produces weak "effects"
// These are correlations, not proof of cause.

import { JOURNAL } from './catalog'
import { INDICATOR_BY_ID } from './indicators'
import { cohensD, mean } from './stats'
import type { DailyRecord, IndicatorId, Insight, JournalKey } from './types'

export const MIN_GROUP = 5
export const MIN_GROUP_SOLID = 10

/**
 * Outcome metrics and their lag in days. Night metrics belong to the night
 * AFTER the logged day (lag 1); self-ratings are compared on the same day.
 */
export const INSIGHT_METRICS: { id: IndicatorId; lag: 0 | 1 }[] = [
  { id: 'sleep', lag: 1 },
  { id: 'hrv', lag: 1 },
  { id: 'restingHR', lag: 1 },
  { id: 'mood', lag: 0 },
  { id: 'energy', lag: 0 },
  { id: 'stress', lag: 0 },
]

function analyzePair(
  byDay: Map<number, DailyRecord>,
  records: DailyRecord[],
  behavior: JournalKey,
  metric: IndicatorId,
  lag: number,
): Insight | null {
  const withB: number[] = []
  const withoutB: number[] = []
  for (const r of records) {
    const logged = r.journal[behavior]
    if (logged == null) continue // not logged is not "no"
    const v = byDay.get(r.day + lag)?.values[metric]
    if (v == null || !Number.isFinite(v)) continue
    ;(logged ? withB : withoutB).push(v)
  }
  if (withB.length < MIN_GROUP || withoutB.length < MIN_GROUP) return null

  const meanWith = mean(withB)!
  const meanWithout = mean(withoutB)!
  const diff = meanWith - meanWithout
  const effect = cohensD(withB, withoutB)
  const abs = Math.abs(effect)
  const solid = withB.length >= MIN_GROUP_SOLID && withoutB.length >= MIN_GROUP_SOLID
  // Dozens of pairs are tested at once, so chance alone regularly produces weak
  // "effects" (checked on the demo data: weak pairs included obvious nonsense).
  // Only moderate and strong effects are reported.
  const strength = abs >= 0.8 ? 'strong' : abs >= 0.5 ? 'moderate' : null
  if (!strength) return null

  const bad = INDICATOR_BY_ID[metric].badDirection
  return {
    behavior,
    metric,
    diff,
    meanWith,
    meanWithout,
    nWith: withB.length,
    nWithout: withoutB.length,
    effect,
    strength,
    good: bad === 'high' ? diff < 0 : diff > 0,
    solid,
  }
}

/** All findings worth showing, strongest effect first. */
export function findInsights(records: DailyRecord[], today: number): Insight[] {
  const hist = records.filter((r) => r.day <= today)
  const byDay = new Map(hist.map((r) => [r.day, r]))
  const out: Insight[] = []
  for (const j of JOURNAL) {
    for (const m of INSIGHT_METRICS) {
      const res = analyzePair(byDay, hist, j.key, m.id, m.lag)
      if (res) out.push(res)
    }
  }
  return out.sort((a, b) => Math.abs(b.effect) - Math.abs(a.effect))
}

/** One-sentence, plain-language version of an insight. */
export function describeInsight(i: Insight): string {
  const def = INDICATOR_BY_ID[i.metric]
  const j = JOURNAL.find((x) => x.key === i.behavior)!
  const amount = `${Math.abs(i.diff).toFixed(Math.max(1, def.decimals))} ${def.unit}`
  const dir = i.diff > 0 ? 'higher' : 'lower'
  const when = INSIGHT_METRICS.find((m) => m.id === i.metric)?.lag ? 'the following night' : 'the same day'
  return `On days with "${j.label}", your ${def.label.toLowerCase()} is ${amount} ${dir} ${when} (${i.nWith} days with, ${i.nWithout} without).`
}
