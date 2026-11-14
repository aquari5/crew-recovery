// Turns raw daily records into a status per indicator.
//
// Two independent checks are combined:
//   1. absolute clinical thresholds (indicators.ts) -> can produce `watch` or `alert`
//   2. deviation from the astronaut's OWN baseline  -> can produce `watch` only
// A single unusual day against the baseline is a prompt to look, not an alarm.
// Sustained deviations are escalated by the rules in escalation.ts.

import { INDICATOR_BY_ID, INDICATORS, type IndicatorDef } from './indicators'
import { finite, mean, median, scaledMad } from './stats'
import type { Baseline, DailyRecord, IndicatorId, IndicatorResult, Status, TrendDir } from './types'

/** Days of history that form the personal baseline. */
export const BASELINE_WINDOW = 28
/** Minimum data points before a baseline is trusted. */
export const BASELINE_MIN_POINTS = 7
/** |z| at which a value counts as clearly outside the personal normal range. */
export const Z_WATCH = 2

const LOOKBACK: Record<IndicatorDef['cadence'], number> = {
  wearable: 0,
  daily: 1,
  weekly: 7,
  ambient: 0,
}

const SEVERITY: Record<Status, number> = { nodata: 0, ok: 1, watch: 2, alert: 3 }

export function worst(...statuses: Status[]): Status {
  let out: Status = 'nodata'
  for (const s of statuses) if (SEVERITY[s] > SEVERITY[out]) out = s
  return out
}

/** Values of one indicator for the given records, `undefined` where not measured. */
export function series(records: DailyRecord[], id: IndicatorId): (number | undefined)[] {
  return records.map((r) => r.values[id])
}

/** Records up to and including `day`, assuming input sorted by day. */
export function upTo(records: DailyRecord[], day: number): DailyRecord[] {
  return records.filter((r) => r.day <= day)
}

export function bandStatus(value: number, def: IndicatorDef): { status: Status; reason: string | null } {
  const b = def.bands
  if (!b) return { status: 'ok', reason: null }
  const what = def.relativeToStart ? `${def.label} change` : def.label
  const fmt = (n: number) => (def.relativeToStart ? `${n}%` : `${n} ${def.unit}`)
  if (b.alertLow != null && value <= b.alertLow) return { status: 'alert', reason: `${what} is at or below ${fmt(b.alertLow)}.` }
  if (b.alertHigh != null && value >= b.alertHigh) return { status: 'alert', reason: `${what} is at or above ${fmt(b.alertHigh)}.` }
  if (b.watchLow != null && value < b.watchLow) return { status: 'watch', reason: `${what} is below ${fmt(b.watchLow)}.` }
  if (b.watchHigh != null && value >= b.watchHigh) return { status: 'watch', reason: `${what} is at or above ${fmt(b.watchHigh)}.` }
  return { status: 'ok', reason: null }
}

/** Personal baseline from the days BEFORE `beforeDay`. Null when there is too little data. */
export function personalBaseline(records: DailyRecord[], id: IndicatorId, beforeDay: number): Baseline | null {
  const def = INDICATOR_BY_ID[id]
  // Weekly measurements are too sparse for a 28-day window, so they use all prior history.
  const from = def.cadence === 'weekly' ? -Infinity : beforeDay - BASELINE_WINDOW
  const minPoints = def.cadence === 'weekly' ? 3 : BASELINE_MIN_POINTS
  const xs = finite(records.filter((r) => r.day < beforeDay && r.day >= from).map((r) => r.values[id]))
  if (xs.length < minPoints) return null
  const m = median(xs)
  const spread = scaledMad(xs)
  if (m == null || spread == null) return null
  return { median: m, spread: Math.max(spread, def.minSpread), n: xs.length }
}

/** Median of the first mission week: the reference for `relativeToStart` indicators. */
export function startReference(records: DailyRecord[], id: IndicatorId): number | null {
  return median(records.filter((r) => r.day <= 7).map((r) => r.values[id]))
}

