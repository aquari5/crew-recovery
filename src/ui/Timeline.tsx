import { useMission } from './state'

export function formatDate(date: string | undefined) {
  if (!date) return 'Date unavailable'
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${date}T00:00:00Z`))
}
export default function Timeline() {
  const { mission, day, setDay, records } = useMission()
  const date = formatDate(records.find(record => record.day === day)?.date)
  return <footer className="timeline" aria-label="Mission timeline">
    <div className="timeline-inner">
      <div className="timeline-heading"><label htmlFor="mission-day">Mission day <strong>{day}</strong> <span>· {date}</span></label>
        <span className="eyebrow">{day === mission.days ? 'Latest day' : 'Historical view'}</span></div>
      <div className="timeline-controls">
        <button className="icon-button" aria-label="Previous mission day" disabled={day === 1} onClick={() => setDay(day - 1)}>←</button>
        <div className="timeline-track"><input id="mission-day" type="range" min={1} max={mission.days} step={1} value={day}
          aria-valuetext={`Mission day ${day}, ${date}`} onChange={event => setDay(Number(event.target.value))} />
          <div className="timeline-ends" aria-hidden="true"><span>DAY 01</span><span>DAY {mission.days}</span></div></div>
        <button className="icon-button" aria-label="Next mission day" disabled={day === mission.days} onClick={() => setDay(day + 1)}>→</button>
        <button className="button" onClick={() => setDay(mission.days)}>Today</button>
      </div>
    </div>
  </footer>
}
