import { useEffect, useRef, useState, type FormEvent } from 'react'
import { assess, clearEntries, INDICATOR_BY_ID, JOURNAL, saveEntry, SYMPTOMS, withEntries, type DailyRecord, type IndicatorId, type IndicatorResult, type JournalKey, type SymptomKey } from '../../core'
import { useMission } from '../state'
import { StatusBadge } from '../status'
import { averageReadings, initialMeasurements, MEASUREMENTS, measurementPatch, validateMeasurements, type MeasurementDraft, type MeasurementKey } from '../log'

const SCALES = ['mood', 'energy', 'stress'] as const
const DRAFT_PREFIX = 'crew-recovery:ui-draft:'
interface Draft {
  measurements: MeasurementDraft
  scales: Partial<Record<typeof SCALES[number], number | null>>
  journal: Partial<Record<JournalKey, boolean>>
  symptoms: SymptomKey[]
  touched: MeasurementKey[]
  scaleTouched: (typeof SCALES[number])[]
  journalTouched: JournalKey[]
  symptomsTouched: boolean
}
function freshDraft(record?: DailyRecord): Draft {
  return { measurements: initialMeasurements(record), scales: { mood: record?.values.mood, energy: record?.values.energy, stress: record?.values.stress }, journal: { ...record?.journal }, symptoms: [...(record?.symptoms ?? [])], touched: [], scaleTouched: [], journalTouched: [], symptomsTouched: false }
}
function loadDraft(key: string, record?: DailyRecord): Draft {
  try {
    const saved = JSON.parse(sessionStorage.getItem(key) ?? 'null') as Draft | null
    if (saved && saved.measurements && MEASUREMENTS.every(field => typeof saved.measurements[field.key] === 'string') && Array.isArray(saved.touched) && Array.isArray(saved.scaleTouched) && Array.isArray(saved.journalTouched) && Array.isArray(saved.symptoms) && saved.scales && saved.journal) return saved
  } catch { /* Drafts are optional when browser storage is blocked. */ }
  return freshDraft(record)
}
function canStoreEntries() {
  try {
    const key = 'crew-recovery:storage-check'
    localStorage.setItem(key, '1')
    const stored = localStorage.getItem(key) === '1'
    localStorage.removeItem(key)
    return stored
  } catch { return false }
}
function MeasurementHelp({ id }: { id: IndicatorId }) {
  const definition = INDICATOR_BY_ID[id]
  return <details className="measurement-help"><summary>How? <span className="sr-only">Measure {definition.label}</span></summary><ol>{definition.howToMeasure.map(step => <li key={step}>{step}</li>)}</ol><p>{definition.whyInSpace}</p></details>
}
function LogForm({ onOpenToday }: { onOpenToday: () => void }) {
  const { mission, crewId, day, envId, records, assessment, refresh } = useMission()
  const record = records.find(item => item.day === day)
  const draftKey = `${DRAFT_PREFIX}${envId}:${crewId}:${day}`
  const [draft, setDraft] = useState(() => loadDraft(draftKey, record))
  const [errors, setErrors] = useState<ReturnType<typeof validateMeasurements>>({})
  const [message, setMessage] = useState('')
  const [saveError, setSaveError] = useState('')
  const [changed, setChanged] = useState<IndicatorResult[]>([])
  const [resetConfirm, setResetConfirm] = useState(false)
  const errorRef = useRef<HTMLDivElement>(null)
  const dirty = !!(draft.touched.length || draft.scaleTouched.length || draft.journalTouched.length || draft.symptomsTouched)
  useEffect(() => {
    try { if (dirty) sessionStorage.setItem(draftKey, JSON.stringify(draft)); else sessionStorage.removeItem(draftKey) } catch { /* Live form remains usable without session storage. */ }
  }, [draftKey, draft, dirty])
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
  function editMeasurement(key: MeasurementKey, value: string) {
    setDraft(old => ({ ...old, measurements: { ...old.measurements, [key]: value }, touched: [...new Set([...old.touched, key])] }))
    setErrors({}); setMessage(''); setSaveError(''); setChanged([])
  }
  function submit(event: FormEvent) {
    event.preventDefault()
    const invalid = validateMeasurements(draft.measurements)
    setErrors(invalid); setSaveError(''); setMessage(''); setChanged([])
    if (Object.keys(invalid).length) { requestAnimationFrame(() => errorRef.current?.focus()); return }
    if (!canStoreEntries()) { setSaveError('Browser storage is unavailable. Your entry has not been saved. Keep this page open and enable local storage, then try again.'); return }
    const values = measurementPatch(draft.measurements, draft.touched) ?? {}
    for (const key of draft.scaleTouched) values[key] = draft.scales[key] ?? null
    const journal = Object.fromEntries(draft.journalTouched.map(key => [key, draft.journal[key]]))
    const patch = { values, journal, ...(draft.symptomsTouched ? { symptoms: draft.symptoms } : {}) }
    saveEntry(crewId, day, patch)
    const updatedRecords = withEntries(crewId, mission.records[crewId])
    const saved = updatedRecords.find(item => item.day === day)
    const matches = saved && Object.entries(values).every(([key, value]) => value == null ? saved.values[key as IndicatorId] == null : saved.values[key as IndicatorId] === value)
      && draft.journalTouched.every(key => saved.journal[key] === draft.journal[key])
      && (!draft.symptomsTouched || JSON.stringify(saved.symptoms) === JSON.stringify(draft.symptoms))
    if (!matches) { setSaveError('The browser could not save the full entry. Your draft is still here. Free some storage and try again.'); refresh(); return }
    const updated = assess(updatedRecords, day, mission.env)
    setChanged(updated.indicators.filter(item => Object.hasOwn(values, item.id)))
    setDraft(freshDraft(saved))
    refresh()
    setMessage('Check-in saved on this device. Your assessment has been updated.')
  }
  function reset() {
    clearEntries()
    try { Object.keys(sessionStorage).filter(key => key.startsWith(DRAFT_PREFIX)).forEach(key => sessionStorage.removeItem(key)) } catch { /* optional draft storage */ }
    const original = mission.records[crewId].find(item => item.day === day)
    const resetSucceeded = mission.crew.every(member => JSON.stringify(withEntries(member.id, mission.records[member.id])) === JSON.stringify(mission.records[member.id]))
    if (!resetSucceeded) { setSaveError('Demo entries could not be cleared. Check browser storage permissions.'); setResetConfirm(false); return }
    setDraft(freshDraft(original)); setErrors({}); setChanged([]); setSaveError(''); setResetConfirm(false)
    refresh(); setMessage('Demo data restored. Saved entries and drafts for all crew members have been cleared.')
  }
  const due = (id: IndicatorId) => assessment.due.includes(id) ? <span className="due-marker">Due today</span> : null
  return <form className="screen-stack log-form" onSubmit={submit} noValidate>
    <div className="today-section-heading"><div><h2>Daily log</h2><p className="muted">Day {day} · {mission.crew.find(member => member.id === crewId)?.name}</p></div><span className="eyebrow">{dirty ? 'Unsaved changes' : 'Up to date'}</span></div>
    {Object.keys(errors).length > 0 && <div className="form-error" role="alert" tabIndex={-1} ref={errorRef}><h3>Check your measurements</h3><ul>{Object.entries(errors).map(([key, error]) => <li key={key}><a href={`#measurement-${key}`}>{MEASUREMENTS.find(item => item.key === key)?.label}: {error}</a></li>)}</ul></div>}
    {saveError && <p className="form-error" role="alert">{saveError}</p>}
    <section className="workspace-panel"><div className="panel-heading"><h3>How you feel</h3><span className="muted">Tap a selected value again to clear it.</span></div><div className="scale-grid">{SCALES.map(key => <fieldset key={key}><legend>{INDICATOR_BY_ID[key].label} {due(key)}</legend><div className="scale-buttons">{[1, 2, 3, 4, 5].map(value => <button type="button" key={value} aria-pressed={draft.scales[key] === value} aria-label={`${INDICATOR_BY_ID[key].label}: ${value} out of 5`} onClick={() => { setDraft(old => ({ ...old, scales: { ...old.scales, [key]: old.scales[key] === value ? null : value }, scaleTouched: [...new Set([...old.scaleTouched, key])] })); setMessage(''); setChanged([]) }}>{value}</button>)}</div><p className="scale-hint muted">{key === 'stress' ? '1 · Low stress — 5 · High stress' : key === 'mood' ? '1 · Very low — 5 · Very good' : '1 · Exhausted — 5 · Energised'}</p></fieldset>)}</div></section>
    <section className="workspace-panel"><div className="panel-heading"><h3>Daily journal</h3><span className="muted">Select what happened today.</span></div><div className="journal-grid">{JOURNAL.map(item => <button type="button" key={item.key} className="journal-toggle" aria-pressed={draft.journal[item.key] === true} onClick={() => { setDraft(old => ({ ...old, journal: { ...old.journal, [item.key]: !old.journal[item.key] }, journalTouched: [...new Set([...old.journalTouched, item.key])] })); setMessage(''); setChanged([]) }}><span aria-hidden="true">{draft.journal[item.key] ? '✓' : '○'}</span><span><strong>{item.label}</strong><small>{item.hint}</small></span></button>)}</div></section>
    <section className="workspace-panel"><div className="panel-heading"><h3>Symptoms</h3><span className="muted">Select all that apply.</span></div><div className="symptom-options">{SYMPTOMS.map(item => <button className="button" type="button" key={item.key} aria-pressed={draft.symptoms.includes(item.key)} onClick={() => { setDraft(old => ({ ...old, symptoms: old.symptoms.includes(item.key) ? old.symptoms.filter(key => key !== item.key) : [...old.symptoms, item.key], symptomsTouched: true })); setMessage(''); setChanged([]) }}><span aria-hidden="true">{draft.symptoms.includes(item.key) ? '✓' : '+'}</span>{item.label}</button>)}</div><p className="log-note muted">{draft.symptoms.length ? `${draft.symptoms.length} selected` : 'No symptoms selected.'}</p></section>
    <section className="workspace-panel"><div className="panel-heading"><h3>Measurements</h3><span className="muted">Clear a field to remove its reading.</span></div>
      <p className="log-note muted">Blood pressure: take two readings and enter both. Previously saved averages are shown in both fields until you replace them.</p>
      <div className="measurement-grid">{MEASUREMENTS.map(field => <div className="measurement-field" key={field.key}><label htmlFor={`measurement-${field.key}`}>{field.label} <span className="muted">({INDICATOR_BY_ID[field.id].unit})</span></label><div className="measurement-markers">{due(field.id)}{INDICATOR_BY_ID[field.id].cadence === 'weekly' && <span className="eyebrow">Weekly</span>}</div><input id={`measurement-${field.key}`} type="number" inputMode="decimal" min={field.min} max={field.max} step={field.step} value={draft.measurements[field.key]} onChange={event => editMeasurement(field.key, event.target.value)} aria-invalid={!!errors[field.key]} aria-describedby={errors[field.key] ? `error-${field.key}` : undefined} />{errors[field.key] && <p className="field-error" id={`error-${field.key}`}>{errors[field.key]}</p>}<MeasurementHelp id={field.id} /></div>)}</div>
      <p className="bp-average">Blood pressure average: <strong>{averageReadings(draft.measurements.sys1, draft.measurements.sys2) ?? '—'} / {averageReadings(draft.measurements.dia1, draft.measurements.dia2) ?? '—'} mmHg</strong></p>
    </section>
    <div className="log-actions"><button className="button primary-button" type="submit" disabled={!dirty}>Save check-in</button><span className="muted">Saved entries stay on this browser and device.</span></div>
    {message && <section className="workspace-panel save-result" aria-live="polite"><h3>{message}</h3>{changed.map(result => <div className="data-row" key={result.id}><span>{INDICATOR_BY_ID[result.id].label}</span><StatusBadge status={result.status} /></div>)}<button type="button" className="button" onClick={onOpenToday}>Review Today ↗</button></section>}
    <section className="reset-section"><h3>Reset demo data</h3><p className="muted">Remove saved entries and drafts for all crew members and restore the synthetic mission.</p>{resetConfirm ? <div className="reset-confirm" role="group" aria-label="Confirm demo reset"><button type="button" className="button danger-button" onClick={reset}>Confirm reset</button><button type="button" className="button" onClick={() => setResetConfirm(false)}>Cancel</button></div> : <button type="button" className="button" onClick={() => setResetConfirm(true)}>Reset demo data</button>}</section>
  </form>
}
export default function Log({ onOpenToday }: { onOpenToday: () => void }) {
  const { crewId, day, envId } = useMission()
  return <LogForm key={`${envId}-${crewId}-${day}`} onOpenToday={onOpenToday} />
}
