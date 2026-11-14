import { assess, withEntries, type MissionData, type Status } from '../core'
const PRIORITY: Record<Status, number> = { alert: 3, watch: 2, nodata: 1, ok: 0 }
export function crewAssessments(mission: MissionData, day: number) {
  return mission.crew.map(member => {
    const assessment = assess(withEntries(member.id, mission.records[member.id]), day, mission.env)
    const urgent = [...assessment.findings].sort((a, b) => b.level - a.level)[0]
    return { member, assessment, urgent }
  }).sort((a, b) => (b.urgent?.level ?? 0) - (a.urgent?.level ?? 0) || PRIORITY[b.assessment.overall] - PRIORITY[a.assessment.overall] || b.assessment.findings.length - a.assessment.findings.length || a.member.name.localeCompare(b.member.name))
}
