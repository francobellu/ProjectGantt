import type { SCR, HUAT } from '../../shared/db/schema'

export interface ParseResult {
  scrs: SCR[]
  huats: HUAT[]
  errors: string[]
}

/**
 * Parse a Jira XML export (RSS format from Filters → Export → XML).
 * Uses the browser's built-in DOMParser.
 */
export function parseJiraExport(xmlText: string): ParseResult {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlText, 'text/xml')

  // Check for parse errors
  const parseError = doc.querySelector('parsererror')
  if (parseError) {
    return { scrs: [], huats: [], errors: [`XML parse error: ${parseError.textContent}`] }
  }

  const items = doc.querySelectorAll('rss > channel > item')
  if (items.length === 0) {
    return { scrs: [], huats: [], errors: ['No <item> elements found in XML. Is this a Jira RSS export?'] }
  }

  const scrs: SCR[] = []
  const huats: HUAT[] = []
  const errors: string[] = []
  const now = new Date().toISOString()

  for (const item of items) {
    const key = text(item, 'key')
    if (!key) {
      errors.push('Skipped item with no key')
      continue
    }

    const type = text(item, 'type')
    const summary = text(item, 'summary') ?? text(item, 'title')?.replace(/^\[.+\]\s*/, '') ?? ''
    const status = text(item, 'status') ?? 'Unknown'
    const assignee = attr(item, 'assignee', 'username') ?? text(item, 'assignee')
    // For fixVersion, Jira RSS uses <version> or <fixVersion>
    const targetRelease = text(item, 'fixVersion') ?? text(item, 'version')
    const dueDate = text(item, 'duedate')
    const createdAt = text(item, 'created')?.split(' ')[0] ?? null
    const priority = text(item, 'priority')

    // Components: multiple <component> elements
    const components = Array.from(item.querySelectorAll(':scope > component'))
      .map((e) => e.textContent?.trim() ?? '')
      .filter(Boolean)

    // Labels: <labels><label>...</label></labels>
    const labels = Array.from(item.querySelectorAll(':scope > labels > label'))
      .map((e) => e.textContent?.trim() ?? '')
      .filter(Boolean)

    // Issue links: <issuelinks><issuelinktype>...</issuelinktype></issuelinks>
    const blockingHUATs: string[] = []
    const blockedSCRs: string[] = []
    const issuelinks = item.querySelector(':scope > issuelinks')
    if (issuelinks) {
      const linkTypes = issuelinks.querySelectorAll(':scope > issuelinktype')
      for (const lt of linkTypes) {
        const linkName = text(lt, 'name') ?? ''
        const isBlockedBy = linkName.toLowerCase().includes('blocks')
        const blocks = isBlockedBy && !linkName.toLowerCase().includes('blocked by')
        const outwardLinks = lt.querySelectorAll(':scope > outwardlinks > issuelink > issuekey')
        for (const ik of outwardLinks) {
          const linkedKey = ik.textContent?.trim() ?? ''
          if (linkedKey) {
            if (isBlockedBy && !blocks) blockingHUATs.push(linkedKey)
            else if (blocks) blockedSCRs.push(linkedKey)
          }
        }
      }
    }

    const isSCR = type?.toLowerCase().includes('scr') || key.startsWith('SCR-')
    const isHUAT = type?.toLowerCase().includes('huat') || type?.toLowerCase().includes('defect')

    if (isSCR) {
      scrs.push({
        id: key,
        summary,
        status,
        assignee: assignee ?? null,
        targetRelease: targetRelease ?? null,
        startDate: createdAt,
        dueDate: dueDate ?? null,
        priority: priority ?? null,
        components,
        labels,
        huatBlockers: blockingHUATs,
        importedAt: now,
      })
    } else if (isHUAT) {
      huats.push({
        id: key,
        summary,
        status,
        assignee: assignee ?? null,
        targetRelease: targetRelease ?? null,
        startDate: createdAt,
        dueDate: dueDate ?? null,
        blocksScrs: blockedSCRs,
        importedAt: now,
      })
    } else {
      errors.push(`Skipped issue ${key} (type: ${type ?? 'unknown'})`)
    }
  }

  return { scrs, huats, errors }
}

/** Get text content of a direct child element, or null if missing. */
function text(parent: Element, tagName: string): string | null {
  const el = parent.querySelector(`:scope > ${tagName}`)
  return el?.textContent?.trim() ?? null
}

/** Get an attribute value of a direct child element, or null if missing. */
function attr(parent: Element, tagName: string, attrName: string): string | null {
  const el = parent.querySelector(`:scope > ${tagName}`)
  return el?.getAttribute(attrName) ?? null
}