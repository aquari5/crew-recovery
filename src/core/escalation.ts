// Escalation rules: what to do about what the data shows, and who to involve.
//
//   Level 1  Self-care           the astronaut can act alone
//   Level 2  Crew Medical Officer involve the CMO on board today
//   Level 3  Flight surgeon      contact the ground medical team
//
// Each rule looks at a pattern over several days where a single reading would be
// noise. Rules are screening aids for a trained crew, not diagnoses.

import { roundTripDelayLabel } from './catalog'
import { CAREER_DOSE_LIMIT_MSV } from './indicators'
import { personalBaseline, startReference, upTo } from './evaluate'
import { finite, mean } from './stats'
import type { DailyRecord, Finding, IndicatorId, MissionEnvironment, SymptomKey } from './types'

interface Ctx {
  hist: DailyRecord[]
  today: number
  rec: DailyRecord | undefined
  env: MissionEnvironment
  last: (n: number) => DailyRecord[]
  vals: (id: IndicatorId, n: number) => number[]
  latest: (id: IndicatorId, lookback: number) => number | null
  hasSymptom: (s: SymptomKey, n?: number) => boolean
}

type Rule = (c: Ctx) => Finding | null

const fmt = (n: number, d = 0) => n.toFixed(d)

const rules: Rule[] = [
  // ── Sleep ────────────────────────────────────────────────────────────────
  (c) => {
    const nights = c.vals('sleep', 3)
    if (nights.length < 3) return null
    const avg = mean(nights)!
    if (avg >= 6) return null
    const severe = avg < 5.5
    return {
      id: 'sleep-debt',
      level: severe ? 2 : 1,
      title: 'Sleep debt is building',
      why: `You averaged ${fmt(avg, 1)} h over the last 3 nights. Adults need 7 h or more.`,
      actions: [
        'Protect an 8-hour sleep window tonight; ask to move non-critical tasks.',
        'No caffeine in the 6 hours before sleep and dim the lights in the last hour.',
        'Use earplugs and an eye mask in your sleep station.',
        ...(severe ? ['Tell the Crew Medical Officer: fatigue this deep raises error risk in critical tasks.'] : []),
      ],
      indicators: ['sleep'],
      regions: ['head'],
      hazards: ['isolation', 'environment'],
    }
  },

  // ── Recovery (HRV / resting HR against own baseline) ─────────────────────
  (c) => {
    const base = personalBaseline(c.hist, 'hrv', c.today - 2)
    const hrv = c.vals('hrv', 3)
    const hrBase = personalBaseline(c.hist, 'restingHR', c.today - 2)
    const hr = c.vals('restingHR', 3)
    const hrvLow = base && hrv.length === 3 && hrv.every((v) => (v - base.median) / base.spread <= -1.5)
    const hrHigh = hrBase && hr.length === 3 && hr.every((v) => v - hrBase.median >= 5)
    if (!hrvLow && !hrHigh) return null
    const both = !!hrvLow && !!hrHigh
    const bits: string[] = []
    if (hrvLow) bits.push(`HRV has been below your normal (${fmt(base!.median)} ms) for 3 days`)
    if (hrHigh) bits.push(`resting heart rate has been 5+ bpm above your normal (${fmt(hrBase!.median)} bpm) for 3 days`)
    return {
      id: 'recovery-low',
      level: both ? 2 : 1,
      title: 'Your body is not recovering',
      why: `${bits.join(' and ')}. This pattern appears with sleep loss, overload, dehydration or the start of an illness.`,
      actions: [
        'Take your temperature now to rule out infection.',
        'Drink to your fluid target and eat your full planned meals today.',
        'Keep exercise light today; resume normal load when the numbers return to your range.',
        ...(both ? ['Ask the Crew Medical Officer for a check, including blood pressure.'] : []),
      ],
      indicators: ['hrv', 'restingHR'],
      regions: ['heart'],
      hazards: ['gravity', 'isolation'],
    }
  },

  // ── Blood pressure ───────────────────────────────────────────────────────
  (c) => {
    const sys = c.latest('bpSys', 1)
    const dia = c.latest('bpDia', 1)
    if (sys == null && dia == null) return null
    if ((sys ?? 0) >= 180 || (dia ?? 0) >= 120) {
      return {
        id: 'bp-crisis',
        level: 3,
        title: 'Very high blood pressure',
        why: `Latest reading ${sys ?? '—'}/${dia ?? '—'} mmHg is in the hypertensive crisis range (180/120 or above).`,
        actions: [
          'Rest for 5 minutes and repeat the measurement.',
          'If it is still this high, call the Crew Medical Officer immediately.',
          'Report chest pain, shortness of breath, vision change or severe headache at once.',
        ],
        indicators: ['bpSys', 'bpDia'],
        regions: ['heart'],
        hazards: ['gravity'],
      }
    }
    const s5 = c.vals('bpSys', 5)
    const d5 = c.vals('bpDia', 5)
    const highDays = Math.max(s5.filter((v) => v >= 140).length, d5.filter((v) => v >= 90).length)
    if (highDays >= 3) {
      return {
        id: 'bp-high',
        level: 2,
        title: 'Blood pressure is persistently high',
        why: `${highDays} of your last 5 readings were 140/90 mmHg or above.`,
        actions: [
          'Measure twice a day for the next 3 days, always after 5 minutes of rest.',
          'Choose lower-sodium menu items and keep up aerobic exercise.',
          'Show the readings to the Crew Medical Officer and include them in the next medical conference.',
        ],
        indicators: ['bpSys', 'bpDia'],
        regions: ['heart'],
        hazards: ['gravity'],
      }
    }
    if (sys != null && sys <= 90) {
      return {
        id: 'bp-low',
        level: c.hasSymptom('dizziness', 2) ? 2 : 1,
        title: 'Blood pressure is low',
        why: `Latest systolic reading is ${sys} mmHg.`,
        actions: [
          'Drink 500 ml of fluid and add an electrolyte drink.',
          'Repeat the measurement in 30 minutes.',
          'If you feel dizzy or faint, stop work, restrain yourself and call the Crew Medical Officer.',
        ],
        indicators: ['bpSys'],
        regions: ['heart'],
        hazards: ['gravity'],
      }
    }
    return null
  },

  // ── Oxygen ───────────────────────────────────────────────────────────────
  (c) => {
    const v = c.latest('spo2', 0)
    if (v == null || v >= 92) return null
    return {
      id: 'spo2-low',
      level: 3,
      title: 'Blood oxygen is low',
      why: `SpO₂ is ${v}%. Normal is 95% or above.`,
      actions: [
        'Re-measure on a warm finger while resting.',
        'Check the cabin oxygen and pressure readings and alert the crew.',
        'If it stays below 92%, start supplemental oxygen per the medical checklist and call the ground.',
      ],
      indicators: ['spo2'],
      regions: ['lungs'],
      hazards: ['environment'],
    }
  },

  // ── Fever / immune ───────────────────────────────────────────────────────
  (c) => {
    const t = c.latest('temp', 1)
    const skin = c.hasSymptom('rash', 3) || c.hasSymptom('coldSore', 3)
    const fever = t != null && t >= 38
    if (!fever && !skin) return null
    if (fever) {
      return {
        id: 'fever',
        level: t! >= 39 ? 3 : 2,
        title: 'You have a fever',
        why: `Temperature is ${fmt(t!, 1)} °C${skin ? ' together with skin symptoms' : ''}. In a closed cabin an infection can spread to the whole crew.`,
        actions: [
          'Tell the Crew Medical Officer now.',
          'Rest, drink fluids and re-measure every 4 hours.',
          'Wear a mask in shared areas and wipe down surfaces you touch.',
        ],
        indicators: ['temp'],
        regions: ['skin'],
        hazards: ['environment', 'isolation'],
      }
    }
    return {
      id: 'viral-reactivation',
      level: 1,
      title: 'Skin symptoms: possible virus reactivation',
      why: 'You logged a rash or cold sore. Stress and poor sleep in flight can wake up dormant viruses.',
      actions: [
        'Photograph the area daily so changes are visible.',
        'Do not share towels or utensils and wash your hands after touching it.',
        'Prioritise sleep for the next 3 nights. Tell the Crew Medical Officer if it spreads or you get a fever.',
      ],
      indicators: ['temp', 'sleep', 'stress'],
      regions: ['skin'],
      hazards: ['isolation', 'environment'],
    }
  },

  // ── Glucose ──────────────────────────────────────────────────────────────
  (c) => {
    const g = c.latest('glucose', 7)
    if (g == null) return null
    if (g <= 54) {
      return {
        id: 'glucose-low',
        level: 2,
        title: 'Blood glucose is dangerously low',
        why: `Fasting glucose is ${g} mg/dL (below 54 is clinically significant hypoglycemia).`,
        actions: [
          'Take 15–20 g of fast sugar now (juice or glucose gel).',
          'Re-measure after 15 minutes and repeat until above 70 mg/dL.',
          'Tell the Crew Medical Officer and do not work alone until it is stable.',
        ],
        indicators: ['glucose'],
        regions: ['gut'],
        hazards: ['distance'],
      }
    }
    const lastTwo = finite(c.hist.map((r) => r.values.glucose)).slice(-2)
    if (lastTwo.length === 2 && lastTwo.every((v) => v >= 126)) {
      return {
        id: 'glucose-high',
        level: 3,
        title: 'Fasting glucose is high twice in a row',
        why: `Your last two fasting readings were ${lastTwo.join(' and ')} mg/dL (126 or above).`,
        actions: [
          'Repeat the fasting measurement tomorrow morning.',
          'Send the readings to the flight surgeon for review.',
          'Keep daily exercise and avoid sugary drinks until advised.',
        ],
        indicators: ['glucose'],
        regions: ['gut'],
        hazards: ['gravity', 'distance'],
      }
    }
    return null
  },

  // ── Body mass / nutrition ────────────────────────────────────────────────
  (c) => {
    const m = c.latest('bodyMass', 7)
    const ref = startReference(c.hist, 'bodyMass')
    if (m == null || ref == null) return null
    const pct = (m / ref - 1) * 100
    if (pct > -5) return null
    const appetiteDays = c.last(7).filter((r) => r.journal.lowAppetite).length
    return {
      id: 'mass-loss',
      level: pct <= -10 ? 3 : 2,
      title: 'You are losing body mass',
      why: `Body mass is ${fmt(pct, 1)}% versus mission start (${fmt(ref, 1)} → ${fmt(m, 1)} kg)${appetiteDays ? `, and you logged low appetite on ${appetiteDays} of the last 7 days` : ''}.`,
      actions: [
        'Eat every planned meal today, and add one calorie-dense snack.',
        'Swap items you are tired of for others on the menu; tell the crew what you would actually eat.',
        'Review your intake with the Crew Medical Officer this week.',
      ],
      indicators: ['bodyMass'],
      regions: ['gut'],
      hazards: ['distance', 'gravity'],
    }
  },

  // ── Exercise countermeasure ──────────────────────────────────────────────
  (c) => {
    const days = c.vals('exercise', 7)
    if (days.length < 4) return null
    const avg = mean(days)!
    if (avg >= 90) return null
    const noResistive = c.last(7).filter((r) => r.journal.resistiveExercise === false).length
    return {
      id: 'exercise-low',
      level: avg < 45 ? 2 : 1,
      title: 'Not enough loading for bones and muscles',
      why: `Your 7-day exercise average is ${fmt(avg)} min/day${noResistive >= 4 ? ` with no resistive session on ${noResistive} days` : ''}. Unloaded bone loses 1–1.5% of its density per month.`,
      actions: [
        'Schedule a resistive session today, even a short one.',
        'If the resistive device is unavailable, use elastic bands and body-weight holds against restraints.',
        ...(avg < 45 ? ['Agree a replacement exercise plan with the Crew Medical Officer.'] : []),
      ],
      indicators: ['exercise'],
      regions: ['musculoskeletal'],
      hazards: ['gravity'],
    }
  },

  // ── Radiation ────────────────────────────────────────────────────────────
  (c) => {
    const d = c.latest('radiation', 0)
    if (d == null || d < 3) return null
    return {
      id: 'radiation-event',
      level: d >= 10 ? 3 : 2,
      title: d >= 10 ? 'Radiation storm: shelter now' : 'Radiation dose is elevated',
      why: `Today's dose is ${fmt(d, 1)} mSv, against a typical ${fmt(c.env.typicalDoseMsvPerDay, 1)} mSv/day here.`,
      actions: [
        'Move to the storm shelter / most shielded area and stay there until the all-clear.',
        'Keep your personal dosimeter on your body.',
        'Postpone any EVA. Log nausea, vomiting or unusual fatigue immediately.',
      ],
      indicators: ['radiation'],
      regions: ['wholeBody'],
      hazards: ['radiation'],
    }
  },
  (c) => {
    const total = finite(c.hist.map((r) => r.values.radiation)).reduce((a, b) => a + b, 0)
    const frac = total / CAREER_DOSE_LIMIT_MSV
    if (frac < 0.5) return null
    return {
      id: 'radiation-cumulative',
      level: frac >= 0.8 ? 3 : 2,
      title: 'Cumulative radiation dose is high',
      why: `You have received ${fmt(total)} mSv this mission, ${fmt(frac * 100)}% of the ${CAREER_DOSE_LIMIT_MSV} mSv career limit.`,
      actions: [
        'Sleep and rest in the most shielded area available.',
        'Ask mission planners to minimise your EVA time.',
        'Review the dose record with the flight surgeon.',
      ],
      indicators: ['radiation'],
      regions: ['wholeBody'],
      hazards: ['radiation'],
    }
  },

  // ── Cabin CO2 ────────────────────────────────────────────────────────────
  (c) => {
    const v = c.latest('co2', 0)
    if (v == null || v < 3) return null
    const headache = c.hasSymptom('headache', 2)
    return {
      id: 'co2-high',
      level: v >= 4 || headache ? 2 : 1,
      title: 'Cabin CO₂ is elevated',
      why: `Cabin CO₂ is ${fmt(v, 1)} mmHg${headache ? ' and you logged a headache' : ''}. Raised CO₂ causes headaches, poor sleep and slower thinking.`,
      actions: [
        'Tell the crew and check the CO₂ removal system.',
        'Increase ventilation where you work and sleep; avoid dead-air corners.',
        'Postpone tasks that need full concentration if you have a headache.',
      ],
      indicators: ['co2'],
      regions: ['lungs', 'head'],
      hazards: ['environment'],
    }
  },

  // ── Mood / behavioural health ────────────────────────────────────────────
  (c) => {
    const moods = c.vals('mood', 7)
    if (moods.length < 4) return null
    const low = moods.filter((m) => m <= 2).length
    if (low < 3) return null
    const contact = c.last(7).filter((r) => r.journal.familyContact).length
    return {
      id: 'mood-low',
      level: low >= 5 ? 2 : 1,
      title: 'Your mood has been low this week',
      why: `You rated your mood 2 or lower on ${low} of the last 7 days${contact <= 1 ? `, with contact with home on only ${contact} of them` : ''}.`,
      actions: [
        'Book private time today and write in your journal.',
        'Record a message for someone at home, even if the reply will be delayed.',
        'Do one thing with a crewmate that is not work: a meal, a film, the plant habitat.',
        ...(low >= 5
          ? ['Talk to the Crew Medical Officer and request a private behavioural health conference.']
          : []),
      ],
      indicators: ['mood'],
      regions: ['head'],
      hazards: ['isolation', 'distance'],
    }
  },
  (c) => {
    const s = c.vals('stress', 5)
    if (s.length < 4 || s.filter((v) => v >= 4).length < 4) return null
    return {
      id: 'stress-high',
      level: 1,
      title: 'Stress has stayed high for days',
      why: 'You rated your stress 4 or higher on at least 4 of the last 5 days.',
      actions: [
        'Tell the commander which task is driving it; ask to re-plan one item.',
        'Take 30 minutes of private time today.',
        'Do a 5-minute slow-breathing session before sleep.',
      ],
      indicators: ['stress'],
      regions: ['head'],
      hazards: ['isolation'],
    }
  },

  // ── Red-flag symptoms ────────────────────────────────────────────────────
  (c) =>
    c.hasSymptom('visionChange', 3)
      ? {
          id: 'vision-change',
          level: 3,
          title: 'Vision change: possible SANS',
          why: 'You logged blurred or changed vision. Fluid shift toward the head can alter the eye and optic nerve (Spaceflight Associated Neuro-ocular Syndrome).',
          actions: [
            'Do the vision test (acuity chart and Amsler grid) today and record the result.',
            'Ask the Crew Medical Officer for an eye ultrasound / fundus image.',
            'Send the results to the flight surgeon.',
          ],
          indicators: [],
          regions: ['eyes'],
          hazards: ['gravity'],
        }
      : null,
  (c) =>
    c.hasSymptom('legSwelling', 3)
      ? {
          id: 'clot-suspected',
          level: 3,
          title: 'Swelling or pain: rule out a blood clot',
          why: 'You logged swelling or pain in one leg or the neck. Blood flow changes in weightlessness and clots have been found in flight.',
          actions: [
            'Call the Crew Medical Officer for an ultrasound of the area today.',
            'Avoid hard exercise until it has been checked.',
            'Report chest pain or shortness of breath immediately.',
          ],
          indicators: [],
          regions: ['heart'],
          hazards: ['gravity'],
        }
      : null,
  (c) =>
    c.hasSymptom('palpitations', 2)
      ? {
          id: 'palpitations',
          level: 2,
          title: 'Irregular heartbeat reported',
          why: 'You logged palpitations. Heart rhythm changes have been observed in spaceflight.',
          actions: [
            'Sit still and record an ECG strip if the device is available.',
            'Note what you were doing, how long it lasted and any dizziness or chest pain.',
            'Show the recording to the Crew Medical Officer.',
          ],
          indicators: ['restingHR'],
          regions: ['heart'],
          hazards: ['gravity'],
        }
      : null,
]

