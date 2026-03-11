import { useState } from 'react'
import { KanbanCard } from './KanbanCard'
import { api } from '../lib/api'

const COL_COLORS = {
  '#64748b': 'bg-slate-500',
  '#6366f1': 'bg-indigo-500',
  '#f59e0b': 'bg-amber-500',
  '#8b5cf6': 'bg-violet-500',
  '#10b981': 'bg-emerald-500',
  '#ef4444': 'bg-red-500',
  '#3b82f6': 'bg-blue-500',
}

function getColClass(color) {
  return COL_COLORS[color] || 'bg-indigo-500'
}

export function KanbanColumn({ column, allColumns, onCardCreated, onCardUpdated, onCardDeleted, onCardMoved, onDeleteColumn }) {
  const [addingCard, setAddingCard] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const handleAddCard = async (e) => {
    e.preventDefault()
    if (!newCardTitle.trim()) return
    setSaving(true)
    try {
      const card = await api.createCard({ column_id: column.id, title: newCardTitle.trim() })
      onCardCreated(card)
      setNewCardTitle('')
      setAddingCard(false)
    } catch (err) {
      alert('Failed to create card: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => setDragOver(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const cardId = e.dataTransfer.getData('cardId')
    const fromColId = e.dataTransfer.getData('fromColId')
    if (cardId && fromColId !== column.id) {
      onCardMoved(cardId, fromColId, column.id)
    }
  }

  return (
    <div
      className={`flex-shrink-0 w-72 flex flex-col rounded-xl transition-all duration-150
        ${dragOver ? 'ring-2 ring-indigo-400 bg-indigo-900/20' : 'bg-slate-900/50'}
        border border-slate-700/60`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/60">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getColClass(column.color)}`} />
          <h2 className="font-semibold text-slate-100 text-sm truncate">{column.name}</h2>
          <span className="text-xs text-slate-500 bg-slate-800 rounded-full px-1.5 py-0.5 ml-1 flex-shrink-0">
            {column.cards?.length ?? 0}
          </span>
        </div>
        <button
          onClick={onDeleteColumn}
          className="text-slate-600 hover:text-red-400 transition-colors p-1 rounded hover:bg-slate-800 flex-shrink-0"
          title="Delete column"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Cards */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto max-h-[calc(100vh-220px)]">
        {column.cards?.map(card => (
          <KanbanCard
            key={card.id}
            card={card}
            columnId={column.id}
            allColumns={allColumns}
            onUpdated={onCardUpdated}
            onDeleted={(id) => onCardDeleted(id)}
            onMoved={onCardMoved}
          />
        ))}

        {column.cards?.length === 0 && !addingCard && (
          <div className="text-center py-6 text-slate-600 text-xs">
            Drop cards here or add one below
          </div>
        )}

        {/* Add Card Form */}
        {addingCard && (
          <form onSubmit={handleAddCard} className="space-y-2">
            <textarea
              autoFocus
              rows={2}
              placeholder="Card title…"
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddCard(e) }
                if (e.key === 'Escape') { setAddingCard(false); setNewCardTitle('') }
              }}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving || !newCardTitle.trim()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs py-1.5 rounded-lg font-medium transition-colors"
              >
                {saving ? 'Adding…' : 'Add card'}
              </button>
              <button
                type="button"
                onClick={() => { setAddingCard(false); setNewCardTitle('') }}
                className="px-3 py-1.5 text-slate-400 hover:text-slate-200 text-xs rounded-lg hover:bg-slate-700 transition-colors"
              >
                ✕
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Add Card Button */}
      {!addingCard && (
        <div className="p-3 pt-0">
          <button
            onClick={() => setAddingCard(true)}
            className="w-full flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-500 hover:text-slate-300 text-xs hover:bg-slate-800 transition-colors"
          >
            <span className="text-base leading-none">+</span>
            <span>Add a card</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default KanbanColumn
