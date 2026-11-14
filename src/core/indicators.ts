// Indicator catalogue: what we track, how to measure it, why it matters in space,
// and the absolute thresholds behind the colours.
//
// Thresholds are standard clinical reference values (see `sources`). They are
// screening aids, not diagnoses. Personal-baseline deviation (baseline.ts) is
// evaluated on top of them.

import type { BodyRegionId, Cadence, HazardId, IndicatorId } from './types'

export interface Bands {
  /** value <= alertLow -> alert */
  alertLow?: number
  /** value < watchLow -> watch */
  watchLow?: number
  /** value >= watchHigh -> watch */
  watchHigh?: number
  /** value >= alertHigh -> alert */
  alertHigh?: number
}

export interface IndicatorDef {
  id: IndicatorId
  label: string
  unit: string
  decimals: number
  cadence: Cadence
  region: BodyRegionId
  hazards: HazardId[]
  /** Which direction is unhealthy when judged against the personal baseline. */
  badDirection: 'low' | 'high' | 'both' | 'none'
  /** Absolute thresholds. Omitted when only the personal baseline is meaningful. */
  bands?: Bands
  /** Evaluate the mean of the last N days instead of a single day. */
  window?: number
  /** Evaluate percent change from the first mission week instead of the raw value. */
  relativeToStart?: boolean
  /** Smallest spread used for z-scores, so a very steady baseline does not over-trigger. */
  minSpread: number
  howToMeasure: string[]
  whyInSpace: string
  sources: string[]
}

const SRC = {
  hazards: 'NASA HRP, 5 Hazards of Human Spaceflight — https://www.nasa.gov/hrp/hazards/',
  sleepRisk:
    'NASA HRP, Risk from Inadequate Sleep and Irregular Schedules — https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/',
  cardioRisk:
    'NASA HRP, Risk of Cardiovascular Adaptations — https://www.nasa.gov/reference/risk-of-cardiovascular-adaptations/',
  boneRisk:
    'NASA HRP, Risk of Spaceflight-Induced Bone Changes — https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/',
  behaviorRisk:
    'NASA HRP, Risk of Behavioral Conditions and Psychiatric Disorders — https://www.nasa.gov/reference/risk-of-behavioral-conditions-and-psychiatric-disorders/',
  immuneRisk:
    'NASA HRP, Risk of Altered Immune System Responses — https://www.nasa.gov/reference/risk-of-altered-immune-system-responses/',
  foodRisk:
    'NASA HRP, Risk of Inadequate Food and Nutrition — https://www.nasa.gov/reference/risk-of-inadequate-food-and-nutrition/',
  radiationHazard: 'NASA HRP, Hazard: Space Radiation — https://www.nasa.gov/hrp/hazard-space-radiation/',
  aasm: 'AASM/SRS consensus: adults need 7+ hours of sleep per night (Watson et al., 2015)',
  aha: 'ACC/AHA 2017 blood pressure categories (Whelton et al., 2018)',
  ahaHr: 'AHA: normal adult resting heart rate 60–100 bpm; lower is common in fit adults',
  ada: 'ADA Standards of Care: fasting glucose <100 normal, 100–125 prediabetes, ≥126 diabetes; <70 / <54 mg/dL hypoglycemia levels 1 / 2',
  spo2: 'Standard clinical reference: SpO2 95–100% normal at sea-level pressure',
  fever: 'Standard clinical reference: fever ≥38.0 °C; hypothermia <35.0 °C',
  nasaStd: 'NASA-STD-3001 Vol. 1: career space radiation limit 600 mSv effective dose',
  rad: 'Zeitlin et al., Science 2013 (MSL/RAD): ~1.8 mSv/day during cruise to Mars',
  co2: 'Law et al., 2014 (ISS): headache risk rises with cabin CO2; NASA keeps average ppCO2 low single-digit mmHg',
}

