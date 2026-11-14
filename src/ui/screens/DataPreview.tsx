import { INDICATOR_BY_ID, REGIONS, describeInsight, formatValue } from '../../core'
import { useMission } from '../state'
import { StatusBadge } from '../status'

const LEVEL = { 1: 'Self-care', 2: 'Crew Medical Officer', 3: 'Flight surgeon' } as const
const ARROW = { up: '↑', down: '↓', flat: '→', none: '' } as const
export default function DataPreview() {
  const { assessment: a, records, day } = useMission()
  const current = records.find(record => record.day === day)
  return <div className="preview-grid">
    <section className="workspace-panel"><div className="panel-heading"><h2>What to do</h2><span className="muted">{a.findings.length} findings</span></div>
      <div className="panel-body">{!a.findings.length && <p>Nothing needs action today.</p>}
        {a.findings.map(finding => <article className="finding" key={finding.id}>
          <span className="eyebrow">Level {finding.level} · {LEVEL[finding.level]}</span><h3>{finding.title}</h3>
          <p className="muted">{finding.why}</p><ol>{finding.actions.map(action => <li key={action}>{action}</li>)}</ol>
        </article>)}</div></section>
    <section className="workspace-panel"><div className="panel-heading"><h2>Indicators</h2><span className="eyebrow">Measured signals</span></div>
      <div className="indicator-list">{a.indicators.map(indicator => <article className="indicator-row" key={indicator.id}>
        <div><h3>{INDICATOR_BY_ID[indicator.id].label}</h3><p className="muted">{indicator.reasons.join(' ') || 'No additional notes.'}</p></div>
        <div className="indicator-value"><strong>{formatValue(indicator.id, indicator.value)} <span aria-label={indicator.trend.dir === 'none' ? undefined : `Trend ${indicator.trend.dir}`}>{ARROW[indicator.trend.dir]}</span></strong><StatusBadge status={indicator.status} /></div>
      </article>)}</div></section>
    <div className="preview-columns"><section className="workspace-panel"><div className="panel-heading"><h2>Body regions</h2></div><div className="panel-body">
      {REGIONS.map(region => <div className="data-row" key={region.id}><span>{region.label}</span><StatusBadge status={a.regions[region.id]} /></div>)}
    </div></section><section className="workspace-panel"><div className="panel-heading"><h2>Today's check-in</h2></div><div className="panel-body">
      {a.tasks.map(task => <div className="data-row" key={task.id}><span>{task.done ? '✓ Done' : '○ Due'} · {task.label}</span><span className="muted">+{task.points}</span></div>)}
      <p className="muted">{a.streak}-day streak · {a.points} points</p><p className="muted">Symptoms: {current?.symptoms.join(', ') || 'none'}</p>
      <p className="muted">Mission radiation: {a.radiation.cumulativeMsv} mSv · {Math.round(a.radiation.fractionOfLimit * 100)}% of career limit</p>
    </div></section></div>
    <section className="workspace-panel"><div className="panel-heading"><h2>What affects your recovery</h2></div><div className="panel-body">
      {!a.insights.length && <p className="muted">Not enough data yet. At least 5 days with and 5 days without a behaviour are needed.</p>}
      {a.insights.slice(0, 8).map(insight => <div className="insight-row" key={insight.behavior + insight.metric}><StatusBadge status={insight.good ? 'ok' : 'watch'} /><p>{describeInsight(insight)} <span className="muted">· {insight.strength}</span></p></div>)}
      <p className="muted">Correlations in your own data, not proof of cause.</p></div></section>
  </div>
}
