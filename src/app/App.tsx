import { useEffect } from 'react'
import { useStore } from './store'
import { ImportPanel } from '../features/import/ImportPanel'
import { GanttView } from '../features/gantt/GanttView'
import { CompliancePanel } from '../features/compliance/CompliancePanel'
import { exportProject, importProject } from '../features/export/projectIO'

export function App() {
  const { activeView, setActiveView, loadFromDB, error, scrs } = useStore()

  useEffect(() => {
    loadFromDB()
  }, [loadFromDB])

  async function handleImportProject(file: File) {
    await importProject(file)
    await loadFromDB()
  }

  return (
    <div className="flex flex-col h-screen bg-white text-slate-900">
      {/* Top nav */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-6">
          <span className="font-bold text-blue-700 text-sm tracking-tight">ProjectGantt</span>
          <nav className="flex gap-1">
            {([
              { id: 'gantt', label: 'Gantt' },
              { id: 'compliance', label: 'Gate Compliance' },
              { id: 'import', label: 'Import' },
            ] as const).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveView(id)}
                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors
                  ${activeView === id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {scrs.length > 0 && (
            <span className="text-xs text-slate-400">{scrs.length} SCRs</span>
          )}
          <button
            onClick={exportProject}
            className="text-xs px-3 py-1.5 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Export
          </button>
          <label className="text-xs px-3 py-1.5 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer">
            Load
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImportProject(f) }}
            />
          </label>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {activeView === 'import' && <ImportPanel />}
        {activeView === 'gantt' && (
          <div className="h-full overflow-y-auto">
            <GanttView />
          </div>
        )}
        {activeView === 'compliance' && <CompliancePanel />}
      </main>
    </div>
  )
}
