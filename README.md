# 📋 KanbanFlow

A full-stack Kanban board with real-time collaboration, drag-and-drop, and priority management.

## Stack

| Layer     | Tech                          |
|-----------|-------------------------------|
| Frontend  | React 19, Vite, Tailwind CSS v4 |
| Backend   | Express 5, Socket.io, SQLite  |
| Real-time | Socket.io (WebSockets)        |
| DB        | SQLite via better-sqlite3     |

## Quick Start

### Prerequisites
- Node.js 18+
- npm 9+

### Install & Run (single command)

```bash
# Install all dependencies
npm run install:all

# Start both frontend and backend
npm run dev
```

- 🌐 **Frontend:** http://localhost:3000
- 🔌 **Backend API:** http://localhost:3001
- ❤️ **Health check:** http://localhost:3001/health

### Or run separately

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

## Docker (optional)

```bash
docker compose up --build
```

## API Endpoints

### Boards
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/boards` | List all boards |
| POST | `/api/boards` | Create a board |
| GET | `/api/boards/:id/columns` | Get board with columns + cards |

### Columns
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/columns` | Create a column |
| PUT | `/api/columns/:id` | Update column |
| DELETE | `/api/columns/:id` | Delete column |
| PATCH | `/api/columns/reorder` | Reorder columns |

### Cards
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/cards` | Create a card |
| GET | `/api/cards/:id` | Get a card |
| PUT | `/api/cards/:id` | Update card |
| DELETE | `/api/cards/:id` | Delete card |
| PATCH | `/api/cards/:id/move` | Move card to column |
| PATCH | `/api/cards/reorder` | Reorder cards in column |

## Socket.io Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `join:board` | Client → Server | `boardId` |
| `card:created` | Server → Client | Card object |
| `card:updated` | Server → Client | Card object |
| `card:deleted` | Server → Client | `{ id, column_id }` |
| `card:moved` | Server → Client | Card object |
| `column:created` | Server → Client | Column object |
| `column:deleted` | Server → Client | `{ id, board_id }` |

## Features

- ✅ Create, edit, and delete boards, columns, and cards
- ✅ Drag cards between columns (HTML5 drag and drop)
- ✅ Priority levels: Urgent, High, Medium, Low
- ✅ Real-time sync via Socket.io
- ✅ SQLite persistence (no external DB needed)
- ✅ Seeded with a default board on first run
- ✅ Docker Compose for containerized deployment

## Project Structure

```
kanban-board/
├── package.json          # Root — runs both with concurrently
├── README.md
├── docker-compose.yml
├── backend/
│   ├── package.json
│   └── src/
│       ├── index.js      # Express + Socket.io server
│       ├── database.js   # SQLite setup + seeding
│       └── routes/
│           ├── boards.js
│           ├── columns.js
│           └── cards.js
└── frontend/
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── components/
        │   ├── Header.jsx
        │   ├── KanbanBoard.jsx
        │   ├── KanbanColumn.jsx
        │   └── KanbanCard.jsx
        └── lib/
            ├── api.js
            └── socket.js
```

## License

MIT — built by [@topdawg619](https://github.com/topdawg619)
