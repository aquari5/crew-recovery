import { useState, type ReactNode } from 'react'
import {
  INDICATOR_BY_ID, REGIONS, REGION_BY_ID, SYMPTOMS, formatValue,
  type Assessment, type BodyRegionId, type DailyRecord, type IndicatorResult,
} from '../../core'
import { useMission } from '../state'
import { STATUS, StatusBadge } from '../status'
import './Body.css'

const LEVEL = { 1: 'Self-care', 2: 'Crew Medical Officer', 3: 'Flight surgeon' } as const
const TREND = { up: '↑', down: '↓', flat: '→', none: '' } as const
const TREND_LABEL = { up: 'Rising', down: 'Falling', flat: 'Stable', none: 'Not enough data for a trend' } as const

function Source({ source }: { source: string }) {
  const match = source.match(/https?:\/\/[^\s]+/)
  return match ? <a href={match[0]} target="_blank" rel="noopener noreferrer">{source.slice(0, match.index).replace(/\s*—\s*$/, '') || match[0]} <span className="muted">(opens in a new tab)</span></a> : <span>{source}</span>
}

function IndicatorCard({ result, day }: { result: IndicatorResult; day: number }) {
  const definition = INDICATOR_BY_ID[result.id]
  return <article className="body-indicator">
    <div className="body-indicator-heading"><h4>{definition.label}</h4><StatusBadge status={result.status} /></div>
    <div className="body-reading"><strong>{formatValue(result.id, result.value)}</strong><span className="muted" aria-label={TREND_LABEL[result.trend.dir]}>{TREND[result.trend.dir]} {TREND_LABEL[result.trend.dir]}</span></div>
    {result.valueDay !== null && result.valueDay !== day && <p className="body-reading-age muted">Last measured on mission day {result.valueDay}</p>}
    {result.reasons.length ? <ul className="body-reasons">{result.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul> : <p className="muted">{result.value === null ? 'No recent measurement available.' : 'No additional assessment notes.'}</p>}
    <details><summary>How to measure</summary><ol>{definition.howToMeasure.map(step => <li key={step}>{step}</li>)}</ol></details>
    <details><summary>Why it matters in space</summary><p>{definition.whyInSpace}</p></details>
    <details><summary>Sources</summary><ul>{definition.sources.map(source => <li key={source}><Source source={source} /></li>)}</ul></details>
  </article>
}

export function RegionPanel({ regionId, assessment, record }: { regionId: BodyRegionId; assessment: Assessment; record?: DailyRecord }) {
  const region = REGION_BY_ID[regionId]
  const indicators = assessment.indicators.filter(result => INDICATOR_BY_ID[result.id].region === regionId)
  const findings = assessment.findings.filter(finding => finding.regions.includes(regionId)).sort((a, b) => b.level - a.level)
  const symptoms = SYMPTOMS.filter(symptom => symptom.region === regionId && record?.symptoms.includes(symptom.key))
  return <section className="workspace-panel region-panel" id="body-region-detail" aria-labelledby="region-title">
    <div className="region-intro"><div className="body-panel-kicker"><span className="eyebrow">Region detail / Day {assessment.day}</span><StatusBadge status={assessment.regions[regionId]} /></div><h2 id="region-title">{region.label}</h2><p className="muted">{region.about}</p></div>
    <section className="region-section" aria-labelledby="region-indicators-title"><h3 id="region-indicators-title">Indicators <span className="muted">/ {indicators.length}</span></h3>
      {indicators.length ? indicators.map(result => <IndicatorCard key={result.id} result={result} day={assessment.day} />) : <p className="muted region-empty">No numeric indicators are tracked for this region. Review reported symptoms and findings below.</p>}
    </section>
    <section className="region-section" aria-labelledby="region-findings-title"><h3 id="region-findings-title">What needs attention</h3>
      {findings.length ? findings.map(finding => <article key={finding.id} className={`body-finding body-finding-level-${finding.level}`}><span className="body-level">Level {finding.level} · {LEVEL[finding.level]}</span><h4>{finding.title}</h4><p>{finding.why}</p><ol>{finding.actions.map(action => <li key={action}>{action}</li>)}</ol></article>) : <p className="muted region-empty">No findings for this region on this day.</p>}
    </section>
    <section className="region-section" aria-labelledby="region-symptoms-title"><h3 id="region-symptoms-title">Today's symptoms</h3>
      {symptoms.length ? <ul className="body-symptoms">{symptoms.map(symptom => <li key={symptom.key}>{symptom.label}</li>)}</ul> : <p className="muted region-empty">{record ? 'No symptoms reported for this region today.' : 'No record available for this day.'}</p>}
    </section>
  </section>
}

function BodyMap({ assessment, selected, onSelect }: { assessment: Assessment; selected: BodyRegionId; onSelect: (id: BodyRegionId) => void }) {
  function region(id: BodyRegionId, shapes: ReactNode) {
    const status = assessment.regions[id]
    return <g key={id} role="button" tabIndex={0} aria-label={`${REGION_BY_ID[id].label}: ${STATUS[status].label}`} aria-pressed={selected === id} aria-controls="body-region-detail"
      className={`anatomy-region ${STATUS[status].className} ${status === 'alert' ? 'region-alert' : ''} ${selected === id ? 'region-selected' : ''}`}
      onClick={() => onSelect(id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(id) } }}>{shapes}</g>
  }
  return <svg className="body-map" viewBox="0 0 320 540" role="group" aria-label="Interactive front-view body map. Select a region to inspect its health signals.">
    {region('wholeBody', <ellipse className="region-outline radiation-halo" cx="160" cy="270" rx="142" ry="251" />)}
    <path className="body-silhouette" d="M160 45c-26 0-40 18-40 44 0 21 8 37 20 44v16l-42 12-18 72-10 88 20 5 20-83 10-25-4 98 9 160h25l10-130 10 130h25l9-160-4-98 10 25 20 83 20-5-10-88-18-72-42-12v-16c12-7 20-23 20-44 0-26-14-44-40-44Z" />
    {region('skin', <path className="region-outline skin-outline" d="M160 45c-26 0-40 18-40 44 0 21 8 37 20 44v16l-42 12-18 72-10 88 20 5 20-83 10-25-4 98 9 160h25l10-130 10 130h25l9-160-4-98 10 25 20 83 20-5-10-88-18-72-42-12v-16c12-7 20-23 20-44 0-26-14-44-40-44Z" />)}
    {region('musculoskeletal', <><path d="m99 181-12 59-9 73 11 2 18-78 9-50ZM204 181l12 59 9 73-11 2-18-78-9-50ZM125 322l8 143h10l10-137ZM195 322l-8 143h-10l-10-137Z" /><rect x="155" y="157" width="10" height="153" rx="5" /></>)}
    {region('head', <path d="M130 81c0-18 12-28 30-28s30 10 30 28v7h-60Z" />)}
    {region('eyes', <><rect x="128" y="91" width="64" height="30" rx="14" /><path className="organ-detail" d="M137 106h13m20 0h13" /></>)}
    {region('lungs', <><path d="M148 175c-18 0-28 24-27 56 0 13 11 15 27 9ZM172 175c18 0 28 24 27 56 0 13-11 15-27 9Z" /></>)}
    {region('heart', <path d="M171 220c-14-14-29 6-17 19l17 16 17-16c12-13-3-33-17-19Z" />)}
    {region('gut', <><path d="M129 266q31-14 62 0v40q-31 16-62 0Z" /><path className="organ-detail" d="M140 279h39v9h-39v10h39" /></>)}
    <text x="160" y="520" textAnchor="middle" className="body-map-label" aria-hidden="true">FRONT VIEW · SCHEMATIC</text>
  </svg>
}