function trendOf(records: DailyRecord[], id: IndicatorId, today: number): { dir: TrendDir; delta: number } {
  const def = INDICATOR_BY_ID[id]
  const span = def.cadence === 'weekly' ? 28 : 7
  const pick = (from: number, to: number) =>
    finite(records.filter((r) => r.day >= from && r.day <= to).map((r) => r.values[id]))
  const recent = pick(today - span + 1, today)
  const before = pick(today - 2 * span + 1, today - span)
  const minPts = def.cadence === 'weekly' ? 2 : 3
  if (recent.length < minPts || before.length < minPts) return { dir: 'none', delta: 0 }
  const delta = (mean(recent) ?? 0) - (mean(before) ?? 0)
  // "Flat" means measured and steady. It is a different state from "none".
  const dir: TrendDir = Math.abs(delta) < def.minSpread * 0.75 ? 'flat' : delta > 0 ? 'up' : 'down'
  return { dir, delta }
}

export function evaluateIndicator(records: DailyRecord[], id: IndicatorId, today: number): IndicatorResult {
  const def = INDICATOR_BY_ID[id]
  const hist = upTo(records, today)
  const trend = trendOf(hist, id, today)
  const empty: IndicatorResult = {
    id,
    value: null,
    valueDay: null,
    status: 'nodata',
    reasons: ['Not measured recently.'],
    baseline: null,
    z: null,
    trend,
  }

  let value: number | null = null
  let valueDay: number | null = null

  if (def.window) {
    const xs = finite(hist.filter((r) => r.day > today - def.window!).map((r) => r.values[id]))
    // A rolling mean from one or two logged days would be misleading.
    if (xs.length >= Math.ceil(def.window / 2)) {
      value = mean(xs)
      valueDay = today
    }
  } else {
    const lookback = LOOKBACK[def.cadence]
    for (let i = hist.length - 1; i >= 0; i--) {
      const r = hist[i]
      if (r.day < today - lookback) break
      const v = r.values[id]
      if (typeof v === 'number' && Number.isFinite(v)) {
        value = v
        valueDay = r.day
        break
      }
    }
  }
  if (value == null || valueDay == null) return empty

  const reasons: string[] = []
  let status: Status = 'ok'

  // 1. Absolute thresholds.
  if (def.relativeToStart) {
    const ref = startReference(hist, id)
    if (ref != null && ref > 0) {
      const pct = Math.round(((value / ref - 1) * 100) * 10) / 10
      const band = bandStatus(pct, def)
      status = worst(status, band.status)
      if (band.reason) reasons.push(`${band.reason} Now ${pct > 0 ? '+' : ''}${pct}% versus mission start.`)
    }
  } else {
    const band = bandStatus(value, def)
    status = worst(status, band.status)
    if (band.reason) reasons.push(band.reason)
  }

  // 2. Personal baseline (single-day values only).
  let baseline: Baseline | null = null
  let z: number | null = null
  if (!def.window && !def.relativeToStart) {
    baseline = personalBaseline(hist, id, valueDay)
    if (baseline) {
      z = (value - baseline.median) / baseline.spread
      const low = z <= -Z_WATCH && (def.badDirection === 'low' || def.badDirection === 'both')
      const high = z >= Z_WATCH && (def.badDirection === 'high' || def.badDirection === 'both')
      if (low || high) {
        status = worst(status, 'watch')
        reasons.push(
          `Clearly ${low ? 'below' : 'above'} your own normal (${baseline.median.toFixed(def.decimals)} ${def.unit} over the last ${baseline.n} readings).`,
        )
      }
    }
  }

  if (!reasons.length) {
    reasons.push(baseline ? 'Within the reference range and your own normal.' : 'Within the reference range.')
  }
  return { id, value, valueDay, status, reasons, baseline, z, trend }
}

export function evaluateAll(records: DailyRecord[], today: number): IndicatorResult[] {
  return INDICATORS.map((d) => evaluateIndicator(records, d.id, today))
}
