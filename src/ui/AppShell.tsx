import { useRef, useState, type KeyboardEvent } from 'react'
import { ENVIRONMENTS, roundTripDelayLabel, type MissionEnvironment } from '../core'
import Body from './screens/Body'
import Crew from './screens/Crew'
import Log from './screens/Log'
import Today from './screens/Today'
import Trends from './screens/Trends'
import { useMission } from './state'
import Timeline from './Timeline'

const TABS = ['Today', 'Body', 'Trends', 'Log', 'Crew'] as const

export default function AppShell() {
  const { mission, crewId, setCrewId, envId, setEnvId, assessment } = useMission()
  const [tab, setTab] = useState(0)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  function open(index: number) {
    setTab(index)
    window.scrollTo({ top: 0 })
  }
  function onTabKey(event: KeyboardEvent, index: number) {
    const next =
      event.key === 'ArrowRight' ? (index + 1) % TABS.length
      : event.key === 'ArrowLeft' ? (index + TABS.length - 1) % TABS.length
      : event.key === 'Home' ? 0
      : event.key === 'End' ? TABS.length - 1
      : null
    if (next === null) return
    event.preventDefault()
    setTab(next)
    tabRefs.current[next]?.focus()
  }

  return (
    <div className="app" data-status={assessment.overall}>
      <div className="backdrop" aria-hidden="true" />
      <a href="#workspace" className="skip-link">
        Skip to content
      </a>
      <header className="nav">
        <div className="wrap nav-inner">
          <div className="brand">
            <span className="brand-mark">CREW RECOVERY</span>
            <span className="brand-sub">
              {mission.name} · Ground reply {roundTripDelayLabel(mission.env)}
            </span>
          </div>
          <div className="tabs" role="tablist" aria-label="Sections">
            {TABS.map((label, index) => (
              <button
                key={label}
                ref={(element) => {
                  tabRefs.current[index] = element
                }}
                id={`tab-${label.toLowerCase()}`}
                className="tab"
                role="tab"
                aria-selected={tab === index}
                aria-controls="workspace"
                tabIndex={tab === index ? 0 : -1}
                onClick={() => open(index)}
                onKeyDown={(event) => onTabKey(event, index)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="nav-meta">
            <label className="pill-select">
              <span className="sr-only">Environment</span>
              <select value={envId} onChange={(event) => setEnvId(event.target.value as MissionEnvironment['id'])}>
                {ENVIRONMENTS.map((env) => (
                  <option value={env.id} key={env.id}>
                    {env.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="pill-select">
              <span className="sr-only">Crew member</span>
              <select value={crewId} onChange={(event) => setCrewId(event.target.value)}>
                {mission.crew.map((member) => (
                  <option value={member.id} key={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </header>

      <main id="workspace" className="wrap page" tabIndex={-1} role="tabpanel" aria-labelledby={`tab-${TABS[tab].toLowerCase()}`}>
        {/* The key restarts the entrance animation when the section changes. */}
        <div className="screen" key={tab}>
          {tab === 0 && <Today onOpenLog={() => open(3)} onOpenBody={() => open(1)} onOpenTrends={() => open(2)} />}
          {tab === 1 && <Body />}
          {tab === 2 && <Trends />}
          {tab === 3 && <Log onOpenToday={() => open(0)} />}
          {tab === 4 && <Crew onOpenToday={() => open(0)} />}
        </div>
        <div className="footnote eyebrow">
          <span>Educational prototype · Synthetic data · Not medical advice</span>
          <span>NASA Space Apps 2026</span>
        </div>
      </main>

      <Timeline onOpenToday={() => setTab(0)} />
    </div>
  )
}