export default function Body() {
  const { assessment, records, day, crewId, mission } = useMission()
  const [selected, setSelected] = useState<BodyRegionId>('head')
  const crew = mission.crew.find(member => member.id === crewId)!
  return <div className="body-layout">
    <section className="workspace-panel body-map-panel" aria-labelledby="body-map-title"><div className="panel-heading"><h2 id="body-map-title">Body systems</h2><span className="muted">{crew.name}</span></div>
      <p className="body-map-help muted">Select a region on the figure or use the labelled controls below.</p>
      <BodyMap assessment={assessment} selected={selected} onSelect={setSelected} />
      <div className="body-legend" aria-label="Status legend">{(['ok', 'watch', 'alert', 'nodata'] as const).map(status => <StatusBadge key={status} status={status} />)}</div>
      <div className="body-region-list" aria-label="Body regions">{REGIONS.map(region => <button key={region.id} aria-pressed={selected === region.id} aria-controls="body-region-detail" onClick={() => setSelected(region.id)}><span>{region.label}</span><StatusBadge status={assessment.regions[region.id]} /></button>)}</div>
      <p className="body-selection-note muted" role="status">Selected: {REGION_BY_ID[selected].label} · {STATUS[assessment.regions[selected]].label}</p>
    </section>
    <RegionPanel key={`${crewId}-${selected}`} regionId={selected} assessment={assessment} record={records.find(record => record.day === day)} />
  </div>
}
