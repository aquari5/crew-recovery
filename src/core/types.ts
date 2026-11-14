// Shared data contracts. UI code imports types from here (via src/core/index.ts)
// and never re-declares them.

/** Traffic-light status. `nodata` is NOT the same as `ok`: nothing was measured. */
export type Status = 'ok' | 'watch' | 'alert' | 'nodata'

export type IndicatorId =
  | 'sleep'
  | 'restingHR'
  | 'hrv'
  | 'bpSys'
  | 'bpDia'
  | 'spo2'
  | 'temp'
  | 'glucose'
  | 'bodyMass'
  | 'exercise'
  | 'radiation'
  | 'co2'
  | 'mood'
  | 'energy'
  | 'stress'

/** Behaviours / exposures the astronaut logs once a day (yes/no). */
export type JournalKey =
  | 'scheduleShift'
  | 'highWorkload'
  | 'evaDay'
  | 'caffeineLate'
  | 'screenLate'
  | 'noisySleep'
  | 'sleepAid'
  | 'resistiveExercise'
  | 'familyContact'
  | 'privateTime'
  | 'lowAppetite'
  | 'lowFluids'

export type SymptomKey =
  | 'headache'
  | 'congestion'
  | 'nausea'
  | 'backPain'
  | 'rash'
  | 'coldSore'
  | 'visionChange'
  | 'dizziness'
  | 'palpitations'
  | 'legSwelling'
  | 'fatigue'

/**
 * One mission day for one crew member.
 *
 * Timing convention: `sleep`, `restingHR`, `hrv` describe the night that ENDED on
 * the morning of this day. `journal` describes what happened DURING this day.
 * So a behaviour on day N shows up in the body metrics of day N+1.
 */
export interface DailyRecord {
  /** Mission day, 1-based. */
  day: number
  /** ISO date, YYYY-MM-DD. */
  date: string
  /** Missing key = not measured. Never store 0 for "not measured". */
  values: Partial<Record<IndicatorId, number>>
  /** Missing key = not logged. */
  journal: Partial<Record<JournalKey, boolean>>
  symptoms: SymptomKey[]
  note?: string
}

export interface CrewMember {
  id: string
  name: string
  role: string
}

export type BodyRegionId =
  | 'head'
  | 'eyes'
  | 'heart'
  | 'lungs'
  | 'gut'
  | 'musculoskeletal'
  | 'skin'
  | 'wholeBody'

/** The five hazards of human spaceflight (NASA Human Research Program). */
export type HazardId =
  | 'radiation'
  | 'isolation'
  | 'distance'
  | 'gravity'
  | 'environment'

/** How a value is obtained, which drives the "measurements due" prompts. */
export type Cadence = 'wearable' | 'daily' | 'weekly' | 'ambient'

export type TrendDir = 'up' | 'down' | 'flat' | 'none'

export interface Baseline {
  /** Median of the personal reference window. */
  median: number
  /** Robust spread (scaled MAD), floored per indicator. */
  spread: number
  /** Number of data points the baseline is built from. */
  n: number
}

export interface IndicatorResult {
  id: IndicatorId
  /** Value used for the assessment, or null when nothing recent exists. */
  value: number | null
  /** Mission day the value comes from (may be older than today for weekly items). */
  valueDay: number | null
  status: Status
  /** Plain-language reasons for the status, most important first. */
  reasons: string[]
  baseline: Baseline | null
  /** Robust z-score against the personal baseline; null without a baseline. */
  z: number | null
  /** 7-day direction; `none` means not enough data, not "stable". */
  trend: { dir: TrendDir; delta: number }
}

export interface Readiness {
  /** 0-100, or null when sleep or every recovery signal is missing. */
  score: number | null
  status: Status
  parts: { key: 'sleep' | 'hrv' | 'restingHR' | 'subjective'; score: number; weight: number }[]
}

/** 1 = handle it yourself, 2 = involve the Crew Medical Officer, 3 = contact flight surgeons. */
export type EscalationLevel = 1 | 2 | 3

export interface Finding {
  id: string
  level: EscalationLevel
  title: string
  /** What the data shows, with numbers. */
  why: string
  /** Concrete steps, in order. */
  actions: string[]
  indicators: IndicatorId[]
  regions: BodyRegionId[]
  hazards: HazardId[]
}

export interface Insight {
  behavior: JournalKey
  metric: IndicatorId
  /** Mean of the metric the day after the behaviour minus the mean without it. */
  diff: number
  meanWith: number
  meanWithout: number
  nWith: number
  nWithout: number
  /** Cohen's d. */
  effect: number
  strength: 'moderate' | 'strong'
  /** True when the change goes in the healthy direction. */
  good: boolean
  /** True when both groups have a solid sample (>= 10 days). */
  solid: boolean
}

export interface DailyTask {
  id: string
  label: string
  done: boolean
  points: number
}

export interface MissionEnvironment {
  id: 'leo' | 'lunar' | 'marsTransit' | 'marsSurface'
  label: string
  /** One-way communication delay in seconds. */
  commDelaySec: number
  gravityG: number
  /** Typical background dose in mSv/day (order of magnitude, for context). */
  typicalDoseMsvPerDay: number
}

export interface Assessment {
  day: number
  date: string
  overall: Status
  readiness: Readiness
  indicators: IndicatorResult[]
  findings: Finding[]
  regions: Record<BodyRegionId, Status>
  insights: Insight[]
  tasks: DailyTask[]
  /** Consecutive days (ending today or yesterday) with a complete daily check-in. */
  streak: number
  points: number
  radiation: { cumulativeMsv: number; careerLimitMsv: number; fractionOfLimit: number }
  /** Indicators whose measurement is due today. */
  due: IndicatorId[]
}
