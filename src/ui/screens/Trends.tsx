import { useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { INDICATORS, INDICATOR_BY_ID, describeInsight, formatValue, type IndicatorId } from '../../core'
import { useMission } from '../state'
import { StatusBadge } from '../status'
import { formatDate } from '../Timeline'
import { useReducedMotion } from '../useReducedMotion'
import { chartScale, trendData } from '../trends'
import './Remaining.css'

export default function Trends() {
  const { records, day, assessment } = useMission()
  const [indicator, setIndicator] = useState<IndicatorId>('sleep')
  const [range, setRange] = useState<number | 'all'>(30)
  const reduced = useReducedMotion()
  const definition = INDICATOR_BY_ID[indicator]
  const result = assessment.indicators.find(item => item.id === indicator)
  const baseline = result?.baseline?.median
  const data = useMemo(() => trendData(records, indicator, day, range), [records, indicator, day, range])
  const { domain, zones } = useMemo(() => chartScale(data.map(point => point.value), indicator, baseline), [data, indicator, baseline])
  const measured = data.filter(point => point.value !== null)
  return <div className="screen-stack">
    <section className="workspace-panel" aria-labelledby="trends-title"><div className="panel-heading"><h2 id="trends-title">Your measurements over time</h2>{result && <StatusBadge status={result.status} />}</div>
      <div className="chart-controls"><label className="select-field"><span className="eyebrow">Indicator</span><select value={indicator} onChange={event => setIndicator(event.target.value as IndicatorId)}>{INDICATORS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <div className="range-buttons" role="group" aria-label="Chart time range">{([14, 30, 'all'] as const).map(value => <button key={value} className="button" aria-pressed={range === value} onClick={() => setRange(value)}>{value === 'all' ? 'All days' : `${value} days`}</button>)}</div>
      </div>
      <div className="chart-caption"><h3>{definition.label} <span className="muted">({definition.unit})</span></h3><p className="muted">Days {data[0]?.day ?? 1}–{day} · {measured.length} measurements</p></div>
      {measured.length ? <div className="trend-chart" role="group" aria-label={`${definition.label} chart, days ${data[0].day} to ${day}. A data table is available below.`}>
        <ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 28, right: 20, bottom: 16, left: 0 }} accessibilityLayer>
          <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 5" vertical={false} />
          <XAxis dataKey="day" type="number" domain={[Math.max(.5, data[0].day - .5), day + .5]} allowDecimals={false} minTickGap={32} tick={{ fill: 'var(--color-muted)', fontSize: 12 }} tickLine={false} />
          <YAxis domain={domain} width={52} tick={{ fill: 'var(--color-muted)', fontSize: 12 }} tickLine={false} tickFormatter={value => Number(value).toLocaleString('en-US', { maximumFractionDigits: 1 })} />
          {zones.map((zone, index) => <ReferenceArea key={index} y1={zone.from} y2={zone.to} fill={`var(--color-${zone.status})`} fillOpacity={.12} strokeOpacity={0} />)}
          {baseline !== undefined && <ReferenceLine y={baseline} stroke="var(--color-muted)" strokeDasharray="6 4" label={{ value: 'Your normal', fill: 'var(--color-muted)', fontSize: 11, position: 'insideTopLeft' }} />}
          <ReferenceLine x={day} stroke="var(--color-accent)" strokeDasharray="2 4" label={{ value: `Day ${day}`, fill: 'var(--color-accent)', fontSize: 11, position: 'insideTopRight' }} />
          <Tooltip content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const point = payload[0].payload as typeof data[number]
            return <div className="chart-tooltip"><strong>Day {point.day} · {point.date ? formatDate(point.date) : 'Date unavailable'}</strong><p>{definition.label}: {formatValue(indicator, point.value)}</p></div>
          }} />
          <Line key={indicator} type="linear" dataKey="value" name={definition.label} stroke="var(--color-accent)" strokeWidth={2.5} dot={measured.length < 20 ? { r: 3 } : false} activeDot={{ r: 5 }} connectNulls={false} isAnimationActive={!reduced} animationDuration={250} />
        </LineChart></ResponsiveContainer>
      </div> : <p className="panel-body muted">No measurements in this range. Try a longer range or add a reading in Log.</p>}
      <div className="chart-legend"><span>— Measured value</span><span>┄ Your normal{baseline === undefined ? ': not enough history' : `: ${formatValue(indicator, baseline)}`}</span>{zones.length > 0 && <><StatusBadge status="watch" /><StatusBadge status="alert" /></>}</div>
      <p className="chart-footnote muted">{indicator === 'bodyMass' ? 'Body mass thresholds use percentage change from mission start, so fixed kilogram bands are not shown.' : 'Shaded zones show catalogue thresholds. Personal-baseline changes can also affect your status.'} Gaps mean no measurement.</p>
      <details className="chart-table"><summary>View measurements as a table</summary><div className="table-scroll"><table><thead><tr><th>Mission day</th><th>Date</th><th>{definition.label}</th></tr></thead><tbody>{data.map(point => <tr key={point.day}><td>{point.day}</td><td>{point.date || '—'}</td><td>{formatValue(indicator, point.value)}</td></tr>)}</tbody></table></div></details>
    </section>
    <section className="workspace-panel"><div className="panel-heading"><h2>What affects your recovery</h2></div><div className="panel-body">
      {assessment.insights.length ? assessment.insights.slice(0, 8).map(insight => <article className="insight-row" key={insight.behavior + insight.metric}><StatusBadge status={insight.good ? 'ok' : 'watch'} /><p>{describeInsight(insight)} <span className="muted">· {insight.strength}</span></p></article>) : <p className="muted">At least 5 days with and 5 days without a behaviour are needed to compare its association with recovery.</p>}
      <p className="muted">Correlations in your own data, not proof of cause.</p>
    </div></section>
  </div>
}
