import { useEffect } from 'react'
import Preview from './dev/Preview'
import AppShell from './ui/AppShell'
import { MissionProvider } from './ui/state'

export default function App() {
  useEffect(() => {
    document.title = 'Crew Recovery'
    let icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (!icon) {
      icon = document.createElement('link')
      icon.rel = 'icon'
      document.head.appendChild(icon)
    }
    icon.type = 'image/svg+xml'
    icon.href = `${import.meta.env.BASE_URL}crew-recovery.svg`
  }, [])
  // "?preview" shows the raw output of the health logic, for debugging.
  if (new URLSearchParams(window.location.search).has('preview')) return <Preview />
  return (
    <MissionProvider>
      <AppShell />
    </MissionProvider>
  )
}
