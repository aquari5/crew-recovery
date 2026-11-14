import { STORY } from './story'

/** Caption bar for the guided mission story. The dock owns which step is active. */
export default function MissionStory({ step, onStep, onClose }: { step: number; onStep: (index: number) => void; onClose: () => void }) {
  const last = step === STORY.length - 1
  return (
    <section className="story" aria-label="Guided mission story">
      <div aria-live="polite">
        <span className="eyebrow">
          Mission story · {step + 1} / {STORY.length} · Day {STORY[step].day}
        </span>
        <p>{STORY[step].caption}</p>
      </div>
      <div className="story-controls">
        <button className="button" disabled={step === 0} onClick={() => onStep(step - 1)}>
          Back
        </button>
        {last ? (
          <button className="button primary-button" onClick={onClose}>
            Finish
          </button>
        ) : (
          <button className="button primary-button" onClick={() => onStep(step + 1)}>
            Next <span aria-hidden="true">→</span>
          </button>
        )}
        <button className="button" aria-label="Close mission story" onClick={onClose}>
          ✕
        </button>
      </div>
    </section>
  )
}
