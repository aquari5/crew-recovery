// Validation of the correlation engine against data where the truth is known.
//
// The demo mission cannot validate the engine: it was written to tell a story.
// Here every dataset is generated with effects we choose, so we can count how
// often the engine finds an effect that exists and how often it "finds" one
// that does not. Results are documented in docs/VALIDATION.md.

import { describe, expect, it } from 'vitest'
import { JOURNAL } from './catalog'
import { INSIGHT_METRICS, findInsights } from './insights'
import { mulberry32 } from './stats'
import type { DailyRecord, IndicatorId, JournalKey } from './types'

const DAYS = 120
/** How often each behaviour is logged "yes": from rare to common, like a real journal. */
const RATES = [0.06, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5, 0.6, 0.7, 0.85]
const BASE: Partial<Record<IndicatorId, number>> = { sleep: 7, hrv: 60, restingHR: 55, mood: 3.5, energy: 3.5, stress: 2.5 }
const SD: Partial<Record<IndicatorId, number>> = { sleep: 0.6, hrv: 6, restingHR: 3, mood: 0.7, energy: 0.7, stress: 0.7 }

interface Planted {
  behavior: JournalKey
  metric: IndicatorId
  /** Effect in standard deviations of the metric's day-to-day noise. */
  d: number
}

function gaussian(rnd: () => number) {
  return Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd())
}

/**
 * One astronaut. Behaviours are independent coin flips. Each metric is noise
 * that drifts from day to day (autocorrelation `rho`, as real physiology does)
 * plus the planted effects and nothing else.
 */
function synth(seed: number, planted: Planted[], rho = 0.5): DailyRecord[] {
  const rnd = mulberry32(seed)
  const journals = Array.from({ length: DAYS + 1 }, () => Object.fromEntries(JOURNAL.map((j, i) => [j.key, rnd() < RATES[i]])) as Record<JournalKey, boolean>)
  const state: Record<string, number> = {}
  const out: DailyRecord[] = []
  for (let day = 1; day <= DAYS; day++) {
    const values: DailyRecord['values'] = {}
    for (const m of INSIGHT_METRICS) {
      // AR(1) noise with unit variance.
      state[m.id] = rho * (state[m.id] ?? 0) + Math.sqrt(1 - rho ** 2) * gaussian(rnd)
      const cause = journals[day - m.lag] // lag 1: last night's sleep reacts to yesterday
      const shift = planted.filter((p) => p.metric === m.id && cause[p.behavior]).reduce((s, p) => s + p.d, 0)
      const raw = BASE[m.id]! + SD[m.id]! * (state[m.id] + shift)
      values[m.id] = m.lag === 0 ? Math.min(5, Math.max(1, Math.round(raw))) : Math.round(raw * 10) / 10
    }
    out.push({ day, date: '2040-01-01', values, journal: journals[day], symptoms: [] })
  }
  return out
}

const RUNS = 400

function falseAlarms(rho: number) {
  let total = 0
  let astronautsWithAny = 0
  for (let s = 0; s < RUNS; s++) {
    const n = findInsights(synth(1000 + s, [], rho), DAYS).length
    total += n
    if (n) astronautsWithAny++
  }
  return { perAstronaut: total / RUNS, shareWithAny: astronautsWithAny / RUNS }
}

function power(d: number, behavior: JournalKey) {
  let found = 0
  let wrongSign = 0
  for (let s = 0; s < RUNS; s++) {
    const hit = findInsights(synth(5000 + s, [{ behavior, metric: 'sleep', d: -d }]), DAYS).find((i) => i.behavior === behavior && i.metric === 'sleep')
    if (hit) (hit.diff < 0 ? found++ : wrongSign++)
  }
  return { found: found / RUNS, wrongSign: wrongSign / RUNS }
}

/** Share of astronauts for whom a passenger behaviour is blamed for another behaviour's effect. */
function blamedPassenger() {
  let blamed = 0
  let driverFound = 0
  for (let s = 0; s < RUNS; s++) {
    const recs = synth(9000 + s, [{ behavior: 'caffeineLate', metric: 'sleep', d: -1.2 }])
    // "Screen late" has no effect of its own but happens on 80% of the caffeine days.
    const rnd = mulberry32(77 + s)
    for (const r of recs) r.journal.screenLate = r.journal.caffeineLate ? rnd() < 0.8 : rnd() < 0.1
    const found = findInsights(recs, DAYS).filter((i) => i.metric === 'sleep')
    if (found.some((i) => i.behavior === 'screenLate')) blamed++
    if (found.some((i) => i.behavior === 'caffeineLate')) driverFound++
  }
  return { blamed: blamed / RUNS, driverFound: driverFound / RUNS }
}

describe('correlation engine on data with known truth', () => {
  it('does not blame a behaviour that only travels with the real cause', () => {
    const r = blamedPassenger()
    console.log(`passenger behaviour blamed: ${(r.blamed * 100).toFixed(0)}% of astronauts; real cause still found: ${(r.driverFound * 100).toFixed(0)}%`)
    // Without the regression check the passenger was blamed for 47% of astronauts.
    expect(r.blamed).toBeLessThan(0.1)
    expect(r.driverFound).toBeGreaterThan(0.6)
  })

  it('rarely invents an effect when there is none', () => {
    for (const rho of [0, 0.5]) {
      const f = falseAlarms(rho)
      console.log(`no real effects, autocorrelation ${rho}: ${f.perAstronaut.toFixed(2)} false insights per astronaut; ${(f.shareWithAny * 100).toFixed(0)}% of astronauts see at least one`)
      // Without the multiple-testing correction this was 3.1 per astronaut.
      expect(f.perAstronaut).toBeLessThan(0.3)
    }
  })

  it('finds a strong effect, misses weak ones, and never reverses the direction', () => {
    const found: Record<string, number> = {}
    for (const d of [0.3, 0.5, 0.8, 1.2]) {
      const p = power(d, 'caffeineLate')
      found[d] = p.found
      console.log(`real effect d=${d} on a behaviour logged on 20% of days: found ${(p.found * 100).toFixed(0)}%, wrong direction ${(p.wrongSign * 100).toFixed(1)}%`)
      expect(p.wrongSign).toBeLessThan(0.01)
    }
    expect(found[1.2]).toBeGreaterThan(0.85)
    expect(found[0.8]).toBeGreaterThan(0.4)
    // A weak effect is below what 120 days can show; the engine stays silent rather than guess.
    expect(found[0.3]).toBeLessThan(0.1)
  })

  it('needs more days for a rare behaviour', () => {
    const p = power(1.2, 'scheduleShift') // logged on 6% of days
    console.log(`real effect d=1.2 on a behaviour logged on 6% of days: found ${(p.found * 100).toFixed(0)}%`)
    expect(p.wrongSign).toBeLessThan(0.01)
  })
})