/** Extra line for level-3 findings so the crew does not wait on a delayed link. */
function delayNote(env: MissionEnvironment): string | null {
  if (env.commDelaySec < 30) return null
  return `Ground reply takes at least ${roundTripDelayLabel(env)} round trip: start the steps above now and send the data in parallel.`
}

export function findFindings(records: DailyRecord[], today: number, env: MissionEnvironment): Finding[] {
  const hist = upTo(records, today)
  const last = (n: number) => hist.filter((r) => r.day > today - n)
  const ctx: Ctx = {
    hist,
    today,
    rec: hist.find((r) => r.day === today),
    env,
    last,
    vals: (id, n) => finite(last(n).map((r) => r.values[id])),
    latest: (id, lookback) => {
      const xs = finite(last(lookback + 1).map((r) => r.values[id]))
      return xs.length ? xs[xs.length - 1] : null
    },
    hasSymptom: (s, n = 1) => last(n).some((r) => r.symptoms.includes(s)),
  }
  const note = delayNote(env)
  const out: Finding[] = []
  for (const rule of rules) {
    const f = rule(ctx)
    if (!f) continue
    out.push(f.level === 3 && note ? { ...f, actions: [...f.actions, note] } : f)
  }
  return out.sort((a, b) => b.level - a.level)
}
