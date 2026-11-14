// Labels and reference content for journal items, symptoms, body regions,
// hazards and mission environments.

import type {
  BodyRegionId,
  HazardId,
  JournalKey,
  MissionEnvironment,
  SymptomKey,
} from './types'

export interface JournalDef {
  key: JournalKey
  label: string
  hint: string
}

export const JOURNAL: JournalDef[] = [
  { key: 'scheduleShift', label: 'Sleep schedule shifted', hint: 'Bedtime moved by 2+ hours for operations' },
  { key: 'highWorkload', label: 'High workload', hint: 'Day ran over plan or had no real breaks' },
  { key: 'evaDay', label: 'EVA / suited operations', hint: 'Spacewalk or long suited work' },
  { key: 'caffeineLate', label: 'Caffeine in last 6 h before sleep', hint: 'Coffee, tea or caffeine tablets' },
  { key: 'screenLate', label: 'Bright screens before sleep', hint: 'Screen or bright light in the last hour' },
  { key: 'noisySleep', label: 'Noise or alarms at night', hint: 'Woken by equipment, alarms or crewmates' },
  { key: 'sleepAid', label: 'Took a sleep aid', hint: 'Any sleep medication' },
  { key: 'resistiveExercise', label: 'Resistive exercise', hint: 'Loaded bones and muscles today' },
  { key: 'familyContact', label: 'Contact with home', hint: 'Call, video or message exchange with family or friends' },
  { key: 'privateTime', label: 'Private time', hint: '30+ minutes of personal time or journaling' },
  { key: 'lowAppetite', label: 'Low appetite / skipped a meal', hint: 'Ate clearly less than planned' },
  { key: 'lowFluids', label: 'Drank less than planned', hint: 'Below your daily fluid target' },
]

export const JOURNAL_BY_KEY: Record<JournalKey, JournalDef> = Object.fromEntries(
  JOURNAL.map((j) => [j.key, j]),
) as Record<JournalKey, JournalDef>

export interface SymptomDef {
  key: SymptomKey
  label: string
  region: BodyRegionId
}

export const SYMPTOMS: SymptomDef[] = [
  { key: 'headache', label: 'Headache', region: 'head' },
  { key: 'congestion', label: 'Stuffy head / congestion', region: 'head' },
  { key: 'nausea', label: 'Nausea / motion sickness', region: 'gut' },
  { key: 'backPain', label: 'Back pain', region: 'musculoskeletal' },
  { key: 'rash', label: 'Skin rash', region: 'skin' },
  { key: 'coldSore', label: 'Cold sore', region: 'skin' },
  { key: 'visionChange', label: 'Blurred or changed vision', region: 'eyes' },
  { key: 'dizziness', label: 'Dizziness', region: 'head' },
  { key: 'palpitations', label: 'Palpitations / irregular heartbeat', region: 'heart' },
  { key: 'legSwelling', label: 'Swelling or pain in one leg or the neck', region: 'heart' },
  { key: 'fatigue', label: 'Unusual fatigue', region: 'wholeBody' },
]

export const SYMPTOM_BY_KEY: Record<SymptomKey, SymptomDef> = Object.fromEntries(
  SYMPTOMS.map((s) => [s.key, s]),
) as Record<SymptomKey, SymptomDef>

export interface RegionDef {
  id: BodyRegionId
  label: string
  /** One-paragraph explanation shown when the region is selected. */
  about: string
}

export const REGIONS: RegionDef[] = [
  {
    id: 'head',
    label: 'Brain, sleep & mood',
    about:
      'Sleep, mood, energy and stress. Isolation, workload and shifted schedules act here first, and poor sleep then spreads to every other system.',
  },
  {
    id: 'eyes',
    label: 'Eyes',
    about:
      'Fluid shifting toward the head can change the shape of the eye and the optic nerve (SANS). Report any change in vision early.',
  },
  {
    id: 'heart',
    label: 'Heart & circulation',
    about:
      'Heart rate, heart rate variability and blood pressure. Weightlessness changes how blood is distributed and how the heart works.',
  },
  {
    id: 'lungs',
    label: 'Breathing & cabin air',
    about: 'Blood oxygen and cabin CO₂. The closed cabin is your only atmosphere, so air quality shows up here.',
  },
  {
    id: 'gut',
    label: 'Nutrition & metabolism',
    about: 'Body mass, appetite and blood glucose. Under-eating and menu fatigue are common on long missions.',
  },
  {
    id: 'musculoskeletal',
    label: 'Bones & muscles',
    about:
      'Bones lose 1–1.5% of density per month without loading. Daily resistive exercise is what protects them.',
  },
  {
    id: 'skin',
    label: 'Immune system & skin',
    about:
      'Body temperature, rashes and cold sores. Stress and poor sleep weaken immune control and dormant viruses can return.',
  },
  {
    id: 'wholeBody',
    label: 'Radiation (whole body)',
    about:
      'Daily and cumulative radiation dose. Exposure adds up across the mission and across your career.',
  },
]

export const REGION_BY_ID: Record<BodyRegionId, RegionDef> = Object.fromEntries(
  REGIONS.map((r) => [r.id, r]),
) as Record<BodyRegionId, RegionDef>

export const HAZARDS: { id: HazardId; label: string; about: string }[] = [
  { id: 'radiation', label: 'Space radiation', about: 'Cosmic rays and solar particle events beyond Earth’s shielding.' },
  { id: 'isolation', label: 'Isolation & confinement', about: 'A small crew in a small space for months or years.' },
  { id: 'distance', label: 'Distance from Earth', about: 'Delayed communication, no resupply, no quick return.' },
  { id: 'gravity', label: 'Gravity fields', about: 'Weightlessness and partial gravity change bones, muscles, heart and balance.' },
  { id: 'environment', label: 'Hostile / closed environment', about: 'Cabin air, noise, light, temperature and microbes.' },
]

// Dose rates are order-of-magnitude context values: Mars transit 1.8 and Mars surface
// ~0.7 mSv/day from MSL/RAD (Zeitlin 2013, Hassler 2014); lunar surface ~1.4 mSv/day
// from Chang'e-4 LND (Zhang 2020); low Earth orbit roughly 0.5-0.8 mSv/day.
export const ENVIRONMENTS: MissionEnvironment[] = [
  { id: 'leo', label: 'Space station (low Earth orbit)', commDelaySec: 0.5, gravityG: 0, typicalDoseMsvPerDay: 0.6 },
  { id: 'lunar', label: 'Lunar surface base', commDelaySec: 1.3, gravityG: 0.165, typicalDoseMsvPerDay: 1.4 },
  { id: 'marsTransit', label: 'Mars transit vehicle', commDelaySec: 600, gravityG: 0, typicalDoseMsvPerDay: 1.8 },
  { id: 'marsSurface', label: 'Mars surface habitat', commDelaySec: 1200, gravityG: 0.38, typicalDoseMsvPerDay: 0.7 },
]

export const ENVIRONMENT_BY_ID = Object.fromEntries(ENVIRONMENTS.map((e) => [e.id, e])) as Record<
  MissionEnvironment['id'],
  MissionEnvironment
>

/** Human-readable round-trip delay, e.g. "20 min" or "3 s". */
export function roundTripDelayLabel(env: MissionEnvironment): string {
  const s = env.commDelaySec * 2
  if (s < 60) return `${Math.round(s)} s`
  return `${Math.round(s / 60)} min`
}
