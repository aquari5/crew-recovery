// Space weather from real NASA data.
//
// Solar energetic particle (SEP) events are the radiation emergency of deep
// space: protons accelerated by a flare or a coronal mass ejection reach a
// spacecraft within tens of minutes. NASA's DONKI database records every event
// with the instrument that saw it and the flare it came from. This module
// turns those records into what the crew needs: is an event in progress, how
// much warning was there, and how much of it survives the trip from Earth.

import type { MissionEnvironment, Status } from './types'

/** One record of the DONKI SEP feed (only the fields used here). */
export interface DonkiSep {
  sepID: string
  /** ISO time, minutes precision, UTC. */
  eventTime: string
  instruments: { displayName: string }[] | null
  link: string
  linkedEvents: { activityID: string }[] | null
}

export interface ParticleEvent {
  id: string
  timeMs: number
  /** Spacecraft and detector, e.g. "GOES-P: SEISS >100 MeV". */
  instrument: string
  /** Measured by a detector, or predicted by a model from early electron data. */
  kind: 'measured' | 'forecast'
  /** Protons above 100 MeV pass through ordinary spacecraft walls. */
  penetrating: boolean
  link: string
  /** Start of the earliest flare NASA linked to this event, if any. */
  flareMs: number | null
}

export interface SpaceWeather {
  status: Status
  title: string
  detail: string
  actions: string[]
  /** Events that count at this moment, newest first. */
  active: ParticleEvent[]
  /** A linked flare that has been seen while its particles have not arrived yet. */
  flareMs: number | null
  /** Hours since the last measured event, or null when there is none before `now`. */
  hoursSinceLast: number | null
}

/** How long after the last detection an event is treated as still in progress. */
export const EVENT_HOURS = 24
const HOUR = 3_600_000

const parseTime = (iso: string) => Date.parse(iso.length === 17 ? iso.replace('Z', ':00Z') : iso)

export function parseDonki(raw: DonkiSep[]): ParticleEvent[] {
  return raw
    .map((r) => {
      const instrument = r.instruments?.[0]?.displayName ?? 'Unknown instrument'
      const flares = (r.linkedEvents ?? [])
        .filter((l) => l.activityID.includes('-FLR-'))
        .map((l) => Date.parse(`${l.activityID.slice(0, 19)}Z`))
        .filter(Number.isFinite)
      return {
        id: r.sepID,
        timeMs: parseTime(r.eventTime),
        instrument,
        kind: instrument.startsWith('MODEL') ? ('forecast' as const) : ('measured' as const),
        penetrating: instrument.includes('>100 MeV'),
        link: r.link,
        flareMs: flares.length ? Math.min(...flares) : null,
      }
    })
    .filter((e) => Number.isFinite(e.timeMs))
    .sort((a, b) => a.timeMs - b.timeMs)
}

const SHELTER = [
  'Move to the storm shelter or the most shielded area and stay there until the all-clear.',
  'Keep your personal dosimeter on your body and log the reading every hour.',
  'Postpone any spacewalk. Log nausea, vomiting or unusual fatigue immediately.',
]

/** What the feed means for the crew at a given moment. */
export function spaceWeatherAt(events: ParticleEvent[], nowMs: number): SpaceWeather {
  const seen = events.filter((e) => e.timeMs <= nowMs)
  const active = seen.filter((e) => nowMs - e.timeMs < EVENT_HOURS * HOUR).reverse()
  const measured = active.filter((e) => e.kind === 'measured')
  const lastMeasured = [...seen].reverse().find((e) => e.kind === 'measured')
  const hoursSinceLast = lastMeasured ? (nowMs - lastMeasured.timeMs) / HOUR : null
  // A flare NASA later tied to a particle event, seen but not yet followed by particles.
  const pending = events.find((e) => e.flareMs != null && e.flareMs <= nowMs && e.timeMs > nowMs && nowMs - e.flareMs < 6 * HOUR)

  if (measured.some((e) => e.penetrating)) {
    return {
      status: 'alert',
      title: 'Particle storm: shelter now',
      detail: 'Protons above 100 MeV are being measured. They pass through ordinary cabin walls.',
      actions: SHELTER,
      active,
      flareMs: null,
      hoursSinceLast,
    }
  }
  if (measured.length) {
    return {
      status: 'alert',
      title: 'Particle event in progress',
      detail: 'Elevated proton flux is being measured. Dose builds up for as long as it lasts.',
      actions: SHELTER,
      active,
      flareMs: null,
      hoursSinceLast,
    }
  }
  if (active.length || pending) {
    return {
      status: 'watch',
      title: pending && !active.length ? 'Strong flare seen: particles may follow' : 'Particle event forecast',
      detail: active.length
        ? 'A model predicts rising proton flux from early electron measurements. Nothing is measured yet.'
        : 'Particles from a flare can arrive within the hour. Use the time you have.',
      actions: ['Check that the route to the storm shelter is clear.', 'Finish or pause any task that cannot be left quickly.', 'Put your personal dosimeter on.'],
      active,
      flareMs: pending?.flareMs ?? null,
      hoursSinceLast,
    }
  }
  return {
    status: 'ok',
    title: 'Quiet',
    detail: hoursSinceLast == null ? 'No particle events in this period.' : `Last measured particle event ${Math.round(hoursSinceLast / 24)} days ago.`,
    actions: [],
    active: [],
    flareMs: null,
    hoursSinceLast,
  }
}

export interface WarningTime {
  /** Minutes from the start of the flare to the first measured protons. */
  flareToProtonsMin: number
  /** Minutes of that warning left when an alert sent from Earth at the flare arrives. */
  leftAfterLinkMin: number
  flareMs: number
  firstMs: number
  instrument: string
}

/**
 * The warning each storm gave: for every flare, the time until the first
 * detector measured its particles, and what remains of it after a one-way
 * trip from Earth. Fastest first.
 */
export function warningTimes(events: ParticleEvent[], env: MissionEnvironment): WarningTime[] {
  const first = new Map<number, ParticleEvent>()
  for (const e of events) {
    if (e.kind !== 'measured' || e.flareMs == null || e.timeMs <= e.flareMs) continue
    const known = first.get(e.flareMs)
    if (!known || e.timeMs < known.timeMs) first.set(e.flareMs, e)
  }
  return [...first.entries()]
    .map(([flareMs, e]) => {
      const lead = (e.timeMs - flareMs) / 60_000
      return { flareToProtonsMin: Math.round(lead), leftAfterLinkMin: Math.round(lead - env.commDelaySec / 60), flareMs, firstMs: e.timeMs, instrument: e.instrument }
    })
    .sort((a, b) => a.flareToProtonsMin - b.flareToProtonsMin)
}

/** The DONKI request for the 30 days before `now`. DEMO_KEY is NASA's public, rate-limited key. */
export function donkiUrl(now: Date): string {
  const day = (d: Date) => d.toISOString().slice(0, 10)
  return `https://api.nasa.gov/DONKI/SEP?startDate=${day(new Date(now.getTime() - 30 * 24 * HOUR))}&endDate=${day(now)}&api_key=DEMO_KEY`
}
