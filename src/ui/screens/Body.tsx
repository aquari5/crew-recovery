import { useState } from 'react'
import {
  INDICATOR_BY_ID,
  REGION_BY_ID,
  SYMPTOMS,
  formatValue,
  type Assessment,
  type BodyRegionId,
  type DailyRecord,
  type IndicatorResult,
} from '../../core'
import { useMission } from '../state'
import { STATUS, StatusBadge } from '../status'

const LEVEL = { 1: 'Self-care', 2: 'Crew Medical Officer', 3: 'Flight surgeon' } as const
const TREND = { up: '↑ Rising', down: '↓ Falling', flat: '→ Stable', none: '' } as const

/**
 * Stylised figure built from a few rounded shapes: a head, a torso and limbs
 * drawn as thick round-capped strokes. Deliberately a pictogram, not anatomy.
 */
function Figure() {
  return (
    <g className="figure">
      <defs>
        <linearGradient id="figure-tone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9eef5" />
          <stop offset="1" stopColor="#cdd6e3" />
        </linearGradient>
      </defs>
      {/* limbs */}
      <path className="limb" strokeWidth="23" d="M99 154Q82 214 78 262L72 322" />
      <path className="limb" strokeWidth="23" d="M221 154Q238 214 242 262L248 322" />
      <path className="limb" strokeWidth="36" d="M138 292L134 384L132 456" />
      <path className="limb" strokeWidth="36" d="M182 292L186 384L188 456" />
      {/* torso, neck, head */}
      <path className="mass" d="M128 124Q160 115 192 124Q214 129 213 154L206 246Q204 272 209 304L111 304Q116 272 114 246L107 154Q106 129 128 124Z" />
      <rect className="mass" x="147" y="100" width="26" height="30" rx="10" />
      <ellipse className="mass" cx="160" cy="74" rx="27" ry="32" />
    </g>
  )
}

/** Where each region's marker sits on the figure and which side its label goes. */
const SPOTS: { id: BodyRegionId; x: number; y: number; side: 'left' | 'right'; label: string }[] = [
  { id: 'head', x: 160, y: 62, side: 'left', label: 'Brain & sleep' },
  { id: 'eyes', x: 171, y: 80, side: 'right', label: 'Eyes' },
  { id: 'wholeBody', x: 262, y: 122, side: 'right', label: 'Radiation' },
  { id: 'lungs', x: 136, y: 168, side: 'left', label: 'Air' },
  { id: 'heart', x: 176, y: 186, side: 'right', label: 'Heart' },
  { id: 'gut', x: 160, y: 252, side: 'left', label: 'Nutrition' },
  { id: 'skin', x: 242, y: 262, side: 'right', label: 'Immune & skin' },
  { id: 'musculoskeletal', x: 135, y: 384, side: 'left', label: 'Bones & muscle' },
]

function Source({ source }: { source: string }) {
  const match = source.match(/https?:\/\/[^\s]+/)
  if (!match) return <span>{source}</span>
  return (
    <a href={match[0]} target="_blank" rel="noopener noreferrer">
      {source.slice(0, match.index).replace(/\s*—\s*$/, '') || match[0]} ↗
    </a>
  )
}

