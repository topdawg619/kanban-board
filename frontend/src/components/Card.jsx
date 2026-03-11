import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const PRIORITY = {
  urgent: { label: 'Urgent', cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
  high:   { label: 'High',   cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  medium: { label: 'Medium', cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  low:    { label: 'Low',    cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
}

const PRIORITY_DOT = {
  urgent: 'bg-red-500',
  high:   'bg-orange-500',
  medium: 'bg-yellow-500',
  low:    'bg-blue-500',
}

const LABEL_COLORS = [
  'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  'bg-violet-500/20 text-violet-300 border-violet-500/30',
]

function hashLabel(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return Math.abs(h) % LABEL_COLORS.length
}

function formatDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  const now = new Date()
  const diff = d - now
  const isOverdue = diff < 0
  const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return { label, isOverdue }
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export function Card({ card, onEdit, onDelete, isDragging: forceDragging }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: { type: 'card', card },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const priority = PRIORITY[card.priority] || PRIORITY.medium
  const labels = Array.isArray(card.labels) ? card.labels : []
  const date = formatDate(card.due_date)

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`
        group relative bg-slate-800 rounded-xl border border-slate-700/60
        shadow-sm hover:shadow-md hover:border-slate-600/80
        transition-all duration-150 cursor-grab active:cursor-grabbing
        ${isDragging ? 'opacity-40 scale-95 shadow-xl ring-2 ring-indigo-500/50' : ''}
      `}
    >
      {/* Priority left-border accent */}
      <div className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full ${PRIORITY_DOT[card.priority] || PRIORITY_DOT.medium}`} />

      <div className="pl-4 pr-3 py-3" {...listeners}>
        {/* Labels */}
        {labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {labels.map((lbl, i) => (
              <span
                key={i}
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${LABEL_COLORS[hashLabel(lbl)]}`}
              >
                {lbl}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <p className="text-sm font-medium text-slate-100 leading-snug mb-2 break-words">
          {card.title}
        </p>

        {/* Description preview */}
        {card.description && (
          <p className="text-xs text-slate-400 leading-relaxed mb-2 line-clamp-2">
            {card.description}
          </p>
        )}

        {/* Footer row */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5">
            {/* Priority badge */}
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${priority.cls}`}>
              {priority.label}
            </span>

            {/* Due date */}
            {date && (
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${date.isOverdue
                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                : 'bg-slate-700 text-slate-400 border-slate-600'
              }`}>
                📅 {date.label}
              </span>
            )}
          </div>

          {/* Assignee avatar */}
          {card.assignee && (
            <div
              className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
              title={card.assignee}
            >
              {getInitials(card.assignee)}
            </div>
          )}
        </div>
      </div>

      {/* Hover action buttons */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onEdit?.(card) }}
          className="w-6 h-6 rounded-md bg-slate-700 hover:bg-indigo-600 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          title="Edit card"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onDelete?.(card) }}
          className="w-6 h-6 rounded-md bg-slate-700 hover:bg-red-600 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          title="Delete card"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default Card
