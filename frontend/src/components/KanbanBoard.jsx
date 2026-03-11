import { useState, useEffect, useCallback, useRef } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { Column } from './Column'
import { Card } from './Card'
import { AddCardModal } from './AddCardModal'
import { Header } from './Header'
import { api } from '../lib/api'
import { socket } from '../lib/socket'

export function KanbanBoard() {
  const [board, setBoard] = useState(null)
  const [columns, setColumns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [connected, setConnected] = useState(false)

  // Modal state
  const [modal, setModal] = useState({ open: false, column: null, card: null })

  // DnD overlay
  const [activeCard, setActiveCard] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  // ─── Load board ────────────────────────────────────────────────────────────
  const loadBoard = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const boards = await api.getBoards()
      if (!boards?.length) throw new Error('No boards found')
      const boardId = boards[0].id
      setBoard(boards[0])
      const cols = await api.getBoardColumns(boardId)
      setColumns(cols)
    } catch (err) {
      setError(err.message || 'Failed to load board')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadBoard() }, [loadBoard])

  // ─── Socket.io ─────────────────────────────────────────────────────────────
  useEffect(() => {
    function onConnect() { setConnected(true) }
    function onDisconnect() { setConnected(false) }

    // Card events
    function onCardCreated(card) {
      const labels = Array.isArray(card.labels) ? card.labels : JSON.parse(card.labels || '[]')
      setColumns(cols =>
        cols.map(col =>
          col.id === card.column_id
            ? { ...col, cards: [...col.cards, { ...card, labels }] }
            : col
        )
      )
    }

    function onCardUpdated(card) {
      const labels = Array.isArray(card.labels) ? card.labels : JSON.parse(card.labels || '[]')
      setColumns(cols =>
        cols.map(col => ({
          ...col,
          cards: col.cards.map(c => c.id === card.id ? { ...card, labels } : c),
        }))
      )
    }

    function onCardDeleted({ id }) {
      setColumns(cols =>
        cols.map(col => ({ ...col, cards: col.cards.filter(c => c.id !== id) }))
      )
    }

    function onCardMoved({ cardId, fromColumnId, toColumnId, newPosition }) {
      setColumns(cols => {
        // Find the card
        let card = null
        const withoutCard = cols.map(col => {
          const idx = col.cards.findIndex(c => c.id === cardId)
          if (idx !== -1) {
            card = { ...col.cards[idx], column_id: toColumnId }
            return { ...col, cards: col.cards.filter(c => c.id !== cardId) }
          }
          return col
        })
        if (!card) return cols
        return withoutCard.map(col => {
          if (col.id !== toColumnId) return col
          const newCards = [...col.cards]
          newCards.splice(newPosition, 0, card)
          return { ...col, cards: newCards }
        })
      })
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('card:created', onCardCreated)
    socket.on('card:updated', onCardUpdated)
    socket.on('card:deleted', onCardDeleted)
    socket.on('card:moved', onCardMoved)

    if (socket.connected) setConnected(true)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('card:created', onCardCreated)
      socket.off('card:updated', onCardUpdated)
      socket.off('card:deleted', onCardDeleted)
      socket.off('card:moved', onCardMoved)
    }
  }, [])

  // ─── DnD handlers ──────────────────────────────────────────────────────────
  function findColumn(cardId) {
    return columns.find(col => col.cards.some(c => c.id === cardId))
  }

  function handleDragStart({ active }) {
    const card = columns.flatMap(c => c.cards).find(c => c.id === active.id)
    setActiveCard(card || null)
  }

  function handleDragOver({ active, over }) {
    if (!over) return
    const activeColId = findColumn(active.id)?.id
    let overColId = over.data?.current?.type === 'column'
      ? over.id
      : findColumn(over.id)?.id

    if (!activeColId || !overColId || activeColId === overColId) return

    setColumns(cols => {
      const fromCol = cols.find(c => c.id === activeColId)
      const toCol = cols.find(c => c.id === overColId)
      if (!fromCol || !toCol) return cols

      const card = fromCol.cards.find(c => c.id === active.id)
      const overIndex = toCol.cards.findIndex(c => c.id === over.id)
      const insertAt = overIndex >= 0 ? overIndex : toCol.cards.length

      return cols.map(col => {
        if (col.id === activeColId) return { ...col, cards: col.cards.filter(c => c.id !== active.id) }
        if (col.id === overColId) {
          const newCards = [...col.cards]
          newCards.splice(insertAt, 0, { ...card, column_id: overColId })
          return { ...col, cards: newCards }
        }
        return col
      })
    })
  }

  async function handleDragEnd({ active, over }) {
    setActiveCard(null)
    if (!over) return

    const fromCol = findColumn(active.id)
    let toColId = over.data?.current?.type === 'column' ? over.id : findColumn(over.id)?.id
    const toCol = columns.find(c => c.id === toColId)
    if (!fromCol || !toCol) return

    const newPosition = toCol.cards.findIndex(c => c.id === active.id)

    // Optimistic update for same-column reorder
    if (fromCol.id === toCol.id) {
      const oldIndex = fromCol.cards.findIndex(c => c.id === active.id)
      const overIndex = fromCol.cards.findIndex(c => c.id === over.id)
      if (oldIndex !== -1 && overIndex !== -1 && oldIndex !== overIndex) {
        setColumns(cols => cols.map(col =>
          col.id === fromCol.id
            ? { ...col, cards: arrayMove(col.cards, oldIndex, overIndex) }
            : col
        ))
      }
    }

    // Persist to backend
    try {
      await api.moveCard(active.id, {
        column_id: toColId,
        position: Math.max(0, newPosition),
      })
    } catch (err) {
      console.error('Failed to move card:', err)
      loadBoard() // Re-sync on failure
    }
  }

  // ─── Card CRUD ─────────────────────────────────────────────────────────────
  async function handleSaveCard(data) {
    const { column_id, ...rest } = data
    const isEdit = !!modal.card

    try {
      if (isEdit) {
        await api.updateCard(modal.card.id, { ...rest, column_id })
      } else {
        await api.createCard({ ...rest, column_id })
      }
      setModal({ open: false, column: null, card: null })
    } catch (err) {
      throw err
    }
  }

  async function handleDeleteCard(card) {
    if (!confirm(`Delete "${card.title}"?`)) return
    try {
      await api.deleteCard(card.id)
    } catch (err) {
      console.error('Failed to delete card:', err)
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading board…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-slate-100 font-semibold text-lg mb-2">Couldn't Load Board</h2>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <button
            onClick={loadBoard}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <Header board={board} connected={connected} />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Board area */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-5 p-6 overflow-x-auto flex-1 items-start">
            {columns.map(col => (
              <Column
                key={col.id}
                column={col}
                onAddCard={(col) => setModal({ open: true, column: col, card: null })}
                onEditCard={(card) => {
                  const col = columns.find(c => c.id === card.column_id)
                  setModal({ open: true, column: col, card })
                }}
                onDeleteCard={handleDeleteCard}
              />
            ))}

            {/* Add column placeholder (future) */}
            <div className="w-72 flex-shrink-0">
              <div className="flex flex-col items-center justify-center h-28 rounded-xl border-2 border-dashed border-slate-700 text-slate-600 hover:text-slate-500 hover:border-slate-600 cursor-pointer transition-colors group">
                <svg className="w-6 h-6 mb-1 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs font-medium">Add column</span>
              </div>
            </div>
          </div>

          {/* Drag overlay */}
          <DragOverlay>
            {activeCard && (
              <div className="rotate-2 scale-105 opacity-90 shadow-2xl shadow-black/50">
                <Card card={activeCard} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </main>

      {/* Add/Edit card modal */}
      <AddCardModal
        isOpen={modal.open}
        column={modal.column}
        card={modal.card}
        columns={columns}
        onSave={handleSaveCard}
        onClose={() => setModal({ open: false, column: null, card: null })}
      />
    </div>
  )
}

export default KanbanBoard
