import { useEffect, useMemo, useRef, useState } from 'react'
import { buildGroundReport, crewSignals, roundTripDelayLabel, withEntries } from '../core'
import { useMission } from './state'

/** Shows the generated ground report and lets the crew copy or save it. */
export default function ReportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { mission, crewId, records, assessment } = useMission()
  const ref = useRef<HTMLDialogElement>(null)
  const [copied, setCopied] = useState(false)
  const crew = mission.crew.find((member) => member.id === crewId)!
  const report = useMemo(
    () =>
      buildGroundReport({
        crew,
        missionName: mission.name,
        env: mission.env,
        records,
        assessment,
        crewSignals: crewSignals(mission.crew, Object.fromEntries(mission.crew.map((member) => [member.id, withEntries(member.id, mission.records[member.id])])), assessment.day, mission.env),
      }),
    [crew, mission, records, assessment],
  )

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${report.subject}\n\n${report.body}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* Clipboard blocked: the text stays selectable in the dialog. */
    }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([`${report.subject}\n\n${report.body}\n`], { type: 'text/plain' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `health-report-${crewId}-day-${assessment.day}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <dialog ref={ref} className="sheet" aria-labelledby="report-title" onClose={onClose} onClick={(event) => event.target === ref.current && onClose()}>
      <div className="sheet-body">
        <div className="card-head">
          <div>
            <p className="eyebrow">Ground report · reply in {roundTripDelayLabel(mission.env)} at best</p>
            <h2 id="report-title" style={{ marginTop: 6 }}>
              One complete message
            </h2>
          </div>
          <button className="icon-button" aria-label="Close report" onClick={onClose}>
            ✕
          </button>
        </div>
        <p className="muted" style={{ marginTop: 10, maxWidth: '60ch' }}>
          With a delayed link every clarifying question costs a full round trip. This report carries what a flight surgeon would ask for, in SBAR order.
        </p>
        <pre className="report" tabIndex={0}>
          {report.subject}
          {'\n\n'}
          {report.body}
        </pre>
        <div className="sheet-actions">
          <button className="button primary-button" onClick={copy}>
            {copied ? 'Copied ✓' : 'Copy report'}
          </button>
          <button className="button" onClick={download}>
            Save as .txt
          </button>
        </div>
      </div>
    </dialog>
  )
}
