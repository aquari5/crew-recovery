import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { assess, generateMission, withEntries, type MissionEnvironment } from '../core'

function useMissionState() {
  const [envId, setEnvId] = useState<MissionEnvironment['id']>('marsTransit')
  const mission = useMemo(() => generateMission({ envId }), [envId])
  const [crewId, setCrewId] = useState('fe1')
  const [day, updateDay] = useState(mission.days)
  const [revision, setRevision] = useState(0)
  const refresh = useCallback(() => setRevision(value => value + 1), [])
  const setDay = useCallback((value: number) => {
    if (Number.isFinite(value)) updateDay(Math.max(1, Math.min(mission.days, Math.round(value))))
  }, [mission.days])
  const records = useMemo(() => withEntries(crewId, mission.records[crewId]), [crewId, mission, revision])
  const assessment = useMemo(() => assess(records, day, mission.env), [records, day, mission.env])
  return useMemo(() => ({ mission, crewId, day, setCrewId, setDay, records, assessment, refresh, revision, envId, setEnvId }),
    [mission, crewId, day, setDay, records, assessment, refresh, revision, envId])
}
const MissionContext = createContext<ReturnType<typeof useMissionState> | null>(null)
export function MissionProvider({ children }: { children: ReactNode }) {
  const value = useMissionState()
  return <MissionContext.Provider value={value}>{children}</MissionContext.Provider>
}
export function useMission() {
  const context = useContext(MissionContext)
  if (!context) throw new Error('useMission must be used within MissionProvider')
  return context
}
