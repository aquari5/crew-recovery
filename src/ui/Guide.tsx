import { useEffect, useRef } from 'react'

const SEEN_KEY = 'crew-recovery:guide-seen:v1'

/** True until the guide has been closed once on this device. */
export function isFirstVisit(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === null
  } catch {
    return false // storage blocked: do not nag on every load
  }
}

const STEPS: { title: string; text: string }[] = [
  { title: 'Today', text: 'Start here each morning. The headline and its colour say whether to carry on, take care, or involve someone, and the cards below list what to do.' },
  { title: 'Timeline', text: 'Drag the strip at the bottom to revisit any mission day. Story walks through the key moments of the demo mission.' },
  { title: 'Log', text: 'Record how you feel, what you did and your measurements. Blood pressure has a guided mode with timers.' },
  { title: 'Body and Trends', text: 'Select a body region to see its signals and how to measure them. Trends shows which of your habits help or hurt your recovery.' },
  { title: 'Space weather', text: 'On Today, real NASA records of solar particle events: live, or replay a real storm and watch the advice change as the detections arrive.' },
  { title: 'Ground report', text: 'When Earth has to be involved, one button on Today writes the complete message for the flight surgeon.' },
]

/** First-visit guide: a short film of the app in use, with the same steps written out below it. */
export default function Guide({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const video = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      // Autoplay can be refused; the controls stay available.
      video.current?.play().catch(() => {})
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  function close() {
    video.current?.pause()
    try {
      localStorage.setItem(SEEN_KEY, '1')
    } catch {
      /* storage blocked: the guide simply opens again next time */
    }
    onClose()
  }

  return (
    <dialog ref={ref} className="sheet guide" aria-labelledby="guide-title" onClose={close} onClick={(event) => event.target === ref.current && close()}>
      <div className="sheet-body">
        <div className="card-head">
          <div>
            <p className="eyebrow">How to use · 40 seconds</p>
            <h2 id="guide-title" style={{ marginTop: 6 }}>
              Find your way around
            </h2>
          </div>
          <button type="button" className="icon-button" aria-label="Close guide" onClick={close}>
            ✕
          </button>
        </div>
        <video ref={video} className="guide-video" src={`${import.meta.env.BASE_URL}tour.mp4`} controls muted loop playsInline preload="metadata" aria-label="Walk-through of the app. The same steps are written below." />
        <ol className="guide-steps">
          {STEPS.map((step) => (
            <li key={step.title}>
              <strong>{step.title}</strong>
              <span>{step.text}</span>
            </li>
          ))}
        </ol>
        <p className="muted guide-note">The demo shows a synthetic Mars transit with a crew of four. What you enter stays on this device, and after this first visit the app opens with no network at all.</p>
        <div className="sheet-actions">
          <button type="button" className="button primary-button" onClick={close}>
            Start
          </button>
        </div>
      </div>
    </dialog>
  )
}
