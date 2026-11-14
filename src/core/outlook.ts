// Mission outlook: where the current trends lead if nothing changes.
//
// Today's status answers "am I OK now?". On a long mission the slow, cumulative
// risks matter more: radiation dose, bone loss, sleep debt and body mass all
// add up quietly. These are simple, explainable projections, not predictions
// of a medical outcome; every item states what it assumes.

import { startReference, upTo } from './evaluate'
import { CAREER_DOSE_LIMIT_MSV } from './indicators'
import { finite, mean } from './stats'
import type { DailyRecord, Status } from './types'

export interface OutlookItem {
  id: 'radiation' | 'bone' | 'sleepDebt' | 'bodyMass'
  title: string
  /** Headline figure, ready to show. */
  value: string
  /** What the figure means, with the numbers behind it. */
  detail: string
  status: Status
  /** The assumption or source the estimate rests on. */
  basis: string
}

/** NASA HRP: unloaded bone loses 1–1.5% of its density per month. */
const BONE_LOSS_PER_MONTH = { low: 1, high: 1.5 }

function radiation(hist: DailyRecord[], day: number, plannedDays: number): OutlookItem {
  const doses = finite(hist.map((r) => r.values.radiation))
  const soFar = doses.reduce((a, b) => a + b, 0)
  const recent = mean(hist.filter((r) => r.day > day - 30).map((r) => r.values.radiation))
  if (recent == null) {
    return { id: 'radiation', title: 'Radiation by mission end', value: '—', detail: 'No dosimeter readings yet.', status: 'nodata', basis: '' }
  }
  const projected = soFar + recent * Math.max(0, plannedDays - day)
  const fraction = projected / CAREER_DOSE_LIMIT_MSV
  return {
    id: 'radiation',
    title: 'Radiation by mission end',
    value: `${Math.round(projected)} mSv`,
    detail: `${Math.round(soFar)} mSv so far. At the recent ${recent.toFixed(1)} mSv/day you reach ${Math.round(projected)} mSv by day ${plannedDays}: ${Math.round(fraction * 100)}% of the ${CAREER_DOSE_LIMIT_MSV} mSv career limit.`,
    status: fraction >= 0.8 ? 'alert' : fraction >= 0.5 ? 'watch' : 'ok',
    basis: 'Linear projection of the last 30 days. Solar particle events are not predictable and would add to it. Limit: NASA-STD-3001.',
  }
}

function bone(hist: DailyRecord[]): OutlookItem {
  const logged = hist.filter((r) => r.journal.resistiveExercise != null)
  if (logged.length < 7) {
    return { id: 'bone', title: 'Bone loading', value: '—', detail: 'Log resistive exercise for a week to see this estimate.', status: 'nodata', basis: '' }
  }
  const unloaded = logged.filter((r) => r.journal.resistiveExercise === false).length
  const low = (unloaded / 30) * BONE_LOSS_PER_MONTH.low
  const high = (unloaded / 30) * BONE_LOSS_PER_MONTH.high
  return {
    id: 'bone',
    title: 'Bone density at risk',
    value: unloaded === 0 ? '0%' : `−${low.toFixed(1)} to −${high.toFixed(1)}%`,
    detail: `${unloaded} of ${logged.length} logged days had no resistive exercise. Unloaded bone loses 1–1.5% of its density per month, so those days alone put an estimated ${low.toFixed(1)}–${high.toFixed(1)}% at risk.`,
    status: high >= 3 ? 'alert' : high >= 1.5 ? 'watch' : 'ok',
    basis: 'Estimate. Assumes a resistive session fully protects bone that day; real loss varies by person and by bone. Rate: NASA Human Research Program.',
  }
}

function sleepDebt(hist: DailyRecord[], day: number): OutlookItem {
  const nights = finite(hist.filter((r) => r.day > day - 14).map((r) => r.values.sleep))
  if (nights.length < 5) {
    return { id: 'sleepDebt', title: 'Sleep debt, 14 nights', value: '—', detail: 'Not enough recorded nights.', status: 'nodata', basis: '' }
  }
  const debt = nights.reduce((sum, h) => sum + Math.max(0, 7 - h), 0)
  return {
    id: 'sleepDebt',
    title: 'Sleep debt, 14 nights',
    value: `${debt.toFixed(1)} h`,
    detail: `Hours short of 7 h a night across the last ${nights.length} recorded nights. Your average was ${mean(nights)!.toFixed(1)} h.`,
    status: debt >= 14 ? 'alert' : debt >= 7 ? 'watch' : 'ok',
    basis: 'Sum of nightly shortfall below 7 h (AASM/SRS recommendation for adults). Long nights do not cancel short ones.',
  }
}

function bodyMass(hist: DailyRecord[], plannedDays: number): OutlookItem {
  const points = hist.filter((r) => r.values.bodyMass != null).map((r) => ({ x: r.day, y: r.values.bodyMass! }))
  const ref = startReference(hist, 'bodyMass')
  const recent = points.slice(-6)
  if (recent.length < 3 || ref == null) {
    return { id: 'bodyMass', title: 'Body mass by mission end', value: '—', detail: 'Three weekly measurements are needed for a trend.', status: 'nodata', basis: '' }
  }
  // Least-squares slope through the last six weekly readings.
  const mx = mean(recent.map((p) => p.x))!
  const my = mean(recent.map((p) => p.y))!
  const slope = recent.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0) / recent.reduce((s, p) => s + (p.x - mx) ** 2, 0)
  const last = recent[recent.length - 1]
  const now = (last.y / ref - 1) * 100
  const projected = ((last.y + slope * Math.max(0, plannedDays - last.x)) / ref - 1) * 100
  const perWeek = slope * 7
  const sign = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(1)}`
  return {
    id: 'bodyMass',
    title: 'Body mass by mission end',
    value: `${sign(projected)}%`,
    detail: `Now ${sign(now)}% versus mission start. At the recent ${sign(perWeek)} kg/week you are at ${sign(projected)}% by day ${plannedDays}.`,
    status: projected <= -10 ? 'alert' : projected <= -5 ? 'watch' : 'ok',
    basis: 'Straight-line trend through the last six weekly measurements. −5% is significant unintentional loss; −10% needs medical review.',
  }
}

/** Projections for one crew member, as of `day`, for a mission planned to last `plannedDays`. */
export function missionOutlook(records: DailyRecord[], day: number, plannedDays: number): OutlookItem[] {
  const hist = upTo(records, day)
  return [radiation(hist, day, plannedDays), bone(hist), sleepDebt(hist, day), bodyMass(hist, plannedDays)]
}
