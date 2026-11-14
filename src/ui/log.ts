import type { DailyRecord, EntryPatch, IndicatorId } from '../core'
export const MEASUREMENTS = [
  { key: 'sys1', id: 'bpSys', label: 'Systolic · reading 1', min: 60, max: 260, step: 1 },
  { key: 'dia1', id: 'bpDia', label: 'Diastolic · reading 1', min: 30, max: 180, step: 1 },
  { key: 'sys2', id: 'bpSys', label: 'Systolic · reading 2', min: 60, max: 260, step: 1 },
  { key: 'dia2', id: 'bpDia', label: 'Diastolic · reading 2', min: 30, max: 180, step: 1 },
  { key: 'temp', id: 'temp', label: 'Body temperature', min: 30, max: 45, step: .1 },
  { key: 'exercise', id: 'exercise', label: 'Exercise minutes', min: 0, max: 1440, step: 1 },
  { key: 'glucose', id: 'glucose', label: 'Fasting glucose', min: 20, max: 600, step: .1 },
  { key: 'bodyMass', id: 'bodyMass', label: 'Body mass', min: 20, max: 300, step: .1 },
] as const
export type MeasurementKey = typeof MEASUREMENTS[number]['key']
export type MeasurementDraft = Record<MeasurementKey, string>
export function initialMeasurements(record?: DailyRecord): MeasurementDraft {
  return Object.fromEntries(MEASUREMENTS.map(field => [field.key, record?.values[field.id]?.toString() ?? ''])) as MeasurementDraft
}
export function validateMeasurements(draft: MeasurementDraft) {
  const errors: Partial<Record<MeasurementKey, string>> = {}
  for (const field of MEASUREMENTS) {
    const raw = draft[field.key].trim()
    if (!raw) continue
    const value = Number(raw)
    if (!Number.isFinite(value) || value < field.min || value > field.max) errors[field.key] = `Enter a value between ${field.min} and ${field.max}.`
  }
  for (const keys of [['sys1', 'sys2'], ['dia1', 'dia2']] as const) {
    if (Boolean(draft[keys[0]].trim()) !== Boolean(draft[keys[1]].trim())) {
      errors[draft[keys[0]].trim() ? keys[1] : keys[0]] = 'Enter both readings to calculate the average, or clear both.'
    }
  }
  for (const [sys, dia] of [['sys1', 'dia1'], ['sys2', 'dia2']] as const) {
    if (draft[sys].trim() && draft[dia].trim() && Number(draft[sys]) <= Number(draft[dia])) errors[dia] = 'Diastolic pressure must be below systolic pressure.'
  }
  return errors
}
export function averageReadings(first: string, second: string): number | null {
  if (!first.trim() || !second.trim()) return null
  const a = Number(first), b = Number(second)
  return Number.isFinite(a) && Number.isFinite(b) ? Math.round(((a + b) / 2) * 10) / 10 : null
}
export function measurementPatch(draft: MeasurementDraft, touched: MeasurementKey[]): EntryPatch['values'] {
  const values: EntryPatch['values'] = {}
  for (const key of touched) {
    const field = MEASUREMENTS.find(item => item.key === key)!
    if (field.id === 'bpSys') values.bpSys = averageReadings(draft.sys1, draft.sys2)
    else if (field.id === 'bpDia') values.bpDia = averageReadings(draft.dia1, draft.dia2)
    else values[field.id as IndicatorId] = draft[key].trim() ? Number(draft[key]) : null
  }
  return values
}
