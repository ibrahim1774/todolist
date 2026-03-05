import { useState, useEffect, useRef } from 'react'

const CATEGORIES = [
  { id: 'all', label: 'All', color: '' },
  { id: 'work', label: 'Work', color: '#7C6FF7' },
  { id: 'personal', label: 'Personal', color: '#4FFFB0' },
  { id: 'urgent', label: 'Urgent', color: '#FF4D6A' },
  { id: 'other', label: 'Other', color: '#FFD93D' },
]

const SORT_OPTIONS = [
  { id: 'added', label: 'Date Added' },
  { id: 'due', label: 'Due Date' },
  { id: 'alpha', label: 'Alphabetical' },
]

function loadTasks() {
  try {
    const saved = localStorage.getItem('taska-tasks')
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

function saveTasks(tasks) {
  localStorage.setItem('taska-tasks', JSON.stringify(tasks))
}

function getDateStatus(dateStr) {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr + 'T00:00:00')
  const diff = due - today
  if (diff < 0) return 'overdue'
  if (diff === 0) return 'today'
  return 'upcoming'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function App() {
  const [tasks, setTasks] = useState(loadTasks)
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [category, setCategory] = useState('other')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('added')
  const [showCompleted, setShowCompleted] = useState(true)
  const [shakingId, setShakingId] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    saveTasks(tasks)
  }, [tasks])

  useEffect(() => {
    if (showAddForm && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showAddForm])

  function addTask(e) {
    e.preventDefault()
    if (!title.trim()) return
    const newTask = {
      id: Date.now(),
      title: title.trim(),
      completed: false,
      dueDate,
      category,
      createdAt: Date.now(),
    }
    setTasks(prev => [newTask, ...prev])
    setTitle('')
    setDueDate('')
    setCategory('other')
    setShowAddForm(false)
  }

  function toggleTask(id) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  }

  function deleteTask(id) {
    setShakingId(id)
    setTimeout(() => {
      setTasks(prev => prev.filter(t => t.id !== id))
      setShakingId(null)
    }, 300)
  }

  const filtered = tasks.filter(t => {
    if (filterCategory !== 'all' && t.category !== filterCategory) return false
    if (filterStatus === 'active' && t.completed) return false
    if (filterStatus === 'completed' && !t.completed) return false
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'due') {
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return a.dueDate.localeCompare(b.dueDate)
    }
    if (sortBy === 'alpha') return a.title.localeCompare(b.title)
    return b.createdAt - a.createdAt
  })

  const activeTasks = sorted.filter(t => !t.completed)
  const completedTasks = sorted.filter(t => t.completed)
  const totalCount = tasks.length
  const completedCount = tasks.filter(t => t.completed).length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center px-4 py-8 pb-24">
      {/* Header */}
      <header className="w-full max-w-[680px] sticky top-0 z-20 bg-bg pt-2 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-text">
            Taska
          </h1>
          <span className="text-sm text-text-muted font-medium">
            {completedCount} of {totalCount} completed
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-card rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Category filter tabs */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer border ${
                filterCategory === cat.id
                  ? 'bg-accent text-white border-accent'
                  : 'bg-card text-text-muted border-border hover:bg-card-hover hover:text-text'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Sort & Filter row */}
        <div className="flex items-center gap-3 mt-3">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="bg-card border border-border text-text-muted text-xs rounded-lg px-3 py-1.5 cursor-pointer focus:outline-none focus:border-accent transition-colors"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
          <div className="flex gap-1.5 ml-auto">
            {['all', 'active', 'completed'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all duration-200 cursor-pointer border ${
                  filterStatus === status
                    ? 'bg-accent/15 text-accent border-accent/30'
                    : 'text-text-muted border-transparent hover:text-text'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Task list */}
      <main className="w-full max-w-[680px] mt-2 flex-1">
        {/* Add task form */}
        {showAddForm && (
          <form
            onSubmit={addTask}
            className="task-enter bg-card border border-border rounded-2xl p-4 mb-4"
            style={{ backdropFilter: 'blur(12px)' }}
          >
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full bg-transparent text-text text-sm placeholder:text-text-dim outline-none mb-3 font-medium"
            />
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="bg-card-hover border border-border text-text-muted text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-accent transition-colors"
              />
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="bg-card-hover border border-border text-text-muted text-xs rounded-lg px-3 py-1.5 cursor-pointer focus:outline-none focus:border-accent transition-colors"
              >
                {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
              <div className="flex gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-1.5 text-xs text-text-muted hover:text-text transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Add Task
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Active tasks */}
        {activeTasks.length === 0 && completedTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4 opacity-30">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-text-dim">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
            </div>
            <p className="text-text-muted text-lg font-medium mb-1">Nothing on your plate.</p>
            <p className="text-text-dim text-sm">Add something!</p>
          </div>
        )}

        <div className="space-y-2">
          {activeTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={toggleTask}
              onDelete={deleteTask}
              shaking={shakingId === task.id}
            />
          ))}
        </div>

        {/* Completed section */}
        {completedTasks.length > 0 && filterStatus !== 'active' && (
          <div className="mt-6">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-2 text-text-muted text-xs font-medium mb-3 hover:text-text transition-colors cursor-pointer"
            >
              <svg
                width="12" height="12" viewBox="0 0 12 12" fill="currentColor"
                className={`transition-transform duration-200 ${showCompleted ? 'rotate-90' : ''}`}
              >
                <path d="M4 2l4 4-4 4" />
              </svg>
              Completed ({completedTasks.length})
            </button>
            {showCompleted && (
              <div className="space-y-2">
                {completedTasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={toggleTask}
                    onDelete={deleteTask}
                    shaking={shakingId === task.id}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating add button */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="fixed bottom-8 right-8 w-14 h-14 bg-accent hover:bg-accent-hover text-white rounded-full shadow-lg shadow-accent/25 flex items-center justify-center transition-all duration-200 hover:scale-105 cursor-pointer z-30"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}
    </div>
  )
}

function TaskItem({ task, onToggle, onDelete, shaking }) {
  const dateStatus = getDateStatus(task.dueDate)
  const catInfo = CATEGORIES.find(c => c.id === task.category)

  const dateBadgeClass = {
    overdue: 'bg-danger/15 text-danger',
    today: 'bg-warning/15 text-warning',
    upcoming: 'bg-white/5 text-text-muted',
  }

  return (
    <div
      className={`task-enter group flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3.5 transition-all duration-200 hover:bg-card-hover ${
        shaking ? 'task-shake' : ''
      } ${task.completed ? 'opacity-60' : ''}`}
      style={{ backdropFilter: 'blur(12px)' }}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task.id)}
        className={`checkbox-custom ${task.completed ? 'checked' : ''}`}
        aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        <svg className="checkmark" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#0F0F13" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2.5 6l2.5 2.5 4.5-5" />
        </svg>
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <span className={`text-sm font-medium block truncate transition-all duration-300 ${
          task.completed ? 'line-through text-text-dim' : 'text-text'
        }`}>
          {task.title}
        </span>
        <div className="flex items-center gap-2 mt-1">
          {catInfo && catInfo.id !== 'all' && (
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: catInfo.color + '20', color: catInfo.color }}
            >
              {catInfo.label}
            </span>
          )}
          {task.dueDate && dateStatus && (
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${dateBadgeClass[dateStatus]}`}>
              {formatDate(task.dueDate)}
            </span>
          )}
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 text-text-dim hover:text-danger transition-all duration-200 cursor-pointer p-1"
        aria-label="Delete task"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
        </svg>
      </button>
    </div>
  )
}

export default App
