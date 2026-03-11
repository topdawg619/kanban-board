# Kanban Board — Backend API

Node.js + Express + SQLite + Socket.io backend for the Kanban Board project.

## Quick Start

```bash
cd backend
npm install
npm start
```

Server runs on **http://localhost:3001**

---

## API Endpoints

### Boards
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/boards` | List all boards |
| GET | `/api/boards/:id` | Get a single board |
| POST | `/api/boards` | Create a board `{ name, description? }` |
| GET | `/api/boards/:id/columns` | Get all columns + cards for a board |

### Columns
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/columns` | Create a column `{ board_id, name, color? }` |
| PUT | `/api/columns/:id` | Update a column `{ name?, color?, position? }` |
| DELETE | `/api/columns/:id` | Delete a column (cascades cards) |

### Cards
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cards` | List all cards (optional `?column_id=`) |
| GET | `/api/cards/:id` | Get a single card |
| POST | `/api/cards` | Create a card `{ column_id, title, description?, priority?, labels?, due_date?, assignee? }` |
| PUT | `/api/cards/:id` | Update or move a card |
| DELETE | `/api/cards/:id` | Delete a card |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api` | Full endpoint reference |

---

## Socket.io Events

Connect to `http://localhost:3001`

### Server → Client (emitted)
| Event | Payload |
|-------|---------|
| `card:created` | `{ card, column_id }` |
| `card:updated` | `card` |
| `card:moved` | `{ card, from_column_id, to_column_id }` |
| `card:deleted` | `{ id, column_id }` |
| `column:created` | `column` |
| `column:updated` | `column` |
| `column:deleted` | `{ id, board_id }` |
| `board:created` | `board` |

### Client → Server
| Event | Payload |
|-------|---------|
| `join:board` | `boardId` |
| `leave:board` | `boardId` |

---

## Card Schema

```json
{
  "id": "uuid",
  "column_id": "uuid",
  "title": "string",
  "description": "string",
  "priority": "low | medium | high | urgent",
  "position": 0,
  "due_date": "2024-12-31 | null",
  "labels": ["string"],
  "assignee": "string | null",
  "created_at": "ISO datetime",
  "updated_at": "ISO datetime"
}
```

---

## Tech Stack
- **Runtime:** Node.js v22
- **Framework:** Express 4
- **Database:** SQLite via `better-sqlite3`
- **Real-time:** Socket.io 4
- **IDs:** UUID v4
