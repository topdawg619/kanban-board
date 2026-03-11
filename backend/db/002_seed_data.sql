-- Migration 002: Seed sample data for Kanban Board
-- Created: 2026-03-10

PRAGMA foreign_keys = ON;

-- Insert default board
INSERT INTO boards (name, created_at) VALUES
    ('My Kanban Board', datetime('now'));

-- Insert columns (To Do, In Progress, Done)
INSERT INTO columns (board_id, name, position, created_at) VALUES
    (1, 'To Do',       0, datetime('now')),
    (1, 'In Progress', 1, datetime('now')),
    (1, 'Done',        2, datetime('now'));

-- Insert sample cards
-- To Do column (column_id = 1)
INSERT INTO cards (column_id, title, description, priority, assignee, label, position) VALUES
    (1, 'Set up project repository',
        'Initialize Git repo, add README, configure CI/CD pipeline.',
        'high', 'Chris', 'DevOps', 0),

    (1, 'Design database schema',
        'Define all tables, relationships, indexes, and constraints for the Kanban board.',
        'high', 'DataClaw', 'Database', 1),

    (1, 'Write API documentation',
        'Document all REST endpoints using OpenAPI/Swagger spec.',
        'medium', 'Chris', 'Docs', 2);

-- In Progress column (column_id = 2)
INSERT INTO cards (column_id, title, description, priority, assignee, label, position) VALUES
    (2, 'Build React Kanban UI',
        'Implement drag-and-drop Kanban board with column and card components.',
        'urgent', 'Samantha', 'Frontend', 0),

    (2, 'Develop REST API backend',
        'Create Express.js endpoints for boards, columns, and cards CRUD operations.',
        'high', 'Coding Expert', 'Backend', 1);

-- Done column (column_id = 3)
INSERT INTO cards (column_id, title, description, priority, assignee, label, position) VALUES
    (3, 'Project kickoff meeting',
        'Align team on scope, tech stack, and delivery timeline.',
        'medium', 'Chris', 'Planning', 0),

    (3, 'Tech stack decision',
        'Decided on React + Express + SQLite for the initial MVP build.',
        'low', 'Chris', 'Planning', 1);
