import { useRef, useState, type KeyboardEvent } from 'react'
import { ENVIRONMENTS, roundTripDelayLabel, type MissionEnvironment } from '../core'
import { useMission } from './state'
import { StatusBadge } from './status'
import Timeline from './Timeline'
import Today from './screens/Today'
import Body from './screens/Body'
import Trends from './screens/Trends'
import Log from './screens/Log'
import Crew from './screens/Crew'
import DataPreview from './screens/DataPreview'
import MissionStory from './MissionStory'

const TABS = [
  { id: 'today', label: 'Today' },
  { id: 'body', label: 'Body' },
  { id: 'trends', label: 'Trends' },
  { id: 'log', label: 'Log' },
  { id: 'crew', label: 'Crew' },
] as const
export default function AppShell() {
  const { mission, crewId, setCrewId, envId, setEnvId, assessment, day } = useMission()
  const [tab, setTab] = useState(0)
  const [preview, setPreview] = useState(new URLSearchParams(window.location.search).has('preview'))
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const crew = mission.crew.find(member => member.id === crewId)!
  function selectTab(index: number) {
    setTab(index)
    setPreview(false)
    const url = new URL(window.location.href)
    url.searchParams.delete('preview')
    window.history.replaceState(null, '', url)
  }
  function openToday() {
    selectTab(0)
    tabRefs.current[0]?.focus()
  }
  function openLog() {
    selectTab(3)
    tabRefs.current[3]?.focus()
  }
  function onTabKey(event: KeyboardEvent, index: number) {
    let next: number
    if (event.key === 'ArrowRight') next = (index + 1) % TABS.length
    else if (event.key === 'ArrowLeft') next = (index + TABS.length - 1) % TABS.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = TABS.length - 1
    else return
    event.preventDefault()
    selectTab(next)
    tabRefs.current[next]?.focus()
  }
  function renderScreen() {
    switch (tab) {
      case 1: return <Body />
      case 2: return <Trends />
      case 3: return <Log onOpenToday={openToday} />
      case 4: return <Crew onOpenToday={openToday} />
      default: return <Today onOpenLog={openLog} />
    }
  }
  function togglePreview() {
    const url = new URL(window.location.href)
    if (preview) url.searchParams.delete('preview')
    else url.searchParams.set('preview', '')
    window.history.replaceState(null, '', url)
    setPreview(!preview)
  }
  return <div className="app-shell">
    <a href="#workspace" className="skip-link">Skip to workspace</a>
    <header className="topbar">
      <div className="topbar-inner"><div className="brand"><svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><circle cx="20" cy="20" r="15" /><path d="M6 21h8l4-9 5 17 4-8h7M20 1v5M20 34v5M1 20h5M34 20h5" /></svg><span>Crew Recovery<span className="brand-caption">CREW HEALTH SYSTEM</span></span></div>
        <div className="mission-label"><span className="eyebrow">Mission</span><span>{mission.name}</span></div>
        <span className="demo-label">Synthetic mission · Demo</span></div>
    </header>
    <div className="content-wrap">
      <section className="mission-controls" aria-label="Mission settings">
        <label className="select-field"><span className="eyebrow">Environment</span><select value={envId} onChange={event => setEnvId(event.target.value as MissionEnvironment['id'])}>{ENVIRONMENTS.map(env => <option value={env.id} key={env.id}>{env.label}</option>)}</select></label>
        <label className="select-field crew-select"><span className="eyebrow">Crew member</span><select value={crewId} onChange={event => setCrewId(event.target.value)}>{mission.crew.map(member => <option value={member.id} key={member.id}>{member.name} — {member.role}</option>)}</select></label>
        <div className="comm-status"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m4 16 4 4m-2-2 7-7m-5-7a12 12 0 0 1 12 12M8 8a8 8 0 0 1 8 8M8 12a4 4 0 0 1 4 4" /></svg><span>Ground reply: <strong>{roundTripDelayLabel(mission.env)}</strong> round trip</span></div>
      </section>
      <div className="intro"><div><p className="eyebrow">{mission.env.label} / DAY {String(day).padStart(3, '0')}</p><h1>{preview ? 'Behind the signals.' : 'Your health. Mission ready.'}</h1><p className="intro-description">{crew.name} <span className="separator">/</span> {crew.role}</p></div><button className="button preview-button" aria-pressed={preview} onClick={togglePreview}>{preview ? 'Back to workspace' : 'View data preview'} <span aria-hidden="true">↗</span></button></div>
      <div className="story-area"><MissionStory onOpenToday={openToday} /></div>
      <section className="summary-strip" aria-label="Selected day summary" aria-live="polite">
        <div className="summary-item"><span className="eyebrow">Overall status</span><StatusBadge status={assessment.overall} /></div>
        <div className="summary-item"><span className="eyebrow">Readiness</span><div className="summary-number">{assessment.readiness.score ?? '—'}<span>{assessment.readiness.score === null ? 'Not enough data' : '/ 100'}</span></div></div>
        <div className="summary-item"><span className="eyebrow">Findings</span><div className="summary-number">{assessment.findings.length}<span>to review</span></div></div>
        <div className="summary-item"><span className="eyebrow">Check-in streak</span><div className="summary-number">{assessment.streak}<span>days</span></div></div>
      </section>
      <div className="tabs" role="tablist" aria-label="Health workspace">{TABS.map((item, index) => <button key={item.id} ref={element => { tabRefs.current[index] = element }} id={`tab-${item.id}`} role="tab" aria-selected={!preview && tab === index} aria-controls="workspace" tabIndex={tab === index ? 0 : -1} onClick={() => selectTab(index)} onKeyDown={event => onTabKey(event, index)}><span className="tab-number" aria-hidden="true">0{index + 1}</span>{item.label}</button>)}</div>
      <main id="workspace" tabIndex={-1} role={preview ? undefined : 'tabpanel'} aria-labelledby={preview ? undefined : `tab-${TABS[tab].id}`} aria-label={preview ? 'Mission data preview' : undefined}>{preview ? <DataPreview /> : renderScreen()}</main>
      <div className="workspace-note"><p>Educational prototype · Synthetic data · Not medical advice.</p>{preview && <a href="?preview=reference">Original logic reference ↗</a>}</div>
    </div>
    <Timeline />
  </div>
}
