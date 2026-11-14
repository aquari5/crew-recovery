import { INDICATOR_BY_ID, type DailyRecord, type IndicatorId } from '../core'
export function trendData(records: DailyRecord[], id: IndicatorId, day: number, range: number | 'all') {
  const start = range === 'all' ? 1 : Math.max(1, day - range + 1)
  const byDay = new Map(records.map(record => [record.day, record]))
  return Array.from({ length: day - start + 1 }, (_, offset) => {
    const record = byDay.get(start + offset)
    return { day: start + offset, date: record?.date ?? '', value: record?.values[id] ?? null }
  })
}
export function chartScale(values: (number | null)[], id: IndicatorId, baseline?: number) {
  const bands = id === 'bodyMass' ? undefined : INDICATOR_BY_ID[id].bands
  const numbers = [...values.filter((v): v is number => v !== null), ...Object.values(bands ?? {})]
  if (baseline !== undefined) numbers.push(baseline)
  const low = numbers.length ? Math.min(...numbers) : 0
  const high = numbers.length ? Math.max(...numbers) : 1
  const padding = Math.max((high - low) * .12, high === low ? Math.abs(high) * .05 : .1)
  const domain: [number, number] = [Math.max(0, low - padding), high + padding]
  const zones: { from: number; to: number; status: 'watch' | 'alert' }[] = []
  if (bands?.alertLow !== undefined) zones.push({ from: domain[0], to: bands.alertLow, status: 'alert' })
  if (bands?.watchLow !== undefined) zones.push({ from: bands.alertLow ?? domain[0], to: bands.watchLow, status: 'watch' })
  if (bands?.watchHigh !== undefined) zones.push({ from: bands.watchHigh, to: bands.alertHigh ?? domain[1], status: 'watch' })
  if (bands?.alertHigh !== undefined) zones.push({ from: bands.alertHigh, to: domain[1], status: 'alert' })
  return { domain, zones }
}
