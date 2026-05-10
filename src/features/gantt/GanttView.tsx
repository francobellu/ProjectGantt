import { useEffect, useRef, useMemo } from 'react'
import Gantt from 'frappe-gantt'
import { useStore } from '../../app/store'
import type { SCR } from '../../shared/db/schema'

// frappe-gantt types (package lacks full typings)
interface FrappeTask {
  id: string
  name: string
  start: string
  end: string
  progress: number
  custom_class?: string
}

function scrToTask(scr: SCR): FrappeTask | null {
  const start = scr.startDate ?? scr.importedAt.split('T')[0]
  const end = scr.dueDate ?? start
  if (!start || !end) return null
  return {
    id: scr.id,
    name: `${scr.id}: ${scr.summary.slice(0, 40)}`,
    start,
    end: end >= start ? end : start,
    progress: scr.status.toLowerCase().includes('done') ? 100 : 0,
    custom_class: `release-${(scr.targetRelease ?? 'unset').replace(/\s+/g, '-').toLowerCase()}`,
  }
}

function statusColor(status: string): string {
  const s = status.toLowerCase()
  if (s.includes('done') || s.includes('closed')) return 'bg-green-200 text-green-800'
  if (s.includes('progress') || s.includes('development')) return 'bg-blue-200 text-blue-800'
  if (s.includes('review')) return 'bg-amber-200 text-amber-800'
  return 'bg-slate-200 text-slate-600'
}

export function GanttView() {
  const { scrs, releases, setSelectedScr, setActiveView } = useStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const ganttRef = useRef<InstanceType<typeof Gantt> | null>(null)

  const tasks = useMemo(() => scrs.map(scrToTask).filter(Boolean) as FrappeTask[], [scrs])

  const releaseGroups = useMemo(() => {
    const groups: Record<string, SCR[]> = {}
    for (const scr of scrs) {
      const key = scr.targetRelease ?? 'Unassigned'
      if (!groups[key]) groups[key] = []
      groups[key].push(scr)
    }
    return groups
  }, [scrs])

  useEffect(() => {
    if (!containerRef.current || tasks.length === 0) return
    containerRef.current.innerHTML = ''

    ganttRef.current = new Gantt(containerRef.current, tasks, {
      view_mode: 'Month',
      date_format: 'YYYY-MM-DD',
      on_click: (task: FrappeTask) => {
        setSelectedScr(task.id)
        setActiveView('compliance')
      },
    })
  }, [tasks, setSelectedScr, setActiveView])

  if (scrs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        No SCR tickets loaded. Go to Import to load data.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Release summary chips */}
      <div className="flex flex-wrap gap-2 px-4 pt-4">
        {Object.entries(releaseGroups).map(([release, items]) => (
          <div key={release} className="flex items-center gap-1 bg-slate-100 rounded-full px-3 py-1 text-xs text-slate-600">
            <span className="font-medium">{release}</span>
            <span className="text-slate-400">({items.length})</span>
          </div>
        ))}
      </div>

      {/* Gate date markers legend */}
      {releases.length > 0 && (
        <div className="px-4 flex flex-wrap gap-3">
          {releases.flatMap((r) =>
            r.gates.map((g) => (
              <div key={`${r.id}-${g.name}`} className="flex items-center gap-1 text-xs text-slate-500">
                <div className="w-px h-4 bg-red-400" />
                <span>{r.name} — {g.name}: {g.date}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Gantt chart */}
      <div className="overflow-x-auto px-4 pb-6">
        <div ref={containerRef} />
      </div>

      {/* SCR table below chart */}
      <div className="px-4 pb-8">
        <h2 className="text-sm font-semibold text-slate-700 mb-2">All SCRs</h2>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase">
              <tr>
                <th className="px-3 py-2">Key</th>
                <th className="px-3 py-2">Summary</th>
                <th className="px-3 py-2">Release</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Assignee</th>
                <th className="px-3 py-2">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scrs.map((scr) => (
                <tr
                  key={scr.id}
                  className="hover:bg-slate-50 cursor-pointer"
                  onClick={() => { setSelectedScr(scr.id); setActiveView('compliance') }}
                >
                  <td className="px-3 py-2 font-mono text-blue-600">{scr.id}</td>
                  <td className="px-3 py-2 max-w-xs truncate">{scr.summary}</td>
                  <td className="px-3 py-2 text-slate-500">{scr.targetRelease ?? '—'}</td>
                  <td className="px-3 py-2">
                    <span className={`px-1.5 py-0.5 rounded text-xs ${statusColor(scr.status)}`}>
                      {scr.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-500">{scr.assignee ?? '—'}</td>
                  <td className="px-3 py-2 text-slate-500">{scr.dueDate ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
