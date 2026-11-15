import { useEffect, useMemo, useRef, useState } from 'react'
import {
  SEP_2017_09,
  SEP_2024_05,
  SNAPSHOT,
  donkiUrl,
  parseDonki,
  spaceWeatherAt,
  warningTimes,
  type DonkiSep,
  type MissionEnvironment,
  type ParticleEvent,
} from '../core'
import { STATUS, StatusBadge } from './status'

const CACHE_KEY = 'crew-recovery:donki:v1'
const HOUR = 3_600_000

/** Real storms that can be replayed minute by minute. */
const REPLAYS = {
  sept2017: { label: '10 Sept 2017', raw: SEP_2017_09, from: '2017-09-10T14:30:00Z', to: '2017-09-10T22:00:00Z', about: 'X8.2 flare, the last ground-level event of that solar cycle.' },
  may2024: { label: '13 May 2024', raw: SEP_2024_05, from: '2024-05-13T07:30:00Z', to: '2024-05-13T19:30:00Z', about: 'A slower event at the end of the May 2024 storm.' },
} as const
type Mode = 'live' | keyof typeof REPLAYS

const utc = (ms: number) =>
  new Date(ms).toLocaleString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' UTC'
const clock = (ms: number) => new Date(ms).toLocaleTimeString('en-GB', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' })
const minutes = (n: number) => (n >= 120 ? `${(n / 60).toFixed(1)} h` : `${n} min`)

interface Live {
  events: DonkiSep[]
  /** When this copy was fetched from NASA; null for the copy shipped with the app. */
  fetchedAt: number | null
}

/** The last 30 days from NASA, refreshed at most once an hour, with the shipped copy as a fallback. */
function useLiveFeed(): Live {
  const [live, setLive] = useState<Live>({ events: SNAPSHOT.events, fetchedAt: null })
  useEffect(() => {
    let cancelled = false
    try {
      const saved = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as Live | null
      if (saved?.fetchedAt) {
        setLive(saved)
        if (Date.now() - saved.fetchedAt < HOUR) return
      }
    } catch {
      /* no usable copy on this device */
    }
    fetch(donkiUrl(new Date()))
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((events: unknown) => {
        if (cancelled || !Array.isArray(events)) return
        const next = { events: events as DonkiSep[], fetchedAt: Date.now() }
        setLive(next)
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(next))
        } catch {
          /* storage blocked */
        }
      })
      .catch(() => {
        /* offline or rate-limited: keep what we have */
      })
    return () => {
      cancelled = true
    }
  }, [])
  return live
}

function EventRow({ event }: { event: ParticleEvent }) {
  return (
    <li className="sw-event">
      <time>{clock(event.timeMs)}</time>
      <span>{event.instrument}</span>
      <span className={`sw-tag ${event.kind === 'forecast' ? '' : event.penetrating ? 'status-alert' : 'status-watch'}`}>
        {event.kind === 'forecast' ? 'Model forecast' : event.penetrating ? 'Measured · penetrating' : 'Measured'}
      </span>
      <a href={event.link} target="_blank" rel="noopener noreferrer" aria-label={`NASA record for ${event.instrument}`}>
        NASA record ↗
      </a>
    </li>
  )
}

