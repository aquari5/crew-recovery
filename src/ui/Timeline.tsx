import { useState } from 'react'
import type { Status } from '../core'
import { formatDate } from './format'
import MissionStory from './MissionStory'
import { useMission } from './state'
import { STORY } from './story'

const TONE: Record<Status, string> = { ok: 'var(--good)', watch: 'var(--watch)', alert: 'var(--alert)', nodata: 'var(--nodata)' }

/**
 * Floating mission timeline. Every day of the mission is one bar: colour is the
 * day's status, height is how urgent it was. Drag or use arrow keys to travel.
 */
export default function Timeline({ onOpenToday }: { onOpenToday: () => void }) {
  const { mission, day, setDay, records, timeline, setCrewId, setEnvId } = useMission()
  const [step, setStep] = useState<number | null>(null)
  const date = formatDate(records.find((record) => record.day === day)?.date)

  function goToStep(index: number) {
    setStep(index)
    setCrewId('fe1')
    setEnvId('marsTransit')
    setDay(STORY[index].day)
    onOpenToday()
  }

  return (
    <footer className="dock" aria-label="Mission timeline">
      {step !== null && <MissionStory step={step} onStep={goToStep} onClose={() => setStep(null)} />}
      <div className="dock-bar">
        <div className="dock-day">
          <span className="eyebrow">{day === mission.days ? 'Today' : 'Looking back'}</span>
          <strong>Day {day}</strong>
          <span className="eyebrow">{date}</span>
        </div>
        <div className="strip">
          <div className="strip-bars" aria-hidden="true">
            {timeline.map((t) => (
              <i
                key={t.day}
                data-now={t.day === day}
                data-past={t.day <= day}
                style={{
                  ['--c' as string]: TONE[t.status],
                  ['--h' as string]: t.level === 3 ? '100%' : t.status === 'alert' ? '74%' : t.status === 'watch' ? '48%' : t.status === 'ok' ? '26%' : '14%',
                }}
              />
            ))}
          </div>
          <input
            type="range"
            min={1}
            max={mission.days}
            step={1}
            value={day}
            aria-label="Mission day"
            aria-valuetext={`Mission day ${day}, ${date}`}
            onChange={(event) => setDay(Number(event.target.value))}
          />
        </div>
        <div className="dock-actions">
          <button className="icon-button" aria-label="Previous mission day" disabled={day === 1} onClick={() => setDay(day - 1)}>
            ←
          </button>
          <button className="icon-button" aria-label="Next mission day" disabled={day === mission.days} onClick={() => setDay(day + 1)}>
            →
          </button>
          <button className="button" aria-pressed={step !== null} onClick={() => (step === null ? goToStep(0) : setStep(null))}>
            Story
          </button>
        </div>
      </div>
    </footer>
  )
}
