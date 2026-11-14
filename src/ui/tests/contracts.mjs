// Run with Node >=24. Uses native TypeScript support, no dependency installation.
// These contract tests complement (not replace) Vitest and browser interaction tests.
import { registerHooks } from 'node:module'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && context.parentURL) {
    const url = new URL(specifier, context.parentURL)
    for (const suffix of ['.ts', '/index.ts']) {
      if (existsSync(fileURLToPath(url) + suffix)) return nextResolve(url.href + suffix, context)
    }
  }
  return nextResolve(specifier, context)
} })
const core = await import('../../core/index.ts')
const { trendData, chartScale } = await import('../trends.ts')
const { initialMeasurements, validateMeasurements, averageReadings, measurementPatch } = await import('../log.ts')
const { crewAssessments } = await import('../crew.ts')
const storage = new Map()
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: key => storage.delete(key),
} })
let checks = 0
function check(name, fn) { fn(); checks++; console.log(`PASS ${name}`) }
const mission = core.generateMission()
const records = mission.records.fe1
check('U2 acceptance timeline', () => {
  assert.equal(core.assess(records, 30, mission.env).findings.length, 0)
  for (const [day, id] of [[44, 'sleep-debt'], [47, 'fever'], [78, 'radiation-event'], [120, 'mass-loss'], [120, 'mood-low']]) assert(core.assess(records, day, mission.env).findings.some(f => f.id === id))
})
check('U3 Sofia vision alert at day 120', () => {
  const a = core.assess(mission.records.ms1, 120, mission.env)
  assert.equal(a.regions.eyes, 'alert')
  assert(a.findings.some(f => f.level === 3 && f.regions.includes('eyes')))
  assert(mission.records.ms1.find(r => r.day === 120).symptoms.includes('visionChange'))
})
check('U4 range ends at selected day, with null gaps and no fabricated zero', () => {
  const data = trendData(records, 'sleep', 44, 14)
  assert.equal(data[0].day, 31); assert.equal(data.at(-1).day, 44); assert.equal(data.length, 14)
  const gaps = trendData([{ day: 1, date: '2039-01-01', values: { sleep: 0 }, journal: {}, symptoms: [] }], 'sleep', 3, 'all')
  assert.deepEqual(gaps.map(p => p.value), [0, null, null])
  assert.equal(trendData(records, 'sleep', 1, 30).length, 1)
})
check('U4 radiation spike and sleep dip are present', () => {
  const spike = trendData(records, 'radiation', 78, 30)
  assert(spike.at(-1).value > spike[0].value * 5)
  const dip = trendData(records, 'sleep', 46, 30).filter(p => p.day >= 38 && p.value !== null)
  assert(dip.some(p => p.value < 6))
})
check('U4 no kilogram threshold bands; all shaded zones ordered', () => {
  assert.equal(chartScale([60, 65], 'bodyMass').zones.length, 0)
  for (const indicator of core.INDICATORS) {
    const scale = chartScale(records.map(r => r.values[indicator.id] ?? null), indicator.id)
    assert(scale.domain[0] < scale.domain[1])
    for (const zone of scale.zones) assert(zone.from <= zone.to)
  }
})
check('U5 blood pressure averaging and validation', () => {
  const draft = initialMeasurements(records.at(-1))
  Object.assign(draft, { sys1: '120', sys2: '124', dia1: '78', dia2: '82' })
  assert.deepEqual(validateMeasurements(draft), {})
  assert.equal(averageReadings(draft.sys1, draft.sys2), 122)
  assert.deepEqual(measurementPatch(draft, ['sys1', 'dia2']), { bpSys: 122, bpDia: 80 })
  draft.sys2 = ''; assert(validateMeasurements(draft).sys2)
  draft.sys2 = '999'; assert(validateMeasurements(draft).sys2)
  draft.sys2 = '124'; draft.dia1 = '130'; assert(validateMeasurements(draft).dia1)
  draft.temp = 'abc'; assert(validateMeasurements(draft).temp)
  draft.temp = '100'; assert(validateMeasurements(draft).temp)
})
check('U5 clearing values and preserving untouched measurements', () => {
  const draft = initialMeasurements(records.at(-1))
  draft.temp = ''
  const patch = measurementPatch(draft, ['temp'])
  assert.deepEqual(patch, { temp: null })
  const updated = core.applyPatch(records.at(-1), { values: patch })
  assert.equal(updated.values.temp, undefined)
  assert.equal(updated.values.hrv, records.at(-1).values.hrv)
})
check('U5 38.4°C save is reread from storage and produces fever', () => {
  core.saveEntry('fe1', 120, { values: { temp: 38.4, mood: null }, journal: { caffeineLate: false }, symptoms: ['headache'] })
  const reread = core.withEntries('fe1', mission.records.fe1)
  assert.equal(reread.at(-1).values.temp, 38.4)
  assert.equal(reread.at(-1).values.mood, undefined)
  assert(core.assess(reread, 120, mission.env).findings.some(f => f.id === 'fever'))
  assert.equal(core.withEntries('cdr', mission.records.cdr).at(-1).values.temp, mission.records.cdr.at(-1).values.temp)
  assert(storage.size > 0)
})
check('U5 reset restores every crew member', () => {
  core.saveEntry('ms1', 120, { values: { temp: 39 } })
  core.clearEntries()
  for (const person of mission.crew) assert.deepEqual(core.withEntries(person.id, mission.records[person.id]), mission.records[person.id])
})
check('U6 Sofia is first on day 120; all crew show day-78 radiation', () => {
  assert.equal(crewAssessments(mission, 120)[0].member.id, 'ms1')
  assert.equal(crewAssessments(mission, 120)[0].urgent.level, 3)
  const crew = crewAssessments(mission, 78)
  assert.equal(crew.length, 4)
  assert(crew.every(person => person.assessment.findings.some(f => f.id === 'radiation-event')))
})
check('U6 crew overview rereads saved entries', () => {
  core.saveEntry('cdr', 120, { values: { temp: 39 } })
  const commander = crewAssessments(mission, 120).find(p => p.member.id === 'cdr')
  assert(commander.assessment.findings.some(f => f.id === 'fever'))
  core.clearEntries()
})
console.log(`\n${checks} contract checks passed. Browser, TypeScript and Vitest verification are separate.`)
