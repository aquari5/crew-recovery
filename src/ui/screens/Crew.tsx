import { useMemo } from 'react'
import { crewSignals, withEntries } from '../../core'
import { useMission } from '../state'
import { StatusBadge } from '../status'
import { crewAssessments } from '../crew'
const LEVEL = { 1: 'Self-care', 2: 'Crew Medical Officer', 3: 'Flight surgeon' } as const
export default function Crew({ onOpenToday }: { onOpenToday: () => void }) {
  const { mission, day, setCrewId, revision } = useMission()
  const people = useMemo(() => crewAssessments(mission, day), [mission, day, revision])
  // What several crew members share today: the cabin, the schedule or a device is a likelier cause than each person separately.
  const shared = useMemo(
    () => crewSignals(mission.crew, Object.fromEntries(mission.crew.map((member) => [member.id, withEntries(member.id, mission.records[member.id])])), day, mission.env),
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    [mission, day, revision],
  )
  return <section aria-labelledby="crew-title"><div className="today-section-heading"><h2 id="crew-title">Crew overview</h2><span className="muted">Day {day} · {people.length} crew members</span></div>
    <p className="crew-note muted">For the Crew Medical Officer. Highest-priority findings appear first. Select a crew member to review their daily actions.</p>
    <section className="shared" aria-labelledby="shared-title">
      <div className="section-head"><h3 id="shared-title">Is it one person, or the cabin?</h3><span className="eyebrow">{shared.length ? `${shared.length} shared ${shared.length === 1 ? 'signal' : 'signals'} today` : 'Nothing shared today'}</span></div>
      {shared.length ? <div className="shared-grid">{shared.slice(0, 4).map(signal => <article className={`card shared-card ${signal.status === 'alert' ? 'status-alert' : 'status-watch'}`} key={signal.id}>
        <div className="card-head"><span className="eyebrow">{signal.affected.length} of {signal.crewSize} crew</span><StatusBadge status={signal.status} /></div>
        <h4>{signal.title}</h4><p className="muted">{signal.why}</p>
        <details><summary>Where to look first</summary><ol>{signal.actions.map(action => <li key={action}>{action}</li>)}</ol></details>
      </article>)}</div> : <p className="muted">Each finding today belongs to one person. When several crew members share a symptom or an out-of-range reading, it is listed here, because a shared cause such as air, schedule or a failed device is then more likely than separate ones.</p>}
      {shared.length > 4 && <p className="muted shared-more">{shared.length - 4} more shared {shared.length - 4 === 1 ? 'signal' : 'signals'} today.</p>}
    </section>
    <div className="crew-grid">{people.map(({ member, assessment, urgent }) => <button className={`workspace-panel crew-card ${urgent?.level === 3 ? 'crew-urgent' : ''}`} key={member.id} onClick={() => { setCrewId(member.id); onOpenToday() }} aria-label={`Open ${member.name}'s Today screen`}>
      <div className="crew-card-top"><span className="crew-avatar" aria-hidden="true">{member.name.split(' ').map(part => part[0]).join('')}</span><StatusBadge status={assessment.overall} /></div>
      <h3>{member.name}</h3><p className="muted">{member.role}</p><div className="crew-readiness"><strong>{assessment.readiness.score ?? '—'}</strong><span className="muted">{assessment.readiness.score === null ? 'Not enough readiness data' : 'Readiness / 100'}</span></div>
      <div className="crew-finding"><span className="eyebrow">{urgent ? `Level ${urgent.level} · ${LEVEL[urgent.level]}` : 'Daily actions'}</span><p>{urgent?.title ?? (assessment.overall === 'nodata' ? 'Not enough data to assess' : 'No action needed')}</p></div>
      <div className="crew-card-footer"><span>{assessment.findings.length} {assessment.findings.length === 1 ? 'finding' : 'findings'}</span><span>View Today ↗</span></div>
    </button>)}</div>{!people.length && <p className="panel-body muted">No crew members available for this mission.</p>}
  </section>
}
