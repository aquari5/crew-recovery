import { useState, type ReactNode } from 'react'
import { HAZARDS, INDICATOR_BY_ID, describeInsight, missionOutlook, topLevel, worst, type Assessment, type Finding, type OutlookItem, type Status } from '../../core'
import { formatDate } from '../format'
import { useMission } from '../state'
import ReportDialog from '../ReportDialog'
import { STATUS, StatusBadge } from '../status'

const LEVEL = { 1: 'Self-care', 2: 'Crew Medical Officer', 3: 'Flight surgeon' } as const
const PARTS = [
  { key: 'sleep', label: 'Sleep' },
  { key: 'hrv', label: 'HRV' },
  { key: 'restingHR', label: 'Resting HR' },
  { key: 'subjective', label: 'How you feel' },
] as const

/** The one sentence the astronaut should take away, picked from the most urgent finding. */
function headline(a: Assessment): { lead: string; accent: string; lede: string } {
  const level = topLevel(a.findings)
  const first = a.findings[0]
  const more = a.findings.length > 1 ? ` ${a.findings.length - 1} more below.` : ''
  if (level === 3) return { lead: 'Call the', accent: 'ground.', lede: `${first.title}. Start the steps now and send the data in parallel.${more}` }
  if (level === 2) return { lead: 'Bring in', accent: 'your medic.', lede: `${first.title}. Involve the Crew Medical Officer today.${more}` }
  if (a.overall === 'alert') {
    const red = a.indicators.filter((i) => i.status === 'alert').map((i) => INDICATOR_BY_ID[i.id].label.toLowerCase())
    return { lead: 'Act on', accent: 'the red signals.', lede: `Outside the safe range today: ${red.join(', ') || 'see below'}. Re-measure, then follow the steps below.` }
  }
  if (level === 1) return { lead: 'Ease into', accent: 'today.', lede: `${first.title}. You can handle this yourself.${more}` }
  if (a.overall === 'nodata') return { lead: 'Check in', accent: 'to begin.', lede: 'There is not enough recent data to assess your health. Log today’s measurements.' }
  if (a.overall === 'ok') return { lead: 'Cleared', accent: 'for the day.', lede: 'Every signal is inside its reference range and your own normal. Keep the routine.' }
  return { lead: 'Keep an', accent: 'eye out.', lede: 'Nothing needs action, but some signals are outside your usual range.' }
}

function Hero({ a, date, where, onOpenLog, onOpenBody, onOpenReport }: { a: Assessment; date: string; where: string; onOpenLog: () => void; onOpenBody?: () => void; onOpenReport?: () => void }) {
  const h = headline(a)
  const score = a.readiness.score
  // One colour for the whole screen: headline, orb, backdrop and the timeline bar
  // for this day all show the day's overall status. The number is the readiness score.
  const tone = a.overall
  return (
    <section className="hero" aria-labelledby="today-headline">
      <div className={STATUS[tone].className}>
        <p className="eyebrow">
          Day {String(a.day).padStart(3, '0')} · {date}
          {where && ` · ${where}`}
        </p>
        <h1 className="display" id="today-headline">
          {h.lead} <em>{h.accent}</em>
        </h1>
        <p className="lede">{h.lede}</p>
        <div className="hero-actions">
          <button className="button primary-button" onClick={onOpenLog}>
            {a.due.length ? `Log ${a.due.length} due ${a.due.length === 1 ? 'reading' : 'readings'}` : 'Open daily log'} <span aria-hidden="true">→</span>
          </button>
          {onOpenReport && (
            <button className="button" onClick={onOpenReport}>
              Ground report
            </button>
          )}
          {onOpenBody && (
            <button className="button ghost-button" onClick={onOpenBody}>
              Body map
            </button>
          )}
        </div>
        <ul className="signals" aria-label="Readiness components">
          {PARTS.map(({ key, label }, index) => {
            const part = a.readiness.parts.find((item) => item.key === key)
            return (
              <li className="signal" key={key}>
                <span>0{index + 1}</span>
                <span>{label}</span>
                <span className="signal-bar">
                  <span style={{ transform: `scaleX(${part ? part.score / 100 : 0})` }} />
                </span>
                <b>{part ? Math.round(part.score) : '—'}</b>
              </li>
            )
          })}
        </ul>
      </div>
      <div className="orb-wrap">
        <div
          className={`orb ${STATUS[tone].className}`}
          data-status={tone}
          role="img"
          aria-label={score === null ? 'Readiness: not enough data' : `Readiness: ${score} out of 100. Overall status: ${STATUS[tone].label}`}
        >
          <span className="orb-glow" aria-hidden="true" />
          <span className="orb-core" aria-hidden="true" />
          <span className="orb-label" aria-hidden="true">
            <span className="orb-score">{score ?? '—'}</span>
            <span className="orb-caption">{score === null ? 'Not enough data' : 'Daily readiness'}</span>
            <span className="orb-status">
              <i /> {STATUS[tone].label}
            </span>
          </span>
        </div>
      </div>
    </section>
  )
}