export const INDICATORS: IndicatorDef[] = [
  {
    id: 'sleep',
    label: 'Sleep',
    unit: 'h',
    decimals: 1,
    cadence: 'wearable',
    region: 'head',
    hazards: ['isolation', 'environment'],
    badDirection: 'low',
    bands: { alertLow: 5, watchLow: 6.5 },
    minSpread: 0.4,
    howToMeasure: [
      'Wear the wrist sensor to bed; it records sleep automatically.',
      'No sensor? Enter the hours you slept when you wake up.',
    ],
    whyInSpace:
      'Shifted schedules, workload, noise and unusual light cycles cut sleep short. Sleep loss lowers alertness and weakens immune defence.',
    sources: [SRC.sleepRisk, SRC.aasm],
  },
  {
    id: 'restingHR',
    label: 'Resting heart rate',
    unit: 'bpm',
    decimals: 0,
    cadence: 'wearable',
    region: 'heart',
    hazards: ['gravity'],
    badDirection: 'high',
    bands: { alertLow: 40, watchLow: 45, watchHigh: 90, alertHigh: 100 },
    minSpread: 2,
    howToMeasure: [
      'Taken automatically by the wrist sensor during sleep.',
      'Manual: after waking, stay still for 2 minutes, count your pulse for 60 seconds.',
    ],
    whyInSpace:
      'A resting heart rate that climbs above your own normal often signals poor recovery, dehydration, stress or the start of an illness.',
    sources: [SRC.cardioRisk, SRC.ahaHr],
  },
  {
    id: 'hrv',
    label: 'Heart rate variability',
    unit: 'ms',
    decimals: 0,
    cadence: 'wearable',
    region: 'heart',
    hazards: ['gravity', 'isolation'],
    badDirection: 'low',
    minSpread: 4,
    howToMeasure: ['Taken automatically by the wrist sensor during sleep. Nothing to do.'],
    whyInSpace:
      'HRV reflects how well your nervous system is recovering. It is very individual, so it is only compared with your own baseline.',
    sources: [SRC.cardioRisk],
  },
  {
    id: 'bpSys',
    label: 'Blood pressure (systolic)',
    unit: 'mmHg',
    decimals: 0,
    cadence: 'daily',
    region: 'heart',
    hazards: ['gravity'],
    badDirection: 'both',
    bands: { alertLow: 90, watchLow: 100, watchHigh: 130, alertHigh: 140 },
    minSpread: 4,
    howToMeasure: [
      'Rest for 5 minutes, restrained and still.',
      'Put the cuff on your bare upper arm, level with your heart.',
      'Take two readings one minute apart and enter both; the app averages them.',
    ],
    whyInSpace:
      'Body fluids shift toward the head in weightlessness and the heart and vessels adapt. Low pressure raises fainting risk in gravity; high pressure strains the heart.',
    sources: [SRC.cardioRisk, SRC.aha],
  },
  {
    id: 'bpDia',
    label: 'Blood pressure (diastolic)',
    unit: 'mmHg',
    decimals: 0,
    cadence: 'daily',
    region: 'heart',
    hazards: ['gravity'],
    badDirection: 'both',
    bands: { alertLow: 55, watchLow: 60, watchHigh: 80, alertHigh: 90 },
    minSpread: 3,
    howToMeasure: ['Measured together with systolic pressure, same cuff reading.'],
    whyInSpace: 'Read together with systolic pressure to judge how hard your circulation is working.',
    sources: [SRC.cardioRisk, SRC.aha],
  },
  {
    id: 'spo2',
    label: 'Blood oxygen',
    unit: '%',
    decimals: 0,
    cadence: 'wearable',
    region: 'lungs',
    hazards: ['environment'],
    badDirection: 'low',
    bands: { alertLow: 91, watchLow: 95 },
    minSpread: 1,
    howToMeasure: [
      'Taken automatically by the wrist sensor during sleep.',
      'Manual: clip the pulse oximeter on a warm finger and hold still for 30 seconds.',
    ],
    whyInSpace:
      'Cabin pressure, oxygen level and suit operations all affect how much oxygen reaches your tissues. A drop can point to a cabin atmosphere problem.',
    sources: [SRC.spo2, SRC.hazards],
  },
  {
    id: 'temp',
    label: 'Body temperature',
    unit: '°C',
    decimals: 1,
    cadence: 'daily',
    region: 'skin',
    hazards: ['environment', 'isolation'],
    badDirection: 'high',
    bands: { alertLow: 35, watchLow: 36, watchHigh: 37.5, alertHigh: 38 },
    minSpread: 0.2,
    howToMeasure: [
      'Measure before exercise and at least 30 minutes after eating or drinking.',
      'Use the same thermometer and the same site every day.',
    ],
    whyInSpace:
      'The immune system changes in flight and dormant viruses can reactivate. Fever is the earliest objective sign of infection in a closed cabin shared by the whole crew.',
    sources: [SRC.immuneRisk, SRC.fever],
  },
  {
    id: 'glucose',
    label: 'Fasting blood glucose',
    unit: 'mg/dL',
    decimals: 0,
    cadence: 'weekly',
    region: 'gut',
    hazards: ['gravity', 'distance'],
    badDirection: 'both',
    bands: { alertLow: 54, watchLow: 70, watchHigh: 100, alertHigh: 126 },
    minSpread: 5,
    howToMeasure: [
      'Measure in the morning before eating (8+ hours fasted).',
      'Clean a fingertip, use the lancet, touch the drop to the test strip.',
    ],
    whyInSpace:
      'Reduced activity and a limited diet change how the body handles sugar. Weekly checks catch drift early, when diet and exercise can still correct it.',
    sources: [SRC.foodRisk, SRC.ada],
  },
  {
    id: 'bodyMass',
    label: 'Body mass',
    unit: 'kg',
    decimals: 1,
    cadence: 'weekly',
    region: 'gut',
    hazards: ['distance', 'gravity'],
    badDirection: 'low',
    relativeToStart: true,
    // Percent change from the first mission week.
    bands: { alertLow: -10, watchLow: -5 },
    minSpread: 0.4,
    howToMeasure: [
      'Use the body mass measurement device once a week, before breakfast.',
      'Stay rigid during the measurement; repeat if the reading is unstable.',
    ],
    whyInSpace:
      'Menu fatigue and low appetite lead to under-eating. Losing mass means losing muscle and bone reserve that cannot be resupplied on a long mission.',
    sources: [SRC.foodRisk],
  },
  {
    id: 'exercise',
    label: 'Exercise (7-day average)',
    unit: 'min/day',
    decimals: 0,
    cadence: 'daily',
    region: 'musculoskeletal',
    hazards: ['gravity'],
    badDirection: 'low',
    window: 7,
    bands: { alertLow: 45, watchLow: 90 },
    minSpread: 10,
    howToMeasure: [
      'Log the minutes of resistive and aerobic exercise after each session.',
      'Tick "resistive exercise" in the journal when you loaded bones and muscles.',
    ],
    whyInSpace:
      'Without loading, bones lose 1–1.5% of their density every month and muscles weaken. Daily resistive exercise is the main countermeasure.',
    sources: [SRC.boneRisk],
  },
  {
    id: 'radiation',
    label: 'Radiation dose (today)',
    unit: 'mSv',
    decimals: 1,
    cadence: 'ambient',
    region: 'wholeBody',
    hazards: ['radiation'],
    badDirection: 'high',
    bands: { watchHigh: 3, alertHigh: 10 },
    minSpread: 0.2,
    howToMeasure: ['Read from your personal dosimeter. Keep it on your body at all times.'],
    whyInSpace:
      'Beyond Earth’s magnetic field you are exposed to galactic cosmic rays and solar particle events. Dose adds up over the whole mission and raises cancer risk.',
    sources: [SRC.radiationHazard, SRC.rad, SRC.nasaStd],
  },
  {
    id: 'co2',
    label: 'Cabin CO₂',
    unit: 'mmHg',
    decimals: 1,
    cadence: 'ambient',
    region: 'lungs',
    hazards: ['environment'],
    badDirection: 'high',
    bands: { watchHigh: 3, alertHigh: 4 },
    minSpread: 0.2,
    howToMeasure: ['Read from the cabin atmosphere monitor (24-hour average).'],
    whyInSpace:
      'In a closed cabin CO₂ builds up when scrubbing falls behind. Raised CO₂ causes headaches, poor sleep and slower thinking.',
    sources: [SRC.co2, SRC.hazards],
  },
  {
    id: 'mood',
    label: 'Mood',
    unit: '/5',
    decimals: 0,
    cadence: 'daily',
    region: 'head',
    hazards: ['isolation', 'distance'],
    badDirection: 'low',
    bands: { alertLow: 1, watchLow: 3 },
    minSpread: 0.75,
    howToMeasure: ['Rate how you feel today from 1 (very low) to 5 (very good). Go with your first answer.'],
    whyInSpace:
      'Isolation, confinement and distance from home wear down mood over months. A daily rating makes slow drift visible before it affects sleep, teamwork and decisions.',
    sources: [SRC.behaviorRisk],
  },
  {
    id: 'energy',
    label: 'Energy',
    unit: '/5',
    decimals: 0,
    cadence: 'daily',
    region: 'head',
    hazards: ['isolation'],
    badDirection: 'low',
    bands: { alertLow: 1, watchLow: 3 },
    minSpread: 0.75,
    howToMeasure: ['Rate your energy today from 1 (exhausted) to 5 (fully charged).'],
    whyInSpace: 'Persistent low energy points to sleep debt, under-eating or overload.',
    sources: [SRC.behaviorRisk, SRC.sleepRisk],
  },
  {
    id: 'stress',
    label: 'Stress',
    unit: '/5',
    decimals: 0,
    cadence: 'daily',
    region: 'head',
    hazards: ['isolation'],
    badDirection: 'high',
    bands: { watchHigh: 4, alertHigh: 5 },
    minSpread: 0.75,
    howToMeasure: ['Rate your stress today from 1 (calm) to 5 (overwhelmed).'],
    whyInSpace:
      'Sustained stress disturbs sleep and can reactivate dormant viruses. Scheduled private time and contact with home are proven buffers.',
    sources: [SRC.behaviorRisk, SRC.immuneRisk],
  },
]

export const INDICATOR_BY_ID: Record<IndicatorId, IndicatorDef> = Object.fromEntries(
  INDICATORS.map((d) => [d.id, d]),
) as Record<IndicatorId, IndicatorDef>

/** NASA-STD-3001 career limit, effective dose. */
export const CAREER_DOSE_LIMIT_MSV = 600

export function formatValue(id: IndicatorId, value: number | null): string {
  if (value == null) return '—'
  const def = INDICATOR_BY_ID[id]
  return `${value.toFixed(def.decimals)} ${def.unit}`
}
