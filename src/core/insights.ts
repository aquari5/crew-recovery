// Correlation engine: which logged behaviours go together with better or worse
// recovery FOR THIS ASTRONAUT.
//
// No medical knowledge is hard-coded here. The engine scans every
// (behaviour x metric) pair and reports what the data shows.
//
// Guard rails against conclusions from noise:
//   - at least MIN_GROUP days with the behaviour and MIN_GROUP without
//   - the effect must be at least moderate (Cohen's d >= 0.5), so that it is
//     worth acting on
//   - the difference must be statistically credible (Welch's t-test), and
//     because about 70 pairs are tested at once the p-values go through the
//     Benjamini-Hochberg procedure, which keeps the expected share of false
//     discoveries among the reported insights below FDR_Q
//   - behaviours come in bundles (a shifted schedule brings late caffeine and
//     sleep aids with it), so each pair is re-checked in a multiple regression
//     with all behaviours at once; a pair whose effect disappears there was
//     riding on another behaviour and is dropped
// The effect of these rules is measured in validation.test.ts on data with
// known truth. These are correlations, not proof of cause.

import { JOURNAL } from './catalog'
import { INDICATOR_BY_ID } from './indicators'
import { cohensD, mean, ols, welchP } from './stats'
import type { DailyRecord, IndicatorId, Insight, JournalKey } from './types'

export const MIN_GROUP = 5
export const MIN_GROUP_SOLID = 10
/** Accepted share of false discoveries among everything that is reported. */
export const FDR_Q = 0.1
/** A pair must stay credible at this level once the other behaviours are accounted for. */
export const ADJUSTED_P = 0.05

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
  // Every pair that could be tested is returned, so the caller can correct for
  // the number of tests; weak effects are dropped after that.
  const strength = abs >= 0.8 ? 'strong' : 'moderate'

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
    p: welchP(withB, withoutB),
    adjusted: null,
    strength,
    good: bad === 'high' ? diff < 0 : diff > 0,
    solid,
  }
}

/**
 * Effect of every behaviour on one metric with all the others held constant:
 * a multiple regression of the metric on all behaviours that vary in the data.
 */
function adjustedEffects(byDay: Map<number, DailyRecord>, records: DailyRecord[], metric: IndicatorId, lag: number) {
  const rows = records
    .map((r) => ({ r, v: byDay.get(r.day + lag)?.values[metric] }))
    .filter((x): x is { r: DailyRecord; v: number } => x.v != null && Number.isFinite(x.v) && JOURNAL.every((j) => x.r.journal[j.key] != null))
  const keys = JOURNAL.map((j) => j.key).filter((k) => {
    const yes = rows.filter((x) => x.r.journal[k]).length
    return yes >= MIN_GROUP && rows.length - yes >= MIN_GROUP
  })
  const fit = ols(
    rows.map((x) => keys.map((k) => (x.r.journal[k] ? 1 : 0))),
    rows.map((x) => x.v),
  )
  return new Map(fit ? keys.map((k, i) => [k, fit[i]] as const) : [])
}

/** All findings worth showing, strongest effect first. */
export function findInsights(records: DailyRecord[], today: number): Insight[] {
  const hist = records.filter((r) => r.day <= today)
  const byDay = new Map(hist.map((r) => [r.day, r]))
  const tested: Insight[] = []
  for (const j of JOURNAL) {
    for (const m of INSIGHT_METRICS) {
      const res = analyzePair(byDay, hist, j.key, m.id, m.lag)
      if (res) tested.push(res)
    }
  }
  // Benjamini-Hochberg: with m tests, accept the k smallest p-values where k is
  // the largest rank with p(k) <= k/m * q.
  const byP = [...tested].sort((a, b) => a.p - b.p)
  let accepted = 0
  byP.forEach((t, i) => {
    if (t.p <= ((i + 1) / byP.length) * FDR_Q) accepted = i + 1
  })
  const adjusted = new Map(INSIGHT_METRICS.map((m) => [m.id, adjustedEffects(byDay, hist, m.id, m.lag)]))
  return byP
    .slice(0, accepted)
    .filter((t) => Math.abs(t.effect) >= 0.5)
    .map((t) => ({ ...t, adjusted: adjusted.get(t.metric)?.get(t.behavior)?.coef ?? null }))
    .filter((t) => {
      const adj = adjusted.get(t.metric)?.get(t.behavior)
      // No regression possible: keep the plain comparison.
      if (!adj) return true
      return Math.sign(adj.coef) === Math.sign(t.diff) && adj.p < ADJUSTED_P
    })
    .sort((a, b) => Math.abs(b.effect) - Math.abs(a.effect))
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
