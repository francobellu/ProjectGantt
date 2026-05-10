import type { Release, GateDate, GateRequirement } from '../../shared/db/schema'

// SheetJS is lazy-loaded — only imported when this module is used
async function loadXLSX() {
  return import('xlsx')
}

export interface QGDatesResult {
  releases: Release[]
  errors: string[]
}

export async function parseQGDatesExcel(file: File): Promise<QGDatesResult> {
  const XLSX = await loadXLSX()
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 })

  const releases: Release[] = []
  const errors: string[] = []

  // Expected columns: Release Name | Gate 1 Date | Gate 2 Date | Gate 3 Date ...
  // Row 0 = header row
  const header = rows[0] as string[]
  if (!header) {
    return { releases: [], errors: ['Empty sheet'] }
  }

  const gateColumns: { name: string; col: number }[] = []
  for (let i = 1; i < header.length; i++) {
    const cell = String(header[i] ?? '')
    if (cell.toLowerCase().includes('gate')) {
      gateColumns.push({ name: cell.trim(), col: i })
    }
  }

  for (let row = 1; row < rows.length; row++) {
    const cells = rows[row] as unknown[]
    const releaseName = String(cells[0] ?? '').trim()
    if (!releaseName) continue

    const gates: GateDate[] = []
    for (const { name, col } of gateColumns) {
      const cell = cells[col]
      if (!cell) continue
      const date = cell instanceof Date
        ? cell.toISOString().split('T')[0]
        : String(cell).trim()
      if (date) gates.push({ name, date })
    }

    const month = deriveMonth(releaseName)
    if (!month) {
      errors.push(`Could not derive month for release "${releaseName}"`)
    }

    releases.push({
      id: crypto.randomUUID(),
      name: releaseName,
      month: month ?? releaseName,
      gates,
    })
  }

  return { releases, errors }
}

function deriveMonth(releaseName: string): string | null {
  const months: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  }
  const lower = releaseName.toLowerCase()
  for (const [abbr, num] of Object.entries(months)) {
    if (lower.includes(abbr)) {
      const yearMatch = releaseName.match(/\d{4}/)
      const year = yearMatch ? yearMatch[0] : new Date().getFullYear().toString()
      return `${year}-${num}`
    }
  }
  return null
}

export interface QGRequirementsResult {
  requirements: GateRequirement[]
  errors: string[]
}

export async function parseQGRequirementsExcel(file: File): Promise<QGRequirementsResult> {
  const XLSX = await loadXLSX()
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 })

  const requirements: GateRequirement[] = []
  const errors: string[] = []

  // Expected columns: Gate Name | Requirement Name | Description | Owned (Y/N)
  const header = rows[0] as string[]
  if (!header) return { requirements: [], errors: ['Empty sheet'] }

  const col = {
    gate: findCol(header, 'gate'),
    name: findCol(header, 'requirement') ?? findCol(header, 'name'),
    description: findCol(header, 'description') ?? findCol(header, 'desc'),
    owned: findCol(header, 'owned') ?? findCol(header, 'owner'),
  }

  if (col.name === null) {
    return { requirements: [], errors: ['Could not find "Requirement" column in sheet'] }
  }

  for (let row = 1; row < rows.length; row++) {
    const cells = rows[row] as unknown[]
    const name = String(cells[col.name!] ?? '').trim()
    if (!name) continue

    const gateName = col.gate !== null ? String(cells[col.gate] ?? '').trim() : 'General'
    const description = col.description !== null ? String(cells[col.description] ?? '').trim() : ''
    const ownedCell = col.owned !== null ? String(cells[col.owned] ?? '').trim().toLowerCase() : 'y'
    const owned = ownedCell === 'y' || ownedCell === 'yes' || ownedCell === 'true' || ownedCell === '1'

    requirements.push({
      id: crypto.randomUUID(),
      name,
      description,
      gateName,
      owned,
    })
  }

  return { requirements, errors }
}

function findCol(header: string[], keyword: string): number | null {
  const idx = header.findIndex((h) => String(h ?? '').toLowerCase().includes(keyword))
  return idx >= 0 ? idx : null
}
