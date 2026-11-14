// Public API of the health logic. UI code imports ONLY from here:
//
//   import { generateMission, assess, INDICATORS, type Assessment } from '../core'
//
// See docs/CORE_API.md for what each piece returns.

export type * from './types'

export { assess, topLevel } from './assess'
export { generateMission, MISSION_DAYS, type MissionData, type MissionOptions } from './mission'
export { withEntries, saveEntry, clearEntries, applyPatch, type EntryPatch } from './storage'

export {
  INDICATORS,
  INDICATOR_BY_ID,
  CAREER_DOSE_LIMIT_MSV,
  formatValue,
  type IndicatorDef,
  type Bands,
} from './indicators'

export {
  JOURNAL,
  JOURNAL_BY_KEY,
  SYMPTOMS,
  SYMPTOM_BY_KEY,
  REGIONS,
  REGION_BY_ID,
  HAZARDS,
  ENVIRONMENTS,
  ENVIRONMENT_BY_ID,
  roundTripDelayLabel,
} from './catalog'

export { evaluateIndicator, evaluateAll, series, worst } from './evaluate'
export { computeReadiness, READINESS_OK, READINESS_WATCH } from './readiness'
export { findInsights, describeInsight, MIN_GROUP } from './insights'
export { findFindings } from './escalation'
export { tasksFor, streak, dueToday } from './tasks'
