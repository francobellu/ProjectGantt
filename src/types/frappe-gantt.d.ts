declare module 'frappe-gantt' {
  interface Task {
    id: string
    name: string
    start: string
    end: string
    progress: number
    custom_class?: string
    dependencies?: string
  }
  interface GanttOptions {
    view_mode?: 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month' | 'Year'
    date_format?: string
    on_click?: (task: Task) => void
    on_date_change?: (task: Task, start: Date, end: Date) => void
    on_progress_change?: (task: Task, progress: number) => void
    on_view_change?: (mode: string) => void
  }
  export default class Gantt {
    constructor(wrapper: HTMLElement | string, tasks: Task[], options?: GanttOptions)
    change_view_mode(mode: string): void
    refresh(tasks: Task[]): void
  }
}
