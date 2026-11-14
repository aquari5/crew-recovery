import { useEffect } from 'react'
import Preview from './dev/Preview'
import AppShell from './ui/AppShell'
import { MissionProvider } from './ui/state'

export default function App() {
  useEffect(() => {
    document.title = 'Crew Recovery — Mission health'
    let icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (!icon) { icon = document.createElement('link'); icon.rel = 'icon'; document.head.appendChild(icon) }
    icon.type = 'image/svg+xml'
    icon.href = `${import.meta.env.BASE_URL}crew-recovery.svg`
  }, [])
  // Preserve the original logic owner's reference without modifying their files.
  if (new URLSearchParams(window.location.search).get('preview') === 'reference') {
    return <div className="reference-preview"><a className="button" href="?preview">Back to shared data preview</a><Preview /></div>
  }
  return <MissionProvider><AppShell /></MissionProvider>
}
