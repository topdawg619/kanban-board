# Kanban Board — Database Layer

SQLite database schema, migrations, and seed data for the Kanban Board backend.

---

## Schema Overview

### `boards`
| Column      | Type     | Notes                    |
|-------------|----------|--------------------------|
| id          | INTEGER  | Primary key, autoincrement |
| name        | TEXT     | Board name               |
| created_at  | DATETIME | Auto-set on insert        |

### `columns`
| Column      | Type     | Notes                           |
|-------------|----------|---------------------------------|
| id          | INTEGER  | Primary key, autoincrement      |
| board_id    | INTEGER  | FK → boards.id (CASCADE DELETE) |
| name        | TEXT     | Column name                     |
| position    | INTEGER  | Display order (0-indexed)       |
| created_at  | DATETIME | Auto-set on insert              |

### `cards`
| Column      | Type     | Notes                             |
|-------------|----------|-----------------------------------|
| id          | INTEGER  | Primary key, autoincrement        |
| column_id   | INTEGER  | FK → columns.id (CASCADE DELETE)  |
| title       | TEXT     | Card title                        |
| description | TEXT     | Optional detail                   |
| priority    | TEXT     | `low` / `medium` / `high` / `urgent` |
| assignee    | TEXT     | Person assigned                   |
| label       | TEXT     | Tag / category label              |
| position    | INTEGER  | Display order within column       |
| created_at  | DATETIME | Auto-set on insert                |
| updated_at  | DATETIME | Auto-updated via trigger          |

---

## Migration Files

| File | Description |
|------|-------------|
| `001_create_tables.sql` | Creates all tables, indexes, and the `updated_at` trigger |
| `002_seed_data.sql`     | Seeds 1 board, 3 columns, 7 sample cards |
| `migrate.js`            | Node.js migration runner                |

---

## Usage

### Install dependency
```bash
npm install better-sqlite3
```

### Run migrations only
```bash
node backend/db/migrate.js
```

### Run migrations + seed data
```bash
node backend/db/migrate.js --seed
```

### Full reset (dev only — drops DB!)
```bash
node backend/db/migrate.js --reset --seed
```

---

## Seeded Data

**Board:** My Kanban Board

| Column      | Cards |
|-------------|-------|
| To Do       | Set up project repository, Design database schema, Write API documentation |
| In Progress | Build React Kanban UI, Develop REST API backend |
| Done        | Project kickoff meeting, Tech stack decision |
