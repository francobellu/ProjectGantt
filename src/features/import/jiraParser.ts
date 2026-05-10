import { z } from 'zod'
import type { SCR, HUAT } from '../../shared/db/schema'

// Jira JSON export schema (fields that matter to us)
const JiraIssueSchema = z.object({
  key: z.string(),
  fields: z.object({
    summary: z.string(),
    status: z.object({ name: z.string() }),
    assignee: z.object({ displayName: z.string() }).nullable().optional(),
    priority: z.object({ name: z.string() }).nullable().optional(),
    components: z.array(z.object({ name: z.string() })).optional().default([]),
    labels: z.array(z.string()).optional().default([]),
    issuetype: z.object({ name: z.string() }),
    // Custom field for target release — name may differ per org
    fixVersions: z.array(z.object({ name: z.string() })).optional().default([]),
    duedate: z.string().nullable().optional(),
    // Sprint / start date as custom fields (optional, org-dependent)
    customfield_10020: z.unknown().optional(), // sprint
    customfield_10015: z.string().nullable().optional(), // start date
    issuelinks: z.array(z.object({
      type: z.object({ outward: z.string() }),
      outwardIssue: z.object({ key: z.string() }).optional(),
      inwardIssue: z.object({ key: z.string() }).optional(),
    })).optional().default([]),
  }),
})

const JiraExportSchema = z.object({
  issues: z.array(JiraIssueSchema),
})

type JiraIssue = z.infer<typeof JiraIssueSchema>

function extractRelease(issue: JiraIssue): string | null {
  return issue.fields.fixVersions?.[0]?.name ?? null
}

function extractStartDate(issue: JiraIssue): string | null {
  return issue.fields.customfield_10015 ?? null
}

function extractBlockingHUATs(issue: JiraIssue): string[] {
  return (issue.fields.issuelinks ?? [])
    .filter((l) => l.type.outward === 'is blocked by' && l.inwardIssue)
    .map((l) => l.inwardIssue!.key)
}

function extractBlockedSCRs(issue: JiraIssue): string[] {
  return (issue.fields.issuelinks ?? [])
    .filter((l) => l.type.outward === 'blocks' && l.outwardIssue)
    .map((l) => l.outwardIssue!.key)
}

export interface ParseResult {
  scrs: SCR[]
  huats: HUAT[]
  errors: string[]
}

export function parseJiraExport(raw: unknown): ParseResult {
  const result = JiraExportSchema.safeParse(raw)
  if (!result.success) {
    return { scrs: [], huats: [], errors: [result.error.message] }
  }

  const scrs: SCR[] = []
  const huats: HUAT[] = []
  const errors: string[] = []
  const now = new Date().toISOString()

  for (const issue of result.data.issues) {
    const issueType = issue.fields.issuetype.name.toLowerCase()
    const isSCR = issueType.includes('scr') || issue.key.startsWith('SCR-')
    const isHUAT = issueType.includes('huat') || issueType.includes('defect')

    if (isSCR) {
      scrs.push({
        id: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status.name,
        assignee: issue.fields.assignee?.displayName ?? null,
        targetRelease: extractRelease(issue),
        startDate: extractStartDate(issue),
        dueDate: issue.fields.duedate ?? null,
        priority: issue.fields.priority?.name ?? null,
        components: issue.fields.components?.map((c) => c.name) ?? [],
        labels: issue.fields.labels ?? [],
        huatBlockers: extractBlockingHUATs(issue),
        importedAt: now,
      })
    } else if (isHUAT) {
      huats.push({
        id: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status.name,
        assignee: issue.fields.assignee?.displayName ?? null,
        targetRelease: extractRelease(issue),
        startDate: extractStartDate(issue),
        dueDate: issue.fields.duedate ?? null,
        blocksScrs: extractBlockedSCRs(issue),
        importedAt: now,
      })
    } else {
      errors.push(`Skipped issue ${issue.key} (type: ${issue.fields.issuetype.name})`)
    }
  }

  return { scrs, huats, errors }
}
