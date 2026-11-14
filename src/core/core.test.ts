import { describe, expect, it } from 'vitest'
import {
  ENVIRONMENT_BY_ID,
  applyPatch,
  assess,
  computeReadiness,
  evaluateIndicator,
  findFindings,
  findInsights,
  generateMission,
  streak,
  tasksFor,
  topLevel,
  type DailyRecord,
  type IndicatorId,
  type JournalKey,
} from './index'
import { cohensD, median, scaledMad } from './stats'

const env = ENVIRONMENT_BY_ID.marsTransit

/** Builds `n` consecutive days; `fill` returns the values/journal for each day. */
function days(
  n: number,
  fill: (day: number) => {
    values?: Partial<Record<IndicatorId, number>>
    journal?: Partial<Record<JournalKey, boolean>>
    symptoms?: DailyRecord['symptoms']
  },
): DailyRecord[] {
  return Array.from({ length: n }, (_, i) => {
    const day = i + 1
    const f = fill(day)
    return {
      day,
      date: `2039-01-${String(day).padStart(2, '0')}`,
      values: f.values ?? {},
      journal: f.journal ?? {},
      symptoms: f.symptoms ?? [],
    }
  })
}

describe('stats', () => {
  it('returns null instead of NaN for empty input', () => {
    expect(median([])).toBeNull()
    expect(scaledMad([null, undefined])).toBeNull()
  })
  it("treats a perfectly repeatable difference as a maximal effect, not zero", () => {
    expect(cohensD([5, 5, 5], [3, 3, 3])).toBe(Infinity)
    expect(cohensD([4, 4], [4, 4])).toBe(0)
  })
})

describe('evaluateIndicator', () => {
  it('reports nodata, not ok, when nothing was measured', () => {
    const recs = days(10, () => ({}))
    const r = evaluateIndicator(recs, 'temp', 10)
    expect(r.status).toBe('nodata')
    expect(r.value).toBeNull()
    expect(r.trend.dir).toBe('none')
  })

  it('applies absolute clinical thresholds', () => {
    const at = (temp: number) => evaluateIndicator(days(1, () => ({ values: { temp } })), 'temp', 1).status
    expect(at(36.6)).toBe('ok')
    expect(at(37.6)).toBe('watch')
    expect(at(38.0)).toBe('alert')
    expect(at(34.9)).toBe('alert')
  })

  it('flags a value far from the personal baseline even inside the clinical range', () => {
    // 70 bpm is clinically normal, but far above this person's steady 50.
    const recs = days(20, (d) => ({ values: { restingHR: d === 20 ? 70 : 50 + (d % 2) } }))
    const r = evaluateIndicator(recs, 'restingHR', 20)
    expect(r.status).toBe('watch')
    expect(r.z).toBeGreaterThan(2)
    expect(r.baseline?.n).toBe(19)
  })

  it('does not use a baseline built from too few days', () => {
    const recs = days(4, (d) => ({ values: { restingHR: d === 4 ? 70 : 50 } }))
    const r = evaluateIndicator(recs, 'restingHR', 4)
    expect(r.baseline).toBeNull()
    expect(r.status).toBe('ok')
  })

  it('keeps a weekly reading valid for 7 days, then drops to nodata', () => {
    const recs = days(12, (d) => ({ values: d === 3 ? { glucose: 90 } : {} }))
    expect(evaluateIndicator(recs, 'glucose', 9).value).toBe(90)
    expect(evaluateIndicator(recs, 'glucose', 11).status).toBe('nodata')
  })

  it('judges body mass as percent change from mission start', () => {
    const recs = days(40, (d) => ({ values: d <= 7 ? { bodyMass: 70 } : d === 40 ? { bodyMass: 66 } : {} }))
    const r = evaluateIndicator(recs, 'bodyMass', 40)
    expect(r.status).toBe('watch') // -5.7%
    expect(r.reasons[0]).toContain('-5.7%')
  })

  it('distinguishes a flat trend from no trend data', () => {
    const steady = days(14, () => ({ values: { hrv: 60 } }))
    expect(evaluateIndicator(steady, 'hrv', 14).trend.dir).toBe('flat')
    const sparse = days(14, (d) => ({ values: d === 14 ? { hrv: 60 } : {} }))
    expect(evaluateIndicator(sparse, 'hrv', 14).trend.dir).toBe('none')
  })
})

