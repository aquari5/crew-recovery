import { useState } from 'react'
import type { Assessment, Finding, Readiness, Status } from '../../core'
import { useMission } from '../state'
import { STATUS, StatusBadge } from '../status'
import './Today.css'

const SUMMARY: Record<Status, string> = {
  ok: 'Your health signals are within their expected ranges.',
  watch: 'Some health signals need your attention today.',
  alert: 'Health signals need action. Review the priorities below.',
  nodata: 'Not enough recent data to assess your health.',
}
const PARTS = [
  { key: 'sleep', label: 'Sleep' },
  { key: 'hrv', label: 'HRV' },
  { key: 'restingHR', label: 'Resting HR' },
  { key: 'subjective', label: 'How you feel' },
] as const
const LEVEL = { 1: 'Self-care', 2: 'Crew Medical Officer', 3: 'Flight surgeon' } as const

function ReadinessPanel({ readiness, overall }: { readiness: Readiness; overall: Status }) {
  const score = readiness.score
  const status = score === null ? 'nodata' : readiness.status
  return <section className="workspace-panel today-readiness" aria-labelledby="readiness-title">
    <div className="panel-heading"><h2 id="readiness-title">Daily readiness</h2><span className="eyebrow">Recovery / 100</span></div>
    <div className="readiness-overview">
      <div className={`readiness-ring ${STATUS[status].className}`} role="img" aria-label={score === null ? 'Readiness: not enough data' : `Readiness: ${score} out of 100, ${STATUS[status].label}`}>
        <svg viewBox="0 0 200 200" aria-hidden="true"><circle className="ring-track" cx="100" cy="100" r="86" /><circle className="ring-value" cx="100" cy="100" r="86" pathLength="100" strokeDasharray="100" strokeDashoffset={100 - (score ?? 0)} /></svg>
        <div className="ring-label" aria-hidden="true"><strong>{score ?? '—'}</strong><span>{score === null ? 'Not enough data' : 'Readiness'}</span></div>
      </div>
      <div className="readiness-summary"><StatusBadge status={overall} /><h3>{SUMMARY[overall]}</h3><p className="muted">Based on sleep, heart signals and how you feel. Review individual findings even when your readiness is good.</p></div>
    </div>
    <div className="readiness-parts">{PARTS.map(({ key, label }) => {
      const part = readiness.parts.find(item => item.key === key)
      return <div className="readiness-part" key={key}><div className="part-heading"><span>{label}</span><span className="muted">{part ? `${Math.round(part.score)} / 100` : 'No data'}</span></div>
        {part ? <progress max={100} value={part.score} aria-label={`${label} readiness`} /> : <div className="part-empty" aria-hidden="true" />}
      </div>
    })}</div>
  </section>
}

function FindingCard({ finding }: { finding: Finding }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  return <article className={`workspace-panel action-card action-level-${finding.level}`}>
    <div className="action-heading"><span className="level-chip"><span aria-hidden="true">{finding.level === 3 ? '!' : finding.level === 2 ? '+' : '○'}</span> Level {finding.level} · {LEVEL[finding.level]}</span><h3>{finding.title}</h3><p className="muted">{finding.why}</p></div>
    <ol className="action-checklist">{finding.actions.map((action, index) => <li key={`${index}-${action}`}><label className="action-step"><input type="checkbox" checked={!!checked[`${index}-${action}`]} onChange={event => setChecked(previous => ({ ...previous, [`${index}-${action}`]: event.target.checked }))} /><span><span className="step-number">{index + 1}.</span> {action}</span></label></li>)}</ol>
  </article>
}

export function TodayView({ assessment, onOpenLog, checklistScope = '' }: { assessment: Assessment; onOpenLog: () => void; checklistScope?: string }) {
  const { tasks, findings, streak, points } = assessment
  const done = tasks.filter(task => task.done).length
  const earned = tasks.filter(task => task.done).reduce((total, task) => total + task.points, 0)
  const available = tasks.reduce((total, task) => total + task.points, 0)
  return <div className="today-screen">
    <ReadinessPanel readiness={assessment.readiness} overall={assessment.overall} />
    <section aria-labelledby="actions-title"><div className="today-section-heading"><h2 id="actions-title">What to do</h2><span className="muted">{findings.length} {findings.length === 1 ? 'finding' : 'findings'}</span></div>
      {findings.length ? <><div className="action-cards">{[...findings].sort((a, b) => b.level - a.level).map(finding => <FindingCard key={`${checklistScope}-${assessment.day}-${finding.id}-${JSON.stringify(finding.actions)}`} finding={finding} />)}</div><p className="action-note muted">Tick off steps as you complete them. These checkmarks are temporary and do not change your health assessment.</p></> : <div className="workspace-panel calm-state"><span className="calm-icon" aria-hidden="true">✓</span><div><h3>Nothing needs action today</h3><p className="muted">{assessment.overall === 'nodata' ? 'Add your check-in to give the assessment more information.' : 'Keep up your routine and complete your daily check-in.'}</p></div></div>}
    </section>
    <section className="workspace-panel" aria-labelledby="checkin-title"><div className="panel-heading"><h2 id="checkin-title">Today's check-in</h2><span className="eyebrow">{streak}-day streak</span></div>
      <div className="checkin-progress"><div><span>{done} of {tasks.length} complete</span><span className="muted">{earned} / {available} points today</span></div><progress value={done} max={Math.max(1, tasks.length)} aria-label="Daily check-in completion" /></div>
      {tasks.length ? <ul className="checkin-list">{tasks.map(task => <li key={task.id}>{task.done ? <div className="checkin-row"><span className="task-marker task-done" aria-hidden="true">✓</span><span>{task.label}<small className="muted">Completed</small></span><span className="task-points">+{task.points} pts</span></div> : <button className="checkin-row checkin-link" onClick={onOpenLog} aria-label={`${task.label}, not complete, ${task.points} points. Open Log`}><span className="task-marker" aria-hidden="true">○</span><span>{task.label}<small className="muted">Open Log <span aria-hidden="true">↗</span></small></span><span className="task-points">+{task.points} pts</span></button>}</li>)}</ul> : <p className="panel-body muted">No check-in tasks for this day.</p>}
      <div className="panel-footer"><span className="muted">Recorded activity determines check-in completion.</span><strong>{points.toLocaleString('en-US')} total points</strong></div>
    </section>
  </div>
}

export default function Today({ onOpenLog }: { onOpenLog: () => void }) {
  const { assessment, crewId, day, envId } = useMission()
  // Never carry action checkmarks into another person's or day's assessment.
  return <TodayView checklistScope={`${envId}-${crewId}-${day}`} assessment={assessment} onOpenLog={onOpenLog} />
}
