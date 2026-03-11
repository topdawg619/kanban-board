-- Migration 001: Create initial tables for Kanban Board
-- Created: 2026-03-10

PRAGMA foreign_keys = ON;

-- Boards table
CREATE TABLE IF NOT EXISTS boards (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    created_at  DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Columns table (renamed to avoid SQLite reserved word conflict)
CREATE TABLE IF NOT EXISTS columns (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    board_id    INTEGER NOT NULL,
    name        TEXT    NOT NULL,
    position    INTEGER NOT NULL DEFAULT 0,
    created_at  DATETIME NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

-- Cards table
CREATE TABLE IF NOT EXISTS cards (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    column_id   INTEGER NOT NULL,
    title       TEXT    NOT NULL,
    description TEXT,
    priority    TEXT    NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assignee    TEXT,
    label       TEXT,
    position    INTEGER NOT NULL DEFAULT 0,
    created_at  DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at  DATETIME NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE
);

-- Trigger: auto-update updated_at on cards
CREATE TRIGGER IF NOT EXISTS cards_updated_at
AFTER UPDATE ON cards
FOR EACH ROW
BEGIN
    UPDATE cards SET updated_at = datetime('now') WHERE id = OLD.id;
END;

-- Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_columns_board_id   ON columns(board_id);
CREATE INDEX IF NOT EXISTS idx_columns_position   ON columns(board_id, position);
CREATE INDEX IF NOT EXISTS idx_cards_column_id    ON cards(column_id);
CREATE INDEX IF NOT EXISTS idx_cards_position     ON cards(column_id, position);
CREATE INDEX IF NOT EXISTS idx_cards_priority     ON cards(priority);
CREATE INDEX IF NOT EXISTS idx_cards_assignee     ON cards(assignee);
