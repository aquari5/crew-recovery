// Local persistence for what the astronaut enters in the app.
//
// There is no backend: entries live in the browser's localStorage, so the tool
// keeps working with no link to Earth. Entries are stored as patches on top of
// the mission records and merged at read time.

import type { DailyRecord, IndicatorId } from './types'

const KEY = 'crew-recovery:entries:v1'

/** A partial update for one crew member's day. A `null` value clears that reading. */
export type EntryPatch = Partial<Pick<DailyRecord, 'journal' | 'symptoms' | 'note'>> & {
  values?: Partial<Record<IndicatorId, number | null>>
}

type Store = Record<string, Record<number, EntryPatch>>

function read(): Store {
  try {
    return JSON.parse(globalThis.localStorage?.getItem(KEY) ?? '{}') as Store
  } catch {
    return {} // corrupted or unavailable storage: start clean rather than crash
  }
}

function write(store: Store): void {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(store))
  } catch {
    /* storage full or blocked: the entry stays in memory for this session */
  }
}

/** Merge a patch into a record. `values` and `journal` merge per key; a null value clears a reading. */
export function applyPatch(record: DailyRecord, patch: EntryPatch | undefined): DailyRecord {
  if (!patch) return record
  const values: DailyRecord['values'] = { ...record.values }
  for (const [k, v] of Object.entries(patch.values ?? {}) as [IndicatorId, number | null | undefined][]) {
    if (v == null) delete values[k]
    else values[k] = v
  }
  return {
    ...record,
    values,
    journal: { ...record.journal, ...patch.journal },
    symptoms: patch.symptoms ?? record.symptoms,
    note: patch.note ?? record.note,
  }
}

/** Mission records with the locally saved entries applied. */
export function withEntries(crewId: string, records: DailyRecord[]): DailyRecord[] {
  const patches = read()[crewId]
  if (!patches) return records
  return records.map((r) => applyPatch(r, patches[r.day]))
}

export function saveEntry(crewId: string, day: number, patch: EntryPatch): void {
  const store = read()
  const mine = (store[crewId] ??= {})
  const old = mine[day] ?? {}
  mine[day] = {
    ...old,
    ...patch,
    values: { ...old.values, ...patch.values },
    journal: { ...old.journal, ...patch.journal },
  }
  write(store)
}

export function clearEntries(): void {
  try {
    globalThis.localStorage?.removeItem(KEY)
  } catch {
    /* nothing to clear */
  }
}
