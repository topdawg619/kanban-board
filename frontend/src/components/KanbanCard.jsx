import { useState } from 'react'
import { api } from '../lib/api'

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', color: 'text-red-400 bg-red-950/60 border-red-800/50' },
  high:   { label: 'High',   color: 'text-orange-400 bg-orange-950/60 border-orange-800/50' },
  medium: { label: 'Medium', color: 'text-yellow-400 bg-yellow-950/60 border-yellow-800/50' },
  low:    { label: 'Low',    color: 'text-blue-400 bg-blue-950/60 border-blue-800/50' },
}

const PRIORITY_DOT = {
  urgent: 'bg-red-500',
  high:   'bg-orange-500',
  medium: 'bg-yellow-500',
  low:    'bg-blue-500',
}

export function KanbanCard({ card, columnId, allColumns, onUpdated, onDeleted, onMoved }) {
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(card.title)
  const [editDesc, setEditDesc] = useState(card.description || '')
  const [editPriority, setEditPriority] = useState(card.priority || 'medium')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDragStart = (e) => {
    e.dataTransfer.setData('cardId', card.id)
    e.dataTransfer.setData('fromColId', columnId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!editTitle.trim()) return
    setSaving(true)
    try {
      const updated = await api.updateCard(card.id, {
        title: editTitle.trim(),
        description: editDesc,
        priority: editPriority,
      })
      onUpdated(updated)
      setEditing(false)
    } catch (err) {
      alert('Failed to update card: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this card?')) return
    setDeleting(true)
    try {
      await api.deleteCard(card.id)
      onDeleted(card.id)
    } catch (err) {
      alert('Failed to delete card: ' + err.message)
      setDeleting(false)
    }
  }

  const pc = PRIORITY_CONFIG[card.priority] || PRIORITY_CONFIG.medium

  if (editing) {
    return (
      <form
        onSubmit={handleSave}
        className="bg-slate-800 border border-indigo-500/50 rounded-xl p-3 space-y-3 shadow-lg"
      >
        <input
          autoFocus
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="Card title"
        />
        <textarea
          rows={3}
          value={editDesc}
          onChange={(e) => setEditDesc(e.target.value)}
          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
          placeholder="Description (optional)"
        />
        <select
          value={editPriority}
          onChange={(e) => setEditPriority(e.target.value)}
          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {Object.entries(PRIORITY_CONFIG).map(([p, { label }]) => (
            <option key={p} value={p}>{label}</option>
          ))}
        </select>

        {/* Move to column */}
        {allColumns.length > 1 && (
          <div>
            <p className="text-xs text-slate-500 mb-1">Move to column</p>
            <div className="flex flex-wrap gap-1">
              {allColumns.filter(c => c.id !== columnId).map(col => (
                <button
                  key={col.id}
                  type="button"
                  onClick={async () => {
                    try {
                      await api.moveCard(card.id, { column_id: col.id, position: col.cards?.length ?? 0 })
                      onMoved(card.id, columnId, col.id)
                      setEditing(false)
                    } catch (err) {
                      alert('Failed to move: ' + err.message)
                    }
                  }}
                  className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                >
                  → {col.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-950/40 transition-colors disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-3 py-1 text-xs text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !editTitle.trim()}
              className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </form>
    )
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => setEditing(true)}
      className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 rounded-xl p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all duration-150 group"
    >
      {/* Priority dot + title */}
      <div className="flex items-start gap-2">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${PRIORITY_DOT[card.priority] || PRIORITY_DOT.medium}`} />
        <p className="text-sm text-slate-100 font-medium leading-snug flex-1">{card.title}</p>
      </div>

      {/* Description preview */}
      {card.description && (
        <p className="text-xs text-slate-500 mt-1.5 ml-4 line-clamp-2 leading-relaxed">
          {card.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2.5 ml-4">
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${pc.color}`}>
          {pc.label}
        </span>
        {card.due_date && (
          <span className="text-xs text-slate-500">
            📅 {new Date(card.due_date).toLocaleDateString()}
          </span>
        )}
        <svg
          className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors ml-auto"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </div>
    </div>
  )
}

export default KanbanCard
