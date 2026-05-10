import { dbOps } from '../../shared/db/db'
import { dispatchEvent } from '../../shared/events/events'

export async function exportProject(): Promise<void> {
  const snapshot = await dbOps.exportSnapshot()
  await dispatchEvent('PROJECT_EXPORTED', {})
  const json = JSON.stringify(snapshot, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `projectgantt-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importProject(file: File): Promise<void> {
  const text = await file.text()
  const snapshot = JSON.parse(text)
  await dbOps.importSnapshot(snapshot)
  await dispatchEvent('PROJECT_IMPORTED', {})
}
