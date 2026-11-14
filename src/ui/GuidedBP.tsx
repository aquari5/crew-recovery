import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type Reading = { sys: string; dia: string }
const STEPS = ['Rest', 'First reading', 'Wait', 'Second reading'] as const
const WAIT = [300, 0, 60, 0] // seconds per step; 0 = no timer

const valid = (r: Reading) => {
  const s = Number(r.sys)
  const d = Number(r.dia)
  return r.sys !== '' && r.dia !== '' && s >= 60 && s <= 260 && d >= 30 && d <= 180 && s > d
}

/**
 * Walks the astronaut through a correct blood pressure measurement:
 * 5 minutes of rest, a reading, 1 minute, a second reading. The two readings
 * go back to the log, which averages them.
 */
export default function GuidedBP({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: (first: Reading, second: Reading) => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const [step, setStep] = useState(0)
  const [left, setLeft] = useState(WAIT[0])
  const [first, setFirst] = useState<Reading>({ sys: '', dia: '' })
  const [second, setSecond] = useState<Reading>({ sys: '', dia: '' })

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  // Countdown for the timed steps. It only counts while the dialog is open.
  useEffect(() => {
    if (!open || WAIT[step] === 0 || left <= 0) return
    const id = setTimeout(() => setLeft((value) => value - 1), 1000)
    return () => clearTimeout(id)
  }, [open, step, left])

  function go(next: number) {
    setStep(next)
    setLeft(WAIT[next])
  }
  function reset() {
    go(0)
    setFirst({ sys: '', dia: '' })
    setSecond({ sys: '', dia: '' })
  }
  function close() {
    reset()
    onClose()
  }

  const timed = WAIT[step] > 0
  const reading = step === 1 ? first : second
  const setReading = step === 1 ? setFirst : setSecond
  const clock = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`

  // Rendered outside the log form so nothing in here can submit it.
  return createPortal(
    <dialog ref={ref} className="sheet sheet-narrow" aria-labelledby="bp-title" onClose={close} onClick={(event) => event.target === ref.current && close()}>
      <div className="sheet-body">
        <div className="card-head">
          <p className="eyebrow">
            Guided measurement · Step {step + 1} of {STEPS.length}
          </p>
          <button type="button" className="icon-button" aria-label="Close guided measurement" onClick={close}>
            ✕
          </button>
        </div>
        <div className="steps" aria-hidden="true">
          {STEPS.map((label, index) => (
            <i key={label} data-done={index < step} data-now={index === step} />
          ))}
        </div>
        <h2 id="bp-title">{STEPS[step] === 'Rest' ? 'Rest for five minutes' : STEPS[step] === 'Wait' ? 'Wait one minute' : STEPS[step]}</h2>

        {timed ? (
          <>
            <p className="muted" style={{ marginTop: 8 }}>
              {step === 0
                ? 'Restrain yourself, stay still and do not talk. Put the cuff on your bare upper arm, level with your heart.'
                : 'Keep the cuff on and stay still. The first reading is often higher than your true pressure.'}
            </p>
            <p className="countdown tnum" role="timer" aria-live="off">
              {clock}
            </p>
            <div className="sheet-actions">
              <button type="button" className="button primary-button" onClick={() => go(step + 1)}>
                {left === 0 ? 'Take the reading →' : 'Skip the wait →'}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="muted" style={{ marginTop: 8 }}>
              Start the monitor and enter both numbers from the display.
            </p>
            <div className="bp-inputs">
              <label>
                <span className="eyebrow">Systolic</span>
                <input type="number" inputMode="numeric" autoFocus value={reading.sys} onChange={(event) => setReading({ ...reading, sys: event.target.value })} placeholder="120" />
              </label>
              <span aria-hidden="true">/</span>
              <label>
                <span className="eyebrow">Diastolic</span>
                <input type="number" inputMode="numeric" value={reading.dia} onChange={(event) => setReading({ ...reading, dia: event.target.value })} placeholder="80" />
              </label>
              <span className="eyebrow">mmHg</span>
            </div>
            <div className="sheet-actions">
              <button type="button"
                className="button primary-button"
                disabled={!valid(reading)}
                onClick={() => {
                  if (step === 1) return go(2)
                  onDone(first, second)
                  close()
                }}
              >
                {step === 1 ? 'Next →' : 'Use these readings'}
              </button>
              <button type="button" className="button" onClick={() => go(step - 1)}>
                Back
              </button>
            </div>
          </>
        )}
      </div>
    </dialog>,
    document.body,
  )
}
