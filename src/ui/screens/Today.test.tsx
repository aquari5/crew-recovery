import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { assess, generateMission } from '../../core'
import { TodayView } from './Today'

const mission = generateMission()
const onOpenLog = () => {}
const at = (day: number) => assess(mission.records.fe1, day, mission.env)

describe('Today screen', () => {
  it('shows the calm state on mission day 30', () => {
    const html = renderToStaticMarkup(<TodayView assessment={at(30)} onOpenLog={onOpenLog} />)
    expect(html).toContain('Nothing needs action today')
    expect(html).toContain('Daily readiness')
  })

  it.each([
    [44, 'Sleep debt is building'],
    [47, 'You have a fever'],
    [78, 'Radiation storm: shelter now'],
    [120, 'You are losing body mass'],
    [120, 'Your mood has been low this week'],
  ])('renders the expected finding on day %i', (day, title) => {
    const html = renderToStaticMarkup(<TodayView assessment={at(day)} onOpenLog={onOpenLog} />)
    expect(html).toContain(title)
  })

  it('renders missing readiness as missing, never as zero or Good', () => {
    const assessment = assess([], 1, mission.env)
    const html = renderToStaticMarkup(<TodayView assessment={assessment} onOpenLog={onOpenLog} />)
    expect(html).toContain('Readiness: not enough data')
    expect(html).toContain('status-nodata')
    expect(html).not.toContain('Readiness: 0 out of 100')
    expect(html).not.toContain('status-good')
  })

  it('shows flight-surgeon escalation and ordered checkboxes for the radiation event', () => {
    const html = renderToStaticMarkup(<TodayView assessment={at(78)} onOpenLog={onOpenLog} />)
    expect(html).toContain('action-level-3')
    expect(html).toContain('Flight surgeon')
    expect(html).toContain('type="checkbox"')
    expect(html).toContain('action-checklist')
  })

  it('links unfinished check-in tasks to Log and shows earned points', () => {
    const assessment = at(120)
    const html = renderToStaticMarkup(<TodayView assessment={assessment} onOpenLog={onOpenLog} />)
    for (const task of assessment.tasks.filter(task => !task.done)) {
      expect(html).toContain(`${task.label}, not complete, ${task.points} points. Open Log`)
    }
    expect(html).toContain(`${assessment.points.toLocaleString('en-US')} total points`)
  })
})