/** Space weather from NASA's DONKI database: live, or a real storm replayed minute by minute. */
export default function SpaceWeather({ env }: { env: MissionEnvironment }) {
  const [mode, setMode] = useState<Mode>('live')
  const live = useLiveFeed()
  const replay = mode === 'live' ? null : REPLAYS[mode]
  const span = useMemo(() => (replay ? { from: Date.parse(replay.from), to: Date.parse(replay.to) } : null), [replay])
  const [cursor, setCursor] = useState(0) // minutes into the replay
  const [playing, setPlaying] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  const length = span ? (span.to - span.from) / 60_000 : 0

  useEffect(() => {
    if (!playing) return
    // Five minutes of the storm per tick: a whole evening in under ten seconds.
    timer.current = window.setInterval(() => {
      setCursor((value) => {
        if (value + 5 >= length) {
          setPlaying(false)
          return length
        }
        return value + 5
      })
    }, 110)
    return () => window.clearInterval(timer.current)
  }, [playing, length])

  function choose(next: Mode) {
    setMode(next)
    setCursor(0)
    setPlaying(next !== 'live')
  }

  const events = useMemo(() => parseDonki(replay ? [...replay.raw] : live.events), [replay, live.events])
  // Live mode reads the clock once per render on purpose: the status is "as of now".
  // oxlint-disable-next-line react-hooks/purity
  const now = span ? span.from + cursor * 60_000 : Date.now()
  const weather = spaceWeatherAt(events, now)
  const shown = span ? events.filter((event) => event.timeMs >= span.from - 24 * HOUR && event.timeMs <= now).reverse() : [...events].reverse()
  const warning = span ? warningTimes(events, env).find((w) => w.flareMs >= span.from && w.flareMs <= span.to) : undefined
  const linkMin = Math.round(env.commDelaySec / 60)

  return (
    <section className="section" aria-labelledby="weather-title">
      <div className="section-head">
        <h2 id="weather-title">Space weather</h2>
        <span className="eyebrow">Real data · NASA DONKI</span>
      </div>
      <div className="sw-modes" role="group" aria-label="Data shown">
        <button type="button" className="sw-mode" aria-pressed={mode === 'live'} onClick={() => choose('live')}>
          Live
        </button>
        {(Object.keys(REPLAYS) as (keyof typeof REPLAYS)[]).map((key) => (
          <button type="button" key={key} className="sw-mode" aria-pressed={mode === key} onClick={() => choose(key)}>
            Replay · {REPLAYS[key].label}
          </button>
        ))}
      </div>

      <div className="sw-grid">
        <article className={`card sw-status ${STATUS[weather.status].className}`} aria-live="polite">
          <div className="card-head">
            <span className="eyebrow">{span ? `Replay · ${utc(now)}` : `Now · ${utc(now)}`}</span>
            <StatusBadge status={weather.status} />
          </div>
          <h3 className="sw-title">{weather.title}</h3>
          <p className="muted">{weather.detail}</p>
          {weather.flareMs != null && <p className="sw-flare">Flare began at {clock(weather.flareMs)} UTC.</p>}
          {weather.actions.length > 0 && (
            <ol className="sw-actions">
              {weather.actions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ol>
          )}
          {span && (
            <div className="sw-scrub">
              <button type="button" className="button" onClick={() => (cursor >= length ? (setCursor(0), setPlaying(true)) : setPlaying(!playing))}>
                {playing ? 'Pause' : cursor >= length ? 'Play again' : 'Play'}
              </button>
              <input
                type="range"
                min={0}
                max={length}
                step={5}
                value={cursor}
                aria-label="Time in the replay"
                aria-valuetext={utc(now)}
                onChange={(event) => {
                  setPlaying(false)
                  setCursor(Number(event.target.value))
                }}
              />
            </div>
          )}
          {!span && (
            <p className="muted sw-source">
              {live.fetchedAt
                ? `Fetched from NASA at ${clock(live.fetchedAt)} UTC. Covers the last 30 days.`
                : `No connection to NASA right now: showing the copy saved with the app (${SNAPSHOT.from} to ${SNAPSHOT.to}).`}
            </p>
          )}
        </article>

        <div className="sw-side">
          {warning && (
            <div className="sw-stats">
              <div>
                <span className="eyebrow">Flare to first protons</span>
                <strong>{minutes(warning.flareToProtonsMin)}</strong>
              </div>
              <div>
                <span className="eyebrow">Alert from Earth takes</span>
                <strong>{linkMin >= 1 ? minutes(linkMin) : `${env.commDelaySec} s`}</strong>
              </div>
              <div>
                <span className="eyebrow">Warning left on arrival</span>
                <strong>{minutes(Math.max(0, warning.leftAfterLinkMin))}</strong>
              </div>
            </div>
          )}
          {replay && <p className="muted sw-about">{replay.about} Every row below is a record from NASA; nothing here is simulated.</p>}
          {shown.length ? (
            <ul className="sw-events">
              {shown.slice(0, 8).map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </ul>
          ) : (
            <p className="muted sw-about">
              {span ? 'No detections yet at this point in the replay.' : 'No solar particle events recorded in this period. Replay a real storm to see how the tool responds.'}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