describe('computeReadiness', () => {
  it('is null without sleep data rather than a guessed number', () => {
    const recs = days(10, () => ({ values: { hrv: 60, restingHR: 50, mood: 4 } }))
    expect(computeReadiness(recs, 10).score).toBeNull()
  })
  it('scores a good night higher than a short one', () => {
    const mk = (sleep: number) =>
      days(10, (d) => ({ values: { sleep: d === 10 ? sleep : 7.5, hrv: 60, restingHR: 50, mood: 4, energy: 4, stress: 2 } }))
    const good = computeReadiness(mk(8), 10).score!
    const bad = computeReadiness(mk(4.5), 10).score!
    expect(good).toBeGreaterThan(bad + 25)
    expect(computeReadiness(mk(4.5), 10).parts.map((p) => p.key)).toContain('sleep')
  })
})

describe('findInsights', () => {
  it('finds an effect that is really in the data', () => {
    // Late caffeine on even days cuts the following night by 1.5 h.
    const recs = days(40, (d) => ({
      values: { sleep: (d - 1) % 2 === 0 && d > 1 ? 5.5 + (d % 3) * 0.1 : 7 + (d % 3) * 0.1 },
      journal: { caffeineLate: d % 2 === 0 },
    }))
    const found = findInsights(recs, 40).find((i) => i.behavior === 'caffeineLate' && i.metric === 'sleep')
    expect(found).toBeDefined()
    expect(found!.diff).toBeLessThan(-1)
    expect(found!.good).toBe(false)
    expect(found!.strength).toBe('strong')
  })

  it('stays silent with fewer than 5 days in a group', () => {
    const recs = days(20, (d) => ({
      values: { sleep: d <= 4 ? 5 : 7.5 },
      journal: { caffeineLate: d <= 3 },
    }))
    expect(findInsights(recs, 20)).toHaveLength(0)
  })

  it('treats "not logged" as missing, not as "no"', () => {
    const recs = days(30, (d) => ({ values: { sleep: 7 }, journal: d <= 6 ? { caffeineLate: true } : {} }))
    expect(findInsights(recs, 30)).toHaveLength(0)
  })
})

describe('findFindings', () => {
  it('escalates three short nights', () => {
    const recs = days(10, (d) => ({ values: { sleep: d >= 8 ? 5 : 7.5 } }))
    const f = findFindings(recs, 10, env).find((x) => x.id === 'sleep-debt')
    expect(f?.level).toBe(2)
  })

  it('sends severely high blood pressure to the ground and adds the delay note', () => {
    const recs = days(1, () => ({ values: { bpSys: 185, bpDia: 100 } }))
    const f = findFindings(recs, 1, env)[0]
    expect(f.id).toBe('bp-crisis')
    expect(f.level).toBe(3)
    expect(f.actions.at(-1)).toContain('20 min')
    // Near Earth there is no meaningful delay, so no note.
    const leo = findFindings(recs, 1, ENVIRONMENT_BY_ID.leo)[0]
    expect(leo.actions.at(-1)).not.toContain('round trip')
  })

  it('grades cabin CO2 against the 2.5 and 3 mmHg limits', () => {
    const at = (co2: number) => findFindings(days(1, () => ({ values: { co2 } })), 1, env).find((f) => f.id === 'co2-high')
    expect(at(2.2)).toBeUndefined()
    expect(at(2.7)?.level).toBe(1)
    expect(at(3.2)?.level).toBe(2)
  })

  it('raises red-flag symptoms without any abnormal number', () => {
    const recs = days(3, (d) => ({ symptoms: d === 3 ? ['visionChange'] : [] }))
    expect(findFindings(recs, 3, env).map((f) => f.id)).toContain('vision-change')
  })

  it('returns nothing for a healthy, complete day', () => {
    const recs = days(14, () => ({
      values: { sleep: 7.5, hrv: 60, restingHR: 52, bpSys: 115, bpDia: 72, temp: 36.6, spo2: 97, mood: 4, energy: 4, stress: 2, exercise: 110, radiation: 1.8, co2: 2.2 },
      journal: { resistiveExercise: true, familyContact: true },
    }))
    expect(findFindings(recs, 14, env)).toHaveLength(0)
    expect(assess(recs, 14, env).overall).toBe('ok')
  })
})