function FindingCard({ finding }: { finding: Finding }) {
  const [checked, setChecked] = useState<Record<number, boolean>>({})
  return (
    <article className={`action-card action-level-${finding.level}`}>
      <div className="action-level">
        <b>L{finding.level}</b>
        <span className="eyebrow">{LEVEL[finding.level]}</span>
      </div>
      <div>
        <h3>{finding.title}</h3>
        <p className="why">{finding.why}</p>
        <ol className="action-checklist">
          {finding.actions.map((action, index) => (
            <li key={index}>
              <label className="action-step">
                <input
                  type="checkbox"
                  checked={!!checked[index]}
                  onChange={(event) => setChecked((previous) => ({ ...previous, [index]: event.target.checked }))}
                />
                <span>{action}</span>
              </label>
            </li>
          ))}
        </ol>
      </div>
    </article>
  )
}

export function TodayView({
  assessment,
  onOpenLog,
  onOpenBody,
  onOpenTrends,
  onOpenReport,
  children,
  checklistScope = '',
  date = '',
  where = '',
}: {
  assessment: Assessment
  onOpenLog: () => void
  onOpenBody?: () => void
  onOpenTrends?: () => void
  onOpenReport?: () => void
  /** Extra sections rendered under the main grid. */
  children?: ReactNode
  checklistScope?: string
  date?: string
  where?: string
}) {
  const { tasks, findings, streak, points, radiation, insights } = assessment
  const done = tasks.filter((task) => task.done).length
  const ordered = [...findings].sort((a, b) => b.level - a.level)
  const insight = insights[0]
  return (
    <div>
      <Hero a={assessment} date={date} where={where} onOpenLog={onOpenLog} onOpenBody={onOpenBody} onOpenReport={onOpenReport} />

      <div className="section today-grid">
        <section aria-labelledby="actions-title">
          <div className="section-head">
            <h2 id="actions-title">What to do</h2>
            <span className="eyebrow">
              {findings.length} {findings.length === 1 ? 'finding' : 'findings'}
            </span>
          </div>
          {ordered.length ? (
            <div className="action-cards stagger">
              {ordered.map((finding) => (
                // The key scopes the ticks to this person, day and finding.
                <FindingCard key={`${checklistScope}-${assessment.day}-${finding.id}`} finding={finding} />
              ))}
            </div>
          ) : (
            <div className="card calm-state">
              <span className="calm-icon" aria-hidden="true">
                ✓
              </span>
              <div>
                <h3>Nothing needs action today</h3>
                <p className="muted">
                  {assessment.overall === 'nodata' ? 'Add your check-in to give the assessment more to work with.' : 'Keep up your routine and complete your daily check-in.'}
                </p>
              </div>
            </div>
          )}
        </section>

        <aside className="side" aria-label="Daily summary">
          <section className="card" aria-labelledby="checkin-title">
            <div className="card-head">
              <h3 id="checkin-title">Today’s check-in</h3>
              <span className="eyebrow">{streak}-day streak</span>
            </div>
            <div className="checkin-progress">
              <div className="stat-row">
                <span className="stat-big">
                  {done}
                  <small>of {tasks.length}</small>
                </span>
                <span className="eyebrow">{points.toLocaleString('en-US')} total points</span>
              </div>
              <div className="meter" role="progressbar" aria-label="Daily check-in completion" aria-valuemin={0} aria-valuemax={tasks.length} aria-valuenow={done}>
                <span style={{ transform: `scaleX(${tasks.length ? done / tasks.length : 0})` }} />
              </div>
            </div>
            <ul className="checkin-list">
              {tasks.map((task) => (
                <li key={task.id}>
                  {task.done ? (
                    <div className="checkin-row">
                      <span className="task-marker task-done" aria-hidden="true">
                        ✓
                      </span>
                      <span>{task.label}</span>
                      <span className="task-points">+{task.points}</span>
                    </div>
                  ) : (
                    <button className="checkin-row checkin-link" onClick={onOpenLog} aria-label={`${task.label}, not complete, ${task.points} points. Open Log`}>
                      <span className="task-marker" aria-hidden="true" />
                      <span>{task.label}</span>
                      <span className="task-points">+{task.points}</span>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className="card" aria-labelledby="dose-title">
            <div className="card-head">
              <h3 id="dose-title">Radiation this mission</h3>
              <span className="eyebrow">Limit {radiation.careerLimitMsv} mSv</span>
            </div>
            <div className="checkin-progress">
              <span className="stat-big">
                {Math.round(radiation.cumulativeMsv)}
                <small>mSv · {Math.round(radiation.fractionOfLimit * 100)}% of career limit</small>
              </span>
              <div className="meter" role="progressbar" aria-label="Share of career radiation limit" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(radiation.fractionOfLimit * 100)}>
                <span style={{ transform: `scaleX(${Math.min(1, radiation.fractionOfLimit)})` }} />
              </div>
            </div>
          </section>

          {insight && (
            <section className="card" aria-labelledby="pattern-title">
              <div className="card-head">
                <h3 id="pattern-title">A pattern in your data</h3>
                <span className="eyebrow">{insight.strength}</span>
              </div>
              <p className="insight-quote" style={{ marginTop: 14 }}>
                {describeInsight(insight)}
              </p>
              {onOpenTrends && (
                <button className="button" style={{ marginTop: 16 }} onClick={onOpenTrends}>
                  All patterns <span aria-hidden="true">→</span>
                </button>
              )}
            </section>
          )}
        </aside>
      </div>
      {children}
    </div>
  )
}

/** Where the slow, cumulative risks are heading if nothing changes. */
function Outlook({ items, plannedDays }: { items: OutlookItem[]; plannedDays: number }) {
  return (
    <section className="section" aria-labelledby="outlook-title">
      <div className="section-head">
        <h2 id="outlook-title">Mission outlook</h2>
        <span className="eyebrow">If nothing changes · to day {plannedDays}</span>
      </div>
      <div className="outlook-grid">
        {items.map((item) => (
          <article key={item.id} className={`card outlook ${STATUS[item.status].className}`}>
            <div className="card-head">
              <span className="eyebrow">{item.title}</span>
              <StatusBadge status={item.status} />
            </div>
            <p className="outlook-value">{item.value}</p>
            <p className="muted">{item.detail}</p>
            {item.basis && (
              <details>
                <summary>How this is estimated</summary>
                <p>{item.basis}</p>
              </details>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

/** Today's signals grouped by NASA's five hazards of human spaceflight. */
function Hazards({ a }: { a: Assessment }) {
  return (
    <section className="section" aria-labelledby="hazards-title">
      <div className="section-head">
        <h2 id="hazards-title">The five hazards, today</h2>
        <span className="eyebrow">NASA Human Research Program</span>
      </div>
      <ul className="hazard-row">
        {HAZARDS.map((hazard, index) => {
          const findings = a.findings.filter((f) => f.hazards.includes(hazard.id))
          const flagged = a.indicators.filter((i) => (i.status === 'watch' || i.status === 'alert') && INDICATOR_BY_ID[i.id].hazards.includes(hazard.id))
          const status: Status = worst('ok', ...flagged.map((i) => i.status), ...findings.map((f): Status => (f.level === 1 ? 'watch' : 'alert')))
          const count = new Set([...findings.flatMap((f) => f.indicators), ...flagged.map((i) => i.id)]).size || findings.length
          return (
            <li key={hazard.id} className={`hazard ${STATUS[status].className}`}>
              <span className="eyebrow">0{index + 1}</span>
              <h3>{hazard.label}</h3>
              <p className="muted">{hazard.about}</p>
              <span className="hazard-state">
                <i aria-hidden="true" />
                {count ? `${count} ${count === 1 ? 'signal' : 'signals'} · ${STATUS[status].label}` : 'Quiet'}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default function Today({ onOpenLog, onOpenBody, onOpenTrends }: { onOpenLog: () => void; onOpenBody: () => void; onOpenTrends: () => void }) {
  const { assessment, crewId, day, envId, mission, records } = useMission()
  const [report, setReport] = useState(false)
  return (
    <TodayView
      onOpenReport={() => setReport(true)}
      checklistScope={`${envId}-${crewId}`}
      assessment={assessment}
      date={formatDate(records.find((record) => record.day === day)?.date)}
      where={mission.env.label}
      onOpenLog={onOpenLog}
      onOpenBody={onOpenBody}
      onOpenTrends={onOpenTrends}
    >
      <Outlook items={missionOutlook(records, day, mission.plannedDays)} plannedDays={mission.plannedDays} />
      <Hazards a={assessment} />
      <ReportDialog open={report} onClose={() => setReport(false)} />
    </TodayView>
  )
}
