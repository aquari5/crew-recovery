// One call that produces everything a screen needs for one crew member on one day.

import { REGIONS, SYMPTOM_BY_KEY } from './catalog'
import { findFindings } from './escalation'
import { evaluateAll, upTo, worst } from './evaluate'
import { CAREER_DOSE_LIMIT_MSV, INDICATOR_BY_ID } from './indicators'
import { findInsights } from './insights'
import { computeReadiness } from './readiness'
import { finite } from './stats'
import { dueToday, streak, tasksFor, totalPoints } from './tasks'
import type {
  Assessment,
  BodyRegionId,
  DailyRecord,
  EscalationLevel,
  Finding,
  IndicatorResult,
  MissionEnvironment,
  Readiness,
  Status,
} from './types'

const LEVEL_STATUS: Record<EscalationLevel, Status> = { 1: 'watch', 2: 'alert', 3: 'alert' }

function regionStatuses(
  indicators: IndicatorResult[],
  findings: Finding[],
  today: DailyRecord | undefined,
): Record<BodyRegionId, Status> {
  const out = Object.fromEntries(REGIONS.map((r) => [r.id, 'nodata'])) as Record<BodyRegionId, Status>
  for (const i of indicators) {
    const region = INDICATOR_BY_ID[i.id].region
    out[region] = worst(out[region], i.status)
  }
  for (const f of findings) {
    for (const region of f.regions) out[region] = worst(out[region], LEVEL_STATUS[f.level])
  }
  // A logged symptom is a reason to look at that region even with normal numbers.
  for (const s of today?.symptoms ?? []) {
    const region = SYMPTOM_BY_KEY[s].region
    out[region] = worst(out[region], 'watch')
  }
  // Eyes have no numeric indicator: with no symptom and no finding they are fine, not unknown.
  if (out.eyes === 'nodata' && today) out.eyes = 'ok'
  return out
}

/** The single status of a day. The hero, the orb and the timeline all show this value. */
function overallStatus(indicators: IndicatorResult[], findings: Finding[], readiness: Readiness): Status {
  return worst(
    ...indicators.map((i) => i.status),
    ...findings.map((f) => LEVEL_STATUS[f.level]),
    // Readiness is a summary score: on its own it can ask for attention, not raise an alarm.
    readiness.status === 'alert' ? 'watch' : readiness.status,
  )
}

/**
 * Full assessment of one crew member on mission day `day`.
 * `records` must be sorted by day; later days are ignored.
 */
export function assess(records: DailyRecord[], day: number, env: MissionEnvironment): Assessment {
  const hist = upTo(records, day)
  const today = hist.find((r) => r.day === day)
  const indicators = evaluateAll(hist, day)
  const findings = findFindings(hist, day, env)
  const readiness = computeReadiness(hist, day)
  const cumulative = finite(hist.map((r) => r.values.radiation)).reduce((a, b) => a + b, 0)

  const overall = overallStatus(indicators, findings, readiness)

  return {
    day,
    date: today?.date ?? '',
    overall,
    readiness,
    indicators,
    findings,
    regions: regionStatuses(indicators, findings, today),
    insights: findInsights(hist, day),
    tasks: tasksFor(hist, day),
    streak: streak(hist, day),
    points: totalPoints(hist, day),
    radiation: {
      cumulativeMsv: Math.round(cumulative * 10) / 10,
      careerLimitMsv: CAREER_DOSE_LIMIT_MSV,
      fractionOfLimit: cumulative / CAREER_DOSE_LIMIT_MSV,
    },
    due: dueToday(hist, day),
  }
}

/** Highest escalation level among findings, or 0 when there are none. */
export function topLevel(findings: Finding[]): 0 | EscalationLevel {
  return findings.reduce<0 | EscalationLevel>((m, f) => (f.level > m ? f.level : m), 0)
}

export interface TimelineDay {
  day: number
  status: Status
  /** Highest escalation level that day, 0 when there is nothing to act on. */
  level: 0 | EscalationLevel
}

/**
 * Status of every mission day, for the timeline strip. Cheaper than calling
 * `assess` per day: it skips insights, tasks and points. The status is the same
 * value as `assess(...).overall` for that day.
 */
export function missionTimeline(records: DailyRecord[], env: MissionEnvironment): TimelineDay[] {
  return records.map((r) => {
    const hist = upTo(records, r.day)
    const findings = findFindings(hist, r.day, env)
    const status = overallStatus(evaluateAll(hist, r.day), findings, computeReadiness(hist, r.day))
    return { day: r.day, status, level: topLevel(findings) }
  })
}
