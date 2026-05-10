import { dbOps } from '../db/db'
import type { AppEvent } from '../db/schema'

export type EventType =
  | 'JIRA_IMPORTED'
  | 'QG_DATES_IMPORTED'
  | 'QG_REQUIREMENTS_IMPORTED'
  | 'COMPLIANCE_UPDATED'
  | 'PROJECT_EXPORTED'
  | 'PROJECT_IMPORTED'

export interface JiraImportedPayload {
  scrCount: number
  huatCount: number
}

export interface QGDatesImportedPayload {
  releaseCount: number
}

export interface QGRequirementsImportedPayload {
  requirementCount: number
}

export interface ComplianceUpdatedPayload {
  scrId: string
  requirementId: string
  status: string
  note: string
}

type EventPayloadMap = {
  JIRA_IMPORTED: JiraImportedPayload
  QG_DATES_IMPORTED: QGDatesImportedPayload
  QG_REQUIREMENTS_IMPORTED: QGRequirementsImportedPayload
  COMPLIANCE_UPDATED: ComplianceUpdatedPayload
  PROJECT_EXPORTED: Record<string, never>
  PROJECT_IMPORTED: Record<string, never>
}

export async function dispatchEvent<T extends EventType>(
  type: T,
  payload: EventPayloadMap[T],
): Promise<void> {
  const event: AppEvent = {
    id: crypto.randomUUID(),
    type,
    payload,
    timestamp: new Date().toISOString(),
  }
  await dbOps.appendEvent(event)
}
