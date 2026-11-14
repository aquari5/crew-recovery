import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { assess, generateMission, REGIONS, INDICATOR_BY_ID } from '../../core'
import { RegionPanel } from './Body'

const mission = generateMission()

describe('Body region details', () => {
  it('shows the day-120 vision alert and symptom for Sofia', () => {
    const records = mission.records.ms1
    const assessment = assess(records, 120, mission.env)
    const html = renderToStaticMarkup(<RegionPanel regionId="eyes" assessment={assessment} record={records.find(r => r.day === 120)} />)
    expect(assessment.regions.eyes).toBe('alert')
    expect(html).toContain('status-alert')
    expect(html).toContain('Blurred or changed vision')
    for (const finding of assessment.findings.filter(f => f.regions.includes('eyes'))) {
      expect(html).toContain(finding.title)
    }
    expect(html).toContain('No numeric indicators are tracked for this region')
  })

  it.each(REGIONS.map(region => region.id))('renders the matching indicator labels for %s', regionId => {
    const records = mission.records.fe1
    const assessment = assess(records, 30, mission.env)
    const html = renderToStaticMarkup(<RegionPanel regionId={regionId} assessment={assessment} record={records.find(r => r.day === 30)} />)
    for (const result of assessment.indicators.filter(r => INDICATOR_BY_ID[r.id].region === regionId)) {
      expect(html).toContain(INDICATOR_BY_ID[result.id].label)
    }
    expect(html).toContain('Today&#x27;s symptoms')
  })

  it('shows measurement instructions and sources for heart indicators', () => {
    const assessment = assess(mission.records.fe1, 30, mission.env)
    const html = renderToStaticMarkup(<RegionPanel regionId="heart" assessment={assessment} />)
    expect(html).toContain('How to measure')
    expect(html).toContain('Why it matters in space')
    expect(html).toContain('Sources')
    expect(html).toContain('No record available for this day')
  })

  it('does not describe missing measurements as good', () => {
    const assessment = assess([], 1, mission.env)
    const html = renderToStaticMarkup(<RegionPanel regionId="heart" assessment={assessment} />)
    expect(html).toContain('status-nodata')
    expect(html).not.toContain('status-good')
  })
})
