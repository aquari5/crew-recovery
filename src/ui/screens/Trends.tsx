import { useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { INDICATOR_BY_ID, JOURNAL_BY_KEY, formatValue, type IndicatorId, type Insight } from '../../core'
import { formatDate } from '../format'
import { useMission } from '../state'
import { STATUS, StatusBadge } from '../status'
import { chartScale, trendData } from '../trends'
import { useReducedMotion } from '../useReducedMotion'

const ZONE = { watch: '#e59a1a', alert: '#dc3d43' } as const
const TICK = { fill: '#667085', fontSize: 11, fontFamily: 'var(--mono)' }

/** Shorter names for the indicator list, where space is tight. */
const SHORT: Partial<Record<IndicatorId, string>> = {
  restingHR: 'Resting HR',
  hrv: 'HRV',
  bpSys: 'BP systolic',
  bpDia: 'BP diastolic',
  temp: 'Temperature',
  glucose: 'Fasting glucose',
  exercise: 'Exercise · 7-day',
  radiation: 'Radiation today',
}

function delta(insight: Insight): string {
  const def = INDICATOR_BY_ID[insight.metric]
  const amount = Math.abs(insight.diff).toFixed(Math.max(1, def.decimals))
  return `${insight.diff > 0 ? '+' : '−'}${amount}${def.unit.startsWith('/') ? ' pt' : ` ${def.unit}`}`
}

/** One row per behaviour: its strongest effect large, the other effects as chips. */
function InsightRow({ group }: { group: Insight[] }) {
  const [main, ...rest] = group
  const def = INDICATOR_BY_ID[main.metric]
  const sameDay = ['mood', 'energy', 'stress'].includes(main.metric)
  return (
    <article className={`insight ${main.good ? 'status-good' : 'status-watch'}`}>
      <div className="insight-delta">
        {delta(main)}
        <small>{SHORT[main.metric] ?? def.label}</small>
      </div>
      <div>
        <h4>{JOURNAL_BY_KEY[main.behavior].label}</h4>
        <p className="muted">
          {def.label} is {main.diff > 0 ? 'higher' : 'lower'} {sameDay ? 'on the same day' : 'the following night'}. Seen on {main.nWith} days with it,
          compared with {main.nWithout} without.
          {main.adjusted != null && ` With your other logged behaviours accounted for: ${delta({ ...main, diff: main.adjusted })}.`}
        </p>
        {rest.length > 0 && (
          <ul className="insight-chips">
            {rest.map((other) => (
              <li key={other.metric}>
                {SHORT[other.metric] ?? INDICATOR_BY_ID[other.metric].label} {delta(other)}
              </li>
            ))}
          </ul>
        )}
      </div>
      <StatusBadge status={main.good ? 'ok' : 'watch'} />
    </article>
  )
}

function groupByBehavior(insights: Insight[]): Insight[][] {
  const groups = new Map<string, Insight[]>()
  for (const insight of insights) groups.set(insight.behavior, [...(groups.get(insight.behavior) ?? []), insight])
  return [...groups.values()]
}

export default function Trends() {
  const { records, day, assessment } = useMission()
  const [indicator, setIndicator] = useState<IndicatorId>('sleep')
  const [range, setRange] = useState<number | 'all'>(30)
  const reduced = useReducedMotion()
  const definition = INDICATOR_BY_ID[indicator]
  const result = assessment.indicators.find((item) => item.id === indicator)!
  const baseline = result.baseline?.median
  const data = useMemo(() => trendData(records, indicator, day, range), [records, indicator, day, range])
  const { domain, zones } = useMemo(() => chartScale(data.map((point) => point.value), indicator, baseline), [data, indicator, baseline])
  const measured = data.filter((point) => point.value !== null)

  return (
    <div>
      <div className="trends-layout">
        <nav className="card metric-list" aria-label="Indicator">
          {assessment.indicators.map((item) => (
            <button key={item.id} className={`metric ${STATUS[item.status].className}`} aria-pressed={indicator === item.id} onClick={() => setIndicator(item.id)}>
              <i aria-hidden="true" />
              <span>{SHORT[item.id] ?? INDICATOR_BY_ID[item.id].label}</span>
              <b>{formatValue(item.id, item.value)}</b>
            </button>
          ))}
        </nav>

        <section className="card chart-card" aria-labelledby="trends-title">
          <div className="chart-top">
            <div>
              <p className="eyebrow" id="trends-title">
                {definition.label} · Days {data[0]?.day ?? 1}–{day}
              </p>
              <p className="chart-value">
                {result.value === null ? '—' : result.value.toFixed(definition.decimals)}
                <small>{definition.unit}</small>
              </p>
            </div>
            <div style={{ display: 'grid', gap: 10, justifyItems: 'end' }}>
              <StatusBadge status={result.status} />
              <div className="range-buttons" role="group" aria-label="Chart time range">
                {([14, 30, 'all'] as const).map((value) => (
                  <button key={value} className="button" aria-pressed={range === value} onClick={() => setRange(value)}>
                    {value === 'all' ? 'All' : `${value} d`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {measured.length ? (
            <div className="trend-chart" role="group" aria-label={`${definition.label} chart, days ${data[0].day} to ${day}. A data table is available below.`}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 16, right: 16, bottom: 4, left: 0 }} accessibilityLayer>
                  <CartesianGrid stroke="rgba(10,16,32,0.07)" vertical={false} />
                  <XAxis dataKey="day" type="number" domain={[data[0].day, day]} allowDecimals={false} minTickGap={36} tick={TICK} tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis domain={domain} width={48} tick={TICK} tickLine={false} axisLine={false} tickFormatter={(value) => Number(value).toLocaleString('en-US', { maximumFractionDigits: 1 })} />
                  {zones.map((zone, index) => (
                    <ReferenceArea key={index} y1={zone.from} y2={zone.to} fill={ZONE[zone.status]} fillOpacity={zone.status === 'alert' ? 0.13 : 0.1} strokeOpacity={0} ifOverflow="hidden" />
                  ))}
                  {baseline !== undefined && <ReferenceLine y={baseline} stroke="#667085" strokeDasharray="4 4" />}
                  <ReferenceLine x={day} stroke="#0a1020" strokeOpacity={0.25} />
                  <Tooltip
                    cursor={{ stroke: '#0a1020', strokeOpacity: 0.2 }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const point = payload[0].payload as (typeof data)[number]
                      return (
                        <div className="chart-tooltip">
                          <strong>
                            Day {point.day} · {point.date ? formatDate(point.date) : ''}
                          </strong>
                          {formatValue(indicator, point.value)}
                        </div>
                      )
                    }}
                  />
                  <Line
                    key={indicator}
                    type="linear"
                    dataKey="value"
                    name={definition.label}
                    stroke="#0a1020"
                    strokeWidth={2}
                    dot={measured.length < 20 ? { r: 3, fill: '#0a1020', strokeWidth: 0 } : false}
                    activeDot={{ r: 5, fill: '#1d4ed8', stroke: '#fff', strokeWidth: 2 }}
                    connectNulls={false}
                    isAnimationActive={!reduced}
                    animationDuration={450}
                    animationEasing="ease-out"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="muted" style={{ padding: '48px 0' }}>
              No measurements in this range. Try a longer range or add a reading in Log.
            </p>
          )}

          <div className="chart-legend">
            <span>
              <i className="swatch" style={{ ['--c' as string]: '#0a1020', height: 2 }} /> Measured
            </span>
            <span>
              <i className="swatch" style={{ ['--c' as string]: 'repeating-linear-gradient(90deg,#667085 0 4px,transparent 4px 8px)', height: 2 }} /> Your normal
              {baseline === undefined ? ' (not enough history)' : ` ${formatValue(indicator, baseline)}`}
            </span>
            {zones.length > 0 && (
              <>
                <span>
                  <i className="swatch" style={{ ['--c' as string]: 'rgba(229,154,26,0.35)' }} /> Watch
                </span>
                <span>
                  <i className="swatch" style={{ ['--c' as string]: 'rgba(220,61,67,0.35)' }} /> Act
                </span>
              </>
            )}
          </div>
          <p className="chart-footnote muted">
            {result.reasons.join(' ')}{' '}
            {indicator === 'bodyMass' ? 'Body mass is judged as percent change from mission start, so no fixed zones are drawn.' : ''} Gaps mean no measurement.
          </p>
          <details className="chart-table">
            <summary>Why it matters in space</summary>
            <p>{definition.whyInSpace}</p>
          </details>
          <details className="chart-table">
            <summary>View as a table</summary>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Mission day</th>
                    <th>Date</th>
                    <th>{definition.label}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((point) => (
                    <tr key={point.day}>
                      <td>{point.day}</td>
                      <td>{point.date || '—'}</td>
                      <td>{formatValue(indicator, point.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </section>
      </div>

      <section className="section" aria-labelledby="patterns-title">
        <div className="section-head">
          <h2 id="patterns-title">What affects your recovery</h2>
          <span className="eyebrow">Your own data · not proof of cause</span>
        </div>
        {assessment.insights.length ? (
          <div className="insights">
            {groupByBehavior(assessment.insights)
              .slice(0, 7)
              .map((group) => (
                <InsightRow key={group[0].behavior} group={group} />
              ))}
          </div>
        ) : (
          <p className="muted">At least 5 days with and 5 days without a behaviour are needed before a pattern is shown.</p>
        )}
        <details className="method">
          <summary>How a pattern earns its place here</summary>
          <p className="muted">
            Each behaviour is compared on the days you logged it and the days you did not. A pattern is shown only if the difference is at least moderate in size,
            is unlikely to be chance after correcting for the roughly 70 comparisons made at once, and is still there when all your other behaviours are
            accounted for together. On test data with no real effects about one person in ten is shown a false pattern; a strong real effect is found
            nine times out of ten within 120 days. Weak effects are left out on purpose.
          </p>
        </details>
      </section>
    </div>
  )
}
