// Plain data preview: every piece of the health logic on one page.
// It is a reference for building the real UI, not the final design.

import { useMemo, useState } from 'react'
import {
  INDICATOR_BY_ID,
  REGIONS,
  assess,
  describeInsight,
  formatValue,
  generateMission,
  roundTripDelayLabel,
  withEntries,
  type Status,
} from '../core'

const COLOR: Record<Status, string> = {
  ok: 'bg-emerald-100 text-emerald-800',
  watch: 'bg-amber-100 text-amber-800',
  alert: 'bg-rose-100 text-rose-800',
  nodata: 'bg-slate-100 text-slate-500',
}
const LEVEL = { 1: 'Self-care', 2: 'Crew Medical Officer', 3: 'Flight surgeon' } as const
const ARROW = { up: '↑', down: '↓', flat: '→', none: '' } as const

function Badge({ status, children }: { status: Status; children: React.ReactNode }) {
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${COLOR[status]}`}>{children}</span>
}

export default function Preview() {
  const mission = useMemo(() => generateMission(), [])
  const [crewId, setCrewId] = useState(mission.crew[0].id)
  const [day, setDay] = useState(mission.days)

  const records = useMemo(() => withEntries(crewId, mission.records[crewId]), [mission, crewId])
  const a = useMemo(() => assess(records, day, mission.env), [records, day, mission.env])
  const today = records.find((r) => r.day === day)

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 text-sm text-slate-800">
      <header className="space-y-3">
        <h1 className="text-xl font-semibold">Crew Recovery — data preview</h1>
        <p className="text-slate-500">
          {mission.name} · {mission.env.label} · ground reply {roundTripDelayLabel(mission.env)} round trip
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <select className="rounded border px-2 py-1" value={crewId} onChange={(e) => setCrewId(e.target.value)}>
            {mission.crew.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.role}
              </option>
            ))}
          </select>
          <label className="flex flex-1 items-center gap-2">
            Mission day {day}
            <input
              className="flex-1"
              type="range"
              min={1}
              max={mission.days}
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
            />
          </label>
          <Badge status={a.overall}>overall: {a.overall}</Badge>
          <Badge status={a.readiness.status}>readiness: {a.readiness.score ?? '—'}</Badge>
          <span>streak {a.streak} d · {a.points} pts</span>
        </div>
      </header>

      <section>
        <h2 className="mb-2 font-semibold">What to do ({a.findings.length})</h2>
        {a.findings.length === 0 && <p className="text-slate-500">Nothing needs action today.</p>}
        <ul className="space-y-2">
          {a.findings.map((f) => (
            <li key={f.id} className="rounded border p-3">
              <div className="flex items-center gap-2">
                <Badge status={f.level === 1 ? 'watch' : 'alert'}>
                  Level {f.level} · {LEVEL[f.level]}
                </Badge>
                <strong>{f.title}</strong>
              </div>
              <p className="mt-1 text-slate-600">{f.why}</p>
              <ol className="mt-1 list-decimal pl-5">
                {f.actions.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Indicators</h2>
        <table className="w-full border-collapse">
          <tbody>
            {a.indicators.map((i) => (
              <tr key={i.id} className="border-t align-top">
                <td className="py-1 pr-2">{INDICATOR_BY_ID[i.id].label}</td>
                <td className="py-1 pr-2 whitespace-nowrap tabular-nums">
                  {formatValue(i.id, i.value)} {ARROW[i.trend.dir]}
                </td>
                <td className="py-1 pr-2">
                  <Badge status={i.status}>{i.status}</Badge>
                </td>
                <td className="py-1 text-slate-600">{i.reasons.join(' ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="mb-2 font-semibold">Body regions</h2>
          <ul className="space-y-1">
            {REGIONS.map((r) => (
              <li key={r.id} className="flex items-center justify-between">
                {r.label} <Badge status={a.regions[r.id]}>{a.regions[r.id]}</Badge>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-2 font-semibold">Today's check-in</h2>
          <ul className="space-y-1">
            {a.tasks.map((t) => (
              <li key={t.id}>
                {t.done ? '✓' : '○'} {t.label} <span className="text-slate-400">+{t.points}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-slate-600">
            Symptoms: {today?.symptoms.join(', ') || 'none'} · Radiation so far {a.radiation.cumulativeMsv} mSv (
            {Math.round(a.radiation.fractionOfLimit * 100)}% of career limit)
          </p>
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">What affects your recovery ({a.insights.length})</h2>
        <ul className="space-y-1">
          {a.insights.slice(0, 8).map((i) => (
            <li key={i.behavior + i.metric}>
              <Badge status={i.good ? 'ok' : 'watch'}>{i.strength}</Badge> {describeInsight(i)}
            </li>
          ))}
        </ul>
        <p className="mt-1 text-slate-400">Correlations in your own data, not proof of cause.</p>
      </section>
    </div>
  )
}
