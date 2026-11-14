import { useRef, useState } from 'react'
import {
  CREW_REFERENCE,
  IN_FLIGHT,
  INDICATOR_BY_ID,
  REGION_BY_ID,
  SYMPTOMS,
  formatValue,
  type Assessment,
  type BodyRegionId,
  type DailyRecord,
  type IndicatorResult,
} from '../../core'
import Mannequin, { project, type Glow, type Vec3 } from '../Mannequin'
import { useMission } from '../state'
import { STATUS, StatusBadge } from '../status'
import { useReducedMotion } from '../useReducedMotion'

const LEVEL = { 1: 'Self-care', 2: 'Crew Medical Officer', 3: 'Flight surgeon' } as const
const TREND = { up: '↑ Rising', down: '↓ Falling', flat: '→ Stable', none: '' } as const

/**
 * Flat fallback figure for browsers without WebGL: a head, a torso and limbs
 * drawn as thick round-capped strokes.
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

/**
 * Each region's marker. `at` is a point on the 3D body in metres (x to the
 * viewer's right, y up from the floor, z towards the viewer); radiation has no
 * place on the body and sits beside it at a fixed spot.
 */
const SPOTS: { id: BodyRegionId; at?: Vec3; fixed?: { x: number; y: number }; side: 'left' | 'right'; label: string }[] = [
  { id: 'head', at: [-0.02, 1.72, 0.09], side: 'left', label: 'Brain & sleep' },
  { id: 'eyes', at: [0.035, 1.665, 0.1], side: 'right', label: 'Eyes' },
  { id: 'wholeBody', fixed: { x: 262, y: 122 }, side: 'right', label: 'Radiation' },
  { id: 'lungs', at: [-0.09, 1.34, 0.1], side: 'left', label: 'Air' },
  { id: 'heart', at: [0.05, 1.27, 0.11], side: 'right', label: 'Heart' },
  { id: 'gut', at: [-0.01, 1.05, 0.09], side: 'left', label: 'Nutrition' },
  { id: 'skin', at: [0.32, 1.0, 0.03], side: 'right', label: 'Immune & skin' },
  { id: 'musculoskeletal', at: [-0.1, 0.5, 0.06], side: 'left', label: 'Bones & muscle' },
]

const VIEW: [number, number, number, number] = [-96, 28, 512, 456]
const GLOW: Record<'ok' | 'watch' | 'alert', Vec3> = { ok: [0.2, 0.72, 0.55], watch: [0.95, 0.62, 0.12], alert: [0.9, 0.24, 0.27] }
const spotXY = (spot: (typeof SPOTS)[number], yaw: number) => (spot.at ? project(spot.at, yaw) : spot.fixed!)

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
  const reference = CREW_REFERENCE[result.id]
  const inFlight = IN_FLIGHT[result.id]
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
      {reference && (
        <p className="flight-ref">
          <span className="eyebrow">Measured in real crews</span>
          {reference.text}{' '}
          <a href={reference.url} target="_blank" rel="noopener noreferrer">
            {reference.source} ↗
          </a>
        </p>
      )}
      <details>
        <summary>How to measure</summary>
        <ol>
          {definition.howToMeasure.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        {inFlight && (
          <p className="flight-note">
            <strong>Flown today.</strong> {inFlight.text}{' '}
            <a href={inFlight.url} target="_blank" rel="noopener noreferrer">
              {inFlight.source} ↗
            </a>
          </p>
        )}
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
  const reducedMotion = useReducedMotion()
  const [flat, setFlat] = useState(false) // true when WebGL is not available
  const marks = useRef<(SVGGElement | null)[]>([])

  // The body glows where something needs attention, and softly where you are looking.
  const glows: Glow[] = SPOTS.filter((spot) => spot.at).map((spot) => {
    const status = assessment.regions[spot.id]
    const isSelected = selected === spot.id
    return {
      at: spot.at!,
      color: GLOW[status === 'nodata' ? 'ok' : status],
      strength: status === 'alert' ? (isSelected ? 0.9 : 0.7) : status === 'watch' ? (isSelected ? 0.8 : 0.5) : isSelected && status === 'ok' ? 0.45 : 0,
    }
  })

  /** Keep the markers on the body as it turns. Written straight to the DOM: this runs every frame. */
  function follow(yaw: number) {
    SPOTS.forEach((spot, index) => {
      const group = marks.current[index]
      if (!group || !spot.at) return
      const { x, y } = project(spot.at, yaw)
      const labelX = spot.side === 'left' ? 28 : 292
      group.querySelector('.leader')?.setAttribute('d', `M${x.toFixed(1)} ${y.toFixed(1)}L${labelX} ${project(spot.at, 0).y.toFixed(1)}`)
      group.querySelectorAll('circle').forEach((circle) => {
        circle.setAttribute('cx', x.toFixed(1))
        circle.setAttribute('cy', y.toFixed(1))
      })
    })
  }

  return (
    <div className="body-figure">
      {!flat && <Mannequin view={VIEW} glows={glows} animate={!reducedMotion} onFrame={follow} onUnsupported={() => setFlat(true)} />}
      <svg className="body-map" viewBox={VIEW.join(' ')} role="group" aria-label="Body map. Select a region to inspect its health signals.">
        <ellipse className={`figure-halo ${STATUS[halo].className}`} cx="160" cy="256" rx="128" ry="222" />
        {flat && <Figure />}
        {SPOTS.map((spot, index) => {
          const status = assessment.regions[spot.id]
          const { x, y } = spotXY(spot, 0)
          const labelX = spot.side === 'left' ? 28 : 292
          const textX = spot.side === 'left' ? labelX - 8 : labelX + 8
          return (
            <g
              key={spot.id}
              ref={(node) => {
                marks.current[index] = node
              }}
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
              <path className="leader" d={`M${x.toFixed(1)} ${y.toFixed(1)}L${labelX} ${y.toFixed(1)}`} />
              <circle className="ring" cx={x.toFixed(1)} cy={y.toFixed(1)} r="13" />
              <circle className="dot" cx={x.toFixed(1)} cy={y.toFixed(1)} r="6.5" />
              <text x={textX} y={y - 2} textAnchor={spot.side === 'left' ? 'end' : 'start'}>
                {spot.label}
              </text>
              <text x={textX} y={y + 10} textAnchor={spot.side === 'left' ? 'end' : 'start'} style={{ fill: 'var(--tone)' }}>
                {STATUS[status].label}
              </text>
              {/* Generous invisible hit area covering marker and label. */}
              <rect className="hit" x={spot.side === 'left' ? -92 : x - 18} y={y - 20} width={spot.side === 'left' ? x + 110 : 412 - x} height="40" />
            </g>
          )
        })}
      </svg>
    </div>
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
