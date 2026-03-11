import { useState, useEffect, useRef } from 'react'

const PRIORITIES = ['low', 'medium', 'high', 'urgent']
const PRIORITY_STYLES = {
  low:    'border-blue-500 bg-blue-500/10 text-blue-400',
  medium: 'border-yellow-500 bg-yellow-500/10 text-yellow-400',
  high:   'border-orange-500 bg-orange-500/10 text-orange-400',
  urgent: 'border-red-500 bg-red-500/10 text-red-400',
}

const SUGGESTED_LABELS = ['Bug', 'Feature', 'Design', 'Docs', 'Research', 'Review', 'Hotfix', 'Chore']

export function AddCardModal({ isOpen, column, card, columns, onSave, onClose }) {
  const firstRef = useRef(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assignee: '',
    due_date: '',
    labels: [],
    column_id: column?.id || '',
  })
  const [labelInput, setLabelInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isEditing = !!card

  useEffect(() => {
    if (isOpen) {
      setError('')
      setLabelInput('')
      if (card) {
        setForm({
          title: card.title || '',
          description: card.description || '',
          priority: card.priority || 'medium',
          assignee: card.assignee || '',
          due_date: card.due_date ? card.due_date.slice(0, 10) : '',
          labels: Array.isArray(card.labels) ? [...card.labels] : [],
          column_id: card.column_id || column?.id || '',
        })
      } else {
        setForm({
          title: '',
          description: '',
          priority: 'medium',
          assignee: '',
          due_date: '',
          labels: [],
          column_id: column?.id || '',
        })
      }
      setTimeout(() => firstRef.current?.focus(), 50)
    }
  }, [isOpen, card, column])

  function handleKey(e) {
    if (e.key === 'Escape') onClose?.()
  }

  function addLabel(lbl) {
    const clean = lbl.trim()
    if (!clean || form.labels.includes(clean)) return
    setForm(f => ({ ...f, labels: [...f.labels, clean] }))
    setLabelInput('')
  }

  function removeLabel(lbl) {
    setForm(f => ({ ...f, labels: f.labels.filter(l => l !== lbl) }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required'); return }
    setSaving(true)
    setError('')
    try {
      await onSave?.({ ...form, title: form.title.trim(), column_id: form.column_id })
    } catch (err) {
      setError(err.message || 'Failed to save card')
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onKeyDown={handleKey}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="font-semibold text-slate-100 text-base">
              {isEditing ? 'Edit Card' : 'New Card'}
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              {column?.name ? `In "${column.name}"` : 'Add details below'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors flex items-center justify-center"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-5 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Title <span className="text-red-400">*</span></label>
            <input
              ref={firstRef}
              type="text"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              placeholder="What needs to be done?"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
            <textarea
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none"
              placeholder="Add more context…"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Priority</label>
            <div className="flex gap-2">
              {PRIORITIES.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, priority: p }))}
                  className={`flex-1 py-2 rounded-lg border text-xs font-semibold capitalize transition-all ${form.priority === p ? PRIORITY_STYLES[p] : 'border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-400'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Column (when editing) */}
          {columns && columns.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Column</label>
              <select
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                value={form.column_id}
                onChange={e => setForm(f => ({ ...f, column_id: e.target.value }))}
              >
                {columns.map(col => (
                  <option key={col.id} value={col.id}>{col.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Row — Assignee + Due Date */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Assignee</label>
              <input
                type="text"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                placeholder="Name or email"
                value={form.assignee}
                onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Due Date</label>
              <input
                type="date"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors [color-scheme:dark]"
                value={form.due_date}
                onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
              />
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Labels</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                placeholder="Type and press Enter…"
                value={labelInput}
                onChange={e => setLabelInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLabel(labelInput) } }}
              />
              <button
                type="button"
                onClick={() => addLabel(labelInput)}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors"
              >
                Add
              </button>
            </div>

            {/* Suggested labels */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {SUGGESTED_LABELS.map(lbl => (
                <button
                  key={lbl}
                  type="button"
                  onClick={() => addLabel(lbl)}
                  className="text-[11px] px-2 py-0.5 rounded-md border border-slate-700 text-slate-400 hover:border-indigo-500 hover:text-indigo-400 transition-colors"
                >
                  {lbl}
                </button>
              ))}
            </div>

            {/* Selected labels */}
            {form.labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.labels.map(lbl => (
                  <span key={lbl} className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border border-indigo-500/40 bg-indigo-500/10 text-indigo-300">
                    {lbl}
                    <button type="button" onClick={() => removeLabel(lbl)} className="hover:text-white transition-colors">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
          >
            {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Card'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddCardModal
