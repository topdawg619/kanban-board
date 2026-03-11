const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'kanban.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS boards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS columns (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL,
    name TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    color TEXT DEFAULT '#6366f1',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    column_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
    position INTEGER NOT NULL DEFAULT 0,
    due_date TEXT DEFAULT NULL,
    labels TEXT DEFAULT '[]',
    assignee TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE
  );
`);

// Seed default board if empty
const boardCount = db.prepare('SELECT COUNT(*) as count FROM boards').get();
if (boardCount.count === 0) {
  const { v4: uuidv4 } = require('uuid');

  const boardId = uuidv4();
  db.prepare(`INSERT INTO boards (id, name, description) VALUES (?, ?, ?)`).run(
    boardId, 'My Kanban Board', 'Default board — get things done!'
  );

  const columns = [
    { name: 'Backlog',     color: '#64748b', position: 0 },
    { name: 'To Do',       color: '#6366f1', position: 1 },
    { name: 'In Progress', color: '#f59e0b', position: 2 },
    { name: 'In Review',   color: '#8b5cf6', position: 3 },
    { name: 'Done',        color: '#10b981', position: 4 },
  ];

  const colIds = columns.map(() => uuidv4());

  columns.forEach((col, i) => {
    db.prepare(`INSERT INTO columns (id, board_id, name, color, position) VALUES (?, ?, ?, ?, ?)`).run(
      colIds[i], boardId, col.name, col.color, col.position
    );
  });

  // Seed a few sample cards
  const sampleCards = [
    { colIndex: 1, title: 'Set up project structure',  desc: 'Initialize repo, install dependencies',     priority: 'high'   },
    { colIndex: 1, title: 'Design database schema',    desc: 'Define tables for boards, columns, cards',  priority: 'high'   },
    { colIndex: 2, title: 'Build REST API',            desc: 'Express routes for all CRUD operations',    priority: 'urgent' },
    { colIndex: 2, title: 'Add Socket.io events',      desc: 'Real-time updates for card moves/creates',  priority: 'medium' },
    { colIndex: 3, title: 'Code review: auth module',  desc: 'Review PR #12 before merge',                priority: 'medium' },
    { colIndex: 4, title: 'Deploy to staging',         desc: 'Deployed successfully on port 3001',        priority: 'low'    },
  ];

  sampleCards.forEach((c, i) => {
    db.prepare(`INSERT INTO cards (id, column_id, title, description, priority, position) VALUES (?, ?, ?, ?, ?, ?)`).run(
      uuidv4(), colIds[c.colIndex], c.title, c.desc, c.priority, i
    );
  });

  console.log('✅ Database seeded with default board, columns, and sample cards');
}

module.exports = db;