describe('tasks and streak', () => {
  const full = { values: { mood: 4, energy: 4, stress: 2, bpSys: 115, bpDia: 72, temp: 36.6 }, journal: { familyContact: false } }
  it('counts consecutive complete check-ins and tolerates an unfinished today', () => {
    const recs = days(6, (d) => (d === 2 || d === 6 ? {} : full))
    expect(streak(recs, 5)).toBe(3)
    expect(streak(recs, 6)).toBe(3) // today not done yet: streak still alive
  })
  it('lists weekly measurements only when due', () => {
    const recs = days(10, (d) => ({ values: d === 8 ? { glucose: 90 } : {} }))
    expect(tasksFor(recs, 10).map((t) => t.id)).not.toContain('glucose')
    expect(tasksFor(recs, 10).map((t) => t.id)).toContain('bodyMass')
  })
})

describe('storage patches', () => {
  it('merges values per key and clears a reading with null', () => {
    const rec = days(1, () => ({ values: { temp: 36.6, mood: 4 }, journal: { evaDay: false } }))[0]
    const out = applyPatch(rec, {
      values: { temp: 37.9, mood: null },
      journal: { caffeineLate: true },
    })
    expect(out.values).toEqual({ temp: 37.9 })
    expect(out.journal).toEqual({ evaDay: false, caffeineLate: true })
  })
})

describe('demo mission', () => {
  const m = generateMission()
  const me = m.records.fe1

  it('is deterministic', () => {
    expect(generateMission().records.fe1).toEqual(me)
    expect(me).toHaveLength(120)
  })

  it('never stores non-finite values', () => {
    for (const recs of Object.values(m.records)) {
      for (const r of recs) for (const v of Object.values(r.values)) expect(Number.isFinite(v)).toBe(true)
    }
  })

  it('tells the scripted story on the key days', () => {
    const ids = (day: number) => assess(me, day, m.env).findings.map((f) => f.id)
    expect(assess(me, 30, m.env).overall).toBe('ok')
    expect(ids(44)).toContain('sleep-debt')
    expect(ids(47)).toContain('fever')
    expect(ids(64)).toContain('co2-high')
    expect(topLevel(assess(me, 78, m.env).findings)).toBe(3)
    expect(ids(92)).toContain('exercise-low')
    expect(ids(120)).toContain('mood-low')
  })

  it('adapts radiation and the communication delay to the environment', () => {
    const dose = (envId: 'leo' | 'marsTransit') => {
      const mm = generateMission({ envId })
      return { a: assess(mm.records.fe1, 78, mm.env), env: mm.env }
    }
    const mars = dose('marsTransit')
    const leo = dose('leo')
    expect(mars.a.radiation.cumulativeMsv).toBeGreaterThan(leo.a.radiation.cumulativeMsv * 2)
    expect(topLevel(mars.a.findings)).toBe(3)
    // Inside Earth's magnetic field the same solar event is a smaller dose and no shelter order.
    expect(leo.a.findings.find((f) => f.id === 'radiation-event')?.level ?? 0).toBeLessThan(3)
    expect(leo.env.commDelaySec).toBeLessThan(1)
  })

  it('lets the correlation engine recover the built-in effects', () => {
    const pairs = assess(me, 120, m.env).insights.map((i) => `${i.behavior}>${i.metric}:${i.good}`)
    expect(pairs).toContain('caffeineLate>sleep:false')
    expect(pairs).toContain('familyContact>mood:true')
    expect(pairs).toContain('privateTime>stress:true')
  })
})
