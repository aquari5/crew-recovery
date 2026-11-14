import { useMemo } from 'react'
import { useMission } from '../state'
import { StatusBadge } from '../status'
import { crewAssessments } from '../crew'
import './Remaining.css'
const LEVEL = { 1: 'Self-care', 2: 'Crew Medical Officer', 3: 'Flight surgeon' } as const
export default function Crew({ onOpenToday }: { onOpenToday: () => void }) {
  const { mission, day, setCrewId, revision } = useMission()
  const people = useMemo(() => crewAssessments(mission, day), [mission, day, revision])
  return <section aria-labelledby="crew-title"><div className="today-section-heading"><h2 id="crew-title">Crew overview</h2><span className="muted">Day {day} · {people.length} crew members</span></div>
    <p className="crew-note muted">For the Crew Medical Officer. Highest-priority findings appear first. Select a crew member to review their daily actions.</p>
    <div className="crew-grid">{people.map(({ member, assessment, urgent }) => <button className={`workspace-panel crew-card ${urgent?.level === 3 ? 'crew-urgent' : ''}`} key={member.id} onClick={() => { setCrewId(member.id); onOpenToday() }} aria-label={`Open ${member.name}'s Today screen`}>
      <div className="crew-card-top"><span className="crew-avatar" aria-hidden="true">{member.name.split(' ').map(part => part[0]).join('')}</span><StatusBadge status={assessment.overall} /></div>
      <h3>{member.name}</h3><p className="muted">{member.role}</p><div className="crew-readiness"><strong>{assessment.readiness.score ?? '—'}</strong><span className="muted">{assessment.readiness.score === null ? 'Not enough readiness data' : 'Readiness / 100'}</span></div>
      <div className="crew-finding"><span className="eyebrow">{urgent ? `Level ${urgent.level} · ${LEVEL[urgent.level]}` : 'Daily actions'}</span><p>{urgent?.title ?? (assessment.overall === 'nodata' ? 'Not enough data to assess' : 'No action needed')}</p></div>
      <div className="crew-card-footer"><span>{assessment.findings.length} {assessment.findings.length === 1 ? 'finding' : 'findings'}</span><span>View Today ↗</span></div>
    </button>)}</div>{!people.length && <p className="panel-body muted">No crew members available for this mission.</p>}
  </section>
}
