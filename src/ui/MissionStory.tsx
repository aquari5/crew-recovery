import { useState } from 'react'
import { useMission } from './state'
import './screens/Remaining.css'
export const STORY = [
  { day: 30, caption: 'A steady day: Alex has no findings and recovery is on track.' },
  { day: 44, caption: 'Shifted schedules and short nights add up to sleep debt.' },
  { day: 47, caption: 'A fever appears after the disrupted week. Involve the Crew Medical Officer.' },
  { day: 64, caption: 'Cabin CO₂ rises: the environment becomes part of the health picture.' },
  { day: 78, caption: 'A radiation storm affects the whole crew. Shelter and contact the flight surgeon.' },
  { day: 92, caption: 'Exercise equipment downtime means less loading for bones and muscles.' },
  { day: 120, caption: 'Late-mission low mood and body mass loss need attention. Check Crew for Sofia’s vision alert.' },
] as const
export default function MissionStory({ onOpenToday }: { onOpenToday: () => void }) {
  const { setCrewId, setDay, setEnvId, crewId, day, envId } = useMission()
  const [step, setStep] = useState<number | null>(null)
  function go(index: number) {
    setStep(index); setCrewId('fe1'); setEnvId('marsTransit'); setDay(STORY[index].day); onOpenToday()
  }
  const aligned = step !== null && crewId === 'fe1' && envId === 'marsTransit' && day === STORY[step].day
  if (step === null) return <button className="button" onClick={() => go(0)}>Mission story <span aria-hidden="true">→</span></button>
  return <section className="mission-story" aria-label="Guided mission story"><div aria-live="polite"><span className="eyebrow">Mission story · {step + 1} / {STORY.length} · Day {STORY[step].day}</span><p>{STORY[step].caption}</p>{!aligned && <p className="muted">You changed the mission selection. Resume this step to follow Alex’s Mars transit story.</p>}<p className="muted story-data-note">Story captions describe the original demo. Your saved entries remain applied.</p></div><div className="story-controls"><button className="button" disabled={step === 0} onClick={() => go(step - 1)}>Previous</button>{!aligned && <button className="button" onClick={() => go(step)}>Resume step</button>}{step < STORY.length - 1 ? <button className="button primary-button" onClick={() => go(step + 1)}>Next step →</button> : <button className="button primary-button" onClick={() => setStep(null)}>Finish story</button>}<button className="button" onClick={() => setStep(null)}>Close</button></div></section>
}
