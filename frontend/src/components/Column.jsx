import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Card } from './Card'

export function Column({ column, onAddCard, onEditCard, onDeleteCard }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'column', column },
  })

  const cards = column.cards || []
  const cardIds = cards.map(c => c.id)

  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2 min-w-0">
          {/* Color accent dot */}
          <div
            className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
            style={{ backgroundColor: column.color || '#6366f1' }}
          />
          <h2 className="font-semibold text-slate-200 text-sm truncate">{column.name}</h2>
          <span className="ml-0.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-slate-700 text-slate-400 text-[10px] font-semibold">
            {cards.length}
          </span>
        </div>

        {/* Add card button */}
        <button
          onClick={() => onAddCard?.(column)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-colors flex-shrink-0"
          title={`Add card to ${column.name}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Top accent line */}
      <div
        className="h-0.5 rounded-full mb-3 opacity-60"
        style={{ backgroundColor: column.color || '#6366f1' }}
      />

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 flex flex-col gap-2.5 p-2 rounded-xl min-h-[120px]
          transition-all duration-150 border border-transparent
          ${isOver
            ? 'bg-indigo-950/40 border-indigo-500/40 shadow-inner'
            : 'bg-slate-800/30'
          }
        `}
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <Card
              key={card.id}
              card={card}
              onEdit={onEditCard}
              onDelete={onDeleteCard}
            />
          ))}
        </SortableContext>

        {/* Empty state */}
        {cards.length === 0 && (
          <div
            className="flex-1 flex flex-col items-center justify-center text-center py-8 text-slate-600 cursor-pointer hover:text-slate-500 transition-colors"
            onClick={() => onAddCard?.(column)}
          >
            <svg className="w-8 h-8 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-xs font-medium">No cards yet</p>
            <p className="text-[11px] mt-0.5 opacity-70">Drop here or click + to add</p>
          </div>
        )}

        {/* Add card link at bottom */}
        {cards.length > 0 && (
          <button
            onClick={() => onAddCard?.(column)}
            className="w-full flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-colors text-xs font-medium group"
          >
            <svg className="w-3.5 h-3.5 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add a card
          </button>
        )}
      </div>
    </div>
  )
}

export default Column
