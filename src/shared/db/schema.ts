export const DB_NAME = 'projectgantt'
export const DB_VERSION = 1

export type ComplianceStatus = 'not_started' | 'in_progress' | 'passed' | 'failed' | 'excepted'

export interface SCR {
  id: string           // Jira key e.g. "SCR-123"
  summary: string
  status: string
  assignee: string | null
  targetRelease: string | null
  startDate: string | null
  dueDate: string | null
  priority: string | null
  components: string[]
  labels: string[]
  huatBlockers: string[]  // HUAT Jira keys that block this SCR
  importedAt: string
}

export interface HUAT {
  id: string
  summary: string
  status: string
  assignee: string | null
  targetRelease: string | null
  startDate: string | null
  dueDate: string | null
  blocksScrs: string[]  // SCR Jira keys this HUAT blocks
  importedAt: string
}

export interface Release {
  id: string
  name: string        // e.g. "Release Jan 2026"
  month: string       // ISO month "2026-01"
  gates: GateDate[]
}

export interface GateDate {
  name: string        // e.g. "Gate 1"
  date: string        // ISO date
}

export interface GateRequirement {
  id: string
  name: string
  description: string
  gateName: string    // which gate this belongs to
  owned: boolean      // true = Franco's team; false = monitored only
}

export interface ComplianceEntry {
  id: string                // crypto.randomUUID()
  scrId: string
  requirementId: string
  status: ComplianceStatus
  note: string
  updatedAt: string
}

export interface AppEvent {
  id: string
  type: string
  payload: unknown
  timestamp: string
}

export interface DBSchema {
  scrs: SCR
  huats: HUAT
  releases: Release
  gateRequirements: GateRequirement
  compliance: ComplianceEntry
  events: AppEvent
}