function IndicatorCard({ result, day }: { result: IndicatorResult; day: number }) {
  const definition = INDICATOR_BY_ID[result.id]
  return (
    <article className="body-indicator">
      <div className="body-indicator-heading">
        <h4>{definition.label}</h4>
        <StatusBadge status={result.status} />
      </div>
      <div className="body-reading">
        <strong>{formatValue(result.id, result.value)}</strong>
        {result.trend.dir !== 'none' && <span className="eyebrow">{TREND[result.trend.dir]}</span>}
      </div>
      {result.valueDay !== null && result.valueDay !== day && <p className="body-reading-age muted">Last measured on mission day {result.valueDay}</p>}
      <ul className="body-reasons">
        {result.reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      <details>
        <summary>How to measure</summary>
        <ol>
          {definition.howToMeasure.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </details>
      <details>
        <summary>Why it matters in space</summary>
        <p>{definition.whyInSpace}</p>
      </details>
      <details>
        <summary>Sources</summary>
        <ul>
          {definition.sources.map((source) => (
            <li key={source}>
              <Source source={source} />
            </li>
          ))}
        </ul>
      </details>
    </article>
  )
}

export function RegionPanel({ regionId, assessment, record }: { regionId: BodyRegionId; assessment: Assessment; record?: DailyRecord }) {
  const region = REGION_BY_ID[regionId]
  const indicators = assessment.indicators.filter((result) => INDICATOR_BY_ID[result.id].region === regionId)
  const findings = assessment.findings.filter((finding) => finding.regions.includes(regionId)).sort((a, b) => b.level - a.level)
  const symptoms = SYMPTOMS.filter((symptom) => symptom.region === regionId && record?.symptoms.includes(symptom.key))
  return (
    <section className="card region-panel" id="body-region-detail" aria-labelledby="region-title">
      <div className="card-head">
        <span className="eyebrow">Region · Day {assessment.day}</span>
        <StatusBadge status={assessment.regions[regionId]} />
      </div>
      <h2 className="region-title" id="region-title">
        {region.label}
      </h2>
      <p className="muted">{region.about}</p>

      {findings.length > 0 && (
        <section className="region-section" aria-labelledby="region-findings-title">
          <h3 id="region-findings-title">What needs attention</h3>
          {findings.map((finding) => (
            <article key={finding.id} className={`body-finding body-finding-level-${finding.level}`}>
              <span className="body-level">
                Level {finding.level} · {LEVEL[finding.level]}
              </span>
              <h4>{finding.title}</h4>
              <p>{finding.why}</p>
              <ol>
                {finding.actions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ol>
            </article>
          ))}
        </section>
      )}

      <section className="region-section" aria-labelledby="region-indicators-title">
        <h3 id="region-indicators-title">Indicators · {indicators.length}</h3>
        {indicators.length ? (
          indicators.map((result) => <IndicatorCard key={result.id} result={result} day={assessment.day} />)
        ) : (
          <p className="muted region-empty">No numeric indicators are tracked for this region. It is assessed from reported symptoms.</p>
        )}
      </section>

      <section className="region-section" aria-labelledby="region-symptoms-title">
        <h3 id="region-symptoms-title">Today's symptoms</h3>
        {symptoms.length ? (
          <ul className="body-symptoms">
            {symptoms.map((symptom) => (
              <li key={symptom.key}>{symptom.label}</li>
            ))}
          </ul>
        ) : (
          <p className="muted region-empty">{record ? 'No symptoms reported for this region today.' : 'No record available for this day.'}</p>
        )}
      </section>
    </section>
  )
}

function BodyMap({ assessment, selected, onSelect }: { assessment: Assessment; selected: BodyRegionId; onSelect: (id: BodyRegionId) => void }) {
  const halo = assessment.regions.wholeBody
  return (
    <svg className="body-map" viewBox="-96 28 512 456" role="group" aria-label="Body map. Select a region to inspect its health signals.">
      <ellipse className={`figure-halo ${STATUS[halo].className}`} cx="160" cy="256" rx="128" ry="222" />
      <Figure />
      {SPOTS.map((spot) => {
        const status = assessment.regions[spot.id]
        const labelX = spot.side === 'left' ? 28 : 292
        const textX = spot.side === 'left' ? labelX - 8 : labelX + 8
        return (
          <g
            key={spot.id}
            role="button"
            tabIndex={0}
            aria-label={`${REGION_BY_ID[spot.id].label}: ${STATUS[status].label}`}
            aria-pressed={selected === spot.id}
            aria-controls="body-region-detail"
            className={`hotspot ${STATUS[status].className} ${status === 'alert' ? 'is-alert' : ''} ${selected === spot.id ? 'is-selected' : ''}`}
            onClick={() => onSelect(spot.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onSelect(spot.id)
              }
            }}
          >
            <path className="leader" d={`M${spot.x} ${spot.y}H${labelX}`} />
            <circle className="ring" cx={spot.x} cy={spot.y} r="13" />
            <circle className="dot" cx={spot.x} cy={spot.y} r="6.5" />
            <text x={textX} y={spot.y - 2} textAnchor={spot.side === 'left' ? 'end' : 'start'}>
              {spot.label}
            </text>
            <text x={textX} y={spot.y + 10} textAnchor={spot.side === 'left' ? 'end' : 'start'} style={{ fill: 'var(--tone)' }}>
              {STATUS[status].label}
            </text>
            {/* Generous invisible hit area covering marker and label. */}
            <rect className="hit" x={spot.side === 'left' ? -92 : spot.x - 18} y={spot.y - 20} width={spot.side === 'left' ? spot.x + 110 : 412 - spot.x} height="40" />
          </g>
        )
      })}
    </svg>
  )
}

export default function Body() {
  const { assessment, records, day, crewId, mission } = useMission()
  const [selected, setSelected] = useState<BodyRegionId>(() => {
    // Open on the region that most needs attention.
    const order: BodyRegionId[] = SPOTS.map((spot) => spot.id)
    return order.find((id) => assessment.regions[id] === 'alert') ?? order.find((id) => assessment.regions[id] === 'watch') ?? 'head'
  })
  const crew = mission.crew.find((member) => member.id === crewId)!
  return (
    <div className="body-layout">
      <section className="card body-stage" aria-labelledby="body-map-title">
        <div className="card-head">
          <h3 id="body-map-title">Body systems</h3>
          <span className="eyebrow">
            {crew.name} · Day {day}
          </span>
        </div>
        <BodyMap assessment={assessment} selected={selected} onSelect={setSelected} />
        {/* On small screens the labels on the figure are too small to read, so the regions are also listed as chips. */}
        <div className="region-chips" role="group" aria-label="Body regions">
          {SPOTS.map((spot) => (
            <button key={spot.id} className={`region-chip ${STATUS[assessment.regions[spot.id]].className}`} aria-pressed={selected === spot.id} onClick={() => setSelected(spot.id)}>
              <i aria-hidden="true" />
              {spot.label}
            </button>
          ))}
        </div>
        <div className="body-legend" aria-label="Status legend">
          {(['ok', 'watch', 'alert', 'nodata'] as const).map((status) => (
            <StatusBadge key={status} status={status} />
          ))}
        </div>
      </section>
      <RegionPanel key={`${crewId}-${selected}`} regionId={selected} assessment={assessment} record={records.find((record) => record.day === day)} />
    </div>
  )
}
